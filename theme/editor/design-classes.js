/**
 * The design of an element, edited visually: its classes from the vocabulary
 * (_vocab/vocabulary.md) read as choices (design-classes.json, written by gen_blocks.py:
 * each class's property, value, part of the element and device) and shown in a Design
 * panel: colours as swatches, pictures as pictures, sizes and spacing as lists, each per
 * device, the device the editor previews. A choice puts its class in place of the one it
 * replaces, so the canvas draws it at once and the page stays inside the design. The raw
 * classes stay in Advanced, closed, for developers. Elementor's own classes of the element
 * are kept as they are.
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	Button,
	FormTokenField,
	PanelBody,
	SelectControl,
} from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

const site = window.harlowEditor || { themeUri: '', design: null };
// The vocabulary, handed over by functions/enqueue.php (editor/design-classes.json).
const vocabulary = site.design || { classes: {}, offers: {} };
const CLASSES = vocabulary.classes;
const NAMES = Object.keys( CLASSES );
const known = new Set( NAMES );

/** The devices of the editor's preview, and the vocabulary's widths each one shows. */
const DEVICES = {
	Desktop: [ '', 'xl', 'd' ],
	Tablet: [ 't', 'tb' ],
	Mobile: [ 'm' ],
};

/** The brand colours (design/brand.css), by name; the Customizer may change their values. */
const BRAND = {
	'var(--hl-color-primary)': [ '#0165A1', __( 'Blue', 'harlow' ) ],
	'var(--hl-color-dark)': [ '#001420', __( 'Dark', 'harlow' ) ],
	'var(--hl-color-accent)': [ '#00CCCC', __( 'Accent', 'harlow' ) ],
	'var(--hl-color-light)': [ '#F2F2F2', __( 'Light', 'harlow' ) ],
	'var(--hl-color-text)': [ '#000000', __( 'Text', 'harlow' ) ],
};

/** The sections of the panel: the vocabulary's axes. */
const AXES = [
	[ 'type', __( 'Text', 'harlow' ) ],
	[ 'surface', __( 'Colours and background', 'harlow' ) ],
	[ 'space', __( 'Spacing', 'harlow' ) ],
	[ 'size', __( 'Size', 'harlow' ) ],
	[ 'layout', __( 'Layout', 'harlow' ) ],
	[ 'effects', __( 'Effects', 'harlow' ) ],
	[ 'misc', __( 'More', 'harlow' ) ],
];

/**
 * The choices an owner reaches for (open in the panel); the rest fold under "More design".
 *
 * @param {string} prop A property.
 * @return {boolean} Everyday.
 */
function isEveryday( prop ) {
	return /^(--)?(color|background-color|background-image|fill|font-size|font-weight|font-family|font-style|line-height|letter-spacing|text-align|text-transform|padding(-top|-right|-bottom|-left)?|margin(-top|-right|-bottom|-left)?|row-gap|column-gap|gap|width|max-width|min-height|height|border-radius|border-color|opacity|overlay-opacity|content-width)$/.test(
		prop
	);
}

const SIDES = {
	top: __( 'top', 'harlow' ),
	right: __( 'right', 'harlow' ),
	bottom: __( 'bottom', 'harlow' ),
	left: __( 'left', 'harlow' ),
};

