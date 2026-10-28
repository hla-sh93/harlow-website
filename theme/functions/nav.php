<?php
/**
 * The menus: the header menu, the three footer columns, the links under them, the social
 * links and the language link.
 *
 * On live every menu is Elementor's nav-menu widget, which is WordPress's own menu walker
 * plus a few classes. The same walker prints them here, with the same additions, so the
 * markup is live's and every link is edited in Appearance → Menus.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** The arrow after a link that opens a submenu (Font Awesome's angle-down, as on live). */
const HARLOW_SUBMENU_ARROW = '<span class="sub-arrow"><svg aria-hidden="true" class="e-font-icon-svg e-fas-angle-down" viewBox="0 0 320 512" xmlns="http://www.w3.org/2000/svg"><path d="M143 352.3L7 216.3c-9.4-9.4-9.4-24.6 0-33.9l22.6-22.6c9.4-9.4 24.6-9.4 33.9 0l96.4 96.4 96.4-96.4c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9l-136 136c-9.2 9.4-24.4 9.4-33.8 0z"></path></svg></span>';

/**
 * Print a menu as Elementor's nav-menu widget prints it.
 *
 * Each widget prints its menu twice: the menu itself (`menu-1-<widget>`) and the copy its
 * burger opens (`menu-2-<widget>`), whose links are out of the tab order.
 *
 * @param string $location   Menu location.
 * @param string $widget     The live widget's id, which names the list.
 * @param bool   $dropdown   True for the burger's copy.
 * @param bool   $vertical   True for the footer's vertical lists.
 */
function harlow_nav_menu( $location, $widget, $dropdown = false, $vertical = false ) {
	$link_attributes = static function ( $atts, $item, $args, $depth ) use ( $dropdown ) {
		return harlow_nav_link_attributes( $atts, $item, $depth, $dropdown );
	};
	$language_item   = static function ( $items ) use ( $dropdown ) {
		return $items . harlow_language_menu_item( $dropdown );
	};

	add_filter( 'nav_menu_link_attributes', $link_attributes, 10, 4 );
	add_filter( 'nav_menu_submenu_css_class', 'harlow_nav_submenu_classes' );
	add_filter( 'nav_menu_item_id', '__return_empty_string' );
	add_filter( 'nav_menu_item_title', 'harlow_nav_item_title', 10, 2 );
	add_filter( 'wp_nav_menu_objects', 'harlow_nav_current_items' );
	if ( 'primary' === $location ) {
		add_filter( 'wp_nav_menu_items', $language_item );
	}

	wp_nav_menu(
		array(
			'theme_location' => $location,
			'menu_id'        => ( $dropdown ? 'menu-2-' : 'menu-1-' ) . $widget,
			'menu_class'     => 'elementor-nav-menu' . ( $vertical ? ' sm-vertical' : '' ),
			'container'      => '',
			'fallback_cb'    => '__return_empty_string',
		)
	);

	remove_filter( 'nav_menu_link_attributes', $link_attributes, 10 );
	remove_filter( 'nav_menu_submenu_css_class', 'harlow_nav_submenu_classes' );
	remove_filter( 'nav_menu_item_id', '__return_empty_string' );
	remove_filter( 'nav_menu_item_title', 'harlow_nav_item_title', 10 );
	remove_filter( 'wp_nav_menu_objects', 'harlow_nav_current_items' );
	remove_filter( 'wp_nav_menu_items', $language_item );
}

/**
 * The classes Elementor puts on a menu link: item or sub-item, active when it is the page
 * being looked at, anchor when it points at a part of a page.
 *
 * @param array<string,string> $atts     The link's attributes.
 * @param WP_Post              $item     The menu item.
 * @param int                  $depth    0 for the top level.
 * @param bool                 $dropdown True for the burger's copy.
 * @return array<string,string>
 */
function harlow_nav_link_attributes( $atts, $item, $depth, $dropdown ) {
	$href      = isset( $atts['href'] ) ? $atts['href'] : '';
	$is_anchor = false !== strpos( $href, '#' );
	$classes   = $depth ? 'elementor-sub-item' : 'elementor-item';
	if ( ! $is_anchor && in_array( 'current-menu-item', (array) $item->classes, true ) ) {
		$classes .= ' elementor-item-active';
	}
	if ( $is_anchor ) {
		$classes .= ' elementor-item-anchor';
	}
	$atts['class'] = $classes;
	if ( $dropdown ) {
		$atts['tabindex'] = '-1';
	}
	return $atts;
}

