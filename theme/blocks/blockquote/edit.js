/**
 * A blockquote in the editor: includes/sections/blockquote.php, the quotation, its author
 * and the button's label typed in place; the skin, the alignment and the button's fields in
 * the sidebar.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { elementProps } from '../../editor/shared';
import { FORMATS, stay, withClasses } from '../image-box/edit';
import { oneOf } from '../icon-box/edit';

/** X's mark (Font Awesome's x-twitter), as the page prints it. */
const X_ICON = (
	<svg
		aria-hidden="true"
		className="e-font-icon-svg e-fab-x-twitter"
		viewBox="0 0 512 512"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
	</svg>
);

const SKINS = [
	{ value: 'border', label: __( 'Border', 'harlow' ) },
	{ value: 'quotation', label: __( 'Quotation', 'harlow' ) },
	{ value: 'boxed', label: __( 'Boxed', 'harlow' ) },
	{ value: 'clean', label: __( 'Clean', 'harlow' ) },
];
const ALIGNS = [
	{ value: 'left', label: __( 'Left', 'harlow' ) },
	{ value: 'center', label: __( 'Center', 'harlow' ) },
	{ value: 'right', label: __( 'Right', 'harlow' ) },
];
const VIEWS = [
	{ value: 'icon-text', label: __( 'Icon & Text', 'harlow' ) },
	{ value: 'icon', label: __( 'Icon', 'harlow' ) },
	{ value: 'text', label: __( 'Text', 'harlow' ) },
];
const BUTTON_SKINS = [
	{ value: 'classic', label: __( 'Classic', 'harlow' ) },
	{ value: 'bubble', label: __( 'Bubble', 'harlow' ) },
	{ value: 'link', label: __( 'Link', 'harlow' ) },
];
const COLOURS = [
	{ value: 'official', label: __( 'Official', 'harlow' ) },
	{ value: 'custom', label: __( 'Custom (Style tab)', 'harlow' ) },
];
const TARGETS = [
	{ value: 'current_page', label: __( 'Current Page', 'harlow' ) },
	{ value: 'none', label: __( 'None', 'harlow' ) },
	{ value: 'custom', label: __( 'Custom', 'harlow' ) },
];

export default function Edit( { attributes, setAttributes } ) {
	const { content, author, tweetButton, tweetLabel, userName, urlType, url } =
		attributes;
	const skin = oneOf( attributes.skin, SKINS );
	const align = oneOf( attributes.alignment, ALIGNS );
	const view = oneOf( attributes.tweetView, VIEWS );
	const buttonSkin = oneOf( attributes.tweetSkin, BUTTON_SKINS );
	const colour = oneOf( attributes.tweetColor, COLOURS );
	const blockProps = useBlockProps(
		elementProps(
			withClasses( attributes, /(^|\s)elementor-blockquote--\S+/g, [
				`elementor-blockquote--skin-${ skin }`,
				skin !== 'border' && `elementor-blockquote--align-${ align }`,
				tweetButton && `elementor-blockquote--button-view-${ view }`,
				tweetButton &&
					`elementor-blockquote--button-skin-${ buttonSkin }`,
				tweetButton && `elementor-blockquote--button-color-${ colour }`,
			] ),
			'widget',
			'blockquote.default'
		)
	);
	const select = ( label, key, value, options ) => (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			value={ value }
			options={ options }
			onChange={ ( v ) => setAttributes( { [ key ]: v } ) }
		/>
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Blockquote', 'harlow' ) }>
					{ select( __( 'Skin', 'harlow' ), 'skin', skin, SKINS ) }
					{ skin !== 'border' &&
						select(
							__( 'Alignment', 'harlow' ),
							'alignment',
							align,
							ALIGNS
						) }
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Tweet Button', 'harlow' ) }
						checked={ tweetButton }
						onChange={ ( v ) =>
							setAttributes( { tweetButton: v } )
						}
					/>
				</PanelBody>
				{ tweetButton && (
					<PanelBody
						title={ __( 'Tweet Button', 'harlow' ) }
						initialOpen={ false }
					>
						{ select(
							__( 'View', 'harlow' ),
							'tweetView',
							view,
							VIEWS
						) }
						{ select(
							__( 'Skin', 'harlow' ),
							'tweetSkin',
							buttonSkin,
							BUTTON_SKINS
						) }
						{ select(
							__( 'Color', 'harlow' ),
							'tweetColor',
							colour,
							COLOURS
						) }
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Username', 'harlow' ) }
							placeholder="@username"
							value={ userName }
							onChange={ ( v ) =>
								setAttributes( { userName: v } )
							}
						/>
						{ select(
							__( 'Target URL', 'harlow' ),
							'urlType',
							oneOf( urlType, TARGETS ),
							TARGETS
						) }
						{ urlType === 'custom' && (
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Link', 'harlow' ) }
								placeholder="https://"
								value={ url }
								onChange={ ( v ) =>
									setAttributes( { url: v } )
								}
							/>
						) }
					</PanelBody>
				) }
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<blockquote className="elementor-blockquote">
						{ '\n' }
						<RichText
							tagName="p"
							className="elementor-blockquote__content"
							value={ content }
							onChange={ ( v ) =>
								setAttributes( { content: v } )
							}
							placeholder={ __( 'Quotation', 'harlow' ) }
							allowedFormats={ FORMATS }
						/>
						{ '\n' }
						<footer>
							{ '\n' }
							<RichText
								tagName="cite"
								className="elementor-blockquote__author"
								value={ author }
								onChange={ ( v ) =>
									setAttributes( { author: v } )
								}
								placeholder={ __( 'Author', 'harlow' ) }
								allowedFormats={ [] }
							/>
							{ '\n' }
							{ tweetButton && (
								<a
									href="https://twitter.com/intent/tweet"
									className="elementor-blockquote__tweet-button"
									target="_blank"
									rel="noreferrer"
									onClick={ stay }
								>
									{ '\n' }
									{ view !== 'text' && X_ICON }
									{ view === 'icon' && (
										<span className="elementor-screen-only">
											{ __( 'Tweet', 'harlow' ) }
										</span>
									) }
									{ view !== 'icon' && (
										<RichText
											tagName="span"
											className="elementor-blockquote__tweet-label"
											value={ tweetLabel }
											onChange={ ( v ) =>
												setAttributes( {
													tweetLabel: v,
												} )
											}
											placeholder={ __(
												'Tweet',
												'harlow'
											) }
											allowedFormats={ [] }
										/>
									) }
									{ '\n' }
								</a>
							) }
							{ tweetButton && '\n' }
						</footer>
						{ '\n' }
					</blockquote>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
