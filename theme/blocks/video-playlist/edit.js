/**
 * A video playlist in the editor: the server's markup of
 * includes/sections/video-playlist.php, with the page's own script
 * (assets/js/widgets/video-playlist.js) to choose a video and its tabs as on the page. The
 * videos are edited in the sidebar, one panel each, as Elementor's repeater has them.
 */
import {
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	SelectControl,
	TextareaControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import { IconPicker, PicturePicker, ServerMarkup } from '../../editor/shared';

const site = window.harlowEditor || { themeUri: '' };

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
 * A video file of the Media Library, chosen or uploaded.
 *
 * @param {Object}   props
 * @param {number}   props.value    The file (its id), 0 for none.
 * @param {Function} props.onChange Called with the file's id.
 */
function VideoPicker( { value, onChange } ) {
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
		<div className="harlow-video-picker">
			<p>
				{ name
					? name.split( '/' ).pop()
					: __( 'No video chosen', 'harlow' ) }
			</p>
			<MediaUploadCheck>
				<MediaUpload
					allowedTypes={ [ 'video' ] }
					value={ value || undefined }
					onSelect={ ( picked ) => onChange( picked.id ) }
					render={ ( { open } ) => (
						<Button variant="secondary" onClick={ open }>
							{ value
								? __( 'Replace the video', 'harlow' )
								: __( 'Choose a video', 'harlow' ) }
						</Button>
					) }
				/>
			</MediaUploadCheck>
		</div>
	);
}

/**
 * The fields of one item of the playlist: a video, or a section's title.
 *
 * @param {Object}   props
 * @param {Object}   props.item     The item.
 * @param {Function} props.onChange Called with the changed fields.
 */