/**
 * A submenu list is also Elementor's dropdown.
 *
 * @param string[] $classes The list's classes.
 * @return string[]
 */
function harlow_nav_submenu_classes( $classes ) {
	$classes[] = 'elementor-nav-menu--dropdown';
	return $classes;
}

/**
 * The arrow after the words of a link that opens a submenu.
 *
 * @param string  $title The link's words.
 * @param WP_Post $item  The menu item.
 * @return string
 */
function harlow_nav_item_title( $title, $item ) {
	if ( in_array( 'menu-item-has-children', (array) $item->classes, true ) ) {
		$title .= HARLOW_SUBMENU_ARROW;
	}
	return $title;
}

/**
 * Only a link to a page is marked as the current page, never a typed address.
 *
 * WordPress also marks a typed link (a "Custom Link") current when its address is the
 * page's address. Live never does: its About links are typed links to parts of the About
 * page, and there the scroll script marks whichever part is in view (assets/js/nav-menu.js).
 * Marked by WordPress as well, all five would be underlined at once. So a typed link
 * loses the mark here, and the menu items above it are marked from the links that remain.
 *
 * @param WP_Post[] $items The menu's items, with WordPress's current-page classes.
 * @return WP_Post[]
 */
function harlow_nav_current_items( $items ) {
	$typed_current = false;
	foreach ( $items as $item ) {
		if ( 'custom' === $item->type && $item->current ) {
			$typed_current = true;
		}
	}
	if ( ! $typed_current ) {
		return $items;
	}

	$ancestry = array( 'current-menu-item', 'current_page_item', 'current-menu-parent', 'current-menu-ancestor', 'current_page_parent', 'current_page_ancestor' );
	$by_id    = array();
	foreach ( $items as $item ) {
		if ( 'custom' === $item->type ) {
			$item->current = false;
		}
		$item->current_item_parent   = false;
		$item->current_item_ancestor = false;
		$keep                        = $item->current ? array( 'current-menu-item', 'current_page_item' ) : array();
		$item->classes               = array_values(
			array_filter(
				(array) $item->classes,
				static function ( $name ) use ( $ancestry, $keep ) {
					return ! in_array( $name, $ancestry, true ) || in_array( $name, $keep, true );
				}
			)
		);
		$by_id[ (int) $item->ID ]    = $item;
	}

	foreach ( $items as $item ) {
		if ( ! $item->current ) {
			continue;
		}
		$parent = (int) $item->menu_item_parent;
		$direct = true;
		while ( $parent && isset( $by_id[ $parent ] ) ) {
			$above                        = $by_id[ $parent ];
			$above->classes[]             = 'current-menu-ancestor';
			$above->current_item_ancestor = true;
			if ( $direct ) {
				$above->classes[]           = 'current-menu-parent';
				$above->current_item_parent = true;
			}
			$direct = false;
			$parent = (int) $above->menu_item_parent;
		}
	}
	return $items;
}

/**
 * The address of this page's Arabic version, or the Arabic home page when it has none.
 *
 * The installer stores each page's Arabic address (from live) in `_harlow_translations`.
 * With WPML (stage 11) the language links become WPML's own.
 *
 * @return string
 */
function harlow_translation_url() {
	if ( is_singular() || is_front_page() ) {
		$translations = get_post_meta( (int) get_queried_object_id(), '_harlow_translations', true );
		if ( is_array( $translations ) && ! empty( $translations['ar'] ) ) {
			return $translations['ar'];
		}
	}
	return (string) harlow_setting( 'language_home' );
}

/**
 * The language link at the end of the header menu, as WPML prints it on live.
 *
 * @param bool $dropdown True for the burger's copy.
 * @return string
 */
