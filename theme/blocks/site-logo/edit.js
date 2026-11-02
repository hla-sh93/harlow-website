/**
 * The site's logo in the editor: the server's markup of includes/sections/site-logo.php
 * (the logo is the one the header shows, chosen in Customize), its size, caption and link
 * in the sidebar.
 */
import { __ } from '@wordpress/i18n';

import { ServerMarkup } from '../../editor/shared';
import { PictureFields } from './picture-fields';

export default function Edit( { attributes, setAttributes } ) {
	return (
		<>
			<PictureFields
				attributes={ attributes }
				setAttributes={ setAttributes }
				title={ __( 'Site Logo', 'harlow' ) }
				help={ __(
					'The logo is chosen in Appearance → Customize → Header and footer.',
					'harlow'
				) }
				links={ {
					none: __( 'None', 'harlow' ),
					file: __( 'Media File', 'harlow' ),
					custom: __(
						'Custom URL (the home page when empty)',
						'harlow'
					),
				} }
			/>
			<ServerMarkup name="harlow/site-logo" attributes={ attributes } />
		</>
	);
}
