/**
 * The item pager in the editor: the server's markup of
 * includes/sections/post-navigation.php (the item's own neighbours, or a sample post's in
 * an item page template), the labels, arrows, titles and borders in the sidebar.
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { ServerMarkup } from '../../editor/shared';

export default function Edit( { attributes, setAttributes } ) {
	const toggle = ( key, label ) => (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ label }
			checked={ !! attributes[ key ] }
			onChange={ ( value ) => setAttributes( { [ key ]: value } ) }
		/>
	);
	const text = ( key, label ) => (
		<TextControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			value={ attributes[ key ] }
			onChange={ ( value ) => setAttributes( { [ key ]: value } ) }
		/>
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Post Navigation', 'harlow' ) }>
					{ toggle( 'showLabel', __( 'Label', 'harlow' ) ) }
					{ attributes.showLabel &&
						text( 'prevLabel', __( 'Previous Label', 'harlow' ) ) }
					{ attributes.showLabel &&
						text( 'nextLabel', __( 'Next Label', 'harlow' ) ) }
					{ toggle( 'showArrow', __( 'Arrows', 'harlow' ) ) }
					{ attributes.showArrow && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Arrows Type', 'harlow' ) }
							value={ attributes.arrow }
							options={ [
								{
									value: 'angle',
									label: __( 'Angle', 'harlow' ),
								},
								{
									value: 'angle-double',
									label: __( 'Double Angle', 'harlow' ),
								},
								{
									value: 'chevron',
									label: __( 'Chevron', 'harlow' ),
								},
								{
									value: 'caret',
									label: __( 'Caret', 'harlow' ),
								},
								{
									value: 'arrow',
									label: __( 'Arrow', 'harlow' ),
								},
							] }
							onChange={ ( arrow ) => setAttributes( { arrow } ) }
						/>
					) }
					{ toggle( 'showTitle', __( 'Post Title', 'harlow' ) ) }
					{ toggle( 'showBorders', __( 'Borders', 'harlow' ) ) }
					{ toggle( 'sameTerm', __( 'In same Term', 'harlow' ) ) }
					{ attributes.sameTerm && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Taxonomy', 'harlow' ) }
							value={ attributes.taxonomy }
							options={ [
								{
									value: 'category',
									label: __( 'Categories', 'harlow' ),
								},
								{
									value: 'post_tag',
									label: __( 'Tags', 'harlow' ),
								},
							] }
							onChange={ ( taxonomy ) =>
								setAttributes( { taxonomy } )
							}
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<ServerMarkup
				name="harlow/post-navigation"
				attributes={ attributes }
			/>
		</>
	);
}
