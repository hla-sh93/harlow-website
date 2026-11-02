/**
 * An icon in the editor: includes/sections/icon.php, the icon chosen in the sidebar from
 * the site's set.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import {
	classOf,
	elementProps,
	iconHtml,
	IconPicker,
	LinkFields,
	withClass,
} from '../../editor/shared';

const VIEWS = [
	'elementor-view-default',
	'elementor-view-stacked',
	'elementor-view-framed',
];
const SHAPES = [ 'elementor-shape-circle', 'elementor-shape-square' ];

export default function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'icon.default' )
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Icon', 'harlow' ) }>
					<IconPicker
						value={ attributes.icon }
						onChange={ ( icon ) => setAttributes( { icon } ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'View', 'harlow' ) }
						value={
							classOf( attributes.classes, VIEWS ) ||
							'elementor-view-default'
						}
						options={ [
							{
								value: 'elementor-view-default',
								label: __( 'Default', 'harlow' ),
							},
							{
								value: 'elementor-view-stacked',
								label: __( 'Stacked', 'harlow' ),
							},
							{
								value: 'elementor-view-framed',
								label: __( 'Framed', 'harlow' ),
							},
						] }
						onChange={ ( view ) => {
							let classes = withClass(
								attributes.classes,
								VIEWS,
								view
							);
							classes = withClass(
								classes,
								SHAPES,
								view === 'elementor-view-default'
									? ''
									: classOf( classes, SHAPES ) ||
											'elementor-shape-circle'
							);
							setAttributes( { classes } );
						} }
					/>
					{ classOf( attributes.classes, SHAPES ) && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Shape', 'harlow' ) }
							value={ classOf( attributes.classes, SHAPES ) }
							options={ [
								{
									value: 'elementor-shape-circle',
									label: __( 'Circle', 'harlow' ),
								},
								{
									value: 'elementor-shape-square',
									label: __( 'Square', 'harlow' ),
								},
							] }
							onChange={ ( shape ) =>
								setAttributes( {
									classes: withClass(
										attributes.classes,
										SHAPES,
										shape
									),
								} )
							}
						/>
					) }
				</PanelBody>
				<PanelBody
					title={ __( 'Link', 'harlow' ) }
					initialOpen={ false }
				>
					<LinkFields
						value={ attributes }
						onChange={ setAttributes }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<div className="elementor-icon-wrapper">
						{ '\n' }
						<div
							className="elementor-icon"
							dangerouslySetInnerHTML={ iconHtml(
								attributes.icon
							) }
						/>
						{ '\n' }
					</div>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
