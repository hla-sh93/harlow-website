/**
 * One element written as HTML in the editor: the element itself in the canvas, with the
 * block's props on it (core's HTML block shows a preview in a frame of its own, which the
 * page's stylesheets do not reach), and its markup in the sidebar.
 */
import { useBlockProps } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

import { MarkupPanel } from '../html/edit';
import { attributeProps, resolveLinks } from '../../editor/shared';

const VOID = [
	'area',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'source',
	'wbr',
];

export default function Edit( { attributes, setAttributes } ) {
	const root = useMemo( () => {
		const holder = document.createElement( 'template' );
		holder.innerHTML = resolveLinks( attributes.html ).trim();
		const el = holder.content.firstElementChild;
		if ( ! el || holder.content.children.length > 1 ) {
			return { tag: 'div', props: {}, inner: attributes.html };
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
	}, [ attributes.html ] );
	const blockProps = useBlockProps( root.props );
	const Tag = root.tag;
	return (
		<>
			<MarkupPanel
				value={ attributes.html }
				onChange={ ( html ) => setAttributes( { html } ) }
			/>
			{ VOID.includes( Tag ) ? (
				<Tag { ...blockProps } />
			) : (
				<Tag
					{ ...blockProps }
					dangerouslySetInnerHTML={ { __html: root.inner } }
				/>
			) }
		</>
	);
}
