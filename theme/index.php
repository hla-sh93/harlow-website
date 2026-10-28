<?php
/**
 * The fallback template.
 *
 * Stage 1: every page has the site's header and footer, and in between only its title on
 * a dark band, so the header's white menu can be read. The pages get their sections in
 * stage 3, and their kinds their own templates.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>
<main id="content" class="site-main" style="background: #001420; color: #fff; min-height: 120vh; padding: 180px 20px 120px; text-align: center;">
	<h1><?php echo esc_html( is_404() ? __( 'Page not found', 'harlow' ) : get_the_title( get_queried_object_id() ) ); ?></h1>
	<p><?php esc_html_e( 'This page gets its sections in stage 3.', 'harlow' ); ?></p>
</main>
<?php
get_footer();
