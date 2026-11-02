/**
 * A hotspot in the editor: includes/sections/hotspot.php. A click on a spot opens its
 * tooltip (as the page's click trigger does), whose words are then typed in place. The
 * picture, the spots (label, icon, link, place, tooltip) and the tooltip's and spots'
 * behaviour are in the sidebar.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	TextareaControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { Fragment, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import ItemPanels from '../../editor/items';
import {
	elementProps,
	iconHtml,
	IconPicker,
	LinkFields,
	linkUrl,
	PicturePicker,
	usePictureUrl,
} from '../../editor/shared';

const POSITIONS = [
	[ 'top', __( 'Top', 'harlow' ) ],
	[ 'right', __( 'Right', 'harlow' ) ],
	[ 'bottom', __( 'Bottom', 'harlow' ) ],
	[ 'left', __( 'Left', 'harlow' ) ],
];

const TOOLTIP_FX = [
	[ 'e-hotspot--fade-in-out', __( 'Fade In/Out', 'harlow' ) ],
	[ 'e-hotspot--fade-grow', __( 'Fade Grow', 'harlow' ) ],
	[ 'e-hotspot--fade-direction', __( 'Fade By Direction', 'harlow' ) ],
	[ 'e-hotspot--slide-direction', __( 'Slide By Direction', 'harlow' ) ],
];

const SPOT_FX = [
	[ 'e-hotspot--soft-beat', __( 'Soft Beat', 'harlow' ) ],
	[ 'e-hotspot--expand', __( 'Expand', 'harlow' ) ],
	[ 'e-hotspot--overlay', __( 'Overlay', 'harlow' ) ],
	[ '', __( 'None', 'harlow' ) ],
];

/** The grey placeholder hotspot.php prints until a picture is chosen. */
const PLACEHOLDER =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%23e6e9ec'/%3E%3C/svg%3E";

/**
 * The element's classes: the widget's own when it has none yet (hotspot.php).
 *
 * @param {string} classes The block's classes.
 * @return {string} The classes.
 */
function hotspotClasses( classes ) {
	const own = ( classes || '' ).split( /\s+/ ).filter( Boolean );
	return [
		...[
			'elementor-element',
			'elementor-widget',
			'elementor-widget-hotspot',
		].filter( ( c ) => ! own.includes( c ) ),
		...own,
	].join( ' ' );
}

/**
 * A new spot's id: seven hex characters, as Elementor gives a repeater's item.
 *
 * @return {string} The id.
 */
function newId() {
	return Math.floor( Math.random() * 0xfffffff )
		.toString( 16 )
		.padStart( 7, '0' );
}

