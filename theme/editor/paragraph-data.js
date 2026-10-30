/**
 * Data attributes on a paragraph: the text of the older pages gives some paragraphs
 * data-animation and data-duration. WordPress's paragraph keeps only its class, so this
 * gives it a field for them (dataAttributes), written on the paragraph when it is saved
 * and shown on it in the canvas. Only data-* names are written.
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

const DATA = /^data-[a-z0-9_-]+$/;

function dataProps( attributes ) {
	const props = {};
	Object.entries( attributes.dataAttributes || {} ).forEach(
		( [ name, value ] ) => {
			if ( DATA.test( name ) ) {
				props[ name ] = value;
			}
		}
	);
	return props;
}

addFilter(
	'blocks.registerBlockType',
	'harlow/paragraph-data',
	( settings, name ) =>
		name === 'core/paragraph'
			? {
					...settings,
					attributes: {
						...settings.attributes,
						dataAttributes: { type: 'object' },
					},
				}
			: settings
);

addFilter(
	'blocks.getSaveContent.extraProps',
	'harlow/paragraph-data',
	( props, blockType, attributes ) =>
		blockType.name === 'core/paragraph' && attributes.dataAttributes
			? { ...props, ...dataProps( attributes ) }
			: props
);

addFilter(
	'editor.BlockListBlock',
	'harlow/paragraph-data',
	createHigherOrderComponent(
		( BlockListBlock ) => ( props ) =>
			props.name === 'core/paragraph' &&
			props.attributes.dataAttributes ? (
				<BlockListBlock
					{ ...props }
					wrapperProps={ {
						...props.wrapperProps,
						...dataProps( props.attributes ),
					} }
				/>
			) : (
				<BlockListBlock { ...props } />
			),
		'withParagraphData'
	)
);
