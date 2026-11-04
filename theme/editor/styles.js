/**
 * The Style tab of every element block, as Elementor has it: background (none, colour,
 * gradient, picture), typography, colour, alignment, padding and margin, size, border,
 * a picture's size, custom CSS, each for desktop, tablet or mobile (the device the editor
 * previews). The choices are kept in the block's `style` attribute, keyed by device;
 * the canvas draws them at once from the same CSS the page prints
 * (functions/styles.php: harlow_style_rules(), the one table both sides follow). The
 * design's own values are offered first (the brand's colours, the palette, the type scale)
 * and any value may be typed.
 */
import {
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import {
	BaseControl,
	BoxControl,
	Button,
	CheckboxControl,
	ColorPalette,
	ColorPicker,
	Dropdown,
	PanelBody,
	RangeControl,
	SelectControl,
	TextareaControl,
	ToggleControl,
	TextControl,
	VisuallyHidden,
} from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __, sprintf } from '@wordpress/i18n';
import {
	alignCenter,
	alignJustify,
	alignLeft,
	alignNone,
	alignRight,
	arrowDown,
	arrowLeft,
	arrowRight,
	arrowUp,
	background as backgroundIcon,
	border as borderIcon,
	code,
	desktop,
	fullscreen,
	justifyBottom,
	justifyCenter,
	justifyCenterVertical,
	justifyLeft,
	justifyRight,
	justifySpaceAround,
	justifySpaceBetween,
	justifySpaceEvenly,
	justifyStretchVertical,
	justifyTop,
	layout as layoutIcon,
	mobile,
	positionCenter,
	rotateLeft as resetIcon,
	rotateRight,
	seen,
	shadow as shadowIcon,
	sidesAll,
	styles as stylesIcon,
	tablet,
	tool,
	typography as typographyIcon,
} from '@wordpress/icons';

import HOVER_ANIMATIONS from './hover-animations.json';
import SHAPES from './shapes.json';
import { notePicked, PICKED, usePictureUrl } from './shared';
import { DesignPicture } from '../blocks/button/edit';
import { DesignBackground } from '../blocks/container/edit';

const site = window.harlowEditor || {};

/**
 * The parts of each kind of widget the owner styles on their own (an accordion's title and
 * content, a list's icon and text…), from blocks/<name>/parts.json: each a label, the part's
 * selector inside the element, the controls it offers, and its states (hover, active) with
 * their own selectors (harlow_block_parts()).
 */
const PARTS = {};
const partFiles = require.context( '../blocks', true, /\/parts\.json$/ );
partFiles.keys().forEach( ( path ) => {
	PARTS[ path.split( '/' )[ 1 ] ] = partFiles( path ).parts || [];
} );

/**
 * The devices and their media queries, in the order their rules print (harlow_devices():
 * the design's tablet and mobile, and the extra breakpoints of Site settings).
 */
const DEVICE_LIST = Object.entries(
	site.devices || {
		desktop: '',
		tablet: '(max-width: 1024px)',
		mobile: '(max-width: 767px)',
	}
);
const DEVICES = {
	Tablet: [ 'tablet', '(max-width: 1024px)' ],
	Mobile: [ 'mobile', '(max-width: 767px)' ],
};
/** The editor's preview each device is shown in. */
const PREVIEW = {
	desktop: 'Desktop',
	widescreen: 'Desktop',
	laptop: 'Desktop',
	tabletExtra: 'Tablet',
	tablet: 'Tablet',
	mobileExtra: 'Mobile',
	mobile: 'Mobile',
};

/** The brand's colours and the design's palette, offered first in every colour picker. */
const BRAND = [
	{
		name: __( 'Brand blue', 'harlow' ),
		color: 'var(--hl-color-primary)',
		paint: '#0165A1',
		slug: 'primary',
	},
	{
		name: __( 'Dark', 'harlow' ),
		color: 'var(--hl-color-dark)',
		paint: '#001420',
		slug: 'dark',
	},
	{
		name: __( 'Accent', 'harlow' ),
		color: 'var(--hl-color-accent)',
		paint: '#00CCCC',
		slug: 'accent',
	},
	{
		name: __( 'Light', 'harlow' ),
		color: 'var(--hl-color-light)',
		paint: '#F2F2F2',
		slug: 'light',
	},
	{
		name: __( 'Text', 'harlow' ),
		color: 'var(--hl-color-text)',
		paint: '#000000',
		slug: 'text',
	},
];
const PALETTE = ( site.palette || [] ).map( ( hex ) => ( {
	name: hex,
	color: hex,
	slug: hex.replace( '#', 'c-' ),
} ) );
/**
 * A colour value as the row shows it: the brand's by its name and real paint (the swatch
 * cannot draw a var() outside the canvas), anything else as it is.
 *
 * @param {string} value The colour value.
 * @return {Object} { paint, name }.
 */
function shown( value ) {
	const brand = NAMED.find( ( b ) => b.color === value );
	if ( brand ) {
		return { paint: brand.paint, name: brand.name };
	}
	return { paint: value, name: value };
}

/** Site settings → Global colours: the kit's four and the owner's own. */
const GLOBALS = ( site.globals || [] ).map( ( g ) => ( {
	name: g.name,
	color: `var(--e-global-color-${ g.slug })`,
	paint: g.color,
	slug: `g-${ g.slug }`,
} ) );
/** The colours offered by name: a click on one keeps its custom property. */
const NAMED = [ ...BRAND, ...GLOBALS ];

const COLOURS = [
	{
		name: __( 'Brand', 'harlow' ),
		colors: BRAND.map( ( b ) => ( { ...b, color: b.paint } ) ),
	},
	{
		name: __( 'Global colours', 'harlow' ),
		colors: GLOBALS.map( ( g ) => ( { ...g, color: g.paint } ) ),
	},
	{ name: __( 'The design’s palette', 'harlow' ), colors: PALETTE },
];

/** The design's text sizes, offered first; any size may be typed. */
const SIZES = (
	site.typeScale || [ 12, 13, 14, 16, 18, 20, 22, 26, 32, 42 ]
).map( ( n ) => ( { name: `${ n }`, slug: `s${ n }`, size: n } ) );

/** The site's fonts (the ones its stylesheets load). */
const FONTS = [
	{ label: __( 'Default', 'harlow' ), value: '' },
	{ label: __( 'Global: Primary', 'harlow' ), value: 'global:primary' },
	{ label: __( 'Global: Secondary', 'harlow' ), value: 'global:secondary' },
	{ label: __( 'Global: Text', 'harlow' ), value: 'global:text' },
	{ label: __( 'Global: Accent', 'harlow' ), value: 'global:accent' },
	...( site.fonts || [] ).map( ( f ) => ( { label: f, value: f } ) ),
	{ label: 'serif', value: 'serif' },
	{ label: 'sans-serif', value: 'sans-serif' },
	{ label: 'monospace', value: 'monospace' },
];

const UNITS = [ 'px', '%', 'em', 'rem', 'vw', 'vh' ].map( ( u ) => ( {
	value: u,
	label: u,
} ) );

/**
 * Widgets whose own layers cover the whole box, each with its background (a flip box's
 * front and back, each slide of the slides, a video and a playlist's list): the box's own
 * Background, hidden behind them, is not offered.
 */
const OWN_BACKGROUND = [ 'flip-box', 'slides', 'video', 'video-playlist' ];

/**
 * Widgets whose own box fills the widget and paints over it: the box's background is that
 * box's too (HARLOW_STYLE_COVERS).
 */
const COVERS = {
	alert: ' .elementor-alert',
	'off-canvas': ' .e-off-canvas__main',
	// The classic skin's content fills the box beside its picture (the cover skin's lies over it).
	'call-to-action': '.elementor-cta--skin-classic .elementor-cta__content',
	'code-highlight': ' pre[class*="language-"]',
	'progress-tracker': ' .elementor-scrolling-tracker-horizontal',
	// The search box (never the full screen skin's overlay, which covers the page).
	'search-form':
		' .elementor-search-form__container:not(.elementor-search-form--full-screen)',
};

/** Where the words live inside each kind (harlow_style_rules()). */
const TEXT_PART = {
	heading: ' .elementor-heading-title',
	button: ' .elementor-button',
	'icon-list': ' .elementor-icon-list-text',
	'accordion-item': ' .elementor-accordion-title',
	// A text's words are its paragraphs, lists and headings ("|": several selectors).
	text: '| p| li| h1| h2| h3| h4| h5| h6',
	// The title widgets of the Theme Builder are headings.
	'site-title': ' .elementor-heading-title',
	'page-title': ' .elementor-heading-title',
	'post-title': ' .elementor-heading-title',
	'archive-title': ' .elementor-heading-title',
};

/** The kinds that are a picture (harlow_style_rules()'s $picture). */
const PICTURES = [ 'image', 'site-logo', 'post-featured-image' ];

/** Where an icon is drawn in each kind: its holder, its SVG (harlow_style_rules()). */
const ICON_PARTS = {
	icon: [ ' .elementor-icon', ' .elementor-icon svg' ],
	'icon-list': [
		' .elementor-icon-list-icon',
		' .elementor-icon-list-icon svg',
	],
	'social-icons': [
		' .elementor-social-icon',
		' .elementor-social-icon svg',
	],
	button: [ ' .elementor-button-icon', ' .elementor-button-icon svg' ],
	accordion: [
		' .elementor-accordion-icon',
		' .elementor-accordion-icon svg',
	],
};

const SIDES = [ 'top', 'right', 'bottom', 'left' ];
const CORNERS = [
	[ 'topLeft', 'top-left' ],
	[ 'topRight', 'top-right' ],
	[ 'bottomRight', 'bottom-right' ],
	[ 'bottomLeft', 'bottom-left' ],
];

const WORDS = {
	position: [
		'center center',
		'center left',
		'center right',
		'top center',
		'top left',
		'top right',
		'bottom center',
		'bottom left',
		'bottom right',
	],
	size: [ 'auto', 'cover', 'contain' ],
	repeat: [ 'no-repeat', 'repeat', 'repeat-x', 'repeat-y' ],
	attachment: [ 'scroll', 'fixed' ],
	weight: [ '100', '200', '300', '400', '500', '600', '700', '800', '900' ],
	fit: [ 'cover', 'contain', 'fill', 'none' ],
	borderStyle: [
		'none',
		'solid',
		'dashed',
		'dotted',
		'double',
		'groove',
		'ridge',
	],
	direction: [ 'row', 'column', 'row-reverse', 'column-reverse' ],
	justify: [
		'flex-start',
		'center',
		'flex-end',
		'space-between',
		'space-around',
		'space-evenly',
	],
	align: [
		'stretch',
		'flex-start',
		'center',
		'flex-end',
		'start',
		'end',
		'baseline',
	],
	alignContent: [
		'flex-start',
		'center',
		'flex-end',
		'space-between',
		'space-around',
		'stretch',
	],
	wrap: [ 'nowrap', 'wrap', 'wrap-reverse' ],
	autoFlow: [ 'row', 'column', 'row dense', 'column dense' ],
	justifyItems: [ 'start', 'center', 'end', 'stretch' ],
	overflow: [ 'visible', 'hidden', 'auto' ],
	alignSelf: [ 'flex-start', 'center', 'flex-end', 'stretch' ],
	position2: [ 'static', 'relative', 'absolute', 'fixed', 'sticky' ],
};

/** The blend modes Elementor offers (harlow_style_blends()). */
const BLENDS = [
	'normal',
	'multiply',
	'screen',
	'overlay',
	'darken',
	'lighten',
	'color-dodge',
	'color-burn',
	'hard-light',
	'soft-light',
	'difference',
	'exclusion',
	'hue',
	'saturation',
	'color',
	'luminosity',
];

function colour( v ) {
	if ( typeof v !== 'string' ) {
		return '';
	}
	const s = v.trim();
	if (
		/^#[0-9a-f]{3,8}$/i.test( s ) ||
		/^(rgb|hsl)a?\(\s*[\d.%,\s/]+\)$/i.test( s ) ||
		/^var\(--hl-color-[a-z]+\)$/.test( s ) ||
		/^var\(--e-global-color-[a-z0-9-]+\)$/.test( s ) ||
		s === 'transparent'
	) {
		return s;
	}
	return '';
}

function length( v, unit = 'px', negative = false ) {
	if ( v === null || v === undefined || v === '' || isNaN( Number( v ) ) ) {
		return '';
	}
	const n = Number( v );
	if ( n < 0 && ! negative ) {
		return '';
	}
	const u = [ 'px', '%', 'em', 'rem', 'vw', 'vh' ].includes( unit )
		? unit
		: 'px';
	return `${ parseFloat( n.toFixed( 3 ) ) }${ u }`;
}

function word( v, words ) {
	return typeof v === 'string' && words.includes( v ) ? v : '';
}

function font( v ) {
	if ( ! v ) {
		return '';
	}
	const global = /^global:(primary|secondary|text|accent)$/.exec( v );
	if ( global ) {
		return `var(--e-global-typography-${ global[ 1 ] }-font-family), Sans-serif`;
	}
	const known = [
		...( site.fonts || [] ),
		'serif',
		'sans-serif',
		'monospace',
	];
	if ( ! known.includes( v ) ) {
		return '';
	}
	return `${ v.includes( ' ' ) ? `"${ v }"` : v }, Sans-serif`;
}

/**
 * The declarations of one device's style, as harlow_style_rules() makes them:
 * { selectorSuffix: { property: value } }.
 *
 * @param {Object} style   One device's style.
 * @param {string} kind    The block's kind.
 * @param {Object} urls    Picture id -> address (the editor looks pictures up).
 * @param {string} classes The element's classes (where its design paints it).
 * @return {Object} The rules.
 */
