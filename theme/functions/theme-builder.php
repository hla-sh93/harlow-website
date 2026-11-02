<?php
/**
 * The Theme Builder (Elementor Pro's): Appearance → Theme Builder. Templates the owner
 * makes with the editor's blocks, each of a kind (header, footer, single page or item,
 * archive, search results, 404 page, a list's card, popup) with display conditions: where
 * it shows (the entire site, the front page, pages, a type of item, one page or item,
 * archives, a category, search results, the 404 page…), and where it does not.
 *
 * A request uses the template of its kind whose conditions fit it best (one page beats a
 * type of page, which beats every page, which beats the entire site); with none, the site
 * is printed as the design's, byte for byte. Popups are printed hidden at the end of the
 * page and opened by their triggers (assets/js/popup.js).
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The kinds of template: kind => [ name, Elementor's document type ].
 *
 * @return array<string,array{0:string,1:string}>
 */
function harlow_template_kinds() {
	return array(
		'header'    => array( __( 'Header', 'harlow' ), 'header' ),
		'footer'    => array( __( 'Footer', 'harlow' ), 'footer' ),
		'single'    => array( __( 'Single page or item', 'harlow' ), 'single-post' ),
		'archive'   => array( __( 'Archive', 'harlow' ), 'archive' ),
		'search'    => array( __( 'Search results', 'harlow' ), 'search-results' ),
		'error'     => array( __( '404 page', 'harlow' ), 'error-404' ),
		'loop-item' => array( __( 'List card', 'harlow' ), 'loop-item' ),
		'popup'     => array( __( 'Popup', 'harlow' ), 'popup' ),
	);
}

/**
 * The template type and its fields: kind, conditions (JSON) and a popup's settings (JSON).
 */
function harlow_register_templates() {
	register_post_type(
		'harlow_template',
		array(
			'labels'       => array(
				'name'          => __( 'Theme Builder', 'harlow' ),
				'singular_name' => __( 'Template', 'harlow' ),
				'add_new_item'  => __( 'Add a template', 'harlow' ),
				'edit_item'     => __( 'Edit the template', 'harlow' ),
				'all_items'     => __( 'Theme Builder', 'harlow' ),
			),
			'public'       => false,
			'show_ui'      => true,
			'show_in_menu' => 'themes.php',
			'show_in_rest' => true,
			'rewrite'      => false,
			'supports'     => array( 'title', 'editor', 'custom-fields', 'revisions' ),
			'map_meta_cap' => true,
			'capabilities' => array(
				'create_posts' => 'edit_theme_options',
			),
			// A template starts with its Elementor document, as a page does.
			'template'     => array( array( 'harlow/document', array( 'postType' => 'elementor_library' ) ) ),
		)
	);
	foreach ( array( '_harlow_template_kind', '_harlow_conditions', '_harlow_popup' ) as $key ) {
		register_post_meta(
			'harlow_template',
			$key,
			array(
				'type'              => 'string',
				'single'            => true,
				'default'           => '_harlow_template_kind' === $key ? 'header' : '',
				'show_in_rest'      => true,
				'sanitize_callback' => '_harlow_template_kind' === $key ? 'harlow_sanitize_template_kind' : 'harlow_sanitize_json',
				'auth_callback'     => static function () {
					return current_user_can( 'edit_theme_options' );
				},
			)
		);
	}
}
add_action( 'init', 'harlow_register_templates' );

/**
 * A template's kind, one of the known ones.
 *
 * @param mixed $value The kind.
 * @return string
 */
function harlow_sanitize_template_kind( $value ) {
	return isset( harlow_template_kinds()[ $value ] ) ? $value : 'header';
}

/**
 * A JSON value, kept only when it is JSON.
 *
 * @param mixed $value The JSON.
 * @return string
 */
function harlow_sanitize_json( $value ) {
	return is_string( $value ) && null !== json_decode( $value, true ) ? $value : '';
}

