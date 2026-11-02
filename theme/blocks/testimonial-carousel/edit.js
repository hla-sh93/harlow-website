/**
 * A testimonial carousel in the editor: includes/sections/testimonial-carousel.php. The
 * slides are a list in the sidebar (words, picture, name, title), their words also typed
 * in place; the skin, layout, slides per view and the carousel's options in the sidebar.
 * The canvas shows the slides as the page lays them out before its script runs; the arrows
 * and dots move them, for a look at the others.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Button,
	Flex,
	PanelBody,
	SelectControl,
	TextareaControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import { elementProps, PicturePicker } from '../../editor/shared';

const CLASSES =
	'elementor-element elementor-widget elementor-widget-testimonial-carousel';
const DEVICES = [
	[ '', __( 'Desktop', 'harlow' ), '', '' ],
	[ 'Tablet', __( 'Tablet', 'harlow' ), '_tablet', '-tablet' ],
	[ 'Mobile', __( 'Mobile', 'harlow' ), '_mobile', '-mobile' ],
];
export const SIZES = [
	{ value: 'thumbnail', label: __( 'Thumbnail', 'harlow' ) },
	{ value: 'medium', label: __( 'Medium', 'harlow' ) },
	{ value: 'medium_large', label: __( 'Medium large', 'harlow' ) },
	{ value: 'large', label: __( 'Large', 'harlow' ) },
	{ value: 'full', label: __( 'Full', 'harlow' ) },
];
const ARROWS = {
	prev: '<svg aria-hidden="true" class="e-font-icon-svg e-eicon-chevron-left" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M646 125C629 125 613 133 604 142L308 442C296 454 292 471 292 487 292 504 296 521 308 533L604 854C617 867 629 875 646 875 663 875 679 871 692 858 704 846 713 829 713 812 713 796 708 779 692 767L438 487 692 225C700 217 708 204 708 187 708 171 704 154 692 142 675 129 663 125 646 125Z"></path></svg>',
	next: '<svg aria-hidden="true" class="e-font-icon-svg e-eicon-chevron-right" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M696 533C708 521 713 504 713 487 713 471 708 454 696 446L400 146C388 133 375 125 354 125 338 125 325 129 313 142 300 154 292 171 292 187 292 204 296 221 308 233L563 492 304 771C292 783 288 800 288 817 288 833 296 850 308 863 321 871 338 875 354 875 371 875 388 867 400 854L696 533Z"></path></svg>',
};

/**
 * A number of a responsive setting (harlow_testimonial_carousel_number()).
 *
 * @param {Object}  attributes The block's attributes.
 * @param {string}  name       The attribute.
 * @param {string}  device     '', 'Tablet' or 'Mobile'.
 * @param {number}  fallback   What to use when no device has one.
 * @param {boolean} inherit    Whether a device without its own takes the larger device's.
 * @return {number} The number.
 */
function deviceNumber( attributes, name, device, fallback, inherit = true ) {
	const order = [ 'Mobile', 'Tablet', '' ];
	const chain = inherit ? order.slice( order.indexOf( device ) ) : [ device ];
	for ( const one of chain ) {
		const value = attributes[ name + one ];
		if (
			value !== '' &&
			value !== undefined &&
			value !== null &&
			! isNaN( Number( value ) )
		) {
			return Number( value );
		}
	}
	return fallback;
}

/**
 * The carousel's settings and custom properties (harlow_testimonial_carousel_settings()).
 *
 * @param {Object}   attributes The block's attributes.
 * @param {number}   count      How many slides.
 * @param {number[]} views      Slides per view when none is set: desktop, tablet, mobile.
 * @return {Object} { settings, style }.
 */
