"""Stage 1 check: every setting of the header, footer, cookie bar, page transition and
brand colours reaches its place on the page, and taking the changes back leaves the pages
exactly as they were.

Through WP-CLI, as the Customizer would save them: every setting gets a value of its own
(pictures a picture imported for the test), a footer menu is renamed and two menu items
retitled. Each value is then looked for where it belongs on two pages (a page and the 404
page). Then everything is put back, the test picture deleted, and both pages must be byte
for byte what they were before.

    python -u _tools/verify_settings.py
"""

import base64
import json
import sys

from wpsite import PROBE_404, fetch, parse, wp_cli

PAGE = "/about-us/"
PICTURE = "/var/www/html/wp-content/themes/harlow/assets/uploads/2024/09/iva-icon.png"

TEXT = {
    "contact_heading": "Write to us",
    "copyright": "© 2031 Test Group.",
    "credit_text": "Built by",
    "credit_url": "https://example.com/credit/",
    "social_facebook": "https://example.com/facebook/",
    "social_instagram": "https://example.com/instagram/",
    "social_linkedin": "https://example.com/linkedin/",
    "social_x": "",
    "social_telegram": "https://example.com/telegram/",
    "language_label": "عربي",
    "language_home": "https://example.com/ar/",
    "cookie_message": "Cookies are used here.",
    "cookie_settings_text": "Choose which ones in",
    "cookie_settings_label": "the settings",
    "cookie_accept": "Fine",
    "cookie_overview": "What cookies do on this site.",
    "cookie_necessary": "The one cookie that has to stay.",
}
IMAGES = ["header_logo", "footer_logo", "footer_background", "credit_logo", "cookie_logo", "transition_image"]
BRAND = {"brand_primary": "#123456", "brand_dark": "#202020", "brand_accent": "#abcdef",
         "brand_light": "#eeeeee", "brand_text": "#111111"}
MENU_RENAME = ("footer-1", "Useful links")
ITEM_RETITLE = {"primary": "WHO WE ARE?", "footer-legal": "Site map (all pages)"}

SET = r"""
$d = json_decode( base64_decode( '%s' ), true );
$out = array( 'mods' => array(), 'menu' => null, 'items' => array() );
foreach ( $d['mods'] as $k => $v ) { $out['mods'][ $k ] = get_theme_mod( $k, null ); set_theme_mod( $k, $v ); }
$loc = get_nav_menu_locations();
$menu = wp_get_nav_menu_object( $loc[ $d['rename'][0] ] );
$out['menu'] = array( $menu->term_id, $menu->name );
wp_update_term( $menu->term_id, 'nav_menu', array( 'name' => $d['rename'][1] ) );
foreach ( $d['retitle'] as $where => $title ) {
	$items = wp_get_nav_menu_items( $loc[ $where ] );
	foreach ( $items as $item ) {
		if ( ( 'primary' === $where && 'WHO WE ARE' === $item->title ) || ( 'footer-legal' === $where && 'Site Map' === $item->title ) ) {
			$out['items'][] = array( $item->ID, $item->title );
			wp_update_post( array( 'ID' => $item->ID, 'post_title' => $title ) );
		}
	}
}
echo wp_json_encode( $out );
"""

UNSET = r"""
$d = json_decode( base64_decode( '%s' ), true );
foreach ( $d['mods'] as $k => $v ) { if ( null === $v ) { remove_theme_mod( $k ); } else { set_theme_mod( $k, $v ); } }
wp_update_term( $d['menu'][0], 'nav_menu', array( 'name' => $d['menu'][1] ) );
foreach ( $d['items'] as $item ) { wp_update_post( array( 'ID' => $item[0], 'post_title' => $item[1] ) ); }
wp_delete_attachment( (int) $d['picture'], true );
echo 'put back';
"""


def php(code, data):
    return wp_cli("eval", code % base64.b64encode(json.dumps(data).encode()).decode())


def first(doc, xp):
    found = doc.xpath(xp)
    if not found:
        return None
    x = found[0]
    return x if isinstance(x, str) else " ".join("".join(x.itertext()).split())


