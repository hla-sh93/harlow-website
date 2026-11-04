/**
 * The design classes of an element (the vocabulary, _vocab/vocabulary.md), for developers
 * only: under Advanced, closed. An owner styles an element in the Styles tab, where each
 * property has one place and the design's own values are offered first (Hla, 2026-11-02:
 * no option repeated or contradicting another). Elementor's own classes of the element are
 * kept as they are.
 */
import { InspectorControls } from '@wordpress/block-editor';
import { FormTokenField, PanelBody } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

const site = window.harlowEditor || { themeUri: '', design: null };
// The vocabulary, handed over by functions/enqueue.php (editor/design-classes.json).
const vocabulary = site.design || { classes: {}, offers: {} };
const NAMES = Object.keys( vocabulary.classes );
const known = new Set( NAMES );

addFilter(
	'editor.BlockEdit',
	'harlow/design-classes',
	createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			const { name, attributes, setAttributes, isSelected } = props;
			if (
				! isSelected ||
				window.harlowEditor?.contentOnly ||
				! name.startsWith( 'harlow/' ) ||
				typeof attributes.classes !== 'string'
			) {
				return <BlockEdit { ...props } />;
			}
			const all = attributes.classes.split( /\s+/ ).filter( Boolean );
			const design = all.filter( ( c ) => known.has( c ) );
			const own = all.filter( ( c ) => ! known.has( c ) );
			const save = ( classes ) =>
				setAttributes( {
					classes: [ ...own, ...classes ].join( ' ' ),
				} );
			return (
				<>
					<BlockEdit { ...props } />
					<InspectorControls group="advanced">
						<PanelBody
							title={ __(
								'Design classes (for developers)',
								'harlow'
							) }
							initialOpen={ false }
						>
							<FormTokenField
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Design classes', 'harlow' ) }
								value={ design }
								suggestions={ NAMES }
								maxSuggestions={ 40 }
								__experimentalValidateInput={ ( value ) =>
									known.has( value )
								}
								onChange={ ( tokens ) =>
									save(
										tokens
											.map( ( t ) =>
												typeof t === 'string'
													? t
													: t.value
											)
											.filter( ( t ) => known.has( t ) )
									)
								}
							/>
						</PanelBody>
					</InspectorControls>
				</>
			);
		},
		'withDesignClasses'
	)
);
