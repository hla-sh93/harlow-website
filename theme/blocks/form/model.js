/**
 * The form's settings as the edit view reads them, the same way
 * functions/widgets/form.php reads them for the page: the kinds of field, the widths, a
 * field with every setting filled, the options of a list, the steps.
 */
import { __ } from '@wordpress/i18n';

/** The kinds of field, as Elementor names them. */
export const TYPES = [
	[ 'text', __( 'Text', 'harlow' ) ],
	[ 'email', __( 'Email', 'harlow' ) ],
	[ 'textarea', __( 'Textarea', 'harlow' ) ],
	[ 'url', __( 'URL', 'harlow' ) ],
	[ 'tel', __( 'Tel', 'harlow' ) ],
	[ 'radio', __( 'Radio', 'harlow' ) ],
	[ 'select', __( 'Select', 'harlow' ) ],
	[ 'checkbox', __( 'Checkbox', 'harlow' ) ],
	[ 'acceptance', __( 'Acceptance', 'harlow' ) ],
	[ 'number', __( 'Number', 'harlow' ) ],
	[ 'date', __( 'Date', 'harlow' ) ],
	[ 'time', __( 'Time', 'harlow' ) ],
	[ 'upload', __( 'File Upload', 'harlow' ) ],
	[ 'password', __( 'Password', 'harlow' ) ],
	[ 'html', __( 'HTML', 'harlow' ) ],
	[ 'hidden', __( 'Hidden', 'harlow' ) ],
	[ 'step', __( 'Step', 'harlow' ) ],
];

/** A column's widths, in percent. */
export const WIDTHS = [
	'100',
	'80',
	'75',
	'66',
	'60',
	'50',
	'40',
	'33',
	'25',
	'20',
];

/** The sizes of the fields and the button. */
export const SIZES = [
	[ 'xs', __( 'Extra Small', 'harlow' ) ],
	[ 'sm', __( 'Small', 'harlow' ) ],
	[ 'md', __( 'Medium', 'harlow' ) ],
	[ 'lg', __( 'Large', 'harlow' ) ],
	[ 'xl', __( 'Extra Large', 'harlow' ) ],
];

/** The kinds of step indicator. */
export const STEP_TYPES = [
	[ 'none', __( 'None', 'harlow' ) ],
	[ 'text', __( 'Text', 'harlow' ) ],
	[ 'icon', __( 'Icon', 'harlow' ) ],
	[ 'number', __( 'Number', 'harlow' ) ],
	[ 'progress_bar', __( 'Progress Bar', 'harlow' ) ],
	[ 'number_text', __( 'Number & Text', 'harlow' ) ],
	[ 'icon_text', __( 'Icon & Text', 'harlow' ) ],
];

/** The shapes of a step's icon or number. */
export const SHAPES = [
	[ 'circle', __( 'Circle', 'harlow' ) ],
	[ 'square', __( 'Square', 'harlow' ) ],
	[ 'rounded', __( 'Rounded', 'harlow' ) ],
	[ 'none', __( 'None', 'harlow' ) ],
];

/** The caret of a list (select), as the page prints it. */
export const CARET =
	'<svg aria-hidden="true" class="e-font-icon-svg e-eicon-caret-down" viewBox="0 0 10 6" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h10L5 6z"></path></svg>';

/** A step's icon when none is chosen (Elementor's star). */
export const STAR =
	'<svg aria-hidden="true" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.53L12 17.5l-5.87 3.07 1.12-6.53L2.5 9.41l6.56-.95z"></path></svg>';

/** A new field's settings. */
const BLANK = {
	id: '',
	type: 'text',
	label: '',
	placeholder: '',
	required: false,
	value: '',
	options: '',
	inline: false,
	multiple: false,
	selectSize: 0,
	rows: 4,
	min: '',
	max: '',
	fileTypes: '',
	fileSize: 0,
	maxFiles: 0,
	attach: false,
	acceptance: '',
	checked: false,
	html: '',
	previous: '',
	next: '',
	icon: '',
	width: '100',
	widthTablet: '',
	widthMobile: '',
	cssClasses: '',
};

/**
 * One of a list of values, or a fallback.
 *
 * @param {*}        value    The value.
 * @param {string[]} allowed  The values allowed.
 * @param {string}   fallback What stands when the value is none of them.
 * @return {string} The value.
 */
export function oneOf( value, allowed, fallback ) {
	return allowed.includes( value ) ? value : fallback;
}

/**
 * A field with every setting filled (harlow_form_field()).
 *
 * @param {Object} raw   The field as the block keeps it.
 * @param {number} index Its place in the form.
 * @return {Object} The field.
 */
export function normalizeField( raw, index ) {
	const field = { ...BLANK, ...( raw || {} ) };
	field.type = oneOf(
		field.type,
		TYPES.map( ( [ t ] ) => t ),
		'text'
	);
	field.id = `${ field.id || '' }`.replace( /[^A-Za-z0-9_]/g, '' );
	if ( ! field.id ) {
		field.id = `field_${ index + 1 }`;
	}
	field.width = oneOf( `${ field.width }`, WIDTHS, '100' );
	field.widthTablet = oneOf( `${ field.widthTablet }`, WIDTHS, '' );
	field.widthMobile = oneOf( `${ field.widthMobile }`, WIDTHS, '' );
	field.required =
		!! field.required &&
		! [ 'html', 'hidden', 'step' ].includes( field.type );
	field.cssClasses = `${ field.cssClasses || '' }`
		.split( /\s+/ )
		.map( ( c ) => c.replace( /[^A-Za-z0-9_-]/g, '' ) )
		.filter( Boolean )
		.join( ' ' );
	return field;
}

