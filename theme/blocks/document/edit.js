/**
 * The page's Elementor document in the editor: the element its sections are in, which the
 * page's own design rules are keyed on (includes/sections/document.php).
 */
import {
	InnerBlocks,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { parse } from '@wordpress/blocks';
import { useRefEffect } from '@wordpress/compose';
import { useRegistry, useSelect } from '@wordpress/data';

/**
 * Pasting copied elements (Copy in a block's menu, Ctrl+C) as Elementor pastes: after the
 * element chosen, or into it when it is an empty box (a new page's document, a new
 * container) or when they cannot stand beside it (a shared section beside a page's top
 * box). The editor alone replaces the element chosen with what is pasted, losing it, and
 * does nothing where they cannot stand beside it.
 *
 * @param {Object} registry The data registry.
 * @return {Function} The ref that listens on the canvas.
 */
function usePasteInside( registry ) {
	return useRefEffect(
		( node ) => {
			// The canvas, and the editor around it (an element chosen in List View).
			const views = [
				...new Set( [ node.ownerDocument.defaultView, window ] ),
			];
			const onPaste = ( event ) => {
				const editor = registry.select( blockEditorStore );
				const chosen = editor.getSelectedBlockClientIds();
				const text = event.clipboardData?.getData( 'text/plain' ) || '';
				const target = event.target;
				if (
					chosen.length !== 1 ||
					target?.isContentEditable ||
					[ 'INPUT', 'TEXTAREA', 'SELECT' ].includes(
						target?.tagName
					) ||
					! text.includes( '<!-- wp:' )
				) {
					return;
				}
				const blocks = parse( text ).filter( ( b ) => b.name );
				const box = chosen[ 0 ];
				const fits = ( root ) =>
					blocks.length &&
					blocks.every( ( b ) =>
						editor.canInsertBlockType( b.name, root )
					);
				const root = editor.getBlockRootClientId( box );
				const inside = fits( box );
				const beside = fits( root );
				const empty = ! editor.getBlockCount( box );
				let where = null;
				if ( inside && ( empty || ! beside ) ) {
					where = [ editor.getBlockCount( box ), box ];
				} else if ( beside ) {
					where = [ editor.getBlockIndex( box ) + 1, root ];
				}
				if ( where ) {
					event.preventDefault();
					event.stopImmediatePropagation();
					registry
						.dispatch( blockEditorStore )
						.insertBlocks( blocks, ...where );
				}
			};
			views.forEach( ( view ) =>
				view.addEventListener( 'paste', onPaste, true )
			);
			return () =>
				views.forEach( ( view ) =>
					view.removeEventListener( 'paste', onPaste, true )
				);
		},
		[ registry ]
	);
}

export default function Edit( { attributes, clientId } ) {
	const registry = useRegistry();
	const pasteInside = usePasteInside( registry );
	const { docType, docId, postType } = attributes;
	const { postId, empty } = useSelect(
		( select ) => ( {
			postId: select( 'core/editor' )?.getCurrentPostId(),
			empty: ! select( blockEditorStore ).getBlockCount( clientId ),
		} ),
		[ clientId ]
	);
	const id = docId || postId;
	const blockProps = useBlockProps( {
		ref: pasteInside,
		'data-elementor-type': docType,
		'data-elementor-id': id,
		className: `elementor elementor-${ id }`,
		'data-elementor-post-type': postType,
	} );
	// A new page's document starts empty, with a button to add its first section.
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		templateLock: false,
		allowedBlocks: [ 'harlow/container' ],
		renderAppender: empty ? InnerBlocks.ButtonBlockAppender : false,
	} );
	return <div { ...innerBlocksProps } />;
}
