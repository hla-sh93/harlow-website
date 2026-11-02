/**
 * The site's name in the editor: the server's markup of includes/sections/site-title.php
 * (the name is Settings → General's), the tag, size and link in the sidebar.
 */
import { __ } from '@wordpress/i18n';

import { ServerMarkup } from '../../editor/shared';
import { TitleFields } from '../post-title/title-fields';

export default function Edit( { attributes, setAttributes } ) {
	return (
		<>
			<TitleFields
				attributes={ attributes }
				setAttributes={ setAttributes }
				title={ __( 'Title', 'harlow' ) }
				links={ [ 'none', 'home', 'custom' ] }
			/>
			<ServerMarkup name="harlow/site-title" attributes={ attributes } />
		</>
	);
}
