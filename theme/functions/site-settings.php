<?php
/**
 * Site settings, as Elementor's Site Settings: Appearance → Customize → Site settings.
 *
 * Global colours (the four of Elementor's kit and any number of the owner's own) and global
 * fonts, which the design and every colour and font picker of the editor read; the theme's
 * typography (body, links, headings), buttons, pictures, form fields; the layout (content
 * width, space between widgets, the page's background); the lightbox's colours; extra
 * breakpoints for the Styles tab; fonts of the owner's own (uploaded files, Google Fonts);
 * code for the head and the body.
 *
 * One table (harlow_site_settings()) makes the fields and the CSS. Only what the owner set
 * is printed: a site with none of them set is the design's, byte for byte.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The sections of Site settings, in order.
 *
 * @return array<string,string>
 */
function harlow_site_setting_sections() {
	return array(
		'harlow_site_colours'      => __( 'Global colours', 'harlow' ),
		'harlow_site_fonts'        => __( 'Global fonts', 'harlow' ),
		'harlow_styles'            => __( 'Typography', 'harlow' ),
		'harlow_site_buttons'      => __( 'Buttons', 'harlow' ),
		'harlow_site_images'       => __( 'Images', 'harlow' ),
		'harlow_site_fields'       => __( 'Form fields', 'harlow' ),
		'harlow_site_layout'       => __( 'Layout and background', 'harlow' ),
		'harlow_site_lightbox'     => __( 'Lightbox', 'harlow' ),
		'harlow_site_transition'   => __( 'Page transition and preloader', 'harlow' ),
		'harlow_site_breakpoints'  => __( 'Breakpoints', 'harlow' ),
		'harlow_site_custom_fonts' => __( 'Custom fonts', 'harlow' ),
		'harlow_site_code'         => __( 'Custom code', 'harlow' ),
	);
}

/**
 * The words a few kinds of setting may take.
 *
 * @param string $kind weight, transform, style or line.
 * @return array<string,string>
 */
function harlow_site_words( $kind ) {
	$words = array(
		'shown'     => array(
			''     => __( 'Default', 'harlow' ),
			'none' => __( 'Off', 'harlow' ),
		),
		'lazy'      => array(
			''   => __( 'Off', 'harlow' ),
			'on' => __( 'On', 'harlow' ),
		),
		'entrance'  => array(
			''                                  => __( 'Default', 'harlow' ),
			'e-page-transition-fade-out'        => __( 'Fade', 'harlow' ),
			'harlow-transition-slide-out-up'    => __( 'Slide up', 'harlow' ),
			'harlow-transition-slide-out-down'  => __( 'Slide down', 'harlow' ),
			'harlow-transition-slide-out-left'  => __( 'Slide left', 'harlow' ),
			'harlow-transition-slide-out-right' => __( 'Slide right', 'harlow' ),
			'harlow-transition-zoom-out'        => __( 'Zoom', 'harlow' ),
		),
		'exit'      => array(
			''                                 => __( 'Default', 'harlow' ),
			'harlow-transition-fade-in'        => __( 'Fade', 'harlow' ),
			'harlow-transition-slide-in-up'    => __( 'Slide up', 'harlow' ),
			'harlow-transition-slide-in-down'  => __( 'Slide down', 'harlow' ),
			'harlow-transition-slide-in-left'  => __( 'Slide left', 'harlow' ),
			'harlow-transition-slide-in-right' => __( 'Slide right', 'harlow' ),
			'harlow-transition-zoom-in'        => __( 'Zoom', 'harlow' ),
		),
		'preloader' => array(
			''                        => __( 'None', 'harlow' ),
			'harlow-preloader-spin'   => __( 'Spin', 'harlow' ),
			'harlow-preloader-pulse'  => __( 'Pulse', 'harlow' ),
			'harlow-preloader-bounce' => __( 'Bounce', 'harlow' ),
		),
		'weight'    => array(
			''    => __( 'Default', 'harlow' ),
			'100' => '100',
			'200' => '200',
			'300' => '300 Light',
			'400' => '400 Regular',
			'500' => '500 Medium',
			'600' => '600 Semi-bold',
			'700' => '700 Bold',
			'800' => '800 Extra bold',
			'900' => '900',
		),
		'transform' => array(
			''           => __( 'Default', 'harlow' ),
			'none'       => __( 'As typed', 'harlow' ),
			'uppercase'  => __( 'ALL CAPITALS', 'harlow' ),
			'lowercase'  => __( 'all small', 'harlow' ),
			'capitalize' => __( 'Capital At Each Word', 'harlow' ),
		),
		'line'      => array(
			''       => __( 'Default', 'harlow' ),
			'none'   => __( 'None', 'harlow' ),
			'solid'  => __( 'Solid', 'harlow' ),
			'dashed' => __( 'Dashed', 'harlow' ),
			'dotted' => __( 'Dotted', 'harlow' ),
			'double' => __( 'Double', 'harlow' ),
		),
	);
	return $words[ $kind ];
}

