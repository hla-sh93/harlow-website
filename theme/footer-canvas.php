<?php
/**
 * The bottom of a page built on Elementor's canvas (the home page): the cookie bar, the
 * language switcher and the cookie settings window, without the site footer, which the
 * page holds itself.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_template_part( 'includes/parts/cookie-bar' );
get_template_part( 'includes/parts/language-switcher' );
get_template_part( 'includes/parts/cookie-dialog' );

wp_footer();
?>
</body>
</html>
