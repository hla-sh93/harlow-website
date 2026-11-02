/**
 * The item's featured picture in the editor: the server's markup of
 * includes/sections/post-featured-image.php (the picture is the item's own, set in its own
 * screen; a sample post's in an item page template), its size, fallback, caption and link
 * in the sidebar.
 */
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { PicturePicker, ServerMarkup } from '../../editor/shared';
import { PictureFields } from '../site-logo/picture-fields';

export default function Edit( { attributes, setAttributes } ) {
	return (
		<>
			<PictureFields
				attributes={ attributes }
				setAttributes={ setAttributes }
				title={ __( 'Image', 'harlow' ) }
				help={ __(
					'The picture is the item’s featured image, set in its own screen.',
					'harlow'
				) }
				links={ {
					none: __( 'None', 'harlow' ),
					file: __( 'Media File', 'harlow' ),
					item: __( 'The item’s page', 'harlow' ),
					custom: __( 'Custom URL', 'harlow' ),
				} }
			/>
			<InspectorControls>
				<PanelBody
					title={ __( 'Fallback', 'harlow' ) }
					initialOpen={ false }
				>
					<PicturePicker
						label={ __(
							'Shown when the item has no featured image',
							'harlow'
						) }
						value={ attributes.fallback }
						onChange={ ( fallback ) =>
							setAttributes( { fallback } )
						}
						none={ __( 'None', 'harlow' ) }
					/>
				</PanelBody>
			</InspectorControls>
			<ServerMarkup
				name="harlow/post-featured-image"
				attributes={ attributes }
			/>
		</>
	);
}
