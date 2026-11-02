/**
 * A container in the editor: the same box as includes/sections/container.php, with the
 * blocks inside it (in its inner box when it is boxed). A background video (a file, or a
 * YouTube or Vimeo address) is sized as assets/js/background-video.js sizes it on the page;
 * its first slideshow picture and its shape dividers are drawn as the page draws them. Its
 * background picture and video, with the video's options, are chosen in the sidebar.
 */
import {
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useLayoutEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import {
	elementProps,
	inContainer,
	linkUrl,
	PicturePicker,
	pictureStyle,
	usePictureUrl,
} from '../../editor/shared';
import { ShapeDivider } from '../../editor/styles';

const RATIO = 16 / 9;

/**
 * Cover the video's box at 16:9 in pixels, and again when the box changes size.
 *
 * @param {Object} box The video's box (a ref).
 * @param {string} src The video, so a new one is sized too.
 */
function useCoverVideo( box, src ) {
	useLayoutEffect( () => {
		const el = box.current;
		if ( ! el ) {
			return;
		}
		const videoEl = el.querySelector( 'video, iframe' );
		const size = () => {
			const w = el.offsetWidth;
			const h = el.offsetHeight;
			if ( ! h ) {
				return;
			}
			const widthFixed = w / h > RATIO;
			videoEl.style.width = `${ widthFixed ? w : h * RATIO }px`;
			videoEl.style.height = `${ widthFixed ? w / RATIO : h }px`;
		};
		size();
		const observer = new el.ownerDocument.defaultView.ResizeObserver(
			size
		);
		observer.observe( el );
		return () => observer.disconnect();
	}, [ box, src ] );
}

/**
 * The sidebar: the background picture (the design's own until one is chosen) and video.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes    The block's attributes.
 * @param {Function} props.setAttributes The block's setter.
 */
function Background( { attributes, setAttributes } ) {
	const { picture, video } = attributes;
	return (
		<InspectorControls>
			<PanelBody
				title={ __( 'Background', 'harlow' ) }
				initialOpen={ false }
			>
				<PicturePicker
					label={ __( 'Background picture', 'harlow' ) }
					value={ picture }
					onChange={ ( id ) => setAttributes( { picture: id } ) }
					none={ __( 'Default', 'harlow' ) }
				/>
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Background video (its address)', 'harlow' ) }
					value={ video }
					onChange={ ( value ) => setAttributes( { video: value } ) }
				/>
				<MediaUploadCheck>
					<MediaUpload
						allowedTypes={ [ 'video' ] }
						onSelect={ ( picked ) =>
							setAttributes( { video: picked.url } )
						}
						render={ ( { open } ) => (
							<Button variant="secondary" onClick={ open }>
								{ __( 'Choose a video', 'harlow' ) }
							</Button>
						) }
					/>
				</MediaUploadCheck>
				{ video && (
					<>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							type="number"
							min={ 0 }
							label={ __(
								'Video starts at (seconds)',
								'harlow'
							) }
							value={ attributes.videoStart }
							onChange={ ( v ) =>
								setAttributes( { videoStart: v } )
							}
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							type="number"
							min={ 0 }
							label={ __( 'Video ends at (seconds)', 'harlow' ) }
							value={ attributes.videoEnd }
							onChange={ ( v ) =>
								setAttributes( { videoEnd: v } )
							}
						/>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Play once', 'harlow' ) }
							checked={ !! attributes.videoOnce }
							onChange={ ( v ) =>
								setAttributes( { videoOnce: v } )
							}
						/>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Play on phones', 'harlow' ) }
							checked={ attributes.videoMobile !== false }
							onChange={ ( v ) =>
								setAttributes( { videoMobile: v } )
							}
						/>
						<PicturePicker
							label={ __(
								'Fallback picture (phones)',
								'harlow'
							) }
							value={ attributes.videoFallback }
							onChange={ ( id ) =>
								setAttributes( { videoFallback: id } )
							}
							none={ __( 'None', 'harlow' ) }
						/>
					</>
				) }
			</PanelBody>
		</InspectorControls>
	);
}

/**
 * The address of a YouTube or Vimeo video as a frame plays it in the background, or ''.
 *
 * @param {string} url The video's address.
 * @return {string} The frame's address.
 */
function embedUrl( url ) {
	const yt = url.match(
		/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
	);
	if ( yt ) {
		return `https://www.youtube-nocookie.com/embed/${ yt[ 1 ] }?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=${ yt[ 1 ] }`;
	}
	const vimeo = url.match( /vimeo\.com\/(?:video\/)?(\d+)/ );
	return vimeo
		? `https://player.vimeo.com/video/${ vimeo[ 1 ] }?background=1&autoplay=1&muted=1&loop=1`
		: '';
}

/**
 * The first picture of a background slideshow, as the page shows it before its script.
 *
 * @param {Object} props
 * @param {Object} props.bg The desktop background.
 */
function Slideshow( { bg } ) {
	const url = usePictureUrl( bg?.slides?.[ 0 ] || 0 );
	if ( bg?.type !== 'slideshow' || ! url ) {
		return null;
	}
	return (
		<div
			className="elementor-background-slideshow"
			aria-hidden="true"
			data-transition={ bg.transition || 'fade' }
		>
			<div className="elementor-background-slideshow__slide is-active">
				<div
					className="elementor-background-slideshow__slide__image"
					style={ {
						backgroundImage: `url("${ url }")`,
						backgroundSize: bg.slideSize || 'cover',
						backgroundPosition: bg.slidePosition || 'center center',
					} }
				/>
			</div>
		</div>
	);
}

export default function Edit( { attributes, setAttributes } ) {
	const { boxed, video, picture, tag } = attributes;
	const style = attributes.style || {};
	// Its HTML tag, as container.php prints it (a link is drawn as a box: a click in the
	// editor selects, it does not leave the page).
	const Tag = [
		'section',
		'header',
		'footer',
		'main',
		'article',
		'aside',
		'nav',
	].includes( tag )
		? tag
		: 'div';
	const videoBox = useRef();
	useCoverVideo( videoBox, video );
	const blockProps = useBlockProps( {
		...elementProps( attributes, 'container' ),
		style: pictureStyle( usePictureUrl( picture ) ),
	} );
	const sidebar = (
		<Background attributes={ attributes } setAttributes={ setAttributes } />
	);
	const innerBlocksProps = useInnerBlocksProps(
		boxed ? { className: 'e-con-inner' } : blockProps,
		{ templateLock: false, allowedBlocks: inContainer() }
	);
	const embed = video ? embedUrl( video ) : '';
	const backgroundVideo = video && (
		<>
			{ '\n' }
			<div
				className="elementor-background-video-container"
				ref={ videoBox }
			>
				{ '\n' }
				{ embed ? (
					<iframe
						className="elementor-background-video-embed"
						title={ __( 'Background video', 'harlow' ) }
						src={ embed }
						allow="autoplay"
						tabIndex={ -1 }
					/>
				) : (
					<video
						className="elementor-background-video-hosted"
						// The page's video, as Elementor marks it up: decoration only.
						// eslint-disable-next-line jsx-a11y/no-interactive-element-to-noninteractive-role
						role="presentation"
						autoPlay
						muted
						playsInline
						loop={ ! attributes.videoOnce }
						src={ linkUrl( video ) }
					/>
				) }
				{ '\n' }
			</div>
		</>
	);
	// The slideshow and shape dividers come after the video, as container.php prints them.
	const extra = (
		<>
			<Slideshow bg={ style.desktop?.background } />
			{ [ 'top', 'bottom' ].map( ( side ) =>
				style.shapes?.[ side ]?.type ? (
					<ShapeDivider
						key={ side }
						side={ side }
						shape={ style.shapes[ side ] }
					/>
				) : null
			) }
		</>
	);
	if ( boxed ) {
		return (
			<>
				{ sidebar }
				<Tag { ...blockProps }>
					{ backgroundVideo }
					{ extra }
					{ '\n' }
					<div { ...innerBlocksProps } />
					{ '\n' }
				</Tag>
			</>
		);
	}
	return (
		<>
			{ sidebar }
			<Tag { ...innerBlocksProps }>
				{ backgroundVideo }
				{ extra }
				{ innerBlocksProps.children }
			</Tag>
		</>
	);
}