export function carouselSettings( attributes, count, views ) {
	const settings = {};
	const style = {};
	DEVICES.forEach( ( [ device, , suffix, css ], i ) => {
		const view = Math.max(
			1,
			Math.min(
				10,
				Math.max( 1, count ),
				Math.trunc(
					deviceNumber(
						attributes,
						'slidesPerView',
						device,
						views[ i ],
						false
					)
				)
			)
		);
		const space = Math.max(
			0,
			Math.min(
				200,
				deviceNumber( attributes, 'spaceBetween', device, 10 )
			)
		);
		const step = Math.trunc(
			deviceNumber( attributes, 'slidesToScroll', device, 1 )
		);
		settings[ `slides_per_view${ suffix }` ] = `${ view }`;
		settings[ `slides_to_scroll${ suffix }` ] = `${ Math.max(
			1,
			Math.min( 10, step )
		) }`;
		settings[ `space_between${ suffix }` ] = { unit: 'px', size: space };
		style[ `--e-slides-per-view${ css }` ] = view;
		style[ `--e-space-between${ css }` ] = `${ space }px`;
	} );
	settings.show_arrows = attributes.showArrows ? 'yes' : '';
	settings.pagination = [ 'bullets', 'fraction', 'progressbar' ].includes(
		attributes.pagination
	)
		? attributes.pagination
		: '';
	settings.speed = Math.max( 0, Math.min( 10000, attributes.speed || 0 ) );
	settings.autoplay = attributes.autoplay ? 'yes' : '';
	settings.autoplay_speed = Math.max(
		0,
		Math.min( 60000, attributes.autoplaySpeed || 0 )
	);
	settings.loop = attributes.loop ? 'yes' : '';
	settings.pause_on_hover = attributes.pauseOnHover ? 'yes' : '';
	settings.pause_on_interaction = attributes.pauseOnInteraction ? 'yes' : '';
	const width = `${ attributes.width ?? '' }`.trim();
	if ( width !== '' && ! isNaN( Number( width ) ) ) {
		const unit = [ 'px', '%', 'vw' ].includes( attributes.widthUnit )
			? attributes.widthUnit
			: '%';
		style.width = attributes.showArrows
			? `calc(${ Number( width ) }${ unit } - 40px)`
			: `${ Number( width ) }${ unit }`;
	}
	return { settings, style };
}

/**
 * The element's props with the carousel's classes and settings
 * (harlow_testimonial_carousel_element()).
 *
 * @param {Object}   attributes The block's attributes.
 * @param {string}   classes    Elementor's classes when the block has none.
 * @param {Object}   settings   The carousel's settings.
 * @param {string[]} own        The widget's own classes.
 * @return {Object} Attributes to print the element with.
 */
export function carouselElement( attributes, classes, settings, own ) {
	const extra = [ ...own, 'e-widget-swiper' ];
	if ( settings.show_arrows === 'yes' ) {
		extra.push( 'elementor-arrows-yes' );
	}
	if ( settings.pagination ) {
		extra.push( `elementor-pagination-type-${ settings.pagination }` );
	}
	let saved = {};
	try {
		saved = attributes.settings ? JSON.parse( attributes.settings ) : {};
	} catch {
		saved = {};
	}
	return {
		...attributes,
		classes: `${ attributes.classes || classes } ${ extra.join( ' ' ) }`,
		settings: JSON.stringify( { ...saved, ...settings } ),
	};
}

/**
 * The address of a picture of the Media Library at one of its sizes.
 *
 * @param {number[]} ids  The pictures.
 * @param {string}   size The size's name.
 * @return {Object} id -> address.
 */
export function usePictures( ids, size ) {
	const key = ids.join( ',' );
	return useSelect(
		( select ) => {
			const out = {};
			ids.forEach( ( id ) => {
				const media = id
					? select( coreStore ).getEntityRecord(
							'postType',
							'attachment',
							id
						)
					: null;
				if ( media ) {
					out[ id ] =
						media.media_details?.sizes?.[ size ]?.source_url ||
						media.source_url;
				}
			} );
			return out;
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ key, size ]
	);
}

/**
 * The lines of a list in the sidebar, one panel each, with add, move and remove.
 *
 * @param {Object}   props
 * @param {Object[]} props.items    The lines.
 * @param {Function} props.onChange Called with the new lines.
 * @param {Object}   props.blank    A new line.
 * @param {Function} props.title    The panel's title of a line: ( item, index ) => string.
 * @param {string}   props.add      The add button's words.
 * @param {Function} props.children The fields of a line: ( item, change ) => elements.
 */
