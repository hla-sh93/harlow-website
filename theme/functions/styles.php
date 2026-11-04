<?php
/**
 * The owner's own styles, as Elementor keeps them: each element block may carry a `style`
 * attribute, a JSON object keyed by device (`desktop`, `tablet`, `mobile`), each holding
 * what the owner set in the editor's Style tab: background (none, a colour, a gradient or a
 * picture), typography, text colour, alignment, padding and margin, width and height, a
 * picture's size, and custom CSS. An element with a style prints one rule per device,
 * keyed on its own id (`.elementor-element-<id>`), in a `<style>` after the design's
 * stylesheets, so the owner's value wins over the design's; an element with none prints
 * nothing and stays the design's, identical to the reference. The editor makes the same
 * CSS (editor/styles.js) for its canvas, from the same table (harlow_style_rules()).
 *
 * Site-wide values are Customize → Site settings (functions/site-settings.php).
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** The devices and the media query of each, as Elementor's breakpoints (1024 / 767). */
const HARLOW_DEVICES = array(
	'desktop' => '',
	'tablet'  => '(max-width: 1024px)',
	'mobile'  => '(max-width: 767px)',
);

/**
 * Widgets whose own box fills the widget and paints over it (an alert's coloured box): the
 * box's background is that box's too, so the colour chosen is the one seen (styles.js COVERS).
 */
const HARLOW_STYLE_COVERS = array(
	'alert'            => ' .elementor-alert',
	'off-canvas'       => ' .e-off-canvas__main',
	// The classic skin's content fills the box beside its picture (the cover skin's lies over it).
	'call-to-action'   => '.elementor-cta--skin-classic .elementor-cta__content',
	'code-highlight'   => ' pre[class*="language-"]',
	'progress-tracker' => ' .elementor-scrolling-tracker-horizontal',
	// The search box (never the full screen skin's overlay, which covers the page).
	'search-form'      => ' .elementor-search-form__container:not(.elementor-search-form--full-screen)',
);

/**
 * The CSS declarations of one device's style, as `[ selector suffix => [ property => value ] ]`:
 * '' for the element itself, ' .elementor-heading-title' and the like for a part of it.
 * Every value is checked here, once, for the page and the editor alike: a colour, a
 * length, a word from a list, or a picture's address.
 *
 * @param array<string,mixed> $style   One device's style.
 * @param string              $kind    The block's kind (heading, text, image, container, button...).
 * @param string              $classes The element's classes (where its design paints it).
 * @return array<string,array<string,string>>
 */
