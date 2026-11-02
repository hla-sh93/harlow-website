/**
 * Slides in the editor: the server's markup of includes/sections/slides.php, moved by the
 * page's own script (assets/js/widgets/slides.js) as Elementor's editor runs the widget's
 * handler. The slides are edited in the sidebar, one panel each, as Elementor's repeater
 * has them; opening a slide's panel shows that slide.
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	Button,
	ColorPalette,
	PanelBody,
	SelectControl,
	TextareaControl,
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

/** The brand's colours (assets/css/design/brand.css). */
const COLOURS = [
	{ name: __( 'Primary', 'harlow' ), color: '#0165A1' },
	{ name: __( 'Dark', 'harlow' ), color: '#001420' },
	{ name: __( 'Accent', 'harlow' ), color: '#00CCCC' },
	{ name: __( 'Light', 'harlow' ), color: '#F2F2F2' },
	{ name: __( 'Text', 'harlow' ), color: '#000000' },
];

const DEVICES = [
	[ '', __( 'Desktop', 'harlow' ) ],
	[ 'Tablet', __( 'Tablet', 'harlow' ) ],
	[ 'Mobile', __( 'Mobile', 'harlow' ) ],
];

const BLENDS = [
	'',
	'multiply',
	'screen',
	'overlay',
	'darken',
	'lighten',
	'color-dodge',
	'saturation',
	'color',
	'luminosity',
].map( ( value ) => ( {
	value,
	label: value || __( 'Normal', 'harlow' ),
} ) );

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
 * The fields of one slide.
 *
 * @param {Object}   props
 * @param {Object}   props.slide    The slide.
 * @param {Function} props.onChange Called with the changed fields.
 */