/** What a property is called in the panel. */
const PROPERTIES = {
	color: __( 'Text colour', 'harlow' ),
	'background-color': __( 'Background colour', 'harlow' ),
	'background-image': __( 'Background picture', 'harlow' ),
	'border-color': __( 'Border colour', 'harlow' ),
	fill: __( 'Icon colour', 'harlow' ),
	'font-size': __( 'Text size', 'harlow' ),
	'font-weight': __( 'Text weight', 'harlow' ),
	'font-family': __( 'Font', 'harlow' ),
	'font-style': __( 'Slant', 'harlow' ),
	'line-height': __( 'Line height', 'harlow' ),
	'letter-spacing': __( 'Letter spacing', 'harlow' ),
	'text-align': __( 'Alignment', 'harlow' ),
	'text-transform': __( 'Capitals', 'harlow' ),
	margin: __( 'Outer space, every side', 'harlow' ),
	padding: __( 'Inner space, every side', 'harlow' ),
	gap: __( 'Space between items', 'harlow' ),
	'row-gap': __( 'Space between rows', 'harlow' ),
	'column-gap': __( 'Space between columns', 'harlow' ),
	width: __( 'Width', 'harlow' ),
	'max-width': __( 'Widest', 'harlow' ),
	'min-width': __( 'Narrowest', 'harlow' ),
	height: __( 'Height', 'harlow' ),
	'min-height': __( 'Lowest height', 'harlow' ),
	'max-height': __( 'Highest height', 'harlow' ),
	'border-radius': __( 'Rounded corners', 'harlow' ),
	'border-width': __( 'Border width', 'harlow' ),
	'border-style': __( 'Border line', 'harlow' ),
	opacity: __( 'See-through', 'harlow' ),
	display: __( 'Shown as', 'harlow' ),
	'flex-direction': __( 'Direction', 'harlow' ),
	'justify-content': __( 'Arranged along', 'harlow' ),
	'align-items': __( 'Arranged across', 'harlow' ),
	'align-self': __( 'Placed across', 'harlow' ),
	'flex-wrap': __( 'Wrapping', 'harlow' ),
	position: __( 'Position', 'harlow' ),
	'z-index': __( 'Stacking', 'harlow' ),
};

/** What a part of an element is called (the tail of a class). */
const PARTS = {
	'': '',
	ht: __( 'heading text', 'harlow' ),
	wc: __( 'widget box', 'harlow' ),
	'widget-container': __( 'widget box', 'harlow' ),
	img: __( 'picture', 'harlow' ),
	button: __( 'button', 'harlow' ),
	bg: __( 'background', 'harlow' ),
	el: __( 'place in its row', 'harlow' ),
	con: __( 'box', 'harlow' ),
	before: __( 'overlay', 'harlow' ),
	after: __( 'after it', 'harlow' ),
	'hover-before': __( 'overlay, on hover', 'harlow' ),
	'button-hover': __( 'button, on hover', 'harlow' ),
	'button-focus': __( 'button, on focus', 'harlow' ),
	'menu-toggle': __( 'menu button', 'harlow' ),
	sep: __( 'line', 'harlow' ),
	div: __( 'line', 'harlow' ),
	ilt: __( 'list words', 'harlow' ),
	'ili-svg': __( 'list icons', 'harlow' ),
	'icon-list-items': __( 'list', 'harlow' ),
	'view-default-icon': __( 'icon', 'harlow' ),
	'tab-content': __( 'answers', 'harlow' ),
};

/** Words for some values. */
const VALUES = {
	'font-weight': {
		300: __( 'Light', 'harlow' ),
		400: __( 'Regular', 'harlow' ),
		500: __( 'Medium', 'harlow' ),
		600: __( 'Semi-bold', 'harlow' ),
		700: __( 'Bold', 'harlow' ),
		800: __( 'Extra bold', 'harlow' ),
	},
	'text-align': {
		left: __( 'Left', 'harlow' ),
		center: __( 'Centre', 'harlow' ),
		right: __( 'Right', 'harlow' ),
		justify: __( 'Justified', 'harlow' ),
		start: __( 'Start of the line', 'harlow' ),
		end: __( 'End of the line', 'harlow' ),
	},
	'text-transform': {
		uppercase: __( 'ALL CAPITALS', 'harlow' ),
		capitalize: __( 'Capital At Each Word', 'harlow' ),
		none: __( 'As typed', 'harlow' ),
	},
};

/**
 * A property's name in the panel.
 *
 * @param {string} prop A CSS property (Elementor's own custom properties included).
 * @return {string} Its name.
 */
