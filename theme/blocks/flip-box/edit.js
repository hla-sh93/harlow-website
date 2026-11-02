/**
 * A flip box in the editor: includes/sections/flip-box.php, the words of its front and back
 * typed in place. The canvas shows one side at a time, chosen in the toolbar or the sidebar
 * (the box does not turn by itself while it is edited); the graphic, the link, the height,
 * the corner radius and the effect in the sidebar.
 */
import {
	BlockControls,
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	SelectControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import {
	elementProps,
	iconHtml,
	IconPicker,
	LinkFields,
	linkUrl,
} from '../../editor/shared';
import { FORMATS, stay, TITLE_TAGS, withClasses } from '../image-box/edit';
import { Picture, PictureFields } from '../image-box/picture';
import { oneOf, SHAPES, VIEWS } from '../icon-box/edit';
import { lengthVars, ResponsiveLength } from '../spacer/responsive';

const options = ( list ) =>
	list.map( ( [ value, label ] ) => ( { value, label } ) );

const GRAPHICS = options( [
	[ 'icon', __( 'Icon', 'harlow' ) ],
	[ 'image', __( 'Image', 'harlow' ) ],
	[ 'none', __( 'None', 'harlow' ) ],
] );
const EFFECTS = options( [
	[ 'flip', __( 'Flip', 'harlow' ) ],
	[ 'slide', __( 'Slide', 'harlow' ) ],
	[ 'push', __( 'Push', 'harlow' ) ],
	[ 'zoom-in', __( 'Zoom In', 'harlow' ) ],
	[ 'zoom-out', __( 'Zoom Out', 'harlow' ) ],
	[ 'fade', __( 'Fade', 'harlow' ) ],
] );
const DIRECTIONS = options( [
	[ 'up', __( 'Up', 'harlow' ) ],
	[ 'down', __( 'Down', 'harlow' ) ],
	[ 'left', __( 'Left', 'harlow' ) ],
	[ 'right', __( 'Right', 'harlow' ) ],
] );
const SIZES = options( [
	[ 'sm', __( 'Small', 'harlow' ) ],
	[ 'xs', __( 'Extra Small', 'harlow' ) ],
	[ 'md', __( 'Medium', 'harlow' ) ],
	[ 'lg', __( 'Large', 'harlow' ) ],
	[ 'xl', __( 'Extra Large', 'harlow' ) ],
] );
const CLICKS = options( [
	[ 'button', __( 'Button Only', 'harlow' ) ],
	[ 'box', __( 'Whole Box', 'harlow' ) ],
] );
const TAGS = TITLE_TAGS.map( ( t ) => ( {
	value: t,
	label: t.toUpperCase(),
} ) );

export default function Edit( { attributes, setAttributes } ) {
	const [ side, setSide ] = useState( 'front' );
	const { image, imageSize, icon, button, link, flip3d } = attributes;
	const graphic = oneOf( attributes.graphic, GRAPHICS );
	const view = oneOf( attributes.iconView, VIEWS );
	const shape = oneOf( attributes.iconShape, SHAPES );
	const effect = oneOf( attributes.flipEffect, EFFECTS );
	const direction = oneOf( attributes.flipDirection, DIRECTIONS );
	const size = oneOf( attributes.buttonSize, SIZES );
	const click = oneOf( attributes.linkClick, CLICKS );
	const FrontTag = TITLE_TAGS.includes( attributes.titleTagFront )
		? attributes.titleTagFront
		: 'h3';
	const BackTag = TITLE_TAGS.includes( attributes.titleTagBack )
		? attributes.titleTagBack
		: 'h3';
	const boxLink = !! link && click === 'box';
	const Back = boxLink ? 'a' : 'div';
	const ButtonTag = boxLink ? 'span' : 'a';

	const blockProps = useBlockProps( {
		...elementProps(
			withClasses( attributes, /(^|\s)elementor-flip-box--\S+/g, [
				`elementor-flip-box--effect-${ effect }`,
				`elementor-flip-box--direction-${ direction }`,
				flip3d && 'elementor-flip-box--3d',
			] ),
			'widget',
			'flip-box.default'
		),
		style: {
			...lengthVars( attributes, 'height', '--harlow-flip-height' ),
			...lengthVars( attributes, 'radius', '--harlow-flip-radius' ),
		},
	} );
	const select = ( label, key, value, list ) => (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			value={ value }
			options={ list }
			onChange={ ( v ) => setAttributes( { [ key ]: v } ) }
		/>
	);
	const words = ( key, tagName, className, placeholder ) => (
		<RichText
			tagName={ tagName }
			className={ className }
			value={ attributes[ key ] }
			onChange={ ( v ) => setAttributes( { [ key ]: v } ) }
			placeholder={ placeholder }
			allowedFormats={ FORMATS }
		/>
	);
	const sides = (
		<>
			<ToolbarButton
				isPressed={ side === 'front' }
				onClick={ () => setSide( 'front' ) }
			>
				{ __( 'Front', 'harlow' ) }
			</ToolbarButton>
			<ToolbarButton
				isPressed={ side === 'back' }
				onClick={ () => setSide( 'back' ) }
			>
				{ __( 'Back', 'harlow' ) }
			</ToolbarButton>
		</>
	);

	return (
		<>
			<BlockControls>
				<ToolbarGroup>{ sides }</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Side shown in the editor', 'harlow' ) }>
					<div className="harlow-flip-box-sides">
						<Button
							variant={
								side === 'front' ? 'primary' : 'secondary'
							}
							onClick={ () => setSide( 'front' ) }
						>
							{ __( 'Front', 'harlow' ) }
						</Button>
						<Button
							variant={
								side === 'back' ? 'primary' : 'secondary'
							}
							onClick={ () => setSide( 'back' ) }
						>
							{ __( 'Back', 'harlow' ) }
						</Button>
					</div>
				</PanelBody>
				<PanelBody
					title={ __( 'Front', 'harlow' ) }
					initialOpen={ false }
				>
					{ select(
						__( 'Graphic Element', 'harlow' ),
						'graphic',
						graphic,
						GRAPHICS
					) }
					{ graphic === 'image' && (
						<PictureFields
							label={ __( 'Choose Image', 'harlow' ) }
							id={ image }
							size={ imageSize }
							onChange={ ( { id, size: s } ) =>
								setAttributes(
									id === undefined
										? { imageSize: s }
										: { image: id }
								)
							}
						/>
					) }
					{ graphic === 'icon' && (
						<>
							<IconPicker
								value={ icon }
								onChange={ ( v ) =>
									setAttributes( { icon: v } )
								}
							/>
							{ select(
								__( 'View', 'harlow' ),
								'iconView',
								view,
								VIEWS
							) }
							{ view !== 'default' &&
								select(
									__( 'Shape', 'harlow' ),
									'iconShape',
									shape,
									SHAPES
								) }
						</>
					) }
					{ select(
						__( 'Title HTML Tag', 'harlow' ),
						'titleTagFront',
						FrontTag,
						TAGS
					) }
				</PanelBody>
				<PanelBody
					title={ __( 'Back', 'harlow' ) }
					initialOpen={ false }
				>
					{ select(
						__( 'Title HTML Tag', 'harlow' ),
						'titleTagBack',
						BackTag,
						TAGS
					) }
					{ select(
						__( 'Button Size', 'harlow' ),
						'buttonSize',
						size,
						SIZES
					) }
					<LinkFields
						value={ attributes }
						onChange={ setAttributes }
					/>
					{ select(
						__( 'Apply Link On', 'harlow' ),
						'linkClick',
						click,
						CLICKS
					) }
				</PanelBody>
				<PanelBody
					title={ __( 'Settings', 'harlow' ) }
					initialOpen={ false }
				>
					<ResponsiveLength
						label={ __( 'Height', 'harlow' ) }
						name="height"
						numeric
						attributes={ attributes }
						setAttributes={ setAttributes }
					/>
					<ResponsiveLength
						label={ __( 'Border Radius', 'harlow' ) }
						name="radius"
						attributes={ attributes }
						setAttributes={ setAttributes }
					/>
					{ select(
						__( 'Flip Effect', 'harlow' ),
						'flipEffect',
						effect,
						EFFECTS
					) }
					{ [ 'flip', 'slide', 'push' ].includes( effect ) &&
						select(
							__( 'Flip Direction', 'harlow' ),
							'flipDirection',
							direction,
							DIRECTIONS
						) }
					{ effect === 'flip' && (
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( '3D Depth', 'harlow' ) }
							checked={ flip3d }
							onChange={ ( v ) => setAttributes( { flip3d: v } ) }
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<div
						className={ `elementor-flip-box harlow-flip-box--still${
							side === 'back' ? ' harlow-flip-box--flipped' : ''
						}` }
						tabIndex="0"
					>
						{ '\n' }
						<div className="elementor-flip-box__layer elementor-flip-box__front">
							{ '\n' }
							<div className="elementor-flip-box__layer__overlay">
								{ '\n' }
								<div className="elementor-flip-box__layer__inner">
									{ '\n' }
									{ graphic === 'image' && (
										<div className="elementor-flip-box__image">
											{ '\n' }
											<Picture
												id={ image }
												size={ imageSize }
											/>
											{ '\n' }
										</div>
									) }
									{ graphic === 'icon' && icon && (
										<div
											className={ `elementor-icon-wrapper elementor-view-${ view }${
												view !== 'default'
													? ` elementor-shape-${ shape }`
													: ''
											}` }
										>
											{ '\n' }
											<div
												className="elementor-icon"
												dangerouslySetInnerHTML={ iconHtml(
													icon
												) }
											/>
											{ '\n' }
										</div>
									) }
									{ graphic !== 'none' && '\n' }
									{ words(
										'titleFront',
										FrontTag,
										'elementor-flip-box__layer__title',
										__( 'Title', 'harlow' )
									) }
									{ '\n' }
									{ words(
										'descriptionFront',
										'div',
										'elementor-flip-box__layer__description',
										__( 'Description', 'harlow' )
									) }
									{ '\n' }
								</div>
								{ '\n' }
							</div>
							{ '\n' }
						</div>
						{ '\n' }
						<Back
							className="elementor-flip-box__layer elementor-flip-box__back"
							{ ...( boxLink
								? { href: linkUrl( link ), onClick: stay }
								: {} ) }
						>
							{ '\n' }
							<div className="elementor-flip-box__layer__overlay">
								{ '\n' }
								<div className="elementor-flip-box__layer__inner">
									{ '\n' }
									{ words(
										'titleBack',
										BackTag,
										'elementor-flip-box__layer__title',
										__( 'Title', 'harlow' )
									) }
									{ '\n' }
									{ words(
										'descriptionBack',
										'div',
										'elementor-flip-box__layer__description',
										__( 'Description', 'harlow' )
									) }
									{ '\n' }
									<RichText
										tagName={ ButtonTag }
										className={ `elementor-flip-box__button elementor-button elementor-size-${ size }` }
										value={ button }
										onChange={ ( v ) =>
											setAttributes( { button: v } )
										}
										placeholder={ __( 'Button', 'harlow' ) }
										allowedFormats={ [
											'core/bold',
											'core/italic',
										] }
										withoutInteractiveFormatting
									/>
									{ '\n' }
								</div>
								{ '\n' }
							</div>
							{ '\n' }
						</Back>
						{ '\n' }
					</div>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