function SlideFields( { slide, onChange } ) {
	const set = ( name ) => ( value ) => onChange( { [ name ]: value } );
	const select = ( name, label, options, fallback = '' ) => (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			value={ slide[ name ] ?? fallback }
			options={ options }
			onChange={ set( name ) }
		/>
	);
	const toggle = ( name, label ) => (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ label }
			checked={ !! slide[ name ] }
			onChange={ set( name ) }
		/>
	);
	return (
		<>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Title', 'harlow' ) }
				value={ slide.heading || '' }
				onChange={ set( 'heading' ) }
			/>
			<TextareaControl
				__nextHasNoMarginBottom
				label={ __( 'Description', 'harlow' ) }
				value={ slide.description || '' }
				onChange={ set( 'description' ) }
			/>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Button text', 'harlow' ) }
				value={ slide.buttonText || '' }
				onChange={ set( 'buttonText' ) }
			/>
			<LinkFields value={ slide } onChange={ onChange } />
			{ select(
				'linkClick',
				__( 'Apply link on', 'harlow' ),
				[
					{ value: 'slide', label: __( 'Whole slide', 'harlow' ) },
					{ value: 'button', label: __( 'Button only', 'harlow' ) },
				],
				'slide'
			) }
			<p className="components-base-control__label">
				{ __( 'Background color', 'harlow' ) }
			</p>
			<ColorPalette
				colors={ COLOURS }
				value={ slide.backgroundColor ?? '#bbbbbb' }
				onChange={ ( value ) =>
					onChange( { backgroundColor: value || '' } )
				}
			/>
			<PicturePicker
				label={ __( 'Background image', 'harlow' ) }
				value={ slide.backgroundImage || 0 }
				onChange={ set( 'backgroundImage' ) }
				none={ __( 'No picture', 'harlow' ) }
			/>
			{ !! slide.backgroundImage && (
				<>
					{ select(
						'backgroundSize',
						__( 'Background size', 'harlow' ),
						[
							{ value: 'cover', label: __( 'Cover', 'harlow' ) },
							{
								value: 'contain',
								label: __( 'Contain', 'harlow' ),
							},
							{ value: 'auto', label: __( 'Auto', 'harlow' ) },
						],
						'cover'
					) }
					{ toggle( 'kenBurns', __( 'Ken Burns effect', 'harlow' ) ) }
					{ slide.kenBurns &&
						select(
							'zoomDirection',
							__( 'Zoom direction', 'harlow' ),
							[
								{ value: 'in', label: __( 'In', 'harlow' ) },
								{ value: 'out', label: __( 'Out', 'harlow' ) },
							],
							'in'
						) }
				</>
			) }
			{ toggle( 'overlay', __( 'Background overlay', 'harlow' ) ) }
			{ slide.overlay && (
				<>
					<p className="components-base-control__label">
						{ __( 'Overlay color', 'harlow' ) }
					</p>
					<ColorPalette
						colors={ COLOURS }
						enableAlpha
						value={ slide.overlayColor ?? 'rgba(0,0,0,0.5)' }
						onChange={ ( value ) =>
							onChange( { overlayColor: value || '' } )
						}
					/>
					{ select(
						'overlayBlend',
						__( 'Blend mode', 'harlow' ),
						BLENDS
					) }
				</>
			) }
			{ toggle( 'customStyle', __( 'Custom style', 'harlow' ) ) }
			{ slide.customStyle && (
				<>
					{ select(
						'horizontalPosition',
						__( 'Horizontal position', 'harlow' ),
						[
							{ value: '', label: __( 'Default', 'harlow' ) },
							{ value: 'left', label: __( 'Left', 'harlow' ) },
							{
								value: 'center',
								label: __( 'Center', 'harlow' ),
							},
							{ value: 'right', label: __( 'Right', 'harlow' ) },
						]
					) }
					{ select(
						'verticalPosition',
						__( 'Vertical position', 'harlow' ),
						[
							{ value: '', label: __( 'Default', 'harlow' ) },
							{ value: 'top', label: __( 'Top', 'harlow' ) },
							{
								value: 'middle',
								label: __( 'Middle', 'harlow' ),
							},
							{
								value: 'bottom',
								label: __( 'Bottom', 'harlow' ),
							},
						]
					) }
					{ select( 'textAlign', __( 'Text align', 'harlow' ), [
						{ value: '', label: __( 'Default', 'harlow' ) },
						{ value: 'left', label: __( 'Left', 'harlow' ) },
						{ value: 'center', label: __( 'Center', 'harlow' ) },
						{ value: 'right', label: __( 'Right', 'harlow' ) },
					] ) }
					<p className="components-base-control__label">
						{ __( 'Content color', 'harlow' ) }
					</p>
					<ColorPalette
						colors={ COLOURS }
						value={ slide.contentColor || '' }
						onChange={ ( value ) =>
							onChange( { contentColor: value || '' } )
						}
					/>
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
	const element = useRef( null );
	const onMarkup = useCallback( ( el ) => {
		let stop;
		let live = true;
		element.current = el;
		widgetScript( el.ownerDocument, 'slides' ).then( ( init ) => {
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
					{ slides.map( ( slide, index ) => (
						<PanelBody
							key={ slide.id || index }
							title={
								slide.heading ||
								sprintf(
									// translators: %d: the slide's number.
									__( 'Slide %d', 'harlow' ),
									index + 1
								)
							}
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
									variant="secondary"
									onClick={ () =>
										setAttributes( {
											slides: [
												...slides.slice( 0, index + 1 ),
												{ ...slide, id: newId() },
												...slides.slice( index + 1 ),
											],
										} )
									}
								>
									{ __( 'Duplicate', 'harlow' ) }
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
									{
										id: newId(),
										heading: __(
											'Slide Heading',
											'harlow'
										),
										description: __(
											'Lorem ipsum dolor sit amet consectetur adipiscing elit dolor',
											'harlow'
										),
										buttonText: __(
											'Click Here',
											'harlow'
										),
										backgroundColor: '#bbbbbb',
									},
								],
							} )
						}
					>
						{ __( 'Add a slide', 'harlow' ) }
					</Button>
				</PanelBody>
				<PanelBody
					title={ __( 'Slider Options', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Height unit', 'harlow' ) }
						value={ attributes.heightUnit }
						options={ [
							{ value: 'px', label: 'px' },
							{ value: 'vh', label: 'vh' },
							{ value: 'em', label: 'em' },
						] }
						onChange={ set( 'heightUnit' ) }
					/>
					{ DEVICES.map( ( [ suffix, device ] ) => (
						<TextControl
							key={ suffix }
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							type="number"
							min="0"
							label={ sprintf(
								// translators: %s: a device (desktop, tablet, mobile).
								__( 'Height (%s)', 'harlow' ),
								device
							) }
							value={ attributes[ `height${ suffix }` ] }
							onChange={ set( `height${ suffix }` ) }
						/>
					) ) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Navigation', 'harlow' ) }
						value={ attributes.navigation }
						options={ [
							{
								value: 'both',
								label: __( 'Arrows and dots', 'harlow' ),
							},
							{
								value: 'arrows',
								label: __( 'Arrows', 'harlow' ),
							},
							{ value: 'dots', label: __( 'Dots', 'harlow' ) },
							{ value: 'none', label: __( 'None', 'harlow' ) },
						] }
						onChange={ set( 'navigation' ) }
					/>
					{ toggle( 'autoplay', __( 'Autoplay', 'harlow' ) ) }
					{ attributes.autoplay && (
						<>
							{ toggle(
								'pauseOnHover',
								__( 'Pause on hover', 'harlow' )
							) }
							{ toggle(
								'pauseOnInteraction',
								__( 'Pause on interaction', 'harlow' )
							) }
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
						</>
					) }
					{ toggle( 'infinite', __( 'Infinite loop', 'harlow' ) ) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Transition', 'harlow' ) }
						value={ attributes.transition }
						options={ [
							{ value: 'slide', label: __( 'Slide', 'harlow' ) },
							{ value: 'fade', label: __( 'Fade', 'harlow' ) },
						] }
						onChange={ set( 'transition' ) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						min="0"
						label={ __( 'Transition speed (ms)', 'harlow' ) }
						value={ attributes.transitionSpeed }
						onChange={ ( value ) =>
							setAttributes( {
								transitionSpeed: Number( value ) || 0,
							} )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Content animation', 'harlow' ) }
						value={ attributes.contentAnimation }
						options={ [
							{ value: '', label: __( 'None', 'harlow' ) },
							{
								value: 'fadeInDown',
								label: __( 'Down', 'harlow' ),
							},
							{ value: 'fadeInUp', label: __( 'Up', 'harlow' ) },
							{
								value: 'fadeInRight',
								label: __( 'Right', 'harlow' ),
							},
							{
								value: 'fadeInLeft',
								label: __( 'Left', 'harlow' ),
							},
							{ value: 'zoomIn', label: __( 'Zoom', 'harlow' ) },
						] }
						onChange={ set( 'contentAnimation' ) }
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
					title={ __( 'Slides layout', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Horizontal position', 'harlow' ) }
						value={ attributes.horizontalPosition }
						options={ [
							{ value: 'left', label: __( 'Left', 'harlow' ) },
							{
								value: 'center',
								label: __( 'Center', 'harlow' ),
							},
							{ value: 'right', label: __( 'Right', 'harlow' ) },
						] }
						onChange={ set( 'horizontalPosition' ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Vertical position', 'harlow' ) }
						value={ attributes.verticalPosition }
						options={ [
							{ value: 'top', label: __( 'Top', 'harlow' ) },
							{
								value: 'middle',
								label: __( 'Middle', 'harlow' ),
							},
							{
								value: 'bottom',
								label: __( 'Bottom', 'harlow' ),
							},
						] }
						onChange={ set( 'verticalPosition' ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Button size', 'harlow' ) }
						value={ attributes.buttonSize }
						options={ [
							{
								value: 'xs',
								label: __( 'Extra small', 'harlow' ),
							},
							{ value: 'sm', label: __( 'Small', 'harlow' ) },
							{ value: 'md', label: __( 'Medium', 'harlow' ) },
							{ value: 'lg', label: __( 'Large', 'harlow' ) },
							{
								value: 'xl',
								label: __( 'Extra large', 'harlow' ),
							},
						] }
						onChange={ set( 'buttonSize' ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Navigation', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Arrows position', 'harlow' ) }
						value={ attributes.arrowsPosition }
						options={ [
							{
								value: 'inside',
								label: __( 'Inside', 'harlow' ),
							},
							{
								value: 'outside',
								label: __( 'Outside', 'harlow' ),
							},
						] }
						onChange={ set( 'arrowsPosition' ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Dots position', 'harlow' ) }
						value={ attributes.dotsPosition }
						options={ [
							{
								value: 'inside',
								label: __( 'Inside', 'harlow' ),
							},
							{
								value: 'outside',
								label: __( 'Outside', 'harlow' ),
							},
						] }
						onChange={ set( 'dotsPosition' ) }
					/>
					<p>{ __( 'Previous arrow icon', 'harlow' ) }</p>
					<IconPicker
						allowNone
						noneLabel={ __( 'Default', 'harlow' ) }
						value={ attributes.prevIcon }
						onChange={ set( 'prevIcon' ) }
					/>
					<p>{ __( 'Next arrow icon', 'harlow' ) }</p>
					<IconPicker
						allowNone
						noneLabel={ __( 'Default', 'harlow' ) }
						value={ attributes.nextIcon }
						onChange={ set( 'nextIcon' ) }
					/>
				</PanelBody>
			</InspectorControls>
			<ServerMarkup
				name="harlow/slides"
				attributes={ attributes }
				onMarkup={ onMarkup }
			/>
		</>
	);
}