function propertyLabel( prop ) {
	// Elementor's own custom properties (--border-color, --padding-top) beside CSS's: the
	// one on the container's box reads as the box's.
	if ( '--border-color' === prop ) {
		return __( 'Border colour of the box', 'harlow' );
	}
	const plain = prop.replace( /^--/, '' );
	const side = plain.match( /^(padding|margin)-(top|right|bottom|left)$/ );
	if ( side ) {
		return `${
			'padding' === side[ 1 ]
				? __( 'Inner space', 'harlow' )
				: __( 'Outer space', 'harlow' )
		}, ${ SIDES[ side[ 2 ] ] }`;
	}
	if ( PROPERTIES[ plain ] ) {
		return PROPERTIES[ plain ];
	}
	if ( /colou?r/.test( plain ) ) {
		return __( 'Colour', 'harlow' ) + ` (${ plain.replace( /-/g, ' ' ) })`;
	}
	const words = plain
		.replace( /^(e|container-widget)-/, '' )
		.replace( /-/g, ' ' );
	return words.charAt( 0 ).toUpperCase() + words.slice( 1 );
}

/**
 * A part's name in the panel.
 *
 * @param {string} part The tail of a class.
 * @return {string} Its name, or '' for the element itself.
 */
function partLabel( part ) {
	if ( part in PARTS ) {
		return PARTS[ part ];
	}
	const plain = part.replace( /-[0-9a-f]{5}$/, '' );
	if ( plain.startsWith( 'background-video' ) ) {
		return __( 'background video', 'harlow' );
	}
	if ( plain.startsWith( 'e-gallery-item' ) ) {
		return __( 'gallery picture', 'harlow' );
	}
	if ( plain.startsWith( 'is-swiper-button' ) ) {
		return __( 'carousel arrow', 'harlow' );
	}
	if ( plain.startsWith( 'nav-menu' ) ) {
		return __( 'menu', 'harlow' );
	}
	if ( plain.startsWith( 'pagination' ) ) {
		return __( 'pager', 'harlow' );
	}
	if ( plain.startsWith( 'icon-list' ) ) {
		return __( 'list', 'harlow' );
	}
	return plain.replace( /-/g, ' ' );
}

/**
 * Is a property a colour?
 *
 * @param {string} prop The property.
 * @return {boolean} A colour.
 */
function isColour( prop ) {
	return /colou?r$|^fill$/.test( prop.replace( /^--/, '' ) );
}

/**
 * A colour value as the panel paints and names it.
 *
 * @param {string} value The value as the vocabulary has it.
 * @return {Array} [ paint, name ].
 */
function colour( value ) {
	return BRAND[ value ] || [ value, value.toUpperCase() ];
}

/**
 * A picture value (url(...) relative to the design's stylesheets) as an address.
 *
 * @param {string} value The value.
 * @return {string} The address.
 */
function pictureUrl( value ) {
	const m = value.match( /url\(["']?([^"')]+)["']?\)/ );
	if ( ! m ) {
		return '';
	}
	return m[ 1 ].replace( /^(\.\.\/)+/, `${ site.themeUri }/assets/` );
}

/**
 * Sort values: numbers by size, words by name.
 *
 * @param {string} a A class.
 * @param {string} b Another.
 * @return {number} The order.
 */
function byValue( a, b ) {
	const va = CLASSES[ a ][ 2 ];
	const vb = CLASSES[ b ][ 2 ];
	const na = parseFloat( va );
	const nb = parseFloat( vb );
	if ( ! isNaN( na ) && ! isNaN( nb ) && na !== nb ) {
		return na - nb;
	}
	return va.localeCompare( vb );
}

/**
 * One choice: the classes the vocabulary has for a part's property at the device shown,
 * and the one the element wears.
 *
 * @param {Object}   props
 * @param {string}   props.part     The part of the element.
 * @param {string}   props.prop     The property.
 * @param {string[]} props.options  The classes to choose from.
 * @param {string}   props.current  The class the element wears, or ''.
 * @param {Function} props.onChoose Called with the class chosen, '' for the default (the design's own).
 */
