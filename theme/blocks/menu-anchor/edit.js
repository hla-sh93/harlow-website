/**
 * A menu anchor in the editor: includes/sections/menu-anchor.php, its id in the sidebar.
 * The page shows nothing; the canvas marks the anchor with its id
 * (assets/css/widgets/menu-anchor.css), as Elementor's editor marks it.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { elementProps } from '../../editor/shared';

/**
 * An id as WordPress keeps a class name (sanitize_html_class()): letters, digits, - and _.
 *
 * @param {string} value The id as typed.
 * @return {string} The id.
 */
function cleanId( value ) {
	return ( value || '' )
		.replace( /%[a-fA-F0-9][a-fA-F0-9]/g, '' )
		.replace( /[^A-Za-z0-9_-]/g, '' );
}

export default function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'menu-anchor.default' )
	);
	const anchor = cleanId( attributes.anchor );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Anchor', 'harlow' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'The ID of Menu Anchor', 'harlow' ) }
						help={ __(
							'A link to this place ends in # and this id (#contact). Letters, digits, - and _ only, without the #.',
							'harlow'
						) }
						value={ attributes.anchor }
						onChange={ ( value ) =>
							setAttributes( { anchor: cleanId( value ) } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<div
						className="elementor-menu-anchor"
						id={ anchor || undefined }
						data-label={ __( 'Menu anchor', 'harlow' ) }
					/>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
