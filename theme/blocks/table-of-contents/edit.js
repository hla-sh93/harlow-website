/**
 * A table of contents in the editor: includes/sections/table-of-contents.php, its list made
 * from the headings of the page being edited (as the page's script makes it from the
 * printed page), the title typed in place. Which headings, the container and the exclude
 * selectors, the marker, the hierarchy, the minimised box and the scroll offset are in the
 * sidebar.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Button,
	CheckboxControl,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { Fragment, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import {
	attributeProps,
	elementProps,
	iconHtml,
	IconPicker,
} from '../../editor/shared';
import metadata from './block.json';

const LEVELS = [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ];
const TAGS = [ ...LEVELS, 'div', 'span', 'p' ];

/**
 * The element's classes with the devices the box starts minimised on
 * (table-of-contents.php).
 *
 * @param {Object} attributes The block's attributes.
 * @param {string} minimized  The devices.
 * @return {string} The classes.
 */
function tocClasses( attributes, minimized ) {
	const own = ( attributes.classes || '' )
		.split( /\s+/ )
		.filter(
			( c ) => c && ! c.startsWith( 'elementor-toc--minimized-on-' )
		);
	const list = [
		...[
			'elementor-element',
			'elementor-widget',
			'elementor-widget-table-of-contents',
		].filter( ( c ) => ! own.includes( c ) ),
		...own,
	];
	if ( attributes.minimizeBox ) {
		list.push( `elementor-toc--minimized-on-${ minimized }` );
	}
	return list.join( ' ' );
}

/**
 * The headings as a tree: each under the last heading of a higher level before it.
 *
 * @param {Object[]} headings     The headings, with their level and text.
 * @param {boolean}  hierarchical Nested, or one flat list.
 * @return {Object[]} The top level, each with its children.
 */
function tree( headings, hierarchical ) {
	const root = { level: 0, children: [] };
	const stack = [ root ];
	headings.forEach( ( heading ) => {
		const node = { ...heading, children: [] };
		if ( hierarchical ) {
			while (
				stack.length > 1 &&
				stack[ stack.length - 1 ].level >= node.level
			) {
				stack.pop();
			}
		}
		stack[ hierarchical ? stack.length - 1 : 0 ].children.push( node );
		if ( hierarchical ) {
			stack.push( node );
		}
	} );
	return root.children;
}

/**
 * An icon's own svg element (no holder around it), as the page's script puts it in the list.
 *
 * @param {Object} props
 * @param {string} props.svg The icon's markup.
 */
function InlineIcon( { svg } ) {
	const parsed = useMemo( () => {
		const holder = document.createElement( 'template' );
		holder.innerHTML = svg;
		const el = holder.content.querySelector( 'svg' );
		if ( ! el ) {
			return null;
		}
		const attrs = {};
		[ ...el.attributes ].forEach( ( a ) => {
			attrs[ a.name ] = a.value;
		} );
		return { props: attributeProps( attrs ), inner: el.innerHTML };
	}, [ svg ] );
	return parsed ? (
		<svg
			{ ...parsed.props }
			dangerouslySetInnerHTML={ { __html: parsed.inner } }
		/>
	) : null;
}

/**
 * One level of the list, as the page's script writes it.
 *
 * @param {Object}   props
 * @param {Object[]} props.items   The headings of this level.
 * @param {boolean}  props.numbers Numbered, or bullets.
 * @param {string}   props.icon    The bullets' icon.
 * @param {boolean}  props.top     The top level.
 */
