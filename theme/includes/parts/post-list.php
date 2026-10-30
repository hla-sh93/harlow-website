<?php
/**
 * The list of a search or an archive, as live's base theme (Hello Elementor) prints it:
 * each item's title, featured picture and excerpt, and the pager.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

while ( have_posts() ) {
	the_post();
	$harlow_link = get_permalink();
	?>
	<article class="post">
		<?php
		printf( '<h2 class="entry-title"><a href="%s">%s</a></h2>', esc_url( $harlow_link ), wp_kses_post( get_the_title() ) );
		if ( has_post_thumbnail() ) {
			printf( '<a href="%s">%s</a>', esc_url( $harlow_link ), get_the_post_thumbnail( null, 'large' ) );
		}
		the_excerpt();
		?>
	</article>
	<?php
}
