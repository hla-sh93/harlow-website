/**
 * An icon in the editor: includes/sections/icon.php, the icon chosen in the sidebar from
 * the site's set.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { elementProps, iconHtml, IconPicker } from '../../editor/shared';

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
