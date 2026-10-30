/**
 * An accordion in the editor: includes/sections/accordion.php, its questions as blocks
 * (harlow/accordion-item); the open and closed icons in the sidebar.
 */
import {
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { elementProps, IconPicker } from '../../editor/shared';

export default function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'accordion.default' )
	);
	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'elementor-accordion' },
		{
			templateLock: false,
			allowedBlocks: [ 'harlow/accordion-item' ],
			defaultBlock: { name: 'harlow/accordion-item' },
			directInsert: true,
		}
	);
	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Icon of a closed question', 'harlow' ) }
					initialOpen={ false }
				>
					<IconPicker
						value={ attributes.iconClosed }
						onChange={ ( iconClosed ) =>
							setAttributes( { iconClosed } )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Icon of an open question', 'harlow' ) }
					initialOpen={ false }
				>
					<IconPicker
						value={ attributes.iconOpened }
						onChange={ ( iconOpened ) =>
							setAttributes( { iconOpened } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<div { ...innerBlocksProps } />
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