export function Repeater( { items, onChange, blank, title, add, children } ) {
	const change = ( index, patch ) =>
		onChange(
			items.map( ( item, i ) =>
				i === index ? { ...item, ...patch } : item
			)
		);
	const move = ( index, by ) => {
		const next = [ ...items ];
		const [ item ] = next.splice( index, 1 );
		next.splice( index + by, 0, item );
		onChange( next );
	};
	return (
		<>
			{ items.map( ( item, index ) => (
				<PanelBody
					key={ index }
					title={ title( item, index ) }
					initialOpen={ false }
				>
					{ children( item, ( patch ) => change( index, patch ) ) }
					<Flex justify="flex-start" wrap>
						<Button
							variant="secondary"
							size="small"
							disabled={ index === 0 }
							onClick={ () => move( index, -1 ) }
						>
							{ __( 'Move up', 'harlow' ) }
						</Button>
						<Button
							variant="secondary"
							size="small"
							disabled={ index === items.length - 1 }
							onClick={ () => move( index, 1 ) }
						>
							{ __( 'Move down', 'harlow' ) }
						</Button>
						<Button
							variant="secondary"
							size="small"
							onClick={ () =>
								onChange( [
									...items.slice( 0, index + 1 ),
									{ ...item },
									...items.slice( index + 1 ),
								] )
							}
						>
							{ __( 'Duplicate', 'harlow' ) }
						</Button>
						<Button
							variant="secondary"
							size="small"
							isDestructive
							onClick={ () =>
								onChange(
									items.filter( ( x, i ) => i !== index )
								)
							}
						>
							{ __( 'Remove', 'harlow' ) }
						</Button>
					</Flex>
				</PanelBody>
			) ) }
			<PanelBody>
				<Button
					variant="secondary"
					onClick={ () => onChange( [ ...items, { ...blank } ] ) }
				>
					{ add }
				</Button>
			</PanelBody>
		</>
	);
}

/**
 * A number for each device (desktop, tablet, mobile); empty for the default.
 *
 * @param {Object}   props
 * @param {string}   props.label         What it is.
 * @param {string}   props.name          The attribute (its device's has the device's name).
 * @param {Object}   props.attributes    The block's attributes.
 * @param {Function} props.setAttributes The block's setter.
 * @param {string}   props.help          Help under the fields.
 */
export function DeviceNumbers( {
	label,
	name,
	attributes,
	setAttributes,
	help,
} ) {
	return (
		<fieldset className="harlow-device-numbers">
			<legend>{ label }</legend>
			<Flex align="flex-start">
				{ DEVICES.map( ( [ device, deviceLabel ] ) => (
					<TextControl
						key={ device }
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						min={ 0 }
						label={ deviceLabel }
						value={ attributes[ name + device ] ?? '' }
						onChange={ ( value ) =>
							setAttributes( { [ name + device ]: value } )
						}
					/>
				) ) }
			</Flex>
			{ help && (
				<p className="components-base-control__help">{ help }</p>
			) }
		</fieldset>
	);
}

/**
 * The carousel's options (Elementor's "Additional Options"), shared with the reviews.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes    The block's attributes.
 * @param {Function} props.setAttributes The block's setter.
 */