function ItemFields( { item, onChange } ) {
	const set = ( name ) => ( value ) => onChange( { [ name ]: value } );
	const text = ( name, label, help ) => (
		<TextControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			help={ help }
			value={ item[ name ] || '' }
			onChange={ set( name ) }
		/>
	);
	const type = item.type || 'youtube';
	return (
		<>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Type', 'harlow' ) }
				value={ type }
				options={ [
					{ value: 'youtube', label: 'YouTube' },
					{ value: 'vimeo', label: 'Vimeo' },
					{ value: 'hosted', label: __( 'Self hosted', 'harlow' ) },
					{ value: 'section', label: __( 'Section', 'harlow' ) },
				] }
				onChange={ set( 'type' ) }
			/>
			{ text( 'title', __( 'Title', 'harlow' ) ) }
			{ type !== 'section' && (
				<>
					{ ( type === 'youtube' || type === 'vimeo' ) &&
						text( 'url', __( 'Link', 'harlow' ) ) }
					{ type === 'hosted' && (
						<>
							<VideoPicker
								value={ item.hosted || 0 }
								onChange={ set( 'hosted' ) }
							/>
							{ text(
								'externalUrl',
								__( 'Or an address', 'harlow' )
							) }
						</>
					) }
					{ text(
						'duration',
						__( 'Duration', 'harlow' ),
						__( 'As it is shown, such as 2:11.', 'harlow' )
					) }
					<PicturePicker
						label={ __( 'Thumbnail', 'harlow' ) }
						value={ item.thumbnail || 0 }
						onChange={ set( 'thumbnail' ) }
						none={ __( 'YouTube’s own, or none', 'harlow' ) }
					/>
					{ text( 'tab1Title', __( 'Tab #1 title', 'harlow' ) ) }
					<TextareaControl
						__nextHasNoMarginBottom
						label={ __( 'Tab #1 content', 'harlow' ) }
						help={ __(
							'Words, with HTML for links and emphasis.',
							'harlow'
						) }
						value={ item.tab1Content || '' }
						onChange={ set( 'tab1Content' ) }
					/>
					{ text( 'tab2Title', __( 'Tab #2 title', 'harlow' ) ) }
					<TextareaControl
						__nextHasNoMarginBottom
						label={ __( 'Tab #2 content', 'harlow' ) }
						value={ item.tab2Content || '' }
						onChange={ set( 'tab2Content' ) }
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
	const videos = attributes.videos || [];
	const onMarkup = useCallback( ( el ) => {
		let stop;
		let live = true;
		widgetScript( el.ownerDocument, 'video-playlist' ).then( ( init ) => {
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
	const changeItem = ( index, fields ) =>
		setAttributes( {
			videos: videos.map( ( item, i ) =>
				i === index ? { ...item, ...fields } : item
			),
		} );
	const moveItem = ( index, by ) => {
		const next = [ ...videos ];
		const [ item ] = next.splice( index, 1 );
		next.splice( index + by, 0, item );
		setAttributes( { videos: next } );
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Playlist', 'harlow' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Playlist name', 'harlow' ) }
						value={ attributes.playlistTitle }
						onChange={ set( 'playlistTitle' ) }
					/>
					{ videos.map( ( item, index ) => (
						<PanelBody
							key={ item.id || index }
							title={
								item.title ||
								sprintf(
									// translators: %d: the item's number in the playlist.
									__( 'Item %d', 'harlow' ),
									index + 1
								)
							}
							initialOpen={ false }
						>
							<ItemFields
								item={ item }
								onChange={ ( fields ) =>
									changeItem( index, fields )
								}
							/>
							<div className="harlow-repeater-actions">
								<Button
									variant="secondary"
									disabled={ index === 0 }
									onClick={ () => moveItem( index, -1 ) }
								>
									{ __( 'Move up', 'harlow' ) }
								</Button>
								<Button
									variant="secondary"
									disabled={ index === videos.length - 1 }
									onClick={ () => moveItem( index, 1 ) }
								>
									{ __( 'Move down', 'harlow' ) }
								</Button>
								<Button
									variant="link"
									isDestructive
									onClick={ () =>
										setAttributes( {
											videos: videos.filter(
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
								videos: [
									...videos,
									{
										id: newId(),
										type: 'youtube',
										title: __( 'Sample Video', 'harlow' ),
										url: 'https://www.youtube.com/watch?v=XHOmBV4js_E',
										tab1Title: __( 'Tab #1', 'harlow' ),
										tab2Title: __( 'Tab #2', 'harlow' ),
									},
								],
							} )
						}
					>
						{ __( 'Add an item', 'harlow' ) }
					</Button>
				</PanelBody>
				<PanelBody
					title={ __( 'Settings', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Playlist position', 'harlow' ) }
						value={ attributes.layout }
						options={ [
							{ value: 'left', label: __( 'Left', 'harlow' ) },
							{ value: 'right', label: __( 'Right', 'harlow' ) },
						] }
						onChange={ set( 'layout' ) }
					/>
					{ toggle(
						'autoplay',
						__( 'Autoplay the first video', 'harlow' )
					) }
					{ toggle( 'playNext', __( 'Autoplay next', 'harlow' ) ) }
					{ toggle(
						'showWatched',
						__( 'Watched indicator', 'harlow' )
					) }
					{ toggle( 'showCount', __( 'Video count', 'harlow' ) ) }
					{ toggle( 'showDuration', __( 'Duration', 'harlow' ) ) }
					{ toggle( 'showThumbnails', __( 'Thumbnails', 'harlow' ) ) }
					{ toggle( 'lazyLoad', __( 'Lazy load', 'harlow' ) ) }
					{ DEVICES.map( ( [ suffix, device ] ) => (
						<TextControl
							key={ suffix }
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							type="number"
							min="0"
							label={ sprintf(
								// translators: %s: a device (desktop, tablet, mobile).
								__( 'Height in px (%s)', 'harlow' ),
								device
							) }
							help={
								suffix
									? ''
									: __(
											'Empty: the player’s, 16:9.',
											'harlow'
										)
							}
							value={ attributes[ `height${ suffix }` ] }
							onChange={ set( `height${ suffix }` ) }
						/>
					) ) }
					<p>{ __( 'Play icon', 'harlow' ) }</p>
					<IconPicker
						allowNone
						noneLabel={ __( 'Default', 'harlow' ) }
						value={ attributes.playIcon }
						onChange={ set( 'playIcon' ) }
					/>
					<p>{ __( 'Watched icon', 'harlow' ) }</p>
					<IconPicker
						allowNone
						noneLabel={ __( 'Default', 'harlow' ) }
						value={ attributes.watchedIcon }
						onChange={ set( 'watchedIcon' ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Tabs', 'harlow' ) }
					initialOpen={ false }
				>
					{ toggle(
						'collapsible',
						__( 'Collapsible content', 'harlow' )
					) }
					{ attributes.collapsible && (
						<>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								type="number"
								min="0"
								label={ __(
									'Collapsed height (px)',
									'harlow'
								) }
								value={ attributes.collapsedHeight }
								onChange={ set( 'collapsedHeight' ) }
							/>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Show more label', 'harlow' ) }
								value={ attributes.showMoreLabel }
								onChange={ set( 'showMoreLabel' ) }
							/>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Show less label', 'harlow' ) }
								value={ attributes.showLessLabel }
								onChange={ set( 'showLessLabel' ) }
							/>
						</>
					) }
				</PanelBody>
			</InspectorControls>
			<ServerMarkup
				name="harlow/video-playlist"
				attributes={ attributes }
				onMarkup={ onMarkup }
			/>
		</>
	);
}
