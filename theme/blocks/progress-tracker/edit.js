/**
 * A progress tracker in the editor: includes/sections/progress-tracker.php, drawn a third
 * of the way through (the page's tracker follows the scroll); its type, what it follows,
 * its direction, the percentage and a circle's thickness in the sidebar.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { elementProps } from '../../editor/shared';

/** How far the tracker is drawn in the editor. */
const SHOWN = 0.3;

/**
 * The element's classes: the widget's own when it has none yet (progress-tracker.php).
 *
 * @param {string} classes The block's classes.
 * @return {string} The classes.
 */
function trackerClasses( classes ) {
	const own = ( classes || '' ).split( /\s+/ ).filter( Boolean );
	return [
		...[
			'elementor-element',
			'elementor-widget',
			'elementor-widget-progress-tracker',
		].filter( ( c ) => ! own.includes( c ) ),
		...own,
	].join( ' ' );
}

export default function Edit( { attributes, setAttributes } ) {
	const {
		trackerType,
		relativeTo,
		selector,
		direction,
		percentage,
		progressWidth,
		trackWidth,
	} = attributes;
	const type = trackerType === 'circular' ? 'circular' : 'horizontal';
	const dir = direction === 'rtl' ? 'rtl' : 'ltr';
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
				classes: trackerClasses( attributes.classes ),
				settings: JSON.stringify( {
					...settings,
					type,
					relative_to:
						relativeTo === 'selector' ? 'selector' : 'entire_page',
					selector,
					direction: dir,
					percentage: percentage ? 'yes' : '',
				} ),
			},
			'widget',
			'progress-tracker.default'
		)
	);
	const progress = Math.max(
		1,
		Math.min( 20, Number( progressWidth ) || 0 )
	);
	const track = Math.max( 0, Math.min( 20, Number( trackWidth ) || 0 ) );
	const radius = 50 - Math.max( progress, track ) / 2;
	const length = Math.round( 2 * Math.PI * radius * 1000 ) / 1000;
	const label = percentage ? (
		<div className="current-progress-percentage">
			{ `${ Math.round( SHOWN * 100 ) }%` }
		</div>
	) : null;
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Progress Tracker', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Tracker type', 'harlow' ) }
						value={ type }
						options={ [
							{
								value: 'horizontal',
								label: __( 'Horizontal', 'harlow' ),
							},
							{
								value: 'circular',
								label: __( 'Circular', 'harlow' ),
							},
						] }
						onChange={ ( v ) =>
							setAttributes( { trackerType: v } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Progress relative to', 'harlow' ) }
						value={ relativeTo }
						options={ [
							{
								value: 'entire_page',
								label: __( 'Entire page', 'harlow' ),
							},
							{
								value: 'selector',
								label: __( 'Selector', 'harlow' ),
							},
						] }
						onChange={ ( v ) => setAttributes( { relativeTo: v } ) }
					/>
					{ relativeTo === 'selector' && (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Selector', 'harlow' ) }
							help={ __(
								'The element the tracker follows, such as #post or .article.',
								'harlow'
							) }
							value={ selector }
							onChange={ ( v ) =>
								setAttributes( { selector: v } )
							}
						/>
					) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Direction', 'harlow' ) }
						value={ dir }
						options={ [
							{
								value: 'ltr',
								label:
									type === 'circular'
										? __( 'Clockwise', 'harlow' )
										: __( 'Left to right', 'harlow' ),
							},
							{
								value: 'rtl',
								label:
									type === 'circular'
										? __( 'Counter-clockwise', 'harlow' )
										: __( 'Right to left', 'harlow' ),
							},
						] }
						onChange={ ( v ) => setAttributes( { direction: v } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Percentage', 'harlow' ) }
						checked={ !! percentage }
						onChange={ ( v ) => setAttributes( { percentage: v } ) }
					/>
					{ type === 'circular' && (
						<>
							<RangeControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Progress thickness', 'harlow' ) }
								value={ progress }
								min={ 1 }
								max={ 20 }
								onChange={ ( v ) =>
									setAttributes( {
										progressWidth: Number( v ),
									} )
								}
							/>
							<RangeControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Track thickness', 'harlow' ) }
								value={ track }
								min={ 0 }
								max={ 20 }
								onChange={ ( v ) =>
									setAttributes( { trackWidth: Number( v ) } )
								}
							/>
						</>
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<div
						className={ `elementor-scrolling-tracker elementor-scrolling-tracker-${ type } elementor-scrolling-tracker-alignment-${ dir }` }
					>
						{ '\n' }
						{ type === 'circular' ? (
							<>
								<svg viewBox="0 0 100 100" aria-hidden="true">
									{ '\n' }
									<circle
										className="circle-tracker-background"
										cx="50"
										cy="50"
										r={ radius }
										strokeWidth={ track }
									/>
									{ '\n' }
									<circle
										className="current-progress"
										cx="50"
										cy="50"
										r={ radius }
										strokeWidth={ progress }
										strokeDasharray={ length }
										strokeDashoffset={
											length * ( 1 - SHOWN )
										}
									/>
									{ '\n' }
								</svg>
								{ label && (
									<>
										{ '\n' }
										{ label }
									</>
								) }
							</>
						) : (
							<div
								className="current-progress"
								style={ { width: `${ SHOWN * 100 }%` } }
							>
								{ label && (
									<>
										{ '\n' }
										{ label }
										{ '\n' }
									</>
								) }
							</div>
						) }
						{ '\n' }
					</div>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
