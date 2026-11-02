/**
 * A block put on a page by the owner (from the inserter, a paste, a duplicate) becomes an
 * Elementor element as the page's own are: an id of its own (Elementor's seven hex
 * characters) and the classes of its kind, so the design's rules for its kind reach it and
 * the Styles tab can style it alone. A duplicate gets a new id, as Elementor gives one; the
 * blocks the page opened with keep theirs, and so do the blocks of a synced pattern.
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { select, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';

import { WIDGET_TYPES } from './widget-types';

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
			out.push( [ id, store.getBlockAttributes( id )?.element || '' ] );
			walk( store.getBlockOrder( id ) );
		} );
	walk( store.getBlockOrder() );
	return out;
}

/** The blocks the page opened with (their ids are the page's, never changed here). */
let opened = null;

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
			const isElement =
				name.startsWith( 'harlow/' ) &&
				! NOT_ELEMENTS.includes( name ) &&
				'element' in attributes;
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
					attributes.element &&
					! others.some( ( [ , el ] ) => el === attributes.element )
				) {
					return;
				}
				const id = newId(
					new Set(
						blocks.map( ( [ , el ] ) => el ).filter( Boolean )
					)
				);
				if ( ! attributes.element ) {
					const patch = {
						element: id,
						classes:
							attributes.classes ||
							elementClasses( name, inParent ),
					};
					if ( name === 'harlow/container' && ! attributes.classes ) {
						patch.boxed = true;
					}
					setAttributes( patch );
				} else {
					// A copy of another element: a new id, the same classes.
					setAttributes( { element: id } );
				}
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, [ clientId, isElement ] );
			return <BlockEdit { ...props } />;
		},
		'withHarlowNewElement'
	)
);
