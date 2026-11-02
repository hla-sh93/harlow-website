/**
 * A list of items in the editor: the server's markup of includes/sections/loop.php (the
 * items are kept in their own screens); which items, how many and in what order in the
 * sidebar, and the parts of the cards the list sets (the button's words and arrow, the
 * badge picture, a carousel's arrows). A carousel gets the slide widths
 * assets/js/carousel.js gives it on the page.
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { IconPicker, PicturePicker, ServerMarkup } from '../../editor/shared';

/** Each card's own button words (includes/loops/), and the parts a list sets on it. */
const CARDS = {
	'post-card': {
		more: __( 'Read More', 'harlow' ),
		badge: true,
		arrow: true,
	},
	'business-model': { more: __( 'Read More', 'harlow' ), arrow: true },
	project: { more: __( 'Read More', 'harlow' ) },
	person: { more: __( 'Read More', 'harlow' ) },
	job: { more: __( 'Apply Now', 'harlow' ) },
};

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

/**
 * A carousel's settings, kept where assets/js/carousel.js reads them (the widget's
 * settings, as Elementor keeps them): slides per device, space between, autoplay, its
 * speed, pausing, looping.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes    The block's attributes.
 * @param {Function} props.setAttributes Its setter.
 */
function CarouselPanel( { attributes, setAttributes } ) {
	let settings = {};
	try {
		settings = JSON.parse( attributes.settings || '{}' ) || {};
	} catch {
		settings = {};
	}
	const save = ( patch ) => {
		const next = { ...settings, ...patch };
		for ( const [ k, v ] of Object.entries( next ) ) {
			if ( v === '' || v === undefined ) {
				delete next[ k ];
			}
		}
		setAttributes( { settings: JSON.stringify( next ) } );
	};
	const yes = ( key ) => settings[ key ] === 'yes';
	const number = ( key, label, max ) => (
		<RangeControl
			key={ key }
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			value={
				settings[ key ] === undefined || settings[ key ] === ''
					? undefined
					: Number( settings[ key ]?.size ?? settings[ key ] )
			}
			min={ 0 }
			max={ max }
			allowReset
			onChange={ ( v ) =>
				save( { [ key ]: v === undefined ? '' : `${ v }` } )
			}
		/>
	);
	return (
		<PanelBody title={ __( 'Carousel', 'harlow' ) } initialOpen={ false }>
			{ number(
				'slides_to_show',
				__( 'Slides on desktop', 'harlow' ),
				8
			) }
			{ number(
				'slides_to_show_tablet',
				__( 'Slides on tablet', 'harlow' ),
				8
			) }
			{ number(
				'slides_to_show_mobile',
				__( 'Slides on mobile', 'harlow' ),
				8
			) }
			<RangeControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Space between (px)', 'harlow' ) }
				value={ settings.image_spacing_custom?.size }
				min={ 0 }
				max={ 100 }
				allowReset
				onChange={ ( v ) =>
					save( {
						image_spacing_custom:
							v === undefined
								? ''
								: { unit: 'px', size: v, sizes: [] },
					} )
				}
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Autoplay', 'harlow' ) }
				checked={ yes( 'autoplay' ) }
				onChange={ ( on ) => save( { autoplay: on ? 'yes' : '' } ) }
			/>
			{ yes( 'autoplay' ) &&
				number(
					'autoplay_speed',
					__( 'Autoplay speed (ms)', 'harlow' ),
					20000
				) }
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Pause on hover', 'harlow' ) }
				checked={ yes( 'pause_on_hover' ) }
				onChange={ ( on ) =>
					save( { pause_on_hover: on ? 'yes' : '' } )
				}
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Pause on interaction', 'harlow' ) }
				checked={ yes( 'pause_on_interaction' ) }
				onChange={ ( on ) =>
					save( { pause_on_interaction: on ? 'yes' : '' } )
				}
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Infinite loop', 'harlow' ) }
				checked={ yes( 'infinite' ) }
				onChange={ ( on ) => save( { infinite: on ? 'yes' : '' } ) }
			/>
			{ number(
				'speed',
				__( 'Transition duration (ms)', 'harlow' ),
				5000
			) }
		</PanelBody>
	);
}

export default function Edit( { attributes, setAttributes } ) {
	const { postType, layout, perPage, orderby, order, template } = attributes;
	const card = CARDS[ template ];
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
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Card', 'harlow' ) }
						help={ __(
							'A card made in Appearance → Theme Builder (a List card template), or the design’s own.',
							'harlow'
						) }
						value={ attributes.cardTemplate || 0 }
						options={ [
							{ value: 0, label: __( 'Default', 'harlow' ) },
							...( window.harlowEditor?.templates || [] )
								.filter( ( t ) => t.kind === 'loop-item' )
								.map( ( t ) => ( {
									value: t.id,
									label: t.title,
								} ) ),
						] }
						onChange={ ( value ) =>
							setAttributes( { cardTemplate: Number( value ) } )
						}
					/>
				</PanelBody>
				{ layout === 'carousel' && (
					<CarouselPanel
						attributes={ attributes }
						setAttributes={ setAttributes }
					/>
				) }
				{ card && (
					<PanelBody
						title={ __( 'Cards', 'harlow' ) }
						initialOpen={ false }
					>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Words of the button', 'harlow' ) }
							value={ attributes.more }
							placeholder={ card.more }
							onChange={ ( value ) =>
								setAttributes( { more: value } )
							}
						/>
						{ card.arrow && (
							<PicturePicker
								label={ __( 'Arrow of the button', 'harlow' ) }
								value={ attributes.moreArrow }
								onChange={ ( id ) =>
									setAttributes( { moreArrow: id } )
								}
								none={ __( 'Default', 'harlow' ) }
							/>
						) }
						{ card.badge && (
							<PicturePicker
								label={ __( 'Badge on the picture', 'harlow' ) }
								value={ attributes.badge }
								onChange={ ( id ) =>
									setAttributes( { badge: id } )
								}
								none={ __( 'Default', 'harlow' ) }
							/>
						) }
					</PanelBody>
				) }
				{ 'carousel' === layout && (
					<PanelBody
						title={ __( 'Arrows', 'harlow' ) }
						initialOpen={ false }
					>
						<p>{ __( 'Previous', 'harlow' ) }</p>
						<IconPicker
							allowNone
							noneLabel={ __( 'Default', 'harlow' ) }
							value={ attributes.iconPrevious }
							onChange={ ( value ) =>
								setAttributes( { iconPrevious: value } )
							}
						/>
						<p>{ __( 'Next', 'harlow' ) }</p>
						<IconPicker
							allowNone
							noneLabel={ __( 'Default', 'harlow' ) }
							value={ attributes.iconNext }
							onChange={ ( value ) =>
								setAttributes( { iconNext: value } )
							}
						/>
					</PanelBody>
				) }
			</InspectorControls>
			<ServerMarkup
				name="harlow/loop"
				attributes={ attributes }
				onMarkup={ onMarkup }
			/>
		</>
	);
}
