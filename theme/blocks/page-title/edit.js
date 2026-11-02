/**
 * The page's title in the editor: the server's markup of includes/sections/page-title.php
 * (the title of the page being edited), the tag, size and link in the sidebar.
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
				links={ [ 'none', 'item', 'custom' ] }
				contextLabel={ __( 'Include context', 'harlow' ) }
			/>
			<ServerMarkup name="harlow/page-title" attributes={ attributes } />
		</>
	);
}
