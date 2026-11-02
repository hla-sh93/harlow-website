/**
 * The sidebar of a title widget (post title, page title, site title, archive title), as
 * Elementor's heading widget has it: the HTML tag, the size and the link.
 */
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { LinkFields } from '../../editor/shared';

const TAGS = [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ];

const SIZES = [
	{ value: 'default', label: __( 'Default', 'harlow' ) },
	{ value: 'small', label: __( 'Small', 'harlow' ) },
	{ value: 'medium', label: __( 'Medium', 'harlow' ) },
	{ value: 'large', label: __( 'Large', 'harlow' ) },
	{ value: 'xl', label: __( 'XL', 'harlow' ) },
	{ value: 'xxl', label: __( 'XXL', 'harlow' ) },
];

/**
 * The title widget's fields.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes    The block's attributes.
 * @param {Function} props.setAttributes The block's setter.
 * @param {string}   props.title         The panel's name.
 * @param {string[]} props.links         The links offered: none, home, item, custom.
 * @param {string}   props.contextLabel  The "include context" toggle's label, if it has one.
 */
export function TitleFields( {
	attributes,
	setAttributes,
	title,
	links,
	contextLabel,
} ) {
	const LINKS = {
		none: __( 'None', 'harlow' ),
		home: __( 'Home page', 'harlow' ),
		item: __( 'The item’s page', 'harlow' ),
		custom: __( 'Custom URL', 'harlow' ),
	};
	return (
		<InspectorControls>
			<PanelBody title={ title }>
				{ contextLabel && (
					<ToggleControl
						__nextHasNoMarginBottom
						label={ contextLabel }
						checked={ !! attributes.context }
						onChange={ ( context ) => setAttributes( { context } ) }
					/>
				) }
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'HTML Tag', 'harlow' ) }
					value={ attributes.tag }
					options={ TAGS.map( ( t ) => ( { value: t, label: t } ) ) }
					onChange={ ( tag ) => setAttributes( { tag } ) }
				/>
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Size', 'harlow' ) }
					value={ attributes.size }
					options={ SIZES }
					onChange={ ( size ) => setAttributes( { size } ) }
				/>
			</PanelBody>
			<PanelBody title={ __( 'Link', 'harlow' ) } initialOpen={ false }>
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Link', 'harlow' ) }
					value={ attributes.linkTo }
					options={ links.map( ( l ) => ( {
						value: l,
						label: LINKS[ l ],
					} ) ) }
					onChange={ ( linkTo ) => setAttributes( { linkTo } ) }
				/>
				{ attributes.linkTo === 'custom' && (
					<LinkFields
						value={ attributes }
						onChange={ setAttributes }
					/>
				) }
			</PanelBody>
		</InspectorControls>
	);
}