/**
 * Every site setting: key => [ section, label, type, css ]. Types: color, px, em, number
 * (0 to 1), font, weight, transform, line, text, textarea, code, image, font-file.
 * `css` is [ selector, property ] pairs (a custom property on :root, or a rule printed with
 * !important above the design and below an element's own style; `@desktop ` before the
 * selector keeps it to desktop widths).
 *
 * @return array<string,array<string,mixed>>
 */
function harlow_site_settings() {
	static $settings = null;
	if ( null !== $settings ) {
		return $settings;
	}
	$w        = '.elementor .elementor-element';
	$settings = array();
	$add      = static function ( $key, $section, $label, $type, $css = array() ) use ( &$settings ) {
		$settings[ $key ] = array(
			'section' => $section,
			'label'   => $label,
			'type'    => $type,
			'css'     => $css,
		);
	};

	// Global colours: Elementor's kit's four, read by the design and the pickers.
	foreach ( array(
		'primary'   => __( 'Primary', 'harlow' ),
		'secondary' => __( 'Secondary', 'harlow' ),
		'text'      => __( 'Text', 'harlow' ),
		'accent'    => __( 'Accent', 'harlow' ),
	) as $key => $label ) {
		$add( 'color_' . $key, 'harlow_site_colours', $label, 'color', array( array( ':root', '--e-global-color-' . $key ) ) );
	}
	$add( 'custom_colours', 'harlow_site_colours', __( 'Your own colours (one per line: Name | #colour)', 'harlow' ), 'textarea' );

	// Global fonts: the kit's four typographies.
	foreach ( array(
		'primary'   => __( 'Primary', 'harlow' ),
		'secondary' => __( 'Secondary', 'harlow' ),
		'text'      => __( 'Text', 'harlow' ),
		'accent'    => __( 'Accent', 'harlow' ),
	) as $key => $label ) {
		$var = '--e-global-typography-' . $key;
		/* translators: %s: a global font (Primary, Secondary, Text, Accent) */
		$add( 'font_' . $key . '_family', 'harlow_site_fonts', sprintf( __( '%s: font', 'harlow' ), $label ), 'font', array( array( ':root', $var . '-font-family' ) ) );
		/* translators: %s: a global font */
		$add( 'font_' . $key . '_weight', 'harlow_site_fonts', sprintf( __( '%s: weight', 'harlow' ), $label ), 'weight', array( array( ':root', $var . '-font-weight' ) ) );
		/* translators: %s: a global font */
		$add( 'font_' . $key . '_size', 'harlow_site_fonts', sprintf( __( '%s: size (px)', 'harlow' ), $label ), 'px', array( array( ':root', $var . '-font-size' ) ) );
		/* translators: %s: a global font */
		$add( 'font_' . $key . '_line', 'harlow_site_fonts', sprintf( __( '%s: line height (em)', 'harlow' ), $label ), 'em', array( array( ':root', $var . '-line-height' ) ) );
		/* translators: %s: a global font */
		$add( 'font_' . $key . '_transform', 'harlow_site_fonts', sprintf( __( '%s: capitals', 'harlow' ), $label ), 'transform', array( array( ':root', $var . '-text-transform' ) ) );
		/* translators: %s: a global font */
		$add( 'font_' . $key . '_spacing', 'harlow_site_fonts', sprintf( __( '%s: letter spacing (px)', 'harlow' ), $label ), 'px', array( array( ':root', $var . '-letter-spacing' ) ) );
	}

	// Typography (Elementor's Theme Style): the body, paragraphs, links, headings. The first
	// keys are the ones stage 9 began with, printed as they were.
	$text = $w . '.elementor-widget-text-editor|' . $w . '.elementor-widget-text-editor p';
	$add( 'heading_color', 'harlow_styles', __( 'Headings colour', 'harlow' ), 'color', array( array( $w . ' .elementor-heading-title', 'color' ) ) );
	$add( 'text_color', 'harlow_styles', __( 'Text colour', 'harlow' ), 'color', array( array( $text, 'color' ) ) );
	$add( 'link_color', 'harlow_styles', __( 'Links colour', 'harlow' ), 'color', array( array( $w . '.elementor-widget-text-editor a', 'color' ) ) );
	$add( 'link_hover', 'harlow_styles', __( 'Links colour on hover', 'harlow' ), 'color', array( array( $w . '.elementor-widget-text-editor a:hover', 'color' ) ) );
	$add( 'text_size', 'harlow_styles', __( 'Text size (px)', 'harlow' ), 'px', array( array( $text, 'font-size' ) ) );
	$add( 'body_font', 'harlow_styles', __( 'Body font', 'harlow' ), 'font', array( array( 'body', 'font-family' ) ) );
	$add( 'body_weight', 'harlow_styles', __( 'Body weight', 'harlow' ), 'weight', array( array( 'body|' . $text, 'font-weight' ) ) );
	$add( 'body_line', 'harlow_styles', __( 'Body line height (em)', 'harlow' ), 'em', array( array( 'body|' . $text, 'line-height' ) ) );
	$add( 'paragraph_spacing', 'harlow_styles', __( 'Space after a paragraph (px)', 'harlow' ), 'px', array( array( $w . '.elementor-widget-text-editor p', 'margin-bottom' ) ) );
	foreach ( array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ) as $h ) {
		$at = $w . ' ' . $h . '.elementor-heading-title';
		$up = strtoupper( $h );
		/* translators: %s: a heading level, H1 to H6 */
		$add( $h . '_size', 'harlow_styles', sprintf( __( 'Heading %s size (px)', 'harlow' ), $up ), 'px', array( array( $at, 'font-size' ) ) );
		/* translators: %s: a heading level */
		$add( $h . '_font', 'harlow_styles', sprintf( __( 'Heading %s font', 'harlow' ), $up ), 'font', array( array( $at, 'font-family' ) ) );
		/* translators: %s: a heading level */
		$add( $h . '_weight', 'harlow_styles', sprintf( __( 'Heading %s weight', 'harlow' ), $up ), 'weight', array( array( $at, 'font-weight' ) ) );
		/* translators: %s: a heading level */
		$add( $h . '_color', 'harlow_styles', sprintf( __( 'Heading %s colour', 'harlow' ), $up ), 'color', array( array( $at, 'color' ) ) );
		/* translators: %s: a heading level */
		$add( $h . '_line', 'harlow_styles', sprintf( __( 'Heading %s line height (em)', 'harlow' ), $up ), 'em', array( array( $at, 'line-height' ) ) );
		/* translators: %s: a heading level */
		$add( $h . '_spacing', 'harlow_styles', sprintf( __( 'Heading %s letter spacing (px)', 'harlow' ), $up ), 'px', array( array( $at, 'letter-spacing' ) ) );
		/* translators: %s: a heading level */
		$add( $h . '_transform', 'harlow_styles', sprintf( __( 'Heading %s capitals', 'harlow' ), $up ), 'transform', array( array( $at, 'text-transform' ) ) );
	}

	// Buttons.
	$button = $w . ' .elementor-button';
	$hover  = $w . ' .elementor-button:hover|' . $w . ' .elementor-button:focus';
	$add( 'button_color', 'harlow_site_buttons', __( 'Buttons colour', 'harlow' ), 'color', array( array( $button, 'background-color' ) ) );
	$add( 'button_words', 'harlow_site_buttons', __( 'Buttons text colour', 'harlow' ), 'color', array( array( $button, 'color' ) ) );
	$add( 'button_hover_color', 'harlow_site_buttons', __( 'Buttons colour on hover', 'harlow' ), 'color', array( array( $hover, 'background-color' ) ) );
	$add( 'button_hover_words', 'harlow_site_buttons', __( 'Buttons text colour on hover', 'harlow' ), 'color', array( array( $hover, 'color' ) ) );
	$add( 'button_font', 'harlow_site_buttons', __( 'Buttons font', 'harlow' ), 'font', array( array( $button, 'font-family' ) ) );
	$add( 'button_size', 'harlow_site_buttons', __( 'Buttons text size (px)', 'harlow' ), 'px', array( array( $button, 'font-size' ) ) );
	$add( 'button_weight', 'harlow_site_buttons', __( 'Buttons weight', 'harlow' ), 'weight', array( array( $button, 'font-weight' ) ) );
	$add( 'button_transform', 'harlow_site_buttons', __( 'Buttons capitals', 'harlow' ), 'transform', array( array( $button, 'text-transform' ) ) );
	$add( 'button_spacing', 'harlow_site_buttons', __( 'Buttons letter spacing (px)', 'harlow' ), 'px', array( array( $button, 'letter-spacing' ) ) );
	$add( 'button_border_style', 'harlow_site_buttons', __( 'Buttons border line', 'harlow' ), 'line', array( array( $button, 'border-style' ) ) );
	$add( 'button_border_width', 'harlow_site_buttons', __( 'Buttons border thickness (px)', 'harlow' ), 'px', array( array( $button, 'border-width' ) ) );
	$add( 'button_border_color', 'harlow_site_buttons', __( 'Buttons border colour', 'harlow' ), 'color', array( array( $button, 'border-color' ) ) );
	$add( 'button_hover_border', 'harlow_site_buttons', __( 'Buttons border colour on hover', 'harlow' ), 'color', array( array( $hover, 'border-color' ) ) );
	$add( 'button_radius', 'harlow_site_buttons', __( 'Buttons rounded corners (px)', 'harlow' ), 'px', array( array( $button, 'border-radius' ) ) );
	$add( 'button_padding_v', 'harlow_site_buttons', __( 'Buttons padding, top and bottom (px)', 'harlow' ), 'px', array( array( $button, 'padding-top' ), array( $button, 'padding-bottom' ) ) );
	$add( 'button_padding_h', 'harlow_site_buttons', __( 'Buttons padding, sides (px)', 'harlow' ), 'px', array( array( $button, 'padding-left' ), array( $button, 'padding-right' ) ) );

	// Images.
	$img = $w . '.elementor-widget-image img';
	$add( 'image_border_style', 'harlow_site_images', __( 'Pictures border line', 'harlow' ), 'line', array( array( $img, 'border-style' ) ) );
	$add( 'image_border_width', 'harlow_site_images', __( 'Pictures border thickness (px)', 'harlow' ), 'px', array( array( $img, 'border-width' ) ) );
	$add( 'image_border_color', 'harlow_site_images', __( 'Pictures border colour', 'harlow' ), 'color', array( array( $img, 'border-color' ) ) );
	$add( 'image_radius', 'harlow_site_images', __( 'Pictures rounded corners (px)', 'harlow' ), 'px', array( array( $img, 'border-radius' ) ) );
	$add( 'image_opacity', 'harlow_site_images', __( 'Pictures opacity (0 to 1)', 'harlow' ), 'number', array( array( $img, 'opacity' ) ) );
	$add( 'image_hover_opacity', 'harlow_site_images', __( 'Pictures opacity on hover (0 to 1)', 'harlow' ), 'number', array( array( $w . '.elementor-widget-image:hover img', 'opacity' ) ) );

	// Form fields (Elementor's own forms).
	$field = '.elementor-field-group .elementor-field:not(.elementor-select-wrapper)|.elementor-field-group .elementor-select-wrapper select';
	$focus = '.elementor-field-group .elementor-field:focus';
	$label = '.elementor-field-group > label|.elementor-field-group .elementor-field-label';
	$add( 'field_label_color', 'harlow_site_fields', __( 'Labels colour', 'harlow' ), 'color', array( array( $label, 'color' ) ) );
	$add( 'field_label_size', 'harlow_site_fields', __( 'Labels size (px)', 'harlow' ), 'px', array( array( $label, 'font-size' ) ) );
	$add( 'field_label_weight', 'harlow_site_fields', __( 'Labels weight', 'harlow' ), 'weight', array( array( $label, 'font-weight' ) ) );
	$add( 'field_text_color', 'harlow_site_fields', __( 'Fields text colour', 'harlow' ), 'color', array( array( $field, 'color' ) ) );
	$add( 'field_text_size', 'harlow_site_fields', __( 'Fields text size (px)', 'harlow' ), 'px', array( array( $field, 'font-size' ) ) );
	$add( 'field_background', 'harlow_site_fields', __( 'Fields background', 'harlow' ), 'color', array( array( $field, 'background-color' ) ) );
	$add( 'field_border_color', 'harlow_site_fields', __( 'Fields border colour', 'harlow' ), 'color', array( array( $field, 'border-color' ) ) );
	$add( 'field_border_width', 'harlow_site_fields', __( 'Fields border thickness (px)', 'harlow' ), 'px', array( array( $field, 'border-width' ) ) );
	$add( 'field_radius', 'harlow_site_fields', __( 'Fields rounded corners (px)', 'harlow' ), 'px', array( array( $field, 'border-radius' ) ) );
	$add( 'field_padding', 'harlow_site_fields', __( 'Fields padding (px)', 'harlow' ), 'px', array( array( $field, 'padding' ) ) );
	$add( 'field_focus_background', 'harlow_site_fields', __( 'Fields background when typed in', 'harlow' ), 'color', array( array( $focus, 'background-color' ) ) );
	$add( 'field_focus_border', 'harlow_site_fields', __( 'Fields border colour when typed in', 'harlow' ), 'color', array( array( $focus, 'border-color' ) ) );

	// Layout and the page's background.
	$add( 'content_width', 'harlow_site_layout', __( 'Content width (px)', 'harlow' ), 'px', array( array( '@desktop .e-con', '--container-max-width' ) ) );
	$add( 'widgets_space', 'harlow_site_layout', __( 'Space between widgets (px)', 'harlow' ), 'px', array( array( '.elementor-element', '--widgets-spacing-row' ), array( '.elementor-element', '--widgets-spacing-column' ) ) );
	$add( 'body_background', 'harlow_site_layout', __( 'Page background colour', 'harlow' ), 'color', array( array( 'body', 'background-color' ) ) );
	$add( 'body_background_image', 'harlow_site_layout', __( 'Page background picture', 'harlow' ), 'image', array( array( 'body', 'background-image' ) ) );

	// The lightbox (assets/js/lightbox.js).
	$add( 'lightbox_background', 'harlow_site_lightbox', __( 'Lightbox background', 'harlow' ), 'color', array( array( '.site-lightbox', 'background-color' ) ) );
	$add( 'lightbox_ui', 'harlow_site_lightbox', __( 'Lightbox buttons colour', 'harlow' ), 'color', array( array( '.site-lightbox__close|.site-lightbox__prev|.site-lightbox__next|.site-lightbox__counter', 'color' ) ) );
	$add( 'lightbox_ui_hover', 'harlow_site_lightbox', __( 'Lightbox buttons colour on hover', 'harlow' ), 'color', array( array( '.site-lightbox__close:hover|.site-lightbox__prev:hover|.site-lightbox__next:hover', 'color' ) ) );

	// The page transition (the site's, Elementor Pro's): shown or not, its colour, how the
	// cover leaves and comes, how long, the preloader picture's size and movement.
	$add( 'transition_shown', 'harlow_site_transition', __( 'Page transition', 'harlow' ), 'shown', array( array( 'e-page-transition', 'display' ) ) );
	$add( 'transition_background', 'harlow_site_transition', __( 'Cover colour', 'harlow' ), 'color', array( array( 'e-page-transition', 'background-color' ) ) );
	$add( 'transition_entrance', 'harlow_site_transition', __( 'As a page appears', 'harlow' ), 'entrance', array( array( 'e-page-transition', '--e-page-transition-entrance-animation' ) ) );
	$add( 'transition_exit', 'harlow_site_transition', __( 'As a page is left', 'harlow' ), 'exit', array( array( 'e-page-transition', '--e-page-transition-exit-animation' ) ) );
	$add( 'transition_duration', 'harlow_site_transition', __( 'Duration (ms)', 'harlow' ), 'ms', array( array( 'e-page-transition', '--e-page-transition-animation-duration' ) ) );
	$add( 'preloader_size', 'harlow_site_transition', __( 'Preloader picture width (px)', 'harlow' ), 'px', array( array( 'e-page-transition', '--e-preloader-width' ) ) );
	$add( 'preloader_animation', 'harlow_site_transition', __( 'Preloader movement', 'harlow' ), 'preloader', array( array( 'e-page-transition', '--e-preloader-animation' ) ) );
	$add( 'lazy_backgrounds', 'harlow_site_layout', __( 'Lazy load background pictures (below the first screens)', 'harlow' ), 'lazy' );

	// Extra breakpoints of the Styles tab (tablet 1024 and mobile 767 are the design's).
	$add( 'bp_widescreen', 'harlow_site_breakpoints', __( 'Widescreen: from (px, empty: off)', 'harlow' ), 'px' );
	$add( 'bp_laptop', 'harlow_site_breakpoints', __( 'Laptop: up to (px, empty: off)', 'harlow' ), 'px' );
	$add( 'bp_tablet_extra', 'harlow_site_breakpoints', __( 'Tablet extra: up to (px, empty: off)', 'harlow' ), 'px' );
	$add( 'bp_mobile_extra', 'harlow_site_breakpoints', __( 'Mobile extra: up to (px, empty: off)', 'harlow' ), 'px' );

	// Fonts of the owner's own: three uploaded, and families from Google Fonts.
	for ( $n = 1; $n <= 3; $n++ ) {
		/* translators: %d: a custom font's number */
		$add( 'custom_font_' . $n . '_name', 'harlow_site_custom_fonts', sprintf( __( 'Font %d: name', 'harlow' ), $n ), 'text' );
		/* translators: %d: a custom font's number */
		$add( 'custom_font_' . $n . '_file', 'harlow_site_custom_fonts', sprintf( __( 'Font %d: file (WOFF2, WOFF, TTF or OTF)', 'harlow' ), $n ), 'font-file' );
		/* translators: %d: a custom font's number */
		$add( 'custom_font_' . $n . '_weight', 'harlow_site_custom_fonts', sprintf( __( 'Font %d: weight of the file', 'harlow' ), $n ), 'weight' );
	}
	$add( 'google_fonts', 'harlow_site_custom_fonts', __( 'Google Fonts to load (one family per line)', 'harlow' ), 'textarea' );

	// Code for the head and the body (Elementor Pro's custom code).
	$add( 'code_head', 'harlow_site_code', __( 'Code in the head', 'harlow' ), 'code' );
	$add( 'code_body', 'harlow_site_code', __( 'Code at the start of the body', 'harlow' ), 'code' );
	$add( 'code_footer', 'harlow_site_code', __( 'Code at the end of the body', 'harlow' ), 'code' );
	return $settings;
}

