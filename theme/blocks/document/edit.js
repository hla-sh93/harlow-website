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
import { useSelect } from '@wordpress/data';

export default function Edit( { attributes, clientId } ) {
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
