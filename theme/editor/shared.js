/**
 * What the blocks' edit views share: an element's attributes as Elementor writes them,
 * readable links made addresses, the site's icons, the link and picture panels, and the
 * server's markup for the blocks whose words live elsewhere (menus, lists, header, footer).
 */
import apiFetch from '@wordpress/api-fetch';
import {
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Button,
	ComboboxControl,
	PanelBody,
	SearchControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { getBlockTypes } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import {
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

import icons from './icons.json';

const site = window.harlowEditor || { themeUri: '', pages: {} };

/** What a container holds: containers and Elementor's widgets, not WordPress's own blocks. */
/** The theme's blocks that are not put in a container by hand (parts of other blocks). */
const NOT_IN_CONTAINER = [
	'harlow/document',
	'harlow/accordion-item',
	'harlow/box',
	'harlow/markup',
];

/**
 * The blocks a container takes: every element block of the theme (a new widget's folder is
 * enough to be one).
 *
 * @return {string[]} Block names.
 */
export function inContainer() {
	return getBlockTypes()
		.map( ( type ) => type.name )
		.filter(
			( name ) =>
				name.startsWith( 'harlow/' ) &&
				! NOT_IN_CONTAINER.includes( name )
		);
}

/**
 * The element's classes with one class of a group (a view, a shape, a number of columns):
 * the group's others taken off, the one chosen put on ('' for none).
 *
 * @param {string}   classes The element's classes.
 * @param {string[]} group   The group's classes.
 * @param {string}   chosen  The class chosen, or ''.
 * @return {string} The classes.
 */
export function withClass( classes, group, chosen ) {
	const list = ( classes || '' )
		.split( /\s+/ )
		.filter( ( c ) => c && ! group.includes( c ) );
	if ( chosen ) {
		list.push( chosen );
	}
	return list.join( ' ' );
}

/**
 * The class of a group the element wears, or ''.
 *
 * @param {string}   classes The element's classes.
 * @param {string[]} group   The group's classes.
 * @return {string} The class.
 */
export function classOf( classes, group ) {
	return (
		( classes || '' ).split( /\s+/ ).find( ( c ) => group.includes( c ) ) ||
		''
	);
}

/**
 * The attributes of an element as Elementor writes them (harlow_element_attributes()).
 *
 * @param {Object} attributes The block's attributes.
 * @param {string} kind       'container' or 'widget'.
 * @param {string} widget     The widget type, for a widget.
 * @return {Object} Props for the element.
 */
export function elementProps( attributes, kind, widget = '' ) {
	// The owner's classes (the Styles tab's Advanced) join the element's.
	const extra =
		typeof attributes.style?.classes === 'string'
			? attributes.style.classes.trim()
			: '';
	const props = {
		className: extra
			? `${ attributes.classes } ${ extra }`
			: attributes.classes,
		'data-id': attributes.element,
		'data-element_type': kind,
		'data-e-type': kind,
	};
	// The editor keeps a block's id for itself; the page's is kept here (editor/canvas.css).
	if ( attributes.htmlId ) {
		props[ 'data-html-id' ] = attributes.htmlId;
	}
	if ( attributes.settings ) {
		props[ 'data-settings' ] = attributes.settings;
	}
	if ( widget ) {
		props[ 'data-widget_type' ] = widget;
	}
	// Motion effects and sticky, as harlow_style_motion() hands them to the page's script
	// (which the canvas does not run).
	const motion = attributes.style?.motion || {};
	if (
		motion.sticky?.on ||
		Object.values( motion.scroll || {} ).some( ( fx ) => fx?.on ) ||
		Object.values( motion.mouse || {} ).some( ( fx ) => fx?.on )
	) {
		props[ 'data-harlow-motion' ] = JSON.stringify( motion );
	}
	// The owner's custom attributes (key|value lines), as harlow_style_attributes() prints them.
	const custom =
		typeof attributes.style?.attributes === 'string'
			? attributes.style.attributes
			: '';
	const reserved = [
		'style',
		'class',
		'id',
		'data-id',
		'data-settings',
		'data-element_type',
		'data-e-type',
		'data-widget_type',
	];
	for ( const line of custom.split( /\r?\n/ ) ) {
		const [ rawName, ...rest ] = line.split( '|' );
		const name = ( rawName || '' ).trim().toLowerCase();
		if (
			/^[a-z][a-z0-9_:.-]*$/.test( name ) &&
			! name.startsWith( 'on' ) &&
			! reserved.includes( name )
		) {
			props[ name ] = rest.join( '|' ).trim();
		}
	}
	return props;
}

/**
 * A link as blocks write it, as an address (harlow_link_url()).
 *
 * @param {string} link The link as written.
 * @return {string} The address.
 */
export function linkUrl( link ) {
	if ( ! link || /^([a-z][a-z0-9+.-]*:|\/|#|\?)/i.test( link ) ) {
		return link;
	}
	if ( link.startsWith( 'assets/' ) ) {
		return `${ site.themeUri }/${ link }`;
	}
	const m = link.match( /^([\w-]+)\.html(#.*)?$/ );
	if ( m && site.pages[ m[ 1 ] ] ) {
		return site.pages[ m[ 1 ] ] + ( m[ 2 ] || '' );
	}
	return link;
}

/**
 * The readable links of a piece of markup as addresses (harlow_resolve_links()).
 *
 * @param {string} html Markup.
 * @return {string} The markup with its links resolved.
 */
export function resolveLinks( html ) {
	if (
		! html ||
		( ! html.includes( '.html' ) && ! html.includes( 'assets/' ) )
	) {
		return html;
	}
	const holder = document.createElement( 'template' );
	holder.innerHTML = html;
	holder.content.querySelectorAll( '*' ).forEach( ( el ) => {
		[ 'href', 'src', 'poster' ].forEach( ( name ) => {
			if ( el.hasAttribute( name ) ) {
				el.setAttribute( name, linkUrl( el.getAttribute( name ) ) );
			}
		} );
		const style = el.getAttribute( 'style' );
		if ( style && style.includes( 'assets/' ) ) {
			el.setAttribute(
				'style',
				style.replace(
					/url\((["']?)(assets\/[^)"']+)\1\)/g,
					( all, quote, path ) =>
						`url(${ quote }${ linkUrl( path ) }${ quote })`
				)
			);
		}
	} );
	return holder.innerHTML;
}

/**
 * An inline style as React's style object.
 *
 * @param {string} style The style attribute.
 * @return {Object} The style object.
 */
export function styleObject( style ) {
	const out = {};
	( style || '' ).split( ';' ).forEach( ( part ) => {
		const at = part.indexOf( ':' );
		if ( at < 1 ) {
			return;
		}
		const name = part.slice( 0, at ).trim();
		const key = name.startsWith( '--' )
			? name
			: name.replace( /-([a-z])/g, ( all, c ) => c.toUpperCase() );
		out[ key ] = part.slice( at + 1 ).trim();
	} );
	return out;
}

/**
 * HTML attributes as React props: class as className, style as an object.
 *
 * @param {Object} attrs Attribute names and values.
 * @return {Object} Props.
 */
export function attributeProps( attrs ) {
	const props = {};
	Object.entries( attrs || {} ).forEach( ( [ name, value ] ) => {
		if ( name === 'class' ) {
			props.className = value;
		} else if ( name === 'style' ) {
			props.style = styleObject( value );
		} else if ( name === 'tabindex' ) {
			props.tabIndex = value;
		} else {
			props[ name ] = value;
		}
	} );
	return props;
}

/**
 * An icon's markup inside its holder, with the line breaks the page prints around it.
 *
 * @param {string}  svg    The icon's markup.
 * @param {boolean} spaced Line breaks before and after, as the page has them.
 * @return {Object} dangerouslySetInnerHTML prop.
 */
export function iconHtml( svg, spaced = true ) {
	return { __html: spaced ? `\n${ svg }\n` : svg };
}

/** The icon library (editor/icon-library.json), loaded once when it is first shown. */
let library = null;

/**
 * An uploaded SVG file's icon: its <svg> alone, with the classes an icon has (the page
 * cleans it again when it prints it: harlow_icon()).
 *
 * @param {string} text The file's text.
 * @return {string} The icon's markup, or '' when the file holds none.
 */
function uploadedIcon( text ) {
	const doc = new window.DOMParser().parseFromString( text, 'image/svg+xml' );
	const svg = doc.querySelector( 'svg' );
	if ( ! svg ) {
		return '';
	}
	svg.querySelectorAll( 'script, foreignObject, style' ).forEach( ( el ) =>
		el.remove()
	);
	svg.setAttribute( 'aria-hidden', 'true' );
	svg.setAttribute( 'class', 'e-font-icon-svg e-custom-icon' );
	svg.removeAttribute( 'width' );
	svg.removeAttribute( 'height' );
	return new window.XMLSerializer()
		.serializeToString( svg )
		.replace( /\s+/g, ' ' );
}

/**
 * Choose an icon, as Elementor's icon library offers them: the site's own icons, the icon
 * library (searchable), or an SVG file uploaded to the Media Library.
 *
 * @param {Object}   props
 * @param {string}   props.value     The icon chosen.
 * @param {Function} props.onChange  Called with the new icon's markup.
 * @param {boolean}  props.allowNone Offer "no icon".
 * @param {string}   props.noneLabel What "no icon" is called, when it is something else.
 */
export function IconPicker( {
	value,
	onChange,
	allowNone = false,
	noneLabel,
} ) {
	const [ tab, setTab ] = useState( 'site' );
	const [ search, setSearch ] = useState( '' );
	const [ shown, setShown ] = useState( library );
	useEffect( () => {
		if ( tab !== 'library' || library ) {
			return;
		}
		window
			.fetch( `${ site.themeUri }/editor/icon-library.json` )
			.then( ( response ) => response.json() )
			.then( ( list ) => {
				library = list;
				setShown( list );
			} )
			.catch( () => setShown( [] ) );
	}, [ tab ] );
	const words = search.trim().toLowerCase();
	const found = ( shown || [] )
		.filter( ( icon ) => ! words || icon.name.includes( words ) )
		.slice( 0, 120 );
	const button = ( svg, label, key ) => (
		<Button
			key={ key }
			className="harlow-icon-picker__icon"
			isPressed={ svg === value }
			label={ label }
			showTooltip
			onClick={ () => onChange( svg ) }
		>
			<span dangerouslySetInnerHTML={ { __html: svg } } />
		</Button>
	);
	return (
		<div className="harlow-icon-picker">
			<div className="harlow-icon-picker__tabs" role="tablist">
				{ [
					[ 'site', __( 'The site’s icons', 'harlow' ) ],
					[ 'library', __( 'Icon library', 'harlow' ) ],
					[ 'upload', __( 'Upload SVG', 'harlow' ) ],
				].map( ( [ key, label ] ) => (
					<Button
						key={ key }
						role="tab"
						aria-selected={ tab === key }
						isPressed={ tab === key }
						variant="tertiary"
						size="compact"
						onClick={ () => setTab( key ) }
					>
						{ label }
					</Button>
				) ) }
			</div>
			{ allowNone && (
				<Button
					variant={ value ? 'secondary' : 'primary' }
					onClick={ () => onChange( '' ) }
				>
					{ noneLabel || __( 'No icon', 'harlow' ) }
				</Button>
			) }
			{ tab === 'site' &&
				icons.map( ( svg, i ) =>
					button( svg, `${ __( 'Icon', 'harlow' ) } ${ i + 1 }`, i )
				) }
			{ tab === 'library' && (
				<>
					<SearchControl
						__nextHasNoMarginBottom
						label={ __( 'Search the icons', 'harlow' ) }
						value={ search }
						onChange={ setSearch }
					/>
					{ shown === null && (
						<p>{ __( 'Loading the icons…', 'harlow' ) }</p>
					) }
					<div className="harlow-icon-picker__grid">
						{ found.map( ( icon ) =>
							button( icon.svg, icon.name, icon.name )
						) }
					</div>
				</>
			) }
			{ tab === 'upload' && (
				<MediaUploadCheck>
					<MediaUpload
						allowedTypes={ [ 'image/svg+xml' ] }
						onSelect={ ( picked ) =>
							window
								.fetch( picked.url )
								.then( ( response ) => response.text() )
								.then( ( text ) => {
									const svg = uploadedIcon( text );
									if ( svg ) {
										onChange( svg );
									}
								} )
						}
						render={ ( { open } ) => (
							<Button variant="secondary" onClick={ open }>
								{ __(
									'Choose or upload an SVG file',
									'harlow'
								) }
							</Button>
						) }
					/>
				</MediaUploadCheck>
			) }
		</div>
	);
}

/** The fields of an item that a block of an item page template shows (its `source`). */
const SOURCES = {
	title: __( 'The item’s title', 'harlow' ),
	date: __( 'The item’s date', 'harlow' ),
	featured: __( 'The item’s featured picture', 'harlow' ),
	'meta:harlow_summary': __( 'The project’s short description', 'harlow' ),
	'meta:harlow_year': __( 'The project’s year', 'harlow' ),
	'meta:harlow_gallery': __( 'The item’s pictures', 'harlow' ),
};

/**
 * The name of the item's field a block shows, as the block shows it in an item page
 * template's own screen, where there is no item.
 *
 * @param {string} source The block's source.
 * @return {string} The field's name, in brackets.
 */
export function sourceLabel( source ) {
	return `[${ SOURCES[ source ] || source }]`;
}

/**
 * A widget that shows a field of the item (a picture, the pictures), in an item page
 * template's own screen: the field's name in its place.
 *
 * @param {Object} props
 * @param {Object} props.attributes The block's attributes.
 * @param {string} props.widget     The widget type, when the block has none of its own.
 */
export function SourceNote( { attributes, widget } ) {
	const blockProps = useBlockProps(
		elementProps(
			attributes,
			'widget',
			attributes.widgetType || `${ widget }.default`
		)
	);
	return (
		<div { ...blockProps }>
			<div className="elementor-widget-container">
				<p className="harlow-source-note">
					{ sourceLabel( attributes.source ) }
				</p>
			</div>
		</div>
	);
}

/**
 * The addresses of pictures picked in this editor, by id: a picture draws as soon as it is
 * picked, before its record arrives from the REST API (a few seconds).
 */
export const PICKED = {};

/**
 * Note pictures picked from the Media Library (what MediaUpload's onSelect gives).
 *
 * @param {Object|Object[]} picked The picture or pictures.
 */
export function notePicked( picked ) {
	for ( const p of [].concat( picked || [] ) ) {
		if ( p?.id && p.url ) {
			PICKED[ p.id ] = p.url;
		}
	}
}

/**
 * A picture of the Media Library, by its id: its address, or '' (none chosen, or not
 * loaded yet).
 *
 * @param {number} id The picture.
 * @return {string} Its address (the full size, as harlow_picture_style() prints it).
 */
export function usePictureUrl( id ) {
	return (
		useSelect(
			( select ) =>
				id
					? select( coreStore ).getEntityRecord(
							'postType',
							'attachment',
							id
						)?.source_url
					: '',
			[ id ]
		) ||
		( id && PICKED[ id ] ) ||
		''
	);
}

/**
 * A background picture chosen for an element, as the element's own style
 * (harlow_picture_style()).
 *
 * @param {string} url The picture's address, or ''.
 * @return {Object|undefined} A style for the element.
 */
export function pictureStyle( url ) {
	return url ? { backgroundImage: `url("${ url }")` } : undefined;
}

/**
 * Choose a picture from the Media Library, or leave the design's own.
 *
 * @param {Object}   props
 * @param {string}   props.label    What the picture is.
 * @param {number}   props.value    The picture chosen (its id), 0 for none.
 * @param {Function} props.onChange Called with the picture's id, 0 to go back to the design's.
 * @param {string}   props.none     What shows while none is chosen.
 */
export function PicturePicker( { label, value, onChange, none } ) {
	const url = usePictureUrl( value );
	return (
		<div className="harlow-picture-picker">
			<p className="harlow-picture-picker__label">{ label }</p>
			{ url ? (
				<img
					className="harlow-picture-picker__preview"
					src={ url }
					alt=""
				/>
			) : (
				<p className="harlow-picture-picker__none">{ none }</p>
			) }
			<MediaUploadCheck>
				<MediaUpload
					allowedTypes={ [ 'image' ] }
					value={ value || undefined }
					onSelect={ ( picked ) => {
						notePicked( picked );
						onChange( picked.id );
					} }
					render={ ( { open } ) => (
						<Button variant="secondary" onClick={ open }>
							{ value
								? __( 'Replace the picture', 'harlow' )
								: __( 'Choose a picture', 'harlow' ) }
						</Button>
					) }
				/>
			</MediaUploadCheck>
			{ !! value && (
				<Button
					variant="link"
					isDestructive
					onClick={ () => onChange( 0 ) }
				>
					{ __( 'Default', 'harlow' ) }
				</Button>
			) }
		</div>
	);
}

/**
 * The fields of a link: address, new tab, rel.
 *
 * @param {Object}   props
 * @param {Object}   props.value    An object with link, linkTarget, linkRel.
 * @param {Function} props.onChange Called with the changed fields.
 */
export function LinkFields( { value, onChange } ) {
	const link = value.link || '';
	const named = /^([\w-]+)\.html(#.*)?$/.exec( link );
	const targets = site.linkTargets || [];
	const picked =
		named && targets.some( ( t ) => t.name === named[ 1 ] )
			? named[ 1 ]
			: '';
	const part = picked ? named[ 2 ] || '' : '';
	const toPage = ( name, hash ) =>
		onChange( { link: name ? `${ name }.html${ hash }` : '' } );
	return (
		<>
			<ComboboxControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Page of the site', 'harlow' ) }
				help={ __(
					'The link follows the page when its address changes.',
					'harlow'
				) }
				value={ picked }
				options={ targets.map( ( t ) => ( {
					value: t.name,
					label: t.type ? `${ t.title } (${ t.type })` : t.title,
				} ) ) }
				onChange={ ( name ) => toPage( name, part ) }
			/>
			{ picked && (
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Part of the page', 'harlow' ) }
					help={ __(
						'Optional: a section’s id, such as #section-2.',
						'harlow'
					) }
					value={ part }
					onChange={ ( hash ) =>
						toPage(
							picked,
							hash && ! hash.startsWith( '#' )
								? `#${ hash }`
								: hash
						)
					}
				/>
			) }
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Or an address', 'harlow' ) }
				help={ __(
					'Another site’s address, mailto: or tel:.',
					'harlow'
				) }
				value={ picked ? '' : link }
				onChange={ ( typed ) => onChange( { link: typed } ) }
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Open in a new tab', 'harlow' ) }
				checked={ value.linkTarget === '_blank' }
				onChange={ ( on ) =>
					onChange( { linkTarget: on ? '_blank' : '' } )
				}
			/>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Link relation (rel)', 'harlow' ) }
				value={ value.linkRel || '' }
				onChange={ ( linkRel ) => onChange( { linkRel } ) }
			/>
		</>
	);
}

/**
 * A panel with the link fields of a block whose attributes hold one.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes    The block's attributes.
 * @param {Function} props.setAttributes The block's setter.
 */
export function LinkPanel( { attributes, setAttributes } ) {
	return (
		<InspectorControls>
			<PanelBody title={ __( 'Link', 'harlow' ) }>
				<LinkFields value={ attributes } onChange={ setAttributes } />
			</PanelBody>
		</InspectorControls>
	);
}

/** The parts of an element's style that print in its markup (harlow_element_attributes()). */
const MARKUP_STYLE = [ 'classes', 'attributes', 'motion', 'conditions' ];

/**
 * The server's markup of a block, shown as the block's own element: the block's props on
 * its element, so the canvas has the same elements as the page. Markup of several
 * elements (a list printed as its cards alone) goes in a holder the canvas draws as
 * display: contents. For the blocks whose contents are kept elsewhere (menus, list items,
 * header and footer settings).
 *
 * @param {Object}   props
 * @param {string}   props.name       The block's name.
 * @param {Object}   props.attributes The block's attributes.
 * @param {Function} props.onMarkup   Called with the element once its markup is in; what
 *                                    it returns is called when the markup goes.
 */
export function ServerMarkup( { name, attributes, onMarkup } ) {
	const postId = useSelect(
		( select ) => select( 'core/editor' )?.getCurrentPostId(),
		[]
	);
	const [ html, setHtml ] = useState( null );
	// The server's markup follows the style only where it prints attributes (classes, custom
	// attributes, motion, conditions: harlow_element_attributes()); the rest of the style is
	// CSS the canvas draws itself (styles.js), so a colour or a size changed asks nothing of
	// the server.
	const style = attributes.style || {};
	const key = JSON.stringify( {
		...attributes,
		style: MARKUP_STYLE.map( ( part ) => style[ part ] ),
	} );
	useEffect( () => {
		let live = true;
		apiFetch( {
			path: addQueryArgs( `/wp/v2/block-renderer/${ name }`, {
				context: 'edit',
				post_id: postId,
			} ),
			method: 'POST',
			data: { attributes },
		} )
			.then( ( response ) => live && setHtml( response.rendered ) )
			.catch( () => live && setHtml( '' ) );
		return () => {
			live = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ name, key, postId ] );

	const root = useMemo( () => {
		if ( html === null ) {
			return null;
		}
		const holder = document.createElement( 'template' );
		holder.innerHTML = html.trim();
		const el = holder.content.firstElementChild;
		if ( ! el || holder.content.children.length > 1 ) {
			return {
				tag: 'div',
				props: { className: 'harlow-server-markup' },
				inner: html,
			};
		}
		const attrs = {};
		[ ...el.attributes ].forEach( ( a ) => {
			attrs[ a.name ] = a.value;
		} );
		return {
			tag: el.tagName.toLowerCase(),
			props: attributeProps( attrs ),
			inner: el.innerHTML,
		};
	}, [ html ] );

	const ref = useRef();
	const blockProps = useBlockProps( {
		...( root ? root.props : { className: 'harlow-loading' } ),
		ref,
		// Links in the server's markup do not leave the editor.
		onClick: ( event ) => {
			if ( event.target.closest( 'a' ) ) {
				event.preventDefault();
			}
		},
	} );
	useLayoutEffect( () => {
		if ( root && ref.current && onMarkup ) {
			return onMarkup( ref.current );
		}
	}, [ root, onMarkup ] );

	const Tag = root ? root.tag : 'div';
	return (
		<Tag
			{ ...blockProps }
			dangerouslySetInnerHTML={ { __html: root ? root.inner : '' } }
		/>
	);
}
