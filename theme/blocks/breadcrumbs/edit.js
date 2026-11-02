/**
 * Breadcrumbs in the editor: the server's markup of includes/sections/breadcrumbs.php (the
 * trail to the page being edited), the tag, separator and home's name in the sidebar.
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
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Breadcrumbs', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'HTML Tag', 'harlow' ) }
						value={ attributes.tag }
						options={ [ 'p', 'div', 'nav', 'span' ].map(
							( t ) => ( {
								value: t,
								label: t,
							} )
						) }
						onChange={ ( tag ) => setAttributes( { tag } ) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Separator', 'harlow' ) }
						value={ attributes.separator }
						onChange={ ( separator ) =>
							setAttributes( { separator } )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Home', 'harlow' ) }
						value={ attributes.homeText }
						onChange={ ( homeText ) =>
							setAttributes( { homeText } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Schema for search engines', 'harlow' ) }
						help={ __(
							'The trail as schema.org’s BreadcrumbList.',
							'harlow'
						) }
						checked={ !! attributes.schema }
						onChange={ ( schema ) => setAttributes( { schema } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<ServerMarkup name="harlow/breadcrumbs" attributes={ attributes } />
		</>
	);
}