/**
 * How well one rule fits this request: 0 when it does not; more for a narrower rule.
 *
 * @param string $rule A rule: entire, front, singular, page, type:<post type>, id:<id>,
 *                     archive, archive:<post type>, term:<taxonomy>:<id>, search, 404,
 *                     author, date.
 * @return int
 */
function harlow_rule_fit( $rule ) {
	$parts = explode( ':', (string) $rule );
	switch ( $parts[0] ) {
		case 'entire':
			return 1;
		case 'singular':
			return is_singular() ? 2 : 0;
		case 'archive':
			if ( isset( $parts[1] ) ) {
				return is_post_type_archive( $parts[1] ) || ( 'post' === $parts[1] && ( is_home() || is_category() || is_tag() ) ) ? 3 : 0;
			}
			return is_archive() || is_home() ? 2 : 0;
		case 'page':
			return is_page() ? 3 : 0;
		case 'type':
			return isset( $parts[1] ) && is_singular( $parts[1] ) ? 3 : 0;
		case 'front':
			return is_front_page() ? 4 : 0;
		case 'search':
			return is_search() ? 4 : 0;
		case '404':
			return is_404() ? 4 : 0;
		case 'author':
			return is_author() ? 4 : 0;
		case 'date':
			return is_date() ? 4 : 0;
		case 'term':
			if ( isset( $parts[1], $parts[2] ) ) {
				if ( is_tax( $parts[1], (int) $parts[2] ) || ( 'category' === $parts[1] && is_category( (int) $parts[2] ) ) || ( 'post_tag' === $parts[1] && is_tag( (int) $parts[2] ) ) ) {
					return 4;
				}
				return is_singular() && has_term( (int) $parts[2], $parts[1] ) ? 4 : 0;
			}
			return 0;
		case 'id':
			return isset( $parts[1] ) && is_singular() && (int) get_queried_object_id() === (int) $parts[1] ? 5 : 0;
	}
	return 0;
}

/**
 * How well a template's conditions fit this request: 0 when they do not (no include fits,
 * or an exclude does).
 *
 * @param int $template The template's id.
 * @return int
 */
function harlow_template_fit( $template ) {
	$conditions = json_decode( (string) get_post_meta( $template, '_harlow_conditions', true ), true );
	if ( ! is_array( $conditions ) || ! $conditions ) {
		return 0;
	}
	$best = 0;
	foreach ( $conditions as $condition ) {
		$fit = harlow_rule_fit( isset( $condition['rule'] ) ? $condition['rule'] : '' );
		if ( ! $fit ) {
			continue;
		}
		if ( isset( $condition['type'] ) && 'exclude' === $condition['type'] ) {
			return 0;
		}
		$best = max( $best, $fit );
	}
	return $best;
}

/**
 * The published templates of a kind.
 *
 * @param string $kind The kind.
 * @return int[]
 */
function harlow_templates_of( $kind ) {
	static $found = array();
	if ( ! isset( $found[ $kind ] ) ) {
		$found[ $kind ] = get_posts(
			array(
				'post_type'      => 'harlow_template',
				'post_status'    => 'publish',
				'posts_per_page' => 100,
				'orderby'        => 'date',
				'order'          => 'DESC',
				'fields'         => 'ids',
				'meta_key'       => '_harlow_template_kind', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- a short list of templates.
				'meta_value'     => $kind, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value -- as above.
			)
		);
	}
	return $found[ $kind ];
}

/**
 * The template of a kind that fits this request best, or 0.
 *
 * @param string $kind The kind.
 * @return int
 */
function harlow_template_for( $kind ) {
	$best  = 0;
	$score = 0;
	foreach ( harlow_templates_of( $kind ) as $template ) {
		$fit = harlow_template_fit( $template );
		if ( $fit > $score ) {
			$best  = $template;
			$score = $fit;
		}
	}
	return $best;
}

/**
 * A template's blocks, printed (its Elementor document box comes with them).
 *
 * @param int $template The template's id.
 * @return string
 */