/**
 * A site setting's value, as the owner set it ('' when not).
 *
 * @param string $key The setting.
 * @return string
 */
function harlow_site_setting( $key ) {
	$value = get_theme_mod( 'harlow_style_' . $key, '' );
	return null === $value || false === $value ? '' : (string) $value;
}

/**
 * A setting's value as CSS, or '' when it is not one.
 *
 * @param string $type  The setting's type.
 * @param string $value Its value.
 * @return string
 */
function harlow_site_css_value( $type, $value ) {
	switch ( $type ) {
		case 'color':
			return harlow_style_colour( $value );
		case 'px':
			return harlow_style_length( $value, 'px' );
		case 'em':
			return is_numeric( $value ) && $value >= 0 ? (string) (float) $value : '';
		case 'number':
			return is_numeric( $value ) ? (string) min( 1, max( 0, (float) $value ) ) : '';
		case 'font':
			return harlow_style_font( $value );
		case 'weight':
			return isset( harlow_site_words( 'weight' )[ $value ] ) ? $value : '';
		case 'transform':
			return isset( harlow_site_words( 'transform' )[ $value ] ) ? $value : '';
		case 'line':
		case 'shown':
		case 'entrance':
		case 'exit':
		case 'preloader':
			return '' !== $value && isset( harlow_site_words( $type )[ $value ] ) ? $value : '';
		case 'ms':
			return is_numeric( $value ) && $value >= 0 ? (int) $value . 'ms' : '';
		case 'image':
			$url = $value ? wp_get_attachment_image_url( (int) $value, 'full' ) : '';
			return $url ? 'url("' . esc_url_raw( $url ) . '")' : '';
	}
	return '';
}

