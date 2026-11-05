<?php
/**
 * The blocks of the pages, and what they share.
 *
 * One block per kind of Elementor element (blocks/<name>/block.json, markup in
 * includes/sections/<name>.php): a container holds other blocks; a heading, a text, an
 * image, a button and the rest print the element as live prints it. Every one keeps the
 * element's id, design classes (the vocabulary of _vocab/vocabulary.md) and settings.
 *
 * Links in blocks stay as the reference writes them, readable: `about-us.html#section-2`
 * for a page of the site, `assets/uploads/...` for a file of the design. They are turned
 * into addresses when the page is printed (harlow_link_url()), so a page found by its name
 * keeps its links when its address changes.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register every block of blocks/.
 */
function harlow_register_blocks() {
	foreach ( glob( get_theme_file_path( 'blocks/*/block.json' ) ) as $file ) {
		register_block_type( dirname( $file ) );
	}
}
add_action( 'init', 'harlow_register_blocks' );

/**
 * The attributes of an element as Elementor writes them: its classes, id, kind, settings,
 * widget type, and an id attribute when it has one. Every value escaped.
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @param string              $kind       'container' or 'widget'.
 * @param string              $widget     The widget type (heading.default, ...), for a widget.
 * @param string              $block      The block (its folder) when it is not the widget
 *                                        type's (the history slider, an HTML widget on live).
 * @return string Attributes, each with its leading space.
 */
function harlow_element_attributes( $attributes, $kind, $widget = '', $block = '' ) {
	// The owner's own style of this element (functions/styles.php): its classes join the
	// element's; its rules go to the page's style element, printed once in the footer.
	$style   = harlow_block_style( $attributes );
	$classes = $attributes['classes'];
	if ( ! empty( $style['classes'] ) && is_string( $style['classes'] ) ) {
		$classes .= ' ' . implode( ' ', array_filter( array_map( 'sanitize_html_class', preg_split( '/\s+/', $style['classes'] ) ) ) );
	}
	$out = ' class="' . esc_attr( trim( $classes ) ) . '" data-id="' . esc_attr( $attributes['element'] ) . '"'
		. ' data-element_type="' . esc_attr( $kind ) . '" data-e-type="' . esc_attr( $kind ) . '"';
	if ( $style ) {
		$block_kind = '' !== $block ? $block : ( '' !== $widget ? harlow_widget_kind( $widget ) : $kind );
		harlow_collected_styles( harlow_element_css( $attributes['element'], $style, $block_kind, $attributes['classes'] ) );
	}
	if ( '' !== $attributes['settings'] ) {
		$out .= ' data-settings="' . esc_attr( $attributes['settings'] ) . '"';
	}
	if ( '' !== $widget ) {
		$out .= ' data-widget_type="' . esc_attr( $widget ) . '"';
	}
	if ( '' !== $attributes['htmlId'] ) {
		$out .= ' id="' . esc_attr( $attributes['htmlId'] ) . '"';
	}
	// Motion effects and sticky (assets/js/motion.js).
	$motion = harlow_style_motion( $style );
	if ( $motion ) {
		$out .= ' data-harlow-motion="' . esc_attr( (string) wp_json_encode( $motion ) ) . '"';
		harlow_enqueue_module( 'motion' );
	}
	return $out . harlow_style_attributes( $style );
}

/**
 * The block (its folder in blocks/) of an Elementor widget type: the type's name before
 * its skin, without Elementor's `theme-` prefix, with `-` for `_`; the few whose block has
 * another name are named here.
 *
 * @param string $widget The widget type (heading.default, theme-site-logo.default...).
 * @return string
 */
function harlow_widget_kind( $widget ) {
	$base  = preg_replace( '/\..*$/', '', $widget );
	$named = array(
		'text-editor'   => 'text',
		'loop-grid'     => 'loop',
		'loop-carousel' => 'loop',
	);
	if ( isset( $named[ $base ] ) ) {
		return $named[ $base ];
	}
	return str_replace( '_', '-', preg_replace( '/^theme-/', '', $base ) );
}

/**
 * Display conditions (Elementor Pro's): an element with conditions the visit does not meet
 * is not printed at all. Who (logged in or out, their role), when (from a date, until a
 * date, on some days of the week, between two times of day, in the site's time zone).
 *
 * @param string              $html  The block as printed.
 * @param array<string,mixed> $block The block.
 * @return string
 */
