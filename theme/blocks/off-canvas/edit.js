/**
 * An off-canvas panel in the editor: includes/sections/off-canvas.php, the panel drawn open
 * in its place on the page (e-off-canvas--editing, assets/css/widgets/off-canvas.css) so
 * the blocks inside it can be edited. The links that open it, its side, size, overlay,
 * close button, animations and closing are in the sidebar.
 */
import {
	InnerBlocks,
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import {
	elementProps,
	iconHtml,
	IconPicker,
	inContainer,
} from '../../editor/shared';
import metadata from './block.json';

const ANIMATIONS = [
	[ 'slide', __( 'Slide', 'harlow' ) ],
	[ 'fade', __( 'Fade', 'harlow' ) ],
	[ 'zoom', __( 'Zoom', 'harlow' ) ],
	[ 'none', __( 'None', 'harlow' ) ],
];

/**
 * The element's classes: the widget's own when it has none yet (off-canvas.php).
 *
 * @param {string} classes The block's classes.
 * @return {string} The classes.
 */
function offCanvasClasses( classes ) {
	const own = ( classes || '' ).split( /\s+/ ).filter( Boolean );
	return [
		...[
			'elementor-element',
			'elementor-widget',
			'elementor-widget-off-canvas',
		].filter( ( c ) => ! own.includes( c ) ),
		...own,
	].join( ' ' );
}

export default function Edit( { attributes, setAttributes } ) {
	const {
		element,
		name,
		position,
		size,
		sizeUnit,
		overlay,
		closeButton,
		closeIcon,
		openAnimation,
		closeAnimation,
		duration,
		closeOnOverlay,
		closeOnEscape,
		preventScroll,
	} = attributes;
	const side = [ 'left', 'right', 'top', 'bottom' ].includes( position )
		? position
		: 'left';
	const vertical = side === 'top' || side === 'bottom';
	const unit = [ 'px', '%', 'vw', 'vh', 'em', 'rem' ].includes( sizeUnit )
		? sizeUnit
		: 'px';
	const length = `${ Math.max( 0, Number( size ) || 0 ) }${ unit }`;
	const pick = ( value ) =>
		ANIMATIONS.some( ( [ a ] ) => a === value ) ? value : 'slide';
	let settings = {};
	try {
		settings = JSON.parse( attributes.settings || '{}' ) || {};
	} catch {
		// Settings that are not JSON are left out.
	}
	const blockProps = useBlockProps(
		elementProps(
			{
				...attributes,
				classes: offCanvasClasses( attributes.classes ),
				settings: JSON.stringify( {
					...settings,
					position: side,
					entrance_animation: pick( openAnimation ),
					exit_animation: pick( closeAnimation ),
					animation_duration: Math.max( 0, Number( duration ) || 0 ),
					has_overlay: overlay ? 'yes' : '',
					is_not_close_on_overlay: closeOnOverlay ? '' : 'yes',
					is_not_close_on_esc: closeOnEscape ? '' : 'yes',
					prevent_scroll: preventScroll ? 'yes' : '',
					off_canvas_name: name,
					off_canvas_wrapper_suffix: element,
				} ),
			},
			'widget',
			'off-canvas.default'
		)
	);
	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'e-off-canvas__content' },
		{
			templateLock: false,
			allowedBlocks: inContainer(),
			renderAppender: InnerBlocks.ButtonBlockAppender,
		}
	);
	const anchor = `#off-canvas-${ element }`;
	const action = `#elementor-action:action=off_canvas:open&settings=${ window.btoa(
		JSON.stringify( { id: element, displayMode: 'open' } )
	) }`;
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Off-Canvas', 'harlow' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Name', 'harlow' ) }
						help={ __(
							'What screen readers call the panel.',
							'harlow'
						) }
						value={ name }
						onChange={ ( v ) => setAttributes( { name: v } ) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						readOnly
						label={ __( 'Link that opens it', 'harlow' ) }
						help={ __(
							'Put this address on any button or link of the page; a link to it inside the panel closes it. Elementor’s action link works too:',
							'harlow'
						) }
						value={ anchor }
						onFocus={ ( event ) => event.target.select() }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						readOnly
						label={ __( 'Elementor’s action link', 'harlow' ) }
						value={ action }
						onFocus={ ( event ) => event.target.select() }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Layout', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Position', 'harlow' ) }
						value={ side }
						options={ [
							{ value: 'left', label: __( 'Left', 'harlow' ) },
							{ value: 'right', label: __( 'Right', 'harlow' ) },
							{ value: 'top', label: __( 'Top', 'harlow' ) },
							{
								value: 'bottom',
								label: __( 'Bottom', 'harlow' ),
							},
						] }
						onChange={ ( v ) => setAttributes( { position: v } ) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						min={ 0 }
						label={
							vertical
								? __( 'Height', 'harlow' )
								: __( 'Width', 'harlow' )
						}
						value={ size }
						onChange={ ( v ) =>
							setAttributes( {
								size: Math.max( 0, Number( v ) || 0 ),
							} )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Unit', 'harlow' ) }
						value={ unit }
						options={ [ 'px', '%', 'vw', 'vh', 'em', 'rem' ].map(
							( u ) => ( { value: u, label: u } )
						) }
						onChange={ ( v ) => setAttributes( { sizeUnit: v } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Overlay', 'harlow' ) }
						checked={ !! overlay }
						onChange={ ( v ) => setAttributes( { overlay: v } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Close button', 'harlow' ) }
						checked={ !! closeButton }
						onChange={ ( v ) =>
							setAttributes( { closeButton: v } )
						}
					/>
				</PanelBody>
				{ closeButton && (
					<PanelBody
						title={ __( 'Close icon', 'harlow' ) }
						initialOpen={ false }
					>
						<IconPicker
							value={ closeIcon }
							onChange={ ( v ) =>
								setAttributes( { closeIcon: v } )
							}
						/>
						<Button
							variant="link"
							disabled={
								closeIcon ===
								metadata.attributes.closeIcon.default
							}
							onClick={ () =>
								setAttributes( {
									closeIcon:
										metadata.attributes.closeIcon.default,
								} )
							}
						>
							{ __( 'Elementor’s close icon', 'harlow' ) }
						</Button>
					</PanelBody>
				) }
				<PanelBody
					title={ __( 'Animations and closing', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Entrance animation', 'harlow' ) }
						value={ pick( openAnimation ) }
						options={ ANIMATIONS.map( ( [ value, label ] ) => ( {
							value,
							label,
						} ) ) }
						onChange={ ( v ) =>
							setAttributes( { openAnimation: v } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Exit animation', 'harlow' ) }
						value={ pick( closeAnimation ) }
						options={ ANIMATIONS.map( ( [ value, label ] ) => ( {
							value,
							label,
						} ) ) }
						onChange={ ( v ) =>
							setAttributes( { closeAnimation: v } )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						min={ 0 }
						step={ 50 }
						label={ __( 'Animation duration (ms)', 'harlow' ) }
						value={ duration }
						onChange={ ( v ) =>
							setAttributes( {
								duration: Math.max( 0, parseInt( v, 10 ) || 0 ),
							} )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __(
							'Close on a click on the overlay',
							'harlow'
						) }
						checked={ !! closeOnOverlay }
						onChange={ ( v ) =>
							setAttributes( { closeOnOverlay: v } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Close on Escape', 'harlow' ) }
						checked={ !! closeOnEscape }
						onChange={ ( v ) =>
							setAttributes( { closeOnEscape: v } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __(
							'Prevent the page from scrolling',
							'harlow'
						) }
						checked={ !! preventScroll }
						onChange={ ( v ) =>
							setAttributes( { preventScroll: v } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<div
						id={ `off-canvas-${ element }` }
						className={
							`e-off-canvas e-off-canvas--${ side } e-off-canvas--editing` +
							( overlay ? '' : ' e-off-canvas--no-overlay' )
						}
						role="dialog"
						aria-label={ name || __( 'Off-Canvas', 'harlow' ) }
						style={
							vertical
								? {
										'--e-off-canvas-width': '100%',
										'--e-off-canvas-height': length,
									}
								: {
										'--e-off-canvas-width': length,
										'--e-off-canvas-height': '100vh',
									}
						}
					>
						{ '\n' }
						<div className="e-off-canvas__overlay"></div>
						{ '\n' }
						<div className="e-off-canvas__main">
							{ '\n' }
							{ closeButton && (
								<>
									<button
										type="button"
										className="e-off-canvas__close"
										aria-label={ __( 'Close', 'harlow' ) }
										dangerouslySetInnerHTML={ iconHtml(
											closeIcon,
											false
										) }
									/>
									{ '\n' }
								</>
							) }
							<div { ...innerBlocksProps } />
							{ '\n' }
						</div>
						{ '\n' }
					</div>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}

/** The panel's blocks are saved; the panel around them is printed by the server. */
export const save = () => <InnerBlocks.Content />;
