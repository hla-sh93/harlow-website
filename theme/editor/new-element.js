/**
 * A block put on a page by the owner (from the inserter, a paste, a duplicate) becomes an
 * Elementor element as the page's own are: an id of its own (Elementor's seven hex
 * characters) and the classes of its kind, so the design's rules for its kind reach it and
 * the Styles tab can style it alone. A duplicate gets a new id, as Elementor gives one; the
 * blocks the page opened with keep theirs, and so do the blocks of a synced pattern.
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { select, subscribe, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';

import icons from './icons.json';
import { WIDGET_TYPES } from './widget-types';

/** Font Awesome's check, the icon of a new icon list's lines (Elementor's). */
const CHECK =
	'<svg aria-hidden="true" class="e-font-icon-svg e-fas-check" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path></svg>';

/** Blocks that are not elements of their own. */
const NOT_ELEMENTS = [ 'harlow/document', 'harlow/site-part' ];

/**
 * A new element id: seven hex characters, none the page has.
 *
 * @param {Set<string>} taken The ids on the page.
 * @return {string} The id.
 */
function newId( taken ) {
	let id;
	do {
		id = Math.floor( Math.random() * 0xfffffff )
			.toString( 16 )
			.padStart( 7, '0' );
	} while ( taken.has( id ) );
	return id;
}

/**
 * Every block of the editor, as [ client id, element id ], in the page's order.
 *
 * @return {Array<Array<string>>} The blocks.
 */
function everyBlock() {
	const store = select( 'core/block-editor' );
	const out = [];
	const walk = ( ids ) =>
		ids.forEach( ( id ) => {
			const attrs = store.getBlockAttributes( id ) || {};
			out.push( [ id, attrs.element || attrs.widget || '' ] );
			walk( store.getBlockOrder( id ) );
		} );
	walk( store.getBlockOrder() );
	return out;
}

/**
 * The blocks the page opened with (their ids are the page's, never changed here), noted
 * when the editor is ready: on a page that opened empty, the first element put in is new
 * (noted at the first element drawn instead, it was taken for one the page opened with and
 * got no id, so no Styles tab).
 */
let opened = null;
const stopWatching = subscribe( () => {
	const editor = select( 'core/editor' );
	if ( opened === null && editor?.__unstableIsEditorReady?.() ) {
		opened = new Set( everyBlock().map( ( [ id ] ) => id ) );
	}
	if ( opened !== null ) {
		stopWatching();
	}
} );

/**
 * The classes Elementor gives an element of this kind.
 *
 * @param {string}  name     The block's name.
 * @param {boolean} inParent Inside another container.
 * @return {string} The classes.
 */
export function elementClasses( name, inParent ) {
	const kind = name.replace( 'harlow/', '' );
	if ( kind === 'container' ) {
		return `elementor-element e-flex e-con-boxed e-con ${
			inParent ? 'e-child' : 'e-parent'
		}`;
	}
	const type = WIDGET_TYPES[ kind ] || kind;
	return `elementor-element elementor-widget elementor-widget-${ type }`;
}

