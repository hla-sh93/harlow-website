/**
 * A list of items in the editor: the server's markup of includes/sections/loop.php (the
 * items are kept in their own screens); which items, how many and in what order in the
 * sidebar. A carousel gets the slide widths assets/js/carousel.js gives it on the page.
 */
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl, SelectControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { ServerMarkup } from '../../editor/shared';

const TYPES = [
	{ value: 'post', label: __( 'Posts', 'harlow' ), card: 'post-card' },
	{ value: 'news', label: __( 'News', 'harlow' ), card: 'post-card' },
	{
		value: 'albahoo_project',
		label: __( 'Projects', 'harlow' ),
		card: 'project',
	},
	{
		value: 'gallery_item',
		label: __( 'Gallery', 'harlow' ),
		card: 'gallery-item',
	},
	{ value: 'job', label: __( 'Jobs', 'harlow' ), card: 'job' },
	{
		value: 'business_model',
		label: __( 'Business models', 'harlow' ),
		card: 'business-model',
	},
	{
		value: 'harlows_person',
		label: __( 'Harlow’s people', 'harlow' ),
		card: 'person',
	},
	{
		value: 'testimonial',
		label: __( 'Testimonials', 'harlow' ),
		card: 'testimonial',
	},
	{
		value: 'client_logo',
		label: __( 'Client logos', 'harlow' ),
		card: 'client-logo',
	},
];

/**
 * The slide widths of a carousel, as carousel.js sets them on the page before its first
 * move (the loop's copies aside: they sit outside the view).
 *
 * @param {Element} widget The list's element.
 */
function sizeSlides( widget ) {
	const container = widget.querySelector( '.swiper' );
	const slides = container
		? [ ...container.querySelectorAll( '.swiper-wrapper > .swiper-slide' ) ]
		: [];
	if ( slides.length < 2 ) {
		return;
	}
	let s;
	try {
		s = JSON.parse( widget.dataset.settings || '{}' );
	} catch {
		return;
	}
	const view = widget.ownerDocument.defaultView;
	let device = 'desktop';
	if ( view.matchMedia( '(max-width: 767px)' ).matches ) {
		device = 'mobile';
	} else if ( view.matchMedia( '(max-width: 1024px)' ).matches ) {
		device = 'tablet';
	}
	const show = +s.slides_to_show || 3;
	const offset = s.offset_sides === 'right' || s.offset_sides === 'both';
	const perView = {
		mobile: +s.slides_to_show_mobile || 1,
		tablet: +s.slides_to_show_tablet || ( show === 1 ? 1 : 2 ),
		desktop: show + ( offset ? 0.001 : 0 ),
	}[ device ];
	const devices = [ 'desktop', 'tablet', 'mobile' ];
	let space = 0;
	for ( let i = devices.indexOf( device ); i >= 0; i -= 1 ) {
		const v =
			s[
				i === 0
					? 'image_spacing_custom'
					: `image_spacing_custom_${ devices[ i ] }`
			];
		const size = v && typeof v === 'object' ? v.size : v;
		if ( size !== undefined && size !== '' && size !== null ) {
			space = Number( size ) || 0;
			break;
		}
	}
	if ( s.offset_sides && s.offset_sides !== 'none' ) {
		container.classList.add( `offset-${ s.offset_sides }` );
	}
	container.classList.add(
		'swiper-initialized',
		'swiper-horizontal',
		'swiper-pointer-events'
	);
	const cs = view.getComputedStyle( container );
	const inner =
		container.clientWidth -
		parseFloat( cs.paddingLeft ) -
		parseFloat( cs.paddingRight );
	const width = ( inner - ( perView - 1 ) * space ) / perView;
	slides.forEach( ( el, i ) => {
		el.style.width = `${ width }px`;
		el.style.marginRight = `${ space }px`;
		el.classList.toggle( 'swiper-slide-active', i === 0 );
		el.classList.toggle( 'swiper-slide-next', i === 1 );
	} );
}

export default function Edit( { attributes, setAttributes } ) {
	const { postType, layout, perPage, orderby, order } = attributes;
	const onMarkup = useCallback( ( el ) => {
		if ( el.classList.contains( 'elementor-widget-loop-carousel' ) ) {
			sizeSlides( el );
		}
	}, [] );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Items', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Shows', 'harlow' ) }
						value={ postType }
						options={ TYPES }
						onChange={ ( value ) =>
							setAttributes( {
								postType: value,
								template: TYPES.find(
									( t ) => t.value === value
								).card,
							} )
						}
					/>
					{ ! [ 'plain', 'box' ].includes( layout ) && (
						<RangeControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'How many', 'harlow' ) }
							value={ perPage }
							min={ 1 }
							max={ 24 }
							onChange={ ( value ) =>
								setAttributes( { perPage: value } )
							}
						/>
					) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'In the order of', 'harlow' ) }
						value={ `${ orderby } ${ order }` }
						options={ [
							{
								value: 'date DESC',
								label: __( 'Newest first', 'harlow' ),
							},
							{
								value: 'date ASC',
								label: __( 'Oldest first', 'harlow' ),
							},
							{
								value: 'menu_order ASC',
								label: __( 'Their order number', 'harlow' ),
							},
						] }
						onChange={ ( value ) => {
							const [ by, direction ] = value.split( ' ' );
							setAttributes( { orderby: by, order: direction } );
						} }
					/>
				</PanelBody>
			</InspectorControls>
			<ServerMarkup
				name="harlow/loop"
				attributes={ attributes }
				onMarkup={ onMarkup }
			/>
		</>
	);
}
