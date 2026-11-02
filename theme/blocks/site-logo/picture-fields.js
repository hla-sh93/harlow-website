/**
 * The sidebar of a picture widget that shows a picture kept elsewhere (the site's logo,
 * the item's featured picture), as Elementor's image widget has it: the picture's size,
 * its caption and its link.
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { LinkFields } from '../../editor/shared';

export const SIZES = [
	{ value: 'thumbnail', label: __( 'Thumbnail', 'harlow' ) },
	{ value: 'medium', label: __( 'Medium', 'harlow' ) },
	{ value: 'medium_large', label: __( 'Medium Large', 'harlow' ) },
	{ value: 'large', label: __( 'Large', 'harlow' ) },
	{ value: 'full', label: __( 'Full', 'harlow' ) },
];

/**
 * The picture widget's fields.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes    The block's attributes: size, captionSource,
 *                                       caption, linkTo, link, linkTarget, linkRel, lightbox.
 * @param {Function} props.setAttributes The block's setter.
 * @param {string}   props.title         The first panel's name.
 * @param {string}   props.help          Where the picture is changed.
 * @param {Object}   props.links         The link choices: value => label.
 */
export function PictureFields( {
	attributes,
	setAttributes,
	title,
	help,
	links,
} ) {
	return (
		<InspectorControls>
			<PanelBody title={ title }>
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Image Resolution', 'harlow' ) }
					help={ help }
					value={ attributes.size }
					options={ SIZES }
					onChange={ ( size ) => setAttributes( { size } ) }
				/>
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Caption', 'harlow' ) }
					value={ attributes.captionSource }
					options={ [
						{ value: 'none', label: __( 'None', 'harlow' ) },
						{
							value: 'attachment',
							label: __( 'Attachment Caption', 'harlow' ),
						},
						{
							value: 'custom',
							label: __( 'Custom Caption', 'harlow' ),
						},
					] }
					onChange={ ( captionSource ) =>
						setAttributes( { captionSource } )
					}
				/>
				{ attributes.captionSource === 'custom' && (
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Custom Caption', 'harlow' ) }
						value={ attributes.caption }
						onChange={ ( caption ) => setAttributes( { caption } ) }
					/>
				) }
			</PanelBody>
			<PanelBody title={ __( 'Link', 'harlow' ) } initialOpen={ false }>
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Link', 'harlow' ) }
					value={ attributes.linkTo }
					options={ Object.entries( links ).map(
						( [ value, label ] ) => ( { value, label } )
					) }
					onChange={ ( linkTo ) => setAttributes( { linkTo } ) }
				/>
				{ attributes.linkTo === 'file' && (
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Lightbox', 'harlow' ) }
						checked={ !! attributes.lightbox }
						onChange={ ( lightbox ) =>
							setAttributes( { lightbox } )
						}
					/>
				) }
				{ attributes.linkTo === 'custom' && (
					<LinkFields
						value={ attributes }
						onChange={ setAttributes }
					/>
				) }
			</PanelBody>
		</InspectorControls>
	);
}
