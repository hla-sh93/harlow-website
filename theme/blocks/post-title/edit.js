/**
 * The item's title in the editor: the server's markup of includes/sections/post-title.php
 * (the title is the item's own, or a sample post's in an item page template), the tag,
 * size and link in the sidebar.
 */
import { __ } from '@wordpress/i18n';

import { ServerMarkup } from '../../editor/shared';
import { TitleFields } from './title-fields';

export default function Edit( { attributes, setAttributes } ) {
	return (
		<>
			<TitleFields
				attributes={ attributes }
				setAttributes={ setAttributes }
				title={ __( 'Title', 'harlow' ) }
				links={ [ 'none', 'item', 'custom' ] }
			/>
			<ServerMarkup name="harlow/post-title" attributes={ attributes } />
		</>
	);
}