function harlow_style_rules( $style, $kind, $classes = '' ) {
	$rules = array();
	$self  = '';
	// Where words live inside each kind of element: the owner styles "the text" and the rule
	// lands on the element that draws it.
	$text_part = array(
		'heading'        => ' .elementor-heading-title',
		'button'         => ' .elementor-button',
		'icon-list'      => ' .elementor-icon-list-text',
		'accordion-item' => ' .elementor-accordion-title',
	);
	// The title widgets of the Theme Builder are headings.
	foreach ( array( 'site-title', 'page-title', 'post-title', 'archive-title' ) as $title ) {
		$text_part[ $title ] = ' .elementor-heading-title';
	}
	// A text's words are its paragraphs, lists and headings, which the design styles by
	// their own tags: the rule names them too ("|": several selectors).
	$text_part['text'] = '| p| li| h1| h2| h3| h4| h5| h6';
	// The kinds that are a picture (the image, the site's logo, an item's featured picture).
	$picture = in_array( $kind, array( 'image', 'site-logo', 'post-featured-image' ), true );
	$text    = isset( $text_part[ $kind ] ) ? $text_part[ $kind ] : '';
	$add     = static function ( $part, $prop, $value ) use ( &$rules ) {
		if ( null === $value || '' === $value ) {
			return;
		}
		$rules[ $part ][ $prop ] = $value;
	};
	$get     = static function ( $group, $key ) {
		return is_array( $group ) && isset( $group[ $key ] ) ? $group[ $key ] : '';
	};
	$ms      = static function ( $value ) {
		return is_numeric( $value ) ? max( 0, min( 20000, (int) $value ) ) . 'ms' : '';
	};

	// A drop cap (a text's first letter, large, the words beside it): before the part's own
	// typography and spacing, which win over it.
	if ( 'part' === $kind && ! empty( $style['dropCap'] ) ) {
		$add( $self, 'float', 'left' );
		$add( $self, 'font-size', '3em' );
		$add( $self, 'line-height', '1' );
		$add( $self, 'margin-right', '10px' );
	}

	// Background: none, a colour, a gradient, a picture (a slideshow is markup: container.php).
	// A widget's box is its element and the widget container inside it, where Elementor
	// draws a widget's background and the design paints some (a button's, the social icons'
	// bar): both take it, so no colour of the design is left showing around it.
	$box = in_array( $kind, array( 'container', 'part' ), true ) ? $self : '| > .elementor-widget-container';
	if ( array_key_exists( $kind, HARLOW_STYLE_COVERS ) ) {
		$box .= '|' . HARLOW_STYLE_COVERS[ $kind ];
	}
	$bg = isset( $style['background'] ) && is_array( $style['background'] ) ? $style['background'] : array();
	foreach ( harlow_style_background( $bg ) as $prop => $value ) {
		$add( $box, $prop, $value );
	}

	// The overlay over a container's background: Elementor's own layer (`::before`, which
	// its container rules draw when --background-overlay is set), also over a background
	// video or slideshow, and how it changes on hover.
	if ( 'container' === $kind ) {
		$overlay     = isset( $style['overlay'] ) && is_array( $style['overlay'] ) ? $style['overlay'] : array();
		$hover_layer = isset( $style['hover']['overlay'] ) && is_array( $style['hover']['overlay'] ) ? $style['hover']['overlay'] : array();
		$layer       = '::before| > .elementor-background-video-container::before| > .e-con-inner > .elementor-background-video-container::before| > .elementor-background-slideshow::before';
		$on_hover    = ':hover::before|:hover > .elementor-background-video-container::before|:hover > .e-con-inner > .elementor-background-video-container::before|:hover > .elementor-background-slideshow::before';
		$paint       = harlow_style_background( $overlay );
		$hover_paint = harlow_style_background( $hover_layer );
		if ( $paint || $hover_paint ) {
			$add( $self, '--background-overlay', "''" );
		}
		foreach ( $paint as $prop => $value ) {
			$add( $layer, $prop, $value );
		}
		foreach ( $hover_paint as $prop => $value ) {
			$add( $on_hover, $prop, $value );
		}
		if ( is_numeric( $get( $overlay, 'opacity' ) ) ) {
			$add( $self, '--overlay-opacity', (string) min( 1, max( 0, (float) $overlay['opacity'] ) ) );
		}
		if ( is_numeric( $get( $hover_layer, 'opacity' ) ) ) {
			$add( ':hover', '--overlay-opacity', (string) min( 1, max( 0, (float) $hover_layer['opacity'] ) ) );
		}
		$add( $self, '--overlay-mix-blend-mode', harlow_style_word( $get( $overlay, 'blend' ), harlow_style_blends() ) );
		$add( $layer, 'filter', is_array( $get( $overlay, 'filters' ) ) ? harlow_style_filters( $overlay['filters'] ) : '' );
		$add( $on_hover, 'filter', is_array( $get( $hover_layer, 'filters' ) ) ? harlow_style_filters( $hover_layer['filters'] ) : '' );
		$add( $self, '--overlay-transition', $ms( $get( $overlay, 'transition' ) ) );
	}

	// Typography and colour, on the element's words.
	$type = isset( $style['typography'] ) && is_array( $style['typography'] ) ? $style['typography'] : array();
	$add( $text, 'font-family', harlow_style_font( isset( $type['font'] ) ? $type['font'] : '' ) );
	$add( $text, 'font-size', harlow_style_length( isset( $type['size'] ) ? $type['size'] : null, isset( $type['sizeUnit'] ) ? $type['sizeUnit'] : 'px' ) );
	$add( $text, 'font-weight', harlow_style_word( isset( $type['weight'] ) ? (string) $type['weight'] : '', array( '100', '200', '300', '400', '500', '600', '700', '800', '900', 'normal', 'bold' ) ) );
	$add( $text, 'font-style', harlow_style_word( isset( $type['style'] ) ? $type['style'] : '', array( 'normal', 'italic' ) ) );
	$add( $text, 'text-decoration', harlow_style_word( isset( $type['decoration'] ) ? $type['decoration'] : '', array( 'none', 'underline', 'line-through' ) ) );
	$add( $text, 'text-transform', harlow_style_word( isset( $type['transform'] ) ? $type['transform'] : '', array( 'none', 'uppercase', 'lowercase', 'capitalize' ) ) );
	$add( $text, 'line-height', harlow_style_length( isset( $type['lineHeight'] ) ? $type['lineHeight'] : null, isset( $type['lineHeightUnit'] ) ? $type['lineHeightUnit'] : 'em' ) );
	$add( $text, 'letter-spacing', harlow_style_length( isset( $type['letterSpacing'] ) ? $type['letterSpacing'] : null, 'px' ) );
	$add( $text, 'word-spacing', harlow_style_length( $get( $type, 'wordSpacing' ), $get( $type, 'wordSpacingUnit' ) ? $type['wordSpacingUnit'] : 'px', true ) );
	// The words' outline (Elementor's text stroke).
	$stroke = is_array( $get( $type, 'stroke' ) ) ? $type['stroke'] : array();
	$add( $text, '-webkit-text-stroke-width', harlow_style_length( $get( $stroke, 'width' ), 'px' ) );
	$add( $text, 'stroke-width', harlow_style_length( $get( $stroke, 'width' ), 'px' ) );
	$add( $text, '-webkit-text-stroke-color', harlow_style_colour( $get( $stroke, 'color' ) ) );
	$add( $text, 'stroke', harlow_style_colour( $get( $stroke, 'color' ) ) );
	$add( $text, 'color', harlow_style_colour( isset( $style['color'] ) ? $style['color'] : '' ) );
	$add( '' !== $text ? $text : $self, 'mix-blend-mode', harlow_style_word( $get( $style, 'textBlend' ), harlow_style_blends() ) );
	if ( '' !== $text ) {
		// A paragraph's or list's words are the inner blocks': the colour and font reach them too.
		$add( $self, 'text-align', harlow_style_word( isset( $style['align'] ) ? $style['align'] : '', array( 'left', 'center', 'right', 'justify' ) ) );
	} else {
		$add( $self, 'text-align', harlow_style_word( isset( $style['align'] ) ? $style['align'] : '', array( 'left', 'center', 'right', 'justify' ) ) );
	}
	if ( 'button' === $kind ) {
		// The button as one piece: where the design paints it on its box (Elementor's widget
		// container: its colour, and its arrow as a picture), the owner's colour goes there and
		// the button in front turns clear, so the arrow stays; otherwise on the button itself.
		$colour = harlow_style_colour( isset( $style['buttonColor'] ) ? $style['buttonColor'] : '' );
		$hover  = harlow_style_colour( isset( $style['buttonHoverColor'] ) ? $style['buttonHoverColor'] : '' );
		$radius = harlow_style_length( isset( $style['radius'] ) ? $style['radius'] : null, 'px' );
		if ( preg_match( '/(^|\s)hl-bg[ci]-\S*--wc(\s|$)/', (string) $classes ) ) {
			$add( ' .elementor-widget-container', 'background-color', $colour );
			$add( ':hover .elementor-widget-container', 'background-color', $hover );
			$add( $text, 'background-color', '' !== $colour || '' !== $hover ? 'transparent' : '' );
			$add( ' .elementor-widget-container', 'border-radius', $radius );
		} else {
			$add( $text, 'background-color', $colour );
			$add( ' .elementor-button:hover', 'background-color', $hover );
		}
		$add( $text, 'border-radius', $radius );
	}

	// Spacing: four sides, one unit.
	foreach ( array( 'padding', 'margin' ) as $box ) {
		$sides = isset( $style[ $box ] ) && is_array( $style[ $box ] ) ? $style[ $box ] : array();
		$unit  = isset( $sides['unit'] ) ? $sides['unit'] : 'px';
		foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
			if ( isset( $sides[ $side ] ) && '' !== $sides[ $side ] ) {
				$value = harlow_style_length( $sides[ $side ], $unit, 'margin' === $box );
				// A container's own padding is Elementor's custom property; a widget's is CSS's.
				if ( 'container' === $kind && 'padding' === $box ) {
					$add( $self, '--padding-' . $side, $value );
				} elseif ( 'container' === $kind ) {
					$add( $self, '--margin-' . $side, $value );
				} elseif ( 'part' === $kind ) {
					$add( $self, $box . '-' . $side, $value );
				} else {
					$add( $self . ' > .elementor-widget-container', $box . '-' . $side, $value );
				}
			}
		}
	}

	// Size.
	$size = isset( $style['size'] ) && is_array( $style['size'] ) ? $style['size'] : array();
	if ( 'container' === $kind ) {
		$add( $self, '--content-width', harlow_style_length( isset( $size['width'] ) ? $size['width'] : null, isset( $size['widthUnit'] ) ? $size['widthUnit'] : 'px' ) );
		$add( $self, '--min-height', harlow_style_length( isset( $size['height'] ) ? $size['height'] : null, isset( $size['heightUnit'] ) ? $size['heightUnit'] : 'px' ) );
	} else {
		$add( $self, 'width', harlow_style_length( isset( $size['width'] ) ? $size['width'] : null, isset( $size['widthUnit'] ) ? $size['widthUnit'] : 'px' ) );
		$add( $self, 'max-width', harlow_style_length( isset( $size['width'] ) ? $size['width'] : null, isset( $size['widthUnit'] ) ? $size['widthUnit'] : 'px' ) );
		$add( $self, 'min-height', harlow_style_length( isset( $size['height'] ) ? $size['height'] : null, isset( $size['heightUnit'] ) ? $size['heightUnit'] : 'px' ) );
	}

	// A picture's drawn size (its file is chosen by `size` on the block; this is how wide it
	// is drawn), and how it fills its box.
	if ( $picture ) {
		$img = isset( $style['image'] ) && is_array( $style['image'] ) ? $style['image'] : array();
		$add( ' img', 'width', harlow_style_length( isset( $img['width'] ) ? $img['width'] : null, isset( $img['widthUnit'] ) ? $img['widthUnit'] : '%' ) );
		$add( ' img', 'max-width', harlow_style_length( isset( $img['width'] ) ? $img['width'] : null, isset( $img['widthUnit'] ) ? $img['widthUnit'] : '%' ) );
		$add( ' img', 'height', harlow_style_length( isset( $img['height'] ) ? $img['height'] : null, isset( $img['heightUnit'] ) ? $img['heightUnit'] : 'px' ) );
		$add( ' img', 'object-fit', harlow_style_word( isset( $img['fit'] ) ? $img['fit'] : '', array( 'cover', 'contain', 'fill', 'none' ) ) );
		$add( ' img', 'border-radius', harlow_style_length( isset( $img['radius'] ) ? $img['radius'] : null, 'px' ) );
		$add( $self, 'text-align', harlow_style_word( isset( $style['align'] ) ? $style['align'] : '', array( 'left', 'center', 'right' ) ) );
	}

	// A divider's line (Elementor's Colour and Weight): the custom properties its line is
	// drawn with.
	$line = is_array( $get( $style, 'divider' ) ) ? $style['divider'] : array();
	$add( $self, '--divider-color', harlow_style_colour( $get( $line, 'color' ) ) );
	$add( $self, '--divider-border-width', harlow_style_length( $get( $line, 'weight' ), 'px' ) );

	// Border and shadow, on the element.
	// Every side at once, then each side of its own (its line, thickness and colour), then the
	// corners' rounding, all at once or each.
	$border = isset( $style['border'] ) && is_array( $style['border'] ) ? $style['border'] : array();
	$lines  = array( 'none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge' );
	$add( $self, 'border-style', harlow_style_word( isset( $border['style'] ) ? $border['style'] : '', $lines ) );
	$add( $self, 'border-width', harlow_style_length( isset( $border['width'] ) ? $border['width'] : null, 'px' ) );
	$add( $self, 'border-color', harlow_style_colour( isset( $border['color'] ) ? $border['color'] : '' ) );
	foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
		$one = isset( $border[ $side ] ) && is_array( $border[ $side ] ) ? $border[ $side ] : array();
		$add( $self, 'border-' . $side . '-style', harlow_style_word( isset( $one['style'] ) ? $one['style'] : '', $lines ) );
		$add( $self, 'border-' . $side . '-width', harlow_style_length( isset( $one['width'] ) ? $one['width'] : null, 'px' ) );
		$add( $self, 'border-' . $side . '-color', harlow_style_colour( isset( $one['color'] ) ? $one['color'] : '' ) );
	}
	$add( $self, 'border-radius', harlow_style_length( isset( $border['radius'] ) ? $border['radius'] : null, 'px' ) );
	foreach ( array(
		'topLeft'     => 'top-left',
		'topRight'    => 'top-right',
		'bottomRight' => 'bottom-right',
		'bottomLeft'  => 'bottom-left',
	) as $key => $corner ) {
		$add( $self, 'border-' . $corner . '-radius', harlow_style_length( isset( $border[ $key ] ) ? $border[ $key ] : null, 'px' ) );
	}
	$add( $self, 'box-shadow', harlow_style_shadow( isset( $style['shadow'] ) ? $style['shadow'] : null, true ) );
	$add( $text, 'text-shadow', harlow_style_shadow( isset( $style['textShadow'] ) ? $style['textShadow'] : null, false ) );
	if ( isset( $style['opacity'] ) && '' !== $style['opacity'] ) {
		$add( $self, 'opacity', (string) min( 1, max( 0, (float) $style['opacity'] ) ) );
	}
	// How the element mixes with what is under it (Elementor's blend mode).
	$add( $self, 'mix-blend-mode', harlow_style_word( $get( $style, 'blend' ), harlow_style_blends() ) );

	// Layout of a container (Elementor's own custom properties, which its container rules
	// read on the box and on its inner box): flexbox or grid, and how its items sit.
	$layout = isset( $style['layout'] ) && is_array( $style['layout'] ) ? $style['layout'] : array();
	if ( 'container' === $kind ) {
		$add( $self, '--display', harlow_style_word( $get( $layout, 'display' ), array( 'flex', 'grid' ) ) );
		$add( $self, '--flex-direction', harlow_style_word( $get( $layout, 'direction' ), array( 'row', 'column', 'row-reverse', 'column-reverse' ) ) );
		$add( $self, '--justify-content', harlow_style_word( $get( $layout, 'justify' ), array( 'flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly' ) ) );
		$add( $self, '--align-items', harlow_style_word( $get( $layout, 'align' ), array( 'stretch', 'flex-start', 'center', 'flex-end', 'start', 'end', 'baseline' ) ) );
		$add( $self, '--align-content', harlow_style_word( $get( $layout, 'alignContent' ), array( 'flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'stretch' ) ) );
		$add( $self, '--flex-wrap', harlow_style_word( $get( $layout, 'wrap' ), array( 'nowrap', 'wrap', 'wrap-reverse' ) ) );
		$unit = $get( $layout, 'gapUnit' ) ? $get( $layout, 'gapUnit' ) : 'px';
		$add( $self, '--column-gap', harlow_style_length( $get( $layout, 'columnGap' ), $unit ) );
		$add( $self, '--row-gap', harlow_style_length( $get( $layout, 'rowGap' ), $unit ) );
		$add( $self, '--e-con-grid-template-columns', harlow_style_tracks( $get( $layout, 'columns' ), $get( $layout, 'columnsCustom' ) ) );
		$add( $self, '--e-con-grid-template-rows', harlow_style_tracks( $get( $layout, 'rows' ), $get( $layout, 'rowsCustom' ) ) );
		$add( $self, '--grid-auto-flow', harlow_style_word( $get( $layout, 'autoFlow' ), array( 'row', 'column', 'row dense', 'column dense' ) ) );
		$add( $self, '--justify-items', harlow_style_word( $get( $layout, 'justifyItems' ), array( 'start', 'center', 'end', 'stretch' ) ) );
		$add( $self, 'overflow', harlow_style_word( $get( $layout, 'overflow' ), array( 'visible', 'hidden', 'auto' ) ) );
	}

	// Its place among its siblings and on the page (Elementor's Advanced → Layout).
	$item = isset( $style['item'] ) && is_array( $style['item'] ) ? $style['item'] : array();
	switch ( $get( $item, 'widthMode' ) ) {
		case 'full':
			$add( $self, 'width', '100%' );
			$add( $self, 'max-width', '100%' );
			$add( $self, '--container-widget-width', '100%' );
			break;
		case 'inline':
			$add( $self, 'width', 'auto' );
			$add( $self, '--container-widget-width', 'auto' );
			$add( $self, '--container-widget-flex-grow', '0' );
			break;
	}
	$add( $self, '--align-self', harlow_style_word( $get( $item, 'alignSelf' ), array( 'flex-start', 'center', 'flex-end', 'stretch' ) ) );
	$order = $get( $item, 'order' );
	if ( 'start' === $order || 'end' === $order ) {
		$add( $self, '--order', 'start' === $order ? '-99999' : '99999' );
	} elseif ( 'custom' === $order && is_numeric( $get( $item, 'orderCustom' ) ) ) {
		$add( $self, '--order', (string) (int) $get( $item, 'orderCustom' ) );
	}
	$sizes = array(
		'none'   => array( '0', '0' ),
		'grow'   => array( '1', '0' ),
		'shrink' => array( '0', '1' ),
	);
	if ( isset( $sizes[ $get( $item, 'flexSize' ) ] ) ) {
		$add( $self, '--flex-grow', $sizes[ $get( $item, 'flexSize' ) ][0] );
		$add( $self, '--flex-shrink', $sizes[ $get( $item, 'flexSize' ) ][1] );
	}
	$add( $self, 'position', harlow_style_word( $get( $item, 'position' ), array( 'static', 'relative', 'absolute', 'fixed', 'sticky' ) ) );
	$offset_unit = $get( $item, 'offsetUnit' ) ? $get( $item, 'offsetUnit' ) : 'px';
	foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
		$add( $self, $side, harlow_style_length( $get( $item, $side ), $offset_unit, true ) );
	}
	if ( is_numeric( $get( $item, 'zIndex' ) ) ) {
		$add( $self, 'z-index', (string) (int) $get( $item, 'zIndex' ) );
	}

	// Transform (with the point it turns around), and what changes on hover, with its
	// transition.
	$add( $self, 'transform', harlow_style_transform( isset( $style['transform'] ) ? $style['transform'] : null ) );
	$origin = isset( $style['transform'] ) && is_array( $style['transform'] ) ? $style['transform'] : array();
	if ( harlow_style_word( $get( $origin, 'originX' ), array( 'left', 'center', 'right' ) ) || harlow_style_word( $get( $origin, 'originY' ), array( 'top', 'center', 'bottom' ) ) ) {
		$add( $self, 'transform-origin', ( harlow_style_word( $get( $origin, 'originX' ), array( 'left', 'center', 'right' ) ) ? $origin['originX'] : 'center' ) . ' ' . ( harlow_style_word( $get( $origin, 'originY' ), array( 'top', 'center', 'bottom' ) ) ? $origin['originY'] : 'center' ) );
	}
	$hover      = isset( $style['hover'] ) && is_array( $style['hover'] ) ? $style['hover'] : array();
	$hover_text = 'button' === $kind ? ' .elementor-button:hover' : ':hover' . $text;
	$add( $hover_text, 'color', harlow_style_colour( $get( $hover, 'color' ) ) );
	if ( 'button' === $kind ) {
		$add( ' .elementor-button:hover', 'background-color', harlow_style_colour( $get( $hover, 'background' ) ) );
	} elseif ( harlow_style_colour( $get( $hover, 'background' ) ) ) {
		$on_box = in_array( $kind, array( 'container', 'part' ), true ) ? ':hover' : ':hover|:hover > .elementor-widget-container';
		if ( array_key_exists( $kind, HARLOW_STYLE_COVERS ) ) {
			$on_box .= '|:hover' . HARLOW_STYLE_COVERS[ $kind ];
		}
		$add( $on_box, 'background-color', harlow_style_colour( $get( $hover, 'background' ) ) );
		$add( $on_box, 'background-image', 'none' );
	}
	// A gradient or a picture on hover (a button's own box, or the element's).
	foreach ( harlow_style_background( is_array( $get( $hover, 'bg' ) ) ? $hover['bg'] : array() ) as $prop => $value ) {
		$add( 'button' === $kind ? ' .elementor-button:hover' : ':hover', $prop, $value );
	}
	$add( ':hover', 'border-color', harlow_style_colour( $get( $hover, 'borderColor' ) ) );
	$add( ':hover', 'border-style', harlow_style_word( $get( $hover, 'borderStyle' ), $lines ) );
	$add( ':hover', 'border-width', harlow_style_length( $get( $hover, 'borderWidth' ), 'px' ) );
	$add( ':hover', 'border-radius', harlow_style_length( $get( $hover, 'radius' ), 'px' ) );
	$add( ':hover', 'transform', harlow_style_transform( isset( $hover['transform'] ) ? $hover['transform'] : null ) );
	$add( ':hover', 'box-shadow', harlow_style_shadow( isset( $hover['shadow'] ) ? $hover['shadow'] : null, true ) );
	$add( ':hover', 'opacity', is_numeric( $get( $hover, 'opacity' ) ) ? (string) min( 1, max( 0, (float) $hover['opacity'] ) ) : '' );
	if ( $picture && is_array( $get( $hover, 'filters' ) ) ) {
		$add( ':hover img', 'filter', harlow_style_filters( $hover['filters'] ) );
	}
	if ( is_numeric( $get( $style, 'transition' ) ) ) {
		$duration = max( 0, min( 5000, (int) $get( $style, 'transition' ) ) ) . 'ms';
		$add( $self, 'transition', 'all ' . $duration );
		if ( '' !== $text ) {
			$add( $text, 'transition', 'all ' . $duration );
		}
	}

	// A picture's filters.
	if ( $picture && isset( $style['filters'] ) && is_array( $style['filters'] ) ) {
		$add( ' img', 'filter', harlow_style_filters( $style['filters'] ) );
	}

	// An icon's colour and size (icons, icon lists, social icons, a button's icon).
	$icon       = isset( $style['icon'] ) && is_array( $style['icon'] ) ? $style['icon'] : array();
	$icon_parts = array(
		'icon'         => array( ' .elementor-icon', ' .elementor-icon svg' ),
		'icon-list'    => array( ' .elementor-icon-list-icon', ' .elementor-icon-list-icon svg' ),
		'social-icons' => array( ' .elementor-social-icon', ' .elementor-social-icon svg' ),
		'button'       => array( ' .elementor-button-icon', ' .elementor-button-icon svg' ),
		'accordion'    => array( ' .elementor-accordion-icon', ' .elementor-accordion-icon svg' ),
	);
	if ( isset( $icon_parts[ $kind ] ) ) {
		list( $holder, $svg ) = $icon_parts[ $kind ];
		$colour               = harlow_style_colour( $get( $icon, 'color' ) );
		$add( $holder, 'color', $colour );
		// An icon drawn by its outline keeps its line coloured (modules.css), never filled.
		$add( $svg . ':not([fill="none"])', 'fill', $colour );
		$size = harlow_style_length( $get( $icon, 'size' ), 'px' );
		$add( $holder, 'font-size', $size );
		$add( $svg, 'width', $size );
		$add( $svg, 'height', $size );
		if ( 'social-icons' === $kind ) {
			$add( ' .elementor-social-icon', 'background-color', harlow_style_colour( $get( $icon, 'background' ) ) );
		}
	}

	// A button's own box.
	if ( 'button' === $kind && isset( $style['buttonPadding'] ) && is_array( $style['buttonPadding'] ) ) {
		$unit = $get( $style['buttonPadding'], 'unit' ) ? $get( $style['buttonPadding'], 'unit' ) : 'px';
		foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
			$add( ' .elementor-button', 'padding-' . $side, harlow_style_length( $get( $style['buttonPadding'], $side ), $unit ) );
		}
	}

	// The links in a text, and on hover.
	if ( 'text' === $kind && isset( $style['links'] ) && is_array( $style['links'] ) ) {
		$add( ' a', 'color', harlow_style_colour( $get( $style['links'], 'color' ) ) );
		$add( ' a:hover', 'color', harlow_style_colour( $get( $style['links'], 'hover' ) ) );
	}

	if ( isset( $style['animationDuration'] ) && is_numeric( $style['animationDuration'] ) ) {
		$add( $self, 'animation-duration', max( 0, (int) $style['animationDuration'] ) . 'ms' );
	}
	// A part's icon (its colour and size, as a font icon or an SVG) and the gap between
	// what it holds.
	if ( 'part' === $kind ) {
		$colour = harlow_style_colour( $get( $style, 'iconColor' ) );
		$add( $self, 'color', $colour );
		$add( ' svg:not([fill="none"])', 'fill', $colour );
		$size = harlow_style_length( $get( $style, 'iconSize' ), 'px' );
		$add( $self, 'font-size', $size );
		$add( ' svg', 'width', $size );
		$add( ' svg', 'height', $size );
		$add( $self, 'gap', harlow_style_length( $get( $style, 'gap' ), $get( $style, 'gapUnit' ) ? $style['gapUnit'] : 'px' ) );
		// A grid's columns (a list's cards, a gallery), or a text's columns.
		if ( is_numeric( $get( $style, 'columns' ) ) && (int) $style['columns'] >= 1 ) {
			$add( $self, 'grid-template-columns', 'repeat(' . min( 12, (int) $style['columns'] ) . ', minmax(0, 1fr))' );
		}
		if ( is_numeric( $get( $style, 'textColumns' ) ) && (int) $style['textColumns'] >= 1 ) {
			$add( $self, 'column-count', (string) min( 10, (int) $style['textColumns'] ) );
		}
		$add( $self, 'column-gap', harlow_style_length( $get( $style, 'columnGap' ), $get( $style, 'columnGapUnit' ) ? $style['columnGapUnit'] : 'px' ) );
	}
	if ( ! empty( $style['hide'] ) ) {
		$add( $self, 'display', 'none' );
	}
	return $rules;
}

