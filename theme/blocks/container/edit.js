/**
 * A container in the editor: the same box as includes/sections/container.php, with the
 * blocks inside it (in its inner box when it is boxed). A background video is sized as
 * assets/js/background-video.js sizes it on the page.
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useLayoutEffect, useRef } from '@wordpress/element';

import { elementProps, IN_CONTAINER, linkUrl } from '../../editor/shared';

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
		const videoEl = el.querySelector( 'video' );
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

export default function Edit( { attributes } ) {
	const { boxed, video } = attributes;
	const videoBox = useRef();
	useCoverVideo( videoBox, video );
	const blockProps = useBlockProps( elementProps( attributes, 'container' ) );
	const innerBlocksProps = useInnerBlocksProps(
		boxed ? { className: 'e-con-inner' } : blockProps,
		{ templateLock: false, allowedBlocks: IN_CONTAINER }
	);
	const backgroundVideo = video && (
		<>
			{ '\n' }
			<div
				className="elementor-background-video-container"
				ref={ videoBox }
			>
				{ '\n' }
				<video
					className="elementor-background-video-hosted"
					// The page's video, as Elementor marks it up: decoration only.
					// eslint-disable-next-line jsx-a11y/no-interactive-element-to-noninteractive-role
					role="presentation"
					autoPlay
					muted
					playsInline
					loop
					src={ linkUrl( video ) }
				/>
				{ '\n' }
			</div>
		</>
	);
	if ( boxed ) {
		return (
			<div { ...blockProps }>
				{ backgroundVideo }
				{ '\n' }
				<div { ...innerBlocksProps } />
				{ '\n' }
			</div>
		);
	}
	return (
		<div { ...innerBlocksProps }>
			{ backgroundVideo }
			{ innerBlocksProps.children }
		</div>
	);
}
