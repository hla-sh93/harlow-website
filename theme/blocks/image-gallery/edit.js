/**
 * A basic gallery in the editor: the server's markup of includes/sections/image-gallery.php
 * (WordPress's gallery of the pictures), the pictures and the settings in the sidebar, as
 * Elementor's panel has them.
 */
import {
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadCheck,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	SelectControl,
	TextControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

import { elementProps, ServerMarkup } from '../../editor/shared';

/** The picture sizes WordPress makes, as Elementor's image size control offers them. */
const SIZES = [
	{ value: 'thumbnail', label: __( 'Thumbnail', 'harlow' ) },
	{ value: 'medium', label: __( 'Medium', 'harlow' ) },
	{ value: 'medium_large', label: __( 'Medium large', 'harlow' ) },
	{ value: 'large', label: __( 'Large', 'harlow' ) },
	{ value: 'full', label: __( 'Full', 'harlow' ) },
];

/**
 * The pictures, chosen from the Media Library or uploaded, in their order.
 *
 * @param {Object}   props
 * @param {number[]} props.value    The pictures.
 * @param {Function} props.onChange Called with the pictures' ids.
 */
function GalleryPicker( { value, onChange } ) {
	return (
		<MediaUploadCheck>
			<MediaUpload
				allowedTypes={ [ 'image' ] }
				multiple
				gallery
				value={ value }
				onSelect={ ( items ) =>
					onChange( items.map( ( item ) => item.id ) )
				}
				render={ ( { open } ) => (
					<Button variant="secondary" onClick={ open }>
						{ value.length
							? sprintf(
									// translators: %d: how many pictures the gallery has.
									__( 'Edit the pictures (%d)', 'harlow' ),
									value.length
								)
							: __( 'Choose the pictures', 'harlow' ) }
					</Button>
				) }
			/>
		</MediaUploadCheck>
	);
}

/**
 * The widget before it has pictures: Elementor's empty gallery, to fill.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes The block's attributes.
 * @param {Function} props.onSelect   Called with the pictures' ids.
 */
function Empty( { attributes, onSelect } ) {
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'image-gallery.default' )
	);
	return (
		<div { ...blockProps }>
			{ /* In the widget's box, as Elementor's element: its spacing and border show. */ }
			<div className="elementor-widget-container">
				<MediaPlaceholder
					icon="format-gallery"
					labels={ {
						title: __( 'Basic Gallery', 'harlow' ),
						instructions: __(
							'Choose the pictures of the gallery, or upload them.',
							'harlow'
						),
					} }
					allowedTypes={ [ 'image' ] }
					multiple
					gallery
					onSelect={ ( items ) =>
						onSelect( items.map( ( item ) => item.id ) )
					}
				/>
			</div>
		</div>
	);
}

export default function Edit( { attributes, setAttributes } ) {
	const set = ( name ) => ( value ) => setAttributes( { [ name ]: value } );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Basic Gallery', 'harlow' ) }>
					<GalleryPicker
						value={ attributes.pictures }
						onChange={ set( 'pictures' ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Image size', 'harlow' ) }
						value={ attributes.imageSize }
						options={ SIZES }
						onChange={ set( 'imageSize' ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Columns', 'harlow' ) }
						value={ attributes.columns }
						options={ Array.from( { length: 10 }, ( x, i ) => ( {
							value: String( i + 1 ),
							label: String( i + 1 ),
						} ) ) }
						onChange={ set( 'columns' ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Link', 'harlow' ) }
						value={ attributes.link }
						options={ [
							{
								value: 'file',
								label: __( 'Media file', 'harlow' ),
							},
							{
								value: 'attachment',
								label: __( 'Attachment page', 'harlow' ),
							},
							{ value: 'none', label: __( 'None', 'harlow' ) },
						] }
						onChange={ set( 'link' ) }
					/>
					{ attributes.link === 'file' && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Lightbox', 'harlow' ) }
							value={ attributes.openLightbox }
							options={ [
								{
									value: 'default',
									label: __( 'Default', 'harlow' ),
								},
								{ value: 'yes', label: __( 'Yes', 'harlow' ) },
								{ value: 'no', label: __( 'No', 'harlow' ) },
							] }
							onChange={ set( 'openLightbox' ) }
						/>
					) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Order by', 'harlow' ) }
						value={ attributes.orderby }
						options={ [
							{ value: '', label: __( 'Default', 'harlow' ) },
							{ value: 'rand', label: __( 'Random', 'harlow' ) },
						] }
						onChange={ set( 'orderby' ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Caption', 'harlow' ) }
						value={ attributes.caption }
						options={ [
							{
								value: '',
								label: __( 'Attachment caption', 'harlow' ),
							},
							{ value: 'none', label: __( 'None', 'harlow' ) },
						] }
						onChange={ set( 'caption' ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Images', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Spacing', 'harlow' ) }
						value={ attributes.imageSpacing }
						options={ [
							{ value: '', label: __( 'Default', 'harlow' ) },
							{
								value: 'custom',
								label: __( 'Custom', 'harlow' ),
							},
						] }
						onChange={ set( 'imageSpacing' ) }
					/>
					{ attributes.imageSpacing === 'custom' && (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							type="number"
							min="0"
							label={ __( 'Image spacing (px)', 'harlow' ) }
							value={ attributes.spacing }
							onChange={ set( 'spacing' ) }
						/>
					) }
				</PanelBody>
			</InspectorControls>
			{ attributes.pictures.length ? (
				<ServerMarkup
					name="harlow/image-gallery"
					attributes={ attributes }
				/>
			) : (
				<Empty
					attributes={ attributes }
					onSelect={ set( 'pictures' ) }
				/>
			) }
		</>
	);
}
