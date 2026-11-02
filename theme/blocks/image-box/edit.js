/**
 * An image box in the editor: includes/sections/image-box.php, its title and words typed in
 * place; the picture, its size, the link, the title's tag, the picture's position and the
 * content's vertical alignment in the sidebar.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { elementProps, LinkFields, linkUrl } from '../../editor/shared';
import { Picture, PictureFields } from './picture';

/** The tags a title may take (Elementor's Title HTML Tag). */
export const TITLE_TAGS = [
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'div',
	'span',
	'p',
];

/** Formats offered in the words typed in place. */
export const FORMATS = [ 'core/bold', 'core/italic', 'core/link' ];

/**
 * The element's attributes with Elementor's classes of its settings, those already in its
 * classes taken off first.
 *
 * @param {Object} attributes The block's attributes.
 * @param {RegExp} own        The classes this widget sets.
 * @param {Array}  classes    The classes to add.
 * @return {Object} The attributes, their classes changed.
 */
export function withClasses( attributes, own, classes ) {
	return {
		...attributes,
		classes:
			`${ ( attributes.classes || '' ).replace( own, '' ) } ${ classes
				.filter( Boolean )
				.join( ' ' ) }`.trim(),
	};
}

/**
 * A link's click in the editor stays in the editor.
 *
 * @param {Event} event The click.
 */
export function stay( event ) {
	event.preventDefault();
}

export default function Edit( { attributes, setAttributes } ) {
	const {
		image,
		imageSize,
		title,
		description,
		link,
		position,
		titleTag,
		verticalAlign,
	} = attributes;
	const where = [ 'top', 'left', 'right' ].includes( position )
		? position
		: 'top';
	const valign = [ 'top', 'middle', 'bottom' ].includes( verticalAlign )
		? verticalAlign
		: 'top';
	const Tag = TITLE_TAGS.includes( titleTag ) ? titleTag : 'h3';
	const blockProps = useBlockProps(
		elementProps(
			withClasses(
				attributes,
				/(^|\s)elementor-(position|vertical-align)-\S+/g,
				[
					`elementor-position-${ where }`,
					`elementor-vertical-align-${ valign }`,
				]
			),
			'widget',
			'image-box.default'
		)
	);
	const titleField = ( tagName, className ) => (
		<RichText
			tagName={ tagName }
			className={ className }
			value={ title }
			onChange={ ( value ) => setAttributes( { title: value } ) }
			placeholder={ __( 'Title', 'harlow' ) }
			allowedFormats={ link ? [ 'core/bold', 'core/italic' ] : FORMATS }
			withoutInteractiveFormatting={ !! link }
		/>
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Image Box', 'harlow' ) }>
					<PictureFields
						label={ __( 'Choose Image', 'harlow' ) }
						id={ image }
						size={ imageSize }
						onChange={ ( { id, size } ) =>
							setAttributes(
								id === undefined
									? { imageSize: size }
									: { image: id }
							)
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Image Position', 'harlow' ) }
						value={ where }
						options={ [
							{ value: 'top', label: __( 'Top', 'harlow' ) },
							{ value: 'left', label: __( 'Left', 'harlow' ) },
							{ value: 'right', label: __( 'Right', 'harlow' ) },
						] }
						onChange={ ( value ) =>
							setAttributes( { position: value } )
						}
					/>
					{ where !== 'top' && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Vertical Alignment', 'harlow' ) }
							value={ valign }
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
							onChange={ ( value ) =>
								setAttributes( { verticalAlign: value } )
							}
						/>
					) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Title HTML Tag', 'harlow' ) }
						value={ Tag }
						options={ TITLE_TAGS.map( ( t ) => ( {
							value: t,
							label: t.toUpperCase(),
						} ) ) }
						onChange={ ( value ) =>
							setAttributes( { titleTag: value } )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Link', 'harlow' ) }
					initialOpen={ !! link }
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
					<div className="elementor-image-box-wrapper">
						<figure className="elementor-image-box-img">
							{ link ? (
								<a
									href={ linkUrl( link ) }
									tabIndex="-1"
									onClick={ stay }
								>
									<Picture id={ image } size={ imageSize } />
								</a>
							) : (
								<Picture id={ image } size={ imageSize } />
							) }
						</figure>
						<div className="elementor-image-box-content">
							{ link ? (
								<Tag className="elementor-image-box-title">
									{ titleField( 'a' ) }
								</Tag>
							) : (
								titleField( Tag, 'elementor-image-box-title' )
							) }
							<RichText
								tagName="p"
								className="elementor-image-box-description"
								value={ description }
								onChange={ ( value ) =>
									setAttributes( { description: value } )
								}
								placeholder={ __( 'Description', 'harlow' ) }
								allowedFormats={ FORMATS }
							/>
						</div>
					</div>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
