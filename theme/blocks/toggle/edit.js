/**
 * A toggle in the editor: includes/sections/toggle.php. As Elementor's editor shows it, the
 * first item is open; a click on another title opens it too, a click on an icon opens or
 * closes its item, so every content can be typed in place. The items, icons, title tag and
 * the FAQ schema are in the sidebar; a content holding its own paragraphs or lists is typed
 * as HTML there.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	SelectControl,
	TextareaControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { Fragment, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import ItemPanels from '../../editor/items';
import { elementProps, iconHtml, IconPicker } from '../../editor/shared';
import metadata from './block.json';

/** Markup that holds paragraphs or lists of its own. */
const BLOCKS = /<(p|ul|ol|h[1-6]|div|blockquote|table|figure)[\s>]/i;

const TAGS = [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ];

/**
 * The element's classes: the widget's own when it has none yet (toggle.php).
 *
 * @param {string} classes The block's classes.
 * @return {string} The classes.
 */
function toggleClasses( classes ) {
	const own = ( classes || '' ).split( /\s+/ ).filter( Boolean );
	return [
		...[
			'elementor-element',
			'elementor-widget',
			'elementor-widget-toggle',
		].filter( ( c ) => ! own.includes( c ) ),
		...own,
	].join( ' ' );
}

/**
 * An icon field with Elementor's own icon to go back to.
 *
 * @param {Object}   props
 * @param {string}   props.value    The icon.
 * @param {string}   props.initial  Elementor's icon.
 * @param {Function} props.onChange Called with the icon.
 */
function IconField( { value, initial, onChange } ) {
	return (
		<>
			<IconPicker allowNone value={ value } onChange={ onChange } />
			<Button
				variant="link"
				disabled={ value === initial }
				onClick={ () => onChange( initial ) }
			>
				{ __( 'Elementor’s caret', 'harlow' ) }
			</Button>
		</>
	);
}

