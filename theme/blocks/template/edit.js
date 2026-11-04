/**
 * A saved template in the editor: includes/sections/template.php around its blocks (the
 * major clients section, shared by every page that shows it, or the header or footer).
 * A new one shows where it is and the button to choose its shared section.
 */
import {
	InnerBlocks,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { elementProps } from '../../editor/shared';

export default function Edit( { attributes, clientId } ) {
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'template.default' )
	);
	const empty = useSelect(
		( select ) => ! select( 'core/block-editor' ).getBlockCount( clientId ),
		[ clientId ]
	);
	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'elementor-template' },
		{
			templateLock: false,
			allowedBlocks: [ 'core/block', 'harlow/site-part' ],
			renderAppender: empty ? InnerBlocks.ButtonBlockAppender : false,
		}
	);
	return (
		<div { ...blockProps }>
			{ '\n' }
			<div className="elementor-widget-container">
				{ '\n' }
				{ empty && (
					<p className="harlow-source-note">
						{ __(
							'[A shared section: choose one of the synced patterns]',
							'harlow'
						) }
					</p>
				) }
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
