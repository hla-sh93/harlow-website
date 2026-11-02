/**
 * A Facebook button in the editor: includes/sections/facebook-button.php's markup, with a
 * box in it saying what Facebook's SDK will draw there (the SDK runs on the page, not in
 * the editor); the button's type, layout, size, colours and address in the sidebar.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

import { elementProps } from '../../editor/shared';

const CLASSES =
	'elementor-element elementor-widget elementor-widget-facebook-button';
const LOGO =
	'<svg aria-hidden="true" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path></svg>';

export default function Edit( { attributes, setAttributes } ) {
	const {
		type,
		layout,
		size,
		colorScheme,
		showShare,
		showFaces,
		urlType,
		url,
		urlFormat,
	} = attributes;
	const blockProps = useBlockProps(
		elementProps(
			{ ...attributes, classes: attributes.classes || CLASSES },
			'widget',
			'facebook-button.default'
		)
	);
	const custom = urlType === 'custom';
	const valid = ! custom || /^https?:\/\/\S+$/i.test( ( url || '' ).trim() );
	let target = __( 'this page (its plain address)', 'harlow' );
	if ( custom ) {
		target = url;
	} else if ( urlFormat === 'pretty' ) {
		target = __( 'this page’s address', 'harlow' );
	}
	const select = ( label, key, options ) => (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			value={ attributes[ key ] }
			options={ options }
			onChange={ ( value ) => setAttributes( { [ key ]: value } ) }
		/>
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Button', 'harlow' ) }>
					{ select( __( 'Type', 'harlow' ), 'type', [
						{ value: 'like', label: __( 'Like', 'harlow' ) },
						{
							value: 'recommend',
							label: __( 'Recommend', 'harlow' ),
						},
					] ) }
					{ select( __( 'Layout', 'harlow' ), 'layout', [
						{
							value: 'standard',
							label: __( 'Standard', 'harlow' ),
						},
						{ value: 'button', label: __( 'Button', 'harlow' ) },
						{
							value: 'button_count',
							label: __( 'Button Count', 'harlow' ),
						},
						{
							value: 'box_count',
							label: __( 'Box Count', 'harlow' ),
						},
					] ) }
					{ select( __( 'Size', 'harlow' ), 'size', [
						{ value: 'small', label: __( 'Small', 'harlow' ) },
						{ value: 'large', label: __( 'Large', 'harlow' ) },
					] ) }
					{ select( __( 'Color Scheme', 'harlow' ), 'colorScheme', [
						{ value: 'light', label: __( 'Light', 'harlow' ) },
						{ value: 'dark', label: __( 'Dark', 'harlow' ) },
					] ) }
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Share Button', 'harlow' ) }
						checked={ showShare }
						onChange={ ( value ) =>
							setAttributes( { showShare: value } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Faces', 'harlow' ) }
						checked={ showFaces }
						onChange={ ( value ) =>
							setAttributes( { showFaces: value } )
						}
					/>
					{ select( __( 'Target URL', 'harlow' ), 'urlType', [
						{
							value: 'current_page',
							label: __( 'Current Page', 'harlow' ),
						},
						{ value: 'custom', label: __( 'Custom', 'harlow' ) },
					] ) }
					{ custom ? (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Link', 'harlow' ) }
							placeholder="https://"
							value={ url }
							onChange={ ( value ) =>
								setAttributes( { url: value } )
							}
						/>
					) : (
						select( __( 'URL Format', 'harlow' ), 'urlFormat', [
							{
								value: 'plain',
								label: __( 'Plain Permalink', 'harlow' ),
							},
							{
								value: 'pretty',
								label: __( 'Pretty Permalink', 'harlow' ),
							},
						] )
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<div className="elementor-widget-container">
					{ valid ? (
						<div
							className="elementor-facebook-widget fb-like"
							data-layout={ layout }
							data-colorscheme={ colorScheme }
							data-size={ size }
							data-show-faces={ showFaces ? 'true' : 'false' }
							data-href={ custom ? url : undefined }
							data-share={ showShare ? 'true' : 'false' }
							data-action={ type }
						>
							<div className="harlow-facebook-placeholder">
								<span
									dangerouslySetInnerHTML={ { __html: LOGO } }
								/>
								<span>
									{ sprintf(
										/* translators: 1: Like or Recommend, 2: the address. */
										__(
											'Facebook’s %1$s button, for %2$s',
											'harlow'
										),
										type === 'recommend'
											? __( 'Recommend', 'harlow' )
											: __( 'Like', 'harlow' ),
										target
									) }
								</span>
							</div>
						</div>
					) : (
						__(
							'Facebook Button: Please enter a valid URL',
							'harlow'
						)
					) }
				</div>
			</div>
		</>
	);
}