function harlow_render_template( $template ) {
	$content = (string) get_post_field( 'post_content', $template, 'raw' );
	return do_blocks( $content );
}

/**
 * Print the template of a kind for this request, if one fits.
 *
 * @param string $kind The kind.
 * @return bool Whether one was printed.
 */
function harlow_theme_template( $kind ) {
	$template = harlow_template_for( $kind );
	if ( ! $template ) {
		return false;
	}
	echo harlow_render_template( $template ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- blocks printed by WordPress and the theme's sections, escaped where they are built.
	return true;
}

/**
 * The page-wide rules a template's own blocks need are the page's: a template's widgets'
 * stylesheets join the page's (functions/enqueue.php reads the page's blocks).
 *
 * @param string[] $names The page's block names.
 * @return string[]
 */
function harlow_template_block_names( $names ) {
	$content = '';
	foreach ( array( 'header', 'footer', 'single', 'archive', 'search', 'error' ) as $kind ) {
		$template = harlow_template_for( $kind );
		if ( $template ) {
			$content .= (string) get_post_field( 'post_content', $template, 'raw' );
		}
	}
	foreach ( harlow_popups_here() as $popup ) {
		$content .= (string) get_post_field( 'post_content', $popup, 'raw' );
	}
	if ( '' === $content ) {
		return $names;
	}
	$found = array_fill_keys( $names, true );
	harlow_collect_block_names( parse_blocks( $content ), $found, 0 );
	return array_keys( $found );
}
add_filter( 'harlow_page_block_names', 'harlow_template_block_names' );

/**
 * The popups whose conditions fit this request.
 *
 * @return int[]
 */
function harlow_popups_here() {
	static $popups = null;
	if ( null === $popups ) {
		$popups = array_values( array_filter( harlow_templates_of( 'popup' ), 'harlow_template_fit' ) );
	}
	return $popups;
}

/**
 * The popups this page names (a link to #harlow-popup-<id>, a form whose action opens one):
 * printed with the page's own, wherever their conditions show them, as Elementor loads a
 * popup a page asks for.
 *
 * @param int $popup A popup's id to add, or 0 to read the list.
 * @return int[]
 */
function harlow_popup_wanted( $popup = 0 ) {
	static $wanted = array();
	if ( $popup && 'popup' === get_post_meta( $popup, '_harlow_template_kind', true ) && 'publish' === get_post_status( $popup ) ) {
		$wanted[ (int) $popup ] = true;
	}
	return array_keys( $wanted );
}

/**
 * Note the popups a block names as the page prints it.
 *
 * @param string              $html  The block as printed.
 * @param array<string,mixed> $block The block.
 * @return string
 */
function harlow_popups_named( $html, $block ) {
	if ( ! empty( $block['attrs']['popupId'] ) ) {
		harlow_popup_wanted( (int) $block['attrs']['popupId'] );
	}
	if ( false !== strpos( $html, 'harlow-popup-' ) && preg_match_all( '/#harlow-popup-(\d+)/', $html, $m ) ) {
		foreach ( $m[1] as $id ) {
			harlow_popup_wanted( (int) $id );
		}
	}
	return $html;
}
add_filter( 'render_block', 'harlow_popups_named', 10, 2 );

/**
 * The popups printed on this page: those whose conditions fit it, and those it names.
 *
 * @return int[]
 */
function harlow_popups_printed() {
	return array_values( array_unique( array_merge( harlow_popups_here(), harlow_popup_wanted() ) ) );
}

/**
 * A popup's settings, checked: where it sits, its size, overlay, close button, animations,
 * triggers (on load, on scroll, on scrolling to an element, on clicks, after inactivity, on
 * leaving the page) and advanced rules (how often, after how many pages or sessions, when
 * arriving from an address, for visitors logged in or not, on which devices).
 *
 * @param int $popup The popup's id.
 * @return array<string,mixed>
 */
function harlow_popup_settings( $popup ) {
	$in  = json_decode( (string) get_post_meta( $popup, '_harlow_popup', true ), true );
	$in  = is_array( $in ) ? $in : array();
	$get = static function ( $key, $fallback = '' ) use ( $in ) {
		return isset( $in[ $key ] ) && '' !== $in[ $key ] ? $in[ $key ] : $fallback;
	};
	$num = static function ( $value ) {
		return is_numeric( $value ) ? max( 0, (float) $value ) : null;
	};
	return array(
		'position'      => harlow_style_word( $get( 'position', 'center' ), array( 'center', 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right' ) ),
		'width'         => $num( $get( 'width' ) ),
		'height'        => $num( $get( 'height' ) ),
		'overlay'       => false !== $get( 'overlay', true ),
		'close'         => false !== $get( 'close', true ),
		'entrance'      => harlow_style_word( $get( 'entrance', 'fadeIn' ), array( 'none', 'fadeIn', 'fadeInUp', 'fadeInDown', 'fadeInLeft', 'fadeInRight', 'zoomIn', 'slideInUp', 'slideInDown', 'slideInLeft', 'slideInRight', 'bounceIn' ) ),
		'duration'      => $num( $get( 'duration', 600 ) ),
		'escape'        => false !== $get( 'escape', true ),
		'overlayClose'  => false !== $get( 'overlayClose', true ),
		'lockScroll'    => (bool) $get( 'lockScroll', false ),
		'load'          => $num( $get( 'load' ) ),
		'scroll'        => $num( $get( 'scroll' ) ),
		'scrollTo'      => sanitize_text_field( (string) $get( 'scrollTo' ) ),
		'clicks'        => $num( $get( 'clicks' ) ),
		'inactivity'    => $num( $get( 'inactivity' ) ),
		'exit'          => (bool) $get( 'exit', false ),
		'times'         => $num( $get( 'times' ) ),
		'per'           => harlow_style_word( $get( 'per', 'session' ), array( 'session', 'day', 'week', 'month', 'ever' ) ),
		'afterViews'    => $num( $get( 'afterViews' ) ),
		'afterSessions' => $num( $get( 'afterSessions' ) ),
		'from'          => sanitize_text_field( (string) $get( 'from' ) ),
		'devices'       => is_array( $get( 'devices', array() ) ) ? array_values( array_intersect( $get( 'devices', array() ), array( 'desktop', 'tablet', 'mobile' ) ) ) : array(),
	);
}

/**
 * The popups of this request, hidden at the end of the page; those for logged-in visitors
 * only, or for others only, are left out where they do not fit.
 */
function harlow_print_popups() {
	foreach ( harlow_popups_printed() as $popup ) {
		$in   = json_decode( (string) get_post_meta( $popup, '_harlow_popup', true ), true );
		$who  = is_array( $in ) && isset( $in['loggedIn'] ) ? $in['loggedIn'] : '';
		$show = '' === $who || ( 'in' === $who && is_user_logged_in() ) || ( 'out' === $who && ! is_user_logged_in() );
		if ( ! $show ) {
			continue;
		}
		$settings = harlow_popup_settings( $popup );
		echo '<div class="elementor-popup-modal harlow-popup harlow-popup--' . esc_attr( $settings['position'] ) . '" id="harlow-popup-' . (int) $popup . '" role="dialog" aria-modal="true" aria-label="' . esc_attr( get_the_title( $popup ) ) . '" hidden data-harlow-popup="' . esc_attr( (string) wp_json_encode( $settings ) ) . '">'
			. ( $settings['overlay'] ? '<div class="harlow-popup__overlay"></div>' : '' )
			. '<div class="dialog-widget-content dialog-lightbox-widget-content harlow-popup__box">'
			. ( $settings['close'] ? '<button type="button" class="dialog-close-button dialog-lightbox-close-button harlow-popup__close" aria-label="' . esc_attr__( 'Close', 'harlow' ) . '">&times;</button>' : '' )
			. '<div class="dialog-message dialog-lightbox-message">' . harlow_render_template( $popup ) . '</div>' // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the popup's blocks, escaped where they are built.
			. '</div></div>' . "\n";
		harlow_enqueue_module( 'popup' );
	}
}
add_action( 'wp_footer', 'harlow_print_popups', 4 );

/**
 * A popup's size, as its own rules.
 */
function harlow_popup_styles() {
	$css = '';
	foreach ( harlow_popups_printed() as $popup ) {
		$settings = harlow_popup_settings( $popup );
		$box      = '#harlow-popup-' . (int) $popup . ' .harlow-popup__box';
		if ( $settings['width'] ) {
			$css .= $box . '{width:' . $settings['width'] . 'px;}';
		}
		if ( $settings['height'] ) {
			$css .= $box . '{height:' . $settings['height'] . 'px;}';
		}
		if ( $settings['duration'] ) {
			$css .= $box . '{animation-duration:' . $settings['duration'] . 'ms;}';
		}
	}
	if ( '' !== $css ) {
		harlow_collected_styles( $css );
	}
}
add_action( 'wp_footer', 'harlow_popup_styles', 3 );

/**
 * One card of a list: a card made in the Theme Builder when the list names one, else the
 * list's own card (includes/loops/).
 *
 * @param string $template The list's own card.
 * @param int    $card     A Theme Builder card, or 0.
 */
function harlow_loop_card( $template, $card ) {
	if ( $card && 'publish' === get_post_status( $card ) && 'loop-item' === get_post_meta( $card, '_harlow_template_kind', true ) ) {
		echo harlow_render_template( $card ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the card's blocks, escaped where they are built.
		return;
	}
	get_template_part( 'includes/loops/' . $template );
}

/**
 * The templates for the editor: id, title and kind (a list picks its card from them).
 *
 * @return array<int,array{id:int,title:string,kind:string}>
 */
function harlow_templates_for_editor() {
	$out = array();
	foreach ( array_keys( harlow_template_kinds() ) as $kind ) {
		foreach ( harlow_templates_of( $kind ) as $id ) {
			$out[] = array(
				'id'    => (int) $id,
				'title' => get_the_title( $id ),
				'kind'  => $kind,
			);
		}
	}
	return $out;
}

/**
 * The Theme Builder's list: each template's kind and where it shows.
 *
 * @param array<string,string> $columns The list's columns.
 * @return array<string,string>
 */
function harlow_template_columns( $columns ) {
	$date = isset( $columns['date'] ) ? $columns['date'] : '';
	unset( $columns['date'] );
	$columns['harlow_kind']       = __( 'Kind', 'harlow' );
	$columns['harlow_conditions'] = __( 'Shown on', 'harlow' );
	if ( $date ) {
		$columns['date'] = $date;
	}
	return $columns;
}
add_filter( 'manage_harlow_template_posts_columns', 'harlow_template_columns' );

/**
 * A row's kind and conditions in the Theme Builder's list.
 *
 * @param string $column The column.
 * @param int    $post   The template.
 */
function harlow_template_column( $column, $post ) {
	if ( 'harlow_kind' === $column ) {
		$kinds = harlow_template_kinds();
		$kind  = (string) get_post_meta( $post, '_harlow_template_kind', true );
		echo esc_html( isset( $kinds[ $kind ] ) ? $kinds[ $kind ][0] : '' );
	}
	if ( 'harlow_conditions' === $column ) {
		$conditions = json_decode( (string) get_post_meta( $post, '_harlow_conditions', true ), true );
		$words      = array();
		foreach ( is_array( $conditions ) ? $conditions : array() as $condition ) {
			$words[] = ( isset( $condition['type'] ) && 'exclude' === $condition['type'] ? '− ' : '+ ' ) . ( isset( $condition['rule'] ) ? $condition['rule'] : '' );
		}
		echo esc_html( $words ? implode( ', ', $words ) : __( 'Nowhere yet', 'harlow' ) );
	}
}
add_action( 'manage_harlow_template_posts_custom_column', 'harlow_template_column', 10, 2 );