function List( { items, numbers, icon, top } ) {
	const Tag = numbers ? 'ol' : 'ul';
	return (
		<Tag className="elementor-toc__list-wrapper">
			{ items.map( ( item, index ) => (
				<li key={ index } className="elementor-toc__list-item">
					<div className="elementor-toc__list-item-text-wrapper">
						{ ! numbers && icon && <InlineIcon svg={ icon } /> }
						<a
							href={ `#${ item.anchor }` }
							className={
								'elementor-toc__list-item-text' +
								( top ? ' elementor-toc__top-level' : '' )
							}
							onClick={ ( event ) => event.preventDefault() }
						>
							{ item.text }
						</a>
					</div>
					{ item.children.length > 0 && (
						<List
							items={ item.children }
							numbers={ numbers }
							icon={ icon }
							top={ false }
						/>
					) }
				</li>
			) ) }
		</Tag>
	);
}

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		title,
		htmlTag,
		headingsTags,
		container,
		exclude,
		markerView,
		icon,
		hierarchical,
		collapseSubitems,
		minimizeBox,
		expandIcon,
		collapseIcon,
		minimizedOn,
		noHeadingsMessage,
		offset,
		element,
	} = attributes;
	const minimized = [ 'desktop', 'tablet', 'mobile' ].includes( minimizedOn )
		? minimizedOn
		: 'tablet';
	const tags = LEVELS.filter( ( t ) => ( headingsTags || [] ).includes( t ) );
	const Tag = TAGS.includes( htmlTag ) ? htmlTag : 'h4';
	const numbers = markerView !== 'bullets';

	// The headings of the page being edited (the theme's and WordPress's), in their order,
	// as text so the list is only made again when they change.
	const found = useSelect(
		( select ) => {
			const store = select( 'core/block-editor' );
			const out = [];
			store.getClientIdsWithDescendants().forEach( ( id ) => {
				if ( id === clientId ) {
					return;
				}
				const name = store.getBlockName( id );
				const attrs = store.getBlockAttributes( id ) || {};
				let level = '';
				let text = '';
				if ( name === 'harlow/heading' && ! attrs.source ) {
					level = attrs.tag;
					text = attrs.text;
				} else if ( name === 'core/heading' ) {
					level = `h${ attrs.level || 2 }`;
					text = attrs.content;
				}
				if ( LEVELS.includes( level ) ) {
					out.push( [ level, String( text || '' ) ] );
				}
			} );
			return JSON.stringify( out );
		},
		[ clientId ]
	);
	const items = useMemo( () => {
		const holder = document.createElement( 'div' );
		const headings = JSON.parse( found )
			.filter( ( [ level ] ) => tags.includes( level ) )
			.map( ( [ level, html ], index ) => {
				holder.innerHTML = html;
				return {
					level: Number( level.slice( 1 ) ),
					text: holder.textContent.trim(),
					anchor: `elementor-toc__heading-anchor-${ index }`,
				};
			} )
			.filter( ( heading ) => heading.text );
		return tree( headings, hierarchical );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ found, tags.join(), hierarchical ] );

	let settings = {};
	try {
		settings = JSON.parse( attributes.settings || '{}' ) || {};
	} catch {
		// Settings that are not JSON are left out.
	}
	const blockProps = useBlockProps(
		elementProps(
			{
				...attributes,
				classes: tocClasses( attributes, minimized ),
				settings: JSON.stringify( {
					...settings,
					headings_by_tags: tags.length ? tags : [ 'h2' ],
					container,
					exclude_headings_by_selector: exclude,
					marker_view: numbers ? 'numbers' : 'bullets',
					icon: { rendered_tag: icon },
					hierarchical_view: hierarchical ? 'yes' : '',
					collapse_subitems:
						hierarchical && collapseSubitems ? 'yes' : '',
					minimize_box: minimizeBox ? 'yes' : '',
					minimized_on: minimized,
					no_headings_message: noHeadingsMessage,
					scroll_offset: Math.max( 0, Number( offset ) || 0 ),
				} ),
			},
			'widget',
			'table-of-contents.default'
		)
	);
	const id = `elementor-toc__${ element }`;
	const toggleTag = ( level, on ) =>
		setAttributes( {
			headingsTags: LEVELS.filter( ( t ) =>
				t === level ? on : tags.includes( t )
			),
		} );
	const iconPanel = ( key, label ) => (
		<PanelBody title={ label } initialOpen={ false }>
			<IconPicker
				value={ attributes[ key ] }
				onChange={ ( value ) => setAttributes( { [ key ]: value } ) }
			/>
			<Button
				variant="link"
				disabled={
					attributes[ key ] === metadata.attributes[ key ].default
				}
				onClick={ () =>
					setAttributes( {
						[ key ]: metadata.attributes[ key ].default,
					} )
				}
			>
				{ __( 'Elementor’s icon', 'harlow' ) }
			</Button>
		</PanelBody>
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Table of Contents', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'HTML Tag', 'harlow' ) }
						value={ Tag }
						options={ TAGS.map( ( t ) => ( {
							value: t,
							label: t,
						} ) ) }
						onChange={ ( v ) => setAttributes( { htmlTag: v } ) }
					/>
					<p>{ __( 'Anchors by tags', 'harlow' ) }</p>
					{ LEVELS.map( ( level ) => (
						<CheckboxControl
							key={ level }
							__nextHasNoMarginBottom
							label={ level.toUpperCase() }
							checked={ tags.includes( level ) }
							onChange={ ( on ) => toggleTag( level, on ) }
						/>
					) ) }
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Container', 'harlow' ) }
						help={ __(
							'Only the headings inside this selector; the whole page when empty.',
							'harlow'
						) }
						value={ container }
						onChange={ ( v ) => setAttributes( { container: v } ) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Exclude by selector', 'harlow' ) }
						help={ __(
							'CSS selectors, in a comma-separated list.',
							'harlow'
						) }
						value={ exclude }
						onChange={ ( v ) => setAttributes( { exclude: v } ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Marker view', 'harlow' ) }
						value={ numbers ? 'numbers' : 'bullets' }
						options={ [
							{
								value: 'numbers',
								label: __( 'Numbers', 'harlow' ),
							},
							{
								value: 'bullets',
								label: __( 'Bullets', 'harlow' ),
							},
						] }
						onChange={ ( v ) => setAttributes( { markerView: v } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Hierarchical view', 'harlow' ) }
						checked={ !! hierarchical }
						onChange={ ( v ) =>
							setAttributes( { hierarchical: v } )
						}
					/>
					{ hierarchical && (
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Collapse subitems', 'harlow' ) }
							help={ __(
								'A heading’s subitems show when it is the one being read.',
								'harlow'
							) }
							checked={ !! collapseSubitems }
							onChange={ ( v ) =>
								setAttributes( { collapseSubitems: v } )
							}
						/>
					) }
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'No headings message', 'harlow' ) }
						value={ noHeadingsMessage }
						onChange={ ( v ) =>
							setAttributes( { noHeadingsMessage: v } )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						min={ 0 }
						label={ __( 'Smooth scroll offset (px)', 'harlow' ) }
						help={ __(
							'Space left above a heading scrolled to, for a fixed header.',
							'harlow'
						) }
						value={ offset }
						onChange={ ( v ) =>
							setAttributes( {
								offset: Math.max( 0, parseInt( v, 10 ) || 0 ),
							} )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Minimize box', 'harlow' ) }
					initialOpen={ false }
				>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Minimize box', 'harlow' ) }
						checked={ !! minimizeBox }
						onChange={ ( v ) =>
							setAttributes( { minimizeBox: v } )
						}
					/>
					{ minimizeBox && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Minimized on', 'harlow' ) }
							value={ minimized }
							options={ [
								{
									value: 'desktop',
									label: __(
										'Desktop (and every device)',
										'harlow'
									),
								},
								{
									value: 'tablet',
									label: __(
										'Tablet (and mobile)',
										'harlow'
									),
								},
								{
									value: 'mobile',
									label: __( 'Mobile', 'harlow' ),
								},
							] }
							onChange={ ( v ) =>
								setAttributes( { minimizedOn: v } )
							}
						/>
					) }
				</PanelBody>
				{ ! numbers &&
					iconPanel( 'icon', __( 'Bullet icon', 'harlow' ) ) }
				{ minimizeBox &&
					iconPanel( 'expandIcon', __( 'Expand icon', 'harlow' ) ) }
				{ minimizeBox &&
					iconPanel(
						'collapseIcon',
						__( 'Collapse icon', 'harlow' )
					) }
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<div className="elementor-toc__header" aria-controls={ id }>
						{ '\n' }
						<RichText
							tagName={ Tag }
							className="elementor-toc__header-title"
							value={ title }
							onChange={ ( v ) => setAttributes( { title: v } ) }
							placeholder={ __( 'Title', 'harlow' ) }
						/>
						{ minimizeBox &&
							[
								[ 'expand', expandIcon ],
								[ 'collapse', collapseIcon ],
							].map( ( [ kind, svg ] ) => (
								<Fragment key={ kind }>
									{ '\n' }
									<div
										className={ `elementor-toc__toggle-button elementor-toc__toggle-button--${ kind }` }
										role="button"
										tabIndex="0"
										aria-controls={ id }
										aria-expanded="true"
										dangerouslySetInnerHTML={ iconHtml(
											svg,
											false
										) }
									/>
								</Fragment>
							) ) }
						{ '\n' }
					</div>
					{ '\n' }
					<div
						id={ id }
						className={
							'elementor-toc__body' +
							( hierarchical && collapseSubitems
								? ' elementor-toc__list-items--collapsible'
								: '' )
						}
					>
						{ items.length ? (
							<List
								items={ items }
								numbers={ numbers }
								icon={ icon }
								top
							/>
						) : (
							<div className="elementor-toc__no-headings">
								{ noHeadingsMessage }
							</div>
						) }
					</div>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