export function styleRules( style, kind, urls = {}, classes = '' ) {
	const rules = {};
	const self = '';
	const text = TEXT_PART[ kind ] || '';
	const add = ( part, prop, value ) => {
		if ( value === null || value === undefined || value === '' ) {
			return;
		}
		rules[ part ] = rules[ part ] || {};
		rules[ part ][ prop ] = value;
	};
	const ms = ( v ) =>
		v !== '' && v !== undefined && ! isNaN( Number( v ) )
			? `${ Math.max( 0, Math.min( 20000, parseInt( v, 10 ) ) ) }ms`
			: '';
	// A drop cap: before the part's own typography and spacing, which win over it.
	if ( kind === 'part' && style.dropCap ) {
		add( self, 'float', 'left' );
		add( self, 'font-size', '3em' );
		add( self, 'line-height', '1' );
		add( self, 'margin-right', '10px' );
	}
	// A widget's box is its element and the widget container inside it (harlow_style_rules()).
	const bgBox =
		( [ 'container', 'part' ].includes( kind )
			? self
			: '| > .elementor-widget-container' ) +
		( COVERS[ kind ] ? `|${ COVERS[ kind ] }` : '' );
	for ( const [ prop, value ] of Object.entries(
		background( style.background || {}, urls )
	) ) {
		add( bgBox, prop, value );
	}
	// The overlay over a container's background (Elementor's ::before layer).
	if ( kind === 'container' ) {
		const overlay = style.overlay || {};
		const hoverLayer = style.hover?.overlay || {};
		const layer =
			'::before| > .elementor-background-video-container::before| > .e-con-inner > .elementor-background-video-container::before| > .elementor-background-slideshow::before';
		const onHover =
			':hover::before|:hover > .elementor-background-video-container::before|:hover > .e-con-inner > .elementor-background-video-container::before|:hover > .elementor-background-slideshow::before';
		const paint = background( overlay, urls );
		const hoverPaint = background( hoverLayer, urls );
		if ( Object.keys( paint ).length || Object.keys( hoverPaint ).length ) {
			add( self, '--background-overlay', "''" );
		}
		for ( const [ prop, value ] of Object.entries( paint ) ) {
			add( layer, prop, value );
		}
		for ( const [ prop, value ] of Object.entries( hoverPaint ) ) {
			add( onHover, prop, value );
		}
		if ( overlay.opacity !== undefined && overlay.opacity !== '' ) {
			add(
				self,
				'--overlay-opacity',
				`${ Math.min( 1, Math.max( 0, Number( overlay.opacity ) ) ) }`
			);
		}
		if ( hoverLayer.opacity !== undefined && hoverLayer.opacity !== '' ) {
			add(
				':hover',
				'--overlay-opacity',
				`${ Math.min( 1, Math.max( 0, Number( hoverLayer.opacity ) ) ) }`
			);
		}
		add( self, '--overlay-mix-blend-mode', word( overlay.blend, BLENDS ) );
		add(
			layer,
			'filter',
			overlay.filters ? filters( overlay.filters ) : ''
		);
		add(
			onHover,
			'filter',
			hoverLayer.filters ? filters( hoverLayer.filters ) : ''
		);
		add( self, '--overlay-transition', ms( overlay.transition ) );
	}
	const type = style.typography || {};
	add( text, 'font-family', font( type.font ) );
	add( text, 'font-size', length( type.size, type.sizeUnit || 'px' ) );
	add(
		text,
		'font-weight',
		word( `${ type.weight ?? '' }`, [ ...WORDS.weight, 'normal', 'bold' ] )
	);
	add( text, 'font-style', word( type.style, [ 'normal', 'italic' ] ) );
	add(
		text,
		'text-decoration',
		word( type.decoration, [ 'none', 'underline', 'line-through' ] )
	);
	add(
		text,
		'text-transform',
		word( type.transform, [
			'none',
			'uppercase',
			'lowercase',
			'capitalize',
		] )
	);
	add(
		text,
		'line-height',
		length( type.lineHeight, type.lineHeightUnit || 'em' )
	);
	add( text, 'letter-spacing', length( type.letterSpacing, 'px' ) );
	add(
		text,
		'word-spacing',
		length( type.wordSpacing, type.wordSpacingUnit || 'px', true )
	);
	const stroke = type.stroke || {};
	add( text, '-webkit-text-stroke-width', length( stroke.width, 'px' ) );
	add( text, 'stroke-width', length( stroke.width, 'px' ) );
	add( text, '-webkit-text-stroke-color', colour( stroke.color ) );
	add( text, 'stroke', colour( stroke.color ) );
	add( text, 'color', colour( style.color ) );
	add( text || self, 'mix-blend-mode', word( style.textBlend, BLENDS ) );
	add(
		self,
		'text-align',
		word( style.align, [ 'left', 'center', 'right', 'justify' ] )
	);
	if ( kind === 'button' ) {
		// As harlow_style_rules(): the button as one piece. Where the design paints it on its
		// box (the widget container: its colour, its arrow as a picture), the owner's colour
		// goes there and the button in front turns clear; otherwise on the button itself.
		const fill = colour( style.buttonColor );
		const hover = colour( style.buttonHoverColor );
		const radius = length( style.radius, 'px' );
		if ( /(^|\s)hl-bg[ci]-\S*--wc(\s|$)/.test( classes || '' ) ) {
			add( ' .elementor-widget-container', 'background-color', fill );
			add(
				':hover .elementor-widget-container',
				'background-color',
				hover
			);
			add( text, 'background-color', fill || hover ? 'transparent' : '' );
			add( ' .elementor-widget-container', 'border-radius', radius );
		} else {
			add( text, 'background-color', fill );
			add( ' .elementor-button:hover', 'background-color', hover );
		}
		add( text, 'border-radius', radius );
	}
	for ( const box of [ 'padding', 'margin' ] ) {
		const sides = style[ box ] || {};
		const unit = sides.unit || 'px';
		for ( const side of [ 'top', 'right', 'bottom', 'left' ] ) {
			if ( sides[ side ] !== undefined && sides[ side ] !== '' ) {
				const value = length( sides[ side ], unit, box === 'margin' );
				if ( kind === 'container' && box === 'padding' ) {
					add( self, `--padding-${ side }`, value );
				} else if ( kind === 'container' ) {
					add( self, `--margin-${ side }`, value );
				} else if ( kind === 'part' ) {
					add( self, `${ box }-${ side }`, value );
				} else {
					add(
						`${ self } > .elementor-widget-container`,
						`${ box }-${ side }`,
						value
					);
				}
			}
		}
	}
	const size = style.size || {};
	if ( kind === 'container' ) {
		add(
			self,
			'--content-width',
			length( size.width, size.widthUnit || 'px' )
		);
		add(
			self,
			'--min-height',
			length( size.height, size.heightUnit || 'px' )
		);
	} else {
		add( self, 'width', length( size.width, size.widthUnit || 'px' ) );
		add( self, 'max-width', length( size.width, size.widthUnit || 'px' ) );
		add(
			self,
			'min-height',
			length( size.height, size.heightUnit || 'px' )
		);
	}
	if ( PICTURES.includes( kind ) ) {
		const img = style.image || {};
		add( ' img', 'width', length( img.width, img.widthUnit || '%' ) );
		add( ' img', 'max-width', length( img.width, img.widthUnit || '%' ) );
		add( ' img', 'height', length( img.height, img.heightUnit || 'px' ) );
		add( ' img', 'object-fit', word( img.fit, WORDS.fit ) );
		add( ' img', 'border-radius', length( img.radius, 'px' ) );
		add(
			self,
			'text-align',
			word( style.align, [ 'left', 'center', 'right' ] )
		);
	}
	// A divider's line: its Colour and Weight, the custom properties it is drawn with.
	const line = style.divider || {};
	add( self, '--divider-color', colour( line.color ) );
	add( self, '--divider-border-width', length( line.weight, 'px' ) );
	// Every side at once, then each side of its own, then the corners (harlow_style_rules()).
	const border = style.border || {};
	add( self, 'border-style', word( border.style, WORDS.borderStyle ) );
	add( self, 'border-width', length( border.width, 'px' ) );
	add( self, 'border-color', colour( border.color ) );
	for ( const side of SIDES ) {
		const one = border[ side ] || {};
		add(
			self,
			`border-${ side }-style`,
			word( one.style, WORDS.borderStyle )
		);
		add( self, `border-${ side }-width`, length( one.width, 'px' ) );
		add( self, `border-${ side }-color`, colour( one.color ) );
	}
	add( self, 'border-radius', length( border.radius, 'px' ) );
	for ( const [ key, corner ] of CORNERS ) {
		add( self, `border-${ corner }-radius`, length( border[ key ], 'px' ) );
	}
	add( self, 'box-shadow', shadow( style.shadow, true ) );
	add( text, 'text-shadow', shadow( style.textShadow, false ) );
	if ( style.opacity !== undefined && style.opacity !== '' ) {
		add(
			self,
			'opacity',
			`${ Math.min( 1, Math.max( 0, Number( style.opacity ) ) ) }`
		);
	}
	add( self, 'mix-blend-mode', word( style.blend, BLENDS ) );

	// A container's layout: Elementor's own custom properties, read on the box and its
	// inner box.
	const layout = style.layout || {};
	if ( kind === 'container' ) {
		add( self, '--display', word( layout.display, [ 'flex', 'grid' ] ) );
		add(
			self,
			'--flex-direction',
			word( layout.direction, WORDS.direction )
		);
		add( self, '--justify-content', word( layout.justify, WORDS.justify ) );
		add( self, '--align-items', word( layout.align, WORDS.align ) );
		add(
			self,
			'--align-content',
			word( layout.alignContent, WORDS.alignContent )
		);
		add( self, '--flex-wrap', word( layout.wrap, WORDS.wrap ) );
		const gapUnit = layout.gapUnit || 'px';
		add( self, '--column-gap', length( layout.columnGap, gapUnit ) );
		add( self, '--row-gap', length( layout.rowGap, gapUnit ) );
		add(
			self,
			'--e-con-grid-template-columns',
			tracks( layout.columns, layout.columnsCustom )
		);
		add(
			self,
			'--e-con-grid-template-rows',
			tracks( layout.rows, layout.rowsCustom )
		);
		add(
			self,
			'--grid-auto-flow',
			word( layout.autoFlow, WORDS.autoFlow )
		);
		add(
			self,
			'--justify-items',
			word( layout.justifyItems, WORDS.justifyItems )
		);
		add( self, 'overflow', word( layout.overflow, WORDS.overflow ) );
	}

	// Its place among its siblings and on the page.
	const item = style.item || {};
	if ( item.widthMode === 'full' ) {
		add( self, 'width', '100%' );
		add( self, 'max-width', '100%' );
		add( self, '--container-widget-width', '100%' );
	} else if ( item.widthMode === 'inline' ) {
		add( self, 'width', 'auto' );
		add( self, '--container-widget-width', 'auto' );
		add( self, '--container-widget-flex-grow', '0' );
	}
	add( self, '--align-self', word( item.alignSelf, WORDS.alignSelf ) );
	if ( item.order === 'start' || item.order === 'end' ) {
		add( self, '--order', item.order === 'start' ? '-99999' : '99999' );
	} else if (
		item.order === 'custom' &&
		item.orderCustom !== '' &&
		! isNaN( Number( item.orderCustom ) )
	) {
		add( self, '--order', `${ parseInt( item.orderCustom, 10 ) }` );
	}
	const flexSizes = { none: [ 0, 0 ], grow: [ 1, 0 ], shrink: [ 0, 1 ] };
	if ( flexSizes[ item.flexSize ] ) {
		add( self, '--flex-grow', `${ flexSizes[ item.flexSize ][ 0 ] }` );
		add( self, '--flex-shrink', `${ flexSizes[ item.flexSize ][ 1 ] }` );
	}
	add( self, 'position', word( item.position, WORDS.position2 ) );
	for ( const side of SIDES ) {
		add(
			self,
			side,
			length( item[ side ], item.offsetUnit || 'px', true )
		);
	}
	if ( item.zIndex !== undefined && item.zIndex !== '' ) {
		add( self, 'z-index', `${ parseInt( item.zIndex, 10 ) }` );
	}

	// Transform (with the point it turns around), and what changes on hover, with its
	// transition.
	add( self, 'transform', transform( style.transform ) );
	const origin = style.transform || {};
	const originX = word( origin.originX, [ 'left', 'center', 'right' ] );
	const originY = word( origin.originY, [ 'top', 'center', 'bottom' ] );
	if ( originX || originY ) {
		add(
			self,
			'transform-origin',
			`${ originX || 'center' } ${ originY || 'center' }`
		);
	}
	const hover = style.hover || {};
	add(
		kind === 'button' ? ' .elementor-button:hover' : `:hover${ text }`,
		'color',
		colour( hover.color )
	);
	if ( kind === 'button' ) {
		add(
			' .elementor-button:hover',
			'background-color',
			colour( hover.background )
		);
	} else if ( colour( hover.background ) ) {
		const onBox =
			( [ 'container', 'part' ].includes( kind )
				? ':hover'
				: ':hover|:hover > .elementor-widget-container' ) +
			( COVERS[ kind ] ? `|:hover${ COVERS[ kind ] }` : '' );
		add( onBox, 'background-color', colour( hover.background ) );
		add( onBox, 'background-image', 'none' );
	}
	// A gradient or a picture on hover (a button's own box, or the element's).
	for ( const [ prop, value ] of Object.entries(
		background( hover.bg || {}, urls )
	) ) {
		add(
			kind === 'button' ? ' .elementor-button:hover' : ':hover',
			prop,
			value
		);
	}
	add( ':hover', 'border-color', colour( hover.borderColor ) );
	add(
		':hover',
		'border-style',
		word( hover.borderStyle, WORDS.borderStyle )
	);
	add( ':hover', 'border-width', length( hover.borderWidth, 'px' ) );
	add( ':hover', 'border-radius', length( hover.radius, 'px' ) );
	add( ':hover', 'transform', transform( hover.transform ) );
	add( ':hover', 'box-shadow', shadow( hover.shadow, true ) );
	if ( hover.opacity !== undefined && hover.opacity !== '' ) {
		add(
			':hover',
			'opacity',
			`${ Math.min( 1, Math.max( 0, Number( hover.opacity ) ) ) }`
		);
	}
	if ( PICTURES.includes( kind ) && hover.filters ) {
		add( ':hover img', 'filter', filters( hover.filters ) );
	}
	if ( style.transition !== undefined && style.transition !== '' ) {
		const duration = `${ Math.max(
			0,
			Math.min( 5000, parseInt( style.transition, 10 ) || 0 )
		) }ms`;
		add( self, 'transition', `all ${ duration }` );
		if ( text ) {
			add( text, 'transition', `all ${ duration }` );
		}
	}

	if ( PICTURES.includes( kind ) && style.filters ) {
		add( ' img', 'filter', filters( style.filters ) );
	}

	// An icon's colour and size.
	const icon = style.icon || {};
	if ( ICON_PARTS[ kind ] ) {
		const [ holder, svg ] = ICON_PARTS[ kind ];
		const c = colour( icon.color );
		add( holder, 'color', c );
		// An icon drawn by its outline keeps its line coloured, never filled.
		add( `${ svg }:not([fill="none"])`, 'fill', c );
		const s = length( icon.size, 'px' );
		add( holder, 'font-size', s );
		add( svg, 'width', s );
		add( svg, 'height', s );
		if ( kind === 'social-icons' ) {
			add(
				' .elementor-social-icon',
				'background-color',
				colour( icon.background )
			);
		}
	}

	if ( kind === 'button' && style.buttonPadding ) {
		const p = style.buttonPadding;
		for ( const side of SIDES ) {
			add(
				' .elementor-button',
				`padding-${ side }`,
				length( p[ side ], p.unit || 'px' )
			);
		}
	}

	if ( kind === 'text' && style.links ) {
		add( ' a', 'color', colour( style.links.color ) );
		add( ' a:hover', 'color', colour( style.links.hover ) );
	}

	if (
		style.animationDuration !== undefined &&
		style.animationDuration !== '' &&
		! isNaN( Number( style.animationDuration ) )
	) {
		add(
			self,
			'animation-duration',
			`${ Math.max( 0, parseInt( style.animationDuration, 10 ) ) }ms`
		);
	}
	// A part's icon (its colour and size, as a font icon or an SVG) and the gap between
	// what it holds.
	if ( kind === 'part' ) {
		const c = colour( style.iconColor );
		add( self, 'color', c );
		add( ' svg:not([fill="none"])', 'fill', c );
		const s = length( style.iconSize, 'px' );
		add( self, 'font-size', s );
		add( ' svg', 'width', s );
		add( ' svg', 'height', s );
		add( self, 'gap', length( style.gap, style.gapUnit || 'px' ) );
		// A grid's columns, or a text's columns.
		const columns = parseInt( style.columns, 10 );
		if ( columns >= 1 ) {
			add(
				self,
				'grid-template-columns',
				`repeat(${ Math.min( 12, columns ) }, minmax(0, 1fr))`
			);
		}
		const textColumns = parseInt( style.textColumns, 10 );
		if ( textColumns >= 1 ) {
			add( self, 'column-count', `${ Math.min( 10, textColumns ) }` );
		}
		add(
			self,
			'column-gap',
			length( style.columnGap, style.columnGapUnit || 'px' )
		);
	}
	if ( style.hide ) {
		add( self, 'display', 'none' );
	}
	return rules;
}

/**
 * A shadow as CSS (harlow_style_shadow()).
 *
 * @param {*}       s   The shadow: { x, y, blur, spread, color, inset }, or an older colour.
 * @param {boolean} box A box's (spread, inset) or a text's.
 * @return {string} CSS, or ''.
 */
function shadow( s, box ) {
	if ( ! s ) {
		return '';
	}
	if ( typeof s !== 'object' ) {
		return box ? `0 10px 30px ${ colour( s ) || 'rgba(0,0,0,0.15)' }` : '';
	}
	const c = colour( s.color );
	if ( ! c ) {
		return '';
	}
	const n = ( k ) =>
		s[ k ] !== undefined && s[ k ] !== '' && ! isNaN( Number( s[ k ] ) )
			? `${ Number( s[ k ] ) }px`
			: '0px';
	let out = `${ n( 'x' ) } ${ n( 'y' ) } ${ n( 'blur' ) }`;
	if ( box ) {
		out = `${ s.inset ? 'inset ' : '' }${ out } ${ n( 'spread' ) }`;
	}
	return `${ out } ${ c }`;
}

/**
 * A transform as CSS (harlow_style_transform()).
 *
 * @param {Object} t { x, y, rotate, scale }.
 * @return {string} CSS, or ''.
 */
function transform( t ) {
	if ( ! t || typeof t !== 'object' ) {
		return '';
	}
	const num = ( v ) =>
		v !== undefined && v !== '' && ! isNaN( Number( v ) )
			? Number( v )
			: null;
	const parts = [];
	const x = num( t.x );
	const y = num( t.y );
	if ( x !== null || y !== null ) {
		parts.push( `translate(${ x || 0 }px, ${ y || 0 }px)` );
	}
	if ( num( t.rotate ) !== null ) {
		parts.push( `rotate(${ num( t.rotate ) }deg)` );
	}
	for ( const key of [ 'rotateX', 'rotateY' ] ) {
		if ( num( t[ key ] ) !== null ) {
			parts.push( `${ key }(${ num( t[ key ] ) }deg)` );
		}
	}
	if ( num( t.perspective ) > 0 ) {
		parts.unshift( `perspective(${ num( t.perspective ) }px)` );
	}
	if ( num( t.scale ) !== null ) {
		parts.push(
			`scale(${ Math.max( 0, Math.min( 5, num( t.scale ) ) ) })`
		);
	}
	const skewX = num( t.skewX );
	const skewY = num( t.skewY );
	if ( skewX !== null || skewY !== null ) {
		parts.push( `skew(${ skewX || 0 }deg, ${ skewY || 0 }deg)` );
	}
	if ( t.flipX ) {
		parts.push( 'scaleX(-1)' );
	}
	if ( t.flipY ) {
		parts.push( 'scaleY(-1)' );
	}
	return parts.join( ' ' );
}

/**
 * A background as CSS declarations (harlow_style_background()): none, a colour, a
 * gradient (linear or radial, each colour at its position) or a picture.
 *
 * @param {Object} bg   The background.
 * @param {Object} urls Picture id -> address.
 * @return {Object} { property: value }, only what is set.
 */
function background( bg, urls ) {
	const out = {};
	switch ( bg.type || '' ) {
		case 'none':
			out[ 'background-color' ] = 'transparent';
			out[ 'background-image' ] = 'none';
			break;
		case 'color':
			out[ 'background-color' ] = colour( bg.color );
			out[ 'background-image' ] = 'none';
			break;
		case 'gradient': {
			const from = colour( bg.color );
			const to = colour( bg.color2 );
			if ( from && to ) {
				const pos = ( v, d ) =>
					v !== undefined && v !== '' && ! isNaN( Number( v ) )
						? Math.max( 0, Math.min( 100, Number( v ) ) )
						: d;
				const stops = `${ from } ${ pos( bg.stop, 0 ) }%, ${ to } ${ pos(
					bg.stop2,
					100
				) }%`;
				out[ 'background-color' ] = 'transparent';
				if ( bg.gradientType === 'radial' ) {
					out[ 'background-image' ] = `radial-gradient(at ${
						word( bg.radialAt, WORDS.position ) || 'center center'
					}, ${ stops })`;
				} else {
					const angle =
						bg.angle !== undefined &&
						bg.angle !== '' &&
						! isNaN( Number( bg.angle ) )
							? parseInt( bg.angle, 10 )
							: 180;
					out[ 'background-image' ] =
						`linear-gradient(${ angle }deg, ${ stops })`;
				}
			}
			break;
		}
		case 'image': {
			const url = bg.image ? urls[ bg.image ] : '';
			if ( url ) {
				out[ 'background-image' ] = `url("${ url }")`;
				if ( bg.position === 'custom' ) {
					const n = ( v ) =>
						v !== undefined && v !== '' && ! isNaN( Number( v ) )
							? v
							: 0;
					out[ 'background-position' ] = `${ length(
						n( bg.posX ),
						bg.posXUnit || '%',
						true
					) } ${ length( n( bg.posY ), bg.posYUnit || '%', true ) }`;
				} else {
					out[ 'background-position' ] = word(
						bg.position,
						WORDS.position
					);
				}
				if ( bg.size === 'custom' ) {
					const w = length( bg.sizeWidth, bg.sizeWidthUnit || '%' );
					out[ 'background-size' ] = w ? `${ w } auto` : '';
				} else {
					out[ 'background-size' ] = word( bg.size, WORDS.size );
				}
				out[ 'background-repeat' ] = word( bg.repeat, WORDS.repeat );
				out[ 'background-attachment' ] = word(
					bg.attachment,
					WORDS.attachment
				);
				if ( bg.overlay ) {
					out[ 'background-color' ] = colour( bg.overlay );
					out[ 'background-blend-mode' ] = 'multiply';
				}
			}
			break;
		}
		default:
	}
	for ( const k of Object.keys( out ) ) {
		if ( out[ k ] === '' ) {
			delete out[ k ];
		}
	}
	return out;
}

/**
 * A picture's filters as CSS (harlow_style_filters()).
 *
 * @param {Object} f { brightness, contrast, saturate, blur, hue }.
 * @return {string} CSS, or ''.
 */
function filters( f ) {
	const units = {
		brightness: '%',
		contrast: '%',
		saturate: '%',
		blur: 'px',
		hue: 'deg',
	};
	return Object.entries( units )
		.filter(
			( [ k ] ) =>
				f[ k ] !== undefined &&
				f[ k ] !== '' &&
				! isNaN( Number( f[ k ] ) )
		)
		.map(
			( [ k, u ] ) =>
				`${ k === 'hue' ? 'hue-rotate' : k }(${ Math.max( 0, Number( f[ k ] ) ) }${ u })`
		)
		.join( ' ' );
}

/**
 * A grid's tracks as CSS (harlow_style_tracks()).
 *
 * @param {*}      count  How many equal tracks.
 * @param {string} custom A template, which wins when set.
 * @return {string} CSS, or ''.
 */
function tracks( count, custom ) {
	if ( typeof custom === 'string' && custom.trim() ) {
		return /^[0-9a-z%().,\s-]+$/i.test( custom.trim() )
			? custom.trim()
			: '';
	}
	const n = parseInt( count, 10 );
	return n >= 1 && n <= 24 ? `repeat(${ n }, 1fr)` : '';
}

/**
 * A part's style without its states (they are rules of their own).
 *
 * @param {Object} st  The part's style.
 * @param {Object} def The part.
 * @return {Object} The style.
 */
function partOnly( st, def ) {
	const out = { ...st };
	for ( const state of Object.keys( def.states || {} ) ) {
		delete out[ state ];
	}
	return out;
}

/**
 * The rules of one device's parts (harlow_parts_css()).
 *
 * @param {string} base The element's selector.
 * @param {Object} one  The device's style.
 * @param {string} kind The block's kind.
 * @param {Object} urls Picture id -> address.
 * @return {string} CSS.
 */
function partsCss( base, one, kind, urls ) {
	let css = '';
	for ( const def of PARTS[ kind ] || [] ) {
		const st = one.parts?.[ def.key ];
		if ( ! st ) {
			continue;
		}
		const variants = [
			[ def.selector, partOnly( st, def ) ],
			...Object.entries( def.states || {} ).map( ( [ k, s ] ) => [
				s.selector,
				st[ k ],
			] ),
		];
		for ( const [ selector, value ] of variants ) {
			if ( ! value ) {
				continue;
			}
			for ( const [ suffix, decls ] of Object.entries(
				styleRules( value, 'part', urls )
			) ) {
				const body = Object.entries( decls )
					.map( ( [ prop, v ] ) => `${ prop }:${ v } !important;` )
					.join( '' );
				const selectors = [];
				for ( const at of selector.split( '|' ) ) {
					for ( const tail of suffix.split( '|' ) ) {
						selectors.push( `${ base }${ at }${ tail }` );
					}
				}
				css += `${ selectors.join( ',' ) }{${ body }}`;
			}
		}
	}
	return css;
}

/**
 * The CSS of one element's style, every device (harlow_element_css()).
 *
 * @param {string} element The element's id.
 * @param {Object} style   The block's style attribute.
 * @param {string} kind    The block's kind.
 * @param {Object} urls    Picture id -> address.
 * @param {string} classes The element's classes.
 * @return {string} CSS.
 */
