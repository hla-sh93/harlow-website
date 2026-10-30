/**
 * A gallery in the editor: the server's markup of includes/sections/gallery.php (its
 * pictures are the block's own or the item's gallery field, chosen in the item's screen).
 */
import { ServerMarkup } from '../../editor/shared';

export default function Edit( { attributes } ) {
	return <ServerMarkup name="harlow/gallery" attributes={ attributes } />;
}