/**
 * The parts of a kind of widget the owner styles on their own (blocks/<kind>/parts.json):
 * key => [ label, selector, controls, states => [ label, selector ] ].
 *
 * @param string $kind The block's kind (its folder).
 * @return array<string,array<string,mixed>>
 */
function harlow_block_parts( $kind ) {
	static $known = array();
	$kind         = sanitize_key( $kind );
	if ( ! isset( $known[ $kind ] ) ) {
		$known[ $kind ] = array();
		$file           = get_theme_file_path( 'blocks/' . $kind . '/parts.json' );
		$data           = file_exists( $file ) ? wp_json_file_decode( $file, array( 'associative' => true ) ) : null;
		foreach ( isset( $data['parts'] ) && is_array( $data['parts'] ) ? $data['parts'] : array() as $part ) {
			$known[ $kind ][ $part['key'] ] = $part;
		}
	}
	return $known[ $kind ];
}

/**
 * The rules of one device's parts: each part's style (and each of its states') on the
 * part's own selector inside the element.
 *
 * @param string              $base The element's selector.
 * @param array<string,mixed> $one  The device's style.
 * @param string              $kind The block's kind.
 * @return string
 */
function harlow_parts_css( $base, $one, $kind ) {
	if ( empty( $one['parts'] ) || ! is_array( $one['parts'] ) ) {
		return '';
	}
	$css = '';
	foreach ( harlow_block_parts( $kind ) as $key => $part ) {
		if ( empty( $one['parts'][ $key ] ) || ! is_array( $one['parts'][ $key ] ) ) {
			continue;
		}
		$value  = $one['parts'][ $key ];
		$states = isset( $part['states'] ) && is_array( $part['states'] ) ? $part['states'] : array();
		// The part as it is, without its states (they are rules of their own).
		$variants = array( array( $part['selector'], array_diff_key( $value, $states ) ) );
		foreach ( $states as $state => $info ) {
			if ( ! empty( $value[ $state ] ) && is_array( $value[ $state ] ) ) {
				$variants[] = array( $info['selector'], $value[ $state ] );
			}
		}
		foreach ( $variants as $variant ) {
			list( $selector, $style ) = $variant;
			foreach ( harlow_style_rules( $style, 'part' ) as $suffix => $decls ) {
				$body = '';
				foreach ( $decls as $prop => $v ) {
					$body .= $prop . ':' . $v . ' !important;';
				}
				$selectors = array();
				foreach ( explode( '|', $selector ) as $at ) {
					foreach ( explode( '|', $suffix ) as $tail ) {
						$selectors[] = $base . $at . $tail;
					}
				}
				$css .= implode( ',', $selectors ) . '{' . $body . '}';
			}
		}
	}
	return $css;
}

