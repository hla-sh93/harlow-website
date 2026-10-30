<?php
/**
 * The page that is not there: live prints its base theme's own (Hello Elementor) between
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
		<h1 class="entry-title"><?php esc_html_e( 'The page can’t be found.', 'harlow' ); ?></h1>
	</div>

	<div class="page-content">
		<p><?php esc_html_e( 'It looks like nothing was found at this location.', 'harlow' ); ?></p>
	</div>

</main>
<?php
get_footer();