addFilter(
	'editor.BlockEdit',
	'harlow/new-element',
	createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			const { name, attributes, setAttributes, clientId } = props;
			// The element's id: `element`, or `widget` for a list (harlow/loop).
			const idKey = 'element' in attributes ? 'element' : 'widget';
			const isElement =
				name.startsWith( 'harlow/' ) &&
				! NOT_ELEMENTS.includes( name ) &&
				idKey in attributes;
			const inParent = useSelect(
				( s ) =>
					isElement &&
					s( 'core/block-editor' )
						.getBlockParents( clientId )
						.some(
							( id ) =>
								s( 'core/block-editor' ).getBlockName( id ) ===
								'harlow/container'
						),
				[ clientId, isElement ]
			);
			useEffect( () => {
				if ( ! isElement ) {
					return;
				}
				const blocks = everyBlock();
				if ( opened === null ) {
					opened = new Set( blocks.map( ( [ id ] ) => id ) );
				}
				const store = select( 'core/block-editor' );
				if (
					opened.has( clientId ) ||
					store.getBlockParentsByBlockName( clientId, 'core/block' )
						.length
				) {
					return;
				}
				// Its own id already, no other block has it: nothing to do.
				const others = blocks.filter( ( [ id ] ) => id !== clientId );
				if (
					attributes[ idKey ] &&
					! others.some( ( [ , el ] ) => el === attributes[ idKey ] )
				) {
					return;
				}
				const id = newId(
					new Set(
						blocks.map( ( [ , el ] ) => el ).filter( Boolean )
					)
				);
				if ( ! attributes[ idKey ] ) {
					// A new element from the inserter starts in the brand's colours and fonts
					// (modules.css), not Elementor's defaults; one from the section library
					// comes with the design's own classes.
					const patch = {
						[ idKey ]: id,
						classes:
							attributes.classes ||
							`${ elementClasses( name, inParent ) } harlow-brand`,
					};
					// A new list is Elementor's new loop grid: three columns, two on tablets,
					// one on phones.
					if ( name === 'harlow/loop' && ! attributes.classes ) {
						patch.classes = `elementor-element elementor-grid-3 elementor-grid-tablet-2 elementor-grid-mobile-1 elementor-widget elementor-widget-loop-${
							attributes.layout === 'carousel'
								? 'carousel'
								: 'grid'
						} harlow-brand`;
					}
					if ( name === 'harlow/container' && ! attributes.classes ) {
						patch.boxed = true;
					}
					// A new divider is a line, as Elementor's is (its default style is none).
					if ( name === 'harlow/divider' && ! attributes.lineStyle ) {
						patch.lineStyle = 'solid';
					}
					// New social icons come with the site's networks, as Elementor's come with
					// three (the addresses to fill in).
					if (
						name === 'harlow/social-icons' &&
						! ( attributes.items || [] ).length
					) {
						patch.items = [
							[ 'facebook', 'Facebook' ],
							[ 'instagram', 'Instagram' ],
							[ 'linkedin', 'Linkedin' ],
							[ 'x-twitter', 'X-twitter' ],
						].map( ( [ network, label ] ) => ( {
							label,
							link: '',
							icon:
								icons.find( ( svg ) =>
									svg.includes( `e-fab-${ network } ` )
								) ||
								icons.find( ( svg ) =>
									svg.includes( `e-fab-${ network }"` )
								) ||
								'',
							linkClass: `elementor-icon elementor-social-icon elementor-social-icon-${ network }`,
						} ) );
					}
					// A new icon list has Elementor's three lines with a check, to write over.
					if (
						name === 'harlow/icon-list' &&
						! ( attributes.items || [] ).length
					) {
						patch.items = [ 1, 2, 3 ].map( ( n ) => ( {
							text: `List Item #${ n }`,
							icon: CHECK,
						} ) );
					}
					// A new menu is Elementor's new menu: the site's main menu, across, an underline
					// under the link pointed at, a burger and a dropdown on tablets and phones.
					if ( name === 'harlow/nav-menu' && ! attributes.classes ) {
						patch.menu = attributes.menu || 'primary';
						patch.classes =
							'elementor-element elementor-nav-menu--dropdown-tablet elementor-nav-menu__text-align-aside elementor-nav-menu--toggle elementor-nav-menu--burger elementor-widget elementor-widget-nav-menu harlow-brand';
						patch.navClass =
							'elementor-nav-menu--main elementor-nav-menu__container elementor-nav-menu--layout-horizontal e--pointer-underline e--animation-fade';
					}
					setAttributes( patch );
				} else {
					// A copy of another element: a new id, the same classes.
					setAttributes( { [ idKey ]: id } );
				}
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, [ clientId, isElement ] );
			return <BlockEdit { ...props } />;
		},
		'withHarlowNewElement'
	)
);
