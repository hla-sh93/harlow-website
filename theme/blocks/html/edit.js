/**
 * An HTML widget in the editor: includes/sections/html.php, its markup shown as the page
 * shows it and written in the sidebar.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { elementProps, resolveLinks } from '../../editor/shared';

/**
 * The sidebar field of a block whose content is markup.
 *
 * @param {Object}   props
 * @param {string}   props.value    The markup.
 * @param {Function} props.onChange Called with the new markup.
 */
export function MarkupPanel( { value, onChange } ) {
	return (
		<InspectorControls>
			<PanelBody title={ __( 'HTML', 'harlow' ) }>
				<TextareaControl
					__nextHasNoMarginBottom
					className="harlow-code"
					label={ __( 'Markup', 'harlow' ) }
					rows={ 14 }
					value={ value }
					onChange={ onChange }
				/>
			</PanelBody>
		</InspectorControls>
	);
}

export default function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'html.default' )
	);
	return (
		<>
			<MarkupPanel
				value={ attributes.html }
				onChange={ ( html ) => setAttributes( { html } ) }
			/>
			<div { ...blockProps }>
				{ '\n' }
				<div
					className="elementor-widget-container"
					dangerouslySetInnerHTML={ {
						__html: resolveLinks( attributes.html ),
					} }
				/>
				{ '\n' }
			</div>
		</>
	);
}