/**
 * The form's fields, each with an id of its own (harlow_form_fields()).
 *
 * @param {Object[]} fields The block's fields.
 * @return {Object[]} The fields.
 */
export function formFields( fields ) {
	const seen = new Set();
	return ( Array.isArray( fields ) ? fields : [] ).map( ( raw, index ) => {
		const field = normalizeField( raw, index );
		while ( seen.has( field.id ) ) {
			field.id += `_${ index + 1 }`;
		}
		seen.add( field.id );
		return field;
	} );
}

/**
 * The options of a list, radio buttons or checkboxes (harlow_form_options()).
 *
 * @param {string} text One per line, `label|value` or a label that is its own value.
 * @return {Object[]} { label, value }.
 */
export function parseOptions( text ) {
	return `${ text || '' }`
		.split( /\r\n|\r|\n/ )
		.filter( ( line ) => line.trim() !== '' )
		.map( ( line ) => {
			const at = line.indexOf( '|' );
			return at < 0
				? { label: line.trim(), value: line.trim() }
				: {
						label: line.slice( 0, at ).trim(),
						value: line.slice( at + 1 ).trim(),
					};
		} );
}

/**
 * The form's steps: the fields between one Step field and the next (harlow_form_steps()).
 *
 * @param {Object[]} fields The form's fields.
 * @return {Object[]} { step, fields }.
 */
export function formSteps( fields ) {
	const steps = [];
	fields.forEach( ( field ) => {
		if ( field.type === 'step' ) {
			if ( steps.length === 1 && ! steps[ 0 ].step ) {
				steps[ 0 ].step = field;
			} else {
				steps.push( { step: field, fields: [] } );
			}
			return;
		}
		if ( ! steps.length ) {
			steps.push( { step: null, fields: [] } );
		}
		steps[ steps.length - 1 ].fields.push( field );
	} );
	return steps;
}

/**
 * The form's spacing per device as its custom properties (harlow_form_style_vars()).
 *
 * @param {Object} formStyle The block's formStyle attribute.
 * @return {Object} A React style object.
 */
export function styleVars( formStyle ) {
	const names = {
		columnGap: 'column-gap',
		rowGap: 'row-gap',
		labelSpacing: 'label-spacing',
		htmlSpacing: 'html-spacing',
	};
	const style = {};
	[ 'desktop', 'tablet', 'mobile' ].forEach( ( device ) => {
		const one = formStyle?.[ device ];
		if ( ! one || typeof one !== 'object' ) {
			return;
		}
		Object.entries( names ).forEach( ( [ key, name ] ) => {
			const value = one[ key ];
			if (
				value === undefined ||
				value === null ||
				value === '' ||
				isNaN( Number( value ) ) ||
				Number( value ) < 0
			) {
				return;
			}
			style[
				`--harlow-form-${ name }${
					device === 'desktop' ? '' : `-${ device }`
				}`
			] = `${ Math.min( 500, Number( value ) ) }px`;
		} );
	} );
	return style;
}

/**
 * The button's alignment, per device, as Elementor's prefix classes on the widget
 * (harlow_form_root_classes()).
 *
 * @param {Object} attributes The block's attributes.
 * @return {string} Classes, each with its leading space.
 */
export function rootClasses( attributes ) {
	const aligns = [ 'start', 'center', 'end', 'stretch' ];
	let out = ` elementor-button-align-${ oneOf(
		attributes.buttonAlign,
		aligns,
		'stretch'
	) }`;
	if ( aligns.includes( attributes.buttonAlignTablet ) ) {
		out += ` elementor-tablet-button-align-${ attributes.buttonAlignTablet }`;
	}
	if ( aligns.includes( attributes.buttonAlignMobile ) ) {
		out += ` elementor-mobile-button-align-${ attributes.buttonAlignMobile }`;
	}
	return out;
}

/**
 * A column's width classes (harlow_form_width_classes()).
 *
 * @param {string} width  The width.
 * @param {string} tablet The width on tablets, or ''.
 * @param {string} mobile The width on phones, or ''.
 * @return {string[]} Classes.
 */
export function widthClasses( width, tablet, mobile ) {
	const classes = [
		`elementor-col-${ oneOf( `${ width }`, WIDTHS, '100' ) }`,
	];
	if ( WIDTHS.includes( `${ tablet }` ) ) {
		classes.push( `elementor-md-${ tablet }` );
	}
	if ( WIDTHS.includes( `${ mobile }` ) ) {
		classes.push( `elementor-sm-${ mobile }` );
	}
	return classes;
}

/**
 * A new field id no field of the form has (Elementor's field_ and seven characters).
 *
 * @param {Object[]} fields The form's fields.
 * @return {string} The id.
 */
export function newFieldId( fields ) {
	const taken = new Set( ( fields || [] ).map( ( f ) => f.id ) );
	let id;
	do {
		id = `field_${ Math.floor( Math.random() * 0xfffffff )
			.toString( 16 )
			.padStart( 7, '0' ) }`;
	} while ( taken.has( id ) );
	return id;
}