/**
 * The owner's own global colours (custom_colours: "Name | #colour" per line).
 *
 * @return array<int,array{name:string,slug:string,color:string}>
 */
function harlow_custom_colours() {
	$out = array();
	foreach ( preg_split( '/\r\n|\r|\n/', harlow_site_setting( 'custom_colours' ) ) as $line ) {
		$parts = array_map( 'trim', explode( '|', $line, 2 ) );
		if ( 2 !== count( $parts ) || '' === $parts[0] ) {
			continue;
		}
		$colour = harlow_style_colour( $parts[1] );
		$slug   = sanitize_title( $parts[0] );
		if ( '' !== $colour && '' !== $slug ) {
			$out[] = array(
				'name'  => $parts[0],
				'slug'  => $slug,
				'color' => $colour,
			);
		}
	}
	return $out;
}

/**
 * The global colours as the editor's pickers offer them: each its name, its custom property
 * and its paint now (the kit's own value until the owner changes it).
 *
 * @return array<int,array{name:string,slug:string,color:string}>
 */
function harlow_global_colours_for_editor() {
	$kit = array(
		'primary'   => array( __( 'Primary', 'harlow' ), '#6EC1E4' ),
		'secondary' => array( __( 'Secondary', 'harlow' ), '#54595F' ),
		'text'      => array( __( 'Text', 'harlow' ), '#7A7A7A' ),
		'accent'    => array( __( 'Accent', 'harlow' ), '#61CE70' ),
	);
	$out = array();
	foreach ( $kit as $slug => $info ) {
		$set   = harlow_style_colour( harlow_site_setting( 'color_' . $slug ) );
		$out[] = array(
			'name'  => $info[0],
			'slug'  => $slug,
			'color' => '' !== $set ? $set : $info[1],
		);
	}
	return array_merge( $out, harlow_custom_colours() );
}

