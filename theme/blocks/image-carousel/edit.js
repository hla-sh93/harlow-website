/**
 * An image carousel in the editor: the server's markup of
 * includes/sections/image-carousel.php, moved by the page's own script
 * (assets/js/widgets/image-carousel.js) as Elementor's editor runs the widget's handler;
 * the pictures and the settings in the sidebar, as Elementor's panel has them.
 */
import {
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadCheck,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import {
	elementProps,
	IconPicker,
	LinkFields,
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
			// translators: 1: a setting, 2: a device (desktop, tablet, mobile).
			label: sprintf( __( '%1$s (%2$s)', 'harlow' ), label, device ),
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
 * The pictures, chosen from the Media Library or uploaded, in their order.
 *
 * @param {Object}   props
 * @param {number[]} props.value    The pictures.
 * @param {Function} props.onChange Called with the pictures' ids.
 */
function GalleryPicker( { value, onChange } ) {
	return (
		<MediaUploadCheck>
			<MediaUpload
				allowedTypes={ [ 'image' ] }
				multiple
				gallery
				value={ value }
				onSelect={ ( items ) =>
					onChange( items.map( ( item ) => item.id ) )
				}
				render={ ( { open } ) => (
					<Button variant="secondary" onClick={ open }>
						{ value.length
							? sprintf(
									// translators: %d: how many pictures the carousel has.
									__( 'Edit the pictures (%d)', 'harlow' ),
									value.length
								)
							: __( 'Choose the pictures', 'harlow' ) }
					</Button>
				) }
			/>
		</MediaUploadCheck>
	);
}

/**
 * The widget before it has pictures: Elementor's empty gallery, to fill.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes The block's attributes.
 * @param {Function} props.onSelect   Called with the pictures' ids.
 */
function Empty( { attributes, onSelect } ) {
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'image-carousel.default' )
	);
	return (
		<div { ...blockProps }>
			<MediaPlaceholder
				icon="images-alt2"
				labels={ {
					title: __( 'Image Carousel', 'harlow' ),
					instructions: __(
						'Choose the pictures of the carousel, or upload them.',
						'harlow'
					),
				} }
				allowedTypes={ [ 'image' ] }
				multiple
				gallery
				onSelect={ ( items ) =>
					onSelect( items.map( ( item ) => item.id ) )
				}
			/>
		</div>
	);
}