/**
 * The owner's custom attributes of an element (`key|value`, one per line, as Elementor's
 * Custom Attributes), as HTML attributes: names of letters, digits, `-`, `_` and `:`, never
 * an event handler, `style`, `class` or `id` (they have their own fields).
 *
 * @param array<string,mixed> $style The element's style.
 * @return string Attributes, each with its leading space.
 */
function harlow_style_attributes( $style ) {
	if ( empty( $style['attributes'] ) || ! is_string( $style['attributes'] ) ) {
		return '';
	}
	$out = '';
	foreach ( preg_split( '/\r\n|\r|\n/', $style['attributes'] ) as $line ) {
		$parts = explode( '|', $line, 2 );
		$name  = strtolower( trim( $parts[0] ) );
		if ( ! preg_match( '/^[a-z][a-z0-9_:.-]*$/', $name ) || 0 === strpos( $name, 'on' )
			|| in_array( $name, array( 'style', 'class', 'id', 'data-id', 'data-settings', 'data-element_type', 'data-e-type', 'data-widget_type' ), true ) ) {
			continue;
		}
		$value = isset( $parts[1] ) ? trim( $parts[1] ) : '';
		// An attribute that holds an address keeps a safe one only (no javascript:, data:).
		if ( in_array( $name, array( 'href', 'src', 'srcset', 'action', 'formaction', 'xlink:href', 'data', 'poster', 'background', 'cite', 'longdesc', 'ping', 'manifest', 'codebase', 'srcdoc' ), true ) ) {
			$value = 'srcdoc' === $name ? '' : esc_url( $value );
			if ( '' === $value ) {
				continue;
			}
		}
		$out .= ' ' . $name . '="' . esc_attr( $value ) . '"';
	}
	return $out;
}

