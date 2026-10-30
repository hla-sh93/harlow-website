<?php
/**
 * An item's page (a post, news item, project, gallery item or job): the site's header, the
 * item's single template, the site's footer.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
while ( have_posts() ) {
	the_post();
	harlow_the_single();
}
get_footer();
