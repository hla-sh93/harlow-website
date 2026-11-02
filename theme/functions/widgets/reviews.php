<?php
/**
 * The reviews widget: its stars, and the carousel it shares with the testimonial carousel
 * (functions/widgets/testimonial-carousel.php, whose stylesheet and script move both), so
 * a page with reviews loads that carousel's assets in its head too.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The carousel's stylesheet and script on a page with reviews, in its head.
 */
function harlow_reviews_enqueue_carousel() {
	if ( in_array( 'harlow/reviews', harlow_page_block_names(), true ) ) {
		harlow_enqueue_widget( 'testimonial-carousel' );
	}
}
add_action( 'wp_enqueue_scripts', 'harlow_reviews_enqueue_carousel', 21 );

/**
 * A rating's stars as Elementor's reviews print them: five, full, partly full (tenths) or
 * empty, each a star character (solid, or an outline for the unmarked ones).
 *
 * @param mixed  $rating   The rating, 0 to 5.
 * @param string $unmarked 'solid' or 'outline'.
 * @return string
 */
function harlow_reviews_stars( $rating, $unmarked ) {
	$rating  = max( 0, min( 5, (float) $rating ) );
	$floored = (int) floor( $rating );
	$char    = 'outline' === $unmarked ? '&#9734;' : '&#9733;';
	$html    = '';
	for ( $star = 1; $star <= 5; $star++ ) {
		if ( $star <= $floored ) {
			$class = 'elementor-star-full';
		} elseif ( $floored + 1 === $star && $rating > $floored ) {
			$class = 'elementor-star-' . max( 1, min( 9, (int) round( ( $rating - $floored ) * 10 ) ) );
		} else {
			$class = 'elementor-star-empty';
		}
		$html .= '<i class="' . $class . '">' . $char . '</i>';
	}
	return '<div class="elementor-star-rating">' . $html . '</div>';
}

/**
 * The social network an icon is of, from its class (e-fab-x-twitter: x-twitter), for
 * Elementor's class of its official colour.
 *
 * @param string $svg The icon's markup.
 * @return string
 */
function harlow_reviews_network( $svg ) {
	return preg_match( '/\be-fa[brs]?-([a-z0-9-]+)/', (string) $svg, $m ) ? $m[1] : '';
}
