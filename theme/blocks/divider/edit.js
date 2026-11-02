/**
 * A divider in the editor: includes/sections/divider.php, its line's style or pattern and
 * the word or icon in its middle chosen in the sidebar.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import {
	classOf,
	elementProps,
	iconHtml,
	IconPicker,
	withClass,
} from '../../editor/shared';

const VIEWS = [
	'elementor-widget-divider--view-line',
	'elementor-widget-divider--view-line_text',
	'elementor-widget-divider--view-line_icon',
];
const ALIGNS = [
	'elementor-widget-divider--element-align-left',
	'elementor-widget-divider--element-align-center',
	'elementor-widget-divider--element-align-right',
];
const STYLES = [
	[ '', __( 'Default', 'harlow' ) ],
	[ 'solid', __( 'Solid', 'harlow' ) ],
	[ 'double', __( 'Double', 'harlow' ) ],
	[ 'dotted', __( 'Dotted', 'harlow' ) ],
	[ 'dashed', __( 'Dashed', 'harlow' ) ],
];
const PATTERNS = [
	[ '', __( 'None', 'harlow' ) ],
	[ 'curly', __( 'Curly', 'harlow' ) ],
	[ 'curved', __( 'Curved', 'harlow' ) ],
	[ 'slashes', __( 'Slashes', 'harlow' ) ],
	[ 'squared', __( 'Squared', 'harlow' ) ],
	[ 'wavy', __( 'Wavy', 'harlow' ) ],
	[ 'zigzag', __( 'Zigzag', 'harlow' ) ],
	[ 'dots', __( 'Dots', 'harlow' ) ],
];

export default function Edit( { attributes, setAttributes } ) {
	const { lineStyle, pattern, elementType, elementText, elementIcon } =
		attributes;
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'divider.default' )
	);
	const setElement = ( type ) => {
		let classes = withClass(
			attributes.classes,
			VIEWS,
			{
				text: 'elementor-widget-divider--view-line_text',
				icon: 'elementor-widget-divider--view-line_icon',
			}[ type ] || 'elementor-widget-divider--view-line'
		);
		classes = withClass(
			classes,
			ALIGNS,
			type ? classOf( classes, ALIGNS ) || ALIGNS[ 1 ] : ''
		);
		setAttributes( { elementType: type, classes } );
	};
	let line = '';
	if ( pattern ) {
		line = ` harlow-divider-pattern harlow-divider-pattern-${ pattern }`;
	} else if ( lineStyle ) {
		line = ` harlow-divider-style-${ lineStyle }`;
	}
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Divider', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Style', 'harlow' ) }
						value={ lineStyle }
						options={ STYLES.map( ( [ value, label ] ) => ( {
							value,
							label,
						} ) ) }
						onChange={ ( value ) =>
							setAttributes( { lineStyle: value } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Pattern', 'harlow' ) }
						value={ pattern }
						options={ PATTERNS.map( ( [ value, label ] ) => ( {
							value,
							label,
						} ) ) }
						onChange={ ( value ) =>
							setAttributes( { pattern: value } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Add element', 'harlow' ) }
						value={ elementType }
						options={ [
							{ value: '', label: __( 'None', 'harlow' ) },
							{ value: 'text', label: __( 'Text', 'harlow' ) },
							{ value: 'icon', label: __( 'Icon', 'harlow' ) },
						] }
						onChange={ setElement }
					/>
					{ elementType === 'text' && (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Text', 'harlow' ) }
							value={ elementText }
							onChange={ ( value ) =>
								setAttributes( { elementText: value } )
							}
						/>
					) }
					{ elementType === 'icon' && (
						<IconPicker
							value={ elementIcon }
							onChange={ ( icon ) =>
								setAttributes( { elementIcon: icon } )
							}
						/>
					) }
					{ elementType && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Position', 'harlow' ) }
							value={ classOf( attributes.classes, ALIGNS ) }
							options={ [
								{
									value: ALIGNS[ 0 ],
									label: __( 'Left', 'harlow' ),
								},
								{
									value: ALIGNS[ 1 ],
									label: __( 'Centre', 'harlow' ),
								},
								{
									value: ALIGNS[ 2 ],
									label: __( 'Right', 'harlow' ),
								},
							] }
							onChange={ ( align ) =>
								setAttributes( {
									classes: withClass(
										attributes.classes,
										ALIGNS,
										align
									),
								} )
							}
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<div className={ `elementor-divider${ line }` }>
						{ '\n' }
						<span className="elementor-divider-separator">
							{ '\n' }
							{ elementType === 'text' && (
								<>
									<span className="elementor-divider__text elementor-divider__element">
										{ elementText }
									</span>
									{ '\n' }
								</>
							) }
							{ elementType === 'icon' && (
								<>
									<div
										className="elementor-icon elementor-divider__element"
										dangerouslySetInnerHTML={ iconHtml(
											elementIcon,
											false
										) }
									/>
									{ '\n' }
								</>
							) }
						</span>
						{ '\n' }
					</div>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
