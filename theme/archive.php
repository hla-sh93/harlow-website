<?php
/**
 * An archive (a category's posts), as live prints it: its base theme's (Hello Elementor)
 * own list between the site's header and footer.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>
<main id="content" class="site-main">

	<div class="page-header">
		<?php
		the_archive_title( '<h1 class="entry-title">', '</h1>' );
		the_archive_description( '<p class="archive-description">', '</p>' );
		?>
	</div>

	<div class="page-content">
		<?php get_template_part( 'includes/parts/post-list' ); ?>
	</div>

	<?php get_template_part( 'includes/parts/post-pager' ); ?>

</main>
<?php
get_footer();