/**
 * An element's motion effects, checked, as assets/js/motion.js reads them: scrolling
 * effects (each with its direction, speed or level, and the part of the screen it runs
 * in), mouse effects, sticky, and the devices they run on; empty when none is on.
 *
 * @param array<string,mixed> $style The element's style.
 * @return array<string,mixed>
 */
function harlow_style_motion( $style ) {
	$in = isset( $style['motion'] ) && is_array( $style['motion'] ) ? $style['motion'] : array();
	if ( ! $in ) {
		return array();
	}
	$out     = array();
	$n       = static function ( $v, $lo, $hi ) {
		return is_numeric( $v ) ? max( $lo, min( $hi, (float) $v ) ) : null;
	};
	$effects = array(
		'y'       => array( 'speed', array( 'up', 'down' ) ),
		'x'       => array( 'speed', array( 'left', 'right' ) ),
		'opacity' => array( 'level', array( 'in', 'out', 'in-out', 'out-in' ) ),
		'blur'    => array( 'level', array( 'in', 'out', 'in-out', 'out-in' ) ),
		'rotate'  => array( 'speed', array( 'left', 'right' ) ),
		'scale'   => array( 'speed', array( 'up', 'down', 'up-down', 'down-up' ) ),
	);
	foreach ( $effects as $key => $shape ) {
		$fx = isset( $in['scroll'][ $key ] ) && is_array( $in['scroll'][ $key ] ) ? $in['scroll'][ $key ] : array();
		if ( empty( $fx['on'] ) ) {
			continue;
		}
		$out['scroll'][ $key ] = array_filter(
			array(
				'direction' => harlow_style_word( isset( $fx['direction'] ) ? $fx['direction'] : '', $shape[1] ),
				$shape[0]   => $n( isset( $fx[ $shape[0] ] ) ? $fx[ $shape[0] ] : null, 0, 15 ),
				'start'     => $n( isset( $fx['start'] ) ? $fx['start'] : null, 0, 100 ),
				'end'       => $n( isset( $fx['end'] ) ? $fx['end'] : null, 0, 100 ),
			),
			static function ( $v ) {
				return null !== $v && '' !== $v;
			}
		);
	}
	foreach ( array( 'track', 'tilt' ) as $key ) {
		$fx = isset( $in['mouse'][ $key ] ) && is_array( $in['mouse'][ $key ] ) ? $in['mouse'][ $key ] : array();
		if ( ! empty( $fx['on'] ) ) {
			$out['mouse'][ $key ] = array(
				'direction' => harlow_style_word( isset( $fx['direction'] ) ? $fx['direction'] : '', array( 'opposite', 'direct' ) ),
				'speed'     => $n( isset( $fx['speed'] ) ? $fx['speed'] : null, 0, 10 ),
			);
		}
	}
	$sticky = isset( $in['sticky'] ) && is_array( $in['sticky'] ) ? $in['sticky'] : array();
	if ( harlow_style_word( isset( $sticky['on'] ) ? $sticky['on'] : '', array( 'top', 'bottom' ) ) ) {
		$out['sticky'] = array(
			'on'            => $sticky['on'],
			'offset'        => $n( isset( $sticky['offset'] ) ? $sticky['offset'] : null, 0, 2000 ),
			'effectsOffset' => $n( isset( $sticky['effectsOffset'] ) ? $sticky['effectsOffset'] : null, 0, 5000 ),
			'column'        => ! empty( $sticky['column'] ),
			'devices'       => isset( $sticky['devices'] ) && is_array( $sticky['devices'] ) ? array_values( array_intersect( $sticky['devices'], array_keys( HARLOW_DEVICES ) ) ) : array(),
		);
	}
	if ( $out && isset( $in['devices'] ) && is_array( $in['devices'] ) ) {
		$out['devices'] = array_values( array_intersect( $in['devices'], array_keys( HARLOW_DEVICES ) ) );
	}
	return $out;
}

/**
 * A shadow as CSS: an object of x, y, blur (and spread for a box) in px with a colour, or
 * an older plain colour (a soft shadow), or ''.
 *
 * @param mixed $shadow The shadow.
 * @param bool  $box    A box's shadow (spread and inset allowed), or a text's.
 * @return string
 */
function harlow_style_shadow( $shadow, $box ) {
	if ( empty( $shadow ) ) {
		return '';
	}
	if ( ! is_array( $shadow ) ) {
		return $box ? '0 10px 30px ' . ( harlow_style_colour( $shadow ) ? harlow_style_colour( $shadow ) : 'rgba(0,0,0,0.15)' ) : '';
	}
	$colour = harlow_style_colour( isset( $shadow['color'] ) ? $shadow['color'] : '' );
	if ( '' === $colour ) {
		return '';
	}
	$n   = static function ( $key ) use ( $shadow ) {
		return isset( $shadow[ $key ] ) && is_numeric( $shadow[ $key ] ) ? (float) $shadow[ $key ] . 'px' : '0px';
	};
	$out = $n( 'x' ) . ' ' . $n( 'y' ) . ' ' . $n( 'blur' );
	if ( $box ) {
		$out = ( ! empty( $shadow['inset'] ) ? 'inset ' : '' ) . $out . ' ' . $n( 'spread' );
	}
	return $out . ' ' . $colour;
}

/**
 * A transform as CSS: offsets in px, a rotation in degrees, a scale; '' when none is set.
 *
 * @param mixed $t The transform.
 * @return string
 */
function harlow_style_transform( $t ) {
	if ( ! is_array( $t ) ) {
		return '';
	}
	$parts = array();
	$x     = isset( $t['x'] ) && is_numeric( $t['x'] ) ? (float) $t['x'] : null;
	$y     = isset( $t['y'] ) && is_numeric( $t['y'] ) ? (float) $t['y'] : null;
	if ( null !== $x || null !== $y ) {
		$parts[] = 'translate(' . ( $x ? $x : 0 ) . 'px, ' . ( $y ? $y : 0 ) . 'px)';
	}
	if ( isset( $t['rotate'] ) && is_numeric( $t['rotate'] ) ) {
		$parts[] = 'rotate(' . (float) $t['rotate'] . 'deg)';
	}
	// Turning in 3D, seen from a distance (perspective first, as Elementor writes it).
	foreach ( array(
		'rotateX' => 'rotateX',
		'rotateY' => 'rotateY',
	) as $key => $fn ) {
		if ( isset( $t[ $key ] ) && is_numeric( $t[ $key ] ) ) {
			$parts[] = $fn . '(' . (float) $t[ $key ] . 'deg)';
		}
	}
	if ( isset( $t['perspective'] ) && is_numeric( $t['perspective'] ) && (float) $t['perspective'] > 0 ) {
		array_unshift( $parts, 'perspective(' . (float) $t['perspective'] . 'px)' );
	}
	if ( isset( $t['scale'] ) && is_numeric( $t['scale'] ) ) {
		$parts[] = 'scale(' . max( 0, min( 5, (float) $t['scale'] ) ) . ')';
	}
	$skew_x = isset( $t['skewX'] ) && is_numeric( $t['skewX'] ) ? (float) $t['skewX'] : null;
	$skew_y = isset( $t['skewY'] ) && is_numeric( $t['skewY'] ) ? (float) $t['skewY'] : null;
	if ( null !== $skew_x || null !== $skew_y ) {
		$parts[] = 'skew(' . ( $skew_x ? $skew_x : 0 ) . 'deg, ' . ( $skew_y ? $skew_y : 0 ) . 'deg)';
	}
	if ( ! empty( $t['flipX'] ) ) {
		$parts[] = 'scaleX(-1)';
	}
	if ( ! empty( $t['flipY'] ) ) {
		$parts[] = 'scaleY(-1)';
	}
	return implode( ' ', $parts );
}

/**
 * A background as CSS declarations: none, a colour, a gradient (linear at an angle or
 * radial from a point, each colour at its own position) or a picture (where it sits and
 * how large it is, as a word or in numbers).
 *
 * @param array<string,mixed> $bg The background.
 * @return array<string,string> Property => value; only what is set.
 */
