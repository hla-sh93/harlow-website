<?php
/**
 * The top of every page: the document head, the page transition, the skip link and the
 * site header.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php
wp_body_open();

// Live shows no page transition on its 404 page.
if ( ! is_404() ) {
	get_template_part( 'includes/parts/page-transition' );
}
?>
<a class="skip-link screen-reader-text" href="#content"><?php esc_html_e( 'Skip to content', 'harlow' ); ?></a>
<?php
get_template_part( 'includes/parts/site-header' );