export function elementCss( element, style, kind, urls = {}, classes = '' ) {
	// As harlow_element_css(): the element by its data-id, named twice, and the :not() the
	// design's background rules end in; each weighs a class.
	const id = `[data-id="${ ( element || '' ).replace( /[^a-z0-9_-]/gi, '' ) }"]`;
	const base = `.elementor .elementor-element${ id }${ id }:not(.elementor-motion-effects-element-type-background)`;
	let out = '';
	for ( const [ device, media ] of DEVICE_LIST ) {
		const one = style?.[ device ];
		if ( ! one || typeof one !== 'object' ) {
			continue;
		}
		let css = '';
		for ( const [ part, decls ] of Object.entries(
			styleRules( one, kind, urls, classes )
		) ) {
			const body = Object.entries( decls )
				.map( ( [ p, v ] ) => `${ p }:${ v } !important;` )
				.join( '' );
			// A part may name several selectors ("|"): each is the element's.
			const selectors = part
				.split( '|' )
				.map( ( selector ) => `${ base }${ selector }` )
				.join( ',' );
			css += `${ selectors }{${ body }}`;
		}
		css += partsCss( base, one, kind, urls );
		let custom = typeof one.css === 'string' ? one.css.trim() : '';
		if ( custom ) {
			custom = custom.replace( /<\/?/g, '' );
			custom = custom.includes( 'selector' )
				? custom.split( 'selector' ).join( base )
				: `${ base }{${ custom }}`;
			css += custom;
		}
		if ( css ) {
			out += media ? `@media ${ media }{${ css }}` : css;
		}
	}
	return (
		out + hoverAnimationCss( base, style, kind ) + shapesCss( base, style )
	);
}

/**
 * The rules of an element's hover animation (harlow_hover_animation_css()).
 *
 * @param {string} base  The element's selector.
 * @param {Object} style Its style.
 * @param {string} kind  Its kind.
 * @return {string} CSS.
 */
function hoverAnimationCss( base, style, kind ) {
	const one = HOVER_ANIMATIONS[ style?.hoverAnimation ];
	if ( ! one ) {
		return '';
	}
	const part =
		{
			button: ' .elementor-button',
			image: ' img',
			'site-logo': ' img',
			'post-featured-image': ' img',
			icon: ' .elementor-icon',
			'social-icons': ' .elementor-social-icon',
		}[ kind ] || '';
	const heavy = ( decls ) =>
		decls
			? `${ decls.split( ';' ).join( ' !important;' ) } !important;`
			: '';
	return (
		( one[ 1 ] ? `${ base }${ part }{${ heavy( one[ 1 ] ) }}` : '' ) +
		`${ base }${ part }:hover{${ heavy( one[ 2 ] ) }}`
	);
}

/**
 * A container's shape dividers' size, colour and flip (harlow_shapes_css()).
 *
 * @param {string} base  The element's selector.
 * @param {Object} style Its style.
 * @return {string} CSS.
 */
function shapesCss( base, style ) {
	let css = '';
	for ( const side of [ 'top', 'bottom' ] ) {
		const one = style?.shapes?.[ side ] || {};
		if ( ! one.type ) {
			continue;
		}
		const at = `${ base } > .elementor-shape-${ side }`;
		let svg = '';
		if (
			one.width !== undefined &&
			one.width !== '' &&
			! isNaN( Number( one.width ) )
		) {
			svg += `width:calc(${ Math.max(
				100,
				Math.min( 300, Number( one.width ) )
			) }% + 1.3px) !important;`;
		}
		const height = length( one.height, 'px' );
		if ( height ) {
			svg += `height:${ height } !important;`;
		}
		if ( one.flip ) {
			svg += 'transform:translateX(-50%) rotateY(180deg) !important;';
		}
		if ( svg ) {
			css += `${ at } svg{${ svg }}`;
		}
		if ( colour( one.color ) ) {
			css += `${ at } .elementor-shape-fill{fill:${ colour(
				one.color
			) } !important;}`;
		}
		for ( const [ key, media ] of [
			[ 'heightTablet', DEVICES.Tablet[ 1 ] ],
			[ 'heightMobile', DEVICES.Mobile[ 1 ] ],
		] ) {
			const h = length( one[ key ], 'px' );
			if ( h ) {
				css += `@media ${ media }{${ at } svg{height:${ h } !important;}}`;
			}
		}
	}
	return css;
}

/**
 * A shape divider as markup (harlow_shapes_markup()), for the canvas.
 *
 * @param {Object} props
 * @param {string} props.side  top or bottom.
 * @param {Object} props.shape Its settings.
 */
export function ShapeDivider( { side, shape } ) {
	const drawing = SHAPES[ shape?.type ];
	if ( ! drawing ) {
		return null;
	}
	const paths = drawing.paths.map( ( path, i ) => (
		<path
			key={ i }
			className="elementor-shape-fill"
			opacity={ path.opacity }
			d={ path.d }
		/>
	) );
	return (
		<div
			className={ `elementor-shape elementor-shape-${ side }` }
			aria-hidden="true"
			data-negative={ shape.invert ? 'true' : 'false' }
			data-front={ shape.front ? 'true' : 'false' }
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 1000 100"
				preserveAspectRatio="none"
			>
				{ shape.invert ? (
					<g transform="matrix(1 0 0 -1 0 100)">{ paths }</g>
				) : (
					paths
				) }
			</svg>
		</div>
	);
}

/**
 * Keep one <style> in the canvas for a block's style, updated as the owner changes it.
 *
 * @param {string} clientId The block.
 * @param {string} element  Its element id.
 * @param {Object} style    Its style attribute.
 * @param {string} kind     Its kind.
 * @param {string} classes  Its classes.
 */
function useCanvasStyle( clientId, element, style, kind, classes ) {
	// Every picture of the style: the box's background, its overlay and hover, and its
	// parts' backgrounds, on every device.
	const ids = [];
	const walk = ( value ) => {
		if ( ! value || typeof value !== 'object' ) {
			return;
		}
		for ( const [ name, inner ] of Object.entries( value ) ) {
			if ( name === 'image' && Number( inner ) > 0 ) {
				ids.push( Number( inner ) );
			} else {
				walk( inner );
			}
		}
	};
	walk( style );
	const idsKey = [ ...new Set( ids ) ].join( ',' );
	const urls = useSelect(
		( select ) => {
			const out = {};
			for ( const id of idsKey ? idsKey.split( ',' ) : [] ) {
				const r = select( 'core' ).getEntityRecord(
					'postType',
					'attachment',
					Number( id )
				);
				if ( r || PICKED[ id ] ) {
					out[ id ] = r ? r.source_url : PICKED[ id ];
				}
			}
			return out;
		},
		[ idsKey ]
	);
	// The CSS itself is the dependency: a style or a picture's address that reads the same
	// draws the same.
	const css = elementCss( element, style, kind, urls, classes );
	useEffect( () => {
		const frame = document.querySelector( 'iframe[name="editor-canvas"]' );
		const doc = frame?.contentDocument || document;
		const tagId = `harlow-style-${ clientId }`;
		let tag = doc.getElementById( tagId );
		if ( ! css ) {
			if ( tag ) {
				tag.remove();
			}
			return;
		}
		if ( ! tag ) {
			tag = doc.createElement( 'style' );
			tag.id = tagId;
			doc.head.appendChild( tag );
		}
		if ( tag.textContent !== css ) {
			tag.textContent = css;
		}
	}, [ clientId, css ] );
}

/** The names a row's label may start with: every part's, in each of its states. */
let GROUP_NAMES = null;
function groupNames() {
	if ( ! GROUP_NAMES ) {
		const names = new Set( [
			'Overlay:',
			'Overlay on hover:',
			'On hover:',
		] );
		Object.values( PARTS ).forEach( ( parts ) =>
			parts.forEach( ( part ) => {
				names.add( `${ part.label }:` );
				Object.values( part.states || {} ).forEach( ( state ) =>
					names.add( `${ part.label } (${ state.label }):` )
				);
			} )
		);
		GROUP_NAMES = [ ...names ].sort( ( a, b ) => b.length - a.length );
	}
	return GROUP_NAMES;
}

/**
 * A row's label as the owner reads it: the words before a colon ("Title: Size") are the
 * group's title, shown over the row already, so only screen readers read them there.
 *
 * @param {string} label The label.
 * @return {Object|string} The label to show.
 */
function rowLabel( label ) {
	if ( typeof label !== 'string' ) {
		return label;
	}
	// A part's own name may hold a colon ("Card: title"): the longest known group name the
	// label starts with is the one hidden, else the words before the first colon.
	const known = groupNames().find( ( name ) =>
		label.startsWith( `${ name } ` )
	);
	const at = known ? known.length - 1 : label.indexOf( ': ' );
	if ( at < 1 ) {
		return label;
	}
	return (
		<>
			<VisuallyHidden as="span">
				{ label.slice( 0, at + 2 ) }
			</VisuallyHidden>
			<span className="harlow-row__name">{ label.slice( at + 2 ) }</span>
		</>
	);
}

/**
 * A row's reset: a small icon, there only once the row has a value of its own (its place
 * kept, so the rows do not move).
 *
 * @param {Object}   props
 * @param {boolean}  props.active  Whether the row has a value.
 * @param {string}   props.label   The row's label (read by screen readers).
 * @param {Function} props.onClick Called to reset.
 */
function ResetButton( { active, label, onClick } ) {
	return (
		<Button
			className="harlow-style__reset"
			icon={ resetIcon }
			size="small"
			label={ sprintf(
				/* translators: %s: a control's label */
				__( 'Reset %s', 'harlow' ),
				label
			) }
			showTooltip
			style={ active ? undefined : { visibility: 'hidden' } }
			tabIndex={ active ? undefined : -1 }
			onClick={ onClick }
		/>
	);
}

/**
 * A colour control: the brand and the palette first, a picker for any colour. One field,
 * as Figma's: the swatch and the colour's name, the picker beside the sidebar; a reset.
 *
 * @param {Object}   props
 * @param {string}   props.label    The label.
 * @param {string}   props.value    The colour, or ''.
 * @param {Function} props.onChange Called with the colour, '' for the default.
 */
function Colour( { label, value, onChange } ) {
	const id = `harlow-colour-${ label.replace( /\W+/g, '-' ) }`;
	return (
		<BaseControl
			__nextHasNoMarginBottom
			label={ rowLabel( label ) }
			id={ id }
			className="harlow-style__colour harlow-row"
		>
			<div className="harlow-style__colour-row">
				<Dropdown
					className="harlow-style__colour-dropdown"
					popoverProps={ { placement: 'left-start', offset: 36 } }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<button
							type="button"
							id={ id }
							className="harlow-style__field"
							aria-expanded={ isOpen }
							aria-label={ `${ label }: ${
								shown( value ).name || __( 'Default', 'harlow' )
							}` }
							onClick={ onToggle }
						>
							<span
								className={ `harlow-style__swatch${
									value ? '' : ' is-none'
								}` }
								style={ {
									background:
										shown( value ).paint || 'transparent',
								} }
							/>
							<span
								className={ `harlow-style__value${ value ? '' : ' is-default' }` }
							>
								{ shown( value ).name ||
									__( 'Default', 'harlow' ) }
							</span>
						</button>
					) }
					renderContent={ () => (
						<div className="harlow-style__picker">
							<ColorPalette
								colors={ COLOURS }
								value={ shown( value ).paint }
								onChange={ ( v ) => {
									const brand = NAMED.find(
										( b ) => b.paint === v
									);
									onChange( brand ? brand.color : v || '' );
								} }
								clearable
								disableCustomColors
							/>
							<ColorPicker
								color={
									value && ! value.startsWith( 'var(' )
										? value
										: '#000000'
								}
								onChange={ ( v ) => onChange( v ) }
								enableAlpha
							/>
						</div>
					) }
				/>
				<ResetButton
					active={ !! value }
					label={ label }
					onClick={ () => onChange( '' ) }
				/>
			</div>
		</BaseControl>
	);
}

/**
 * A picture from the Media Library.
 *
 * @param {Object}   props
 * @param {string}   props.label    The label.
 * @param {number}   props.value    The picture's id, 0 for none.
 * @param {Function} props.onChange Called with the id, 0 to remove.
 */
function Picture( { label, value, onChange } ) {
	const url = usePictureUrl( value );
	return (
		<BaseControl
			__nextHasNoMarginBottom
			label={ label }
			id={ `harlow-picture-${ label.replace( /\W+/g, '-' ) }` }
		>
			{ url && (
				<img className="harlow-style__picture" src={ url } alt="" />
			) }
			<MediaUploadCheck>
				<MediaUpload
					allowedTypes={ [ 'image' ] }
					value={ value || undefined }
					onSelect={ ( p ) => {
						notePicked( p );
						onChange( p.id );
					} }
					render={ ( { open } ) => (
						<Button variant="secondary" onClick={ open }>
							{ value
								? __( 'Replace', 'harlow' )
								: __( 'Choose a picture', 'harlow' ) }
						</Button>
					) }
				/>
			</MediaUploadCheck>
			{ value && (
				<Button
					variant="link"
					isDestructive
					onClick={ () => onChange( 0 ) }
				>
					{ __( 'Remove', 'harlow' ) }
				</Button>
			) }
		</BaseControl>
	);
}

/**
 * A length: a number with its unit beside it.
 *
 * @param {Object}   props
 * @param {string}   props.label    The label.
 * @param {string}   props.value    The number, or ''.
 * @param {string}   props.unit     Its unit.
 * @param {Function} props.onChange Called with (number, unit).
 * @param {boolean}  props.negative Whether a negative number is allowed.
 * @param {string}   props.list     A datalist of suggested numbers.
 */
function Length( {
	label,
	value,
	unit,
	onChange,
	negative = false,
	list,
	units,
} ) {
	const u = unit || 'px';
	const unitList = units || UNITS;
	return (
		<div
			className={ `harlow-style__length harlow-row${
				unitList.length < 2 ? ' is-one-unit' : ''
			}` }
		>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ rowLabel( label ) }
				type="number"
				list={ list }
				min={ negative ? undefined : 0 }
				step="any"
				value={ value === undefined ? '' : value }
				onChange={ ( v ) => onChange( v, u ) }
			/>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Unit', 'harlow' ) }
				hideLabelFromVision
				value={ u }
				options={ unitList }
				onChange={ ( nu ) => onChange( value ?? '', nu ) }
			/>
		</div>
	);
}

/**
 * A row of choices, one pressed (the stable stand-in for a toggle group): a segmented
 * control, as Figma's and Elementor's, of icons where every choice has one (the words then
 * a tooltip, and read by screen readers).
 *
 * @param {Object}   props
 * @param {string}   props.label    The row's label.
 * @param {string}   props.value    The value pressed.
 * @param {Function} props.onChange Called with the value clicked.
 * @param {Object}   props.children The Choice elements.
 */
function Choices( { label, value, onChange, children } ) {
	const items = ( Array.isArray( children ) ? children : [ children ] )
		.flat()
		.filter( Boolean );
	const icons = items.every( ( c ) => c.props.icon );
	return (
		<BaseControl
			__nextHasNoMarginBottom
			label={ rowLabel( label ) }
			id={ `harlow-choices-${ label.replace( /\W+/g, '-' ) }` }
			className={ `harlow-row harlow-row--choices${ icons ? ' is-icons' : '' }` }
		>
			<div
				className="harlow-style__choices harlow-seg"
				role="radiogroup"
				aria-label={ label }
			>
				{ items.map( ( c ) => {
					const on = value === c.props.value;
					return (
						<Button
							key={ c.props.value }
							role="radio"
							aria-checked={ on }
							isPressed={ on }
							size="compact"
							className="harlow-seg__item"
							icon={ icons ? c.props.icon : undefined }
							label={ icons ? c.props.label : undefined }
							showTooltip={ icons }
							onClick={ () => onChange( c.props.value ) }
						>
							{ icons ? (
								<VisuallyHidden as="span">
									{ c.props.label }
								</VisuallyHidden>
							) : (
								rowLabel( c.props.label )
							) }
						</Button>
					);
				} ) }
			</div>
		</BaseControl>
	);
}

/**
 * One choice of a row (read by Choices; renders nothing itself).
 *
 * @param {Object} props
 * @param {string} props.value The value.
 * @param {string} props.label Its words.
 * @param {Object} props.icon  Its icon (every choice of the row has one, or none has).
 */
// eslint-disable-next-line no-unused-vars
function Choice( { value, label, icon } ) {
	return null;
}

/**
 * One of a list of words.
 *
 * @param {Object}   props
 * @param {string}   props.label    The label.
 * @param {string}   props.value    The word chosen, or ''.
 * @param {string[]} props.words    The words.
 * @param {Function} props.onChange Called with the word.
 * @param {Object}   props.names    What each word is called.
 */
function Words( { label, value, words, onChange, names = {} } ) {
	return (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ rowLabel( label ) }
			value={ value || '' }
			options={ [
				{ value: '', label: __( 'Default', 'harlow' ) },
				...words.map( ( w ) => ( {
					value: w,
					label: names[ w ] || w,
				} ) ),
			] }
			onChange={ onChange }
		/>
	);
}

/**
 * Is a value empty (nothing set in it, however deep)?
 *
 * @param {*} v A value of the style.
 * @return {boolean} Empty.
 */
function isEmpty( v ) {
	if ( v === '' || v === undefined || v === null || v === false ) {
		return true;
	}
	if ( typeof v === 'object' ) {
		return Object.values( v ).every( isEmpty );
	}
	return false;
}

/**
 * A style with its empty parts taken out (an empty device, an empty group).
 *
 * @param {Object} style The style.
 * @return {Object} The style, or {} when nothing is left.
 */
function cleanStyle( style ) {
	const out = {};
	for ( const [ k, v ] of Object.entries( style || {} ) ) {
		if ( ! isEmpty( v ) ) {
			out[ k ] = v;
		}
	}
	return out;
}

/**
 * Swap one class of a list for another.
 *
 * @param {string} classes The classes.
 * @param {string} from    The class taken off.
 * @param {string} to      The class put on.
 * @return {string} The classes.
 */
function swapClass( classes, from, to ) {
	const list = ( classes || '' ).split( /\s+/ ).filter( Boolean );
	const at = list.indexOf( from );
	if ( at >= 0 ) {
		list[ at ] = to;
	} else if ( ! list.includes( to ) ) {
		list.push( to );
	}
	return list.join( ' ' );
}

/**
 * A container's layout, as Elementor's Layout tab: content width, flexbox or grid (for
 * every device), then per device how its items sit.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes       The block's attributes.
 * @param {Function} props.setAttributes    Its setter.
 * @param {Object}   props.layout           This device's layout.
 * @param {Function} props.setIn            Set a group of this device's style.
 * @param {Function} props.setDesktopLayout Set the layout every device starts from.
 */
