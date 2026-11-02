/**
 * The posts of a list in the editor: the server's markup of
 * includes/sections/archive-posts.php (the latest posts as a sample: the items are the
 * list's when one is shown), the cards, pager and filter bar in the sidebar.
 */
import { ServerMarkup } from '../../editor/shared';
import { CardFields } from '../posts/card-fields';

export default function Edit( { attributes, setAttributes } ) {
	return (
		<>
			<CardFields
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
			<ServerMarkup
				name="harlow/archive-posts"
				attributes={ attributes }
			/>
		</>
	);
}