export default function Edit( { attributes, setAttributes } ) {
	const {
		tabs,
		iconClosed,
		iconOpened,
		iconAlign,
		titleTag,
		faqSchema,
		element,
	} = attributes;
	const [ open, setOpen ] = useState( [ 0 ] );
	const blockProps = useBlockProps(
		elementProps(
			{ ...attributes, classes: toggleClasses( attributes.classes ) },
			'widget',
			'toggle.default'
		)
	);
	const Tag = TAGS.includes( titleTag ) ? titleTag : 'div';
	const id = String( parseInt( element, 16 ) || 0 ).slice( 0, 3 );
	const align = iconAlign === 'right' ? 'right' : 'left';
	const setTabs = ( next ) => setAttributes( { tabs: next } );
	const update = ( index, patch ) =>
		setTabs(
			tabs.map( ( tab, i ) =>
				i === index ? { ...tab, ...patch } : tab
			)
		);
	const flip = ( index ) =>
		setOpen(
			open.includes( index )
				? open.filter( ( i ) => i !== index )
				: [ ...open, index ]
		);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Toggle', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Title HTML tag', 'harlow' ) }
						value={ Tag }
						options={ TAGS.map( ( t ) => ( {
							value: t,
							label: t,
						} ) ) }
						onChange={ ( value ) =>
							setAttributes( { titleTag: value } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Icon alignment', 'harlow' ) }
						value={ align }
						options={ [
							{ value: 'left', label: __( 'Start', 'harlow' ) },
							{ value: 'right', label: __( 'End', 'harlow' ) },
						] }
						onChange={ ( value ) =>
							setAttributes( { iconAlign: value } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'FAQ schema', 'harlow' ) }
						help={ __(
							'Also prints the titles and contents as a FAQ page for search engines.',
							'harlow'
						) }
						checked={ !! faqSchema }
						onChange={ ( value ) =>
							setAttributes( { faqSchema: value } )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Icon', 'harlow' ) }
					initialOpen={ false }
				>
					<IconField
						value={ iconClosed }
						initial={ metadata.attributes.iconClosed.default }
						onChange={ ( value ) =>
							setAttributes( { iconClosed: value } )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Active icon', 'harlow' ) }
					initialOpen={ false }
				>
					<IconField
						value={ iconOpened }
						initial={ metadata.attributes.iconOpened.default }
						onChange={ ( value ) =>
							setAttributes( { iconOpened: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<ItemPanels
				items={ tabs }
				onChange={ setTabs }
				blank={ { title: __( 'Toggle', 'harlow' ), content: '' } }
				title={ ( n ) =>
					/* translators: %d: its number. */
					sprintf( __( 'Toggle %d', 'harlow' ), n )
				}
				addLabel={ __( 'Add a toggle', 'harlow' ) }
			>
				{ ( tab, change ) => (
					<>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Title', 'harlow' ) }
							value={ tab.title || '' }
							onChange={ ( title ) => change( { title } ) }
						/>
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Content (HTML)', 'harlow' ) }
							value={ tab.content || '' }
							onChange={ ( content ) => change( { content } ) }
						/>
					</>
				) }
			</ItemPanels>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<div className="elementor-toggle">
						{ tabs.map( ( tab, index ) => {
							const shown = open.includes( index );
							const content = tab.content || '';
							const contentProps = {
								id: `elementor-tab-content-${ id }${ index + 1 }`,
								className:
									'elementor-tab-content elementor-clearfix' +
									( shown ? ' elementor-active' : '' ),
								'data-tab': index + 1,
								role: 'region',
								'aria-labelledby': `elementor-tab-title-${ id }${
									index + 1
								}`,
								style: { display: shown ? 'block' : 'none' },
							};
							return (
								<Fragment key={ index }>
									{ '\n' }
									<div className="elementor-toggle-item">
										{ '\n' }
										<Tag
											id={ `elementor-tab-title-${ id }${
												index + 1
											}` }
											className={
												'elementor-tab-title' +
												( shown
													? ' elementor-active'
													: '' )
											}
											data-tab={ index + 1 }
											role="button"
											aria-controls={ `elementor-tab-content-${ id }${
												index + 1
											}` }
											aria-expanded={
												shown ? 'true' : 'false'
											}
											onClick={ () =>
												! shown &&
												setOpen( [ ...open, index ] )
											}
										>
											{ '\n' }
											{ ( iconClosed || iconOpened ) && (
												<>
													<span
														className={ `elementor-toggle-icon elementor-toggle-icon-${ align }` }
														aria-hidden="true"
														onClick={ ( event ) => {
															event.stopPropagation();
															flip( index );
														} }
													>
														{ '\n' }
														<span
															className="elementor-toggle-icon-closed"
															dangerouslySetInnerHTML={ iconHtml(
																iconClosed,
																false
															) }
														/>
														{ '\n' }
														<span
															className="elementor-toggle-icon-opened"
															dangerouslySetInnerHTML={ iconHtml(
																iconOpened,
																false
															) }
														/>
														{ '\n' }
													</span>
													{ '\n' }
												</>
											) }
											<RichText
												tagName="a"
												className="elementor-toggle-title"
												tabIndex={ 0 }
												value={ tab.title || '' }
												onChange={ ( title ) =>
													update( index, { title } )
												}
												placeholder={ __(
													'Title',
													'harlow'
												) }
												withoutInteractiveFormatting
											/>
											{ '\n' }
										</Tag>
										{ '\n' }
										{ BLOCKS.test( content ) ? (
											<div
												{ ...contentProps }
												dangerouslySetInnerHTML={ {
													__html: content,
												} }
											/>
										) : (
											<div { ...contentProps }>
												<RichText
													tagName="p"
													value={ content }
													onChange={ ( value ) =>
														update( index, {
															content: value,
														} )
													}
													placeholder={ __(
														'Content',
														'harlow'
													) }
												/>
											</div>
										) }
										{ '\n' }
									</div>
								</Fragment>
							);
						} ) }
						{ '\n' }
					</div>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
