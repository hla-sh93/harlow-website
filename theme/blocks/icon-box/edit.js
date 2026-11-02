/**
 * An icon box in the editor: includes/sections/icon-box.php, its title and words typed in
 * place; the icon, its view and shape, the link, the title's tag, the icon's position and
 * the content's vertical alignment in the sidebar.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import {
	elementProps,
	iconHtml,
	IconPicker,
	LinkFields,
	linkUrl,
} from '../../editor/shared';
import { FORMATS, stay, TITLE_TAGS, withClasses } from '../image-box/edit';

/** The views of an icon (Elementor's View) and its shapes. */
export const VIEWS = [
	{ value: 'default', label: __( 'Default', 'harlow' ) },
	{ value: 'stacked', label: __( 'Stacked', 'harlow' ) },
	{ value: 'framed', label: __( 'Framed', 'harlow' ) },
];
export const SHAPES = [
	{ value: 'circle', label: __( 'Circle', 'harlow' ) },
	{ value: 'rounded', label: __( 'Rounded', 'harlow' ) },
	{ value: 'square', label: __( 'Square', 'harlow' ) },
];

/**
 * A value among those offered, or the first.
 *
 * @param {string} value   The value.
 * @param {Array}  options The values offered ({ value }).
 * @return {string} The value.
 */
export function oneOf( value, options ) {
	return options.some( ( o ) => o.value === value )
		? value
		: options[ 0 ].value;
}

export default function Edit( { attributes, setAttributes } ) {
	const { icon, title, description, link, titleTag } = attributes;
	const view = oneOf( attributes.view, VIEWS );
	const shape = oneOf( attributes.shape, SHAPES );
	const position = [ 'top', 'left', 'right' ].includes( attributes.position )
		? attributes.position
		: 'top';
	const valign = [ 'top', 'middle', 'bottom' ].includes(
		attributes.verticalAlign
	)
		? attributes.verticalAlign
		: 'top';
	const Tag = TITLE_TAGS.includes( titleTag ) ? titleTag : 'h3';
	const LinkTag = link ? 'a' : 'span';
	const linkProps = link ? { href: linkUrl( link ), onClick: stay } : {};
	const blockProps = useBlockProps(
		elementProps(
			withClasses(
				attributes,
				/(^|\s)elementor-(view|shape|position|vertical-align)-\S+/g,
				[
					`elementor-view-${ view }`,
					view !== 'default' && `elementor-shape-${ shape }`,
					`elementor-position-${ position }`,
					position !== 'top' &&
						`elementor-vertical-align-${ valign }`,
				]
			),
			'widget',
			'icon-box.default'
		)
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Icon Box', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'View', 'harlow' ) }
						value={ view }
						options={ VIEWS }
						onChange={ ( value ) =>
							setAttributes( { view: value } )
						}
					/>
					{ view !== 'default' && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Shape', 'harlow' ) }
							value={ shape }
							options={ SHAPES }
							onChange={ ( value ) =>
								setAttributes( { shape: value } )
							}
						/>
					) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Icon Position', 'harlow' ) }
						value={ position }
						options={ [
							{ value: 'top', label: __( 'Top', 'harlow' ) },
							{ value: 'left', label: __( 'Left', 'harlow' ) },
							{ value: 'right', label: __( 'Right', 'harlow' ) },
						] }
						onChange={ ( value ) =>
							setAttributes( { position: value } )
						}
					/>
					{ position !== 'top' && (
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
					title={ __( 'Icon', 'harlow' ) }
					initialOpen={ false }
				>
					<IconPicker
						value={ icon }
						allowNone
						onChange={ ( value ) =>
							setAttributes( { icon: value } )
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
					<div className="elementor-icon-box-wrapper">
						{ '\n' }
						{ icon && (
							<div className="elementor-icon-box-icon">
								{ '\n' }
								<LinkTag
									{ ...linkProps }
									className="elementor-icon elementor-animation-"
									dangerouslySetInnerHTML={ iconHtml( icon ) }
								/>
								{ '\n' }
							</div>
						) }
						{ icon && '\n' }
						<div className="elementor-icon-box-content">
							{ '\n' }
							<Tag className="elementor-icon-box-title">
								{ '\n' }
								<RichText
									tagName={ LinkTag }
									value={ title }
									onChange={ ( value ) =>
										setAttributes( { title: value } )
									}
									placeholder={ __( 'Title', 'harlow' ) }
									allowedFormats={
										link
											? [ 'core/bold', 'core/italic' ]
											: FORMATS
									}
									withoutInteractiveFormatting={ !! link }
								/>
								{ '\n' }
							</Tag>
							{ '\n' }
							<RichText
								tagName="p"
								className="elementor-icon-box-description"
								value={ description }
								onChange={ ( value ) =>
									setAttributes( { description: value } )
								}
								placeholder={ __( 'Description', 'harlow' ) }
								allowedFormats={ FORMATS }
							/>
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
