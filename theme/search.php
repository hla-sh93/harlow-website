<?php
/**
 * Search results, as live prints them: its base theme's (Hello Elementor) own list between
 * the site's header and footer.
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
		<h1 class="entry-title">
			<?php esc_html_e( 'Search results for:', 'harlow' ); ?>
			<span><?php echo esc_html( get_search_query( false ) ); ?></span>
		</h1>
	</div>

	<div class="page-content">
		<?php
		if ( have_posts() ) {
			get_template_part( 'includes/parts/post-list' );
		} else {
			echo '<p>' . esc_html__( 'It seems we can\'t find what you\'re looking for.', 'harlow' ) . '</p>';
		}
		?>
	</div>

	<?php get_template_part( 'includes/parts/post-pager' ); ?>

</main>
<?php
get_footer();
