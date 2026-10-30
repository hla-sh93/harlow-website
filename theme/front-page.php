<?php
/**
 * The home page: live builds it on Elementor's canvas, its header and footer inside its own
 * sections (harlow/site-part), so the page has no site header or footer around it and no
 * skip link.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header( 'canvas' );
while ( have_posts() ) {
	the_post();
	harlow_the_document();
}
get_footer( 'canvas' );
