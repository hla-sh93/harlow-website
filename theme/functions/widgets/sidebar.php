<?php
/**
 * The widget areas the sidebar widget offers. The theme's design has none of its own, so
 * it registers two, Sidebar and Footer widgets, filled in Appearance → Widgets; a plugin's
 * or a child theme's areas are offered as well, and when there are some, these two are not
 * added.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register the two areas, unless the site has areas already.
 */
function harlow_sidebar_register() {
	global $wp_registered_sidebars;
	if ( ! empty( $wp_registered_sidebars ) ) {
		return;
	}
	$shape = array(
		'before_widget' => '<section id="%1$s" class="widget %2$s">',
		'after_widget'  => '</section>',
		'before_title'  => '<h2 class="widget-title">',
		'after_title'   => '</h2>',
	);
	register_sidebar(
		array_merge(
			$shape,
			array(
				'id'          => 'harlow-sidebar',
				'name'        => __( 'Sidebar', 'harlow' ),
				'description' => __( 'Shown where a page has a Sidebar widget set to this area.', 'harlow' ),
			)
		)
	);
	register_sidebar(
		array_merge(
			$shape,
			array(
				'id'          => 'harlow-footer-widgets',
				'name'        => __( 'Footer widgets', 'harlow' ),
				'description' => __( 'Shown where a page has a Sidebar widget set to this area.', 'harlow' ),
			)
		)
	);
}
add_action( 'widgets_init', 'harlow_sidebar_register', 20 );

/**
 * The area a sidebar widget prints: the one chosen when it is registered, else the first.
 *
 * @param string $chosen The area's id.
 * @return string '' when the site has no area.
 */
function harlow_sidebar_area( $chosen ) {
	global $wp_registered_sidebars;
	if ( '' !== $chosen && isset( $wp_registered_sidebars[ $chosen ] ) ) {
		return $chosen;
	}
	$ids = array_keys( (array) $wp_registered_sidebars );
	return $ids ? (string) $ids[0] : '';
}

/**
 * The areas, for the editor's choice (window.harlowSidebars).
 */
function harlow_sidebar_editor_areas() {
	global $wp_registered_sidebars;
	$areas = array();
	foreach ( (array) $wp_registered_sidebars as $id => $area ) {
		$areas[] = array(
			'value' => $id,
			'label' => $area['name'],
		);
	}
	wp_register_script( 'harlow-sidebar-areas', false, array(), HARLOW_VERSION, false );
	wp_enqueue_script( 'harlow-sidebar-areas' );
	wp_add_inline_script( 'harlow-sidebar-areas', 'window.harlowSidebars = ' . wp_json_encode( $areas ) . ';' );
}
add_action( 'enqueue_block_editor_assets', 'harlow_sidebar_editor_areas' );