function LayoutPanel( {
	attributes,
	setAttributes,
	layout,
	setIn,
	setDesktopLayout,
} ) {
	const classes = attributes.classes || '';
	const isGrid = /(^|\s)e-grid(\s|$)/.test( classes );
	const set = ( patch ) => setIn( 'layout', patch );
	return (
		<Group
			title={ __( 'Layout', 'harlow' ) }
			icon={ layoutIcon }
			changed={ ! isEmpty( layout ) }
			onReset={ () => setIn( 'layout', undefined ) }
			initialOpen
		>
			<Choices
				label={ __( 'Content width', 'harlow' ) }
				value={ attributes.boxed ? 'boxed' : 'full' }
				onChange={ ( v ) =>
					setAttributes( {
						boxed: v === 'boxed',
						classes:
							v === 'boxed'
								? swapClass(
										classes,
										'e-con-full',
										'e-con-boxed'
									)
								: swapClass(
										classes,
										'e-con-boxed',
										'e-con-full'
									),
					} )
				}
			>
				<Choice value="boxed" label={ __( 'Boxed', 'harlow' ) } />
				<Choice value="full" label={ __( 'Full width', 'harlow' ) } />
			</Choices>
			<Choices
				label={ __( 'Container layout', 'harlow' ) }
				value={ isGrid ? 'grid' : 'flex' }
				onChange={ ( v ) => {
					setAttributes( {
						classes:
							v === 'grid'
								? swapClass( classes, 'e-flex', 'e-grid' )
								: swapClass( classes, 'e-grid', 'e-flex' ),
					} );
					setDesktopLayout( { display: v } );
				} }
			>
				<Choice value="flex" label={ __( 'Flexbox', 'harlow' ) } />
				<Choice value="grid" label={ __( 'Grid', 'harlow' ) } />
			</Choices>
			{ ! isGrid && (
				<>
					<Choices
						label={ __( 'Direction', 'harlow' ) }
						value={ layout.direction || '' }
						onChange={ ( v ) => set( { direction: v } ) }
					>
						<Choice
							value=""
							label={ __( 'Default', 'harlow' ) }
							icon={ alignNone }
						/>
						<Choice
							value="row"
							label={ __( 'Row →', 'harlow' ) }
							icon={ arrowRight }
						/>
						<Choice
							value="column"
							label={ __( 'Column ↓', 'harlow' ) }
							icon={ arrowDown }
						/>
						<Choice
							value="row-reverse"
							label={ __( 'Row ←', 'harlow' ) }
							icon={ arrowLeft }
						/>
						<Choice
							value="column-reverse"
							label={ __( 'Column ↑', 'harlow' ) }
							icon={ arrowUp }
						/>
					</Choices>
					{ /* Elementor's icons: how the items share the row, and where they sit across it. */ }
					<Choices
						label={ __( 'Justify content', 'harlow' ) }
						value={ layout.justify || '' }
						onChange={ ( v ) => set( { justify: v } ) }
					>
						<Choice
							value=""
							label={ __( 'Default', 'harlow' ) }
							icon={ alignNone }
						/>
						<Choice
							value="flex-start"
							label={ __( 'Start', 'harlow' ) }
							icon={ justifyLeft }
						/>
						<Choice
							value="center"
							label={ __( 'Centre', 'harlow' ) }
							icon={ justifyCenter }
						/>
						<Choice
							value="flex-end"
							label={ __( 'End', 'harlow' ) }
							icon={ justifyRight }
						/>
						<Choice
							value="space-between"
							label={ __( 'Space between', 'harlow' ) }
							icon={ justifySpaceBetween }
						/>
						<Choice
							value="space-around"
							label={ __( 'Space around', 'harlow' ) }
							icon={ justifySpaceAround }
						/>
						<Choice
							value="space-evenly"
							label={ __( 'Space evenly', 'harlow' ) }
							icon={ justifySpaceEvenly }
						/>
					</Choices>
					<Choices
						label={ __( 'Align items', 'harlow' ) }
						value={ layout.align || '' }
						onChange={ ( v ) => set( { align: v } ) }
					>
						<Choice
							value=""
							label={ __( 'Default', 'harlow' ) }
							icon={ alignNone }
						/>
						<Choice
							value="flex-start"
							label={ __( 'Start', 'harlow' ) }
							icon={ justifyTop }
						/>
						<Choice
							value="center"
							label={ __( 'Centre', 'harlow' ) }
							icon={ justifyCenterVertical }
						/>
						<Choice
							value="flex-end"
							label={ __( 'End', 'harlow' ) }
							icon={ justifyBottom }
						/>
						<Choice
							value="stretch"
							label={ __( 'Stretch', 'harlow' ) }
							icon={ justifyStretchVertical }
						/>
					</Choices>
					<Choices
						label={ __( 'Wrap', 'harlow' ) }
						value={ layout.wrap || '' }
						onChange={ ( v ) => set( { wrap: v } ) }
					>
						<Choice value="" label={ __( 'Default', 'harlow' ) } />
						<Choice
							value="nowrap"
							label={ __( 'No wrap', 'harlow' ) }
						/>
						<Choice value="wrap" label={ __( 'Wrap', 'harlow' ) } />
					</Choices>
					{ layout.wrap === 'wrap' && (
						<Words
							label={ __( 'Align content', 'harlow' ) }
							value={ layout.alignContent }
							words={ WORDS.alignContent }
							names={ {
								'flex-start': __( 'Start', 'harlow' ),
								center: __( 'Centre', 'harlow' ),
								'flex-end': __( 'End', 'harlow' ),
								'space-between': __(
									'Space between',
									'harlow'
								),
								'space-around': __( 'Space around', 'harlow' ),
								stretch: __( 'Stretch', 'harlow' ),
							} }
							onChange={ ( v ) => set( { alignContent: v } ) }
						/>
					) }
				</>
			) }
			{ isGrid && (
				<>
					<Length
						label={ __( 'Columns', 'harlow' ) }
						value={ layout.columns }
						unit=""
						units={ [ { value: '', label: '#' } ] }
						onChange={ ( v ) => set( { columns: v } ) }
					/>
					<Length
						label={ __( 'Rows', 'harlow' ) }
						value={ layout.rows }
						unit=""
						units={ [ { value: '', label: '#' } ] }
						onChange={ ( v ) => set( { rows: v } ) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __(
							'Custom columns (e.g. 2fr 1fr)',
							'harlow'
						) }
						value={ layout.columnsCustom || '' }
						onChange={ ( v ) => set( { columnsCustom: v } ) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Custom rows (e.g. auto 1fr)', 'harlow' ) }
						value={ layout.rowsCustom || '' }
						onChange={ ( v ) => set( { rowsCustom: v } ) }
					/>
					<Words
						label={ __( 'Auto flow', 'harlow' ) }
						value={ layout.autoFlow }
						words={ WORDS.autoFlow }
						names={ {
							row: __( 'Row', 'harlow' ),
							column: __( 'Column', 'harlow' ),
							'row dense': __( 'Row, dense', 'harlow' ),
							'column dense': __( 'Column, dense', 'harlow' ),
						} }
						onChange={ ( v ) => set( { autoFlow: v } ) }
					/>
					<Words
						label={ __( 'Justify items', 'harlow' ) }
						value={ layout.justifyItems }
						words={ WORDS.justifyItems }
						names={ {
							start: __( 'Start', 'harlow' ),
							center: __( 'Centre', 'harlow' ),
							end: __( 'End', 'harlow' ),
							stretch: __( 'Stretch', 'harlow' ),
						} }
						onChange={ ( v ) => set( { justifyItems: v } ) }
					/>
					<Words
						label={ __( 'Align items', 'harlow' ) }
						value={ layout.align }
						words={ [ 'start', 'center', 'end', 'stretch' ] }
						names={ {
							start: __( 'Start', 'harlow' ),
							center: __( 'Centre', 'harlow' ),
							end: __( 'End', 'harlow' ),
							stretch: __( 'Stretch', 'harlow' ),
						} }
						onChange={ ( v ) => set( { align: v } ) }
					/>
				</>
			) }
			<Length
				label={ __( 'Gap between columns', 'harlow' ) }
				value={ layout.columnGap }
				unit={ layout.gapUnit || 'px' }
				onChange={ ( v, u ) => set( { columnGap: v, gapUnit: u } ) }
			/>
			<Length
				label={ __( 'Gap between rows', 'harlow' ) }
				value={ layout.rowGap }
				unit={ layout.gapUnit || 'px' }
				onChange={ ( v, u ) => set( { rowGap: v, gapUnit: u } ) }
			/>
			<Words
				label={ __( 'Overflow', 'harlow' ) }
				value={ layout.overflow }
				words={ WORDS.overflow }
				names={ {
					visible: __( 'Visible', 'harlow' ),
					hidden: __( 'Hidden', 'harlow' ),
					auto: __( 'Scroll when needed', 'harlow' ),
				} }
				onChange={ ( v ) => set( { overflow: v } ) }
			/>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'HTML tag', 'harlow' ) }
				value={ attributes.tag || 'div' }
				options={ [
					'div',
					'section',
					'header',
					'footer',
					'main',
					'article',
					'aside',
					'nav',
					'a',
				].map( ( t ) => ( {
					value: t,
					label: t === 'a' ? __( 'a (a link)', 'harlow' ) : t,
				} ) ) }
				onChange={ ( v ) => setAttributes( { tag: v } ) }
			/>
			{ attributes.tag === 'a' && (
				<>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Link', 'harlow' ) }
						value={ attributes.link || '' }
						onChange={ ( v ) => setAttributes( { link: v } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Open in a new tab', 'harlow' ) }
						checked={ !! attributes.linkNewTab }
						onChange={ ( v ) => setAttributes( { linkNewTab: v } ) }
					/>
				</>
			) }
		</Group>
	);
}

/**
 * An element's place among its siblings and on the page (Elementor's Advanced → Layout).
 *
 * @param {Object}   props
 * @param {Object}   props.item  This device's item settings.
 * @param {Function} props.setIn Set a group of this device's style.
 */
function PositionControls( { item, setIn } ) {
	const set = ( patch ) => setIn( 'item', patch );
	const placed = [ 'absolute', 'fixed', 'relative', 'sticky' ].includes(
		item.position
	);
	return (
		<>
			<Choices
				label={ __( 'Width', 'harlow' ) }
				value={ item.widthMode || '' }
				onChange={ ( v ) => set( { widthMode: v } ) }
			>
				<Choice value="" label={ __( 'Default', 'harlow' ) } />
				<Choice value="full" label={ __( 'Full width', 'harlow' ) } />
				<Choice
					value="inline"
					label={ __( 'Inline (auto)', 'harlow' ) }
				/>
			</Choices>
			<Words
				label={ __( 'Align self', 'harlow' ) }
				value={ item.alignSelf }
				words={ WORDS.alignSelf }
				names={ {
					'flex-start': __( 'Start', 'harlow' ),
					center: __( 'Centre', 'harlow' ),
					'flex-end': __( 'End', 'harlow' ),
					stretch: __( 'Stretch', 'harlow' ),
				} }
				onChange={ ( v ) => set( { alignSelf: v } ) }
			/>
			<Choices
				label={ __( 'Order', 'harlow' ) }
				value={ item.order || '' }
				onChange={ ( v ) => set( { order: v } ) }
			>
				<Choice value="" label={ __( 'Default', 'harlow' ) } />
				<Choice value="start" label={ __( 'First', 'harlow' ) } />
				<Choice value="end" label={ __( 'Last', 'harlow' ) } />
				<Choice value="custom" label={ __( 'Custom', 'harlow' ) } />
			</Choices>
			{ item.order === 'custom' && (
				<Length
					label={ __( 'Custom order', 'harlow' ) }
					value={ item.orderCustom }
					unit=""
					units={ [ { value: '', label: '#' } ] }
					negative
					onChange={ ( v ) => set( { orderCustom: v } ) }
				/>
			) }
			<Choices
				label={ __( 'Size in its row', 'harlow' ) }
				value={ item.flexSize || '' }
				onChange={ ( v ) => set( { flexSize: v } ) }
			>
				<Choice value="" label={ __( 'Default', 'harlow' ) } />
				<Choice value="none" label={ __( 'None', 'harlow' ) } />
				<Choice value="grow" label={ __( 'Grow', 'harlow' ) } />
				<Choice value="shrink" label={ __( 'Shrink', 'harlow' ) } />
			</Choices>
			<Words
				label={ __( 'Position', 'harlow' ) }
				value={ item.position }
				words={ WORDS.position2 }
				names={ {
					static: __( 'Static', 'harlow' ),
					relative: __( 'Relative', 'harlow' ),
					absolute: __( 'Absolute', 'harlow' ),
					fixed: __( 'Fixed', 'harlow' ),
					sticky: __( 'Sticky', 'harlow' ),
				} }
				onChange={ ( v ) => set( { position: v } ) }
			/>
			{ placed &&
				SIDES.map( ( side ) => (
					<Length
						key={ side }
						label={
							{
								top: __( 'Offset from the top', 'harlow' ),
								right: __( 'Offset from the right', 'harlow' ),
								bottom: __(
									'Offset from the bottom',
									'harlow'
								),
								left: __( 'Offset from the left', 'harlow' ),
							}[ side ]
						}
						value={ item[ side ] }
						unit={ item.offsetUnit || 'px' }
						negative
						onChange={ ( v, u ) =>
							set( { [ side ]: v, offsetUnit: u } )
						}
					/>
				) ) }
			<Length
				label={ __( 'Z-index', 'harlow' ) }
				value={ item.zIndex }
				unit=""
				units={ [ { value: '', label: '#' } ] }
				negative
				onChange={ ( v ) => set( { zIndex: v } ) }
			/>
		</>
	);
}

/**
 * Borders: every side at once or each on its own (line, thickness, colour), and the
 * corners' rounding, all at once or each.
 *
 * @param {Object}   props
 * @param {Object}   props.border  This device's border.
 * @param {Function} props.setIn   Set a group of this device's style.
 * @param {string}   props.prefix  Words before each label (a part's name).
 * @param {boolean}  props.corners Its corners too (a line between rows has none).
 */
function BorderControls( { border, setIn, prefix = '', corners = true } ) {
	const [ which, setWhich ] = useState( 'all' );
	const [ corner, setCorner ] = useState( 'all' );
	const one = which === 'all' ? border : border[ which ] || {};
	const setOne = ( patch ) =>
		which === 'all'
			? setIn( 'border', patch )
			: setIn( 'border', { [ which ]: { ...one, ...patch } } );
	const lineNames = {
		none: __( 'None', 'harlow' ),
		solid: __( 'Solid', 'harlow' ),
		dashed: __( 'Dashed', 'harlow' ),
		dotted: __( 'Dotted', 'harlow' ),
		double: __( 'Double', 'harlow' ),
		groove: __( 'Groove', 'harlow' ),
		ridge: __( 'Ridge', 'harlow' ),
	};
	const cornerKey = corner === 'all' ? 'radius' : corner;
	return (
		<>
			<Choices
				label={ named( prefix, __( 'Side', 'harlow' ) ) }
				value={ which }
				onChange={ setWhich }
			>
				<Choice value="all" label={ __( 'All', 'harlow' ) } />
				<Choice value="top" label={ __( 'Top', 'harlow' ) } />
				<Choice value="right" label={ __( 'Right', 'harlow' ) } />
				<Choice value="bottom" label={ __( 'Bottom', 'harlow' ) } />
				<Choice value="left" label={ __( 'Left', 'harlow' ) } />
			</Choices>
			<Words
				label={ named( prefix, __( 'Line', 'harlow' ) ) }
				value={ one.style }
				words={ WORDS.borderStyle }
				names={ lineNames }
				onChange={ ( v ) => setOne( { style: v } ) }
			/>
			{ /* As Elementor's: a thickness and a colour once there is a line (or one is set). */ }
			{ ( ( one.style && one.style !== 'none' ) ||
				one.width ||
				one.color ) && (
				<>
					<Length
						label={ named( prefix, __( 'Thickness', 'harlow' ) ) }
						value={ one.width }
						unit="px"
						onChange={ ( v ) => setOne( { width: v } ) }
					/>
					<Colour
						label={ named(
							prefix,
							__( 'Border colour', 'harlow' )
						) }
						value={ one.color || '' }
						onChange={ ( v ) => setOne( { color: v } ) }
					/>
				</>
			) }
			{ corners && (
				<>
					<Choices
						label={ named( prefix, __( 'Corner', 'harlow' ) ) }
						value={ corner }
						onChange={ setCorner }
					>
						<Choice value="all" label={ __( 'All', 'harlow' ) } />
						<Choice value="topLeft" label={ __( '↖', 'harlow' ) } />
						<Choice
							value="topRight"
							label={ __( '↗', 'harlow' ) }
						/>
						<Choice
							value="bottomRight"
							label={ __( '↘', 'harlow' ) }
						/>
						<Choice
							value="bottomLeft"
							label={ __( '↙', 'harlow' ) }
						/>
					</Choices>
					<Length
						label={ named(
							prefix,
							__( 'Rounded corners', 'harlow' )
						) }
						value={ border[ cornerKey ] }
						unit="px"
						onChange={ ( v ) =>
							setIn( 'border', { [ cornerKey ]: v } )
						}
					/>
				</>
			) }
		</>
	);
}

/**
 * A shadow: offsets, blur, spread (a box's), colour, inset (a box's).
 *
 * @param {Object}   props
 * @param {string}   props.label    The label.
 * @param {*}        props.value    The shadow.
 * @param {boolean}  props.box      A box's shadow.
 * @param {Function} props.onChange Called with the shadow.
 */
function ShadowControls( { label, value, box = false, onChange } ) {
	const s = value && typeof value === 'object' ? value : {};
	const set = ( patch ) => onChange( { ...s, ...patch } );
	return (
		<div className="harlow-style__shadow">
			<p className="harlow-style__group">{ rowLabel( label ) }</p>
			<Colour
				label={ named( label, __( 'colour', 'harlow' ) ) }
				value={ s.color || '' }
				onChange={ ( v ) => set( { color: v } ) }
			/>
			{ s.color && (
				<>
					{ [
						[ 'x', __( 'Horizontal', 'harlow' ), -50, 50 ],
						[ 'y', __( 'Vertical', 'harlow' ), -50, 50 ],
						[ 'blur', __( 'Blur', 'harlow' ), 0, 100 ],
						...( box
							? [
									[
										'spread',
										__( 'Spread', 'harlow' ),
										-50,
										50,
									],
								]
							: [] ),
					].map( ( [ k, l, min, max ] ) => (
						<RangeControl
							key={ k }
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ rowLabel(
								named( label, l.toLowerCase() )
							) }
							value={
								s[ k ] === undefined ? 0 : Number( s[ k ] )
							}
							min={ min }
							max={ max }
							onChange={ ( v ) => set( { [ k ]: v } ) }
						/>
					) ) }
					{ box && (
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Inside (inset)', 'harlow' ) }
							checked={ !! s.inset }
							onChange={ ( v ) => set( { inset: v } ) }
						/>
					) }
				</>
			) }
		</div>
	);
}

/**
 * A transform: offsets, rotation, scale.
 *
 * @param {Object}   props
 * @param {Object}   props.value    The transform.
 * @param {Function} props.onChange Called with the changed parts.
 * @param {boolean}  props.full     Also the flips and the point it turns around.
 * @param {boolean}  props.hover    The hover state's (each label says so).
 */
