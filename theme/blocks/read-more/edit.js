/**
 * Read more in the editor: includes/sections/read-more.php. The link's words are typed in
 * place; the page shows the link where the post is listed, and nothing on the post's own
 * page.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { elementProps } from '../../editor/shared';

export default function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'read-more.default' )
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Read More', 'harlow' ) }>
					<p>
						{ __(
							'Where a post is listed (blog, archives, search), it is cut here and these words link to the whole post. On the post’s own page nothing shows.',
							'harlow'
						) }
					</p>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<RichText
						tagName="a"
						className="more-link"
						value={ attributes.text }
						onChange={ ( text ) => setAttributes( { text } ) }
						placeholder={ __( 'Continue reading', 'harlow' ) }
						allowedFormats={ [] }
						withoutInteractiveFormatting
					/>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
