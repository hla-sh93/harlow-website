<?php
/**
 * The top of a page built on Elementor's canvas (the home page): the document head and the
 * page transition, nothing more.
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
get_template_part( 'includes/parts/page-transition' );
