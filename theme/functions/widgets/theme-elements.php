<?php
/**
 * What Elementor Pro's theme builder widgets share (site logo and title, the item's title,
 * excerpt, picture and details, the author box, the item pager, breadcrumbs, the posts
 * lists, the sitemap, the search form): the element's classes as Elementor writes them, the
 * item a widget shows, the icons they draw themselves, and safe values for the custom
 * properties a widget prints.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The block's attributes with the element's classes as Elementor writes them for this
 * widget: Elementor's own (`elementor-element elementor-widget elementor-widget-<type>`)
 * when the block has none yet, then the classes the widget adds (a title widget is a
 * heading too: `elementor-widget-heading`; a picture widget an image) and its prefix
 * classes (columns, layout), each once.
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @param string              $type       Elementor's widget type (theme-post-title, posts...).
 * @param string[]            $extra      The classes the widget adds.
 * @return array<string,mixed>
 */
function harlow_theme_builder_classes( $attributes, $type, $extra = array() ) {
	$classes = trim( (string) $attributes['classes'] );
	if ( '' === $classes ) {
		$classes = 'elementor-element elementor-widget elementor-widget-' . $type;
	}
	$have = preg_split( '/\s+/', $classes );
	foreach ( $extra as $class ) {
		if ( '' !== $class && ! in_array( $class, $have, true ) ) {
			$have[] = $class;
		}
	}
	$attributes['classes'] = implode( ' ', $have );
	return $attributes;
}

/**
 * The item a widget shows: the one the page shows (the post, the page, the item of an item
 * page, the item a list's card template is printed for), or, where there is none (a
 * template's own screen: an item page template, a Theme Builder template), the latest
 * post, as Elementor's editor previews a template with a post.
 *
 * @return WP_Post|null
 */
function harlow_theme_builder_post() {
	$post = get_post();
	if ( $post && ! harlow_theme_builder_is_sample() ) {
		return $post;
	}
	$latest = get_posts(
		array(
			'post_type'      => 'post',
			'post_status'    => 'publish',
			'posts_per_page' => 1,
		)
	);
	return $latest ? $latest[0] : null;
}

/**
 * Is the page being printed one with no item of its own: a template's own screen (an item
 * page template, a synced pattern; a Theme Builder template), or none at all? The widgets
 * then show a sample.
 *
 * @return bool
 */
function harlow_theme_builder_is_sample() {
	$post = get_post();
	return ! $post || in_array( $post->post_type, array( 'wp_block', 'harlow_template' ), true );
}

/**
 * A title widget (site title, page title, post title, archive title): Elementor's heading
 * widget around the title, in the tag and size chosen, linked when a link is chosen.
 *
 * @param array<string,mixed> $attributes The block's attributes: tag, size, linkTo, link,
 *                                        linkTarget, linkRel.
 * @param string              $type       Elementor's widget type (theme-post-title...).
 * @param string[]            $extra      The classes the widget adds after its own.
 * @param string              $title      The title, escaped.
 * @param string              $item_url   Where "the item's page" leads.
 * @return string
 */
function harlow_theme_builder_heading( $attributes, $type, $extra, $title, $item_url = '' ) {
	$tag  = in_array( $attributes['tag'], array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ), true ) ? $attributes['tag'] : 'h2';
	$size = in_array( $attributes['size'], array( 'default', 'small', 'medium', 'large', 'xl', 'xxl' ), true ) ? $attributes['size'] : 'default';
	$href = '';
	if ( 'home' === $attributes['linkTo'] ) {
		$href = home_url( '/' );
	} elseif ( 'item' === $attributes['linkTo'] ) {
		$href = $item_url;
	} elseif ( 'custom' === $attributes['linkTo'] ) {
		$href = harlow_link_url( (string) $attributes['link'] );
	}
	if ( '' !== $href ) {
		$link  = ' href="' . esc_url( $href ) . '"';
		$link .= '' !== $attributes['linkTarget'] ? ' target="' . esc_attr( $attributes['linkTarget'] ) . '"' : '';
		$link .= '' !== $attributes['linkRel'] ? ' rel="' . esc_attr( $attributes['linkRel'] ) . '"' : '';
		$title = '<a' . $link . '>' . $title . '</a>';
	}
	return '<div' . harlow_element_attributes( harlow_theme_builder_classes( $attributes, $type, $extra ), 'widget', $type . '.default' ) . '>' . "\n"
		. '<div class="elementor-widget-container">' . "\n"
		. '<' . $tag . ' class="elementor-heading-title elementor-size-' . $size . '">' . $title . '</' . $tag . '>' . "\n"
		. '</div>' . "\n"
		. '</div>';
}

/**
 * A value typed in the sidebar, fit for a custom property in a style attribute: no quote,
 * brace, semicolon, angle bracket or backslash.
 *
 * @param string $value The value.
 * @return string
 */
