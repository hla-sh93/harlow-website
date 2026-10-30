/**
 * The item's text in the editor: the server's markup of includes/sections/post-content.php
 * (the text is the item's own, written in its own screen).
 */
import { ServerMarkup } from '../../editor/shared';

export default function Edit( { attributes } ) {
	return (
		<ServerMarkup name="harlow/post-content" attributes={ attributes } />
	);
}
