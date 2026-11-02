/**
 * A Facebook embed in the editor: includes/sections/facebook-embed.php's markup, with a box
 * in it saying what Facebook's SDK will draw there (the SDK runs on the page, not in the
 * editor); the kind of embed, its address and options in the sidebar.
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
	'elementor-element elementor-widget elementor-widget-facebook-embed';
const LOGO =
	'<svg aria-hidden="true" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path></svg>';

export default function Edit( { attributes, setAttributes } ) {
	const { includeParent, showText, allowFullscreen, autoplay, showCaptions } =
		attributes;
	const type = [ 'post', 'video', 'comment' ].includes( attributes.embedType )
		? attributes.embedType
		: 'post';
	const url = ( attributes[ `${ type }Url` ] || '' ).trim();
	const blockProps = useBlockProps(
		elementProps(
			{ ...attributes, classes: attributes.classes || CLASSES },
			'widget',
			'facebook-embed.default'
		)
	);
	const flag = ( on ) => ( on ? 'true' : 'false' );
	const toggle = ( label, key ) => (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ label }
			checked={ attributes[ key ] }
			onChange={ ( value ) => setAttributes( { [ key ]: value } ) }
		/>
	);
	const data = {
		post: {
			className: 'elementor-facebook-widget fb-post',
			'data-show-text': flag( showText ),
		},
		video: {
			className: 'elementor-facebook-widget fb-video',
			'data-show-text': flag( showText ),
			'data-allowfullscreen': flag( allowFullscreen ),
			'data-autoplay': flag( autoplay ),
			'data-show-captions': flag( showCaptions ),
		},
		comment: {
			className: 'elementor-facebook-widget fb-comment-embed',
			'data-include-parent': flag( includeParent ),
		},
	}[ type ];
	const kinds = {
		post: __( 'post', 'harlow' ),
		video: __( 'video', 'harlow' ),
		comment: __( 'comment', 'harlow' ),
	};
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Embed', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Type', 'harlow' ) }
						value={ type }
						options={ [
							{ value: 'post', label: __( 'Post', 'harlow' ) },
							{ value: 'video', label: __( 'Video', 'harlow' ) },
							{
								value: 'comment',
								label: __( 'Comment', 'harlow' ),
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { embedType: value } )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'URL', 'harlow' ) }
						placeholder="https://www.facebook.com/"
						value={ attributes[ `${ type }Url` ] }
						onChange={ ( value ) =>
							setAttributes( { [ `${ type }Url` ]: value } )
						}
					/>
					{ type === 'comment' &&
						toggle(
							__( 'Parent Comment', 'harlow' ),
							'includeParent'
						) }
					{ type === 'post' &&
						toggle( __( 'Full Post', 'harlow' ), 'showText' ) }
					{ type === 'video' && (
						<>
							{ toggle(
								__( 'Allow Full Screen', 'harlow' ),
								'allowFullscreen'
							) }
							{ toggle( __( 'Autoplay', 'harlow' ), 'autoplay' ) }
							{ toggle(
								__( 'Captions', 'harlow' ),
								'showCaptions'
							) }
							{ toggle(
								__( 'Show Text', 'harlow' ),
								'showText'
							) }
						</>
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<div className="elementor-widget-container">
					{ url ? (
						<div
							style={ { minHeight: '1px' } }
							{ ...data }
							data-href={ url }
						>
							<div className="harlow-facebook-placeholder">
								<span
									dangerouslySetInnerHTML={ { __html: LOGO } }
								/>
								<span>
									{ sprintf(
										/* translators: 1: post, video or comment, 2: its address. */
										__( 'A Facebook %1$s: %2$s', 'harlow' ),
										kinds[ type ],
										url
									) }
								</span>
							</div>
						</div>
					) : (
						__( 'Please enter a valid URL', 'harlow' )
					) }
				</div>
			</div>
		</>
	);
}