function harlow_theme_builder_css_text( $value ) {
	return trim( str_replace( array( '"', "'", '\\', ';', '{', '}', '<', '>' ), '', (string) $value ) );
}

/**
 * The icons these widgets draw themselves, as Elementor prints Font Awesome's and its own
 * (inline SVG, `e-font-icon-svg e-<set>-<name>`).
 *
 * @param string $name The icon: search, close, spinner, user-circle, calendar, clock,
 *                     comment-dots, tags, arrow-left, arrow-right, angle-left, angle-right,
 *                     angle-double-left, angle-double-right, chevron-left, chevron-right,
 *                     caret-left, caret-right.
 * @return string
 */
function harlow_theme_builder_icon( $name ) {
	$icons = array(
		'search'             => array( 'fas-search', '0 0 512 512', 'M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z' ),
		'close'              => array( 'eicon-close', '0 0 1000 1000', 'M742 167L500 408 258 167C246 154 233 150 217 150 196 150 179 158 167 167 154 179 150 196 150 212 150 229 154 242 171 254L408 500 167 742C138 771 138 800 167 829 196 858 225 858 254 829L496 587 738 829C750 842 767 846 783 846 800 846 817 842 829 829 842 817 846 804 846 783 846 767 842 750 829 737L588 500 833 258C863 229 863 200 833 171 804 137 775 137 742 167Z' ),
		'spinner'            => array( 'fas-spinner', '0 0 512 512', 'M304 48c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-48 368c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm208-208c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zM96 256c0-26.51-21.49-48-48-48S0 229.49 0 256s21.49 48 48 48 48-21.49 48-48zm12.922 99.078c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.491-48-48-48zm294.156 0c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.49-48-48-48zM108.922 60.922c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.491-48-48-48z' ),
		'user-circle'        => array( 'far-user-circle', '0 0 496 512', 'M248 104c-53 0-96 43-96 96s43 96 96 96 96-43 96-96-43-96-96-96zm0 144c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm0-240C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 448c-49.7 0-95.1-18.3-130.1-48.4 14.9-23 40.4-38.6 69.6-39.5 20.8 6.4 40.6 9.6 60.5 9.6s39.7-3.1 60.5-9.6c29.2 1 54.7 16.5 69.6 39.5-35 30.1-80.4 48.4-130.1 48.4zm162.7-84.1c-24.4-31.4-62.1-51.9-105.1-51.9-10.2 0-26 9.6-57.6 9.6-31.5 0-47.4-9.6-57.6-9.6-42.9 0-80.6 20.5-105.1 51.9C61.9 339.2 48 299.2 48 256c0-110.3 89.7-200 200-200s200 89.7 200 200c0 43.2-13.9 83.2-37.3 115.9z' ),
		'calendar'           => array( 'fas-calendar', '0 0 448 512', 'M12 192h424c6.6 0 12 5.4 12 12v260c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V204c0-6.6 5.4-12 12-12zm436-44v-36c0-26.5-21.5-48-48-48h-48V12c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v52H160V12c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v52H48C21.5 64 0 85.5 0 112v36c0 6.6 5.4 12 12 12h424c6.6 0 12-5.4 12-12z' ),
		'clock'              => array( 'far-clock', '0 0 512 512', 'M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z' ),
		'comment-dots'       => array( 'far-comment-dots', '0 0 512 512', 'M144 208c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32zm112 0c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32zm112 0c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32zM256 32C114.6 32 0 125.1 0 240c0 47.6 19.9 91.2 52.9 126.3C38 405.7 7 439.1 6.5 439.5c-6.6 7-8.4 17.2-4.6 26S14.4 480 24 480c61.5 0 110-25.7 139.1-46.3C192 442.8 223.2 448 256 448c141.4 0 256-93.1 256-208S397.4 32 256 32zm0 368c-26.7 0-53.1-4.1-78.4-12.1l-22.7-7.2-19.5 13.8c-14.3 10.1-33.9 21.4-57.5 29 7.3-12.1 14.4-25.7 19.9-40.2l10.6-28.1-20.6-21.8C69.7 314.1 48 282.2 48 240c0-88.2 93.3-160 208-160s208 71.8 208 160-93.3 160-208 160z' ),
		'tags'               => array( 'fas-tags', '0 0 640 512', 'M497.941 225.941L286.059 14.059A48 48 0 0 0 252.118 0H48C21.49 0 0 21.49 0 48v204.118a48 48 0 0 0 14.059 33.941l211.882 211.882c18.744 18.745 49.136 18.746 67.882 0l204.118-204.118c18.745-18.745 18.745-49.137 0-67.882zM112 160c-26.51 0-48-21.49-48-48s21.49-48 48-48 48 21.49 48 48-21.49 48-48 48zm513.941 133.823L421.823 497.941c-18.745 18.745-49.137 18.745-67.882 0l-.36-.36L527.64 323.522c16.999-16.999 26.36-39.6 26.36-63.64s-9.362-46.641-26.36-63.64L331.397 0h48.721a48 48 0 0 1 33.941 14.059l211.882 211.882c18.745 18.745 18.745 49.137 0 67.882z' ),
		'arrow-left'         => array( 'fas-arrow-left', '0 0 448 512', 'M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8.4 34.3z' ),
		'arrow-right'        => array( 'fas-arrow-right', '0 0 448 512', 'M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z' ),
		'angle-left'         => array( 'fas-angle-left', '0 0 256 512', 'M31.7 239l136-136c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9L127.9 256l96.4 96.4c9.4 9.4 9.4 24.6 0 33.9L201.7 409c-9.4 9.4-24.6 9.4-33.9 0l-136-136c-9.5-9.4-9.5-24.6-.1-34z' ),
		'angle-right'        => array( 'fas-angle-right', '0 0 256 512', 'M224.3 273l-136 136c-9.4 9.4-24.6 9.4-33.9 0l-22.6-22.6c-9.4-9.4-9.4-24.6 0-33.9l96.4-96.4-96.4-96.4c-9.4-9.4-9.4-24.6 0-33.9L54.3 103c9.4-9.4 24.6-9.4 33.9 0l136 136c9.5 9.4 9.5 24.6.1 34z' ),
		'angle-double-left'  => array( 'fas-angle-double-left', '0 0 448 512', 'M223.7 239l136-136c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9L319.9 256l96.4 96.4c9.4 9.4 9.4 24.6 0 33.9L393.7 409c-9.4 9.4-24.6 9.4-33.9 0l-136-136c-9.5-9.4-9.5-24.6-.1-34zm-192 34l136 136c9.4 9.4 24.6 9.4 33.9 0l22.6-22.6c9.4-9.4 9.4-24.6 0-33.9L127.9 256l96.4-96.4c9.4-9.4 9.4-24.6 0-33.9L201.7 103c-9.4-9.4-24.6-9.4-33.9 0l-136 136c-9.5 9.4-9.5 24.6-.1 34z' ),
		'angle-double-right' => array( 'fas-angle-double-right', '0 0 448 512', 'M224.3 273l-136 136c-9.4 9.4-24.6 9.4-33.9 0l-22.6-22.6c-9.4-9.4-9.4-24.6 0-33.9l96.4-96.4-96.4-96.4c-9.4-9.4-9.4-24.6 0-33.9L54.3 103c9.4-9.4 24.6-9.4 33.9 0l136 136c9.5 9.4 9.5 24.6.1 34zm192-34l-136-136c-9.4-9.4-24.6-9.4-33.9 0l-22.6 22.6c-9.4 9.4-9.4 24.6 0 33.9l96.4 96.4-96.4 96.4c-9.4 9.4-9.4 24.6 0 33.9l22.6 22.6c9.4 9.4 24.6 9.4 33.9 0l136-136c9.4-9.2 9.4-24.4 0-33.8z' ),
		'chevron-left'       => array( 'fas-chevron-left', '0 0 320 512', 'M34.52 239.03L228.87 44.69c9.37-9.37 24.57-9.37 33.94 0l22.67 22.67c9.36 9.36 9.37 24.52.04 33.9L131.49 256l154.02 154.75c9.34 9.38 9.32 24.54-.04 33.9l-22.67 22.67c-9.37 9.37-24.57 9.37-33.94 0L34.52 272.97c-9.37-9.37-9.37-24.57 0-33.94z' ),
		'chevron-right'      => array( 'fas-chevron-right', '0 0 320 512', 'M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z' ),
		'caret-left'         => array( 'fas-caret-left', '0 0 192 512', 'M192 127.338v257.324c0 17.818-21.543 26.741-34.142 14.142L29.196 270.142c-7.81-7.81-7.81-20.474 0-28.284l128.662-128.662c12.599-12.6 34.142-3.676 34.142 14.142z' ),
		'caret-right'        => array( 'fas-caret-right', '0 0 192 512', 'M0 384.662V127.338c0-17.818 21.543-26.741 34.142-14.142l128.662 128.662c7.81 7.81 7.81 20.474 0 28.284L34.142 398.804C21.543 411.404 0 402.48 0 384.662z' ),
	);
	if ( ! isset( $icons[ $name ] ) ) {
		return '';
	}
	list( $class, $box, $path ) = $icons[ $name ];
	return '<svg aria-hidden="true" class="e-font-icon-svg e-' . $class . '" viewBox="' . $box . '" xmlns="http://www.w3.org/2000/svg"><path d="' . $path . '"></path></svg>';
}