/**
 * The fonts of the owner's own: the uploaded ones' names, and the Google Fonts families.
 *
 * @return string[]
 */
function harlow_owner_fonts() {
	$fonts = array();
	for ( $n = 1; $n <= 3; $n++ ) {
		$name = trim( harlow_site_setting( 'custom_font_' . $n . '_name' ) );
		if ( '' !== $name && harlow_site_setting( 'custom_font_' . $n . '_file' ) ) {
			$fonts[] = $name;
		}
	}
	return array_values( array_unique( array_merge( $fonts, harlow_google_fonts() ) ) );
}

/**
 * The Google Fonts families the owner listed.
 *
 * @return string[]
 */
function harlow_google_fonts() {
	$families = array();
	foreach ( preg_split( '/\r\n|\r|\n/', harlow_site_setting( 'google_fonts' ) ) as $line ) {
		$line = trim( $line );
		if ( preg_match( '/^[A-Za-z0-9 ]{2,60}$/', $line ) ) {
			$families[] = $line;
		}
	}
	return $families;
}

/**
 * The extra breakpoints the owner turned on, with the design's two: device => media query,
 * in the order their rules are printed (the larger screens first, each smaller one after).
 *
 * @return array<string,string>
 */
function harlow_devices() {
	static $devices = null;
	if ( null !== $devices ) {
		return $devices;
	}
	$max = array(
		'laptop'      => (int) harlow_site_setting( 'bp_laptop' ),
		'tabletExtra' => (int) harlow_site_setting( 'bp_tablet_extra' ),
		'tablet'      => 1024,
		'mobileExtra' => (int) harlow_site_setting( 'bp_mobile_extra' ),
		'mobile'      => 767,
	);
	$max = array_filter( $max );
	arsort( $max );
	$devices = array( 'desktop' => '' );
	$wide    = (int) harlow_site_setting( 'bp_widescreen' );
	if ( $wide > 0 ) {
		$devices['widescreen'] = '(min-width: ' . $wide . 'px)';
	}
	foreach ( $max as $device => $px ) {
		$devices[ $device ] = '(max-width: ' . $px . 'px)';
	}
	return $devices;
}