export function CarouselOptions( { attributes, setAttributes } ) {
	return (
		<PanelBody
			title={ __( 'Additional options', 'harlow' ) }
			initialOpen={ false }
		>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Arrows', 'harlow' ) }
				checked={ attributes.showArrows }
				onChange={ ( value ) => setAttributes( { showArrows: value } ) }
			/>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Pagination', 'harlow' ) }
				value={ attributes.pagination }
				options={ [
					{ value: '', label: __( 'None', 'harlow' ) },
					{ value: 'bullets', label: __( 'Dots', 'harlow' ) },
					{ value: 'fraction', label: __( 'Fraction', 'harlow' ) },
					{
						value: 'progressbar',
						label: __( 'Progress', 'harlow' ),
					},
				] }
				onChange={ ( value ) => setAttributes( { pagination: value } ) }
			/>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				type="number"
				min={ 0 }
				label={ __( 'Transition duration (ms)', 'harlow' ) }
				value={ attributes.speed }
				onChange={ ( value ) =>
					setAttributes( { speed: Number( value ) || 0 } )
				}
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Autoplay', 'harlow' ) }
				checked={ attributes.autoplay }
				onChange={ ( value ) => setAttributes( { autoplay: value } ) }
			/>
			{ attributes.autoplay && (
				<>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						min={ 0 }
						label={ __( 'Autoplay speed (ms)', 'harlow' ) }
						value={ attributes.autoplaySpeed }
						onChange={ ( value ) =>
							setAttributes( {
								autoplaySpeed: Number( value ) || 0,
							} )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Pause on hover', 'harlow' ) }
						checked={ attributes.pauseOnHover }
						onChange={ ( value ) =>
							setAttributes( { pauseOnHover: value } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Pause on interaction', 'harlow' ) }
						checked={ attributes.pauseOnInteraction }
						onChange={ ( value ) =>
							setAttributes( { pauseOnInteraction: value } )
						}
					/>
				</>
			) }
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Infinite loop', 'harlow' ) }
				checked={ attributes.loop }
				onChange={ ( value ) => setAttributes( { loop: value } ) }
			/>
			<DeviceNumbers
				label={ __( 'Space between slides (px)', 'harlow' ) }
				name="spaceBetween"
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		</PanelBody>
	);
}

/**
 * The carousel around its slides in the canvas: the same elements as
 * harlow_testimonial_carousel_markup(), the dots drawn as the page's script draws them,
 * the arrows and dots moving the slides.
 *
 * @param {Object} props
 * @param {Object} props.settings The carousel's settings.
 * @param {Object} props.style    The carousel's custom properties.
 * @param {Array}  props.slides   Each slide's inside.
 */
export function CarouselFrame( { settings, style, slides } ) {
	const [ index, setIndex ] = useState( 0 );
	const count = slides.length;
	const view = Number( settings.slides_per_view ) || 1;
	const step = Number( settings.slides_to_scroll ) || 1;
	const last =
		settings.loop === 'yes' ? count - 1 : Math.max( 0, count - view );
	const at = Math.min( index, last );
	const positions = Math.max( 1, Math.ceil( last / step ) + 1 );
	const active = Math.min( positions - 1, Math.ceil( at / step ) );
	const go = ( to ) =>
		setIndex( Math.max( 0, Math.min( last, Math.round( to ) ) ) );
	return (
		<div
			className="elementor-main-swiper swiper"
			role="region"
			aria-roledescription="carousel"
			aria-label={ __( 'Slides', 'harlow' ) }
			style={ style }
		>
			<div
				className="swiper-wrapper"
				style={
					at
						? {
								transform: `translateX(calc(${ -at } * (100% + var(--harlow-carousel-space, 10px)) / var(--harlow-carousel-view, 1)))`,
							}
						: undefined
				}
			>
				{ slides.map( ( slide, i ) => (
					<div
						key={ i }
						className="swiper-slide"
						role="group"
						aria-roledescription="slide"
						aria-label={ sprintf(
							/* translators: 1: the slide's number, 2: how many slides. */
							__( '%1$s of %2$s', 'harlow' ),
							i + 1,
							count
						) }
					>
						{ slide }
					</div>
				) ) }
			</div>
			{ count > 1 && settings.pagination === 'bullets' && (
				<div className="swiper-pagination swiper-pagination-clickable swiper-pagination-bullets swiper-pagination-horizontal">
					{ Array.from( { length: positions } ).map( ( x, i ) => (
						<span
							key={ i }
							className={ `swiper-pagination-bullet${
								i === active
									? ' swiper-pagination-bullet-active'
									: ''
							}` }
							role="button"
							tabIndex={ 0 }
							aria-label={ sprintf(
								/* translators: %d: the slide's number. */
								__( 'Go to slide %d', 'harlow' ),
								i + 1
							) }
							onClick={ () => go( i * step ) }
							onKeyDown={ () => go( i * step ) }
						/>
					) ) }
				</div>
			) }
			{ count > 1 && settings.pagination === 'fraction' && (
				<div className="swiper-pagination swiper-pagination-fraction swiper-pagination-horizontal">
					<span className="swiper-pagination-current">
						{ active + 1 }
					</span>
					{ ' / ' }
					<span className="swiper-pagination-total">
						{ positions }
					</span>
				</div>
			) }
			{ count > 1 && settings.pagination === 'progressbar' && (
				<div className="swiper-pagination swiper-pagination-progressbar swiper-pagination-horizontal">
					<span
						className="swiper-pagination-progressbar-fill"
						style={ {
							transform: `translate3d(0px, 0px, 0px) scaleX(${
								( active + 1 ) / positions
							}) scaleY(1)`,
						} }
					/>
				</div>
			) }
			{ count > 1 && settings.show_arrows === 'yes' && (
				<>
					<div
						className="elementor-swiper-button elementor-swiper-button-prev"
						role="button"
						tabIndex={ 0 }
						aria-label={ __( 'Previous', 'harlow' ) }
						onClick={ () => go( at - step ) }
						onKeyDown={ () => go( at - step ) }
						dangerouslySetInnerHTML={ { __html: ARROWS.prev } }
					/>
					<div
						className="elementor-swiper-button elementor-swiper-button-next"
						role="button"
						tabIndex={ 0 }
						aria-label={ __( 'Next', 'harlow' ) }
						onClick={ () => go( at >= last ? 0 : at + step ) }
						onKeyDown={ () => go( at >= last ? 0 : at + step ) }
						dangerouslySetInnerHTML={ { __html: ARROWS.next } }
					/>
				</>
			) }
		</div>
	);
}

export default function Edit( { attributes, setAttributes } ) {
	const { slides, skin, align, imageSize } = attributes;
	const layout = skin === 'bubble' ? 'image_inline' : attributes.layout;
	const outside = [ 'image_above', 'image_left', 'image_right' ].includes(
		layout
	);
	const { settings, style } = carouselSettings(
		attributes,
		slides.length,
		[ 1, 1, 1 ]
	);
	const blockProps = useBlockProps(
		elementProps(
			carouselElement( attributes, CLASSES, settings, [
				`elementor-testimonial--skin-${ skin }`,
				`elementor-testimonial--layout-${ layout }`,
				`elementor-testimonial--align-${ align }`,
			] ),
			'widget',
			'testimonial-carousel.default'
		)
	);
	const pictures = usePictures(
		slides.map( ( slide ) => slide.image || 0 ),
		imageSize
	);
	const setSlides = ( next ) => setAttributes( { slides: next } );
	const changeSlide = ( index, patch ) =>
		setSlides(
			slides.map( ( slide, i ) =>
				i === index ? { ...slide, ...patch } : slide
			)
		);
	const cite = ( slide, index ) => (
		<cite className="elementor-testimonial__cite">
			<RichText
				tagName="span"
				className="elementor-testimonial__name"
				value={ slide.name || '' }
				onChange={ ( value ) => changeSlide( index, { name: value } ) }
				allowedFormats={ [] }
				placeholder={ __( 'Name', 'harlow' ) }
			/>
			<RichText
				tagName="span"
				className="elementor-testimonial__title"
				value={ slide.title || '' }
				onChange={ ( value ) => changeSlide( index, { title: value } ) }
				allowedFormats={ [] }
				placeholder={ __( 'Title', 'harlow' ) }
			/>
		</cite>
	);
	const items = slides.map( ( slide, index ) => (
		<div className="elementor-testimonial" key={ index }>
			<div className="elementor-testimonial__content">
				<RichText
					tagName="div"
					className="elementor-testimonial__text"
					value={ slide.content || '' }
					onChange={ ( value ) =>
						changeSlide( index, { content: value } )
					}
					allowedFormats={ [
						'core/bold',
						'core/italic',
						'core/link',
					] }
					placeholder={ __( 'What they said', 'harlow' ) }
				/>
				{ outside && cite( slide, index ) }
			</div>
			<div className="elementor-testimonial__footer">
				{ pictures[ slide.image ] && (
					<div className="elementor-testimonial__image">
						<img
							src={ pictures[ slide.image ] }
							alt={ ( slide.name || '' ).replace(
								/<[^>]*>/g,
								''
							) }
						/>
					</div>
				) }
				{ ! outside && cite( slide, index ) }
			</div>
		</div>
	) );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Slides', 'harlow' ) }>
					<p>
						{ __(
							'Each slide below; its words are also typed in place.',
							'harlow'
						) }
					</p>
				</PanelBody>
				<Repeater
					items={ slides }
					onChange={ setSlides }
					blank={ {
						content: '',
						image: 0,
						name: 'John Doe',
						title: 'CEO',
					} }
					title={ ( slide, index ) =>
						( slide.name || '' ).replace( /<[^>]*>/g, '' ) ||
						sprintf(
							/* translators: %d: the slide's number. */
							__( 'Slide %d', 'harlow' ),
							index + 1
						)
					}
					add={ __( 'Add a slide', 'harlow' ) }
				>
					{ ( slide, change ) => (
						<>
							<TextareaControl
								__nextHasNoMarginBottom
								label={ __( 'Content', 'harlow' ) }
								value={ slide.content || '' }
								onChange={ ( value ) =>
									change( { content: value } )
								}
							/>
							<PicturePicker
								label={ __( 'Image', 'harlow' ) }
								value={ slide.image || 0 }
								onChange={ ( value ) =>
									change( { image: value } )
								}
								none={ __( 'No picture', 'harlow' ) }
							/>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Name', 'harlow' ) }
								value={ slide.name || '' }
								onChange={ ( value ) =>
									change( { name: value } )
								}
							/>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Title', 'harlow' ) }
								value={ slide.title || '' }
								onChange={ ( value ) =>
									change( { title: value } )
								}
							/>
						</>
					) }
				</Repeater>
				<PanelBody
					title={ __( 'Layout', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Skin', 'harlow' ) }
						value={ skin }
						options={ [
							{
								value: 'default',
								label: __( 'Default', 'harlow' ),
							},
							{
								value: 'bubble',
								label: __( 'Bubble', 'harlow' ),
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { skin: value } )
						}
					/>
					{ skin !== 'bubble' && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Layout', 'harlow' ) }
							value={ attributes.layout }
							options={ [
								{
									value: 'image_inline',
									label: __( 'Image Inline', 'harlow' ),
								},
								{
									value: 'image_stacked',
									label: __( 'Image Stacked', 'harlow' ),
								},
								{
									value: 'image_above',
									label: __( 'Image Above', 'harlow' ),
								},
								{
									value: 'image_left',
									label: __( 'Image Left', 'harlow' ),
								},
								{
									value: 'image_right',
									label: __( 'Image Right', 'harlow' ),
								},
							] }
							onChange={ ( value ) =>
								setAttributes( { layout: value } )
							}
						/>
					) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Alignment', 'harlow' ) }
						value={ align }
						options={ [
							{ value: 'left', label: __( 'Left', 'harlow' ) },
							{
								value: 'center',
								label: __( 'Center', 'harlow' ),
							},
							{ value: 'right', label: __( 'Right', 'harlow' ) },
						] }
						onChange={ ( value ) =>
							setAttributes( { align: value } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Image resolution', 'harlow' ) }
						value={ imageSize }
						options={ SIZES }
						onChange={ ( value ) =>
							setAttributes( { imageSize: value } )
						}
					/>
					<DeviceNumbers
						label={ __( 'Slides per view', 'harlow' ) }
						name="slidesPerView"
						attributes={ attributes }
						setAttributes={ setAttributes }
						help={ __( 'Empty: 1 on every device.', 'harlow' ) }
					/>
					<DeviceNumbers
						label={ __( 'Slides to scroll', 'harlow' ) }
						name="slidesToScroll"
						attributes={ attributes }
						setAttributes={ setAttributes }
					/>
					<Flex align="flex-end">
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							type="number"
							min={ 0 }
							label={ __( 'Width', 'harlow' ) }
							value={ attributes.width }
							onChange={ ( value ) =>
								setAttributes( { width: value } )
							}
						/>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Unit', 'harlow' ) }
							value={ attributes.widthUnit }
							options={ [
								{ value: '%', label: '%' },
								{ value: 'px', label: 'px' },
								{ value: 'vw', label: 'vw' },
							] }
							onChange={ ( value ) =>
								setAttributes( { widthUnit: value } )
							}
						/>
					</Flex>
				</PanelBody>
				<CarouselOptions
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
			</InspectorControls>
			<div { ...blockProps }>
				{ slides.length > 0 && (
					<div className="elementor-widget-container">
						<CarouselFrame
							settings={ settings }
							style={ style }
							slides={ items }
						/>
					</div>
				) }
			</div>
		</>
	);
}
