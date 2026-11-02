/**
 * A video in the editor: the server's markup of includes/sections/video.php (the provider's
 * player, or the file's), with the page's own script (assets/js/widgets/video.js) for the
 * picture over the player; the source and the player's settings in the sidebar, as
 * Elementor's panel has them.
 */
import {
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { IconPicker, PicturePicker, ServerMarkup } from '../../editor/shared';

const site = window.harlowEditor || { themeUri: '' };

/** The picture sizes WordPress makes, as Elementor's image size control offers them. */
const SIZES = [
	{ value: 'thumbnail', label: __( 'Thumbnail', 'harlow' ) },
	{ value: 'medium', label: __( 'Medium', 'harlow' ) },
	{ value: 'medium_large', label: __( 'Medium large', 'harlow' ) },
	{ value: 'large', label: __( 'Large', 'harlow' ) },
	{ value: 'full', label: __( 'Full', 'harlow' ) },
];

/** The entrance animations the site has (assets/css/animations.css). */
const ANIMATIONS = [
	{ value: '', label: __( 'None', 'harlow' ) },
	{ value: 'fadeIn', label: __( 'Fade in', 'harlow' ) },
	{ value: 'fadeInDown', label: __( 'Fade in down', 'harlow' ) },
	{ value: 'fadeInUp', label: __( 'Fade in up', 'harlow' ) },
	{ value: 'fadeInLeft', label: __( 'Fade in left', 'harlow' ) },
	{ value: 'fadeInRight', label: __( 'Fade in right', 'harlow' ) },
];

/**
 * The widget's own script in the canvas's document, loaded once: what it registers
 * (window.harlowWidgets[ name ]), or null.
 *
 * @param {Document} doc  The canvas's document.
 * @param {string}   name The widget.
 * @return {Promise<Function|null>} The script's init.
 */
function widgetScript( doc, name ) {
	const win = doc.defaultView;
	win.harlowWidgetsManual = true;
	if ( win.harlowWidgets && win.harlowWidgets[ name ] ) {
		return Promise.resolve( win.harlowWidgets[ name ] );
	}
	win.harlowWidgetLoads = win.harlowWidgetLoads || {};
	if ( ! win.harlowWidgetLoads[ name ] ) {
		win.harlowWidgetLoads[ name ] = new Promise( ( resolve ) => {
			const script = doc.createElement( 'script' );
			script.src = `${ site.themeUri }/assets/js/widgets/${ name }.js`;
			script.onload = () =>
				resolve( ( win.harlowWidgets || {} )[ name ] || null );
			script.onerror = () => resolve( null );
			doc.head.appendChild( script );
		} );
	}
	return win.harlowWidgetLoads[ name ];
}

/**
 * A video file of the Media Library, chosen or uploaded.
 *
 * @param {Object}   props
 * @param {number}   props.value    The file (its id), 0 for none.
 * @param {Function} props.onChange Called with the file's id.
 */
function VideoPicker( { value, onChange } ) {
	const name = useSelect(
		( select ) =>
			value
				? select( coreStore ).getEntityRecord(
						'postType',
						'attachment',
						value
					)?.source_url
				: '',
		[ value ]
	);
	return (
		<div className="harlow-video-picker">
			<p>
				{ name
					? name.split( '/' ).pop()
					: __( 'No video chosen', 'harlow' ) }
			</p>
			<MediaUploadCheck>
				<MediaUpload
					allowedTypes={ [ 'video' ] }
					value={ value || undefined }
					onSelect={ ( picked ) => onChange( picked.id ) }
					render={ ( { open } ) => (
						<Button variant="secondary" onClick={ open }>
							{ value
								? __( 'Replace the video', 'harlow' )
								: __( 'Choose a video', 'harlow' ) }
						</Button>
					) }
				/>
			</MediaUploadCheck>
		</div>
	);
}

export default function Edit( { attributes, setAttributes } ) {
	const set = ( name ) => ( value ) => setAttributes( { [ name ]: value } );
	const toggle = ( name, label ) => (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ label }
			checked={ attributes[ name ] }
			onChange={ set( name ) }
		/>
	);
	const type = attributes.videoType;
	const onMarkup = useCallback( ( el ) => {
		let stop;
		let live = true;
		widgetScript( el.ownerDocument, 'video' ).then( ( init ) => {
			if ( live && init ) {
				stop = init( el, { editor: true } );
			}
		} );
		return () => {
			live = false;
			if ( stop ) {
				stop();
			}
		};
	}, [] );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Video', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Source', 'harlow' ) }
						value={ type }
						options={ [
							{ value: 'youtube', label: 'YouTube' },
							{ value: 'vimeo', label: 'Vimeo' },
							{ value: 'dailymotion', label: 'Dailymotion' },
							{
								value: 'hosted',
								label: __( 'Self hosted', 'harlow' ),
							},
						] }
						onChange={ set( 'videoType' ) }
					/>
					{ type !== 'hosted' && (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Link', 'harlow' ) }
							value={ attributes[ `${ type }Url` ] }
							onChange={ set( `${ type }Url` ) }
						/>
					) }
					{ type === 'hosted' && (
						<>
							{ toggle(
								'insertUrl',
								__( 'External URL', 'harlow' )
							) }
							{ attributes.insertUrl ? (
								<TextControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ __( 'URL', 'harlow' ) }
									value={ attributes.externalUrl }
									onChange={ set( 'externalUrl' ) }
								/>
							) : (
								<VideoPicker
									value={ attributes.hostedVideo }
									onChange={ set( 'hostedVideo' ) }
								/>
							) }
						</>
					) }
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						min="0"
						label={ __( 'Start time (seconds)', 'harlow' ) }
						value={ attributes.start }
						onChange={ set( 'start' ) }
					/>
					{ ( type === 'youtube' || type === 'hosted' ) && (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							type="number"
							min="0"
							label={ __( 'End time (seconds)', 'harlow' ) }
							value={ attributes.end }
							onChange={ set( 'end' ) }
						/>
					) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Aspect ratio', 'harlow' ) }
						value={ attributes.aspectRatio }
						options={ [
							{ value: '169', label: '16:9' },
							{ value: '219', label: '21:9' },
							{ value: '43', label: '4:3' },
							{ value: '32', label: '3:2' },
							{ value: '11', label: '1:1' },
							{ value: '916', label: '9:16' },
						] }
						onChange={ set( 'aspectRatio' ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Video Options', 'harlow' ) }
					initialOpen={ false }
				>
					{ toggle( 'autoplay', __( 'Autoplay', 'harlow' ) ) }
					{ toggle(
						'playOnMobile',
						__( 'Play on mobile', 'harlow' )
					) }
					{ toggle( 'mute', __( 'Mute', 'harlow' ) ) }
					{ toggle( 'loop', __( 'Loop', 'harlow' ) ) }
					{ type !== 'vimeo' &&
						toggle(
							'controls',
							__( 'Player controls', 'harlow' )
						) }
					{ type === 'dailymotion' &&
						toggle( 'showinfo', __( 'Video info', 'harlow' ) ) }
					{ type === 'youtube' &&
						toggle(
							'modestbranding',
							__( 'Modest branding', 'harlow' )
						) }
					{ type === 'dailymotion' &&
						toggle( 'logo', __( 'Logo', 'harlow' ) ) }
					{ ( type === 'vimeo' || type === 'dailymotion' ) && (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Controls color', 'harlow' ) }
							help={ __(
								'A hex colour, such as #0165a1.',
								'harlow'
							) }
							value={ attributes.color }
							onChange={ set( 'color' ) }
						/>
					) }
					{ type === 'youtube' &&
						toggle( 'ytPrivacy', __( 'Privacy mode', 'harlow' ) ) }
					{ type !== 'hosted' &&
						toggle( 'lazyLoad', __( 'Lazy load', 'harlow' ) ) }
					{ type === 'youtube' && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Suggested videos', 'harlow' ) }
							value={ attributes.rel }
							options={ [
								{
									value: '',
									label: __(
										'Current video channel',
										'harlow'
									),
								},
								{
									value: 'yes',
									label: __( 'Any video', 'harlow' ),
								},
							] }
							onChange={ set( 'rel' ) }
						/>
					) }
					{ type === 'vimeo' && (
						<>
							{ toggle(
								'vimeoTitle',
								__( 'Intro title', 'harlow' )
							) }
							{ toggle(
								'vimeoPortrait',
								__( 'Intro portrait', 'harlow' )
							) }
							{ toggle(
								'vimeoByline',
								__( 'Intro byline', 'harlow' )
							) }
						</>
					) }
					{ type === 'hosted' && (
						<>
							{ toggle(
								'downloadButton',
								__( 'Download button', 'harlow' )
							) }
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Preload', 'harlow' ) }
								value={ attributes.preload }
								options={ [
									{
										value: 'metadata',
										label: __( 'Metadata', 'harlow' ),
									},
									{
										value: 'auto',
										label: __( 'Auto', 'harlow' ),
									},
									{
										value: 'none',
										label: __( 'None', 'harlow' ),
									},
								] }
								onChange={ set( 'preload' ) }
							/>
							<PicturePicker
								label={ __( 'Poster', 'harlow' ) }
								value={ attributes.poster }
								onChange={ set( 'poster' ) }
								none={ __( 'No poster', 'harlow' ) }
							/>
						</>
					) }
				</PanelBody>
				<PanelBody
					title={ __( 'Image Overlay', 'harlow' ) }
					initialOpen={ false }
				>
					{ toggle(
						'showImageOverlay',
						__( 'Image overlay', 'harlow' )
					) }
					{ attributes.showImageOverlay && (
						<>
							<PicturePicker
								label={ __( 'Choose image', 'harlow' ) }
								value={ attributes.imageOverlay }
								onChange={ set( 'imageOverlay' ) }
								none={ __( 'No picture chosen', 'harlow' ) }
							/>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Image size', 'harlow' ) }
								value={ attributes.imageOverlaySize }
								options={ SIZES }
								onChange={ set( 'imageOverlaySize' ) }
							/>
							{ toggle(
								'showPlayIcon',
								__( 'Play icon', 'harlow' )
							) }
							{ attributes.showPlayIcon && (
								<IconPicker
									allowNone
									noneLabel={ __( 'Default', 'harlow' ) }
									value={ attributes.playIcon }
									onChange={ set( 'playIcon' ) }
								/>
							) }
							{ toggle( 'lightbox', __( 'Lightbox', 'harlow' ) ) }
							{ attributes.lightbox && (
								<SelectControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ __(
										'Lightbox entrance animation',
										'harlow'
									) }
									value={ attributes.lightboxAnimation }
									options={ ANIMATIONS }
									onChange={ set( 'lightboxAnimation' ) }
								/>
							) }
						</>
					) }
				</PanelBody>
			</InspectorControls>
			<ServerMarkup
				name="harlow/video"
				attributes={ attributes }
				onMarkup={ onMarkup }
			/>
		</>
	);
}
