/**
 * A list's title in the editor: the server's markup of
 * includes/sections/archive-title.php (a category's, as a sample: the list is the page's
 * when it is shown), the tag, size and link in the sidebar.
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
				links={ [ 'none', 'custom' ] }
				contextLabel={ __( 'Include context', 'harlow' ) }
			/>
			<ServerMarkup
				name="harlow/archive-title"
				attributes={ attributes }
			/>
		</>
	);
}
