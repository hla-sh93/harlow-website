<?php
/**
 * A menu in a page (harlow/nav-menu): one of the site's menus (Appearance > Menus), as
 * Elementor's nav menu widget prints it, twice, the second time for its dropdown.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div<?php echo harlow_element_attributes( $attributes, 'widget', 'nav-menu.default' ); ?>>
<div class="elementor-widget-container">
<nav aria-label="<?php esc_attr_e( 'Menu', 'harlow' ); ?>" class="<?php echo esc_attr( $attributes['navClass'] ); ?>">
<?php harlow_nav_menu( $attributes['menu'], $attributes['element'], false, $attributes['vertical'] ); ?>

</nav>
<nav class="elementor-nav-menu--dropdown elementor-nav-menu__container" aria-hidden="true">
<?php harlow_nav_menu( $attributes['menu'], $attributes['element'], true, $attributes['vertical'] ); ?>

</nav>
</div>
</div><?php