function TransformControls( { value, onChange, full = false, hover = false } ) {
	// On hover, each label says so: the panel holds both states.
	const say = ( label ) =>
		/* translators: %s: a transform control's name */
		hover ? sprintf( __( '%s on hover', 'harlow' ), label ) : label;
	return (
		<>
			{ [
				[
					'rotate',
					say( __( 'Rotate (deg)', 'harlow' ) ),
					-360,
					360,
					1,
				],
				[ 'scale', say( __( 'Scale', 'harlow' ) ), 0, 3, 0.05 ],
				[ 'x', say( __( 'Offset X (px)', 'harlow' ) ), -300, 300, 1 ],
				[ 'y', say( __( 'Offset Y (px)', 'harlow' ) ), -300, 300, 1 ],
				[
					'rotateX',
					say( __( 'Rotate in 3D: X (deg)', 'harlow' ) ),
					-360,
					360,
					1,
				],
				[
					'rotateY',
					say( __( 'Rotate in 3D: Y (deg)', 'harlow' ) ),
					-360,
					360,
					1,
				],
				[
					'perspective',
					say( __( 'Perspective (px)', 'harlow' ) ),
					0,
					2000,
					10,
				],
				[ 'skewX', say( __( 'Skew X (deg)', 'harlow' ) ), -90, 90, 1 ],
				[ 'skewY', say( __( 'Skew Y (deg)', 'harlow' ) ), -90, 90, 1 ],
			].map( ( [ k, label, min, max, step ] ) => (
				<RangeControl
					key={ k }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ label }
					value={
						value[ k ] === undefined
							? undefined
							: Number( value[ k ] )
					}
					min={ min }
					max={ max }
					step={ step }
					allowReset
					onChange={ ( v ) =>
						onChange( { [ k ]: v === undefined ? '' : v } )
					}
				/>
			) ) }
			{ full && (
				<>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Flip horizontally', 'harlow' ) }
						checked={ !! value.flipX }
						onChange={ ( v ) => onChange( { flipX: v } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Flip vertically', 'harlow' ) }
						checked={ !! value.flipY }
						onChange={ ( v ) => onChange( { flipY: v } ) }
					/>
					<Words
						label={ __( 'Turns around: across', 'harlow' ) }
						value={ value.originX }
						words={ [ 'left', 'center', 'right' ] }
						names={ {
							left: __( 'Left', 'harlow' ),
							center: __( 'Centre', 'harlow' ),
							right: __( 'Right', 'harlow' ),
						} }
						onChange={ ( v ) => onChange( { originX: v } ) }
					/>
					<Words
						label={ __( 'Turns around: up and down', 'harlow' ) }
						value={ value.originY }
						words={ [ 'top', 'center', 'bottom' ] }
						names={ {
							top: __( 'Top', 'harlow' ),
							center: __( 'Centre', 'harlow' ),
							bottom: __( 'Bottom', 'harlow' ),
						} }
						onChange={ ( v ) => onChange( { originY: v } ) }
					/>
				</>
			) }
		</>
	);
}

/**
 * A label with a layer's words before it ("Overlay: Colour").
 *
 * @param {string} prefix The layer's words, or ''.
 * @param {string} label  The label.
 * @return {string} The label.
 */
const named = ( prefix, label ) =>
	prefix ? `${ prefix } ${ label }` : label;

/** The labels of a motion effect's controls, by the effect's name. */
const effectLabels = {
	direction: ( name ) =>
		sprintf(
			/* translators: %s: a motion effect (Vertical scroll, Mouse track…) */
			__( '%s: direction', 'harlow' ),
			name
		),
	speed: ( name ) =>
		sprintf(
			/* translators: %s: a motion effect (Vertical scroll, Mouse track…) */
			__( '%s: speed', 'harlow' ),
			name
		),
	level: ( name ) =>
		sprintf(
			/* translators: %s: a motion effect (Transparency, Blur) */
			__( '%s: level', 'harlow' ),
			name
		),
	start: ( name ) =>
		sprintf(
			/* translators: %s: a scrolling effect */
			__( '%s: starts at (% of the screen)', 'harlow' ),
			name
		),
	end: ( name ) =>
		sprintf(
			/* translators: %s: a scrolling effect */
			__( '%s: ends at (% of the screen)', 'harlow' ),
			name
		),
};

/**
 * Typography: font, size, weight, appearance, capitals, line height, letter and word
 * spacing, the words' outline.
 *
 * @param {Object}   props
 * @param {Object}   props.value    The typography.
 * @param {Function} props.onChange Called with a patch.
 * @param {string}   props.prefix   Words before each label (a part's name).
 * @param {boolean}  props.stroke   With the words' outline (not on a first letter).
 */
function TypographyControls( { value, onChange, prefix = '', stroke = true } ) {
	return (
		<>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ rowLabel( named( prefix, __( 'Font', 'harlow' ) ) ) }
				value={ value.font || '' }
				options={ FONTS }
				onChange={ ( v ) => onChange( { font: v } ) }
			/>
			<Length
				label={ named( prefix, __( 'Size', 'harlow' ) ) }
				value={ value.size }
				unit={ value.sizeUnit || 'px' }
				list="harlow-type-sizes"
				onChange={ ( v, u ) => onChange( { size: v, sizeUnit: u } ) }
			/>
			<Words
				label={ named( prefix, __( 'Weight', 'harlow' ) ) }
				value={ `${ value.weight ?? '' }` }
				words={ WORDS.weight }
				names={ {
					300: __( '300 Light', 'harlow' ),
					400: __( '400 Regular', 'harlow' ),
					500: __( '500 Medium', 'harlow' ),
					600: __( '600 Semi-bold', 'harlow' ),
					700: __( '700 Bold', 'harlow' ),
					800: __( '800 Extra bold', 'harlow' ),
				} }
				onChange={ ( v ) => onChange( { weight: v } ) }
			/>
			<Choices
				label={ named( prefix, __( 'Appearance', 'harlow' ) ) }
				value={ `${ value.style || '' }|${ value.decoration || '' }` }
				onChange={ ( v ) => {
					const [ s, d ] = v.split( '|' );
					onChange( { style: s, decoration: d } );
				} }
			>
				<Choice
					value="|"
					label={ named( prefix, __( 'Default', 'harlow' ) ) }
				/>
				<Choice
					value="normal|none"
					label={ named( prefix, __( 'None', 'harlow' ) ) }
				/>
				<Choice
					value="italic|"
					label={ named( prefix, __( 'Italic', 'harlow' ) ) }
				/>
				<Choice
					value="|underline"
					label={ named( prefix, __( 'Underline', 'harlow' ) ) }
				/>
				<Choice
					value="italic|underline"
					label={ named( prefix, __( 'Both', 'harlow' ) ) }
				/>
			</Choices>
			<Words
				label={ named( prefix, __( 'Capitals', 'harlow' ) ) }
				value={ value.transform }
				words={ [ 'none', 'uppercase', 'lowercase', 'capitalize' ] }
				names={ {
					none: __( 'As typed', 'harlow' ),
					uppercase: __( 'ALL CAPITALS', 'harlow' ),
					lowercase: __( 'all small', 'harlow' ),
					capitalize: __( 'Capital At Each Word', 'harlow' ),
				} }
				onChange={ ( v ) => onChange( { transform: v } ) }
			/>
			<Length
				label={ named( prefix, __( 'Line height', 'harlow' ) ) }
				value={ value.lineHeight }
				unit={ value.lineHeightUnit || 'em' }
				onChange={ ( v, u ) =>
					onChange( {
						lineHeight: v,
						lineHeightUnit: u,
					} )
				}
			/>
			<Length
				label={ named( prefix, __( 'Letter spacing', 'harlow' ) ) }
				value={ value.letterSpacing }
				unit="px"
				negative
				onChange={ ( v ) => onChange( { letterSpacing: v } ) }
			/>
			<Length
				label={ named( prefix, __( 'Word spacing', 'harlow' ) ) }
				value={ value.wordSpacing }
				unit={ value.wordSpacingUnit || 'px' }
				units={ [
					{ value: 'px', label: 'px' },
					{ value: 'em', label: 'em' },
				] }
				negative
				onChange={ ( v, u ) =>
					onChange( {
						wordSpacing: v,
						wordSpacingUnit: u,
					} )
				}
			/>
			{ /* A first letter (a drop cap) takes no stroke: browsers draw none there. */ }
			{ stroke && (
				<>
					<Length
						label={ named(
							prefix,
							__( 'Text stroke (px)', 'harlow' )
						) }
						value={ value.stroke?.width }
						unit="px"
						units={ [ { value: 'px', label: 'px' } ] }
						onChange={ ( v ) =>
							onChange( {
								stroke: { ...( value.stroke || {} ), width: v },
							} )
						}
					/>
					<Colour
						label={ named(
							prefix,
							__( 'Text stroke colour', 'harlow' )
						) }
						value={ value.stroke?.color || '' }
						onChange={ ( v ) =>
							onChange( {
								stroke: { ...( value.stroke || {} ), color: v },
							} )
						}
					/>
				</>
			) }
		</>
	);
}

/** What each blend mode is called. */
const BLEND_NAMES = {
	normal: __( 'Normal', 'harlow' ),
	multiply: __( 'Multiply', 'harlow' ),
	screen: __( 'Screen', 'harlow' ),
	overlay: __( 'Overlay', 'harlow' ),
	darken: __( 'Darken', 'harlow' ),
	lighten: __( 'Lighten', 'harlow' ),
	'color-dodge': __( 'Colour dodge', 'harlow' ),
	'color-burn': __( 'Colour burn', 'harlow' ),
	'hard-light': __( 'Hard light', 'harlow' ),
	'soft-light': __( 'Soft light', 'harlow' ),
	difference: __( 'Difference', 'harlow' ),
	exclusion: __( 'Exclusion', 'harlow' ),
	hue: __( 'Hue', 'harlow' ),
	saturation: __( 'Saturation', 'harlow' ),
	color: __( 'Colour', 'harlow' ),
	luminosity: __( 'Luminosity', 'harlow' ),
};

/**
 * A gradient: its two colours, each at its position, linear at an angle or radial from a
 * point.
 *
 * @param {Object}   props
 * @param {Object}   props.value    The background.
 * @param {Function} props.onChange Called with a patch.
 * @param {string}   props.prefix   Words before each label (another layer's).
 */
function GradientControls( { value, onChange, prefix = '' } ) {
	return (
		<>
			<Colour
				label={ named( prefix, __( 'From', 'harlow' ) ) }
				value={ value.color || '' }
				onChange={ ( v ) => onChange( { color: v } ) }
			/>
			<RangeControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ rowLabel(
					named( prefix, __( 'From: position (%)', 'harlow' ) )
				) }
				value={ value.stop ?? 0 }
				min={ 0 }
				max={ 100 }
				onChange={ ( v ) => onChange( { stop: v } ) }
			/>
			<Colour
				label={ named( prefix, __( 'To', 'harlow' ) ) }
				value={ value.color2 || '' }
				onChange={ ( v ) => onChange( { color2: v } ) }
			/>
			<RangeControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ rowLabel(
					named( prefix, __( 'To: position (%)', 'harlow' ) )
				) }
				value={ value.stop2 ?? 100 }
				min={ 0 }
				max={ 100 }
				onChange={ ( v ) => onChange( { stop2: v } ) }
			/>
			<Choices
				label={ named( prefix, __( 'Gradient type', 'harlow' ) ) }
				value={ value.gradientType || 'linear' }
				onChange={ ( v ) => onChange( { gradientType: v } ) }
			>
				<Choice value="linear" label={ __( 'Linear', 'harlow' ) } />
				<Choice value="radial" label={ __( 'Radial', 'harlow' ) } />
			</Choices>
			{ value.gradientType === 'radial' ? (
				<Words
					label={ named( prefix, __( 'Centre', 'harlow' ) ) }
					value={ value.radialAt }
					words={ WORDS.position }
					onChange={ ( v ) => onChange( { radialAt: v } ) }
				/>
			) : (
				<RangeControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ rowLabel(
						named( prefix, __( 'Angle', 'harlow' ) )
					) }
					value={ value.angle ?? 180 }
					min={ 0 }
					max={ 360 }
					onChange={ ( v ) => onChange( { angle: v } ) }
				/>
			) }
		</>
	);
}

/**
 * A background picture: the picture, where it sits and how large it is (each as a word or
 * in numbers), whether it repeats, whether it scrolls.
 *
 * @param {Object}   props
 * @param {Object}   props.value    The background.
 * @param {Function} props.onChange Called with a patch.
 * @param {string}   props.prefix   Words before each label (another layer's).
 */
function PictureControls( { value, onChange, prefix = '' } ) {
	const place = [
		{ value: '%', label: '%' },
		{ value: 'px', label: 'px' },
		{ value: 'em', label: 'em' },
		{ value: 'vw', label: 'vw' },
	];
	return (
		<>
			<Picture
				label={ named( prefix, __( 'Picture', 'harlow' ) ) }
				value={ value.image || 0 }
				onChange={ ( v ) => onChange( { image: v } ) }
			/>
			<Words
				label={ named( prefix, __( 'Position', 'harlow' ) ) }
				value={ value.position }
				words={ [ ...WORDS.position, 'custom' ] }
				names={ { custom: __( 'Custom', 'harlow' ) } }
				onChange={ ( v ) => onChange( { position: v } ) }
			/>
			{ value.position === 'custom' && (
				<>
					<Length
						label={ named(
							prefix,
							__( 'From the left', 'harlow' )
						) }
						value={ value.posX }
						unit={ value.posXUnit || '%' }
						units={ place }
						negative
						onChange={ ( v, u ) =>
							onChange( { posX: v, posXUnit: u } )
						}
					/>
					<Length
						label={ named(
							prefix,
							__( 'From the top', 'harlow' )
						) }
						value={ value.posY }
						unit={ value.posYUnit || '%' }
						units={ place }
						negative
						onChange={ ( v, u ) =>
							onChange( { posY: v, posYUnit: u } )
						}
					/>
				</>
			) }
			<Words
				label={ named( prefix, __( 'Size', 'harlow' ) ) }
				value={ value.size }
				words={ [ ...WORDS.size, 'custom' ] }
				names={ {
					auto: __( 'As is', 'harlow' ),
					cover: __( 'Cover', 'harlow' ),
					contain: __( 'Fit inside', 'harlow' ),
					custom: __( 'Custom', 'harlow' ),
				} }
				onChange={ ( v ) => onChange( { size: v } ) }
			/>
			{ value.size === 'custom' && (
				<Length
					label={ named( prefix, __( 'Picture width', 'harlow' ) ) }
					value={ value.sizeWidth }
					unit={ value.sizeWidthUnit || '%' }
					units={ place }
					onChange={ ( v, u ) =>
						onChange( { sizeWidth: v, sizeWidthUnit: u } )
					}
				/>
			) }
			<Words
				label={ named( prefix, __( 'Repeat', 'harlow' ) ) }
				value={ value.repeat }
				words={ WORDS.repeat }
				onChange={ ( v ) => onChange( { repeat: v } ) }
			/>
			<Words
				label={ named( prefix, __( 'Attachment', 'harlow' ) ) }
				value={ value.attachment }
				words={ WORDS.attachment }
				names={ {
					scroll: __( 'Scrolls with the page', 'harlow' ),
					fixed: __( 'Fixed', 'harlow' ),
				} }
				onChange={ ( v ) => onChange( { attachment: v } ) }
			/>
		</>
	);
}

/**
 * One picture of a slideshow, small.
 *
 * @param {Object} props
 * @param {number} props.id The picture's id.
 */
function Thumb( { id } ) {
	const url = usePictureUrl( id );
	return url ? (
		<img className="harlow-style__thumb" src={ url } alt="" />
	) : null;
}

/**
 * A background slideshow: its pictures, how long each shows, how one gives way to the
 * next, the slow zoom, how the pictures fill the box, whether it starts again.
 *
 * @param {Object}   props
 * @param {Object}   props.value    The background.
 * @param {Function} props.onChange Called with a patch.
 */
function SlideshowControls( { value, onChange } ) {
	const slides = value.slides || [];
	const ms = [ { value: 'ms', label: 'ms' } ];
	return (
		<>
			<BaseControl
				__nextHasNoMarginBottom
				label={ __( 'Pictures', 'harlow' ) }
				id="harlow-slideshow-pictures"
			>
				<div className="harlow-style__thumbs">
					{ slides.map( ( id ) => (
						<Thumb key={ id } id={ id } />
					) ) }
				</div>
				<MediaUploadCheck>
					<MediaUpload
						allowedTypes={ [ 'image' ] }
						multiple
						value={ slides }
						onSelect={ ( picked ) => {
							notePicked( picked );
							onChange( {
								slides: picked.map( ( pic ) => pic.id ),
							} );
						} }
						render={ ( { open } ) => (
							<Button variant="secondary" onClick={ open }>
								{ slides.length
									? __( 'Change the pictures', 'harlow' )
									: __( 'Choose pictures', 'harlow' ) }
							</Button>
						) }
					/>
				</MediaUploadCheck>
			</BaseControl>
			<Length
				label={ __( 'Each picture shows for (ms)', 'harlow' ) }
				value={ value.duration }
				unit="ms"
				units={ ms }
				onChange={ ( v ) => onChange( { duration: v } ) }
			/>
			<Words
				label={ __( 'Transition', 'harlow' ) }
				value={ value.transition }
				words={ [
					'fade',
					'slide_left',
					'slide_right',
					'slide_up',
					'slide_down',
				] }
				names={ {
					fade: __( 'Fade', 'harlow' ),
					slide_left: __( 'Slide from the right', 'harlow' ),
					slide_right: __( 'Slide from the left', 'harlow' ),
					slide_up: __( 'Slide up', 'harlow' ),
					slide_down: __( 'Slide down', 'harlow' ),
				} }
				onChange={ ( v ) => onChange( { transition: v } ) }
			/>
			<Length
				label={ __( 'Transition duration (ms)', 'harlow' ) }
				value={ value.transitionDuration }
				unit="ms"
				units={ ms }
				onChange={ ( v ) => onChange( { transitionDuration: v } ) }
			/>
			<Words
				label={ __( 'Ken Burns effect', 'harlow' ) }
				value={ value.kenBurns }
				words={ [ 'in', 'out' ] }
				names={ {
					in: __( 'Zoom in', 'harlow' ),
					out: __( 'Zoom out', 'harlow' ),
				} }
				onChange={ ( v ) => onChange( { kenBurns: v } ) }
			/>
			<Words
				label={ __( 'Pictures: size', 'harlow' ) }
				value={ value.slideSize }
				words={ WORDS.size }
				names={ {
					auto: __( 'As is', 'harlow' ),
					cover: __( 'Cover', 'harlow' ),
					contain: __( 'Fit inside', 'harlow' ),
				} }
				onChange={ ( v ) => onChange( { slideSize: v } ) }
			/>
			<Words
				label={ __( 'Pictures: position', 'harlow' ) }
				value={ value.slidePosition }
				words={ WORDS.position }
				onChange={ ( v ) => onChange( { slidePosition: v } ) }
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Start again after the last picture', 'harlow' ) }
				checked={ value.loop !== false }
				onChange={ ( v ) => onChange( { loop: v } ) }
			/>
		</>
	);
}

/**
 * A layer's paint: its type (none, colour, gradient, picture; a slideshow for a
 * container's own background) and what that type takes.
 *
 * @param {Object}   props
 * @param {Object}   props.value    The background.
 * @param {Function} props.onChange Called with a patch.
 * @param {string}   props.label    The type row's label.
 * @param {string[]} props.types    The types offered.
 * @param {string}   props.prefix   Words before each label (another layer's).
 * @param {boolean}  props.tint     Offer the colour over the picture.
 */
function BackgroundControls( {
	value,
	onChange,
	label,
	types = [ 'none', 'color', 'gradient', 'image' ],
	prefix = '',
	tint = false,
} ) {
	const names = {
		none: __( 'None', 'harlow' ),
		color: __( 'Colour', 'harlow' ),
		gradient: __( 'Gradient', 'harlow' ),
		image: __( 'Picture', 'harlow' ),
		slideshow: __( 'Slideshow', 'harlow' ),
	};
	return (
		<>
			<Choices
				label={ label }
				value={ value.type || '' }
				onChange={ ( v ) => onChange( { type: v } ) }
			>
				<Choice value="" label={ __( 'Default', 'harlow' ) } />
				{ types.map( ( type ) => (
					<Choice
						key={ type }
						value={ type }
						label={ names[ type ] }
					/>
				) ) }
			</Choices>
			{ value.type === 'color' && (
				<Colour
					label={ named( prefix, __( 'Colour', 'harlow' ) ) }
					value={ value.color || '' }
					onChange={ ( v ) => onChange( { color: v } ) }
				/>
			) }
			{ value.type === 'gradient' && (
				<GradientControls
					value={ value }
					onChange={ onChange }
					prefix={ prefix }
				/>
			) }
			{ value.type === 'image' && (
				<>
					<PictureControls
						value={ value }
						onChange={ onChange }
						prefix={ prefix }
					/>
					{ tint && (
						<Colour
							label={ __( 'Colour over the picture', 'harlow' ) }
							value={ value.overlay || '' }
							onChange={ ( v ) => onChange( { overlay: v } ) }
						/>
					) }
				</>
			) }
			{ value.type === 'slideshow' && (
				<SlideshowControls value={ value } onChange={ onChange } />
			) }
		</>
	);
}

/**
 * A picture's or a layer's CSS filters.
 *
 * @param {Object}   props
 * @param {Object}   props.value    The filters.
 * @param {Function} props.onChange Called with a patch.
 * @param {string}   props.suffix   Words after each label (on hover).
 */
function FilterControls( { value, onChange, suffix = '' } ) {
	return [
		[ 'brightness', __( 'Brightness (%)', 'harlow' ), 200 ],
		[ 'contrast', __( 'Contrast (%)', 'harlow' ), 200 ],
		[ 'saturate', __( 'Saturation (%)', 'harlow' ), 200 ],
		[ 'blur', __( 'Blur (px)', 'harlow' ), 10 ],
		[ 'hue', __( 'Hue (deg)', 'harlow' ), 360 ],
	].map( ( [ k, label, max ] ) => (
		<RangeControl
			key={ k }
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ suffix ? `${ label } ${ suffix }` : label }
			value={
				value?.[ k ] === undefined ? undefined : Number( value[ k ] )
			}
			min={ 0 }
			max={ max }
			allowReset
			onChange={ ( v ) =>
				onChange( { [ k ]: v === undefined ? '' : v } )
			}
		/>
	) );
}

/**
 * A container's shape dividers, top and bottom.
 *
 * @param {Object}   props
 * @param {Object}   props.shapes   The style's shapes.
 * @param {Function} props.onChange Called with the shapes.
 */
