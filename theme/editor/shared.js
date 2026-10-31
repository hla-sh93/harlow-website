/**
 * What the blocks' edit views share: an element's attributes as Elementor writes them,
 * readable links made addresses, the site's icons, the link and picture panels, and the
 * server's markup for the blocks whose words live elsewhere (menus, lists, header, footer).
 */
import apiFetch from '@wordpress/api-fetch';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	Button,
	ComboboxControl,
	PanelBody,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
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
export const IN_CONTAINER = [
	'harlow/container',
	'harlow/heading',
	'harlow/text',
	'harlow/image',
	'harlow/button',
	'harlow/divider',
	'harlow/icon',
	'harlow/icon-list',
	'harlow/social-icons',
	'harlow/accordion',
	'harlow/html',
	'harlow/shortcode',
	'harlow/nav-menu',
	'harlow/template',
	'harlow/loop',
	'harlow/site-part',
];

/**
 * The attributes of an element as Elementor writes them (harlow_element_attributes()).
 *
 * @param {Object} attributes The block's attributes.
 * @param {string} kind       'container' or 'widget'.
 * @param {string} widget     The widget type, for a widget.
 * @return {Object} Props for the element.
 */
export function elementProps( attributes, kind, widget = '' ) {
	const props = {
		className: attributes.classes,
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

/**
 * Choose one of the site's icons (the ones its pages use).
 *
 * @param {Object}   props
 * @param {string}   props.value     The icon chosen.
 * @param {Function} props.onChange  Called with the new icon's markup.
 * @param {boolean}  props.allowNone Offer "no icon".
 */
export function IconPicker( { value, onChange, allowNone = false } ) {
	return (
		<div className="harlow-icon-picker">
			{ allowNone && (
				<Button
					variant={ value ? 'secondary' : 'primary' }
					onClick={ () => onChange( '' ) }
				>
					{ __( 'No icon', 'harlow' ) }
				</Button>
			) }
			{ icons.map( ( svg, i ) => (
				<Button
					key={ i }
					className="harlow-icon-picker__icon"
					isPressed={ svg === value }
					label={ `${ __( 'Icon', 'harlow' ) } ${ i + 1 }` }
					onClick={ () => onChange( svg ) }
				>
					<span dangerouslySetInnerHTML={ { __html: svg } } />
				</Button>
			) ) }
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
	const key = JSON.stringify( attributes );
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
