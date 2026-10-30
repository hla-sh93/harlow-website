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
import { PanelBody, TextareaControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { LinkFields, ServerMarkup } from '../../editor/shared';

export default function Edit( { attributes, setAttributes } ) {
	const { image, link, alt } = attributes;
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
			<ServerMarkup name="harlow/image" attributes={ attributes } />
		</>
	);
}
