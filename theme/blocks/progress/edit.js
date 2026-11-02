/**
 * A progress bar in the editor: includes/sections/progress.php, the bar filled to its
 * percentage (where the page's bar stops), the title and the words inside typed in place;
 * the percentage, the type and the title's tag in the sidebar.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { elementProps } from '../../editor/shared';

const TAGS = [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ];
const TYPES = [ 'info', 'success', 'warning', 'danger' ];

/**
 * The element's classes: the widget's own when it has none yet (progress.php).
 *
 * @param {string} classes The block's classes.
 * @return {string} The classes.
 */
function progressClasses( classes ) {
	const own = ( classes || '' ).split( /\s+/ ).filter( Boolean );
	return [
		...[
			'elementor-element',
			'elementor-widget',
			'elementor-widget-progress',
		].filter( ( c ) => ! own.includes( c ) ),
		...own,
	].join( ' ' );
}

export default function Edit( { attributes, setAttributes } ) {
	const {
		title,
		titleTag,
		progressType,
		percent,
		displayPercentage,
		innerText,
		element,
	} = attributes;
	const Tag = TAGS.includes( titleTag ) ? titleTag : 'span';
	const value = Math.min( 100, Math.max( 0, Number( percent ) || 0 ) );
	const barId = `elementor-progress-bar-${ element }`;
	const blockProps = useBlockProps(
		elementProps(
			{ ...attributes, classes: progressClasses( attributes.classes ) },
			'widget',
			'progress.default'
		)
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Progress Bar', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Title HTML tag', 'harlow' ) }
						value={ Tag }
						options={ TAGS.map( ( t ) => ( {
							value: t,
							label: t,
						} ) ) }
						onChange={ ( v ) => setAttributes( { titleTag: v } ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Type', 'harlow' ) }
						value={ progressType }
						options={ [
							{ value: '', label: __( 'Default', 'harlow' ) },
							{ value: 'info', label: __( 'Info', 'harlow' ) },
							{
								value: 'success',
								label: __( 'Success', 'harlow' ),
							},
							{
								value: 'warning',
								label: __( 'Warning', 'harlow' ),
							},
							{
								value: 'danger',
								label: __( 'Danger', 'harlow' ),
							},
						] }
						onChange={ ( v ) =>
							setAttributes( { progressType: v } )
						}
					/>
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Percentage', 'harlow' ) }
						value={ value }
						min={ 0 }
						max={ 100 }
						onChange={ ( v ) =>
							setAttributes( { percent: Number( v ) || 0 } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Display percentage', 'harlow' ) }
						checked={ !! displayPercentage }
						onChange={ ( v ) =>
							setAttributes( { displayPercentage: v } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<RichText
						tagName={ Tag }
						className="elementor-title"
						id={ barId }
						value={ title }
						onChange={ ( v ) => setAttributes( { title: v } ) }
						placeholder={ __( 'Title', 'harlow' ) }
					/>
					{ '\n' }
					<div
						className={
							'elementor-progress-wrapper' +
							( TYPES.includes( progressType )
								? ` progress-${ progressType }`
								: '' )
						}
						role="progressbar"
						aria-valuemin="0"
						aria-valuemax="100"
						aria-valuenow={ value }
						aria-labelledby={ barId }
					>
						{ '\n' }
						<div
							className="elementor-progress-bar"
							data-max={ value }
							style={ { width: `${ value }%` } }
						>
							{ '\n' }
							<RichText
								tagName="span"
								className="elementor-progress-text"
								value={ innerText }
								onChange={ ( v ) =>
									setAttributes( { innerText: v } )
								}
								placeholder={ __( 'Inner text', 'harlow' ) }
								withoutInteractiveFormatting
							/>
							{ displayPercentage && (
								<>
									{ '\n' }
									<span className="elementor-progress-percentage">
										{ `${ value }%` }
									</span>
								</>
							) }
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
