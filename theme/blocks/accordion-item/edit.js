/**
 * A question in the editor: includes/sections/accordion-item.php. As on the page, the
 * first question is open; selecting another question (or anything in its answer) opens it
 * instead, so every answer can be edited.
 */
import {
	RichText,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { PROSE } from '../text/edit';
import { iconHtml, styleObject } from '../../editor/shared';

export default function Edit( {
	attributes,
	setAttributes,
	context,
	clientId,
} ) {
	const {
		tab,
		itemId,
		title,
		expanded,
		titleClass,
		contentClass,
		contentStyle,
	} = attributes;
	const { open, index } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const siblings = editor.getBlockOrder(
				editor.getBlockRootClientId( clientId )
			);
			const selected = siblings.find(
				( id ) =>
					editor.isBlockSelected( id ) ||
					editor.hasSelectedInnerBlock( id, true )
			);
			return {
				open: selected
					? selected === clientId
					: siblings[ 0 ] === clientId,
				index: siblings.indexOf( clientId ),
			};
		},
		[ clientId ]
	);
	// A question added in the editor gets an id of its own for its title and answer.
	useEffect( () => {
		if ( ! itemId ) {
			setAttributes( {
				itemId: Date.now() % 1000000000,
				tab: index + 1,
			} );
		}
	}, [ itemId, index, setAttributes ] );

	const blockProps = useBlockProps( {
		className: 'elementor-accordion-item',
	} );
	const innerBlocksProps = useInnerBlocksProps(
		{
			id: `elementor-tab-content-${ itemId }`,
			className: contentClass + ( open ? ' elementor-active' : '' ),
			'data-tab': tab,
			role: 'region',
			'aria-labelledby': `elementor-tab-title-${ itemId }`,
			style: {
				...styleObject( contentStyle ),
				display: open ? 'block' : 'none',
			},
		},
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
			<div
				id={ `elementor-tab-title-${ itemId }` }
				className={ titleClass + ( open ? ' elementor-active' : '' ) }
				data-tab={ tab }
				role="button"
				aria-controls={ `elementor-tab-content-${ itemId }` }
				aria-expanded={ open ? 'true' : expanded }
			>
				{ '\n' }
				<span
					className="elementor-accordion-icon elementor-accordion-icon-left"
					aria-hidden="true"
				>
					{ '\n' }
					<span
						className="elementor-accordion-icon-closed"
						dangerouslySetInnerHTML={ iconHtml(
							context[ 'harlow/iconClosed' ] || '',
							false
						) }
					/>
					{ '\n' }
					<span
						className="elementor-accordion-icon-opened"
						dangerouslySetInnerHTML={ iconHtml(
							context[ 'harlow/iconOpened' ] || '',
							false
						) }
					/>
					{ '\n' }
				</span>
				{ '\n' }
				<RichText
					tagName="a"
					className="elementor-accordion-title"
					tabIndex={ 0 }
					value={ title }
					onChange={ ( value ) => setAttributes( { title: value } ) }
					placeholder={ __( 'Question', 'harlow' ) }
					withoutInteractiveFormatting
				/>
				{ '\n' }
			</div>
			{ '\n' }
			<div { ...innerBlocksProps } />
			{ '\n' }
		</div>
	);
}