export default function Edit( { attributes, setAttributes } ) {
	const {
		image,
		alt,
		hotspots,
		tooltipPosition,
		tooltipTrigger,
		tooltipAnimation,
		tooltipDuration,
		hotspotAnimation,
		sequenced,
		sequencedDuration,
	} = attributes;
	const [ open, setOpen ] = useState( -1 );
	const url = usePictureUrl( image );
	const position = POSITIONS.some( ( [ p ] ) => p === tooltipPosition )
		? tooltipPosition
		: 'top';
	const trigger = [ 'click', 'mouseenter', 'none' ].includes( tooltipTrigger )
		? tooltipTrigger
		: 'click';
	const tooltipFx = TOOLTIP_FX.some( ( [ v ] ) => v === tooltipAnimation )
		? tooltipAnimation
		: 'e-hotspot--fade-in-out';
	const spotFx = SPOT_FX.some( ( [ v ] ) => v === hotspotAnimation )
		? hotspotAnimation
		: 'e-hotspot--expand';
	const direction = [
		'e-hotspot--fade-direction',
		'e-hotspot--slide-direction',
	].includes( tooltipFx );

	// Every spot an id of its own (a spot added in the sidebar is a copy of the last).
	useEffect( () => {
		const seen = new Set();
		let changed = false;
		const next = hotspots.map( ( spot ) => {
			if ( ! spot.id || seen.has( spot.id ) ) {
				changed = true;
				spot = { ...spot, id: newId() };
			}
			seen.add( spot.id );
			return spot;
		} );
		if ( changed ) {
			setAttributes( { hotspots: next } );
		}
	}, [ hotspots, setAttributes ] );

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
				classes: hotspotClasses( attributes.classes ),
				settings: JSON.stringify( {
					...settings,
					tooltip_position: position,
					tooltip_trigger: trigger,
					tooltip_animation: tooltipFx,
					tooltip_animation_duration:
						Math.max( 0, Number( tooltipDuration ) ) || 0,
					hotspot_animation: spotFx,
					hotspot_sequenced_animation: sequenced ? 'yes' : '',
					hotspot_sequenced_animation_duration:
						Math.max( 0, Number( sequencedDuration ) ) || 0,
				} ),
			},
			'widget',
			'hotspot.default'
		)
	);
	const setSpots = ( next ) => setAttributes( { hotspots: next } );
	const update = ( index, patch ) =>
		setSpots(
			hotspots.map( ( spot, i ) =>
				i === index ? { ...spot, ...patch } : spot
			)
		);
	const flip = ( index ) => setOpen( open === index ? -1 : index );
	const number = ( v, fallback ) =>
		v === '' || isNaN( Number( v ) ) ? fallback : Number( v );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Image', 'harlow' ) }>
					<PicturePicker
						label={ __( 'Choose image', 'harlow' ) }
						value={ image }
						onChange={ ( id ) => setAttributes( { image: id } ) }
						none={ __( 'A grey placeholder', 'harlow' ) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Alternative text', 'harlow' ) }
						help={ __(
							'Empty: the picture’s own, from the Media Library.',
							'harlow'
						) }
						value={ alt }
						onChange={ ( v ) => setAttributes( { alt: v } ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Tooltip', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Position', 'harlow' ) }
						value={ position }
						options={ POSITIONS.map( ( [ value, label ] ) => ( {
							value,
							label,
						} ) ) }
						onChange={ ( v ) =>
							setAttributes( { tooltipPosition: v } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Trigger', 'harlow' ) }
						value={ trigger }
						options={ [
							{ value: 'click', label: __( 'Click', 'harlow' ) },
							{
								value: 'mouseenter',
								label: __( 'Hover', 'harlow' ),
							},
							{ value: 'none', label: __( 'None', 'harlow' ) },
						] }
						onChange={ ( v ) =>
							setAttributes( { tooltipTrigger: v } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Animation', 'harlow' ) }
						value={ tooltipFx }
						options={ TOOLTIP_FX.map( ( [ value, label ] ) => ( {
							value,
							label,
						} ) ) }
						onChange={ ( v ) =>
							setAttributes( { tooltipAnimation: v } )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						min={ 0 }
						step={ 100 }
						label={ __( 'Animation duration (ms)', 'harlow' ) }
						value={ tooltipDuration }
						onChange={ ( v ) =>
							setAttributes( {
								tooltipDuration: Math.max( 0, number( v, 0 ) ),
							} )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Hotspot animation', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Animation', 'harlow' ) }
						value={ spotFx }
						options={ SPOT_FX.map( ( [ value, label ] ) => ( {
							value,
							label,
						} ) ) }
						onChange={ ( v ) =>
							setAttributes( { hotspotAnimation: v } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Sequenced animation', 'harlow' ) }
						checked={ !! sequenced }
						onChange={ ( v ) => setAttributes( { sequenced: v } ) }
					/>
					{ sequenced && (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							type="number"
							min={ 0 }
							step={ 100 }
							label={ __( 'Sequence duration (ms)', 'harlow' ) }
							value={ sequencedDuration }
							onChange={ ( v ) =>
								setAttributes( {
									sequencedDuration: Math.max(
										0,
										number( v, 0 )
									),
								} )
							}
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<ItemPanels
				items={ hotspots }
				onChange={ setSpots }
				blank={ { x: 50, y: 50, tooltip: '' } }
				title={ ( n ) =>
					/* translators: %d: its number. */
					sprintf( __( 'Hotspot %d', 'harlow' ), n )
				}
				addLabel={ __( 'Add a hotspot', 'harlow' ) }
			>
				{ ( spot, change ) => (
					<>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Label', 'harlow' ) }
							value={ spot.label || '' }
							onChange={ ( label ) => change( { label } ) }
						/>
						<IconPicker
							allowNone
							value={ spot.icon || '' }
							onChange={ ( icon ) => change( { icon } ) }
						/>
						<LinkFields value={ spot } onChange={ change } />
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Horizontal orientation', 'harlow' ) }
							value={
								spot.horizontal === 'right' ? 'right' : 'left'
							}
							options={ [
								{
									value: 'left',
									label: __( 'Left', 'harlow' ),
								},
								{
									value: 'right',
									label: __( 'Right', 'harlow' ),
								},
							] }
							onChange={ ( horizontal ) =>
								change( { horizontal } )
							}
						/>
						<RangeControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Offset (%)', 'harlow' ) }
							value={ number( spot.x, 50 ) }
							min={ 0 }
							max={ 100 }
							onChange={ ( x ) =>
								change( { x: number( x, 50 ) } )
							}
						/>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Vertical orientation', 'harlow' ) }
							value={
								spot.vertical === 'bottom' ? 'bottom' : 'top'
							}
							options={ [
								{ value: 'top', label: __( 'Top', 'harlow' ) },
								{
									value: 'bottom',
									label: __( 'Bottom', 'harlow' ),
								},
							] }
							onChange={ ( vertical ) => change( { vertical } ) }
						/>
						<RangeControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Offset (%)', 'harlow' ) }
							value={ number( spot.y, 50 ) }
							min={ 0 }
							max={ 100 }
							onChange={ ( y ) =>
								change( { y: number( y, 50 ) } )
							}
						/>
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Tooltip content (HTML)', 'harlow' ) }
							value={ spot.tooltip || '' }
							onChange={ ( tooltip ) => change( { tooltip } ) }
						/>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Tooltip position', 'harlow' ) }
							value={ spot.tooltipPosition || '' }
							options={ [
								{ value: '', label: __( 'Default', 'harlow' ) },
								...POSITIONS.map( ( [ value, label ] ) => ( {
									value,
									label,
								} ) ),
							] }
							onChange={ ( tooltipPos ) =>
								change( { tooltipPosition: tooltipPos } )
							}
						/>
					</>
				) }
			</ItemPanels>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<img
						src={ url || PLACEHOLDER }
						alt={ alt }
						width={ url ? undefined : 800 }
						height={ url ? undefined : 450 }
					/>
					{ hotspots.map( ( spot, index ) => {
						const link = !! spot.link;
						const circle = ! spot.label && ! spot.icon;
						const own = POSITIONS.some(
							( [ p ] ) => p === spot.tooltipPosition
						)
							? spot.tooltipPosition
							: '';
						const shows =
							trigger !== 'none' &&
							! ( trigger === 'click' && link );
						const Tag = link ? 'a' : 'div';
						const classes = [
							'e-hotspot',
							`elementor-repeater-item-${ spot.id || '' }`,
							sequenced ? 'e-hotspot--sequenced' : '',
							`e-hotspot--position-${
								spot.horizontal === 'right' ? 'right' : 'left'
							}`,
							`e-hotspot--position-${
								spot.vertical === 'bottom' ? 'bottom' : 'top'
							}`,
							link ? 'e-hotspot--link' : '',
							trigger === 'click' && link
								? 'e-hotspot--no-tooltip'
								: '',
							circle ? 'e-hotspot--circle' : '',
							! spot.label && spot.icon ? 'e-hotspot--icon' : '',
							`e-hotspot--tooltip-position-${ own || position }`,
							open === index ? 'e-hotspot--active' : '',
						].filter( Boolean );
						const tooltip = (
							<RichText
								tagName="div"
								className={
									'e-hotspot__tooltip' +
									( direction
										? ''
										: ' e-hotspot--tooltip-position' ) +
									` ${ tooltipFx }` +
									( direction && own
										? ` e-hotspot--override-tooltip-animation-from-${ own }`
										: '' )
								}
								value={ spot.tooltip || '' }
								onChange={ ( value ) =>
									update( index, { tooltip: value } )
								}
								placeholder={ __( 'Tooltip', 'harlow' ) }
							/>
						);
						return (
							<Fragment key={ spot.id || index }>
								{ '\n' }
								<Tag
									className={ classes.join( ' ' ) }
									style={ {
										'--hotspot-translate-x': `${ Math.min(
											100,
											Math.max( 0, number( spot.x, 50 ) )
										) }%`,
										'--hotspot-translate-y': `${ Math.min(
											100,
											Math.max( 0, number( spot.y, 50 ) )
										) }%`,
									} }
									href={
										link ? linkUrl( spot.link ) : undefined
									}
									target={
										link && spot.linkTarget
											? spot.linkTarget
											: undefined
									}
									rel={
										link && spot.linkRel
											? spot.linkRel
											: undefined
									}
									onClick={ ( event ) => {
										if ( link ) {
											event.preventDefault();
										}
									} }
								>
									{ '\n' }
									<div
										className={
											'e-hotspot__button' +
											( spotFx ? ` ${ spotFx }` : '' )
										}
										role="button"
										tabIndex={ 0 }
										onClick={ () => flip( index ) }
										onKeyDown={ ( event ) => {
											if (
												event.key === 'Enter' ||
												event.key === ' '
											) {
												event.preventDefault();
												flip( index );
											}
										} }
									>
										{ circle ? (
											<>
												{ '\n' }
												<div className="e-hotspot__outer-circle"></div>
												{ '\n' }
												<div className="e-hotspot__inner-circle"></div>
												{ '\n' }
											</>
										) : (
											<>
												{ spot.icon && (
													<>
														{ '\n' }
														<div
															className="e-hotspot__icon"
															dangerouslySetInnerHTML={ iconHtml(
																spot.icon,
																false
															) }
														/>
													</>
												) }
												{ spot.label && (
													<>
														{ '\n' }
														<div
															className="e-hotspot__label"
															dangerouslySetInnerHTML={ {
																__html: spot.label,
															} }
														/>
													</>
												) }
												{ '\n' }
											</>
										) }
									</div>
									{ shows && (
										<>
											{ '\n' }
											{ direction ? (
												<div className="e-hotspot__direction-mask e-hotspot--tooltip-position">
													{ '\n' }
													{ tooltip }
													{ '\n' }
												</div>
											) : (
												tooltip
											) }
										</>
									) }
									{ '\n' }
								</Tag>
							</Fragment>
						);
					} ) }
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
