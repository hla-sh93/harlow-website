/**
 * The item's excerpt in the editor: the server's markup of
 * includes/sections/post-excerpt.php (the words are the item's own excerpt, or a sample
 * post's in an item page template), the length and Read More in the sidebar.
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { ServerMarkup } from '../../editor/shared';

export default function Edit( { attributes, setAttributes } ) {
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Excerpt', 'harlow' ) }>
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Excerpt Length', 'harlow' ) }
						help={ __(
							'Words; 0 shows the whole excerpt.',
							'harlow'
						) }
						value={ attributes.length }
						min={ 0 }
						max={ 200 }
						onChange={ ( length ) =>
							setAttributes( { length: length || 0 } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Apply to post content', 'harlow' ) }
						help={ __(
							'An item without an excerpt shows its text’s first words.',
							'harlow'
						) }
						checked={ !! attributes.fromContent }
						onChange={ ( fromContent ) =>
							setAttributes( { fromContent } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Read More', 'harlow' ) }
						checked={ !! attributes.readMore }
						onChange={ ( readMore ) =>
							setAttributes( { readMore } )
						}
					/>
					{ attributes.readMore && (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Read More Text', 'harlow' ) }
							value={ attributes.readMoreText }
							onChange={ ( readMoreText ) =>
								setAttributes( { readMoreText } )
							}
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<ServerMarkup
				name="harlow/post-excerpt"
				attributes={ attributes }
			/>
		</>
	);
}
