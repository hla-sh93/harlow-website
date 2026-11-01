"""Stage 8: a WordPress shaped like the live site, for the installer to fill in place.

On an empty site (`env.sh rebuild --yes --empty`) this lays down what live has, as far as
the repository knows it, and nothing of what the theme's installer adds:

* the 22 pages under live's ids and addresses, published, with content of their own
  (Elementor's markup of each page, from the captured server HTML), Elementor's edit mode
  and Elementor's template (canvas for the front page), live's dates and Rank Math fields;
  the front page and the privacy page set as on live;
* live's items (posts, news, projects, gallery items, the job, business models, people)
  under live's ids and addresses, with their texts (written with this site's address, as a
  staging copy of live is), dates, categories and featured pictures, and no field or name
  of the theme's; the theme's own types (testimonials,
  client logos) are not there;
* live's pictures under live's ids; live's two forms under live's ids, without the
  theme's Turnstile slot; an Elementor template on id 5532 (live's major clients);
* live's menus by name, outside the theme's locations (live's header and footer are
  Elementor's); Rank Math's settings as live's.

    python -u _tools/live_shape.py
"""

import html as htmllib
import json
import sys

import html5lib
from lxml import etree

from common import CAPTURE, ROOT
from wpsite import wp_cli

PHP = r"""
$d = json_decode( file_get_contents( '/env/live-shape.json' ), true );
kses_remove_filters();
add_filter( 'wp_revisions_to_keep', '__return_zero', 99 );
$r = array_fill_keys( array( 'media_made', 'media_found', 'files', 'items_made' ), 0 );
foreach ( harlow_site_data( 'media.json' )['media'] as $picture ) {
	harlow_install_picture( $picture, $r );
}
$ids = array();
foreach ( $d['pages'] as $p ) {
	$fields = array(
		'post_type'    => 'page',
		'post_status'  => 'publish',
		'post_author'  => 1,
		'post_title'   => $p['title'],
		'post_name'    => $p['slug'],
		'post_content' => $p['content'],
		'post_excerpt' => '',
	);
	if ( get_post( $p['id'] ) ) {
		$id = wp_update_post( wp_slash( array( 'ID' => $p['id'] ) + $fields ) );
	} else {
		$id = wp_insert_post( wp_slash( array( 'import_id' => $p['id'] ) + $fields ) );
	}
	update_post_meta( $id, '_elementor_edit_mode', 'builder' );
	update_post_meta( $id, '_elementor_data', '[]' );
	update_post_meta( $id, '_wp_page_template', $p['template'] );
	foreach ( $p['meta'] as $key => $value ) {
		update_post_meta( $id, $key, wp_slash( $value ) );
	}
	$ids[ $p['path'] ] = $id;
	$GLOBALS['wpdb']->update( $GLOBALS['wpdb']->posts, $p['dates'], array( 'ID' => $id ) );
	clean_post_cache( $id );
}
update_option( 'show_on_front', 'page' );
update_option( 'page_on_front', $ids['/'] );
update_option( 'wp_page_for_privacy_policy', $ids[ $d['privacy'] ] );
foreach ( $d['categories'] as $c ) {
	if ( ! get_term_by( 'slug', $c['slug'], 'category' ) ) {
		wp_insert_term( $c['name'], 'category', array( 'slug' => $c['slug'] ) );
	}
}
$items = 0;
foreach ( $d['items'] as $it ) {
	// A copy of live answers at its own address, as a staging copy does: its texts' links
	// and pictures are written with it, and the pictures they show are in its uploads.
	$it['content'] = harlow_local_content( $it['content'], $d['site'] );
	harlow_install_content_files( $it['content'] );
	$id = wp_insert_post( wp_slash( array(
		'import_id'     => $it['id'],
		'post_type'     => $it['type'],
		'post_status'   => 'publish',
		'post_author'   => 1,
		'post_title'    => $it['title'],
		'post_name'     => $it['slug'],
		'post_content'  => $it['content'],
		'post_date'     => $it['date'],
		'post_date_gmt' => $it['date_gmt'],
		'menu_order'    => $it['menu_order'],
	) ), true );
	if ( is_wp_error( $id ) ) { continue; }
	if ( $it['categories'] ) {
		wp_set_post_categories( $id, array_map( function ( $s ) { return get_term_by( 'slug', $s, 'category' )->term_id; }, $it['categories'] ) );
	}
	if ( $it['featured'] && 'attachment' === get_post_type( $it['featured'] ) ) {
		set_post_thumbnail( $id, $it['featured'] );
	}
	foreach ( $it['meta'] as $key => $value ) {
		update_post_meta( $id, $key, wp_slash( $value ) );
	}
	++$items;
}
$forms = 0;
foreach ( $d['forms'] as $f ) {
	$id = wp_insert_post( array( 'import_id' => $f['id'], 'post_type' => 'wpcf7_contact_form', 'post_status' => 'publish', 'post_title' => $f['title'] ), true );
	if ( is_wp_error( $id ) ) { continue; }
	update_post_meta( $id, '_locale', 'en_US' );
	$form = wpcf7_contact_form( $id );
	$form->set_properties( array(
		'form' => $f['template'],
		'mail' => array_merge( WPCF7_ContactFormTemplate::get_default( 'mail' ), $f['mail'], array( 'active' => true, 'use_html' => false, 'exclude_blank' => false ) ),
		'mail_2' => WPCF7_ContactFormTemplate::get_default( 'mail_2' ),
		'messages' => WPCF7_ContactFormTemplate::get_default( 'messages' ),
	) );
	$form->save();
	++$forms;
}
wp_insert_post( array( 'import_id' => 5532, 'post_type' => 'elementor_library', 'post_status' => 'publish', 'post_title' => 'Major clients' ) );
foreach ( $d['menus'] as $menu ) {
	harlow_install_menu_items( (int) wp_create_nav_menu( $menu['name'] ), $menu['items'], 0, $ids, $r );
}
$d['rank_math']['local_seo_about_page']   = $ids[ $d['about'] ];
$d['rank_math']['local_seo_contact_page'] = $ids[ $d['contact'] ];
update_option( 'rank-math-options-titles', array_merge( (array) get_option( 'rank-math-options-titles', array() ), $d['rank_math'] ) );
RankMath\Helper::update_modules( array( 'local-seo' => 'on' ) );
echo wp_json_encode( array( 'pages' => count( $ids ), 'items' => $items, 'pictures' => $r['media_made'], 'forms' => $forms, 'menus' => count( $d['menus'] ), 'menu_items' => $r['items_made'] ) );
"""


