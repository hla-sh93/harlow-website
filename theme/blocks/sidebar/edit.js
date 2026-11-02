/**
 * A widget area in the editor: the server's markup of includes/sections/sidebar.php (the
 * widgets are kept in Appearance → Widgets), the area chosen in the sidebar.
 */
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { ServerMarkup } from '../../editor/shared';

export default function Edit( { attributes, setAttributes } ) {
	const areas = window.harlowSidebars || [];
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Sidebar', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Choose Sidebar', 'harlow' ) }
						help={ __(
							'Its widgets are added in Appearance → Widgets.',
							'harlow'
						) }
						value={ attributes.sidebar }
						options={ [
							{
								value: '',
								label: __( 'The first area', 'harlow' ),
							},
							...areas,
						] }
						onChange={ ( sidebar ) => setAttributes( { sidebar } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<ServerMarkup name="harlow/sidebar" attributes={ attributes } />
		</>
	);
}
