/**
 * A price list in the editor: includes/sections/price-list.php. The items' titles, prices
 * and words typed in place; each item's picture and link, and the list's picture size,
 * separator and vertical alignment in the sidebar.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextareaControl,
	TextControl,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import ItemPanels from '../../editor/items';
import {
	elementProps,
	LinkFields,
	linkUrl,
	PicturePicker,
} from '../../editor/shared';

const CLASSES =
	'elementor-element elementor-widget elementor-widget-price-list';
const SIZES = [
	{ value: 'thumbnail', label: __( 'Thumbnail', 'harlow' ) },
	{ value: 'medium', label: __( 'Medium', 'harlow' ) },
	{ value: 'medium_large', label: __( 'Medium large', 'harlow' ) },
	{ value: 'large', label: __( 'Large', 'harlow' ) },
	{ value: 'full', label: __( 'Full', 'harlow' ) },
];

const plain = ( html ) => ( html || '' ).replace( /<[^>]*>/g, '' );

export default function Edit( { attributes, setAttributes } ) {
	const { items, imageSize, separatorStyle, verticalAlign } = attributes;
	const separator = [
		'solid',
		'dotted',
		'dashed',
		'double',
		'none',
	].includes( separatorStyle )
		? separatorStyle
		: 'dotted';
	const valign = [ 'top', 'center', 'bottom' ].includes( verticalAlign )
		? verticalAlign
		: 'top';
	const blockProps = useBlockProps(
		elementProps(
			{
				...attributes,
				classes: `${
					attributes.classes || CLASSES
				} elementor-price-list--separator-${ separator } elementor-price-list--align-${ valign }`,
			},
			'widget',
			'price-list.default'
		)
	);
	const key = items.map( ( item ) => item.image || 0 ).join( ',' );
	const pictures = useSelect(
		( select ) => {
			const out = {};
			items.forEach( ( item ) => {
				const media = item.image
					? select( coreStore ).getEntityRecord(
							'postType',
							'attachment',
							item.image
						)
					: null;
				if ( media ) {
					out[ item.image ] =
						media.media_details?.sizes?.[ imageSize ]?.source_url ||
						media.source_url;
				}
			} );
			return out;
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ key, imageSize ]
	);
	const setItems = ( next ) => setAttributes( { items: next } );
	const change = ( index, patch ) =>
		setItems(
			items.map( ( item, i ) =>
				i === index ? { ...item, ...patch } : item
			)
		);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'List', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Image resolution', 'harlow' ) }
						value={ imageSize }
						options={ SIZES }
						onChange={ ( value ) =>
							setAttributes( { imageSize: value } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Separator style', 'harlow' ) }
						value={ separator }
						options={ [
							{ value: 'solid', label: __( 'Solid', 'harlow' ) },
							{
								value: 'dotted',
								label: __( 'Dotted', 'harlow' ),
							},
							{
								value: 'dashed',
								label: __( 'Dashed', 'harlow' ),
							},
							{
								value: 'double',
								label: __( 'Double', 'harlow' ),
							},
							{ value: 'none', label: __( 'None', 'harlow' ) },
						] }
						onChange={ ( value ) =>
							setAttributes( { separatorStyle: value } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Vertical align', 'harlow' ) }
						value={ valign }
						options={ [
							{ value: 'top', label: __( 'Top', 'harlow' ) },
							{
								value: 'center',
								label: __( 'Center', 'harlow' ),
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
				</PanelBody>
			</InspectorControls>
			<ItemPanels
				items={ items }
				onChange={ setItems }
				blank={ {
					title: '',
					price: '',
					description: '',
					image: 0,
					link: '',
				} }
			>
				{ ( item, update ) => (
					<Fragment>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Title', 'harlow' ) }
							value={ item.title || '' }
							onChange={ ( value ) => update( { title: value } ) }
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Price', 'harlow' ) }
							value={ item.price || '' }
							onChange={ ( value ) => update( { price: value } ) }
						/>
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Description', 'harlow' ) }
							value={ item.description || '' }
							onChange={ ( value ) =>
								update( { description: value } )
							}
						/>
						<PicturePicker
							label={ __( 'Image', 'harlow' ) }
							value={ item.image || 0 }
							onChange={ ( value ) => update( { image: value } ) }
							none={ __( 'No picture', 'harlow' ) }
						/>
						<LinkFields value={ item } onChange={ update } />
					</Fragment>
				) }
			</ItemPanels>
			<div { ...blockProps }>
				<div className="elementor-widget-container">
					<ul className="elementor-price-list">
						{ items.map( ( item, index ) => {
							const linked = !! ( item.link || '' ).trim();
							const inside = (
								<>
									{ pictures[ item.image ] && (
										<div className="elementor-price-list-image">
											<img
												src={ pictures[ item.image ] }
												alt={ plain( item.title ) }
											/>
										</div>
									) }
									<div className="elementor-price-list-text">
										<div className="elementor-price-list-header">
											<RichText
												tagName="span"
												className="elementor-price-list-title"
												value={ item.title || '' }
												onChange={ ( value ) =>
													change( index, {
														title: value,
													} )
												}
												allowedFormats={ [
													'core/bold',
													'core/italic',
												] }
												placeholder={ __(
													'Title',
													'harlow'
												) }
											/>
											{ separator !== 'none' && (
												<span className="elementor-price-list-separator" />
											) }
											<RichText
												tagName="span"
												className="elementor-price-list-price"
												value={ item.price || '' }
												onChange={ ( value ) =>
													change( index, {
														price: value,
													} )
												}
												allowedFormats={ [] }
												placeholder={ __(
													'Price',
													'harlow'
												) }
											/>
										</div>
										<RichText
											tagName="p"
											className="elementor-price-list-description"
											value={ item.description || '' }
											onChange={ ( value ) =>
												change( index, {
													description: value,
												} )
											}
											allowedFormats={ [
												'core/bold',
												'core/italic',
											] }
											placeholder={ __(
												'Description',
												'harlow'
											) }
										/>
									</div>
								</>
							);
							return linked ? (
								<li key={ index }>
									<a
										className="elementor-price-list-item"
										href={ linkUrl( item.link ) }
										target={ item.linkTarget || undefined }
										rel={ item.linkRel || undefined }
										onClick={ ( event ) =>
											event.preventDefault()
										}
									>
										{ inside }
									</a>
								</li>
							) : (
								<li
									key={ index }
									className="elementor-price-list-item"
								>
									{ inside }
								</li>
							);
						} ) }
					</ul>
				</div>
			</div>
		</>
	);
}
