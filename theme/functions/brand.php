<?php
/**
 * Appearance → Customize → Brand colours.
 *
 * The design names its brand colours once, as custom properties in
 * assets/css/design/brand.css (written by _tools/atomize.py), and every class of the
 * vocabulary that uses one of those colours asks for the property instead of the value.
 * Changing a colour here therefore changes it everywhere it is used, and only there:
 * shades the design made from a colour (a transparent blue that fades in, say) keep their
 * own values.
 *
 * The defaults are today's colours. Nothing is printed while a colour is left as it is,
 * so an unchanged site loads exactly the reference's stylesheets.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The brand colours: custom property => label and today's value. Keep in step with
 * BRAND in _tools/atomize.py, which writes the same names and values into brand.css.
 *
 * @return array<string,array{0:string,1:string}>
 */
function harlow_brand_colours() {
	return array(
		'primary' => array( __( 'Brand blue: buttons, links, the header after scrolling', 'harlow' ), '#0165A1' ),
		'dark'    => array( __( 'Dark: dark sections and headings', 'harlow' ), '#001420' ),
		'accent'  => array( __( 'Accent', 'harlow' ), '#00CCCC' ),
		'light'   => array( __( 'Light surface', 'harlow' ), '#F2F2F2' ),
		'text'    => array( __( 'Text', 'harlow' ), '#000000' ),
	);
}

/**
 * The colour of a brand role: the one chosen, or today's.
 *
 * @param string $role A key of harlow_brand_colours().
 * @return string A #rrggbb colour.
 */
function harlow_brand_colour( $role ) {
	$colours = harlow_brand_colours();
	$value   = sanitize_hex_color( (string) get_theme_mod( 'brand_' . $role, $colours[ $role ][1] ) );
	return $value ? $value : $colours[ $role ][1];
}

/**
 * Register the section and one colour field per role.
 *
 * @param WP_Customize_Manager $wp_customize The Customizer.
 */
function harlow_brand_customize_register( $wp_customize ) {
	$wp_customize->add_section(
		'harlow_brand',
		array(
			'title'       => __( 'Brand colours', 'harlow' ),
			'description' => __( 'Each colour changes everywhere the design uses it.', 'harlow' ),
			'priority'    => 25,
		)
	);
	foreach ( harlow_brand_colours() as $role => $colour ) {
		$wp_customize->add_setting(
			'brand_' . $role,
			array(
				'default'           => $colour[1],
				'sanitize_callback' => 'sanitize_hex_color',
			)
		);
		$wp_customize->add_control(
			new WP_Customize_Color_Control(
				$wp_customize,
				'brand_' . $role,
				array(
					'label'   => $colour[0],
					'section' => 'harlow_brand',
				)
			)
		);
	}
}
add_action( 'customize_register', 'harlow_brand_customize_register' );

/**
 * The colours that differ from today's, as custom properties after brand.css.
 */
function harlow_brand_style() {
	$changed = array();
	foreach ( harlow_brand_colours() as $role => $colour ) {
		$value = harlow_brand_colour( $role );
		if ( strtolower( $value ) !== strtolower( $colour[1] ) ) {
			$changed[] = '--hl-color-' . $role . ': ' . $value . ';';
		}
	}
	if ( $changed ) {
		wp_add_inline_style( 'harlow-design-brand', ':root { ' . implode( ' ', $changed ) . ' }' );
	}
}
add_action( 'wp_enqueue_scripts', 'harlow_brand_style', 20 );
