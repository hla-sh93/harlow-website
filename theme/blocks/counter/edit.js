/**
 * A counter in the editor: includes/sections/counter.php, the number shown at its ending
 * value (where the page's count stops), the prefix, suffix and title typed in place; the
 * numbers, the count's duration, the thousand separator and the title's tag and place are
 * in the sidebar.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { elementProps } from '../../editor/shared';

const TAGS = [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ];

/** The title's place: the flex direction counter.php gives the counter. */
const POSITIONS = {
	before: 'column',
	start: 'row',
	end: 'row-reverse',
};

/**
 * The element's classes: the widget's own when it has none yet (counter.php).
 *
 * @param {string} classes The block's classes.
 * @return {string} The classes.
 */
function counterClasses( classes ) {
	const own = ( classes || '' ).split( /\s+/ ).filter( Boolean );
	return [
		...[
			'elementor-element',
			'elementor-widget',
			'elementor-widget-counter',
		].filter( ( c ) => ! own.includes( c ) ),
		...own,
	].join( ' ' );
}

/**
 * A number as the page's count writes it: its decimals, the thousands apart.
 *
 * @param {number} value     The number.
 * @param {string} delimiter The thousand separator, or ''.
 * @return {string} The number written.
 */
function formatNumber( value, delimiter ) {
	const number = Number( value ) || 0;
	const decimals = ( String( value ).split( '.' )[ 1 ] || '' ).length;
	const [ whole, part ] = number.toFixed( decimals ).split( '.' );
	const grouped = delimiter
		? whole.replace( /\B(?=(\d{3})+(?!\d))/g, delimiter )
		: whole;
	return part ? `${ grouped }.${ part }` : grouped;
}

export default function Edit( { attributes, setAttributes } ) {
	const {
		startingNumber,
		endingNumber,
		prefix,
		suffix,
		duration,
		thousandSeparator,
		separator,
		title,
		titleTag,
		titlePosition,
	} = attributes;
	const Tag = TAGS.includes( titleTag ) ? titleTag : 'div';
	const blockProps = useBlockProps(
		elementProps(
			{ ...attributes, classes: counterClasses( attributes.classes ) },
			'widget',
			'counter.default'
		)
	);
	const delimiter = thousandSeparator ? separator || ',' : '';
	const number = ( value ) =>
		value === '' || isNaN( Number( value ) ) ? 0 : Number( value );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Counter', 'harlow' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						label={ __( 'Starting number', 'harlow' ) }
						value={ startingNumber }
						onChange={ ( value ) =>
							setAttributes( { startingNumber: number( value ) } )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						label={ __( 'Ending number', 'harlow' ) }
						value={ endingNumber }
						onChange={ ( value ) =>
							setAttributes( { endingNumber: number( value ) } )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						min={ 0 }
						step={ 100 }
						label={ __( 'Animation duration (ms)', 'harlow' ) }
						value={ duration }
						onChange={ ( value ) =>
							setAttributes( {
								duration: Math.max( 0, number( value ) ),
							} )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Thousand separator', 'harlow' ) }
						checked={ !! thousandSeparator }
						onChange={ ( value ) =>
							setAttributes( { thousandSeparator: value } )
						}
					/>
					{ thousandSeparator && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Separator', 'harlow' ) }
							value={ separator }
							options={ [
								{
									value: ',',
									label: __( 'Default', 'harlow' ),
								},
								{ value: '.', label: __( 'Dot', 'harlow' ) },
								{ value: ' ', label: __( 'Space', 'harlow' ) },
								{
									value: '_',
									label: __( 'Underline', 'harlow' ),
								},
								{
									value: "'",
									label: __( 'Apostrophe', 'harlow' ),
								},
							] }
							onChange={ ( value ) =>
								setAttributes( { separator: value } )
							}
						/>
					) }
				</PanelBody>
				<PanelBody
					title={ __( 'Title', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Title HTML tag', 'harlow' ) }
						value={ Tag }
						options={ TAGS.map( ( t ) => ( {
							value: t,
							label: t,
						} ) ) }
						onChange={ ( value ) =>
							setAttributes( { titleTag: value } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Title position', 'harlow' ) }
						value={ titlePosition }
						options={ [
							{ value: 'after', label: __( 'Below', 'harlow' ) },
							{ value: 'before', label: __( 'Above', 'harlow' ) },
							{ value: 'start', label: __( 'Start', 'harlow' ) },
							{ value: 'end', label: __( 'End', 'harlow' ) },
						] }
						onChange={ ( value ) =>
							setAttributes( { titlePosition: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<div
						className="elementor-counter"
						style={
							POSITIONS[ titlePosition ]
								? { flexDirection: POSITIONS[ titlePosition ] }
								: undefined
						}
					>
						{ '\n' }
						<RichText
							tagName={ Tag }
							className="elementor-counter-title"
							value={ title }
							onChange={ ( value ) =>
								setAttributes( { title: value } )
							}
							placeholder={ __( 'Title', 'harlow' ) }
						/>
						{ '\n' }
						<div className="elementor-counter-number-wrapper">
							{ '\n' }
							<RichText
								tagName="span"
								className="elementor-counter-number-prefix"
								value={ prefix }
								onChange={ ( value ) =>
									setAttributes( { prefix: value } )
								}
								placeholder={ __( 'Prefix', 'harlow' ) }
								withoutInteractiveFormatting
							/>
							{ '\n' }
							<span
								className="elementor-counter-number"
								data-duration={ duration }
								data-to-value={ endingNumber }
								data-from-value={ startingNumber }
								data-delimiter={ delimiter || undefined }
							>
								{ formatNumber( endingNumber, delimiter ) }
							</span>
							{ '\n' }
							<RichText
								tagName="span"
								className="elementor-counter-number-suffix"
								value={ suffix }
								onChange={ ( value ) =>
									setAttributes( { suffix: value } )
								}
								placeholder={ __( 'Suffix', 'harlow' ) }
								withoutInteractiveFormatting
							/>
							{ '\n' }
						</div>
						{ '\n' }
					</div>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
