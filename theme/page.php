<?php
/**
 * A page: the site's header, the page's sections, the site's footer.
 *
 * The sections are the page's blocks, inside Elementor's document element, which the
 * page's own design rules (globals-post-<id>.css) are keyed on: its id is live's document
 * id (harlow_document_id()).
 *
 * A page whose kind is on Elementor's canvas (the front page, functions/kinds.php) has no
 * site header, footer or skip link around it: its own sections hold them
 * (harlow/site-part).
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_canvas = harlow_is_canvas( get_queried_object_id() );
get_header( $harlow_canvas ? 'canvas' : null );
while ( have_posts() ) {
	the_post();
	harlow_the_document();
}
get_footer( $harlow_canvas ? 'canvas' : null );
