<?php
/**
 * The bottom of every page: the site footer, the cookie bar, the language switcher and the
 * cookie settings window, in live's order.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_template_part( 'includes/parts/site-footer' );
get_template_part( 'includes/parts/cookie-bar' );
get_template_part( 'includes/parts/language-switcher' );
get_template_part( 'includes/parts/cookie-dialog' );

wp_footer();
?>
</body>
</html>
