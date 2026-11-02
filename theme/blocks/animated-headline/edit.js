/**
 * An animated headline in the editor: includes/sections/animated-headline.php. The shape is
 * drawn once over the highlighted words as the editor shows the block; rotating words show
 * the first one. The words before, between and after are typed in place; the style, shape,
 * animation, rotating words, timing, link and tag are in the sidebar.
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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { elementProps, LinkFields } from '../../editor/shared';

/** Elementor Pro's shapes (animated-headline.php). */
const SHAPES = {
	circle: [
		'M325,18C228.7-8.3,118.5,8.3,78,21C22.4,38.4,4.6,54.6,5.6,77.6c1.4,32.4,52.2,54,142.6,63.7 c66.2,7.1,212.2,7.5,273.5-8.3c64.4-16.6,104.3-57.6,33.8-98.2C386.7-4.9,179.4-1.4,126.3,20.7',
	],
	underline_zigzag: [
		'M9.3,127.3c49.3-3,150.7-7.6,199.7-7.4c121.9,0.4,189.9,0.4,282.3,7.2C380.1,129.6,181.2,130.6,70,139 c82.6-2.9,254.2-1,335.9,1.3c-56,1.4-137.2-0.3-197.1,9',
	],
	x: [
		'M497.4,23.9C301.6,40,155.9,80.6,4,144.4',
		'M14.1,27.6c204.5,20.3,393.8,74,467.3,111.7',
	],
	strikethrough: [ 'M3,75h493.5' ],
	curly: [
		'M3,146.1c17.1-8.8,33.5-17.8,51.4-17.8c15.6,0,17.1,18.1,30.2,18.1c22.9,0,36-18.6,53.9-18.6 c17.1,0,21.3,18.5,37.5,18.5c21.3,0,31.8-18.6,49-18.6c22.1,0,18.8,18.8,36.8,18.8c18.8,0,37.5-18.6,49-18.6c20.4,0,17.1,19,36.8,19 c22.9,0,36.8-20.6,54.7-18.6c17.7,1.4,7.1,19.5,33.5,18.8c17.1,0,47.2-6.5,61.1-15.6',
	],
	diagonal: [ 'M13.5,15.5c131,13.7,289.3,55.5,475,125.5' ],
	double: [
		'M8.4,143.1c14.2-8,97.6-8.8,200.6-9.2c122.3-0.4,287.5,7.2,287.5,7.2',
		'M8,19.4c72.3-5.3,162-7.8,216-7.8c54,0,136.2,0,267,7.8',
	],
	double_underline: [
		'M5,125.4c30.5-3.8,137.9-7.6,177.3-7.6c117.2,0,252.2,4.7,312.7,7.6',
		'M26.9,143.8c55.1-6.1,126-6.3,162.2-6.1c46.5,0.2,203.9,3.2,268.9,6.4',
	],
	underline: [
		'M7.7,145.6C109,125,299.9,116.2,401,121.3c42.1,2.2,87.6,11.8,87.3,25.7',
	],
};

const MARKERS = [
	[ 'circle', __( 'Circle', 'harlow' ) ],
	[ 'curly', __( 'Curly', 'harlow' ) ],
	[ 'underline', __( 'Underline', 'harlow' ) ],
	[ 'double', __( 'Double', 'harlow' ) ],
	[ 'double_underline', __( 'Double Underline', 'harlow' ) ],
	[ 'underline_zigzag', __( 'Underline Zigzag', 'harlow' ) ],
	[ 'diagonal', __( 'Diagonal', 'harlow' ) ],
	[ 'strikethrough', __( 'Strikethrough', 'harlow' ) ],
	[ 'x', 'X' ],
];

const ANIMATIONS = [
	[ 'typing', __( 'Typing', 'harlow' ) ],
	[ 'clip', __( 'Clip', 'harlow' ) ],
	[ 'flip', __( 'Flip', 'harlow' ) ],
	[ 'swirl', __( 'Swirl', 'harlow' ) ],
	[ 'blinds', __( 'Blinds', 'harlow' ) ],
	[ 'drop-in', __( 'Drop-in', 'harlow' ) ],
	[ 'wave', __( 'Wave', 'harlow' ) ],
	[ 'slide', __( 'Slide', 'harlow' ) ],
	[ 'slide-down', __( 'Slide Down', 'harlow' ) ],
];

