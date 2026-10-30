/**
 * Social icons in the editor: includes/sections/social-icons.php; each icon's link, name
 * for screen readers and picture in the sidebar.
 */
import { useBlockProps } from '@wordpress/block-editor';
import { TextControl } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { escapeHTML } from '@wordpress/escape-html';
import { __ } from '@wordpress/i18n';

import ItemPanels from '../../editor/items';
import {
	elementProps,
	IconPicker,
	LinkFields,
	linkUrl,
} from '../../editor/shared';

export default function Edit( { attributes, setAttributes } ) {
	const { items } = attributes;
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'social-icons.default' )
	);
	return (
		<>
			<ItemPanels
				items={ items }
				onChange={ ( next ) => setAttributes( { items: next } ) }
				blank={ { label: '', link: '' } }
			>
				{ ( item, change ) => (
					<>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Name for screen readers', 'harlow' ) }
							value={ item.label || '' }
							onChange={ ( label ) => change( { label } ) }
						/>
						<LinkFields value={ item } onChange={ change } />
						<IconPicker
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
					<div
						className="elementor-social-icons-wrapper elementor-grid"
						role="list"
					>
						{ items.map( ( item, index ) => (
							<Fragment key={ index }>
								{ '\n' }
								<span
									className="elementor-grid-item"
									role="listitem"
								>
									{ '\n' }
									<a
										className={
											item.linkClass || undefined
										}
										href={ linkUrl( item.link || '' ) }
										target={ item.linkTarget || undefined }
										rel={ item.linkRel || undefined }
										onClick={ ( event ) =>
											event.preventDefault()
										}
										dangerouslySetInnerHTML={ {
											__html:
												'\n<span class="elementor-screen-only">' +
												escapeHTML( item.label || '' ) +
												'</span>\n' +
												( item.icon || '' ) +
												'\n',
										} }
									/>
									{ '\n' }
								</span>
							</Fragment>
						) ) }
						{ '\n' }
					</div>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