def elementor_markup(name):
    """The page's Elementor document as live's server printed it: its content of its own."""
    doc = html5lib.parse((CAPTURE / "raw" / f"{name}.html").read_text(encoding="utf-8"), treebuilder="lxml",
                         namespaceHTMLElements=False)
    holder = doc.xpath("//body//*[@data-elementor-type='wp-page']")
    return etree.tostring(holder[0], method="html", encoding="unicode") if holder else "<p>Elementor</p>"


def rank_math_meta(entry, uploads):
    meta = {}
    if "title" in entry:
        meta["rank_math_title"] = entry["title"]
    if "description" in entry:
        meta["rank_math_description"] = entry["description"]
    if "focus" in entry:
        meta["rank_math_focus_keyword"] = entry["focus"]
    if "image" in entry:
        meta["rank_math_facebook_image"] = uploads + entry["image"]["file"]
        meta["rank_math_facebook_image_id"] = entry["image"]["id"]
    return meta


def main():
    site = json.loads((ROOT / "theme" / "install" / "site.json").read_text(encoding="utf-8"))
    items = json.loads((ROOT / "theme" / "install" / "items.json").read_text(encoding="utf-8"))
    forms = json.loads((ROOT / "theme" / "install" / "forms.json").read_text(encoding="utf-8"))["forms"]
    seo = json.loads((ROOT / "theme" / "install" / "seo.json").read_text(encoding="utf-8"))
    uploads = "http://localhost:8090/wp-content/uploads/"
    pages = []
    for p in site["pages"]:
        entry = seo["pages"].get(p["name"], {})
        dates = {}
        if "published" in entry:
            dates.update(post_date=entry["published"][0], post_date_gmt=entry["published"][1])
        if "modified" in entry:
            dates.update(post_modified=entry["modified"][0], post_modified_gmt=entry["modified"][1])
        pages.append({"id": int(p["live_id"]), "path": p["path"], "title": p["title"],
                      "slug": "home-page" if p["path"] == "/" else p["path"].strip("/"),
                      "content": elementor_markup(p["name"]),
                      "template": "elementor_canvas" if p["path"] == "/" else "elementor_header_footer",
                      "meta": rank_math_meta(entry, uploads), "dates": dates})
    live_items = []
    for it in items["items"]:
        if not it["live_id"]:
            continue   # the theme's own types: not on live
        live_items.append({"id": int(it["live_id"]), "type": it["type"], "title": htmllib.unescape(it["title"]),
                           "slug": it["slug"], "content": it["content"], "date": it["date"].replace("T", " "),
                           "date_gmt": it["date_gmt"].replace("T", " "), "menu_order": it.get("menu_order", 0),
                           "categories": [c["slug"] for c in it["categories"]], "featured": it["featured"] or 0,
                           "meta": rank_math_meta(seo["pages"].get(it["name"], {}), uploads)})
    s = seo["site"]
    rank_math = {"knowledgegraph_type": "company", "knowledgegraph_name": s["name"], "website_name": s["website_name"],
                 "local_business_type": "Organization", "knowledgegraph_logo": uploads + s["logo"]["file"],
                 "knowledgegraph_logo_id": s["logo"]["id"], "url": "http://localhost:8090", "email": s["email"],
                 "phone_numbers": s["phones"], "local_address": s["address"], "geo": s["geo"],
                 "social_url_facebook": s["facebook"], "social_additional_profiles": "\n".join(s["profiles"]),
                 "robots_global": s["robots"], "pt_page_default_rich_snippet": s["page_schema"]}
    path = {p["name"]: p["path"] for p in site["pages"]}
    data = {"site": items["site"], "pages": pages, "privacy": site["privacy_page"], "about": path[s["about_page"]], "contact": path[s["contact_page"]], "categories": items.get("categories", []),
            "items": live_items, "forms": forms, "menus": site["menus"], "rank_math": rank_math}
    (ROOT / "_env" / "live-shape.json").write_text(json.dumps(data), encoding="utf-8")
    (ROOT / "_env" / "live-shape.php").write_text("<?php\n" + PHP, encoding="utf-8", newline="\n")
    made = json.loads(wp_cli("eval-file", "/env/live-shape.php"))
    print(f"live-shaped: {made['pages']} pages with content of their own and Elementor's template, {made['items']} items "
          f"under live's ids, {made['pictures']} pictures, {made['forms']} forms, an Elementor template on #5532, "
          f"{made['menus']} menus ({made['menu_items']} items) outside the theme's locations, Rank Math's settings as live's")
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
