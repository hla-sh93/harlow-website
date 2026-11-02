/**
 * Values set per device, as Elementor's responsive controls: a field shows the value of the
 * device the editor previews (its Desktop, Tablet and Mobile view), and the custom
 * properties that carry a length for each device (functions/widgets/spacer.php). Used by
 * the spacer, the flip box and the star rating.
 */
import { SelectControl, TextControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/** The editor's devices: the attributes' suffix and the label shown. */
const DEVICES = {
	Desktop: [ '', __( 'Desktop', 'harlow' ) ],
	Tablet: [ 'Tablet', __( 'Tablet', 'harlow' ) ],
	Mobile: [ 'Mobile', __( 'Mobile', 'harlow' ) ],
};

/** The units a length may take. */
const UNITS = [ 'px', 'em', 'rem', 'vh', 'vw', '%' ].map( ( u ) => ( {
	value: u,
	label: u,
} ) );

/**
 * The device the editor previews.
 *
 * @return {Array} [ the attributes' suffix ('', 'Tablet', 'Mobile'), its label ].
 */
export function useDevice() {
	const device = useSelect(
		( select ) => select( 'core/editor' )?.getDeviceType?.() || 'Desktop',
		[]
	);
	return DEVICES[ device ] || DEVICES.Desktop;
}

/**
 * A length of a block for each device, as the custom properties the page prints
 * (harlow_spacer_vars()).
 *
 * @param {Object} attributes The block's attributes.
 * @param {string} key        The attribute's name.
 * @param {string} name       The custom property.
 * @return {Object} A style object.
 */
export function lengthVars( attributes, key, name ) {
	const out = {};
	[
		[ '', '' ],
		[ 'Tablet', '-tablet' ],
		[ 'Mobile', '-mobile' ],
	].forEach( ( [ device, suffix ] ) => {
		const value = `${ attributes[ key + device ] ?? '' }`.trim();
		const unit = attributes[ `${ key }${ device }Unit` ] || 'px';
		const m = value.match( /^(\d+(?:\.\d+)?)\s*(px|em|rem|vh|vw|%)?$/ );
		if ( m ) {
			out[ name + suffix ] = m[ 1 ] + ( m[ 2 ] || unit );
		}
	} );
	return out;
}

/**
 * A length for the device the editor previews: a number and its unit.
 *
 * @param {Object}   props
 * @param {string}   props.label         What the length is.
 * @param {string}   props.name          The attribute's name (the desktop value's).
 * @param {Object}   props.attributes    The block's attributes.
 * @param {Function} props.setAttributes The block's setter.
 * @param {boolean}  props.numeric       The desktop value is a number (not a string).
 * @param {string}   props.help          A line under the field.
 */
export function ResponsiveLength( {
	label,
	name,
	attributes,
	setAttributes,
	numeric = false,
	help,
} ) {
	const [ suffix, deviceLabel ] = useDevice();
	const key = name + suffix;
	const unitKey = `${ name }${ suffix }Unit`;
	const value = attributes[ key ];
	const unit = attributes[ unitKey ] || 'px';
	return (
		<div className="harlow-responsive-length">
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ `${ label } (${ deviceLabel })` }
				help={
					help ||
					( suffix
						? __(
								'Empty: the same as the larger device.',
								'harlow'
							)
						: undefined )
				}
				type="number"
				min={ 0 }
				step="any"
				value={ value === undefined || value === null ? '' : value }
				onChange={ ( v ) => {
					if ( numeric && ! suffix ) {
						setAttributes( {
							[ key ]: v === '' ? undefined : Number( v ),
						} );
					} else {
						setAttributes( { [ key ]: v } );
					}
				} }
			/>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ `${ __( 'Unit', 'harlow' ) } (${ deviceLabel })` }
				value={ unit }
				options={ UNITS }
				onChange={ ( u ) => setAttributes( { [ unitKey ]: u } ) }
			/>
		</div>
	);
}