function harlow_style_background( $bg ) {
	$out = array();
	$get = static function ( $key ) use ( $bg ) {
		return is_array( $bg ) && isset( $bg[ $key ] ) ? $bg[ $key ] : '';
	};
	switch ( $get( 'type' ) ) {
		case 'none':
			$out['background-color'] = 'transparent';
			$out['background-image'] = 'none';
			break;
		case 'color':
			$out['background-color'] = harlow_style_colour( $get( 'color' ) );
			$out['background-image'] = 'none';
			break;
		case 'gradient':
			$from = harlow_style_colour( $get( 'color' ) );
			$to   = harlow_style_colour( $get( 'color2' ) );
			if ( $from && $to ) {
				$stop                    = is_numeric( $get( 'stop' ) ) ? max( 0, min( 100, (float) $get( 'stop' ) ) ) : 0;
				$stop2                   = is_numeric( $get( 'stop2' ) ) ? max( 0, min( 100, (float) $get( 'stop2' ) ) ) : 100;
				$stops                   = $from . ' ' . $stop . '%, ' . $to . ' ' . $stop2 . '%';
				$out['background-color'] = 'transparent';
				if ( 'radial' === $get( 'gradientType' ) ) {
					$at                      = harlow_style_word( $get( 'radialAt' ), harlow_style_positions() );
					$out['background-image'] = 'radial-gradient(at ' . ( $at ? $at : 'center center' ) . ', ' . $stops . ')';
				} else {
					$angle                   = is_numeric( $get( 'angle' ) ) ? (int) $get( 'angle' ) : 180;
					$out['background-image'] = 'linear-gradient(' . $angle . 'deg, ' . $stops . ')';
				}
			}
			break;
		case 'image':
			$url = $get( 'image' ) ? wp_get_attachment_image_url( (int) $get( 'image' ), 'full' ) : '';
			if ( $url ) {
				$out['background-image'] = 'url("' . esc_url_raw( $url ) . '")';
				if ( 'custom' === $get( 'position' ) ) {
					$x                          = harlow_style_length( is_numeric( $get( 'posX' ) ) ? $get( 'posX' ) : 0, $get( 'posXUnit' ) ? $get( 'posXUnit' ) : '%', true );
					$y                          = harlow_style_length( is_numeric( $get( 'posY' ) ) ? $get( 'posY' ) : 0, $get( 'posYUnit' ) ? $get( 'posYUnit' ) : '%', true );
					$out['background-position'] = $x . ' ' . $y;
				} else {
					$out['background-position'] = harlow_style_word( $get( 'position' ), harlow_style_positions() );
				}
				if ( 'custom' === $get( 'size' ) ) {
					$width                  = harlow_style_length( $get( 'sizeWidth' ), $get( 'sizeWidthUnit' ) ? $get( 'sizeWidthUnit' ) : '%' );
					$out['background-size'] = '' !== $width ? $width . ' auto' : '';
				} else {
					$out['background-size'] = harlow_style_word( $get( 'size' ), array( 'auto', 'cover', 'contain' ) );
				}
				$out['background-repeat']     = harlow_style_word( $get( 'repeat' ), array( 'no-repeat', 'repeat', 'repeat-x', 'repeat-y' ) );
				$out['background-attachment'] = harlow_style_word( $get( 'attachment' ), array( 'scroll', 'fixed' ) );
				if ( $get( 'overlay' ) ) {
					$out['background-color']      = harlow_style_colour( $get( 'overlay' ) );
					$out['background-blend-mode'] = 'multiply';
				}
			}
			break;
	}
	return array_filter(
		$out,
		static function ( $value ) {
			return '' !== $value;
		}
	);
}

/**
 * Where a background picture or a radial gradient's centre may sit.
 *
 * @return string[]
 */
function harlow_style_positions() {
	return array( 'center center', 'center left', 'center right', 'top center', 'top left', 'top right', 'bottom center', 'bottom left', 'bottom right' );
}

/**
 * The blend modes Elementor offers.
 *
 * @return string[]
 */
function harlow_style_blends() {
	return array( 'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity' );
}

/**
 * A picture's filters as CSS: brightness, contrast and saturation in %, blur in px, hue in
 * degrees; '' when none is set.
 *
 * @param array<string,mixed> $f The filters.
 * @return string
 */
function harlow_style_filters( $f ) {
	$parts = array();
	foreach ( array(
		'brightness' => '%',
		'contrast'   => '%',
		'saturate'   => '%',
		'blur'       => 'px',
		'hue'        => 'deg',
	) as $key => $unit ) {
		if ( isset( $f[ $key ] ) && is_numeric( $f[ $key ] ) ) {
			$parts[] = ( 'hue' === $key ? 'hue-rotate' : $key ) . '(' . max( 0, (float) $f[ $key ] ) . $unit . ')';
		}
	}
	return implode( ' ', $parts );
}

/**
 * A grid's tracks as CSS: a number of equal columns or rows, or a template typed as CSS
 * grid tracks (numbers, units, fr, auto, repeat(), minmax()).
 *
 * @param mixed $count  How many equal tracks.
 * @param mixed $custom A template, which wins when set.
 * @return string
 */
function harlow_style_tracks( $count, $custom ) {
	if ( is_string( $custom ) && '' !== trim( $custom ) ) {
		$custom = trim( $custom );
		return preg_match( '/^[0-9a-z%().,\s-]+$/i', $custom ) ? $custom : '';
	}
	if ( is_numeric( $count ) && (int) $count >= 1 && (int) $count <= 24 ) {
		return 'repeat(' . (int) $count . ', 1fr)';
	}
	return '';
}

/**
 * A colour as CSS, or '' for anything that is not one: a hex, rgb()/rgba(), hsl(), or one
 * of the brand's custom properties.
 *
 * @param mixed $value The value typed or picked.
 * @return string
 */
function harlow_style_colour( $value ) {
	if ( ! is_string( $value ) ) {
		return '';
	}
	$value = trim( $value );
	if ( preg_match( '/^#[0-9a-f]{3,8}$/i', $value ) || preg_match( '/^(rgb|hsl)a?\(\s*[\d.%,\s\/]+\)$/i', $value )
		|| preg_match( '/^var\(--hl-color-[a-z]+\)$/', $value ) || preg_match( '/^var\(--e-global-color-[a-z0-9-]+\)$/', $value ) || 'transparent' === $value ) {
		return $value;
	}
	return '';
}

/**
 * A length as CSS: a number with its unit; a negative one only where it is allowed.
 *
 * @param mixed  $value    The number.
 * @param string $unit     px, %, em, rem, vw, vh.
 * @param bool   $negative Whether a negative number is allowed (margins).
 * @return string
 */
function harlow_style_length( $value, $unit, $negative = false ) {
	if ( null === $value || '' === $value || ! is_numeric( $value ) ) {
		return '';
	}
	$n = (float) $value;
	if ( $n < 0 && ! $negative ) {
		return '';
	}
	$unit = in_array( $unit, array( 'px', '%', 'em', 'rem', 'vw', 'vh' ), true ) ? $unit : 'px';
	return rtrim( rtrim( number_format( $n, 3, '.', '' ), '0' ), '.' ) . $unit;
}

/**
 * One of a list of words, or ''.
 *
 * @param mixed    $value The value.
 * @param string[] $words The words allowed.
 * @return string
 */
function harlow_style_word( $value, $words ) {
	return is_string( $value ) && in_array( $value, $words, true ) ? $value : '';
}

/**
 * A font family as CSS: one of the site's fonts (the ones its stylesheets load) or a
 * generic family; quoted when it has a space.
 *
 * @param mixed $value The family name.
 * @return string
 */
function harlow_style_font( $value ) {
	if ( ! is_string( $value ) || '' === $value ) {
		return '';
	}
	// A global font (Site settings → Global fonts) is the kit's custom property.
	if ( preg_match( '/^global:(primary|secondary|text|accent)$/', $value, $m ) ) {
		return 'var(--e-global-typography-' . $m[1] . '-font-family), Sans-serif';
	}
	$fonts = array_merge( harlow_site_fonts(), harlow_owner_fonts() );
	if ( ! in_array( $value, $fonts, true ) && ! in_array( $value, array( 'serif', 'sans-serif', 'monospace' ), true ) ) {
		return '';
	}
	return ( false !== strpos( $value, ' ' ) ? '"' . $value . '"' : $value ) . ', Sans-serif';
}

/**
 * The fonts the site's stylesheets load (every @font-face family of the reference).
 *
 * @return string[]
 */
function harlow_site_fonts() {
	static $fonts = null;
	if ( null === $fonts ) {
		$fonts = array();
		$css   = get_theme_file_path( 'assets/css/base.css' );
		// The families of the reference's @font-face rules: the fonts the site really loads.
		if ( file_exists( $css ) && preg_match_all( '/@font-face\s*\{[^}]*font-family:\s*["\']?([^;"\']+)["\']?;/', (string) file_get_contents( $css ), $m ) ) { // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- a file inside the theme.
			$fonts = array_values( array_unique( array_map( 'trim', $m[1] ) ) );
		}
		sort( $fonts );
	}
	return $fonts;
}

