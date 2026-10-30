/**
 * The design of an element is its classes from the vocabulary (_vocab/vocabulary.md): a
 * field in each block's Advanced panel lists them, suggests the others and takes only
 * those. Elementor's own classes of the element are kept as they are.
 */
import { InspectorControls } from '@wordpress/block-editor';
import { FormTokenField } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

import vocabulary from './design-classes.json';

const known = new Set( vocabulary );

addFilter(
	'editor.BlockEdit',
	'harlow/design-classes',
	createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			const { name, attributes, setAttributes, isSelected } = props;
			if (
				! isSelected ||
				! name.startsWith( 'harlow/' ) ||
				typeof attributes.classes !== 'string'
			) {
				return <BlockEdit { ...props } />;
			}
			const all = attributes.classes.split( /\s+/ ).filter( Boolean );
			const design = all.filter( ( c ) => c.startsWith( 'hl-' ) );
			const own = all.filter( ( c ) => ! c.startsWith( 'hl-' ) );
			return (
				<>
					<BlockEdit { ...props } />
					<InspectorControls group="advanced">
						<FormTokenField
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Design classes', 'harlow' ) }
							value={ design }
							suggestions={ vocabulary }
							maxSuggestions={ 40 }
							__experimentalValidateInput={ ( value ) =>
								known.has( value )
							}
							onChange={ ( tokens ) =>
								setAttributes( {
									classes: [
										...own,
										...tokens
											.map( ( t ) =>
												typeof t === 'string'
													? t
													: t.value
											)
											.filter( ( t ) => known.has( t ) ),
									].join( ' ' ),
								} )
							}
						/>
					</InspectorControls>
				</>
			);
		},
		'withDesignClasses'
	)
);