function harlow_display_conditions( $html, $block ) {
	if ( empty( $block['blockName'] ) || 0 !== strpos( $block['blockName'], 'harlow/' ) || empty( $block['attrs']['style']['conditions'] ) ) {
		return $html;
	}
	return harlow_conditions_met( $block['attrs']['style']['conditions'] ) ? $html : '';
}
add_filter( 'render_block', 'harlow_display_conditions', 5, 2 );

/**
 * Whether this visit meets an element's display conditions.
 *
 * @param mixed $c The conditions: login ('in' or 'out'), roles, from, until (dates), days
 *                 (0 Sunday to 6 Saturday), timeFrom, timeTo (HH:MM).
 * @return bool
 */
function harlow_conditions_met( $c ) {
	if ( ! is_array( $c ) ) {
		return true;
	}
	$login = isset( $c['login'] ) ? $c['login'] : '';
	if ( ( 'in' === $login && ! is_user_logged_in() ) || ( 'out' === $login && is_user_logged_in() ) ) {
		return false;
	}
	if ( ! empty( $c['roles'] ) && is_array( $c['roles'] ) ) {
		$user = wp_get_current_user();
		if ( ! $user->exists() || ! array_intersect( $c['roles'], (array) $user->roles ) ) {
			return false;
		}
	}
	$now   = current_datetime();
	$today = $now->format( 'Y-m-d' );
	if ( ! empty( $c['from'] ) && is_string( $c['from'] ) && $today < substr( $c['from'], 0, 10 ) ) {
		return false;
	}
	if ( ! empty( $c['until'] ) && is_string( $c['until'] ) && $today > substr( $c['until'], 0, 10 ) ) {
		return false;
	}
	if ( ! empty( $c['days'] ) && is_array( $c['days'] ) && ! in_array( (int) $now->format( 'w' ), array_map( 'intval', $c['days'] ), true ) ) {
		return false;
	}
	$time = $now->format( 'H:i' );
	if ( ! empty( $c['timeFrom'] ) && is_string( $c['timeFrom'] ) && $time < $c['timeFrom'] ) {
		return false;
	}
	if ( ! empty( $c['timeTo'] ) && is_string( $c['timeTo'] ) && $time > $c['timeTo'] ) {
		return false;
	}
	return true;
}

/**
 * The address of a link as blocks write it.
 *
 * `about-us.html` is the page installed under that name (or an item that had that page in
 * the reference), wherever it lives now, with its #part kept; `assets/...` is a file of the
 * theme; anything else (a full address, mailto:, #part) is kept as it is.
 *
 * @param string $link The link as written.
 * @return string
 */
function harlow_link_url( $link ) {
	// A dynamic link (functions/dynamic-tags.php): the post's, the site's, the archive's...
	if ( 0 === strpos( $link, 'dynamic:' ) ) {
		return harlow_dynamic_link( $link );
	}
	if ( '' === $link || preg_match( '#^([a-z][a-z0-9+.-]*:|/|\#|\?)#i', $link ) ) {
		return $link;
	}
	if ( 0 === strpos( $link, 'assets/' ) ) {
		return get_theme_file_uri( $link );
	}
	if ( preg_match( '/^([\w-]+)\.html(#.*)?$/', $link, $m ) ) {
		$url = harlow_page_url( $m[1] );
		if ( '' !== $url ) {
			return $url . ( isset( $m[2] ) ? $m[2] : '' );
		}
	}
	return $link;
}

/**
 * The pages and items of the site by the reference name the installer gave them
 * (about-us, news-<item>), as post ids; one query, kept for the request.
 *
 * @return array<string,int>
 */
function harlow_named_posts() {
	static $by_name = null;
	if ( null === $by_name ) {
		$by_name = array();
		$found   = get_posts(
			array(
				// Every public type: 'any' leaves out the types search skips (projects).
				'post_type'      => array_values( get_post_types( array( 'public' => true ) ) ),
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'meta_key'       => '_harlow_name', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- one query for every link of the page, cached.
				'fields'         => 'ids',
			)
		);
		foreach ( $found as $id ) {
			$by_name[ (string) get_post_meta( $id, '_harlow_name', true ) ] = (int) $id;
		}
	}
	return $by_name;
}

/**
 * The address of a page or item of the site by its reference name (about-us, index,
 * news-<item>), found by the name the installer gave it, so a changed address follows.
 *
 * @param string $name The reference name.
 * @return string '' when nothing has that name.
 */
