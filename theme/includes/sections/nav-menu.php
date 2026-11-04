<?php
/**
 * A menu in a page (harlow/nav-menu): one of the site's menus (Appearance > Menus), as
 * Elementor's nav menu widget prints it, twice, the second time for its dropdown, with the
 * burger button between them where the menu has one (`elementor-nav-menu--toggle`).
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
<?php if ( false !== strpos( ' ' . $attributes['classes'] . ' ', ' elementor-nav-menu--toggle ' ) ) : ?>
<div class="elementor-menu-toggle" role="button" tabindex="0" aria-label="<?php esc_attr_e( 'Menu Toggle', 'harlow' ); ?>" aria-expanded="false">
<svg aria-hidden="true" role="presentation" class="elementor-menu-toggle__icon--open e-font-icon-svg e-eicon-menu-bar" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M104 333H896C929 333 958 304 958 271S929 208 896 208H104C71 208 42 237 42 271S71 333 104 333ZM104 583H896C929 583 958 554 958 521S929 458 896 458H104C71 458 42 487 42 521S71 583 104 583ZM104 833H896C929 833 958 804 958 771S929 708 896 708H104C71 708 42 737 42 771S71 833 104 833Z"></path></svg><svg aria-hidden="true" role="presentation" class="elementor-menu-toggle__icon--close e-font-icon-svg e-eicon-close" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M742 167L500 408 258 167C246 154 233 150 217 150 196 150 179 158 167 167 154 179 150 196 150 212 150 229 154 242 171 254L408 500 167 742C138 771 138 800 167 829 196 858 225 858 254 829L496 587 738 829C750 842 767 846 783 846 800 846 817 842 829 829 842 817 846 804 846 783 846 767 842 750 829 737L588 500 833 258C863 229 863 200 833 171 804 137 775 137 742 167Z"></path></svg>
</div>
<?php endif; ?>
<nav class="elementor-nav-menu--dropdown elementor-nav-menu__container" aria-hidden="true">
<?php harlow_nav_menu( $attributes['menu'], $attributes['element'], true, $attributes['vertical'] ); ?>

</nav>
</div>
</div><?php
