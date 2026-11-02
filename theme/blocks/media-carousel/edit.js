/**
 * A media carousel in the editor: the server's markup of
 * includes/sections/media-carousel.php, moved by the page's own script
 * (assets/js/widgets/media-carousel.js) as Elementor's editor runs the widget's handler.
 * The slides are edited in the sidebar, one panel each, as Elementor's repeater has them;
 * opening a slide's panel shows that slide.
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useCallback, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import {
	IconPicker,
	LinkFields,
	PicturePicker,
	ServerMarkup,
} from '../../editor/shared';

const site = window.harlowEditor || { themeUri: '' };

/** The picture sizes WordPress makes, as Elementor's image size control offers them. */
const SIZES = [
	{ value: 'thumbnail', label: __( 'Thumbnail', 'harlow' ) },
	{ value: 'medium', label: __( 'Medium', 'harlow' ) },
	{ value: 'medium_large', label: __( 'Medium large', 'harlow' ) },
	{ value: 'large', label: __( 'Large', 'harlow' ) },
	{ value: 'full', label: __( 'Full', 'harlow' ) },
];

/** 1 to 10, after Elementor's "Default". */
const COUNTS = [
	{ value: '', label: __( 'Default', 'harlow' ) },
	...Array.from( { length: 10 }, ( x, i ) => ( {
		value: String( i + 1 ),
		label: String( i + 1 ),
	} ) ),
];