/**
 * A scale of the design (the vocabulary's: _vocab/vocabulary.md), read off the design's
 * classes the editor has (editor/design-classes.json): the palette (every colour the
 * design uses, as hex), or the text sizes in px. Offered first in the Style tab.
 *
 * @param string $which 'palette' or 'sizes'.
 * @return string[]
 */
function harlow_design_scale( $which ) {
	static $data = null;
	if ( null === $data ) {
		$data = json_decode( (string) file_get_contents( get_theme_file_path( 'editor/design-classes.json' ) ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- a file inside the theme, not a URL.
		$data = is_array( $data ) && isset( $data['classes'] ) ? $data['classes'] : array();
	}
	$out = array();
	foreach ( $data as $class ) {
		list( , $prop, $value ) = $class;
		if ( 'palette' === $which && ( 'color' === $prop || 'background-color' === $prop ) && preg_match( '/^#[0-9a-f]{6}$/i', $value ) ) {
			$out[ strtoupper( $value ) ] = true;
		}
		if ( 'sizes' === $which && 'font-size' === $prop && preg_match( '/^(\d+)px$/', $value, $m ) ) {
			$out[ (int) $m[1] ] = true;
		}
	}
	$keys = array_keys( $out );
	sort( $keys, 'sizes' === $which ? SORT_NUMERIC : SORT_STRING );
	return array_map( 'strval', $keys );
}

/**
 * The selector of one element for the owner's rules. The element is found by its data-id
 * (the vocabulary took the `elementor-element-<id>` classes off). Named twice, and with the
 * `:not()` the design's background rules end in (each weighs a class), the owner's rule
 * outranks every rule of the design.
 *
 * @param string $element The element's id (data-id).
 * @return string
 */
function harlow_element_selector( $element ) {
	$id = '[data-id="' . preg_replace( '/[^a-z0-9_-]/i', '', (string) $element ) . '"]';
	return '.elementor .elementor-element' . $id . $id . ':not(.elementor-motion-effects-element-type-background)';
}

/**
 * A container's background video: a file of the site or anywhere (Elementor's hosted
 * video), or a YouTube or Vimeo address, muted, from its start to its end time, once or
 * again and again.
 *
 * @param array<string,mixed> $attributes The container's attributes.
 * @return string
 */
function harlow_background_video( $attributes ) {
	$url   = harlow_link_url( $attributes['video'] );
	$start = is_numeric( $attributes['videoStart'] ) ? max( 0, (int) $attributes['videoStart'] ) : 0;
	$end   = is_numeric( $attributes['videoEnd'] ) ? max( 0, (int) $attributes['videoEnd'] ) : 0;
	$once  = ! empty( $attributes['videoOnce'] );
	if ( preg_match( '#(?:youtube\.com/(?:watch\?v=|embed/|shorts/)|youtu\.be/)([\w-]{11})#', $url, $m ) ) {
		$query = array(
			'autoplay'       => 1,
			'mute'           => 1,
			'controls'       => 0,
			'playsinline'    => 1,
			'modestbranding' => 1,
			'rel'            => 0,
			'loop'           => $once ? 0 : 1,
			'playlist'       => $m[1],
		);
		if ( $start ) {
			$query['start'] = $start;
		}
		if ( $end ) {
			$query['end'] = $end;
		}
		return '<iframe class="elementor-background-video-embed" title="' . esc_attr__( 'Background video', 'harlow' ) . '" src="' . esc_url( add_query_arg( $query, 'https://www.youtube-nocookie.com/embed/' . $m[1] ) ) . '" allow="autoplay; encrypted-media" tabindex="-1" aria-hidden="true"></iframe>';
	}
	if ( preg_match( '#vimeo\.com/(?:video/)?(\d+)#', $url, $m ) ) {
		$src = add_query_arg(
			array(
				'background' => 1,
				'autoplay'   => 1,
				'muted'      => 1,
				'loop'       => $once ? 0 : 1,
			),
			'https://player.vimeo.com/video/' . $m[1]
		);
		return '<iframe class="elementor-background-video-embed" title="' . esc_attr__( 'Background video', 'harlow' ) . '" src="' . esc_url( $src . ( $start ? '#t=' . $start . 's' : '' ) ) . '" allow="autoplay; fullscreen" tabindex="-1" aria-hidden="true"></iframe>';
	}
	// A media fragment plays the file from its start to its end time.
	$fragment = ( $start || $end ) ? '#t=' . $start . ( $end ? ',' . $end : '' ) : '';
	return '<video class="elementor-background-video-hosted" role="presentation" autoplay muted playsinline' . ( $once ? '' : ' loop' ) . ' src="' . esc_url( $url . $fragment ) . '"></video>';
}

/**
 * A container's background slideshow (its desktop background of the type "slideshow"):
 * its pictures, one after another, with the first showing before the script starts.
 *
 * @param array<string,mixed> $style The container's style.
 * @return string
 */
function harlow_background_slideshow( $style ) {
	$bg = isset( $style['desktop']['background'] ) && is_array( $style['desktop']['background'] ) ? $style['desktop']['background'] : array();
	if ( ! isset( $bg['type'] ) || 'slideshow' !== $bg['type'] || empty( $bg['slides'] ) || ! is_array( $bg['slides'] ) ) {
		return '';
	}
	$get        = static function ( $key, $fallback ) use ( $bg ) {
		return isset( $bg[ $key ] ) && '' !== $bg[ $key ] ? $bg[ $key ] : $fallback;
	};
	$transition = harlow_style_word( $get( 'transition', 'fade' ), array( 'fade', 'slide_left', 'slide_right', 'slide_up', 'slide_down' ) );
	$ken        = harlow_style_word( $get( 'kenBurns', '' ), array( 'in', 'out' ) );
	$size       = harlow_style_word( $get( 'slideSize', 'cover' ), array( 'cover', 'contain', 'auto' ) );
	$position   = harlow_style_word( $get( 'slidePosition', 'center center' ), harlow_style_positions() );
	$settings   = array(
		'duration' => is_numeric( $get( 'duration', 5000 ) ) ? max( 500, (int) $get( 'duration', 5000 ) ) : 5000,
		'loop'     => ! isset( $bg['loop'] ) || false !== $bg['loop'],
	);
	$slides     = '';
	$first      = true;
	foreach ( $bg['slides'] as $id ) {
		$url = wp_get_attachment_image_url( (int) $id, 'full' );
		if ( ! $url ) {
			continue;
		}
		$image   = 'elementor-background-slideshow__slide__image' . ( $ken ? ' elementor-ken-burns elementor-ken-burns--' . $ken . ( $first ? ' elementor-ken-burns--active' : '' ) : '' );
		$slides .= '<div class="elementor-background-slideshow__slide' . ( $first ? ' is-active' : '' ) . '"><div class="' . esc_attr( $image ) . '" style="' . esc_attr( 'background-image:url("' . esc_url_raw( $url ) . '");background-size:' . ( $size ? $size : 'cover' ) . ';background-position:' . ( $position ? $position : 'center center' ) ) . '"></div></div>';
		$first   = false;
	}
	if ( '' === $slides ) {
		return '';
	}
	harlow_enqueue_module( 'slideshow' );
	$duration = is_numeric( $get( 'transitionDuration', 500 ) ) ? max( 0, (int) $get( 'transitionDuration', 500 ) ) : 500;
	return "\n" . '<div class="elementor-background-slideshow" aria-hidden="true" data-transition="' . esc_attr( $transition ? $transition : 'fade' ) . '" data-harlow-slideshow="' . esc_attr( (string) wp_json_encode( $settings ) ) . '" style="' . esc_attr( '--harlow-slide-transition:' . $duration . 'ms' ) . '">' . $slides . '</div>';
}

/**
 * The CSS of one element's style, every device: `selector { ... } @media (...) { ... }`.
 *
 * @param string              $element The element's id (data-id).
 * @param array<string,mixed> $style   Its `style` attribute, decoded.
 * @param string              $kind    The block's kind.
 * @param string              $classes Its classes (where its design paints it).
 * @return string
 */
function harlow_element_css( $element, $style, $kind, $classes = '' ) {
	$base = harlow_element_selector( $element );
	$out  = '';
	foreach ( harlow_devices() as $device => $media ) {
		if ( empty( $style[ $device ] ) || ! is_array( $style[ $device ] ) ) {
			continue;
		}
		$css = '';
		foreach ( harlow_style_rules( $style[ $device ], $kind, $classes ) as $part => $decls ) {
			$body = '';
			foreach ( $decls as $prop => $value ) {
				// The owner asked for this value: it wins over every rule of the design, whatever
				// its weight (the design's heaviest reach seven classes), as Elementor's own
				// overrides do.
				$body .= $prop . ':' . $value . ' !important;';
			}
			// A part may name several selectors ("| "): each is the element's.
			$selectors = array();
			foreach ( explode( '|', $part ) as $one ) {
				$selectors[] = $base . $one;
			}
			$css .= implode( ',', $selectors ) . '{' . $body . '}';
		}
		$css   .= harlow_parts_css( $base, $style[ $device ], $kind );
		$custom = isset( $style[ $device ]['css'] ) && is_string( $style[ $device ]['css'] ) ? trim( $style[ $device ]['css'] ) : '';
		if ( '' !== $custom ) {
			// `selector` stands for the element, as in Elementor's Custom CSS; stray braces
			// and anything that could close the style tag are taken out.
			$custom = str_replace( array( '</', '<' ), '', $custom );
			$custom = false !== strpos( $custom, 'selector' ) ? str_replace( 'selector', $base, $custom ) : $base . '{' . $custom . '}';
			$css   .= $custom;
		}
		if ( '' !== $css ) {
			$out .= '' === $media ? $css : '@media ' . $media . '{' . $css . '}';
		}
	}
	return $out . harlow_hover_animation_css( $base, $style, $kind ) . harlow_shapes_css( $base, $style );
}

/**
 * Elementor's hover animations (grow, pulse, float, wobble…): name => [ label, the part's
 * own declarations, its declarations on hover ] (editor/hover-animations.json; the
 * keyframes are in modules.css).
 *
 * @return array<string,string[]>
 */
function harlow_hover_animations() {
	static $table = null;
	if ( null === $table ) {
		$table = wp_json_file_decode( get_theme_file_path( 'editor/hover-animations.json' ), array( 'associative' => true ) );
		$table = is_array( $table ) ? $table : array();
	}
	return $table;
}

/**
 * The rules of an element's hover animation, on the part a hover moves (a button's box, a
 * picture, an icon; the element itself otherwise).
 *
 * @param string              $base  The element's selector.
 * @param array<string,mixed> $style Its style.
 * @param string              $kind  Its kind.
 * @return string
 */
function harlow_hover_animation_css( $base, $style, $kind ) {
	$table = harlow_hover_animations();
	$name  = isset( $style['hoverAnimation'] ) && is_string( $style['hoverAnimation'] ) ? $style['hoverAnimation'] : '';
	if ( ! isset( $table[ $name ] ) ) {
		return '';
	}
	$parts = array(
		'button'              => ' .elementor-button',
		'image'               => ' img',
		'site-logo'           => ' img',
		'post-featured-image' => ' img',
		'icon'                => ' .elementor-icon',
		'social-icons'        => ' .elementor-social-icon',
	);
	$part  = isset( $parts[ $kind ] ) ? $parts[ $kind ] : '';
	$heavy = static function ( $decls ) {
		return '' === $decls ? '' : implode( ' !important;', explode( ';', $decls ) ) . ' !important;';
	};
	$css   = '';
	if ( '' !== $table[ $name ][1] ) {
		$css .= $base . $part . '{' . $heavy( $table[ $name ][1] ) . '}';
	}
	return $css . $base . $part . ':hover{' . $heavy( $table[ $name ][2] ) . '}';
}

/**
 * The shape dividers Elementor offers (editor/shapes.json): name => [ label, paths ], each
 * drawn in a 1000 x 100 box against the top edge.
 *
 * @return array<string,array<string,mixed>>
 */
function harlow_shapes() {
	static $shapes = null;
	if ( null === $shapes ) {
		$shapes = wp_json_file_decode( get_theme_file_path( 'editor/shapes.json' ), array( 'associative' => true ) );
		$shapes = is_array( $shapes ) ? $shapes : array();
	}
	return $shapes;
}

/**
 * A container's shape dividers as markup (top, then bottom), from its style.
 *
 * @param array<string,mixed> $style The container's style.
 * @return string
 */
function harlow_shapes_markup( $style ) {
	$shapes = harlow_shapes();
	$out    = '';
	foreach ( array( 'top', 'bottom' ) as $side ) {
		$one  = isset( $style['shapes'][ $side ] ) && is_array( $style['shapes'][ $side ] ) ? $style['shapes'][ $side ] : array();
		$type = isset( $one['type'] ) && is_string( $one['type'] ) ? $one['type'] : '';
		if ( ! isset( $shapes[ $type ] ) ) {
			continue;
		}
		$paths = '';
		foreach ( $shapes[ $type ]['paths'] as $path ) {
			$paths .= '<path class="elementor-shape-fill"' . ( isset( $path['opacity'] ) ? ' opacity="' . esc_attr( (string) $path['opacity'] ) . '"' : '' ) . ' d="' . esc_attr( $path['d'] ) . '"/>';
		}
		// Turned over ("invert"): the fill against the other edge of its box.
		if ( ! empty( $one['invert'] ) ) {
			$paths = '<g transform="matrix(1 0 0 -1 0 100)">' . $paths . '</g>';
		}
		$out .= "\n" . '<div class="elementor-shape elementor-shape-' . $side . '" aria-hidden="true" data-negative="' . ( ! empty( $one['invert'] ) ? 'true' : 'false' ) . '" data-front="' . ( ! empty( $one['front'] ) ? 'true' : 'false' ) . '">'
			. '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none">' . $paths . '</svg></div>';
	}
	return $out;
}

/**
 * A container's shape dividers' size, colour and flip.
 *
 * @param string              $base  The element's selector.
 * @param array<string,mixed> $style Its style.
 * @return string
 */
function harlow_shapes_css( $base, $style ) {
	$css = '';
	foreach ( array( 'top', 'bottom' ) as $side ) {
		$one = isset( $style['shapes'][ $side ] ) && is_array( $style['shapes'][ $side ] ) ? $style['shapes'][ $side ] : array();
		if ( empty( $one['type'] ) ) {
			continue;
		}
		$at    = $base . ' > .elementor-shape-' . $side;
		$svg   = '';
		$width = isset( $one['width'] ) && is_numeric( $one['width'] ) ? max( 100, min( 300, (float) $one['width'] ) ) : null;
		if ( null !== $width ) {
			$svg .= 'width:calc(' . $width . '% + 1.3px) !important;';
		}
		$height = harlow_style_length( isset( $one['height'] ) ? $one['height'] : null, 'px' );
		if ( '' !== $height ) {
			$svg .= 'height:' . $height . ' !important;';
		}
		if ( ! empty( $one['flip'] ) ) {
			$svg .= 'transform:translateX(-50%) rotateY(180deg) !important;';
		}
		if ( '' !== $svg ) {
			$css .= $at . ' svg{' . $svg . '}';
		}
		$colour = harlow_style_colour( isset( $one['color'] ) ? $one['color'] : '' );
		if ( '' !== $colour ) {
			$css .= $at . ' .elementor-shape-fill{fill:' . $colour . ' !important;}';
		}
		foreach ( array(
			'heightTablet' => HARLOW_DEVICES['tablet'],
			'heightMobile' => HARLOW_DEVICES['mobile'],
		) as $key => $media ) {
			$h = harlow_style_length( isset( $one[ $key ] ) ? $one[ $key ] : null, 'px' );
			if ( '' !== $h ) {
				$css .= '@media ' . $media . '{' . $at . ' svg{height:' . $h . ' !important;}}';
			}
		}
	}
	return $css;
}

/**
 * The styles of the elements printed so far on this page, collected by
 * harlow_element_attributes() and printed once in the footer (and in the head of the
 * editor's canvas by editor/styles.js, live).
 *
 * @param string|null $css A rule to add, or null to read them all.
 * @return string
 */
function harlow_collected_styles( $css = null ) {
	static $all = '';
	if ( null !== $css ) {
		$all .= $css;
	}
	return $all;
}

/**
 * Print the collected element styles.
 */
function harlow_print_element_styles() {
	$css = harlow_collected_styles();
	if ( '' !== $css ) {
		echo '<style id="harlow-element-styles">' . $css . '</style>' . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- CSS built of checked values in harlow_style_rules().
	}
}
add_action( 'wp_footer', 'harlow_print_element_styles', 5 );

/**
 * Decode a block's `style` attribute.
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @return array<string,mixed>
 */
function harlow_block_style( $attributes ) {
	$style = isset( $attributes['style'] ) ? $attributes['style'] : array();
	if ( is_string( $style ) ) {
		$style = json_decode( $style, true );
	}
	return is_array( $style ) ? $style : array();
}