function harlow_page_url( $name ) {
	if ( 'index' === $name ) {
		return home_url( '/' );
	}
	$by_name = harlow_named_posts();
	return isset( $by_name[ $name ] ) ? (string) get_permalink( $by_name[ $name ] ) : '';
}

/**
 * Every named page's address, for the editor (its links are shown as the page prints them).
 *
 * @return array<string,string>
 */
function harlow_page_urls() {
	$urls = array( 'index' => home_url( '/' ) );
	foreach ( array_keys( harlow_named_posts() ) as $name ) {
		$urls[ $name ] = harlow_page_url( $name );
	}
	return $urls;
}

/**
 * The readable links inside prose and HTML blocks (`<a href="about-us.html">`), and the
 * design's files (`src="assets/uploads/..."`), as addresses.
 *
 * @param string $html The block's markup.
 * @return string
 */
function harlow_resolve_links( $html ) {
	if ( false === strpos( $html, '.html' ) && false === strpos( $html, 'assets/' ) ) {
		return $html;
	}
	$tags = new WP_HTML_Tag_Processor( $html );
	while ( $tags->next_tag() ) {
		foreach ( array( 'href', 'src', 'poster' ) as $name ) {
			$value = $tags->get_attribute( $name );
			if ( is_string( $value ) ) {
				$tags->set_attribute( $name, harlow_link_url( $value ) );
			}
		}
		$style = $tags->get_attribute( 'style' );
		if ( is_string( $style ) && false !== strpos( $style, 'assets/' ) ) {
			$tags->set_attribute( 'style', (string) preg_replace_callback( '/url\((["\']?)(assets\/[^)"\']+)\1\)/', 'harlow_resolve_style_url', $style ) );
		}
	}
	return $tags->get_updated_html();
}

/**
 * One url(...) of a style, with the design's file made an address.
 *
 * @param string[] $m The match: quote, path.
 * @return string
 */
function harlow_resolve_style_url( $m ) {
	return 'url(' . $m[1] . get_theme_file_uri( $m[2] ) . $m[1] . ')';
}

/**
 * Links in prose and HTML blocks resolved (harlow_resolve_links()).
 *
 * @param string               $html  The block's markup.
 * @param array<string, mixed> $block The block.
 * @return string
 */
function harlow_prose_links( $html, $block ) {
	if ( in_array( $block['blockName'], array( 'core/paragraph', 'core/list', 'core/list-item', 'core/html' ), true ) ) {
		$html = harlow_resolve_links( $html );
	}
	return $html;
}
add_filter( 'render_block', 'harlow_prose_links', 10, 2 );

/**
 * Prose as live prints it: WordPress 7 adds wp-block-paragraph and wp-block-list to the
 * paragraphs and lists it prints (in render_block_core/paragraph, after render_block),
 * which the design does not have.
 *
 * @param string $html The block's markup.
 * @return string
 */
function harlow_plain_prose( $html ) {
	$tags = new WP_HTML_Tag_Processor( $html );
	if ( $tags->next_tag() ) {
		$tags->remove_class( 'wp-block-paragraph' );
		$tags->remove_class( 'wp-block-list' );
		if ( '' === trim( (string) $tags->get_attribute( 'class' ) ) ) {
			$tags->remove_attribute( 'class' );
		}
	}
	return $tags->get_updated_html();
}
add_filter( 'render_block_core/paragraph', 'harlow_plain_prose', 20 );
add_filter( 'render_block_core/list', 'harlow_plain_prose', 20 );

/**
 * Words of the item the page shows, for a block whose source names them: its title, its
 * date, or one of its fields (meta:<name>, stored as _<name>).
 *
 * @param string $source title, date or meta:<name>.
 * @return string Markup.
 */
function harlow_item_text( $source ) {
	if ( 'title' === $source ) {
		return get_the_title();
	}
	if ( 'date' === $source ) {
		return esc_html( get_the_date() );
	}
	if ( 0 === strpos( $source, 'meta:' ) ) {
		return esc_html( (string) get_post_meta( get_the_ID(), '_' . substr( $source, 5 ), true ) );
	}
	return '';
}

/**
 * An icon (inline SVG: the site's, the icon library's, or one the owner uploaded), kept to
 * the elements and attributes an icon has: nothing that runs, nothing that loads.
 *
 * @param string $svg The icon's markup.
 * @return string
 */
