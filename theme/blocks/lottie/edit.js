/**
 * A Lottie animation in the editor: the server's markup of includes/sections/lottie.php,
 * played by the page's own script (assets/js/widgets/lottie.js) as on the page; the
 * animation's file, its caption, link and playback in the sidebar, as Elementor's panel has
 * them.
 */
import {
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { LinkFields, ServerMarkup } from '../../editor/shared';

const site = window.harlowEditor || { themeUri: '' };

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
 * A JSON file of the Media Library, chosen or uploaded.
 *
 * @param {Object}   props
 * @param {number}   props.value    The file (its id), 0 for none.
 * @param {Function} props.onChange Called with the file's id, 0 for the default.
 */
function JsonPicker( { value, onChange } ) {
	const name = useSelect(
		( select ) =>
			value
				? select( coreStore ).getEntityRecord(
						'postType',
						'attachment',
						value
					)?.source_url
				: '',
		[ value ]
	);
	return (
		<div className="harlow-json-picker">
			<p>
				{ name
					? name.split( '/' ).pop()
					: __(
							'No file chosen: the theme’s own animation plays.',
							'harlow'
						) }
			</p>
			<MediaUploadCheck>
				<MediaUpload
					allowedTypes={ [ 'application/json' ] }
					value={ value || undefined }
					onSelect={ ( picked ) => onChange( picked.id ) }
					render={ ( { open } ) => (
						<Button variant="secondary" onClick={ open }>
							{ value
								? __( 'Replace the JSON file', 'harlow' )
								: __( 'Choose a JSON file', 'harlow' ) }
						</Button>
					) }
				/>
			</MediaUploadCheck>
			{ !! value && (
				<Button
					variant="link"
					isDestructive
					onClick={ () => onChange( 0 ) }
				>
					{ __( 'Default', 'harlow' ) }
				</Button>
			) }
		</div>
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
	const range = ( name, label, min, max, step = 1 ) => (
		<RangeControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			min={ min }
			max={ max }
			step={ step }
			value={ attributes[ name ] }
			onChange={ ( value ) =>
				setAttributes( { [ name ]: value === undefined ? min : value } )
			}
		/>
	);
	const trigger = attributes.trigger;
	const onMarkup = useCallback( ( el ) => {
		let stop;
		let live = true;
		widgetScript( el.ownerDocument, 'lottie' ).then( ( init ) => {
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

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Lottie', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Source', 'harlow' ) }
						value={ attributes.source }
						options={ [
							{
								value: 'media_file',
								label: __( 'Media file', 'harlow' ),
							},
							{
								value: 'external_url',
								label: __( 'External URL', 'harlow' ),
							},
						] }
						onChange={ set( 'source' ) }
					/>
					{ attributes.source === 'external_url' ? (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'External URL', 'harlow' ) }
							help={ __(
								'The address of a Lottie JSON file.',
								'harlow'
							) }
							value={ attributes.sourceExternalUrl }
							onChange={ set( 'sourceExternalUrl' ) }
						/>
					) : (
						<JsonPicker
							value={ attributes.sourceJson }
							onChange={ set( 'sourceJson' ) }
						/>
					) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Caption', 'harlow' ) }
						value={ attributes.captionSource }
						options={ [
							{ value: 'none', label: __( 'None', 'harlow' ) },
							{ value: 'title', label: __( 'Title', 'harlow' ) },
							{
								value: 'caption',
								label: __( 'Caption', 'harlow' ),
							},
							{
								value: 'custom',
								label: __( 'Custom', 'harlow' ),
							},
						] }
						onChange={ set( 'captionSource' ) }
					/>
					{ attributes.captionSource === 'custom' && (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Custom caption', 'harlow' ) }
							value={ attributes.caption }
							onChange={ set( 'caption' ) }
						/>
					) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Link', 'harlow' ) }
						value={ attributes.linkTo }
						options={ [
							{ value: 'none', label: __( 'None', 'harlow' ) },
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
				</PanelBody>
				<PanelBody
					title={ __( 'Settings', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Trigger', 'harlow' ) }
						value={ trigger }
						options={ [
							{
								value: 'arriving_to_viewport',
								label: __( 'Viewport', 'harlow' ),
							},
							{
								value: 'on_click',
								label: __( 'On click', 'harlow' ),
							},
							{
								value: 'on_hover',
								label: __( 'On hover', 'harlow' ),
							},
							{
								value: 'bind_to_scroll',
								label: __( 'Scroll', 'harlow' ),
							},
							{ value: 'none', label: __( 'None', 'harlow' ) },
						] }
						onChange={ set( 'trigger' ) }
					/>
					{ ( trigger === 'arriving_to_viewport' ||
						trigger === 'bind_to_scroll' ) && (
						<>
							{ range(
								'viewportStart',
								__( 'Viewport start (%)', 'harlow' ),
								0,
								100
							) }
							{ range(
								'viewportEnd',
								__( 'Viewport end (%)', 'harlow' ),
								0,
								100
							) }
						</>
					) }
					{ trigger === 'bind_to_scroll' && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Effects relative to', 'harlow' ) }
							value={ attributes.effectsRelativeTo }
							options={ [
								{
									value: 'viewport',
									label: __( 'Viewport', 'harlow' ),
								},
								{
									value: 'page',
									label: __( 'Entire page', 'harlow' ),
								},
							] }
							onChange={ set( 'effectsRelativeTo' ) }
						/>
					) }
					{ trigger === 'on_click' &&
						attributes.linkTo === 'custom' && (
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								type="number"
								min="0"
								label={ __( 'Link timeout (ms)', 'harlow' ) }
								value={ attributes.linkTimeout }
								onChange={ set( 'linkTimeout' ) }
							/>
						) }
					{ trigger === 'on_hover' && (
						<>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'On hover out', 'harlow' ) }
								value={ attributes.onHoverOut }
								options={ [
									{
										value: 'default',
										label: __( 'Default', 'harlow' ),
									},
									{
										value: 'reverse',
										label: __( 'Reverse', 'harlow' ),
									},
									{
										value: 'pause',
										label: __( 'Pause', 'harlow' ),
									},
								] }
								onChange={ set( 'onHoverOut' ) }
							/>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Hover area', 'harlow' ) }
								value={ attributes.hoverArea }
								options={ [
									{
										value: 'animation',
										label: __( 'Animation', 'harlow' ),
									},
									{
										value: 'column',
										label: __( 'Column', 'harlow' ),
									},
									{
										value: 'section',
										label: __( 'Section', 'harlow' ),
									},
								] }
								onChange={ set( 'hoverArea' ) }
							/>
						</>
					) }
					{ trigger !== 'bind_to_scroll' && (
						<>
							{ toggle( 'loop', __( 'Loop', 'harlow' ) ) }
							{ attributes.loop && (
								<TextControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									type="number"
									min="0"
									label={ __( 'Number of times', 'harlow' ) }
									help={ __( 'Empty: for ever.', 'harlow' ) }
									value={ attributes.numberOfTimes }
									onChange={ set( 'numberOfTimes' ) }
								/>
							) }
							{ range(
								'playSpeed',
								__( 'Play speed', 'harlow' ),
								0.1,
								5,
								0.1
							) }
						</>
					) }
					{ range(
						'startPoint',
						__( 'Start point (%)', 'harlow' ),
						0,
						100
					) }
					{ range(
						'endPoint',
						__( 'End point (%)', 'harlow' ),
						0,
						100
					) }
					{ toggle( 'reverse', __( 'Reverse', 'harlow' ) ) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Renderer', 'harlow' ) }
						value={ attributes.renderer }
						options={ [
							{ value: 'svg', label: 'SVG' },
							{ value: 'canvas', label: 'Canvas' },
						] }
						onChange={ set( 'renderer' ) }
					/>
					{ toggle( 'lazyload', __( 'Lazy load', 'harlow' ) ) }
				</PanelBody>
			</InspectorControls>
			<ServerMarkup
				name="harlow/lottie"
				attributes={ attributes }
				onMarkup={ onMarkup }
			/>
		</>
	);
}