def main():
    before = {p: fetch(p) for p in (PAGE, PROBE_404)}
    picture = int(wp_cli("media", "import", PICTURE, "--porcelain"))
    upload = json.loads(wp_cli("post", "get", str(picture), "--field=guid", "--format=json"))
    mods = dict(TEXT, **BRAND, **{i: picture for i in IMAGES})
    saved = json.loads(php(SET, {"mods": mods, "rename": MENU_RENAME, "retitle": ITEM_RETITLE}))
    problems, checked = [], 0
    try:
        page, missing = parse(fetch(PAGE)[1]), parse(fetch(PROBE_404)[1])
        uploads = "/wp-content/uploads/"

        def expect(label, value, test):
            nonlocal checked
            checked += 1
            if not test(value):
                problems.append(f"{label}: found {str(value)[:120]!r}")

        expect("header_logo", first(page, "//*[@data-id='aa38cd6']//img/@src"), lambda v: v and uploads in v)
        expect("footer_logo", first(page, "//*[@data-id='2ea9679']//img/@src"), lambda v: v and uploads in v)
        expect("footer_background", first(page, "//div[@id='footer']/@style"), lambda v: v and uploads in v)
        expect("credit_logo", first(page, "//*[@data-id='079d600']//img/@src"), lambda v: v and uploads in v)
        expect("cookie_logo", first(page, "//div[contains(@class,'moove-gdpr-company-logo-holder')]/img/@src"),
               lambda v: v and uploads in v)
        expect("transition_image", first(page, "//e-page-transition/@preloader-image-url"), lambda v: v and uploads in v)
        expect("contact_heading", first(page, "//*[@data-id='c14f552']//h3"), lambda v: v == TEXT["contact_heading"])
        expect("copyright", first(page, "//*[@data-id='f7645f6']//h2"), lambda v: v == TEXT["copyright"])
        expect("credit_text", first(page, "//*[@data-id='269488d']//h2"), lambda v: v == TEXT["credit_text"])
        expect("credit_url", first(page, "//*[@data-id='079d600']//a/@href"), lambda v: v == TEXT["credit_url"])
        social = page.xpath("//*[@data-id='32fc50d']//a/@href")
        for key in ("social_facebook", "social_instagram", "social_linkedin", "social_telegram"):
            expect(key, social, lambda v, k=key: TEXT[k] in v)
        expect("social_x (emptied: its icon goes)", social, lambda v: len(v) == 4)
        expect("language_label (header)", first(page, "//header//li[contains(@class,'wpml-ls-menu-item')]//span"),
               lambda v: v == TEXT["language_label"])
        expect("language_label (under the footer)", first(page, "//div[contains(@class,'wpml-ls-statics-footer')]//span[@class='wpml-ls-native']"),
               lambda v: v == TEXT["language_label"])
        expect("language_home (on the 404 page)", first(missing, "//header//li[contains(@class,'wpml-ls-menu-item')]/a/@href"),
               lambda v: v == TEXT["language_home"])
        expect("language_home (a page with its own Arabic version keeps it)",
               first(page, "//header//li[contains(@class,'wpml-ls-menu-item')]/a/@href"), lambda v: v and "harlowgroup.com/ar/" in v)
        bar = "//aside[@id='moove_gdpr_cookie_info_bar']"
        expect("cookie_message", first(page, bar + "//p[1]"), lambda v: v == TEXT["cookie_message"])
        expect("cookie_settings_text", first(page, bar + "//p[2]"),
               lambda v: v == f"{TEXT['cookie_settings_text']} {TEXT['cookie_settings_label']}.")
        expect("cookie_settings_label", first(page, bar + "//button[contains(@class,'change-settings-button')]"),
               lambda v: v == TEXT["cookie_settings_label"])
        expect("cookie_accept", [first(page, bar + "//button[contains(@class,'allow-all')]"),
                                 first(page, bar + "//button[contains(@class,'allow-all')]/@aria-label")],
               lambda v: v == [TEXT["cookie_accept"]] * 2)
        expect("cookie_overview", first(page, "//*[@id='privacy_overview']//p"), lambda v: v == TEXT["cookie_overview"])
        expect("cookie_necessary", first(page, "//*[@id='strict-necessary-cookies']//p"), lambda v: v == TEXT["cookie_necessary"])
        brand = first(page, "//style[@id='harlow-design-brand-inline-css']") or ""
        for key, value in BRAND.items():
            expect(key, brand, lambda v, k=key, c=value: f"--hl-color-{k[6:]}: {c};" in v)
        expect("footer column heading = its menu's name", first(page, "//*[@data-id='bf1c55b']//h3"),
               lambda v: v == MENU_RENAME[1])
        expect("header menu item retitled (both copies of both widgets)",
               page.xpath("//header//li[contains(@class,'menu-item-1221')]/a/text()[1]"),
               lambda v: len(v) == 4 and all(t.strip() == ITEM_RETITLE["primary"] for t in v))
        expect("footer link retitled", first(page, "//*[@data-id='1992681']//li[1]//span"),
               lambda v: v == ITEM_RETITLE["footer-legal"])
    finally:
        php(UNSET, dict(saved, picture=picture))

    after = {p: fetch(p) for p in before}
    same = [p for p in before if after[p] == before[p]]
    for p in before:
        if p not in same:
            a, b = before[p][1], after[p][1]
            i = next((k for k in range(min(len(a), len(b))) if a[k] != b[k]), min(len(a), len(b)))
            problems.append(f"{p} not as before: first difference at character {i}: {b[max(0, i - 60):i + 60]!r}")
    for p in problems:
        print("  ", p)
    print(f"test picture: {upload}")
    print(f"\nsettings: {checked} settings and menu changes checked, {len(problems)} problems; "
          f"{len(same)} of {len(before)} pages byte for byte as before after putting everything back")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
