/**
 * A shortcode widget in the editor: includes/sections/shortcode.php. A form is the
 * server's markup (the form is its plugin's, written in Contact → Contact Forms), with the
 * spinner CF7's script adds on the page; its shortcode in the sidebar. Markup a plugin
 * printed on live is shown as the page shows it and written in the sidebar.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { MarkupPanel } from '../html/edit';
import { ServerMarkup, elementProps, resolveLinks } from '../../editor/shared';

/**
 * What CF7's script does to a form on the page: a spinner after the submit button.
 *
 * @param {Element} el The block's element.
 */
function addSpinners( el ) {
	el.querySelectorAll( '.has-spinner' ).forEach( ( button ) => {
		if ( ! button.nextElementSibling?.matches( '.wpcf7-spinner' ) ) {
			button.insertAdjacentHTML(
				'afterend',
				'<span class="wpcf7-spinner"></span>'
			);
		}
	} );
}

function Shortcode( { attributes, setAttributes } ) {
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Form', 'harlow' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Shortcode', 'harlow' ) }
						help={ __(
							'Contact → Contact Forms shows each form’s shortcode.',
							'harlow'
						) }
						value={ attributes.shortcode }
						onChange={ ( shortcode ) =>
							setAttributes( { shortcode } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<ServerMarkup
				name="harlow/shortcode"
				attributes={ attributes }
				onMarkup={ addSpinners }
			/>
		</>
	);
}

function Markup( { attributes, setAttributes } ) {
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'shortcode.default' )
	);
	return (
		<>
			<MarkupPanel
				value={ attributes.html }
				onChange={ ( html ) => setAttributes( { html } ) }
			/>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<div
						className="elementor-shortcode"
						dangerouslySetInnerHTML={ {
							__html: resolveLinks( attributes.html ),
						} }
					/>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}

export default function Edit( props ) {
	return props.attributes.shortcode ? (
		<Shortcode { ...props } />
	) : (
		<Markup { ...props } />
	);
}