function harlow_icon( $svg ) {
	$shape = array(
		'class'           => true,
		'd'               => true,
		'fill'            => true,
		'stroke'          => true,
		'stroke-width'    => true,
		'stroke-linecap'  => true,
		'stroke-linejoin' => true,
		'id'              => true,
		'transform'       => true,
		'cx'              => true,
		'cy'              => true,
		'r'               => true,
		'x'               => true,
		'y'               => true,
		'width'           => true,
		'height'          => true,
		'points'          => true,
		'fill-rule'       => true,
		'clip-rule'       => true,
		'fill-opacity'    => true,
		'stroke-opacity'  => true,
		'opacity'         => true,
		'rx'              => true,
		'ry'              => true,
		'x1'              => true,
		'y1'              => true,
		'x2'              => true,
		'y2'              => true,
	);
	return wp_kses(
		$svg,
		array(
			'svg'      => array_merge(
				$shape,
				array(
					'aria-hidden'         => true,
					'role'                => true,
					'viewbox'             => true,
					'xmlns'               => true,
					'preserveaspectratio' => true,
				)
			),
			'path'     => $shape,
			'g'        => $shape,
			'circle'   => $shape,
			'ellipse'  => $shape,
			'rect'     => $shape,
			'polygon'  => $shape,
			'polyline' => $shape,
			'line'     => $shape,
		)
	);
}

/**
 * The picture of an image block: the Media Library's, printed by WordPress at its size,
 * or a file of the design.
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @return string
 */
function harlow_block_image( $attributes ) {
	if ( $attributes['image'] && wp_attachment_is_image( $attributes['image'] ) ) {
		$extra = array( 'class' => 'attachment-' . $attributes['size'] . ' size-' . $attributes['size'] . ' wp-image-' . $attributes['image'] );
		if ( '' !== $attributes['alt'] ) {
			$extra['alt'] = $attributes['alt'];
		}
		if ( '' !== $attributes['title'] ) {
			$extra['title'] = $attributes['title'];
		}
		return wp_get_attachment_image( $attributes['image'], $attributes['size'], false, $extra );
	}
	$img = '<img';
	foreach ( array( 'width', 'height' ) as $name ) {
		if ( '' !== $attributes[ $name ] ) {
			$img .= ' ' . $name . '="' . esc_attr( $attributes[ $name ] ) . '"';
		}
	}
	$img .= ' src="' . esc_url( harlow_link_url( $attributes['src'] ) ) . '"';
	if ( '' !== $attributes['imgClass'] ) {
		$img .= ' class="' . esc_attr( $attributes['imgClass'] ) . '"';
	}
	if ( '' !== $attributes['title'] ) {
		$img .= ' title="' . esc_attr( $attributes['title'] ) . '"';
	}
	return $img . ' alt="' . esc_attr( $attributes['alt'] ) . '">';
}

/**
 * A background picture chosen for an element, in its own style: it covers the design's
 * picture (a class of the vocabulary) at every width. Nothing when none is chosen, and the
 * design's picture shows.
 *
 * @param int $picture The picture (Media Library), or 0 for the design's own.
 * @return string The style attribute with its leading space, or ''.
 */
function harlow_picture_style( $picture ) {
	$url = $picture ? wp_get_attachment_image_url( (int) $picture, 'full' ) : '';
	return $url ? ' style="' . esc_attr( 'background-image: url("' . esc_url( $url ) . '")' ) . '"' : '';
}

/**
 * The attributes of a link: address (resolved), target, rel.
 *
 * @param array<string,mixed> $attributes Attributes with link, linkTarget, linkRel.
 * @return string Attributes, each with its leading space.
 */
function harlow_link_attributes( $attributes ) {
	$out = ' href="' . esc_url( harlow_link_url( $attributes['link'] ) ) . '"';
	if ( ! empty( $attributes['linkTarget'] ) ) {
		$out .= ' target="' . esc_attr( $attributes['linkTarget'] ) . '"';
	}
	if ( ! empty( $attributes['linkRel'] ) ) {
		$out .= ' rel="' . esc_attr( $attributes['linkRel'] ) . '"';
	}
	return $out;
}

/**
 * Live's Elementor document id of the page being printed: its own design rules are keyed
 * on it (.elementor-<id>). The installer stores it; a page made since uses its own id.
 *
 * @return int
 */
function harlow_document_id() {
	$document = (int) get_post_meta( get_the_ID(), '_harlow_document', true );
	return $document ? $document : (int) get_the_ID();
}

