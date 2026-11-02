/**
 * A gallery in the editor: the server's markup of includes/sections/gallery.php (its
 * pictures are the block's own or the item's gallery field, chosen in the item's screen;
 * in an item page template's own screen, the field's name).
 */
import { ServerMarkup, SourceNote } from '../../editor/shared';

export default function Edit( { attributes } ) {
	return attributes.source ? (
		<SourceNote attributes={ attributes } widget="gallery" />
	) : (
		<ServerMarkup name="harlow/gallery" attributes={ attributes } />
	);
}
