<?php
/**
 * A testimonial (harlow/testimonial): Elementor's testimonial widget, what someone said
 * with their picture, name and title, the picture beside the name or above it, and a link
 * on the picture, the name and the title when there is one. Without words, picture, name
 * and title, Elementor prints nothing inside the element, and neither does this.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Elementor's classes when the block has none yet, and the alignment, as a class of the
// element (its rule is in assets/css/widgets/testimonial.css).
$harlow_align   = in_array( $attributes['align'], array( 'left', 'center', 'right' ), true ) ? $attributes['align'] : 'center';
$harlow_element = $attributes;
if ( '' === trim( $harlow_element['classes'] ) ) {
	$harlow_element['classes'] = 'elementor-element elementor-widget elementor-widget-testimonial';
}
$harlow_element['classes'] .= ' elementor-testimonial--align-' . $harlow_align;

$harlow_size    = sanitize_key( $attributes['imageSize'] );
$harlow_size    = '' !== $harlow_size ? $harlow_size : 'full';
$harlow_picture = $attributes['image'] && wp_attachment_is_image( $attributes['image'] )
	? wp_get_attachment_image( $attributes['image'], $harlow_size, false, array( 'class' => 'attachment-' . $harlow_size . ' size-' . $harlow_size . ' wp-image-' . (int) $attributes['image'] ) )
	: '';
$harlow_content = trim( (string) $attributes['content'] );
$harlow_name    = trim( (string) $attributes['name'] );
$harlow_job     = trim( (string) $attributes['job'] );
$harlow_link    = '' !== $attributes['link'] ? harlow_link_attributes( $attributes ) : '';
$harlow_place   = 'top' === $attributes['imagePosition'] ? 'top' : 'aside';

$harlow_html = '<div' . harlow_element_attributes( $harlow_element, 'widget', 'testimonial.default' ) . '>';
if ( '' !== $harlow_content || '' !== $harlow_picture || '' !== $harlow_name || '' !== $harlow_job ) {
	$harlow_inner = '';
	if ( '' !== $harlow_content ) {
		$harlow_inner .= '<div class="elementor-testimonial-content">' . wp_kses_post( $harlow_content ) . '</div>' . "\n";
	}
	if ( '' !== $harlow_picture || '' !== $harlow_name || '' !== $harlow_job ) {
		$harlow_meta = '';
		if ( '' !== $harlow_picture ) {
			$harlow_meta .= '<div class="elementor-testimonial-image">' . "\n"
				. ( '' !== $harlow_link ? '<a' . $harlow_link . '>' . $harlow_picture . '</a>' : $harlow_picture ) . "\n"
				. '</div>' . "\n";
		}
		if ( '' !== $harlow_name || '' !== $harlow_job ) {
			$harlow_meta .= '<div class="elementor-testimonial-details">' . "\n";
			// The name and the title are links when the testimonial has one, as on Elementor.
			$harlow_lines = array(
				'name' => $harlow_name,
				'job'  => $harlow_job,
			);
			foreach ( $harlow_lines as $harlow_key => $harlow_words ) {
				if ( '' === $harlow_words ) {
					continue;
				}
				$harlow_meta .= '' !== $harlow_link
					? '<a class="elementor-testimonial-' . $harlow_key . '"' . $harlow_link . '>' . wp_kses_post( $harlow_words ) . '</a>' . "\n"
					: '<div class="elementor-testimonial-' . $harlow_key . '">' . wp_kses_post( $harlow_words ) . '</div>' . "\n";
			}
			$harlow_meta .= '</div>' . "\n";
		}
		$harlow_inner .= '<div class="elementor-testimonial-meta' . ( '' !== $harlow_picture ? ' elementor-has-image' : '' ) . ' elementor-testimonial-image-position-' . $harlow_place . '">' . "\n"
			. '<div class="elementor-testimonial-meta-inner">' . "\n"
			. $harlow_meta
			. '</div>' . "\n"
			. '</div>' . "\n";
	}
	$harlow_html .= "\n" . '<div class="elementor-widget-container">' . "\n"
		. '<div class="elementor-testimonial-wrapper">' . "\n"
		. $harlow_inner
		. '</div>' . "\n"
		. '</div>' . "\n";
}
$harlow_html .= '</div>';
echo $harlow_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the attributes, the words and the picture are escaped where they are built.
