<?php
/**
 * The fallback template. Stage 0 only: it proves the theme is the active one.
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
<?php wp_body_open(); ?>
<main id="harlow-stage-0">
	<h1><?php bloginfo( 'name' ); ?></h1>
	<p><?php esc_html_e( 'The Harlow Group theme is active. The header, footer and pages arrive in the next stages.', 'harlow' ); ?></p>
</main>
<?php wp_footer(); ?>
</body>
</html>