/**
 * The site settings' CSS: custom properties on :root, the owner's fonts' faces, and the
 * rules each setting changes; '' when nothing is set.
 *
 * @return string
 */
function harlow_site_css() {
	$root    = '';
	$desktop = '';
	$rules   = '';
	foreach ( harlow_site_settings() as $key => $setting ) {
		if ( empty( $setting['css'] ) ) {
			continue;
		}
		$value = harlow_site_css_value( $setting['type'], harlow_site_setting( $key ) );
		if ( '' === $value ) {
			continue;
		}
		foreach ( $setting['css'] as $pair ) {
			list( $selector, $property ) = $pair;
			if ( 0 === strpos( $selector, '@desktop ' ) ) {
				// The kit sets it per element (.e-con) and per device: the desktop's only.
				$desktop .= substr( $selector, 9 ) . '{' . $property . ':' . $value . ' !important;}';
			} elseif ( ':root' === $selector ) {
				$root .= $property . ':' . $value . ';';
			} else {
				$rules .= str_replace( '|', ', ', $selector ) . '{' . $property . ':' . $value . ' !important;}';
			}
		}
	}
	foreach ( harlow_custom_colours() as $colour ) {
		$root .= '--e-global-color-' . $colour['slug'] . ':' . $colour['color'] . ';';
	}
	$css = '' !== $root ? ':root{' . $root . '}' : '';
	if ( '' !== $desktop ) {
		$css .= '@media (min-width: 1025px){' . $desktop . '}';
	}
	for ( $n = 1; $n <= 3; $n++ ) {
		$name = trim( harlow_site_setting( 'custom_font_' . $n . '_name' ) );
		$url  = wp_get_attachment_url( (int) harlow_site_setting( 'custom_font_' . $n . '_file' ) );
		if ( '' === $name || ! $url || preg_match( '/["\\\\]/', $name ) ) {
			continue;
		}
		$formats = array(
			'woff2' => 'woff2',
			'woff'  => 'woff',
			'ttf'   => 'truetype',
			'otf'   => 'opentype',
		);
		$ext     = strtolower( pathinfo( wp_parse_url( $url, PHP_URL_PATH ), PATHINFO_EXTENSION ) );
		$weight  = harlow_site_css_value( 'weight', harlow_site_setting( 'custom_font_' . $n . '_weight' ) );
		$css    .= '@font-face{font-family:"' . $name . '";src:url("' . esc_url_raw( $url ) . '") format("' . ( isset( $formats[ $ext ] ) ? $formats[ $ext ] : 'woff2' ) . '");font-weight:' . ( $weight ? $weight : '400' ) . ';font-display:swap;}';
	}
	// Background pictures below the first screens wait until they are near (Elementor's lazy
	// load): assets/js/lazy-backgrounds.js marks a section as it comes.
	if ( 'on' === harlow_site_setting( 'lazy_backgrounds' ) ) {
		$css .= '.e-con.e-parent:nth-of-type(n+4):not(.e-lazyloaded),.e-con.e-parent:nth-of-type(n+4):not(.e-lazyloaded) *{background-image:none !important;}';
		if ( ! is_admin() ) {
			harlow_enqueue_module( 'lazy-backgrounds' );
		}
	}
	return $css . $rules;
}

