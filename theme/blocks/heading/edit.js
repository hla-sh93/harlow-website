/**
 * A heading in the editor: includes/sections/heading.php, its words typed in place.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { elementProps, LinkFields, sourceLabel } from '../../editor/shared';

const TAGS = [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span' ];
const SIZES = [ 'default', 'small', 'medium', 'large', 'xl', 'xxl' ];

export default function Edit( { attributes, setAttributes } ) {
	const { tag, size, text, source } = attributes;
	const Tag = TAGS.includes( tag ) ? tag : 'h2';
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'heading.default' )
	);
	const className = `elementor-heading-title elementor-size-${ size }`;
	const typed = ( tagName, props = {} ) => (
		<RichText
			tagName={ tagName }
			value={ text }
			onChange={ ( value ) => setAttributes( { text: value } ) }
			placeholder={ __( 'Heading', 'harlow' ) }
			{ ...props }
		/>
	);
	let words;
	if ( source ) {
		// A field of the item, in an item page template's own screen.
		words = <Tag className={ className }>{ sourceLabel( source ) }</Tag>;
	} else if ( attributes.link ) {
		// With a link: its words typed inside the link, as the page prints them.
		words = (
			<Tag className={ className }>
				{ typed( 'a', {
					allowedFormats: [ 'core/bold', 'core/italic' ],
				} ) }
			</Tag>
		);
	} else {
		words = typed( Tag, { className } );
	}
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Heading', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Element', 'harlow' ) }
						value={ tag }
						options={ TAGS.map( ( t ) => ( {
							value: t,
							label: t,
						} ) ) }
						onChange={ ( value ) =>
							setAttributes( { tag: value } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Size', 'harlow' ) }
						value={ size }
						options={ SIZES.map( ( s ) => ( {
							value: s,
							label:
								s === 'default' ? __( 'Default', 'harlow' ) : s,
						} ) ) }
						onChange={ ( value ) =>
							setAttributes( { size: value } )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Link', 'harlow' ) }
					initialOpen={ false }
				>
					<LinkFields
						value={ attributes }
						onChange={ setAttributes }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					{ words }
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
