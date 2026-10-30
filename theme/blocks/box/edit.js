/**
 * A box in the editor: includes/sections/box.php, the paragraphs inside it as blocks.
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

import { PROSE } from '../text/edit';
import { attributeProps } from '../../editor/shared';

export default function Edit( { attributes } ) {
	const Tag = attributes.tag === 'section' ? 'section' : 'div';
	const blockProps = useBlockProps(
		attributeProps( attributes.htmlAttributes )
	);
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		templateLock: false,
		allowedBlocks: PROSE,
		defaultBlock: { name: 'core/paragraph' },
		directInsert: true,
	} );
	return <Tag { ...innerBlocksProps } />;
}
