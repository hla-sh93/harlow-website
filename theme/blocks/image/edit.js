/**
 * An image in the editor: the server's markup of includes/sections/image.php, so the
 * picture has the page's own srcset and the browser picks the same file. The picture is
 * replaced from the Media Library in the toolbar; its words for screen readers and its
 * link in the sidebar.
 */
import {
	BlockControls,
	InspectorControls,
	MediaReplaceFlow,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextareaControl,
	TextControl,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { LinkFields, ServerMarkup, SourceNote } from '../../editor/shared';

export default function Edit( { attributes, setAttributes } ) {
	const { image, link, alt, title, source } = attributes;
	const media = useSelect(
		( select ) =>
			image
				? select( coreStore ).getEntityRecord(
						'postType',
						'attachment',
						image
					)
				: null,
		[ image ]
	);
	return (
		<>
			<BlockControls group="other">
				<MediaReplaceFlow
					mediaId={ image || undefined }
					mediaURL={ media?.source_url }
					allowedTypes={ [ 'image' ] }
					accept="image/*"
					onSelect={ ( picked ) =>
						setAttributes( {
							image: picked.id,
							alt: picked.alt || '',
							src: '',
							width: '',
							height: '',
							imgClass: '',
						} )
					}
					name={ __( 'Replace picture', 'harlow' ) }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Picture', 'harlow' ) }>
					<MediaReplaceFlow
						mediaId={ image || undefined }
						mediaURL={ media?.source_url }
						allowedTypes={ [ 'image' ] }
						accept="image/*"
						onSelect={ ( picked ) =>
							setAttributes( {
								image: picked.id,
								alt: picked.alt || '',
								src: '',
								width: '',
								height: '',
								imgClass: '',
							} )
						}
						name={ __(
							'Choose from the Media Library or upload',
							'harlow'
						) }
					/>
					{ media?.media_details && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Picture file size', 'harlow' ) }
							value={ attributes.size }
							options={ [
								...Object.entries(
									media.media_details.sizes || {}
								)
									.filter( ( [ name ] ) => name !== 'full' )
									.map( ( [ name, s ] ) => ( {
										value: name,
										label: `${ name } (${ s.width } × ${ s.height })`,
									} ) ),
								{
									value: 'full',
									label: `${ __( 'full', 'harlow' ) } (${
										media.media_details.width
									} × ${ media.media_details.height })`,
								},
							] }
							onChange={ ( value ) =>
								setAttributes( { size: value } )
							}
						/>
					) }
					<TextareaControl
						__nextHasNoMarginBottom
						label={ __(
							'Words for screen readers (alt)',
							'harlow'
						) }
						value={ alt }
						onChange={ ( value ) =>
							setAttributes( { alt: value } )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __(
							'Title (shown while the pointer rests on it)',
							'harlow'
						) }
						value={ title }
						onChange={ ( value ) =>
							setAttributes( { title: value } )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Caption', 'harlow' ) }
					initialOpen={ !! attributes.caption }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Caption', 'harlow' ) }
						value={ attributes.caption }
						options={ [
							{ value: '', label: __( 'None', 'harlow' ) },
							{
								value: 'attachment',
								label: __(
									'The picture’s own caption',
									'harlow'
								),
							},
							{
								value: 'custom',
								label: __( 'Typed here', 'harlow' ),
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { caption: value } )
						}
					/>
					{ attributes.caption === 'custom' && (
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Caption words', 'harlow' ) }
							value={ attributes.captionText }
							onChange={ ( value ) =>
								setAttributes( { captionText: value } )
							}
						/>
					) }
				</PanelBody>
				<PanelBody
					title={ __( 'Link', 'harlow' ) }
					initialOpen={ !! link }
				>
					<LinkFields
						value={ attributes }
						onChange={ setAttributes }
					/>
				</PanelBody>
			</InspectorControls>
			{ source ? (
				<SourceNote attributes={ attributes } widget="image" />
			) : (
				<ServerMarkup name="harlow/image" attributes={ attributes } />
			) }
		</>
	);
}