function harlow_language_menu_item( $dropdown ) {
	if ( defined( 'ICL_SITEPRESS_VERSION' ) ) {
		return '';
	}
	$label = (string) harlow_setting( 'language_label' );
	/* translators: %s: the name of the other language, in that language. */
	$title = sprintf( __( 'Switch to %s', 'harlow' ), $label );

	return '<li class="menu-item wpml-ls-slot-6 wpml-ls-item wpml-ls-item-ar wpml-ls-menu-item wpml-ls-first-item wpml-ls-last-item menu-item-type-wpml_ls_menu_item menu-item-object-wpml_ls_menu_item menu-item-wpml-ls-6-ar">'
		. '<a href="' . esc_url( harlow_translation_url() ) . '" title="' . esc_attr( $title ) . '" aria-label="' . esc_attr( $title ) . '" class="elementor-item"' . ( $dropdown ? ' tabindex="-1"' : '' ) . '>'
		. '<span class="wpml-ls-native" lang="ar">' . esc_html( $label ) . '</span></a></li>' . "\n";
}

/**
 * The address of the page being looked at, as the footer's language switcher links it
 * (the home page where there is no page, as on live's 404).
 *
 * @return string
 */
function harlow_current_url() {
	if ( is_singular() ) {
		return (string) get_permalink( get_queried_object_id() );
	}
	return home_url( '/' );
}

/**
 * The name of the menu in a location: a footer column's heading.
 *
 * @param string $location Menu location.
 * @return string
 */
function harlow_menu_name( $location ) {
	return wp_get_nav_menu_name( $location );
}

/**
 * The links under the footer columns, printed as the icon list live prints them.
 */
function harlow_footer_links() {
	$locations = get_nav_menu_locations();
	if ( empty( $locations['footer-legal'] ) ) {
		return;
	}
	$items = wp_get_nav_menu_items( $locations['footer-legal'] );
	foreach ( (array) $items as $item ) {
		if ( (int) $item->menu_item_parent ) {
			continue;
		}
		?>
					<li class="elementor-icon-list-item elementor-inline-item">
						<a href="<?php echo esc_url( $item->url ); ?>">

							<span class="elementor-icon-list-text"><?php echo esc_html( $item->title ); ?></span>
						</a>
					</li>
		<?php
	}
}

/**
 * The social networks of the footer, each with live's icon (Font Awesome brands).
 *
 * @return array<string,array{0:string,1:string,2:string}> Setting => [icon class, viewBox, path].
 */
function harlow_social_icons() {
	return array(
		'social_facebook'  => array( 'e-fab-facebook-square', '0 0 448 512', 'M400 32H48A48 48 0 0 0 0 80v352a48 48 0 0 0 48 48h137.25V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.27c-30.81 0-40.42 19.12-40.42 38.73V256h68.78l-11 71.69h-57.78V480H400a48 48 0 0 0 48-48V80a48 48 0 0 0-48-48z' ),
		'social_instagram' => array( 'e-fab-instagram', '0 0 448 512', 'M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z' ),
		'social_linkedin'  => array( 'e-fab-linkedin', '0 0 448 512', 'M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z' ),
		'social_x'         => array( 'e-fab-x-twitter', '0 0 512 512', 'M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z' ),
		'social_telegram'  => array( 'e-fab-telegram-plane', '0 0 448 512', 'M446.7 98.6l-67.6 318.8c-5.1 22.5-18.4 28.1-37.3 17.5l-103-75.9-49.7 47.8c-5.5 5.5-10.1 10.1-20.7 10.1l7.4-104.9 190.9-172.5c8.3-7.4-1.8-11.5-12.9-4.1L117.8 284 16.2 252.2c-22.1-6.9-22.5-22.1 4.6-32.7L418.2 66.4c18.4-6.9 34.5 4.1 28.5 32.2z' ),
	);
}

/**
 * The social links of the footer, one per network that has an address.
 */
function harlow_social_links() {
	foreach ( harlow_social_icons() as $setting => $icon ) {
		$url = (string) harlow_setting( $setting );
		if ( '' === $url ) {
			continue;
		}
		list( $class, $view_box, $path ) = $icon;
		?>
					<li class="elementor-icon-list-item elementor-inline-item">
						<a href="<?php echo esc_url( $url ); ?>">

							<span class="elementor-icon-list-icon">
								<svg aria-hidden="true" class="e-font-icon-svg <?php echo esc_attr( $class ); ?>" viewBox="<?php echo esc_attr( $view_box ); ?>" xmlns="http://www.w3.org/2000/svg"><path d="<?php echo esc_attr( $path ); ?>"></path></svg>
							</span>
							<span class="elementor-icon-list-text"></span>
						</a>
					</li>
		<?php
	}
}