/**
 * The site settings in the page's head, after the design's stylesheets; and the Google Fonts
 * the owner listed.
 */
function harlow_site_settings_head() {
	$css = harlow_site_css();
	if ( '' !== $css ) {
		echo '<style id="harlow-site-settings">' . $css . '</style>' . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- CSS built of checked values.
	}
}
add_action( 'wp_head', 'harlow_site_settings_head', 20 );

/**
 * The Google Fonts stylesheet, when the owner listed families (on the page and in the
 * editor's canvas).
 */
function harlow_google_fonts_style() {
	$families = harlow_google_fonts();
	if ( ! $families ) {
		return;
	}
	$query = implode(
		'&',
		array_map(
			static function ( $family ) {
				return 'family=' . str_replace( ' ', '+', $family ) . ':wght@100;200;300;400;500;600;700;800;900';
			},
			$families
		)
	);
	wp_enqueue_style( 'harlow-google-fonts', 'https://fonts.googleapis.com/css2?' . $query . '&display=swap', array(), null ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion -- Google's own address carries what it serves.
}
add_action( 'wp_enqueue_scripts', 'harlow_google_fonts_style', 30 );
add_action( 'enqueue_block_assets', 'harlow_google_fonts_style', 30 );

/**
 * The site settings in the editor's canvas, as an inline style on the canvas stylesheet.
 */
function harlow_site_settings_canvas() {
	if ( ! is_admin() || wp_should_load_block_editor_scripts_and_styles() ) {
		return;
	}
	$css = harlow_site_css();
	if ( '' !== $css ) {
		wp_add_inline_style( 'harlow-canvas', $css );
	}
}
add_action( 'enqueue_block_assets', 'harlow_site_settings_canvas', 20 );

/**
 * The owner's code, where they asked for it (only someone who may write any markup sets it).
 */
function harlow_site_code_head() {
	echo harlow_site_setting( 'code_head' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- saved only by those who may write unfiltered markup (harlow_site_sanitize_code()).
}
add_action( 'wp_head', 'harlow_site_code_head', 99 );

/**
 * The owner's code at the start of the body.
 */
function harlow_site_code_body() {
	echo harlow_site_setting( 'code_body' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- as above.
}
add_action( 'wp_body_open', 'harlow_site_code_body', 99 );

/**
 * The owner's code at the end of the body.
 */
function harlow_site_code_footer() {
	echo harlow_site_setting( 'code_footer' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- as above.
}
add_action( 'wp_footer', 'harlow_site_code_footer', 99 );

/**
 * Custom code is kept as typed for someone who may write any markup, and cleaned to post
 * markup for anyone else.
 *
 * @param string $value The code.
 * @return string
 */
function harlow_site_sanitize_code( $value ) {
	return current_user_can( 'unfiltered_html' ) ? (string) $value : wp_kses_post( (string) $value );
}

/**
 * A font file among the files the Media Library takes, for those who may change the design.
 *
 * @param array<string,string> $types Extension => type.
 * @return array<string,string>
 */
function harlow_font_mimes( $types ) {
	if ( current_user_can( 'edit_theme_options' ) ) {
		$types['woff2'] = 'font/woff2';
		$types['woff']  = 'font/woff';
		$types['ttf']   = 'font/ttf';
		$types['otf']   = 'font/otf';
	}
	return $types;
}
add_filter( 'upload_mimes', 'harlow_font_mimes' );

/**
 * A font file's type, from its name (WordPress cannot read one from its contents).
 *
 * @param array<string,mixed> $checked  What WordPress found.
 * @param string              $file     The file's path.
 * @param string              $filename The file's name.
 * @return array<string,mixed>
 */
function harlow_font_filetype( $checked, $file, $filename ) {
	if ( current_user_can( 'edit_theme_options' ) && preg_match( '/\.(woff2?|ttf|otf)$/i', $filename, $m ) ) {
		$ext                        = strtolower( $m[1] );
		$checked['ext']             = $ext;
		$checked['type']            = 'font/' . $ext;
		$checked['proper_filename'] = $filename;
	}
	return $checked;
}
add_filter( 'wp_check_filetype_and_ext', 'harlow_font_filetype', 10, 3 );

/**
 * Customize → Site settings: a panel of the sections, each setting its field.
 *
 * @param WP_Customize_Manager $wp_customize The Customizer.
 */
function harlow_site_settings_customizer( $wp_customize ) {
	$wp_customize->add_panel(
		'harlow_site',
		array(
			'title'       => __( 'Site settings', 'harlow' ),
			'description' => __( 'As Elementor’s Site Settings. Empty: the design’s own. An element styled in the editor keeps its own.', 'harlow' ),
			'priority'    => 31,
		)
	);
	$priority = 1;
	foreach ( harlow_site_setting_sections() as $section => $title ) {
		$wp_customize->add_section(
			$section,
			array(
				'title'    => $title,
				'panel'    => 'harlow_site',
				'priority' => $priority++,
			)
		);
	}
	$fonts = array( '' => __( 'Default', 'harlow' ) );
	foreach ( array_merge( harlow_site_fonts(), array( 'serif', 'sans-serif', 'monospace' ) ) as $font ) {
		$fonts[ $font ] = $font;
	}
	foreach ( harlow_site_settings() as $key => $setting ) {
		$id       = 'harlow_style_' . $key;
		$type     = $setting['type'];
		$sanitize = array(
			'color'     => 'harlow_style_colour',
			'code'      => 'harlow_site_sanitize_code',
			'textarea'  => 'sanitize_textarea_field',
			'text'      => 'sanitize_text_field',
			'image'     => 'absint',
			'font-file' => 'absint',
		);
		$wp_customize->add_setting(
			$id,
			array(
				'default'           => '',
				'sanitize_callback' => isset( $sanitize[ $type ] ) ? $sanitize[ $type ] : 'sanitize_text_field',
				'transport'         => 'refresh',
			)
		);
		$args = array(
			'label'   => $setting['label'],
			'section' => $setting['section'],
		);
		if ( 'color' === $type ) {
			$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, $id, $args ) );
		} elseif ( 'image' === $type || 'font-file' === $type ) {
			$args['mime_type'] = 'image' === $type ? 'image' : 'font';
			$wp_customize->add_control( new WP_Customize_Media_Control( $wp_customize, $id, $args ) );
		} elseif ( in_array( $type, array( 'weight', 'transform', 'line', 'shown', 'lazy', 'entrance', 'exit', 'preloader' ), true ) ) {
			$args['type']    = 'select';
			$args['choices'] = harlow_site_words( $type );
			$wp_customize->add_control( $id, $args );
		} elseif ( 'font' === $type ) {
			$args['type']    = 'select';
			$args['choices'] = $fonts;
			$wp_customize->add_control( $id, $args );
		} elseif ( 'textarea' === $type || 'code' === $type ) {
			$args['type'] = 'textarea';
			$wp_customize->add_control( $id, $args );
		} elseif ( 'text' === $type ) {
			$wp_customize->add_control( $id, $args );
		} else {
			$args['type']        = 'number';
			$args['input_attrs'] = 'number' === $type ? array(
				'min'  => 0,
				'max'  => 1,
				'step' => 0.05,
			) : array(
				'min'  => 0,
				'step' => 'em' === $type ? 0.05 : 1,
			);
			$wp_customize->add_control( $id, $args );
		}
	}
}
add_action( 'customize_register', 'harlow_site_settings_customizer' );