function Choice( { part, prop, options, current, onChoose } ) {
	const where = partLabel( part );
	const label = propertyLabel( prop ) + ( where ? ` · ${ where }` : '' );
	if ( isColour( prop ) ) {
		return (
			<div className="harlow-design__choice">
				<p className="harlow-design__label">{ label }</p>
				<div className="harlow-design__swatches">
					{ options.map( ( name ) => {
						const [ paint, title ] = colour( CLASSES[ name ][ 2 ] );
						return (
							<Button
								key={ name }
								className="harlow-design__swatch"
								isPressed={ name === current }
								label={ title }
								showTooltip
								style={ { background: paint } }
								onClick={ () => onChoose( name ) }
							/>
						);
					} ) }
					<Button
						variant="link"
						disabled={ ! current }
						onClick={ () => onChoose( '' ) }
					>
						{ __( 'Default', 'harlow' ) }
					</Button>
				</div>
			</div>
		);
	}
	if ( 'background-image' === prop ) {
		return (
			<div className="harlow-design__choice">
				<p className="harlow-design__label">{ label }</p>
				<div className="harlow-design__pictures">
					{ options.map( ( name ) => (
						<Button
							key={ name }
							className="harlow-design__picture"
							isPressed={ name === current }
							label={ CLASSES[ name ][ 2 ] }
							onClick={ () => onChoose( name ) }
						>
							{ pictureUrl( CLASSES[ name ][ 2 ] ) ? (
								<img
									src={ pictureUrl( CLASSES[ name ][ 2 ] ) }
									alt=""
								/>
							) : (
								<span
									className="harlow-design__gradient"
									style={ {
										backgroundImage: CLASSES[ name ][ 2 ],
									} }
								/>
							) }
						</Button>
					) ) }
					<Button
						variant="link"
						disabled={ ! current }
						onClick={ () => onChoose( '' ) }
					>
						{ __( 'None', 'harlow' ) }
					</Button>
				</div>
			</div>
		);
	}
	const words = VALUES[ prop.replace( /^--/, '' ) ] || {};
	return (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			className="harlow-design__choice"
			label={ label }
			value={ current }
			options={ [
				{ value: '', label: __( 'Default', 'harlow' ) },
				...options.map( ( name ) => ( {
					value: name,
					label:
						words[ CLASSES[ name ][ 2 ] ] ||
						CLASSES[ name ][ 2 ].replace( / !important$/, '' ),
				} ) ),
			] }
			onChange={ onChoose }
		/>
	);
}

/**
 * The Design panel of a block: its offered choices at the device the editor previews.
 *
 * @param {Object}   props
 * @param {string}   props.kind     The block's kind (harlow/<kind>).
 * @param {string[]} props.design   The vocabulary's classes the element wears.
 * @param {Function} props.onChange Called with the element's new vocabulary classes.
 */
