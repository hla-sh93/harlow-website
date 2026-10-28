<?php
/**
 * Appearance → Customize: the site's details, read by the header, footer, cookie bar and
 * page transition.
 *
 * Every setting's default is what the live site shows, so a site where nothing has been
 * changed prints the reference exactly. A picture left empty is the design's own picture
 * (from assets/uploads/, the reference's copy of live's uploads); one chosen from the
 * Media Library replaces it, printed by WordPress with its own sizes.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The Customizer sections, in the order they are shown.
 *
 * @return array<string,string> Section id => title.
 */
function harlow_setting_sections() {
	return array(
		'harlow_header_footer' => __( 'Header and footer', 'harlow' ),
		'harlow_social'        => __( 'Social links', 'harlow' ),
		'harlow_language'      => __( 'Language link', 'harlow' ),
		'harlow_cookies'       => __( 'Cookie bar', 'harlow' ),
		'harlow_transition'    => __( 'Page transition', 'harlow' ),
	);
}

/**
 * Every setting: its section, label, kind of field and default.
 *
 * Kinds: text, textarea, url, image (an attachment id; 0 is the design's own picture).
 *
 * @return array<string,array<string,string>>
 */
function harlow_settings() {
	return array(
		'header_logo'           => array(
			'section' => 'harlow_header_footer',
			'label'   => __( 'Header logo', 'harlow' ),
			'type'    => 'image',
		),
		'footer_logo'           => array(
			'section' => 'harlow_header_footer',
			'label'   => __( 'Footer logo', 'harlow' ),
			'type'    => 'image',
		),
		'footer_background'     => array(
			'section' => 'harlow_header_footer',
			'label'   => __( 'Footer background picture', 'harlow' ),
			'type'    => 'image',
		),
		'contact_heading'       => array(
			'section' => 'harlow_header_footer',
			'label'   => __( 'Heading over the social links', 'harlow' ),
			'type'    => 'text',
			'default' => 'Get in touch',
		),
		'copyright'             => array(
			'section' => 'harlow_header_footer',
			'label'   => __( 'Copyright line', 'harlow' ),
			'type'    => 'text',
			'default' => '© 2025 Harlow Group. All Rights Reserved.',
		),
		'credit_text'           => array(
			'section' => 'harlow_header_footer',
			'label'   => __( 'Credit: words before the logo', 'harlow' ),
			'type'    => 'text',
			'default' => 'Powered by',
		),
		'credit_logo'           => array(
			'section' => 'harlow_header_footer',
			'label'   => __( 'Credit: logo', 'harlow' ),
			'type'    => 'image',
		),
		'credit_url'            => array(
			'section' => 'harlow_header_footer',
			'label'   => __( 'Credit: link', 'harlow' ),
			'type'    => 'url',
			'default' => 'https://www.osoustech.com/',
		),
		'social_facebook'       => array(
			'section' => 'harlow_social',
			'label'   => __( 'Facebook', 'harlow' ),
			'type'    => 'url',
			'default' => 'https://www.facebook.com/harlowgroupmea',
		),
		'social_instagram'      => array(
			'section' => 'harlow_social',
			'label'   => __( 'Instagram', 'harlow' ),
			'type'    => 'url',
			'default' => 'https://www.instagram.com/harlow_group_companies/',
		),
		'social_linkedin'       => array(
			'section' => 'harlow_social',
			'label'   => __( 'LinkedIn', 'harlow' ),
			'type'    => 'url',
			'default' => 'https://www.linkedin.com/company/harlow-group-of-companies/',
		),
		'social_x'              => array(
			'section' => 'harlow_social',
			'label'   => __( 'X', 'harlow' ),
			'type'    => 'url',
			'default' => 'https://x.com/Harlow_Group',
		),
		'social_telegram'       => array(
			'section' => 'harlow_social',
			'label'   => __( 'Telegram', 'harlow' ),
			'type'    => 'url',
			'default' => 'https://t.me/HarlowInternationalGroup',
		),
		'language_label'        => array(
			'section' => 'harlow_language',
			'label'   => __( 'Label of the link to the Arabic site', 'harlow' ),
			'type'    => 'text',
			'default' => 'العربية',
		),
		'language_home'         => array(
			'section' => 'harlow_language',
			'label'   => __( 'Where it goes from a page that has no Arabic version', 'harlow' ),
			'type'    => 'url',
			'default' => 'https://www.harlowgroup.com/ar/',
		),
		'cookie_message'        => array(
			'section' => 'harlow_cookies',
			'label'   => __( 'Message', 'harlow' ),
			'type'    => 'textarea',
			'default' => 'We are using cookies to give you the best experience on our website.',
		),
		'cookie_settings_text'  => array(
			'section' => 'harlow_cookies',
			'label'   => __( 'Sentence before the settings link', 'harlow' ),
			'type'    => 'textarea',
			'default' => 'You can find out more about which cookies we are using or switch them off in',
		),
		'cookie_settings_label' => array(
			'section' => 'harlow_cookies',
			'label'   => __( 'Settings link', 'harlow' ),
			'type'    => 'text',
			'default' => 'settings',
		),
		'cookie_accept'         => array(
			'section' => 'harlow_cookies',
			'label'   => __( 'Accept button', 'harlow' ),
			'type'    => 'text',
			'default' => 'Accept',
		),
		'cookie_overview'       => array(
			'section' => 'harlow_cookies',
			'label'   => __( 'Settings window: privacy overview', 'harlow' ),
			'type'    => 'textarea',
			'default' => 'This website uses cookies so that we can provide you with the best user experience possible. Cookie information is stored in your browser and performs functions such as recognising you when you return to our website and helping our team to understand which sections of the website you find most interesting and useful.',
		),
		'cookie_necessary'      => array(
			'section' => 'harlow_cookies',
			'label'   => __( 'Settings window: strictly necessary cookies', 'harlow' ),
			'type'    => 'textarea',
			'default' => 'Strictly Necessary Cookie should be enabled at all times so that we can save your preferences for cookie settings.',
		),
		'cookie_logo'           => array(
			'section' => 'harlow_cookies',
			'label'   => __( 'Settings window: logo', 'harlow' ),
			'type'    => 'image',
		),
		'transition_image'      => array(
			'section' => 'harlow_transition',
			'label'   => __( 'Picture shown while the next page loads', 'harlow' ),
			'type'    => 'image',
		),
	);
}

