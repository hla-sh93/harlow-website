/**
 * Tabs in the editor: includes/sections/tabs.php. As on the page the first tab is open; a
 * click on another title opens it, so every tab's words can be typed in place. The list of
 * tabs, the layout and the titles' alignment are in the sidebar; a content holding its own
 * paragraphs or lists is typed as HTML there.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextareaControl,
	TextControl,
} from '@wordpress/components';
import { Fragment, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import ItemPanels from '../../editor/items';
import { elementProps } from '../../editor/shared';

/** Markup that holds paragraphs or lists of its own. */
const BLOCKS = /<(p|ul|ol|h[1-6]|div|blockquote|table|figure)[\s>]/i;

/**
 * The element's classes with the layout and alignment, as tabs.php writes them.
 *
 * @param {Object} attributes The block's attributes.
 * @return {string} The classes.
 */
function tabsClasses( attributes ) {
	const own = ( attributes.classes || '' )
		.split( /\s+/ )
		.filter(
			( c ) => c && ! /^elementor-tabs-(view|alignment)-/.test( c )
		);
	const base = [
		'elementor-element',
		'elementor-widget',
		'elementor-widget-tabs',
	].filter( ( c ) => ! own.includes( c ) );
	const list = [
		...base,
		...own,
		`elementor-tabs-view-${
			attributes.type === 'vertical' ? 'vertical' : 'horizontal'
		}`,
	];
	if ( [ 'center', 'end', 'stretch' ].includes( attributes.align ) ) {
		list.push( `elementor-tabs-alignment-${ attributes.align }` );
	}
	return list.join( ' ' );
}

export default function Edit( { attributes, setAttributes } ) {
	const { tabs, type, align, element } = attributes;
	const [ active, setActive ] = useState( 0 );
	const open = Math.min( active, Math.max( tabs.length - 1, 0 ) );
	const blockProps = useBlockProps(
		elementProps(
			{ ...attributes, classes: tabsClasses( attributes ) },
			'widget',
			'tabs.default'
		)
	);
	const id = String( parseInt( element, 16 ) || 0 ).slice( 0, 3 );
	const setTabs = ( next ) => setAttributes( { tabs: next } );
	const update = ( index, patch ) =>
		setTabs(
			tabs.map( ( tab, i ) =>
				i === index ? { ...tab, ...patch } : tab
			)
		);
	const titleProps = ( index ) => ( {
		'aria-selected': index === open ? 'true' : 'false',
		'data-tab': index + 1,
		role: 'tab',
		tabIndex: index === open ? '0' : '-1',
		'aria-controls': `elementor-tab-content-${ id }${ index + 1 }`,
		'aria-expanded': 'false',
		onClick: () => setActive( index ),
	} );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Tabs', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Type', 'harlow' ) }
						value={ type }
						options={ [
							{
								value: 'horizontal',
								label: __( 'Horizontal', 'harlow' ),
							},
							{
								value: 'vertical',
								label: __( 'Vertical', 'harlow' ),
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { type: value } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Alignment', 'harlow' ) }
						value={ align }
						options={ [
							{ value: '', label: __( 'Start', 'harlow' ) },
							{
								value: 'center',
								label: __( 'Center', 'harlow' ),
							},
							{ value: 'end', label: __( 'End', 'harlow' ) },
							{
								value: 'stretch',
								label: __( 'Justified', 'harlow' ),
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { align: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<ItemPanels
				items={ tabs }
				onChange={ setTabs }
				blank={ { title: __( 'Tab', 'harlow' ), content: '' } }
				title={ ( n ) =>
					/* translators: %d: its number. */
					sprintf( __( 'Tab %d', 'harlow' ), n )
				}
				addLabel={ __( 'Add a tab', 'harlow' ) }
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
							help={ __(
								'Typed in place on the page too; here for paragraphs and lists.',
								'harlow'
							) }
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
					<div className="elementor-tabs">
						{ '\n' }
						<div className="elementor-tabs-wrapper" role="tablist">
							{ tabs.map( ( tab, index ) => (
								<Fragment key={ index }>
									{ '\n' }
									<RichText
										tagName="div"
										id={ `elementor-tab-title-${ id }${
											index + 1
										}` }
										className={
											'elementor-tab-title elementor-tab-desktop-title' +
											( index === open
												? ' elementor-active'
												: '' )
										}
										{ ...titleProps( index ) }
										value={ tab.title || '' }
										onChange={ ( title ) =>
											update( index, { title } )
										}
										placeholder={ __( 'Title', 'harlow' ) }
										allowedFormats={ [
											'core/bold',
											'core/italic',
										] }
									/>
								</Fragment>
							) ) }
							{ '\n' }
						</div>
						{ '\n' }
						<div
							className="elementor-tabs-content-wrapper"
							role="tablist"
							aria-orientation="vertical"
						>
							{ tabs.map( ( tab, index ) => {
								const content = tab.content || '';
								const shown = index === open;
								const contentProps = {
									id: `elementor-tab-content-${ id }${
										index + 1
									}`,
									className:
										'elementor-tab-content elementor-clearfix' +
										( shown ? ' elementor-active' : '' ),
									'data-tab': index + 1,
									role: 'tabpanel',
									'aria-labelledby': `elementor-tab-title-${ id }${
										index + 1
									}`,
									tabIndex: '0',
									hidden: ! shown,
									style: {
										display: shown ? 'block' : 'none',
									},
								};
								return (
									<Fragment key={ index }>
										{ '\n' }
										<div
											className={
												'elementor-tab-title elementor-tab-mobile-title' +
												( shown
													? ' elementor-active'
													: '' )
											}
											{ ...titleProps( index ) }
											dangerouslySetInnerHTML={ {
												__html: tab.title || '',
											} }
										/>
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
									</Fragment>
								);
							} ) }
							{ '\n' }
						</div>
						{ '\n' }
					</div>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