function ShapeControls( { shapes, onChange } ) {
	const [ side, setSide ] = useState( 'top' );
	const one = shapes[ side ] || {};
	const set = ( patch ) =>
		onChange( { ...shapes, [ side ]: { ...one, ...patch } } );
	const px = [ { value: 'px', label: 'px' } ];
	return (
		<>
			<Choices
				label={ __( 'Shape divider: side', 'harlow' ) }
				value={ side }
				onChange={ setSide }
			>
				<Choice value="top" label={ __( 'Top', 'harlow' ) } />
				<Choice value="bottom" label={ __( 'Bottom', 'harlow' ) } />
			</Choices>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Shape', 'harlow' ) }
				value={ one.type || '' }
				options={ [
					{ value: '', label: __( 'None', 'harlow' ) },
					...Object.entries( SHAPES ).map( ( [ value, shape ] ) => ( {
						value,
						label: shape.label,
					} ) ),
				] }
				onChange={ ( v ) => set( { type: v } ) }
			/>
			{ one.type && (
				<>
					<Colour
						label={ __( 'Shape colour', 'harlow' ) }
						value={ one.color || '' }
						onChange={ ( v ) => set( { color: v } ) }
					/>
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Shape width (%)', 'harlow' ) }
						value={ one.width ?? 100 }
						min={ 100 }
						max={ 300 }
						onChange={ ( v ) => set( { width: v } ) }
					/>
					<Length
						label={ __( 'Shape height', 'harlow' ) }
						value={ one.height }
						unit="px"
						units={ px }
						onChange={ ( v ) => set( { height: v } ) }
					/>
					<Length
						label={ __( 'Shape height on tablets', 'harlow' ) }
						value={ one.heightTablet }
						unit="px"
						units={ px }
						onChange={ ( v ) => set( { heightTablet: v } ) }
					/>
					<Length
						label={ __( 'Shape height on phones', 'harlow' ) }
						value={ one.heightMobile }
						unit="px"
						units={ px }
						onChange={ ( v ) => set( { heightMobile: v } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Flip the shape', 'harlow' ) }
						checked={ !! one.flip }
						onChange={ ( v ) => set( { flip: v } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Invert the shape', 'harlow' ) }
						checked={ !! one.invert }
						onChange={ ( v ) => set( { invert: v } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Bring the shape to the front', 'harlow' ) }
						checked={ !! one.front }
						onChange={ ( v ) => set( { front: v } ) }
					/>
				</>
			) }
		</>
	);
}

/** Every breakpoint, as the owner reads it. */
const DEVICE_LABELS = {
	desktop: __( 'Desktop', 'harlow' ),
	widescreen: __( 'Widescreen', 'harlow' ),
	laptop: __( 'Laptop', 'harlow' ),
	tabletExtra: __( 'Tablet extra', 'harlow' ),
	tablet: __( 'Tablet', 'harlow' ),
	mobileExtra: __( 'Mobile extra', 'harlow' ),
	mobile: __( 'Mobile', 'harlow' ),
};

/** The devices, by key, as the owner reads them. */
const DEVICE_NAMES = {
	desktop: __( 'Desktop', 'harlow' ),
	tablet: __( 'Tablet', 'harlow' ),
	mobile: __( 'Mobile', 'harlow' ),
};

/**
 * Which devices something runs on (all, when none is ticked).
 *
 * @param {Object}   props
 * @param {string}   props.label    The row's label.
 * @param {string[]} props.value    The devices ticked.
 * @param {Function} props.onChange Called with the devices.
 */
function DeviceChoices( { label, value = [], onChange } ) {
	return (
		<BaseControl
			__nextHasNoMarginBottom
			label={ label }
			id={ `harlow-devices-${ label.replace( /\W+/g, '-' ) }` }
		>
			{ Object.entries( DEVICE_NAMES ).map( ( [ key, name ] ) => (
				<CheckboxControl
					key={ key }
					__nextHasNoMarginBottom
					label={ name }
					checked={ ! value.length || value.includes( key ) }
					onChange={ ( on ) => {
						const all = value.length
							? value
							: Object.keys( DEVICE_NAMES );
						const next = on
							? [ ...new Set( [ ...all, key ] ) ]
							: all.filter( ( d ) => d !== key );
						onChange(
							next.length === Object.keys( DEVICE_NAMES ).length
								? []
								: next
						);
					} }
				/>
			) ) }
		</BaseControl>
	);
}

/**
 * Motion effects (Elementor Pro's): scrolling effects, mouse effects, sticky, and the
 * devices they run on.
 *
 * @param {Object}   props
 * @param {Object}   props.motion   The style's motion.
 * @param {Function} props.onChange Called with the motion.
 */
function MotionEffects( { motion, onChange } ) {
	const scroll = motion.scroll || {};
	const mouse = motion.mouse || {};
	const sticky = motion.sticky || {};
	const setFx = ( key, patch ) =>
		onChange( {
			...motion,
			scroll: {
				...scroll,
				[ key ]: { ...( scroll[ key ] || {} ), ...patch },
			},
		} );
	const setMouse = ( key, patch ) =>
		onChange( {
			...motion,
			mouse: {
				...mouse,
				[ key ]: { ...( mouse[ key ] || {} ), ...patch },
			},
		} );
	const setSticky = ( patch ) =>
		onChange( { ...motion, sticky: { ...sticky, ...patch } } );
	const fades = [
		[ 'in', __( 'Fade in', 'harlow' ) ],
		[ 'out', __( 'Fade out', 'harlow' ) ],
		[ 'in-out', __( 'Fade in then out', 'harlow' ) ],
		[ 'out-in', __( 'Fade out then in', 'harlow' ) ],
	];
	const sides = [
		[ 'left', __( 'To the left', 'harlow' ) ],
		[ 'right', __( 'To the right', 'harlow' ) ],
	];
	const effects = [
		[
			'y',
			__( 'Vertical scroll', 'harlow' ),
			'speed',
			10,
			[
				[ 'up', __( 'Up', 'harlow' ) ],
				[ 'down', __( 'Down', 'harlow' ) ],
			],
		],
		[ 'x', __( 'Horizontal scroll', 'harlow' ), 'speed', 10, sides ],
		[ 'opacity', __( 'Transparency', 'harlow' ), 'level', 10, fades ],
		[ 'blur', __( 'Blur', 'harlow' ), 'level', 15, fades ],
		[ 'rotate', __( 'Rotate', 'harlow' ), 'speed', 10, sides ],
		[
			'scale',
			__( 'Scale', 'harlow' ),
			'speed',
			10,
			[
				[ 'up', __( 'Grow', 'harlow' ) ],
				[ 'down', __( 'Shrink', 'harlow' ) ],
				[ 'up-down', __( 'Grow then shrink', 'harlow' ) ],
				[ 'down-up', __( 'Shrink then grow', 'harlow' ) ],
			],
		],
	];
	return (
		<>
			<p className="harlow-style__group">
				{ __( 'Scrolling effects', 'harlow' ) }
			</p>
			{ effects.map( ( [ key, label, amount, max, directions ] ) => {
				const fx = scroll[ key ] || {};
				return (
					<div key={ key } className="harlow-style__effect">
						<ToggleControl
							__nextHasNoMarginBottom
							label={ label }
							checked={ !! fx.on }
							onChange={ ( v ) => setFx( key, { on: v } ) }
						/>
						{ fx.on && (
							<>
								<SelectControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ effectLabels.direction( label ) }
									value={
										fx.direction || directions[ 0 ][ 0 ]
									}
									options={ directions.map(
										( [ value, name ] ) => ( {
											value,
											label: name,
										} )
									) }
									onChange={ ( v ) =>
										setFx( key, { direction: v } )
									}
								/>
								<RangeControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={
										amount === 'speed'
											? effectLabels.speed( label )
											: effectLabels.level( label )
									}
									value={ fx[ amount ] ?? 4 }
									min={ 0 }
									max={ max }
									step={ 0.1 }
									onChange={ ( v ) =>
										setFx( key, { [ amount ]: v } )
									}
								/>
								<RangeControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ effectLabels.start( label ) }
									value={ fx.start ?? 0 }
									min={ 0 }
									max={ 100 }
									onChange={ ( v ) =>
										setFx( key, { start: v } )
									}
								/>
								<RangeControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ effectLabels.end( label ) }
									value={ fx.end ?? 100 }
									min={ 0 }
									max={ 100 }
									onChange={ ( v ) =>
										setFx( key, { end: v } )
									}
								/>
							</>
						) }
					</div>
				);
			} ) }
			<p className="harlow-style__group">
				{ __( 'Mouse effects', 'harlow' ) }
			</p>
			{ [
				[ 'track', __( 'Mouse track', 'harlow' ), 1 ],
				[ 'tilt', __( '3D tilt', 'harlow' ), 4 ],
			].map( ( [ key, label, speed ] ) => {
				const fx = mouse[ key ] || {};
				return (
					<div key={ key } className="harlow-style__effect">
						<ToggleControl
							__nextHasNoMarginBottom
							label={ label }
							checked={ !! fx.on }
							onChange={ ( v ) => setMouse( key, { on: v } ) }
						/>
						{ fx.on && (
							<>
								<SelectControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ effectLabels.direction( label ) }
									value={ fx.direction || 'opposite' }
									options={ [
										{
											value: 'opposite',
											label: __( 'Opposite', 'harlow' ),
										},
										{
											value: 'direct',
											label: __( 'Direct', 'harlow' ),
										},
									] }
									onChange={ ( v ) =>
										setMouse( key, { direction: v } )
									}
								/>
								<RangeControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ effectLabels.speed( label ) }
									value={ fx.speed ?? speed }
									min={ 0 }
									max={ 10 }
									step={ 0.1 }
									onChange={ ( v ) =>
										setMouse( key, { speed: v } )
									}
								/>
							</>
						) }
					</div>
				);
			} ) }
			<DeviceChoices
				label={ __( 'Effects run on', 'harlow' ) }
				value={ motion.devices || [] }
				onChange={ ( v ) => onChange( { ...motion, devices: v } ) }
			/>
			<p className="harlow-style__group">{ __( 'Sticky', 'harlow' ) }</p>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Sticky', 'harlow' ) }
				value={ sticky.on || '' }
				options={ [
					{ value: '', label: __( 'None', 'harlow' ) },
					{ value: 'top', label: __( 'Top', 'harlow' ) },
					{ value: 'bottom', label: __( 'Bottom', 'harlow' ) },
				] }
				onChange={ ( v ) => setSticky( { on: v } ) }
			/>
			{ sticky.on && (
				<>
					<Length
						label={ __( 'Sticky offset (px)', 'harlow' ) }
						value={ sticky.offset }
						unit="px"
						units={ [ { value: 'px', label: 'px' } ] }
						onChange={ ( v ) => setSticky( { offset: v } ) }
					/>
					<Length
						label={ __( 'Effects offset (px)', 'harlow' ) }
						value={ sticky.effectsOffset }
						unit="px"
						units={ [ { value: 'px', label: 'px' } ] }
						onChange={ ( v ) => setSticky( { effectsOffset: v } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Stay in its column', 'harlow' ) }
						checked={ !! sticky.column }
						onChange={ ( v ) => setSticky( { column: v } ) }
					/>
					<DeviceChoices
						label={ __( 'Sticky on', 'harlow' ) }
						value={ sticky.devices || [] }
						onChange={ ( v ) => setSticky( { devices: v } ) }
					/>
				</>
			) }
		</>
	);
}

/** The days of the week, Sunday first (PHP's date 'w'). */
const DAYS = [
	__( 'Sunday', 'harlow' ),
	__( 'Monday', 'harlow' ),
	__( 'Tuesday', 'harlow' ),
	__( 'Wednesday', 'harlow' ),
	__( 'Thursday', 'harlow' ),
	__( 'Friday', 'harlow' ),
	__( 'Saturday', 'harlow' ),
];

/**
 * Display conditions (Elementor Pro's): who sees the element and when
 * (harlow_conditions_met()).
 *
 * @param {Object}   props
 * @param {Object}   props.value    The conditions.
 * @param {Function} props.onChange Called with the conditions.
 */
function ConditionsControls( { value, onChange } ) {
	const set = ( patch ) => onChange( { ...value, ...patch } );
	const roles = site.roles || {};
	const days = value.days || [];
	return (
		<>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Show to', 'harlow' ) }
				value={ value.login || '' }
				options={ [
					{ value: '', label: __( 'Everyone', 'harlow' ) },
					{
						value: 'in',
						label: __( 'Logged-in visitors', 'harlow' ),
					},
					{
						value: 'out',
						label: __( 'Visitors who are not logged in', 'harlow' ),
					},
				] }
				onChange={ ( v ) => set( { login: v } ) }
			/>
			<BaseControl
				__nextHasNoMarginBottom
				label={ __( 'Only these roles', 'harlow' ) }
				id="harlow-conditions-roles"
			>
				{ Object.entries( roles ).map( ( [ role, name ] ) => (
					<CheckboxControl
						key={ role }
						__nextHasNoMarginBottom
						label={ name }
						checked={ ( value.roles || [] ).includes( role ) }
						onChange={ ( on ) =>
							set( {
								roles: on
									? [ ...( value.roles || [] ), role ]
									: ( value.roles || [] ).filter(
											( r ) => r !== role
										),
							} )
						}
					/>
				) ) }
			</BaseControl>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				type="date"
				label={ __( 'Show from (date)', 'harlow' ) }
				value={ value.from || '' }
				onChange={ ( v ) => set( { from: v } ) }
			/>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				type="date"
				label={ __( 'Show until (date)', 'harlow' ) }
				value={ value.until || '' }
				onChange={ ( v ) => set( { until: v } ) }
			/>
			<BaseControl
				__nextHasNoMarginBottom
				label={ __( 'Only on these days', 'harlow' ) }
				id="harlow-conditions-days"
			>
				{ DAYS.map( ( name, i ) => (
					<CheckboxControl
						key={ name }
						__nextHasNoMarginBottom
						label={ name }
						checked={ days.includes( i ) }
						onChange={ ( on ) =>
							set( {
								days: on
									? [ ...days, i ].sort()
									: days.filter( ( d ) => d !== i ),
							} )
						}
					/>
				) ) }
			</BaseControl>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				type="time"
				label={ __( 'From time of day', 'harlow' ) }
				value={ value.timeFrom || '' }
				onChange={ ( v ) => set( { timeFrom: v } ) }
			/>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				type="time"
				label={ __( 'Until time of day', 'harlow' ) }
				value={ value.timeTo || '' }
				onChange={ ( v ) => set( { timeTo: v } ) }
			/>
		</>
	);
}

/** The entrance animations the site has (animations.css and modules.css). */
const ANIMATIONS = [
	'fadeIn',
	'fadeInUp',
	'fadeInDown',
	'fadeInLeft',
	'fadeInRight',
	'slideInUp',
	'slideInDown',
	'slideInLeft',
	'slideInRight',
	'zoomIn',
	'bounceIn',
	'flipInX',
	'flipInY',
	'rotateIn',
	'lightSpeedIn',
	'rollIn',
];

/**
 * Motion: the entrance animation of this device, its delay and duration, kept where the
 * site's script reads them (the element's settings, as Elementor keeps them).
 *
 * @param {Object}   props
 * @param {string}   props.kind          The block's kind.
 * @param {string}   props.deviceKey     desktop, tablet or mobile.
 * @param {Object}   props.attributes    The block's attributes.
 * @param {Function} props.setAttributes Its setter.
 * @param {string}   props.duration      This device's animation duration (ms).
 * @param {Function} props.setDuration   Set it.
 */
function MotionControls( {
	kind,
	deviceKey,
	attributes,
	setAttributes,
	duration,
	setDuration,
} ) {
	let settings = {};
	try {
		settings = JSON.parse( attributes.settings || '{}' ) || {};
	} catch {
		settings = {};
	}
	const base = kind === 'container' ? 'animation' : '_animation';
	const key = deviceKey === 'desktop' ? base : `${ base }_${ deviceKey }`;
	const save = ( patch ) => {
		const next = { ...settings, ...patch };
		for ( const [ k, v ] of Object.entries( next ) ) {
			if ( v === '' || v === undefined ) {
				delete next[ k ];
			}
		}
		setAttributes( {
			settings: Object.keys( next ).length ? JSON.stringify( next ) : '',
		} );
	};
	return (
		<>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Entrance animation', 'harlow' ) }
				value={ settings[ key ] || '' }
				options={ [
					{ value: '', label: __( 'Default', 'harlow' ) },
					{ value: 'none', label: __( 'None', 'harlow' ) },
					...ANIMATIONS.map( ( a ) => ( { value: a, label: a } ) ),
				] }
				onChange={ ( v ) => save( { [ key ]: v } ) }
			/>
			<Length
				label={ __( 'Delay (ms)', 'harlow' ) }
				value={ settings._animation_delay ?? settings.animation_delay }
				unit="ms"
				units={ [ { value: 'ms', label: 'ms' } ] }
				onChange={ ( v ) =>
					save( {
						[ kind === 'container'
							? 'animation_delay'
							: '_animation_delay' ]:
							v === '' ? '' : parseInt( v, 10 ),
					} )
				}
			/>
			<Length
				label={ __( 'Duration (ms)', 'harlow' ) }
				value={ duration }
				unit="ms"
				units={ [ { value: 'ms', label: 'ms' } ] }
				onChange={ ( v ) => setDuration( v ) }
			/>
		</>
	);
}

/**
 * One part's panel: its states (normal, hover, active…) and the controls it offers.
 *
 * @param {Object}   props
 * @param {Object}   props.part     The part (parts.json).
 * @param {Object}   props.value    Its style on this device.
 * @param {Function} props.onChange Called with its style.
 */
function PartPanel( { part, value, onChange } ) {
	const [ state, setState ] = useState( '' );
	const states = part.states || {};
	const one = ( state ? value[ state ] : value ) || {};
	const set = ( patch ) =>
		onChange(
			cleanStyle(
				state
					? {
							...value,
							[ state ]: cleanStyle( { ...one, ...patch } ),
						}
					: { ...value, ...patch }
			)
		);
	const setIn = ( group, patch ) =>
		set( { [ group ]: { ...( one[ group ] || {} ), ...patch } } );
	const has = ( c ) => ( part.controls || [] ).includes( c );
	const prefix = state
		? `${ part.label } (${ states[ state ].label }):`
		: `${ part.label }:`;
	const sides = ( box ) => {
		const s = one[ box ] || {};
		const v = {};
		for ( const side of SIDES ) {
			v[ side ] =
				s[ side ] === undefined || s[ side ] === ''
					? undefined
					: `${ s[ side ] }${ s.unit || 'px' }`;
		}
		return v;
	};
	const setSides = ( box ) => ( v ) => {
		const next = { unit: 'px' };
		for ( const side of SIDES ) {
			const m = `${ v?.[ side ] ?? '' }`.match(
				/^(-?[\d.]+)\s*([a-z%]*)$/i
			);
			if ( m ) {
				next[ side ] = m[ 1 ];
				next.unit = m[ 2 ] || next.unit;
			}
		}
		set( { [ box ]: next } );
	};
	return (
		<Group
			title={ part.label }
			icon={ partIcon( part ) }
			changed={ ! isEmpty( value ) }
			onReset={ () => onChange( {} ) }
		>
			{ Object.keys( states ).length > 0 && (
				<Choices
					label={ named(
						`${ part.label }:`,
						__( 'State', 'harlow' )
					) }
					value={ state }
					onChange={ setState }
				>
					<Choice value="" label={ __( 'Normal', 'harlow' ) } />
					{ Object.entries( states ).map( ( [ k, s ] ) => (
						<Choice key={ k } value={ k } label={ s.label } />
					) ) }
				</Choices>
			) }
			{ has( 'dropCap' ) && (
				<ToggleControl
					__nextHasNoMarginBottom
					label={ rowLabel(
						named( prefix, __( 'Drop cap', 'harlow' ) )
					) }
					checked={ !! one.dropCap }
					onChange={ ( v ) => set( { dropCap: v } ) }
				/>
			) }
			{ has( 'columns' ) && (
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					type="number"
					min={ 1 }
					max={ 12 }
					label={ rowLabel(
						named( prefix, __( 'Columns', 'harlow' ) )
					) }
					value={ one.columns ?? '' }
					onChange={ ( v ) => set( { columns: v } ) }
				/>
			) }
			{ has( 'textColumns' ) && (
				<>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						min={ 1 }
						max={ 10 }
						label={ rowLabel(
							named( prefix, __( 'Columns', 'harlow' ) )
						) }
						value={ one.textColumns ?? '' }
						onChange={ ( v ) => set( { textColumns: v } ) }
					/>
					<Length
						label={ named( prefix, __( 'Column gap', 'harlow' ) ) }
						value={ one.columnGap }
						unit={ one.columnGapUnit || 'px' }
						onChange={ ( v, u ) =>
							set( { columnGap: v, columnGapUnit: u } )
						}
					/>
				</>
			) }
			{ has( 'color' ) && (
				<Colour
					label={ named( prefix, __( 'Text colour', 'harlow' ) ) }
					value={ one.color || '' }
					onChange={ ( v ) => set( { color: v } ) }
				/>
			) }
			{ has( 'typography' ) && (
				<TypographyControls
					value={ one.typography || {} }
					onChange={ ( patch ) => setIn( 'typography', patch ) }
					prefix={ prefix }
					stroke={ ! part.selector.includes( '::first-letter' ) }
				/>
			) }
			{ has( 'icon' ) && (
				<>
					<Colour
						label={ named( prefix, __( 'Icon colour', 'harlow' ) ) }
						value={ one.iconColor || '' }
						onChange={ ( v ) => set( { iconColor: v } ) }
					/>
					<Length
						label={ named( prefix, __( 'Icon size', 'harlow' ) ) }
						value={ one.iconSize }
						unit="px"
						units={ [ { value: 'px', label: 'px' } ] }
						onChange={ ( v ) => set( { iconSize: v } ) }
					/>
				</>
			) }
			{ has( 'background' ) && (
				<BackgroundControls
					label={ named( prefix, __( 'Background type', 'harlow' ) ) }
					value={ one.background || {} }
					onChange={ ( patch ) => setIn( 'background', patch ) }
					types={ [ 'none', 'color', 'gradient', 'image' ] }
					prefix={ prefix }
				/>
			) }
			{ has( 'align' ) && (
				<Choices
					label={ named( prefix, __( 'Align', 'harlow' ) ) }
					value={ one.align || '' }
					onChange={ ( v ) => set( { align: v } ) }
				>
					<Choice value="" label={ __( 'Default', 'harlow' ) } />
					<Choice value="left" label={ __( 'Left', 'harlow' ) } />
					<Choice value="center" label={ __( 'Centre', 'harlow' ) } />
					<Choice value="right" label={ __( 'Right', 'harlow' ) } />
				</Choices>
			) }
			{ has( 'gap' ) && (
				<Length
					label={ named( prefix, __( 'Space between', 'harlow' ) ) }
					value={ one.gap }
					unit={ one.gapUnit || 'px' }
					onChange={ ( v, u ) => set( { gap: v, gapUnit: u } ) }
				/>
			) }
			{ has( 'divider' ) && (
				<>
					<Colour
						label={ named( prefix, __( 'Colour', 'harlow' ) ) }
						value={ one.divider?.color || '' }
						onChange={ ( v ) => setIn( 'divider', { color: v } ) }
					/>
					<Length
						label={ named( prefix, __( 'Weight', 'harlow' ) ) }
						value={ one.divider?.weight }
						unit="px"
						onChange={ ( v ) => setIn( 'divider', { weight: v } ) }
					/>
					<Length
						label={ named( prefix, __( 'Width', 'harlow' ) ) }
						value={ one.size?.width }
						unit={ one.size?.widthUnit || 'px' }
						onChange={ ( v, u ) =>
							setIn( 'size', { width: v, widthUnit: u } )
						}
					/>
				</>
			) }
			{ has( 'size' ) && (
				<>
					<Length
						label={ named( prefix, __( 'Width', 'harlow' ) ) }
						value={ one.size?.width }
						unit={ one.size?.widthUnit || 'px' }
						onChange={ ( v, u ) =>
							setIn( 'size', { width: v, widthUnit: u } )
						}
					/>
					<Length
						label={ named(
							prefix,
							__( 'Minimum height', 'harlow' )
						) }
						value={ one.size?.height }
						unit={ one.size?.heightUnit || 'px' }
						onChange={ ( v, u ) =>
							setIn( 'size', { height: v, heightUnit: u } )
						}
					/>
				</>
			) }
			{ has( 'padding' ) && (
				<div className="harlow-style__box">
					<BoxControl
						__next40pxDefaultSize
						label={ rowLabel(
							named( prefix, __( 'Padding (inside)', 'harlow' ) )
						) }
						values={ sides( 'padding' ) }
						units={ UNITS }
						onChange={ setSides( 'padding' ) }
					/>
				</div>
			) }
			{ has( 'margin' ) && (
				<div className="harlow-style__box">
					<BoxControl
						__next40pxDefaultSize
						label={ rowLabel(
							named( prefix, __( 'Margin (outside)', 'harlow' ) )
						) }
						values={ sides( 'margin' ) }
						units={ UNITS }
						onChange={ setSides( 'margin' ) }
					/>
				</div>
			) }
			{ has( 'border' ) && (
				<BorderControls
					border={ one.border || {} }
					setIn={ setIn }
					prefix={ prefix }
				/>
			) }
			{ has( 'line' ) && (
				<BorderControls
					border={ one.border || {} }
					setIn={ setIn }
					prefix={ prefix }
					corners={ false }
				/>
			) }
			{ has( 'shadow' ) && (
				<ShadowControls
					label={ named( prefix, __( 'Box shadow', 'harlow' ) ) }
					value={ one.shadow }
					box
					onChange={ ( v ) => set( { shadow: v } ) }
				/>
			) }
			{ has( 'textShadow' ) && (
				<ShadowControls
					label={ named( prefix, __( 'Text shadow', 'harlow' ) ) }
					value={ one.textShadow }
					onChange={ ( v ) => set( { textShadow: v } ) }
				/>
			) }
			{ has( 'opacity' ) && (
				<RangeControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ rowLabel(
						named( prefix, __( 'Opacity', 'harlow' ) )
					) }
					value={
						one.opacity === undefined || one.opacity === ''
							? 1
							: Number( one.opacity )
					}
					min={ 0 }
					max={ 1 }
					step={ 0.05 }
					onChange={ ( v ) => set( { opacity: v === 1 ? '' : v } ) }
				/>
			) }
			{ has( 'transform' ) && (
				<TransformControls
					value={ one.transform || {} }
					onChange={ ( patch ) => setIn( 'transform', patch ) }
				/>
			) }
		</Group>
	);
}

/**
 * The Style tab: its groups, for the device shown.
 *
 * @param {Object}   props
 * @param {string}   props.kind          The block's kind.
 * @param {Object}   props.style         The block's style attribute.
 * @param {Function} props.setStyle      Called with the new style.
 * @param {Object}   props.attributes    The block's attributes (classes, tag, settings).
 * @param {Function} props.setAttributes The block's setter.
 */
/**
 * A part's icon in its group's title, by what it styles: words, a picture, an icon, a box.
 *
 * @param {Object} part The part (parts.json).
 * @return {Object} The icon.
 */
function partIcon( part ) {
	const c = part.controls || [];
	if ( c.includes( 'typography' ) ) {
		return typographyIcon;
	}
	if ( c.includes( 'icon' ) || c.includes( 'size' ) || c.includes( 'gap' ) ) {
		return stylesIcon;
	}
	if ( c.includes( 'border' ) || c.includes( 'line' ) ) {
		return borderIcon;
	}
	return backgroundIcon;
}

/** The tab of the Styles tab last chosen (Style or Advanced), kept from element to element. */
let lastTab = 'style';

/** Each breakpoint's icon in the device switch. */
const DEVICE_ICONS = {
	desktop,
	widescreen: desktop,
	laptop: desktop,
	tabletExtra: tablet,
	tablet,
	mobileExtra: mobile,
	mobile,
};

/**
 * One group of the Styles tab, closed until opened: its icon, a dot once it holds a value
 * of its own on this device, and a reset of the group at its foot.
 *
 * @param {Object}   props
 * @param {string}   props.title       The group's title.
 * @param {Object}   props.icon        Its icon.
 * @param {boolean}  props.changed     Whether it holds a value on this device.
 * @param {Function} props.onReset     Called to take its values off (none: no reset).
 * @param {Object}   props.children    Its rows.
 * @param {boolean}  props.initialOpen Open from the start (a container's Layout).
 */
function Group( {
	title,
	icon,
	changed,
	onReset,
	children,
	initialOpen = false,
} ) {
	return (
		<PanelBody
			title={
				<>
					{ title }
					{ changed && <span className="harlow-group__dot" /> }
				</>
			}
			icon={ icon }
			initialOpen={ initialOpen }
			className={ `harlow-style${ changed ? ' is-changed' : '' }` }
		>
			{ children }
			{ changed && onReset && (
				<Button
					className="harlow-group__reset"
					variant="tertiary"
					size="small"
					icon={ resetIcon }
					onClick={ onReset }
				>
					{ sprintf(
						/* translators: %s: a group of the Styles tab (Typography, Border…) */
						__( 'Reset %s', 'harlow' ),
						title
					) }
				</Button>
			) }
		</PanelBody>
	);
}

function StylePanel( { kind, style, setStyle, attributes, setAttributes } ) {
	const device = useSelect(
		( select ) => select( 'core/editor' )?.getDeviceType?.() || 'Desktop',
		[]
	);
	const { setDeviceType } = useDispatch( 'core/editor' );
	const [ picked, setPicked ] = useState( null );
	const [ tab, setTab ] = useState( lastTab );
	const pickTab = ( t ) => {
		lastTab = t;
		setTab( t );
	};
	// The breakpoint chosen, while the preview is still the one it is shown in; else the
	// preview's own.
	const key =
		picked && PREVIEW[ picked ] === device
			? picked
			: { Desktop: 'desktop', Tablet: 'tablet', Mobile: 'mobile' }[
					device
				] || 'desktop';
	const one = style?.[ key ] || {};
	const set = ( patch ) =>
		setStyle( cleanStyle( { ...style, [ key ]: { ...one, ...patch } } ) );
	const setIn = ( group, patch ) =>
		set( { [ group ]: { ...( one[ group ] || {} ), ...patch } } );
	// What is the element's on every device (shape dividers, motion, conditions).
	const setTop = ( k, value ) =>
		setStyle( cleanStyle( { ...style, [ k ]: value } ) );
	const hasText =
		kind !== 'container' &&
		! PICTURES.includes( kind ) &&
		! [
			'divider',
			'social-icons',
			'icon',
			'spacer',
			'menu-anchor',
			'google-maps',
			'video',
			'lottie',
		].includes( kind );
	// A group with a value of its own on this device shows a dot; its reset takes them off.
	const changed = ( ...keys ) => keys.some( ( k ) => ! isEmpty( one[ k ] ) );
	const clear =
		( ...keys ) =>
		() =>
			set( Object.fromEntries( keys.map( ( k ) => [ k, undefined ] ) ) );
	// Hover's filters are Effects', its overlay the overlay's; the rest is Transform and hover's.
	const hoverOwn = Object.entries( one.hover || {} ).some(
		( [ k, v ] ) =>
			! [ 'filters', 'overlay' ].includes( k ) && ! isEmpty( v )
	);
	const bg = one.background || {};
	const type = one.typography || {};
	const img = one.image || {};
	const border = one.border || {};
	const sides = ( box ) => {
		const s = one[ box ] || {};
		const u = s.unit || 'px';
		const v = {};
		for ( const side of [ 'top', 'right', 'bottom', 'left' ] ) {
			v[ side ] =
				s[ side ] === undefined || s[ side ] === ''
					? undefined
					: `${ s[ side ] }${ u }`;
		}
		return v;
	};
	const setSides = ( box ) => ( v ) => {
		const next = { unit: 'px' };
		for ( const side of [ 'top', 'right', 'bottom', 'left' ] ) {
			const m = `${ v?.[ side ] ?? '' }`.match(
				/^(-?[\d.]+)\s*([a-z%]*)$/i
			);
			if ( m ) {
				next[ side ] = m[ 1 ];
				next.unit = m[ 2 ] || next.unit;
			}
		}
		set( { [ box ]: next } );
	};
	// A part that is there only for some of the element's settings (parts.json `when`: an
	// attribute and the values it is there for, as Elementor's conditions: a typing cursor
	// for the typing and clip animations; "*" for any value (0 is none: a picture's id); `{ "has": [ … ] }` for a list
	// holding one of the values: a countdown's message among its expiry actions; `{ "any":
	// { … } }` for a list with a line that fits: an author shown with their picture) shows
	// only then.
	const fits = ( value, wanted ) => {
		if ( wanted === '*' ) {
			return Array.isArray( value )
				? value.length > 0
				: ! [ undefined, null, '', false, 0 ].includes( value );
		}
		if ( wanted?.has ) {
			return (
				Array.isArray( value ) &&
				value.some( ( item ) => wanted.has.includes( item ) )
			);
		}
		return wanted.includes( value );
	};
	const meets = ( when ) =>
		Object.entries( when || {} ).every( ( [ name, wanted ] ) =>
			wanted?.any
				? ( attributes?.[ name ] || [] ).some( ( line ) =>
						Object.entries( wanted.any ).every( ( [ field, w ] ) =>
							fits( line?.[ field ], w )
						)
					)
				: fits( attributes?.[ name ], wanted )
		);
	// `when` as a list: any one of them (a hotspot's box with a label or an icon).
	const parts = ( PARTS[ kind ] || [] ).filter( ( part ) =>
		Array.isArray( part.when )
			? part.when.some( meets )
			: meets( part.when )
	);
	// What the element's own parts already style (blocks/<name>/parts.json): a widget whose
	// parts are its words has no general Typography; the site's own kinds (a heading, a
	// text, a button) keep theirs, their parts being something else (a link).
	// (Every part of the kind, shown or not: a general group does not stand in for a part
	// hidden for its settings, it would draw nothing either: a button's icon with no icon.)
	const partsHave = ( control ) =>
		( PARTS[ kind ] || [] ).some( ( part ) =>
			( part.controls || [] ).includes( control )
		);
	// A part that styles the very words the general Typography would (a title widget's
	// Title, an icon list's Text) takes its place.
	const partsHaveWords = ( PARTS[ kind ] || [] ).some(
		( part ) =>
			( part.controls || [] ).includes( 'typography' ) &&
			part.selector.trim() === ( TEXT_PART[ kind ] || '' ).trim()
	);
	// As Elementor's Style and Advanced tabs: the element's own groups first, then the box
	// around it (a section's box is the section: its background comes first).
	const backgroundPanels = (
		<>
			<Group
				title={ __( 'Background', 'harlow' ) }
				icon={ backgroundIcon }
				changed={ changed( 'background' ) }
				onReset={ clear( 'background' ) }
			>
				<BackgroundControls
					label={ __( 'Background type', 'harlow' ) }
					value={ bg }
					onChange={ ( patch ) => setIn( 'background', patch ) }
					types={
						kind === 'container' && key === 'desktop'
							? [
									'none',
									'color',
									'gradient',
									'image',
									'slideshow',
								]
							: [ 'none', 'color', 'gradient', 'image' ]
					}
					tint
				/>
				{ kind === 'container' && ! bg.type && (
					// The design's own background (its picture and video), replaced in place.
					<DesignBackground
						attributes={ attributes }
						setAttributes={ setAttributes }
					/>
				) }
			</Group>

			{ kind === 'container' && (
				<Group
					title={ __( 'Background overlay', 'harlow' ) }
					icon={ backgroundIcon }
					changed={
						changed( 'overlay' ) || ! isEmpty( one.hover?.overlay )
					}
					onReset={ () =>
						set( {
							overlay: undefined,
							hover: {
								...( one.hover || {} ),
								overlay: undefined,
							},
						} )
					}
				>
					<BackgroundControls
						label={ __( 'Overlay type', 'harlow' ) }
						value={ one.overlay || {} }
						onChange={ ( patch ) => setIn( 'overlay', patch ) }
						types={ [ 'color', 'gradient', 'image' ] }
						prefix={ __( 'Overlay:', 'harlow' ) }
					/>
					{ /* As Elementor's: the overlay's opacity, blend and filters once it has a type. */ }
					{ ( ( one.overlay?.type && one.overlay.type !== 'none' ) ||
						one.overlay?.opacity ||
						one.overlay?.blend ||
						one.overlay?.transition ) && (
						<>
							<RangeControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Overlay opacity', 'harlow' ) }
								value={
									one.overlay?.opacity === undefined ||
									one.overlay?.opacity === ''
										? 1
										: Number( one.overlay.opacity )
								}
								min={ 0 }
								max={ 1 }
								step={ 0.05 }
								onChange={ ( v ) =>
									setIn( 'overlay', {
										opacity: v === 1 ? '' : v,
									} )
								}
							/>
							<Words
								label={ __( 'Overlay blend mode', 'harlow' ) }
								value={ one.overlay?.blend }
								words={ BLENDS }
								names={ BLEND_NAMES }
								onChange={ ( v ) =>
									setIn( 'overlay', { blend: v } )
								}
							/>
							<FilterControls
								value={ one.overlay?.filters }
								suffix={ __( '(overlay)', 'harlow' ) }
								onChange={ ( patch ) =>
									setIn( 'overlay', {
										filters: {
											...( one.overlay?.filters || {} ),
											...patch,
										},
									} )
								}
							/>
							<Length
								label={ __(
									'Overlay transition (ms)',
									'harlow'
								) }
								value={ one.overlay?.transition }
								unit="ms"
								units={ [ { value: 'ms', label: 'ms' } ] }
								onChange={ ( v ) =>
									setIn( 'overlay', { transition: v } )
								}
							/>
						</>
					) }
					<p className="harlow-style__group">
						{ __( 'On hover', 'harlow' ) }
					</p>
					<BackgroundControls
						label={ __( 'Overlay type on hover', 'harlow' ) }
						value={ one.hover?.overlay || {} }
						onChange={ ( patch ) =>
							setIn( 'hover', {
								overlay: {
									...( one.hover?.overlay || {} ),
									...patch,
								},
							} )
						}
						types={ [ 'color', 'gradient', 'image' ] }
						prefix={ __( 'Overlay on hover:', 'harlow' ) }
					/>
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Overlay opacity on hover', 'harlow' ) }
						value={
							one.hover?.overlay?.opacity === undefined ||
							one.hover?.overlay?.opacity === ''
								? undefined
								: Number( one.hover.overlay.opacity )
						}
						min={ 0 }
						max={ 1 }
						step={ 0.05 }
						allowReset
						onChange={ ( v ) =>
							setIn( 'hover', {
								overlay: {
									...( one.hover?.overlay || {} ),
									opacity: v === undefined ? '' : v,
								},
							} )
						}
					/>
				</Group>
			) }

			{ kind === 'container' && (
				<Group
					title={ __( 'Shape dividers', 'harlow' ) }
					icon={ fullscreen }
					changed={ ! isEmpty( style?.shapes ) }
					onReset={ () => setTop( 'shapes', undefined ) }
				>
					<ShapeControls
						shapes={ style?.shapes || {} }
						onChange={ ( v ) => setTop( 'shapes', v ) }
					/>
				</Group>
			) }
		</>
	);
	const ownPanels = (
		<>
			{ hasText &&
				! (
					partsHave( 'typography' ) &&
					( ! TEXT_PART[ kind ] || partsHaveWords )
				) && (
					<Group
						title={ __( 'Typography', 'harlow' ) }
						icon={ typographyIcon }
						changed={ changed(
							'color',
							'typography',
							'textBlend'
						) }
						onReset={ clear( 'color', 'typography', 'textBlend' ) }
					>
						<Colour
							label={ __( 'Text colour', 'harlow' ) }
							value={ one.color || '' }
							onChange={ ( v ) => set( { color: v } ) }
						/>
						<TypographyControls
							value={ type }
							onChange={ ( patch ) =>
								setIn( 'typography', patch )
							}
						/>
						{ /* Where the words are the element itself, Effects' blend mode is theirs. */ }
						{ TEXT_PART[ kind ] &&
							! TEXT_PART[ kind ].startsWith( '|' ) && (
								<Words
									label={ __( 'Text blend mode', 'harlow' ) }
									value={ one.textBlend }
									words={ BLENDS }
									names={ BLEND_NAMES }
									onChange={ ( v ) =>
										set( { textBlend: v } )
									}
								/>
							) }
					</Group>
				) }

			{ parts.map( ( part ) => (
				<PartPanel
					key={ part.key }
					part={ part }
					value={ one.parts?.[ part.key ] || {} }
					onChange={ ( v ) =>
						set( {
							parts: cleanStyle( {
								...( one.parts || {} ),
								[ part.key ]: v,
							} ),
						} )
					}
				/>
			) ) }

			{ ICON_PARTS[ kind ] && ! partsHave( 'icon' ) && (
				<Group
					title={ __( 'Icon', 'harlow' ) }
					icon={ stylesIcon }
					changed={ changed( 'icon' ) }
					onReset={ clear( 'icon' ) }
				>
					<Colour
						label={ __( 'Icon colour', 'harlow' ) }
						value={ one.icon?.color || '' }
						onChange={ ( v ) => setIn( 'icon', { color: v } ) }
					/>
					<Length
						label={ __( 'Icon size', 'harlow' ) }
						value={ one.icon?.size }
						unit="px"
						onChange={ ( v ) => setIn( 'icon', { size: v } ) }
					/>
					{ kind === 'social-icons' && (
						<Colour
							label={ __( 'Icon background', 'harlow' ) }
							value={ one.icon?.background || '' }
							onChange={ ( v ) =>
								setIn( 'icon', { background: v } )
							}
						/>
					) }
				</Group>
			) }

			{ kind === 'button' && (
				<Group
					title={ __( 'Button', 'harlow' ) }
					icon={ stylesIcon }
					changed={ changed(
						'buttonColor',
						'buttonHoverColor',
						'radius',
						'buttonPadding'
					) }
					onReset={ clear(
						'buttonColor',
						'buttonHoverColor',
						'radius',
						'buttonPadding'
					) }
				>
					<Colour
						label={ __( 'Button colour', 'harlow' ) }
						value={ one.buttonColor || '' }
						onChange={ ( v ) => set( { buttonColor: v } ) }
					/>
					<Colour
						label={ __( 'Button colour on hover', 'harlow' ) }
						value={ one.buttonHoverColor || '' }
						onChange={ ( v ) => set( { buttonHoverColor: v } ) }
					/>
					<DesignPicture
						attributes={ attributes }
						setAttributes={ setAttributes }
					/>
					<Length
						label={ __( 'Button corners', 'harlow' ) }
						value={ one.radius }
						unit="px"
						onChange={ ( v ) => set( { radius: v } ) }
					/>
					<div className="harlow-style__box">
						<BoxControl
							__next40pxDefaultSize
							label={ __( 'Button padding', 'harlow' ) }
							values={ sides( 'buttonPadding' ) }
							units={ UNITS }
							onChange={ setSides( 'buttonPadding' ) }
						/>
					</div>
				</Group>
			) }
		</>
	);
	return (
		<>
			<div className="harlow-props__head">
				<div
					className="harlow-props__tabs"
					role="tablist"
					aria-label={ __( 'Style or advanced', 'harlow' ) }
				>
					{ [
						[ 'style', __( 'Style', 'harlow' ), stylesIcon ],
						[ 'advanced', __( 'Advanced', 'harlow' ), tool ],
					].map( ( [ k, words, icon ] ) => (
						<Button
							key={ k }
							role="tab"
							aria-selected={ tab === k }
							className="harlow-props__tab"
							icon={ icon }
							onClick={ () => pickTab( k ) }
						>
							{ words }
						</Button>
					) ) }
				</div>
				<div className="harlow-props__bar">
					<Choices
						label={ __( 'Device', 'harlow' ) }
						value={ key }
						onChange={ ( v ) => {
							setPicked( v );
							setDeviceType( PREVIEW[ v ] || 'Desktop' );
						} }
					>
						{ DEVICE_LIST.map( ( [ k ] ) => (
							<Choice
								key={ k }
								value={ k }
								label={ DEVICE_LABELS[ k ] }
								icon={ DEVICE_ICONS[ k ] || desktop }
							/>
						) ) }
					</Choices>
					{ Object.keys( style || {} ).length > 0 && (
						<Button
							className="harlow-props__reset"
							icon={ resetIcon }
							size="compact"
							label={ __(
								'Reset every device to the design',
								'harlow'
							) }
							showTooltip
							onClick={ () => setStyle( {} ) }
						>
							<VisuallyHidden as="span">
								{ __(
									'Reset every device to the design',
									'harlow'
								) }
							</VisuallyHidden>
						</Button>
					) }
				</div>
				<datalist id="harlow-type-sizes">
					{ SIZES.map( ( s ) => (
						<option key={ s.size } value={ s.size } />
					) ) }
				</datalist>
			</div>

			{ /* A container's Layout first, as Elementor's Layout tab. */ }
			{ tab === 'style' && kind === 'container' && (
				<LayoutPanel
					attributes={ attributes }
					setAttributes={ setAttributes }
					layout={ one.layout || {} }
					setIn={ setIn }
					setDesktopLayout={ ( patch ) =>
						setStyle(
							cleanStyle( {
								...style,
								desktop: {
									...( style?.desktop || {} ),
									layout: {
										...( style?.desktop?.layout || {} ),
										...patch,
									},
								},
							} )
						)
					}
				/>
			) }
			{ tab === 'style' && ownPanels }
			{ tab === 'style' && kind === 'container' && backgroundPanels }

			{ tab === 'style' && ! partsHave( 'align' ) && (
				<Group
					title={ __( 'Alignment', 'harlow' ) }
					icon={ alignLeft }
					changed={ changed( 'align' ) }
					onReset={ clear( 'align' ) }
				>
					<Choices
						label={ __( 'Align', 'harlow' ) }
						value={ one.align || '' }
						onChange={ ( v ) => set( { align: v } ) }
					>
						<Choice
							value=""
							label={ __( 'Default', 'harlow' ) }
							icon={ alignNone }
						/>
						<Choice
							value="left"
							label={ __( 'Left', 'harlow' ) }
							icon={ alignLeft }
						/>
						<Choice
							value="center"
							label={ __( 'Centre', 'harlow' ) }
							icon={ alignCenter }
						/>
						<Choice
							value="right"
							label={ __( 'Right', 'harlow' ) }
							icon={ alignRight }
						/>
						{ hasText && (
							<Choice
								value="justify"
								label={ __( 'Justify', 'harlow' ) }
								icon={ alignJustify }
							/>
						) }
					</Choices>
				</Group>
			) }

			{ tab === 'style' && kind !== 'container' && (
				<p className="harlow-style__box-heading">
					{ __( 'The box around the element', 'harlow' ) }
				</p>
			) }
			{ tab === 'style' &&
				kind !== 'container' &&
				! OWN_BACKGROUND.includes( kind ) &&
				backgroundPanels }

			{ tab === 'style' && (
				<Group
					title={ __( 'Spacing', 'harlow' ) }
					icon={ sidesAll }
					changed={ changed( 'padding', 'margin' ) }
					onReset={ clear( 'padding', 'margin' ) }
				>
					<div className="harlow-style__box">
						<BoxControl
							__next40pxDefaultSize
							label={ __( 'Padding (inside)', 'harlow' ) }
							values={ sides( 'padding' ) }
							units={ UNITS }
							onChange={ setSides( 'padding' ) }
							resetValues={ {
								top: undefined,
								right: undefined,
								bottom: undefined,
								left: undefined,
							} }
						/>
					</div>
					<div className="harlow-style__box">
						<BoxControl
							__next40pxDefaultSize
							label={ __( 'Margin (outside)', 'harlow' ) }
							values={ sides( 'margin' ) }
							units={ UNITS }
							allowReset
							onChange={ setSides( 'margin' ) }
							resetValues={ {
								top: undefined,
								right: undefined,
								bottom: undefined,
								left: undefined,
							} }
						/>
					</div>
				</Group>
			) }

			{ tab === 'style' && (
				<Group
					title={ __( 'Size', 'harlow' ) }
					icon={ fullscreen }
					changed={ changed( 'size', 'image' ) }
					onReset={ clear( 'size', 'image' ) }
				>
					<Length
						label={
							kind === 'container'
								? __( 'Content width', 'harlow' )
								: __( 'Width', 'harlow' )
						}
						value={ one.size?.width }
						unit={ one.size?.widthUnit || 'px' }
						onChange={ ( v, u ) =>
							setIn( 'size', { width: v, widthUnit: u } )
						}
					/>
					<Length
						label={ __( 'Minimum height', 'harlow' ) }
						value={ one.size?.height }
						unit={ one.size?.heightUnit || 'px' }
						onChange={ ( v, u ) =>
							setIn( 'size', { height: v, heightUnit: u } )
						}
					/>
					{ PICTURES.includes( kind ) && (
						<>
							<Length
								label={ __( 'Picture width', 'harlow' ) }
								value={ img.width }
								unit={ img.widthUnit || '%' }
								onChange={ ( v, u ) =>
									setIn( 'image', { width: v, widthUnit: u } )
								}
							/>
							<Length
								label={ __( 'Picture height', 'harlow' ) }
								value={ img.height }
								unit={ img.heightUnit || 'px' }
								onChange={ ( v, u ) =>
									setIn( 'image', {
										height: v,
										heightUnit: u,
									} )
								}
							/>
							{ /* As Elementor's: how a picture fills its box once it has a height. */ }
							{ ( img.height || img.fit ) && (
								<Words
									label={ __( 'Fit', 'harlow' ) }
									value={ img.fit }
									words={ WORDS.fit }
									names={ {
										cover: __( 'Cover the box', 'harlow' ),
										contain: __( 'Fit inside', 'harlow' ),
										fill: __( 'Stretch', 'harlow' ),
										none: __( 'As is', 'harlow' ),
									} }
									onChange={ ( v ) =>
										setIn( 'image', { fit: v } )
									}
								/>
							) }
							{ /* The picture's own group has its corners, with its border. */ }
							{ ( ! partsHave( 'border' ) || img.radius ) && (
								<Length
									label={ __( 'Rounded corners', 'harlow' ) }
									value={ img.radius }
									unit="px"
									onChange={ ( v ) =>
										setIn( 'image', { radius: v } )
									}
								/>
							) }
						</>
					) }
				</Group>
			) }

			{ tab === 'style' && (
				<Group
					title={ __( 'Border', 'harlow' ) }
					icon={ borderIcon }
					changed={ changed( 'border' ) }
					onReset={ clear( 'border' ) }
				>
					<BorderControls border={ border } setIn={ setIn } />
				</Group>
			) }

			{ tab === 'style' && (
				<Group
					title={ __( 'Effects', 'harlow' ) }
					icon={ shadowIcon }
					changed={
						changed(
							'shadow',
							'textShadow',
							'opacity',
							'blend',
							'filters'
						) || ! isEmpty( one.hover?.filters )
					}
					onReset={ () =>
						set( {
							shadow: undefined,
							textShadow: undefined,
							opacity: undefined,
							blend: undefined,
							filters: undefined,
							hover: {
								...( one.hover || {} ),
								filters: undefined,
							},
						} )
					}
				>
					<ShadowControls
						label={ __( 'Box shadow', 'harlow' ) }
						value={ one.shadow }
						box
						onChange={ ( v ) => set( { shadow: v } ) }
					/>
					{ hasText && ! partsHave( 'textShadow' ) && (
						<ShadowControls
							label={ __( 'Text shadow', 'harlow' ) }
							value={ one.textShadow }
							onChange={ ( v ) => set( { textShadow: v } ) }
						/>
					) }
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Opacity', 'harlow' ) }
						value={
							one.opacity === undefined || one.opacity === ''
								? 1
								: Number( one.opacity )
						}
						min={ 0 }
						max={ 1 }
						step={ 0.05 }
						onChange={ ( v ) =>
							set( { opacity: v === 1 ? '' : v } )
						}
					/>
					<Words
						label={ __( 'Blend mode', 'harlow' ) }
						value={ one.blend }
						words={ BLENDS }
						names={ BLEND_NAMES }
						onChange={ ( v ) => set( { blend: v } ) }
					/>
					{ PICTURES.includes( kind ) && (
						<>
							<p className="harlow-style__group">
								{ __( 'CSS filters', 'harlow' ) }
							</p>
							<FilterControls
								value={ one.filters }
								onChange={ ( patch ) =>
									setIn( 'filters', patch )
								}
							/>
							<p className="harlow-style__group">
								{ __( 'CSS filters on hover', 'harlow' ) }
							</p>
							<FilterControls
								value={ one.hover?.filters }
								suffix={ __( 'on hover', 'harlow' ) }
								onChange={ ( patch ) =>
									setIn( 'hover', {
										filters: {
											...( one.hover?.filters || {} ),
											...patch,
										},
									} )
								}
							/>
						</>
					) }
				</Group>
			) }

			{ tab === 'advanced' && (
				<Group
					title={ __( 'Position', 'harlow' ) }
					icon={ positionCenter }
					changed={ changed( 'item' ) }
					onReset={ clear( 'item' ) }
				>
					<PositionControls item={ one.item || {} } setIn={ setIn } />
				</Group>
			) }

			{ tab === 'advanced' && (
				<Group
					title={ __( 'Transform and hover', 'harlow' ) }
					icon={ rotateRight }
					changed={ changed( 'transform', 'transition' ) || hoverOwn }
					onReset={ () =>
						set( {
							transform: undefined,
							transition: undefined,
							hover: {
								filters: one.hover?.filters,
								overlay: one.hover?.overlay,
							},
						} )
					}
				>
					<p className="harlow-style__group">
						{ __( 'Normal', 'harlow' ) }
					</p>
					<TransformControls
						value={ one.transform || {} }
						onChange={ ( patch ) => setIn( 'transform', patch ) }
						full
					/>
					<p className="harlow-style__group">
						{ __( 'On hover', 'harlow' ) }
					</p>
					{ hasText && (
						<Colour
							label={ __( 'Text colour on hover', 'harlow' ) }
							value={ one.hover?.color || '' }
							onChange={ ( v ) => setIn( 'hover', { color: v } ) }
						/>
					) }
					<Colour
						label={
							kind === 'button'
								? __( 'Button colour on hover', 'harlow' )
								: __( 'Background colour on hover', 'harlow' )
						}
						value={ one.hover?.background || '' }
						onChange={ ( v ) =>
							setIn( 'hover', { background: v } )
						}
					/>
					<BackgroundControls
						label={ __( 'Background type on hover', 'harlow' ) }
						value={ one.hover?.bg || {} }
						onChange={ ( patch ) =>
							setIn( 'hover', {
								bg: { ...( one.hover?.bg || {} ), ...patch },
							} )
						}
						types={ [ 'gradient', 'image' ] }
						prefix={ __( 'On hover:', 'harlow' ) }
					/>
					<Colour
						label={ __( 'Border colour on hover', 'harlow' ) }
						value={ one.hover?.borderColor || '' }
						onChange={ ( v ) =>
							setIn( 'hover', { borderColor: v } )
						}
					/>
					<Words
						label={ __( 'Border line on hover', 'harlow' ) }
						value={ one.hover?.borderStyle }
						words={ WORDS.borderStyle }
						onChange={ ( v ) =>
							setIn( 'hover', { borderStyle: v } )
						}
					/>
					<Length
						label={ __( 'Border thickness on hover', 'harlow' ) }
						value={ one.hover?.borderWidth }
						unit="px"
						units={ [ { value: 'px', label: 'px' } ] }
						onChange={ ( v ) =>
							setIn( 'hover', { borderWidth: v } )
						}
					/>
					<Length
						label={ __( 'Rounded corners on hover', 'harlow' ) }
						value={ one.hover?.radius }
						unit="px"
						units={ [ { value: 'px', label: 'px' } ] }
						onChange={ ( v ) => setIn( 'hover', { radius: v } ) }
					/>
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Opacity on hover', 'harlow' ) }
						value={
							one.hover?.opacity === undefined ||
							one.hover?.opacity === ''
								? undefined
								: Number( one.hover.opacity )
						}
						min={ 0 }
						max={ 1 }
						step={ 0.05 }
						allowReset
						onChange={ ( v ) =>
							setIn( 'hover', {
								opacity: v === undefined ? '' : v,
							} )
						}
					/>
					<TransformControls
						hover
						value={ one.hover?.transform || {} }
						onChange={ ( patch ) =>
							setIn( 'hover', {
								transform: {
									...( one.hover?.transform || {} ),
									...patch,
								},
							} )
						}
					/>
					<ShadowControls
						label={ __( 'Box shadow on hover', 'harlow' ) }
						value={ one.hover?.shadow }
						box
						onChange={ ( v ) => setIn( 'hover', { shadow: v } ) }
					/>
					<Length
						label={ __( 'Transition (ms)', 'harlow' ) }
						value={ one.transition }
						unit="ms"
						units={ [ { value: 'ms', label: 'ms' } ] }
						onChange={ ( v ) => set( { transition: v } ) }
					/>
				</Group>
			) }

			{ tab === 'advanced' && (
				<Group
					title={ __( 'Motion', 'harlow' ) }
					icon={ seen }
					changed={
						changed( 'animationDuration' ) ||
						!! style?.hoverAnimation ||
						! isEmpty( style?.motion )
					}
				>
					<MotionControls
						kind={ kind }
						deviceKey={ key }
						attributes={ attributes }
						setAttributes={ setAttributes }
						duration={ one.animationDuration }
						setDuration={ ( v ) => set( { animationDuration: v } ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Hover animation', 'harlow' ) }
						value={ style?.hoverAnimation || '' }
						options={ [
							{ value: '', label: __( 'None', 'harlow' ) },
							...Object.entries( HOVER_ANIMATIONS ).map(
								( [ value, [ label ] ] ) => ( {
									value,
									label,
								} )
							),
						] }
						onChange={ ( v ) => setTop( 'hoverAnimation', v ) }
					/>
					<MotionEffects
						motion={ style?.motion || {} }
						onChange={ ( v ) => setTop( 'motion', v ) }
					/>
				</Group>
			) }

			{ tab === 'advanced' && (
				<Group
					title={ __( 'ID, classes and attributes', 'harlow' ) }
					icon={ code }
					changed={
						!! attributes.htmlId ||
						!! style?.classes ||
						!! style?.attributes ||
						changed( 'hide' )
					}
				>
					{ /* Only where the block keeps an id (every element does): one it does not keep is refused by the server. */ }
					{ getBlockType( `harlow/${ kind }` )?.attributes
						?.htmlId && (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'CSS ID', 'harlow' ) }
							value={ attributes.htmlId || '' }
							onChange={ ( v ) =>
								setAttributes( {
									htmlId: v.replace( /[^A-Za-z0-9_-]/g, '' ),
								} )
							}
						/>
					) }
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'CSS classes', 'harlow' ) }
						value={ style?.classes || '' }
						onChange={ ( v ) =>
							setStyle( cleanStyle( { ...style, classes: v } ) )
						}
					/>
					<TextareaControl
						__nextHasNoMarginBottom
						label={ __( 'Custom attributes', 'harlow' ) }
						help={ __(
							'One per line, as key|value (data-*, aria-*, title, rel, target, …), as in Elementor.',
							'harlow'
						) }
						value={ style?.attributes || '' }
						rows={ 3 }
						onChange={ ( v ) =>
							setStyle(
								cleanStyle( { ...style, attributes: v } )
							)
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Hide on this device', 'harlow' ) }
						checked={ !! one.hide }
						onChange={ ( v ) => set( { hide: v } ) }
					/>
				</Group>
			) }

			{ tab === 'advanced' && (
				<Group
					title={ __( 'Display conditions', 'harlow' ) }
					icon={ seen }
					changed={ ! isEmpty( style?.conditions ) }
				>
					<ConditionsControls
						value={ style?.conditions || {} }
						onChange={ ( v ) => setTop( 'conditions', v ) }
					/>
				</Group>
			) }

			{ tab === 'advanced' && (
				<Group
					title={ __( 'Custom CSS', 'harlow' ) }
					icon={ code }
					changed={ changed( 'css' ) }
					onReset={ clear( 'css' ) }
				>
					<TextareaControl
						__nextHasNoMarginBottom
						label={ __( 'CSS for this element', 'harlow' ) }
						help={ __(
							'"selector" stands for this element, as in Elementor: selector { color: red; } selector .elementor-heading-title { … }. Plain declarations apply to the element.',
							'harlow'
						) }
						value={ one.css || '' }
						rows={ 6 }
						onChange={ ( v ) => set( { css: v } ) }
					/>
				</Group>
			) }
		</>
	);
}

addFilter(
	'editor.BlockEdit',
	'harlow/styles',
	createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			const { name, attributes, setAttributes, isSelected, clientId } =
				props;
			const element = attributes.element || attributes.widget;
			const styled =
				name.startsWith( 'harlow/' ) &&
				!! element &&
				'style' in attributes;
			const kind = name.replace( 'harlow/', '' );
			// Called on every render, styled or not: a new element gets its id after its first
			// render, and a hook called only from then on breaks React's order of hooks.
			useCanvasStyle(
				clientId,
				styled ? element : '',
				styled ? attributes.style : undefined,
				kind,
				attributes.classes
			);
			if ( ! styled ) {
				return <BlockEdit { ...props } />;
			}
			// Appearance → Editing and maintenance: a role with the words and pictures only.
			if ( ! isSelected || site.contentOnly ) {
				return <BlockEdit { ...props } />;
			}
			return (
				<>
					<BlockEdit { ...props } />
					<InspectorControls group="styles">
						<StylePanel
							kind={ kind }
							attributes={ attributes }
							setAttributes={ setAttributes }
							style={ attributes.style || {} }
							setStyle={ ( style ) =>
								// An empty style is no style: the block is written as the
								// design's, without "style":{}, byte for byte as before.
								setAttributes( {
									style: Object.keys( style ).length
										? style
										: undefined,
								} )
							}
						/>
					</InspectorControls>
				</>
			);
		},
		'withHarlowStyles'
	)
);