const DEVICES = [
	[ '', __( 'Desktop', 'harlow' ) ],
	[ 'Tablet', __( 'Tablet', 'harlow' ) ],
	[ 'Mobile', __( 'Mobile', 'harlow' ) ],
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
 * A new repeater item's id: seven hex characters, as Elementor's.
 *
 * @return {string} The id.
 */
function newId() {
	return Math.floor( Math.random() * 0xfffffff )
		.toString( 16 )
		.padStart( 7, '0' );
}

/**
 * A setting of each device: desktop, tablet, mobile.
 *
 * @param {Object}   props
 * @param {string}   props.label         What the setting is.
 * @param {string}   props.name          The attribute (with Tablet, Mobile after it).
 * @param {Object}   props.attributes    The block's attributes.
 * @param {Function} props.setAttributes The block's setter.
 * @param {Array}    props.options       The choices, or none for a number.
 */
function DeviceFields( { label, name, attributes, setAttributes, options } ) {
	return DEVICES.map( ( [ suffix, device ] ) => {
		const props = {
			key: suffix,
			__next40pxDefaultSize: true,
			__nextHasNoMarginBottom: true,
			label: sprintf(
				// translators: 1: a setting, 2: a device (desktop, tablet, mobile).
				__( '%1$s (%2$s)', 'harlow' ),
				label,
				device
			),
			value: attributes[ name + suffix ],
			onChange: ( value ) =>
				setAttributes( { [ name + suffix ]: value } ),
		};
		return options ? (
			<SelectControl { ...props } options={ options } />
		) : (
			<TextControl { ...props } type="number" min="0" />
		);
	} );
}

/**
 * The fields of one slide.
 *
 * @param {Object}   props
 * @param {Object}   props.slide    The slide.
 * @param {Function} props.onChange Called with the changed fields.
 */
function SlideFields( { slide, onChange } ) {
	const video = slide.type === 'video';
	return (
		<>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Type', 'harlow' ) }
				value={ slide.type || 'image' }
				options={ [
					{ value: 'image', label: __( 'Image', 'harlow' ) },
					{ value: 'video', label: __( 'Video', 'harlow' ) },
				] }
				onChange={ ( type ) => onChange( { type } ) }
			/>
			<PicturePicker
				label={ __( 'Image', 'harlow' ) }
				value={ slide.image || 0 }
				onChange={ ( image ) => onChange( { image } ) }
				none={ __( 'No picture: a grey slide', 'harlow' ) }
			/>
			{ video ? (
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Video link', 'harlow' ) }
					help={ __(
						'A YouTube or Vimeo address, or a video file’s.',
						'harlow'
					) }
					value={ slide.video || '' }
					onChange={ ( value ) => onChange( { video: value } ) }
				/>
			) : (
				<>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Link', 'harlow' ) }
						value={ slide.linkType || '' }
						options={ [
							{ value: '', label: __( 'None', 'harlow' ) },
							{
								value: 'file',
								label: __( 'Media file', 'harlow' ),
							},
							{
								value: 'custom',
								label: __( 'Custom URL', 'harlow' ),
							},
						] }
						onChange={ ( linkType ) => onChange( { linkType } ) }
					/>
					{ slide.linkType === 'custom' && (
						<LinkFields value={ slide } onChange={ onChange } />
					) }
				</>
			) }
		</>
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
	const slides = attributes.slides || [];
	const skin = attributes.skin;
	const element = useRef( null );
	const onMarkup = useCallback( ( el ) => {
		let stop;
		let live = true;
		element.current = el;
		widgetScript( el.ownerDocument, 'media-carousel' ).then( ( init ) => {
			if ( live && init ) {
				stop = init( el, { editor: true } );
			}
		} );
		return () => {
			live = false;
			element.current = null;
			if ( stop ) {
				stop();
			}
		};
	}, [] );
	const changeSlide = ( index, fields ) =>
		setAttributes( {
			slides: slides.map( ( slide, i ) =>
				i === index ? { ...slide, ...fields } : slide
			),
		} );
	const moveSlide = ( index, by ) => {
		const next = [ ...slides ];
		const [ slide ] = next.splice( index, 1 );
		next.splice( index + by, 0, slide );
		setAttributes( { slides: next } );
	};
	const showSlide = ( index ) => {
		const carousel = element.current && element.current.harlowCarousel;
		if ( carousel ) {
			carousel.go( index );
		}
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Slides', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Skin', 'harlow' ) }
						value={ skin }
						options={ [
							{
								value: 'carousel',
								label: __( 'Carousel', 'harlow' ),
							},
							{
								value: 'slideshow',
								label: __( 'Slideshow', 'harlow' ),
							},
							{
								value: 'coverflow',
								label: __( 'Coverflow', 'harlow' ),
							},
						] }
						onChange={ set( 'skin' ) }
					/>
					{ slides.map( ( slide, index ) => (
						<PanelBody
							key={ slide.id || index }
							title={ sprintf(
								// translators: 1: the slide's number, 2: image or video.
								__( 'Slide %1$d (%2$s)', 'harlow' ),
								index + 1,
								slide.type === 'video'
									? __( 'video', 'harlow' )
									: __( 'image', 'harlow' )
							) }
							initialOpen={ false }
							onToggle={ ( open ) => open && showSlide( index ) }
						>
							<SlideFields
								slide={ slide }
								onChange={ ( fields ) =>
									changeSlide( index, fields )
								}
							/>
							<div className="harlow-repeater-actions">
								<Button
									variant="secondary"
									disabled={ index === 0 }
									onClick={ () => moveSlide( index, -1 ) }
								>
									{ __( 'Move up', 'harlow' ) }
								</Button>
								<Button
									variant="secondary"
									disabled={ index === slides.length - 1 }
									onClick={ () => moveSlide( index, 1 ) }
								>
									{ __( 'Move down', 'harlow' ) }
								</Button>
								<Button
									variant="link"
									isDestructive
									onClick={ () =>
										setAttributes( {
											slides: slides.filter(
												( x, i ) => i !== index
											),
										} )
									}
								>
									{ __( 'Remove', 'harlow' ) }
								</Button>
							</div>
						</PanelBody>
					) ) }
					<Button
						variant="primary"
						onClick={ () =>
							setAttributes( {
								slides: [
									...slides,
									{ id: newId(), type: 'image', image: 0 },
								],
							} )
						}
					>
						{ __( 'Add a slide', 'harlow' ) }
					</Button>
				</PanelBody>
				<PanelBody
					title={ __( 'Layout', 'harlow' ) }
					initialOpen={ false }
				>
					{ skin === 'slideshow' && (
						<>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Effect', 'harlow' ) }
								value={ attributes.effect }
								options={ [
									{
										value: 'slide',
										label: __( 'Slide', 'harlow' ),
									},
									{
										value: 'fade',
										label: __( 'Fade', 'harlow' ),
									},
								] }
								onChange={ set( 'effect' ) }
							/>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Thumbnails ratio', 'harlow' ) }
								value={ attributes.thumbsRatio }
								options={ [
									{ value: '169', label: '16:9' },
									{ value: '219', label: '21:9' },
									{ value: '43', label: '4:3' },
									{ value: '11', label: '1:1' },
								] }
								onChange={ set( 'thumbsRatio' ) }
							/>
						</>
					) }
					<DeviceFields
						label={
							skin === 'slideshow'
								? __( 'Thumbnails per view', 'harlow' )
								: __( 'Slides per view', 'harlow' )
						}
						name="slidesPerView"
						attributes={ attributes }
						setAttributes={ setAttributes }
						options={ COUNTS }
					/>
					{ skin !== 'slideshow' && (
						<DeviceFields
							label={ __( 'Slides to scroll', 'harlow' ) }
							name="slidesToScroll"
							attributes={ attributes }
							setAttributes={ setAttributes }
							options={ COUNTS }
						/>
					) }
					<DeviceFields
						label={ __( 'Height (px)', 'harlow' ) }
						name="height"
						attributes={ attributes }
						setAttributes={ setAttributes }
					/>
					<DeviceFields
						label={ __( 'Space between (px)', 'harlow' ) }
						name="spaceBetween"
						attributes={ attributes }
						setAttributes={ setAttributes }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Image size', 'harlow' ) }
						value={ attributes.imageSize }
						options={ SIZES }
						onChange={ set( 'imageSize' ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Image fit', 'harlow' ) }
						value={ attributes.imageFit }
						options={ [
							{ value: 'cover', label: __( 'Cover', 'harlow' ) },
							{
								value: 'contain',
								label: __( 'Contain', 'harlow' ),
							},
							{ value: 'auto', label: __( 'Auto', 'harlow' ) },
						] }
						onChange={ set( 'imageFit' ) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Carousel name', 'harlow' ) }
						value={ attributes.carouselName }
						onChange={ set( 'carouselName' ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Additional Options', 'harlow' ) }
					initialOpen={ false }
				>
					{ toggle( 'showArrows', __( 'Arrows', 'harlow' ) ) }
					{ skin !== 'slideshow' && (
						<>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Pagination', 'harlow' ) }
								value={ attributes.pagination }
								options={ [
									{
										value: '',
										label: __( 'None', 'harlow' ),
									},
									{
										value: 'bullets',
										label: __( 'Dots', 'harlow' ),
									},
									{
										value: 'fraction',
										label: __( 'Fraction', 'harlow' ),
									},
									{
										value: 'progressbar',
										label: __( 'Progress', 'harlow' ),
									},
								] }
								onChange={ set( 'pagination' ) }
							/>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Pagination position', 'harlow' ) }
								value={ attributes.paginationPosition }
								options={ [
									{
										value: 'outside',
										label: __( 'Outside', 'harlow' ),
									},
									{
										value: 'inside',
										label: __( 'Inside', 'harlow' ),
									},
								] }
								onChange={ set( 'paginationPosition' ) }
							/>
						</>
					) }
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						min="0"
						label={ __( 'Transition duration (ms)', 'harlow' ) }
						value={ attributes.speed }
						onChange={ ( value ) =>
							setAttributes( { speed: Number( value ) || 0 } )
						}
					/>
					{ toggle( 'autoplay', __( 'Autoplay', 'harlow' ) ) }
					{ attributes.autoplay && (
						<>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								type="number"
								min="0"
								label={ __( 'Autoplay speed (ms)', 'harlow' ) }
								value={ attributes.autoplaySpeed }
								onChange={ ( value ) =>
									setAttributes( {
										autoplaySpeed: Number( value ) || 0,
									} )
								}
							/>
							{ toggle(
								'pauseOnHover',
								__( 'Pause on hover', 'harlow' )
							) }
							{ toggle(
								'pauseOnInteraction',
								__( 'Pause on interaction', 'harlow' )
							) }
						</>
					) }
					{ toggle( 'loop', __( 'Infinite loop', 'harlow' ) ) }
					{ toggle( 'lazyload', __( 'Lazy load', 'harlow' ) ) }
				</PanelBody>
				<PanelBody
					title={ __( 'Overlay', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Overlay', 'harlow' ) }
						value={ attributes.overlay }
						options={ [
							{ value: '', label: __( 'None', 'harlow' ) },
							{ value: 'text', label: __( 'Text', 'harlow' ) },
							{ value: 'icon', label: __( 'Icon', 'harlow' ) },
						] }
						onChange={ set( 'overlay' ) }
					/>
					{ attributes.overlay === 'text' && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Caption', 'harlow' ) }
							value={ attributes.caption }
							options={ [
								{
									value: 'title',
									label: __( 'Title', 'harlow' ),
								},
								{
									value: 'caption',
									label: __( 'Caption', 'harlow' ),
								},
								{
									value: 'description',
									label: __( 'Description', 'harlow' ),
								},
							] }
							onChange={ set( 'caption' ) }
						/>
					) }
					{ attributes.overlay === 'icon' && (
						<IconPicker
							allowNone
							noneLabel={ __( 'Default', 'harlow' ) }
							value={ attributes.overlayIcon }
							onChange={ set( 'overlayIcon' ) }
						/>
					) }
					{ !! attributes.overlay && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Animation', 'harlow' ) }
							value={ attributes.overlayAnimation }
							options={ [
								{
									value: 'fade',
									label: __( 'Fade', 'harlow' ),
								},
								{
									value: 'slide-up',
									label: __( 'Slide up', 'harlow' ),
								},
								{
									value: 'slide-down',
									label: __( 'Slide down', 'harlow' ),
								},
								{
									value: 'slide-right',
									label: __( 'Slide right', 'harlow' ),
								},
								{
									value: 'slide-left',
									label: __( 'Slide left', 'harlow' ),
								},
								{
									value: 'zoom-in',
									label: __( 'Zoom in', 'harlow' ),
								},
							] }
							onChange={ set( 'overlayAnimation' ) }
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<ServerMarkup
				name="harlow/media-carousel"
				attributes={ attributes }
				onMarkup={ onMarkup }
			/>
		</>
	);
}
