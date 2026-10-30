/**
 * The site's header or footer inside a page (the home page's), as the server prints it:
 * their logo, menus and words are kept in Appearance → Customize and Menus. The header
 * bar follows the canvas's scrolling as assets/js/header.js makes it follow the page's.
 */
import { InspectorControls } from '@wordpress/block-editor';
import { ExternalLink, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { ServerMarkup } from '../../editor/shared';

/**
 * header.js: past 200px of scroll the bar turns brand blue and the logo shrinks.
 *
 * @param {Element} el The header's element.
 * @return {Function|undefined} Stops following.
 */
function followScroll( el ) {
	const header = el.querySelector( '#nav-header' );
	if ( ! header ) {
		return;
	}
	const view = el.ownerDocument.defaultView;
	const logo = header.querySelector( '.logo' );
	const brand =
		view
			.getComputedStyle( el.ownerDocument.documentElement )
			.getPropertyValue( '--hl-color-primary' )
			.trim() || '#0165A1';
	const onScroll = () => {
		const past = view.scrollY >= 200;
		header.style.backgroundColor = past ? brand : '#0165A100';
		if ( logo ) {
			logo.style.width = past ? '125px' : '165px';
		}
	};
	view.addEventListener( 'scroll', onScroll, { passive: true } );
	return () => view.removeEventListener( 'scroll', onScroll );
}

export default function Edit( { attributes } ) {
	return (
		<>
			<InspectorControls>
				<PanelBody>
					<p>
						{ 'footer' === attributes.part
							? __(
									'The site’s footer, the same on every page.',
									'harlow'
								)
							: __(
									'The site’s header, the same on every page.',
									'harlow'
								) }
					</p>
					<p>
						<ExternalLink href="customize.php">
							{ __(
								'Edit it in Appearance → Customize',
								'harlow'
							) }
						</ExternalLink>
					</p>
				</PanelBody>
			</InspectorControls>
			<ServerMarkup
				name="harlow/site-part"
				attributes={ attributes }
				onMarkup={ followScroll }
			/>
		</>
	);
}