function DesignPanel( { kind, design, onChange } ) {
	const device = useSelect(
		( select ) => select( 'core/editor' )?.getDeviceType?.() || 'Desktop',
		[]
	);
	const { setDeviceType } = useDispatch( 'core/editor' );
	const widths = DEVICES[ device ] || DEVICES.Desktop;
	// The (part, property) pairs to offer: those the site's blocks of this kind wear, and
	// those this element wears.
	const pairs = new Map();
	[
		...( vocabulary.offers[ kind ] || [] ),
		...design.map( ( c ) => [ CLASSES[ c ][ 3 ], CLASSES[ c ][ 1 ] ] ),
	].forEach( ( [ part, prop ] ) =>
		pairs.set( `${ part }|${ prop }`, [ part, prop ] )
	);
	const choices = [];
	pairs.forEach( ( [ part, prop ] ) => {
		const options = NAMES.filter(
			( n ) =>
				CLASSES[ n ][ 3 ] === part &&
				CLASSES[ n ][ 1 ] === prop &&
				widths.includes( CLASSES[ n ][ 4 ] )
		).sort( byValue );
		if ( options.length ) {
			const current = design.find( ( c ) => options.includes( c ) ) || '';
			choices.push( {
				part,
				prop,
				options,
				current,
				axis: CLASSES[ options[ 0 ] ][ 0 ],
				everyday: isEveryday( prop ),
			} );
		}
	} );
	if ( ! choices.length && ! pairs.size ) {
		return null;
	}
	const choose = ( choice, name ) =>
		onChange( [
			...design.filter( ( c ) => ! choice.options.includes( c ) ),
			...( name ? [ name ] : [] ),
		] );
	const axisBlocks = ( which ) =>
		AXES.map( ( [ axis, title ] ) => {
			const here = choices.filter(
				( c ) => c.axis === axis && c.everyday === which
			);
			return (
				here.length > 0 && (
					<div key={ axis } className="harlow-design__axis">
						<h3 className="harlow-design__heading">{ title }</h3>
						{ here.map( ( c ) => (
							<Choice
								key={ `${ c.part }|${ c.prop }` }
								{ ...c }
								onChoose={ ( name ) => choose( c, name ) }
							/>
						) ) }
					</div>
				)
			);
		} );
	const more = choices.filter( ( c ) => ! c.everyday ).length;
	return (
		<>
			<PanelBody
				title={ __( 'Design', 'harlow' ) }
				className="harlow-design"
			>
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'For', 'harlow' ) }
					value={ device }
					options={ [
						{ value: 'Desktop', label: __( 'Desktop', 'harlow' ) },
						{ value: 'Tablet', label: __( 'Tablet', 'harlow' ) },
						{ value: 'Mobile', label: __( 'Mobile', 'harlow' ) },
					] }
					onChange={ ( value ) => setDeviceType( value ) }
				/>
				{ ! choices.length && (
					<p>
						{ __(
							'Nothing of this element’s design changes at this size.',
							'harlow'
						) }
					</p>
				) }
				{ axisBlocks( true ) }
			</PanelBody>
			{ more > 0 && (
				<PanelBody
					title={ __( 'More design', 'harlow' ) }
					className="harlow-design"
					initialOpen={ false }
				>
					{ axisBlocks( false ) }
				</PanelBody>
			) }
		</>
	);
}

addFilter(
	'editor.BlockEdit',
	'harlow/design-classes',
	createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			const { name, attributes, setAttributes, isSelected } = props;
			if (
				! isSelected ||
				window.harlowEditor?.contentOnly ||
				! name.startsWith( 'harlow/' ) ||
				typeof attributes.classes !== 'string'
			) {
				return <BlockEdit { ...props } />;
			}
			const all = attributes.classes.split( /\s+/ ).filter( Boolean );
			const design = all.filter( ( c ) => known.has( c ) );
			const own = all.filter( ( c ) => ! known.has( c ) );
			const save = ( classes ) =>
				setAttributes( {
					classes: [ ...own, ...classes ].join( ' ' ),
				} );
			return (
				<>
					<BlockEdit { ...props } />
					<InspectorControls>
						<DesignPanel
							kind={ name.replace( 'harlow/', '' ) }
							design={ design }
							onChange={ save }
						/>
					</InspectorControls>
					<InspectorControls group="advanced">
						<PanelBody
							title={ __(
								'Design classes (for developers)',
								'harlow'
							) }
							initialOpen={ false }
						>
							<FormTokenField
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Design classes', 'harlow' ) }
								value={ design }
								suggestions={ NAMES }
								maxSuggestions={ 40 }
								__experimentalValidateInput={ ( value ) =>
									known.has( value )
								}
								onChange={ ( tokens ) =>
									save(
										tokens
											.map( ( t ) =>
												typeof t === 'string'
													? t
													: t.value
											)
											.filter( ( t ) => known.has( t ) )
									)
								}
							/>
						</PanelBody>
					</InspectorControls>
				</>
			);
		},
		'withDesignClasses'
	)
);
