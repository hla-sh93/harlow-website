/**
 * A menu in the editor: the server's markup of includes/sections/nav-menu.php. Its links
 * are kept in Appearance → Menus; the sidebar chooses which menu it shows.
 */
import { InspectorControls } from '@wordpress/block-editor';
import { ExternalLink, PanelBody, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { ServerMarkup } from '../../editor/shared';

const MENUS = [
	{ value: 'primary', label: __( 'Main menu', 'harlow' ) },
	{ value: 'careers', label: __( 'Careers menu', 'harlow' ) },
	{ value: 'footer-1', label: __( 'Footer, first column', 'harlow' ) },
	{ value: 'footer-2', label: __( 'Footer, second column', 'harlow' ) },
	{ value: 'footer-3', label: __( 'Footer, third column', 'harlow' ) },
	{ value: 'footer-legal', label: __( 'Footer, legal links', 'harlow' ) },
];

export default function Edit( { attributes, setAttributes } ) {
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Menu', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Shows', 'harlow' ) }
						value={ attributes.menu }
						options={ MENUS }
						onChange={ ( menu ) => setAttributes( { menu } ) }
					/>
					<p>
						<ExternalLink href="nav-menus.php">
							{ __( 'Edit the menus', 'harlow' ) }
						</ExternalLink>
					</p>
				</PanelBody>
			</InspectorControls>
			<ServerMarkup name="harlow/nav-menu" attributes={ attributes } />
		</>
	);
}
