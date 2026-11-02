/**
 * A call to action in the editor: includes/sections/call-to-action.php, its title, words
 * and button typed in place; the skin, the pictures, the graphic, the link, the ribbon and
 * the hover effects in the sidebar.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
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
	LinkFields,
	linkUrl,
} from '../../editor/shared';
import { FORMATS, stay, TITLE_TAGS, withClasses } from '../image-box/edit';
import {
	Picture,
	PictureFields,
	PLACEHOLDER,
	usePicture,
} from '../image-box/picture';
import { oneOf, SHAPES, VIEWS } from '../icon-box/edit';

const options = ( list ) =>
	list.map( ( [ value, label ] ) => ( { value, label } ) );

const SKINS = options( [
	[ 'classic', __( 'Classic', 'harlow' ) ],
	[ 'cover', __( 'Cover', 'harlow' ) ],
] );
const LAYOUTS = options( [
	[ '', __( 'Default (above)', 'harlow' ) ],
	[ 'left', __( 'Left', 'harlow' ) ],
	[ 'above', __( 'Above', 'harlow' ) ],
	[ 'right', __( 'Right', 'harlow' ) ],
] );
const GRAPHICS = options( [
	[ 'none', __( 'None', 'harlow' ) ],
	[ 'image', __( 'Image', 'harlow' ) ],
	[ 'icon', __( 'Icon', 'harlow' ) ],
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
const SIDES = options( [
	[ 'right', __( 'Right', 'harlow' ) ],
	[ 'left', __( 'Left', 'harlow' ) ],
] );
const VALIGNS = options( [
	[ 'middle', __( 'Middle', 'harlow' ) ],
	[ 'top', __( 'Top', 'harlow' ) ],
	[ 'bottom', __( 'Bottom', 'harlow' ) ],
] );
const ANIMATIONS = options( [
	[ '', __( 'None', 'harlow' ) ],
	[ 'grow', __( 'Grow', 'harlow' ) ],
	[ 'shrink', __( 'Shrink', 'harlow' ) ],
	[ 'enter-from-right', __( 'Slide In Right', 'harlow' ) ],
	[ 'enter-from-left', __( 'Slide In Left', 'harlow' ) ],
	[ 'enter-from-top', __( 'Slide In Up', 'harlow' ) ],
	[ 'enter-from-bottom', __( 'Slide In Down', 'harlow' ) ],
	[ 'enter-zoom-in', __( 'Zoom In', 'harlow' ) ],
	[ 'enter-zoom-out', __( 'Zoom Out', 'harlow' ) ],
	[ 'fade-in', __( 'Fade In', 'harlow' ) ],
	[ 'move-right', __( 'Move Right', 'harlow' ) ],
	[ 'move-left', __( 'Move Left', 'harlow' ) ],
	[ 'move-up', __( 'Move Up', 'harlow' ) ],
	[ 'move-down', __( 'Move Down', 'harlow' ) ],
	[ 'exit-to-right', __( 'Slide Out Right', 'harlow' ) ],
	[ 'exit-to-left', __( 'Slide Out Left', 'harlow' ) ],
	[ 'exit-to-top', __( 'Slide Out Up', 'harlow' ) ],
	[ 'exit-to-bottom', __( 'Slide Out Down', 'harlow' ) ],
	[ 'exit-zoom-in', __( 'Zoom Out (leave)', 'harlow' ) ],
	[ 'exit-zoom-out', __( 'Zoom In (leave)', 'harlow' ) ],
	[ 'fade-out', __( 'Fade Out', 'harlow' ) ],
] );
const TRANSFORMS = options( [
	[ '', __( 'None', 'harlow' ) ],
	[ 'zoom-in', __( 'Zoom In', 'harlow' ) ],
	[ 'zoom-out', __( 'Zoom Out', 'harlow' ) ],
	[ 'move-left', __( 'Move Left', 'harlow' ) ],
	[ 'move-right', __( 'Move Right', 'harlow' ) ],
	[ 'move-up', __( 'Move Up', 'harlow' ) ],
	[ 'move-down', __( 'Move Down', 'harlow' ) ],
] );
const TAGS = TITLE_TAGS.map( ( t ) => ( {
	value: t,
	label: t.toUpperCase(),
} ) );

export default function Edit( { attributes, setAttributes } ) {
	const {
		hasImage,
		image,
		imageSize,
		graphicImage,
		graphicImageSize,
		icon,
		title,
		description,
		button,
		link,
		ribbonTitle,
	} = attributes;
	const skin = oneOf( attributes.skin, SKINS );
	const layout = oneOf( attributes.layout, LAYOUTS );
	const graphic = oneOf( attributes.graphic, GRAPHICS );
	const view = oneOf( attributes.iconView, VIEWS );
	const shape = oneOf( attributes.iconShape, SHAPES );
	const size = oneOf( attributes.buttonSize, SIZES );
	const click = oneOf( attributes.linkClick, CLICKS );
	const side = oneOf( attributes.ribbonPosition, SIDES );
	const valign = oneOf( attributes.verticalPosition, VALIGNS );
	const animation = oneOf( attributes.contentAnimation, ANIMATIONS );
	const transform = oneOf( attributes.bgTransform, TRANSFORMS );
	const TitleTag = TITLE_TAGS.includes( attributes.titleTag )
		? attributes.titleTag
		: 'h2';
	const WordsTag = TITLE_TAGS.includes( attributes.descriptionTag )
		? attributes.descriptionTag
		: 'div';
	const boxLink = !! link && click === 'box';
	const Wrapper = boxLink ? 'a' : 'div';
	const ButtonTag = boxLink ? 'span' : 'a';
	const animated =
		skin === 'cover' && animation
			? ` elementor-animated-item--${ animation }`
			: '';
	const background = usePicture( image, imageSize );
	const showImage = skin === 'cover' || hasImage;

	const blockProps = useBlockProps(
		elementProps(
			withClasses(
				attributes,
				/(^|\s)(elementor-cta--\S+|elementor-animated-content|elementor-bg-transform\S*)/g,
				[
					`elementor-cta--skin-${ skin }`,
					'elementor-animated-content',
					skin === 'classic' &&
						layout &&
						`elementor-cta--layout-image-${ layout }`,
					`elementor-cta--valign-${ valign }`,
					transform && 'elementor-bg-transform',
					transform && `elementor-bg-transform-${ transform }`,
				]
			),
			'widget',
			'call-to-action.default'
		)
	);
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
	const item = 'elementor-cta__content-item elementor-content-item';

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Image', 'harlow' ) }>
					{ select( __( 'Skin', 'harlow' ), 'skin', skin, SKINS ) }
					{ skin === 'classic' && (
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Show the image', 'harlow' ) }
							checked={ hasImage }
							onChange={ ( v ) =>
								setAttributes( { hasImage: v } )
							}
						/>
					) }
					{ showImage && (
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
					{ skin === 'classic' &&
						select(
							__( 'Position', 'harlow' ),
							'layout',
							layout,
							LAYOUTS
						) }
				</PanelBody>
				<PanelBody
					title={ __( 'Content', 'harlow' ) }
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
							id={ graphicImage }
							size={ graphicImageSize }
							onChange={ ( { id, size: s } ) =>
								setAttributes(
									id === undefined
										? { graphicImageSize: s }
										: { graphicImage: id }
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
						'titleTag',
						TitleTag,
						TAGS
					) }
					{ select(
						__( 'Description HTML Tag', 'harlow' ),
						'descriptionTag',
						WordsTag,
						TAGS
					) }
					{ select(
						__( 'Button Size', 'harlow' ),
						'buttonSize',
						size,
						SIZES
					) }
				</PanelBody>
				<PanelBody
					title={ __( 'Link', 'harlow' ) }
					initialOpen={ false }
				>
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
					title={ __( 'Ribbon', 'harlow' ) }
					initialOpen={ false }
				>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Title', 'harlow' ) }
						help={ __( 'Empty: no ribbon.', 'harlow' ) }
						value={ ribbonTitle }
						onChange={ ( v ) =>
							setAttributes( { ribbonTitle: v } )
						}
					/>
					{ select(
						__( 'Position', 'harlow' ),
						'ribbonPosition',
						side,
						SIDES
					) }
				</PanelBody>
				<PanelBody
					title={ __( 'Box and hover effects', 'harlow' ) }
					initialOpen={ false }
				>
					{ select(
						__( 'Vertical Position', 'harlow' ),
						'verticalPosition',
						valign,
						VALIGNS
					) }
					{ skin === 'cover' &&
						select(
							__( 'Content Animation (hover)', 'harlow' ),
							'contentAnimation',
							animation,
							ANIMATIONS
						) }
					{ select(
						__( 'Background Hover Animation', 'harlow' ),
						'bgTransform',
						transform,
						TRANSFORMS
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<Wrapper
						className="elementor-cta"
						{ ...( boxLink
							? { href: linkUrl( link ), onClick: stay }
							: {} ) }
					>
						{ '\n' }
						{ showImage && (
							<div className="elementor-cta__bg-wrapper">
								{ '\n' }
								<div
									className="elementor-cta__bg elementor-bg"
									style={ {
										backgroundImage: `url("${
											background?.url || PLACEHOLDER
										}")`,
									} }
									role="img"
									aria-label={ background?.alt || '' }
								/>
								{ '\n' }
								<div className="elementor-cta__bg-overlay" />
								{ '\n' }
							</div>
						) }
						{ showImage && '\n' }
						<div className="elementor-cta__content">
							{ '\n' }
							{ graphic === 'image' && (
								<div
									className={ `elementor-content-item elementor-cta__content-item elementor-cta__image${ animated }` }
								>
									{ '\n' }
									<Picture
										id={ graphicImage }
										size={ graphicImageSize }
									/>
									{ '\n' }
								</div>
							) }
							{ graphic === 'icon' && icon && (
								<div
									className={ `elementor-content-item elementor-cta__content-item elementor-icon-wrapper elementor-cta__icon elementor-view-${ view }${
										view !== 'default'
											? ` elementor-shape-${ shape }`
											: ''
									}${ animated }` }
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
							<RichText
								tagName={ TitleTag }
								className={ `elementor-cta__title ${ item }${ animated }` }
								value={ title }
								onChange={ ( v ) =>
									setAttributes( { title: v } )
								}
								placeholder={ __( 'Title', 'harlow' ) }
								allowedFormats={ FORMATS }
							/>
							{ '\n' }
							<RichText
								tagName={ WordsTag }
								className={ `elementor-cta__description ${ item }${ animated }` }
								value={ description }
								onChange={ ( v ) =>
									setAttributes( { description: v } )
								}
								placeholder={ __( 'Description', 'harlow' ) }
								allowedFormats={ FORMATS }
							/>
							{ '\n' }
							<div
								className={ `elementor-cta__button-wrapper ${ item }${ animated }` }
							>
								{ '\n' }
								<RichText
									tagName={ ButtonTag }
									className={ `elementor-cta__button elementor-button elementor-size-${ size }` }
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
						{ ribbonTitle.trim() !== '' && (
							<div
								className={ `elementor-ribbon elementor-ribbon-${ side }` }
							>
								{ '\n' }
								<div className="elementor-ribbon-inner">
									{ ribbonTitle.trim() }
								</div>
								{ '\n' }
							</div>
						) }
						{ ribbonTitle.trim() !== '' && '\n' }
					</Wrapper>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