const TAGS = [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ];

/**
 * The element's classes with the headline's style, as animated-headline.php writes them.
 *
 * @param {Object} attributes The block's attributes.
 * @param {string} style      The headline's style.
 * @return {string} The classes.
 */
function headlineClasses( attributes, style ) {
	const own = ( attributes.classes || '' )
		.split( /\s+/ )
		.filter( ( c ) => c && ! c.startsWith( 'elementor-headline--style-' ) );
	return [
		...[
			'elementor-element',
			'elementor-widget',
			'elementor-widget-animated-headline',
		].filter( ( c ) => ! own.includes( c ) ),
		...own,
		`elementor-headline--style-${ style }`,
	].join( ' ' );
}

export default function Edit( { attributes, setAttributes } ) {
	const {
		headlineStyle,
		marker,
		animationType,
		beforeText,
		highlightedText,
		rotatingText,
		afterText,
		loop,
		highlightDuration,
		highlightDelay,
		rotateDelay,
		tag,
		markerWidth,
		markerRounded,
		markerFront,
	} = attributes;
	const style = headlineStyle === 'rotate' ? 'rotate' : 'highlight';
	const shape = SHAPES[ marker ] ? marker : 'circle';
	const type = ANIMATIONS.some( ( [ t ] ) => t === animationType )
		? animationType
		: 'typing';
	const Tag = TAGS.includes( tag ) ? tag : 'h3';
	const words = ( rotatingText || '' )
		.split( /\r?\n/ )
		.map( ( w ) => w.trim() )
		.filter( Boolean );
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
				classes: headlineClasses( attributes, style ),
				settings: JSON.stringify( {
					...settings,
					headline_style: style,
					animation_type: type,
					marker: shape,
					highlighted_text: ( highlightedText || '' ).replace(
						/<[^>]*>/g,
						''
					),
					rotating_text: words.join( '\n' ),
					loop: loop ? 'yes' : '',
					highlight_animation_duration:
						Number( highlightDuration ) || 0,
					highlight_iteration_delay: Number( highlightDelay ) || 0,
					rotate_iteration_delay: Number( rotateDelay ) || 0,
				} ),
			},
			'widget',
			'animated-headline.default'
		)
	);
	const number = ( v ) => Math.max( 0, parseInt( v, 10 ) || 0 );
	let headline = 'elementor-headline';
	if ( style === 'rotate' ) {
		headline += ` elementor-headline-animation-type-${ type }`;
		if ( [ 'typing', 'swirl', 'blinds', 'wave' ].includes( type ) ) {
			headline += ' elementor-headline-letters';
		}
	}
	const stroke = {
		strokeWidth: Math.max( 1, Math.min( 50, Number( markerWidth ) || 9 ) ),
		...( markerRounded
			? { strokeLinecap: 'round', strokeLinejoin: 'round' }
			: {} ),
	};
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Headline', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Style', 'harlow' ) }
						value={ style }
						options={ [
							{
								value: 'highlight',
								label: __( 'Highlighted', 'harlow' ),
							},
							{
								value: 'rotate',
								label: __( 'Rotating', 'harlow' ),
							},
						] }
						onChange={ ( v ) =>
							setAttributes( { headlineStyle: v } )
						}
					/>
					{ style === 'highlight' ? (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Shape', 'harlow' ) }
							value={ shape }
							options={ MARKERS.map( ( [ value, label ] ) => ( {
								value,
								label,
							} ) ) }
							onChange={ ( v ) => setAttributes( { marker: v } ) }
						/>
					) : (
						<>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Animation', 'harlow' ) }
								value={ type }
								options={ ANIMATIONS.map(
									( [ value, label ] ) => ( {
										value,
										label,
									} )
								) }
								onChange={ ( v ) =>
									setAttributes( { animationType: v } )
								}
							/>
							<TextareaControl
								__nextHasNoMarginBottom
								label={ __( 'Rotating text', 'harlow' ) }
								help={ __( 'One per line.', 'harlow' ) }
								value={ rotatingText }
								onChange={ ( v ) =>
									setAttributes( { rotatingText: v } )
								}
							/>
						</>
					) }
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Infinite loop', 'harlow' ) }
						checked={ !! loop }
						onChange={ ( v ) => setAttributes( { loop: v } ) }
					/>
					{ style === 'highlight' ? (
						<>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								type="number"
								min={ 0 }
								step={ 100 }
								label={ __( 'Duration (ms)', 'harlow' ) }
								value={ highlightDuration }
								onChange={ ( v ) =>
									setAttributes( {
										highlightDuration: number( v ),
									} )
								}
							/>
							{ loop && (
								<TextControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									type="number"
									min={ 0 }
									step={ 100 }
									label={ __( 'Delay (ms)', 'harlow' ) }
									value={ highlightDelay }
									onChange={ ( v ) =>
										setAttributes( {
											highlightDelay: number( v ),
										} )
									}
								/>
							) }
						</>
					) : (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							type="number"
							min={ 0 }
							step={ 100 }
							label={ __( 'Duration (ms)', 'harlow' ) }
							value={ rotateDelay }
							onChange={ ( v ) =>
								setAttributes( { rotateDelay: number( v ) } )
							}
						/>
					) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'HTML Tag', 'harlow' ) }
						value={ Tag }
						options={ TAGS.map( ( t ) => ( {
							value: t,
							label: t,
						} ) ) }
						onChange={ ( v ) => setAttributes( { tag: v } ) }
					/>
				</PanelBody>
				{ style === 'highlight' && (
					<PanelBody
						title={ __( 'Shape', 'harlow' ) }
						initialOpen={ false }
					>
						<RangeControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Width', 'harlow' ) }
							value={ stroke.strokeWidth }
							min={ 1 }
							max={ 30 }
							onChange={ ( v ) =>
								setAttributes( { markerWidth: Number( v ) } )
							}
						/>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Rounded edges', 'harlow' ) }
							checked={ !! markerRounded }
							onChange={ ( v ) =>
								setAttributes( { markerRounded: v } )
							}
						/>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Bring to front', 'harlow' ) }
							checked={ !! markerFront }
							onChange={ ( v ) =>
								setAttributes( { markerFront: v } )
							}
						/>
					</PanelBody>
				) }
				<PanelBody
					title={ __( 'Link', 'harlow' ) }
					initialOpen={ false }
				>
					<LinkFields
						value={ attributes }
						onChange={ setAttributes }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<Tag className={ headline }>
						{ '\n' }
						<RichText
							tagName="span"
							className="elementor-headline-plain-text elementor-headline-text-wrapper"
							value={ beforeText }
							onChange={ ( v ) =>
								setAttributes( { beforeText: v } )
							}
							placeholder={ __( 'Before text', 'harlow' ) }
							withoutInteractiveFormatting
						/>
						{ '\n' }
						<span
							className={
								'elementor-headline-dynamic-wrapper elementor-headline-text-wrapper' +
								( style === 'highlight' ? ' e-animated' : '' )
							}
						>
							{ style === 'rotate' ? (
								words.map( ( word, index ) => (
									<Fragment key={ index }>
										{ '\n' }
										<span
											className={
												'elementor-headline-dynamic-text' +
												( index === 0
													? ' elementor-headline-text-active'
													: '' )
											}
										>
											{ word.replace( / /g, '\u00a0' ) }
										</span>
									</Fragment>
								) )
							) : (
								<>
									{ '\n' }
									<RichText
										tagName="span"
										className="elementor-headline-dynamic-text elementor-headline-text-active"
										value={ highlightedText }
										onChange={ ( v ) =>
											setAttributes( {
												highlightedText: v,
											} )
										}
										placeholder={ __(
											'Highlighted text',
											'harlow'
										) }
										withoutInteractiveFormatting
									/>
									{ '\n' }
									<svg
										key={ shape }
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 500 150"
										preserveAspectRatio="none"
										aria-hidden="true"
										style={
											markerFront
												? { zIndex: 2 }
												: undefined
										}
									>
										{ SHAPES[ shape ].map( ( d ) => (
											<path
												key={ d }
												d={ d }
												{ ...stroke }
											/>
										) ) }
									</svg>
								</>
							) }
							{ '\n' }
						</span>
						{ '\n' }
						<RichText
							tagName="span"
							className="elementor-headline-plain-text elementor-headline-text-wrapper"
							value={ afterText }
							onChange={ ( v ) =>
								setAttributes( { afterText: v } )
							}
							placeholder={ __( 'After text', 'harlow' ) }
							withoutInteractiveFormatting
						/>
						{ '\n' }
					</Tag>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
