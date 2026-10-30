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

import { elementProps } from '../../editor/shared';

const TAGS = [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span' ];

export default function Edit( { attributes, setAttributes } ) {
	const { tag, size, text } = attributes;
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'heading.default' )
	);
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
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<RichText
						tagName={ TAGS.includes( tag ) ? tag : 'h2' }
						className={ `elementor-heading-title elementor-size-${ size }` }
						value={ text }
						onChange={ ( value ) =>
							setAttributes( { text: value } )
						}
						placeholder={ __( 'Heading', 'harlow' ) }
					/>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
