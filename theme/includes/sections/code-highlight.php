<?php
/**
 * Code highlight (harlow/code-highlight): Elementor Pro's code highlight widget. The code as
 * typed, inside an xmp (raw text the browser does not read as markup), which
 * assets/js/widgets/code-highlight.js colours by its language, with line numbers, the
 * lines marked and the copy button, in the theme chosen (assets/css/widgets/code-highlight.css).
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_themes   = array( 'default', 'dark', 'okaidia', 'solarizedlight', 'tomorrow', 'twilight' );
$harlow_theme    = in_array( $attributes['theme'], $harlow_themes, true ) ? $attributes['theme'] : 'default';
$harlow_language = preg_replace( '/[^a-z0-9-]/', '', strtolower( (string) $attributes['language'] ) );
$harlow_language = '' !== $harlow_language ? $harlow_language : 'javascript';
$harlow_lines    = preg_replace( '/[^0-9,\-\s]/', '', (string) $attributes['highlightLines'] );

// The box's height and the code's size on each device (Elementor's responsive controls).
$harlow_vars = '';
foreach ( array(
	'height'    => array( 'height', 'heightTablet', 'heightMobile', 'heightUnit', array( 'px', 'vh', 'em' ) ),
	'font-size' => array( 'fontSize', 'fontSizeTablet', 'fontSizeMobile', 'fontSizeUnit', array( 'px', 'em', 'rem', 'vw' ) ),
) as $harlow_name => $harlow_keys ) {
	$harlow_unit = in_array( $attributes[ $harlow_keys[3] ], $harlow_keys[4], true ) ? $attributes[ $harlow_keys[3] ] : 'px';
	foreach ( array( 'desktop', 'tablet', 'mobile' ) as $harlow_at => $harlow_device ) {
		if ( is_numeric( $attributes[ $harlow_keys[ $harlow_at ] ] ) ) {
			$harlow_vars .= '--e-code-' . $harlow_name . '-' . $harlow_device . ': ' . max( 0, (float) $attributes[ $harlow_keys[ $harlow_at ] ] ) . $harlow_unit . '; ';
		}
	}
}

// The code as typed: only the end of the xmp could close it, so that is written otherwise
// (the script reads it back).
$harlow_code = str_ireplace( '</xmp', '&lt;/xmp', (string) $attributes['code'] );

$harlow_box = 'prismjs-' . $harlow_theme
	. ( $attributes['copyToClipboard'] ? ' copy-to-clipboard' : '' )
	. ( $attributes['wordWrap'] ? ' word-wrap' : '' );

$harlow_html = '<div' . harlow_element_attributes( $attributes, 'widget', 'code-highlight.default' ) . '>' . "\n"
	. '<div class="elementor-widget-container">' . "\n"
	. '<div class="' . esc_attr( $harlow_box ) . '"' . ( '' !== $harlow_vars ? ' style="' . esc_attr( trim( $harlow_vars ) ) . '"' : '' ) . '>'
	. '<pre data-line="' . esc_attr( $harlow_lines ) . '" class="highlight-height language-' . esc_attr( $harlow_language ) . ( $attributes['lineNumbers'] ? ' line-numbers' : '' ) . '">'
	. '<code readonly="true" class="language-' . esc_attr( $harlow_language ) . '"><xmp>' . $harlow_code . '</xmp></code>'
	. '</pre>'
	. '</div>' . "\n"
	. '</div>' . "\n"
	. '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes are escaped where they are built; the code is raw text inside an xmp, which nothing but its own end tag (rewritten above) can leave.