/**
 * The design's own pictures: what a page shows while no picture has been chosen. The
 * attributes are the live site's, so the markup is the reference's.
 *
 * @return array<string,array<string,mixed>>
 */
function harlow_default_images() {
	return array(
		'header_logo'       => array(
			'width'         => '1193',
			'height'        => '355',
			'src'           => 'assets/uploads/2024/08/New-Harlow-Group-Logo-v01.jpg',
			'class'         => 'attachment-full size-full wp-image-7960',
			'alt'           => '',
			'srcset'        => array(
				'assets/uploads/2024/08/New-Harlow-Group-Logo-v01.jpg 1193w',
				'assets/uploads/2024/08/New-Harlow-Group-Logo-v01-300x89.jpg 300w',
				'assets/uploads/2024/08/New-Harlow-Group-Logo-v01-1024x305.jpg 1024w',
				'assets/uploads/2024/08/New-Harlow-Group-Logo-v01-768x229.jpg 768w',
			),
			'sizes'         => '(max-width: 1193px) 100vw, 1193px',
			'fetchpriority' => 'high',
		),
		'footer_logo'       => array(
			'width'  => '768',
			'height' => '204',
			'src'    => 'assets/uploads/2024/06/New-Harlow-Group-Logo-v01-768x204.png',
			'class'  => 'attachment-medium_large size-medium_large wp-image-8002',
			'alt'    => '',
			'srcset' => array(
				'assets/uploads/2024/06/New-Harlow-Group-Logo-v01-768x204.png 768w',
				'assets/uploads/2024/06/New-Harlow-Group-Logo-v01-300x80.png 300w',
				'assets/uploads/2024/06/New-Harlow-Group-Logo-v01.png 800w',
			),
			'sizes'  => '(max-width: 768px) 100vw, 768px',
		),
		'credit_logo'       => array(
			'src'     => 'assets/uploads/2024/06/osous-logo-full-light.svg',
			'title'   => 'osous-logo-full-light',
			'alt'     => 'osous-logo-full-light',
			'loading' => 'lazy',
		),
		'cookie_logo'       => array(
			'src'    => 'assets/vendor/plugins/gdpr-cookie-compliance/dist/images/gdpr-logo.png',
			'alt'    => get_bloginfo( 'name' ),
			'width'  => '350',
			'height' => '233',
			'class'  => 'img-responsive',
		),
		'transition_image'  => array(
			'src' => 'assets/uploads/2024/09/iva-icon.png',
		),
		'footer_background' => array(),
	);
}

/**
 * How a picture chosen from the Media Library is printed: its size and extra attributes.
 *
 * @return array<string,array{0:string,1:array<string,string>}>
 */
function harlow_image_sizes() {
	return array(
		'header_logo' => array( 'full', array( 'fetchpriority' => 'high' ) ),
		'footer_logo' => array( 'medium_large', array() ),
		'credit_logo' => array( 'full', array( 'loading' => 'lazy' ) ),
		'cookie_logo' => array( 'medium', array( 'class' => 'img-responsive' ) ),
	);
}

/**
 * A setting's value, or its default.
 *
 * @param string $id Setting id from harlow_settings().
 * @return string|int
 */
