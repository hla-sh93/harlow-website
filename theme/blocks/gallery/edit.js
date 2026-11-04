/**
 * A gallery in the editor: the server's markup of includes/sections/gallery.php (its
 * pictures are the block's own or the item's gallery field, chosen in the item's screen;
 * in an item page template's own screen, the field's name), laid out as
 * assets/js/gallery.js lays it out on the page (that script does not run in the editor):
 * the grid's classes and variables, each picture as its box's background.
 */
import { ServerMarkup, SourceNote } from '../../editor/shared';

const DEVICES = [ 'desktop', 'tablet', 'mobile' ];

/**
 * A setting for a device, falling back to the larger ones (gallery.js's responsive()).
 *
 * @param {Object} settings The widget's settings.
 * @param {string} name     The setting.
 * @param {string} device   The device.
 * @return {*} The value, or undefined.
 */
function responsive( settings, name, device ) {
	for ( let i = DEVICES.indexOf( device ); i >= 0; i -= 1 ) {
		const v = settings[ i === 0 ? name : `${ name }_${ DEVICES[ i ] }` ];
		const size = v && typeof v === 'object' ? v.size : v;
		if ( size !== undefined && size !== '' && size !== null ) {
			return size;
		}
	}
	return undefined;
}

/**
 * The gallery laid out on the canvas, as gallery.js does on the page.
 *
 * @param {Element} widget The widget's element.
 */
function layOut( widget ) {
	const win = widget.ownerDocument.defaultView;
	let settings = {};
	try {
		settings = JSON.parse( widget.dataset.settings || '{}' ) || {};
	} catch {
		settings = {};
	}
	const box = widget.querySelector( '.elementor-gallery__container' );
	if ( ! box ) {
		return;
	}
	const items = [ ...box.querySelectorAll( '.e-gallery-item' ) ];
	box.classList.add(
		'e-gallery-container',
		`e-gallery-${ settings.gallery_layout || 'grid' }`,
		'e-gallery--ltr'
	);
	let device = 'desktop';
	if ( win.matchMedia( '(max-width: 767px)' ).matches ) {
		device = 'mobile';
	} else if ( win.matchMedia( '(max-width: 1024px)' ).matches ) {
		device = 'tablet';
	}
	const columns = +responsive( settings, 'columns', device ) || 3;
	const gap = +responsive( settings, 'gap', device ) || 0;
	const rows = Math.ceil( items.length / columns );
	const [ rw, rh ] = String( settings.aspect_ratio || '16:9' )
		.split( ':' )
		.map( Number );
	box.style.setProperty( '--hgap', `${ gap }px` );
	box.style.setProperty( '--vgap', `${ gap }px` );
	box.style.setProperty( '--animation-duration', '350ms' );
	box.style.setProperty( '--columns', columns );
	box.style.setProperty( '--rows', rows );
	box.style.setProperty( '--aspect-ratio', `${ ( rh / rw ) * 100 }%` );
	items.forEach( ( item, i ) => {
		item.style.setProperty( '--column', i % columns );
		item.style.setProperty( '--row', Math.floor( i / columns ) );
	} );
	box.querySelectorAll( '.e-gallery-image' ).forEach( ( img ) => {
		if ( img.dataset.thumbnail ) {
			img.style.backgroundImage = `url("${ img.dataset.thumbnail }")`;
			img.classList.add( 'e-gallery-image-loaded' );
		}
	} );
	const itemWidth = items.length
		? items[ 0 ].getBoundingClientRect().width
		: 0;
	const total = ( rh / rw ) * itemWidth * rows + gap * ( rows - 1 );
	const width = box.getBoundingClientRect().width;
	if ( width ) {
		box.style.setProperty(
			'--container-aspect-ratio',
			`${ ( total / width ) * 100 }%`
		);
	}
}

export default function Edit( { attributes } ) {
	return attributes.source ? (
		<SourceNote attributes={ attributes } widget="gallery" />
	) : (
		<ServerMarkup
			name="harlow/gallery"
			attributes={ attributes }
			onMarkup={ layOut }
		/>
	);
}
