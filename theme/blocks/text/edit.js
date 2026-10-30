/**
 * A text in the editor: includes/sections/text.php, its paragraphs and lists as blocks.
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

import { elementProps } from '../../editor/shared';

export const PROSE = [
	'core/paragraph',
	'core/list',
	'harlow/box',
	'harlow/markup',
];

export default function Edit( { attributes } ) {
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'text-editor.default' )
	);
	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'elementor-widget-container' },
		{
			templateLock: false,
			allowedBlocks: PROSE,
			defaultBlock: { name: 'core/paragraph' },
			directInsert: true,
		}
	);
	return (
		<div { ...blockProps }>
			{ '\n' }
			<div { ...innerBlocksProps } />
			{ '\n' }
		</div>
	);
}