function harlow_setting( $id ) {
	$settings = harlow_settings();
	if ( ! isset( $settings[ $id ] ) ) {
		return '';
	}
	$default = 'image' === $settings[ $id ]['type'] ? 0 : $settings[ $id ]['default'];
	return get_theme_mod( $id, $default );
}

/**
 * Print a picture: the one chosen in the Customizer, or the design's own.
 *
 * @param string $id Setting id of an image setting.
 */
function harlow_the_image( $id ) {
	$attachment = (int) harlow_setting( $id );
	$sizes      = harlow_image_sizes();
	if ( $attachment && wp_attachment_is_image( $attachment ) ) {
		list( $size, $attr ) = $sizes[ $id ];
		echo wp_get_attachment_image( $attachment, $size, false, $attr );
		return;
	}

	$defaults = harlow_default_images();
	echo '<img';
	foreach ( $defaults[ $id ] as $name => $value ) {
		if ( 'src' === $name ) {
			echo ' src="' . esc_url( get_theme_file_uri( $value ) ) . '"';
		} elseif ( 'srcset' === $name ) {
			$candidates = array_map( 'harlow_srcset_candidate', $value );
			echo ' srcset="' . esc_attr( implode( ', ', $candidates ) ) . '"';
		} else {
			echo ' ' . esc_attr( $name ) . '="' . esc_attr( $value ) . '"';
		}
	}
	echo '>';
}

/**
 * One candidate of a default picture's srcset, with its file made a full address.
 *
 * @param string $candidate "path descriptor", the path inside the theme.
 * @return string
 */
function harlow_srcset_candidate( $candidate ) {
	list( $path, $descriptor ) = explode( ' ', $candidate, 2 );
	return esc_url( get_theme_file_uri( $path ) ) . ' ' . $descriptor;
}

/**
 * The address of a picture setting: the chosen picture's, the design's own, or '' when
 * the design has none (the footer background lives in the design's CSS).
 *
 * @param string $id Setting id of an image setting.
 * @return string
 */
function harlow_image_url( $id ) {
	$attachment = (int) harlow_setting( $id );
	if ( $attachment && wp_attachment_is_image( $attachment ) ) {
		return (string) wp_get_attachment_image_url( $attachment, 'full' );
	}
	$defaults = harlow_default_images();
	return empty( $defaults[ $id ]['src'] ) ? '' : get_theme_file_uri( $defaults[ $id ]['src'] );
}

/**
 * The footer background, when one has been chosen: a style on the footer's container that
 * takes the place of the design's picture.
 *
 * @return string The style attribute, with its leading space, or ''.
 */
function harlow_footer_background_style() {
	$attachment = (int) harlow_setting( 'footer_background' );
	if ( ! $attachment || ! wp_attachment_is_image( $attachment ) ) {
		return '';
	}
	$url = wp_get_attachment_image_url( $attachment, 'full' );
	return ' style="' . esc_attr( 'background-image: url(' . esc_url( $url ) . ')' ) . '"';
}

/**
 * Sanitize a value for its kind of field.
 *
 * @param string $type Kind of field.
 * @return callable
 */
function harlow_setting_sanitizer( $type ) {
	$sanitizers = array(
		'text'     => 'sanitize_text_field',
		'textarea' => 'sanitize_textarea_field',
		'url'      => 'esc_url_raw',
		'image'    => 'absint',
	);
	return $sanitizers[ $type ];
}

/**
 * Register the sections, settings and fields.
 *
 * @param WP_Customize_Manager $wp_customize The Customizer.
 */
function harlow_customize_register( $wp_customize ) {
	$priority = 30;
	foreach ( harlow_setting_sections() as $section => $title ) {
		$wp_customize->add_section(
			$section,
			array(
				'title'    => $title,
				'priority' => $priority++,
			)
		);
	}

	foreach ( harlow_settings() as $id => $setting ) {
		$wp_customize->add_setting(
			$id,
			array(
				'default'           => 'image' === $setting['type'] ? 0 : $setting['default'],
				'sanitize_callback' => harlow_setting_sanitizer( $setting['type'] ),
			)
		);
		if ( 'image' === $setting['type'] ) {
			$wp_customize->add_control(
				new WP_Customize_Media_Control(
					$wp_customize,
					$id,
					array(
						'label'       => $setting['label'],
						'description' => __( 'Empty: the design\'s own picture.', 'harlow' ),
						'section'     => $setting['section'],
						'mime_type'   => 'image',
					)
				)
			);
		} else {
			$wp_customize->add_control(
				$id,
				array(
					'label'   => $setting['label'],
					'section' => $setting['section'],
					'type'    => $setting['type'],
				)
			);
		}
	}
}
add_action( 'customize_register', 'harlow_customize_register' );
