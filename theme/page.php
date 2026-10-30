<?php
/**
 * A page: the site's header, the page's sections, the site's footer.
 *
 * The sections are the page's blocks, inside Elementor's document element, which the
 * page's own design rules (globals-post-<id>.css) are keyed on: its id is live's document
 * id (harlow_document_id()).
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
while ( have_posts() ) {
	the_post();
	harlow_the_document();
}
get_footer();
