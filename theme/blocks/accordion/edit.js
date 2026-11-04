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
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import { elementProps, IconPicker } from '../../editor/shared';

export default function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'accordion.default' )
	);
	// A new accordion comes with two questions to write over, as Elementor's does (an empty
	// one draws nothing); an accordion that has its questions keeps them.
	const template = useMemo( () => {
		const base = 1000 + Math.floor( Math.random() * 8000 );
		return [ 1, 2 ].map( ( n ) => [
			'harlow/accordion-item',
			{
				tab: n,
				itemId: base + n,
				/* translators: %d: the question's number. */
				title: sprintf( __( 'Accordion #%d', 'harlow' ), n ),
				expanded: n === 1 ? 'true' : 'false',
			},
			[
				[
					'core/paragraph',
					{ content: __( 'The answer, to write over.', 'harlow' ) },
				],
			],
		] );
	}, [] );
	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'elementor-accordion' },
		{
			templateLock: false,
			allowedBlocks: [ 'harlow/accordion-item' ],
			defaultBlock: { name: 'harlow/accordion-item' },
			directInsert: true,
			template,
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