/**
 * Whether a post's text is being printed further up (the_content), so that a block printing
 * a post's text (an item's text, a list's whole texts) never prints it inside itself, which
 * would never end: a single template holding the item's text, read on its own screen or by
 * the REST API; a page whose sections hold its own text; a post listed with its whole text
 * in a list it holds. Elementor's Post content widget guards the same way.
 *
 * @param int $post_id The post.
 * @return bool
 */
function harlow_text_printing( $post_id ) {
	return in_array( (int) $post_id, harlow_text_stack(), true );
}

/**
 * The posts whose text is being printed, innermost last; `the_content` adds and takes off.
 *
 * @param int|null $push A post to add, or null.
 * @param bool     $pop  Take the innermost off.
 * @return array<int,int>
 */
function harlow_text_stack( $push = null, $pop = false ) {
	static $stack = array();
	if ( null !== $push ) {
		$stack[] = (int) $push;
	} elseif ( $pop ) {
		array_pop( $stack );
	}
	return $stack;
}

/**
 * A post's text starts to print: its id joins the stack.
 *
 * @param string $content The text.
 * @return string
 */
function harlow_text_starts( $content ) {
	harlow_text_stack( (int) get_the_ID() );
	return $content;
}
add_filter( 'the_content', 'harlow_text_starts', 0 );

/**
 * A post's text is printed: its id leaves the stack.
 *
 * @param string $content The text.
 * @return string
 */
function harlow_text_ends( $content ) {
	harlow_text_stack( null, true );
	return $content;
}
add_filter( 'the_content', 'harlow_text_ends', PHP_INT_MAX );

/**
 * The page's sections inside Elementor's document element, as live prints them.
 *
 * The installed pages, and every page made since (the page's template), hold that element
 * as their first block (harlow/document), so the editor's canvas has it too; content that
 * does not is put inside one here.
 */
function harlow_the_document() {
	if ( 0 === strpos( ltrim( (string) get_post_field( 'post_content' ) ), '<!-- wp:harlow/document ' ) ) {
		the_content();
		return;
	}
	$document = harlow_document_id();
	echo '<div data-elementor-type="wp-page" data-elementor-id="' . (int) $document . '" class="elementor elementor-' . (int) $document . '" data-elementor-post-type="page">';
	the_content();
	echo '</div>';
}

/**
 * The block categories of the section library and the page starters (theme/patterns/).
 */
function harlow_pattern_categories() {
	register_block_pattern_category( 'harlow-sections', array( 'label' => __( 'Harlow sections', 'harlow' ) ) );
	register_block_pattern_category( 'harlow-starters', array( 'label' => __( 'Harlow page layouts', 'harlow' ) ) );
}
add_action( 'init', 'harlow_pattern_categories' );

/**
 * The patterns that show the major clients name its synced pattern by live's id, 5532;
 * where that id was taken (on live, by Elementor's template) they are registered again
 * naming the pattern's id on this site.
 */
function harlow_patterns_shared_section() {
	$shared = harlow_shared_section_id();
	if ( ! $shared || 5532 === $shared ) {
		return;
	}
	$registry = WP_Block_Patterns_Registry::get_instance();
	foreach ( $registry->get_all_registered() as $pattern ) {
		if ( 0 === strpos( $pattern['name'], 'harlow/' ) && false !== strpos( $pattern['content'], '{"ref":5532}' ) ) {
			$name = $pattern['name'];
			unset( $pattern['name'], $pattern['filePath'] );
			$pattern['content'] = harlow_with_shared_section( $pattern['content'] );
			$registry->unregister( $name );
			$registry->register( $name, $pattern );
		}
	}
}
add_action( 'init', 'harlow_patterns_shared_section', 99 );

/**
 * A new page starts with its Elementor document (harlow/document), the box its sections go
 * in; nothing is added or removed beside it ('insert': 'all' would rewrite the content on
 * every load, and every block inside unlocks itself again).
 *
 * @param array<string,mixed> $args      The post type's arguments.
 * @param string              $post_type The post type.
 * @return array<string,mixed>
 */
function harlow_page_template( $args, $post_type ) {
	if ( 'page' === $post_type ) {
		$args['template']      = array(
			array(
				'harlow/document',
				array(
					'docType'  => 'wp-page',
					'postType' => 'page',
				),
			),
		);
		$args['template_lock'] = 'insert';
	}
	return $args;
}
add_filter( 'register_post_type_args', 'harlow_page_template', 10, 2 );