export default function Edit( { attributes, setAttributes } ) {
	const set = ( name ) => ( value ) => setAttributes( { [ name ]: value } );
	const onMarkup = useCallback( ( el ) => {
		let stop;
		let live = true;
		widgetScript( el.ownerDocument, 'image-carousel' ).then( ( init ) => {
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
	// Elementor offers the fade only to a carousel that shows one slide.
	const single = attributes.slidesToShow === '1';

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Image Carousel', 'harlow' ) }>
					<GalleryPicker
						value={ attributes.pictures }
						onChange={ set( 'pictures' ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Image size', 'harlow' ) }
						value={ attributes.imageSize }
						options={ SIZES }
						onChange={ set( 'imageSize' ) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Carousel name', 'harlow' ) }
						help={ __( 'Read out by screen readers.', 'harlow' ) }
						value={ attributes.carouselName }
						onChange={ set( 'carouselName' ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Slides', 'harlow' ) }
					initialOpen={ false }
				>
					<DeviceFields
						label={ __( 'Slides to show', 'harlow' ) }
						name="slidesToShow"
						attributes={ attributes }
						setAttributes={ setAttributes }
						options={ COUNTS }
					/>
					<DeviceFields
						label={ __( 'Slides to scroll', 'harlow' ) }
						name="slidesToScroll"
						attributes={ attributes }
						setAttributes={ setAttributes }
						options={ COUNTS }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Image stretch', 'harlow' ) }
						checked={ attributes.imageStretch }
						onChange={ set( 'imageStretch' ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Navigation', 'harlow' ) }
					initialOpen={ false }
				>
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
								value: 'outside',
								label: __( 'Outside', 'harlow' ),
							},
							{
								value: 'inside',
								label: __( 'Inside', 'harlow' ),
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
				<PanelBody
					title={ __( 'Link', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Link', 'harlow' ) }
						value={ attributes.linkTo }
						options={ [
							{ value: 'none', label: __( 'None', 'harlow' ) },
							{
								value: 'file',
								label: __( 'Media file', 'harlow' ),
							},
							{
								value: 'custom',
								label: __( 'Custom URL', 'harlow' ),
							},
						] }
						onChange={ set( 'linkTo' ) }
					/>
					{ attributes.linkTo === 'custom' && (
						<LinkFields
							value={ attributes }
							onChange={ setAttributes }
						/>
					) }
					{ attributes.linkTo === 'file' && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Lightbox', 'harlow' ) }
							value={ attributes.openLightbox }
							options={ [
								{
									value: 'default',
									label: __( 'Default', 'harlow' ),
								},
								{ value: 'yes', label: __( 'Yes', 'harlow' ) },
								{ value: 'no', label: __( 'No', 'harlow' ) },
							] }
							onChange={ set( 'openLightbox' ) }
						/>
					) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Caption', 'harlow' ) }
						value={ attributes.captionType }
						options={ [
							{ value: '', label: __( 'None', 'harlow' ) },
							{ value: 'title', label: __( 'Title', 'harlow' ) },
							{
								value: 'caption',
								label: __( 'Caption', 'harlow' ),
							},
							{
								value: 'description',
								label: __( 'Description', 'harlow' ),
							},
						] }
						onChange={ set( 'captionType' ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Additional Options', 'harlow' ) }
					initialOpen={ false }
				>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Autoplay', 'harlow' ) }
						checked={ attributes.autoplay }
						onChange={ set( 'autoplay' ) }
					/>
					{ attributes.autoplay && (
						<>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Pause on hover', 'harlow' ) }
								checked={ attributes.pauseOnHover }
								onChange={ set( 'pauseOnHover' ) }
							/>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Pause on interaction', 'harlow' ) }
								checked={ attributes.pauseOnInteraction }
								onChange={ set( 'pauseOnInteraction' ) }
							/>
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
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Infinite loop', 'harlow' ) }
						checked={ attributes.infinite }
						onChange={ set( 'infinite' ) }
					/>
					{ single && (
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
					) }
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						min="0"
						label={ __( 'Animation speed (ms)', 'harlow' ) }
						value={ attributes.speed }
						onChange={ ( value ) =>
							setAttributes( { speed: Number( value ) || 0 } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Direction', 'harlow' ) }
						value={ attributes.direction }
						options={ [
							{ value: 'ltr', label: __( 'Left', 'harlow' ) },
							{ value: 'rtl', label: __( 'Right', 'harlow' ) },
						] }
						onChange={ set( 'direction' ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Lazy load', 'harlow' ) }
						checked={ attributes.lazyload }
						onChange={ set( 'lazyload' ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Image spacing', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Spacing', 'harlow' ) }
						value={ attributes.imageSpacing }
						options={ [
							{ value: '', label: __( 'Default', 'harlow' ) },
							{
								value: 'custom',
								label: __( 'Custom', 'harlow' ),
							},
						] }
						onChange={ set( 'imageSpacing' ) }
					/>
					{ attributes.imageSpacing === 'custom' && (
						<DeviceFields
							label={ __( 'Image spacing (px)', 'harlow' ) }
							name="spacing"
							attributes={ attributes }
							setAttributes={ setAttributes }
						/>
					) }
				</PanelBody>
			</InspectorControls>
			{ attributes.pictures.length ? (
				<ServerMarkup
					name="harlow/image-carousel"
					attributes={ attributes }
					onMarkup={ onMarkup }
				/>
			) : (
				<Empty
					attributes={ attributes }
					onSelect={ set( 'pictures' ) }
				/>
			) }
		</>
	);
}
