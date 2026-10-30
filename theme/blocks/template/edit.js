/**
 * A saved template in the editor: includes/sections/template.php around its blocks (the
 * major clients section, shared by every page that shows it, or the header or footer).
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

import { elementProps } from '../../editor/shared';

export default function Edit( { attributes } ) {
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'template.default' )
	);
	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'elementor-template' },
		{
			templateLock: false,
			allowedBlocks: [ 'core/block', 'harlow/site-part' ],
		}
	);
	return (
		<div { ...blockProps }>
			{ '\n' }
			<div className="elementor-widget-container">
				{ '\n' }
				<div { ...innerBlocksProps }>
					{ '\n' }
					{ innerBlocksProps.children }
					{ '\n' }
				</div>
				{ '\n' }
			</div>
			{ '\n' }
		</div>
	);
}
