/**
 * An icon list in the editor: includes/sections/icon-list.php, each line's words typed in
 * place, its link and icon in the sidebar.
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import ItemPanels from '../../editor/items';
import {
	elementProps,
	iconHtml,
	IconPicker,
	LinkFields,
	linkUrl,
} from '../../editor/shared';

export default function Edit( { attributes, setAttributes } ) {
	const { inline, items } = attributes;
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'icon-list.default' )
	);
	const setItems = ( next ) => setAttributes( { items: next } );
	const update = ( index, patch ) =>
		setItems(
			items.map( ( item, i ) =>
				i === index ? { ...item, ...patch } : item
			)
		);
	return (
		<>
			<ItemPanels
				items={ items }
				onChange={ setItems }
				blank={ { text: '' } }
			>
				{ ( item, change ) => (
					<>
						<LinkFields value={ item } onChange={ change } />
						<IconPicker
							allowNone
							value={ item.icon || '' }
							onChange={ ( icon ) => change( { icon } ) }
						/>
					</>
				) }
			</ItemPanels>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<ul
						className={
							'elementor-icon-list-items' +
							( inline ? ' elementor-inline-items' : '' )
						}
					>
						{ items.map( ( item, index ) => {
							const parts = (
								<>
									{ item.icon && (
										<>
											<span
												className="elementor-icon-list-icon"
												dangerouslySetInnerHTML={ iconHtml(
													item.icon
												) }
											/>
											{ '\n' }
										</>
									) }
									<RichText
										tagName="span"
										className="elementor-icon-list-text"
										value={ item.text || '' }
										onChange={ ( text ) =>
											update( index, { text } )
										}
										placeholder={ __( 'Line', 'harlow' ) }
										withoutInteractiveFormatting
									/>
								</>
							);
							return (
								<Fragment key={ index }>
									{ '\n' }
									<li
										className={
											'elementor-icon-list-item' +
											( inline
												? ' elementor-inline-item'
												: '' )
										}
									>
										{ '\n' }
										{ item.link ? (
											<a
												href={ linkUrl( item.link ) }
												target={
													item.linkTarget || undefined
												}
												rel={
													item.linkRel || undefined
												}
												onClick={ ( event ) =>
													event.preventDefault()
												}
											>
												{ '\n\n' }
												{ parts }
												{ '\n' }
											</a>
										) : (
											parts
										) }
										{ '\n' }
									</li>
								</Fragment>
							);
						} ) }
						{ '\n' }
					</ul>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
