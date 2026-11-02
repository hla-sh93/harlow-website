/**
 * A price table in the editor: includes/sections/price-table.php. The title, description,
 * period, features' words, button, footer words and ribbon typed in place; the price and
 * its currency, the features (icon and its colour, add, move, remove), the link and the
 * ribbon's options in the sidebar.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	BaseControl,
	Button,
	ColorPalette,
	Flex,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

import {
	elementProps,
	iconHtml,
	IconPicker,
	LinkFields,
	linkUrl,
} from '../../editor/shared';

const CLASSES =
	'elementor-element elementor-widget elementor-widget-price-table';
const TAGS = [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ];
const CHECK =
	'<svg aria-hidden="true" class="e-font-icon-svg e-far-check-circle" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 48c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m140.204 130.267l-22.536-22.718c-4.667-4.705-12.265-4.736-16.97-.068L215.346 303.697l-59.792-60.277c-4.667-4.705-12.265-4.736-16.97-.069l-22.719 22.536c-4.705 4.667-4.736 12.265-.068 16.971l90.781 91.516c4.667 4.705 12.265 4.736 16.97.068l172.589-171.204c4.704-4.668 4.734-12.266.067-16.971z"></path></svg>';

/** Elementor Pro's currency symbols (harlow_price_table_symbols()). */
const SYMBOLS = {
	dollar: [ '$', __( 'Dollar', 'harlow' ) ],
	euro: [ '€', __( 'Euro', 'harlow' ) ],
	baht: [ '฿', __( 'Baht', 'harlow' ) ],
	franc: [ 'Fr', __( 'Franc', 'harlow' ) ],
	guilder: [ 'ƒ', __( 'Guilder', 'harlow' ) ],
	krona: [ 'kr', __( 'Krona', 'harlow' ) ],
	lira: [ '₤', __( 'Lira', 'harlow' ) ],
	peseta: [ '₧', __( 'Peseta', 'harlow' ) ],
	peso: [ '₱', __( 'Peso', 'harlow' ) ],
	pound: [ '£', __( 'Pound Sterling', 'harlow' ) ],
	real: [ 'R$', __( 'Real', 'harlow' ) ],
	ruble: [ '₽', __( 'Ruble', 'harlow' ) ],
	rupee: [ '₨', __( 'Rupee', 'harlow' ) ],
	indian_rupee: [ '₹', __( 'Rupee (Indian)', 'harlow' ) ],
	shekel: [ '₪', __( 'Shekel', 'harlow' ) ],
	won: [ '₩', __( 'Won', 'harlow' ) ],
	yen: [ '¥', __( 'Yen/Yuan', 'harlow' ) ],
};

/** The brand's colours and the kit's, for a feature's icon. */
const COLOURS = [
	{ name: __( 'Primary', 'harlow' ), color: '#0165A1' },
	{ name: __( 'Dark', 'harlow' ), color: '#001420' },
	{ name: __( 'Accent', 'harlow' ), color: '#00CCCC' },
	{ name: __( 'Light', 'harlow' ), color: '#F2F2F2' },
	{ name: __( 'Text', 'harlow' ), color: '#000000' },
	{ name: __( 'Kit accent', 'harlow' ), color: '#61CE70' },
];

/**
 * A new feature's id: Elementor's seven hex characters.
 *
 * @return {string} The id.
 */
const newId = () =>
	Math.floor( Math.random() * 0xfffffff )
		.toString( 16 )
		.padStart( 7, '0' );

const plain = ( html ) => ( html || '' ).replace( /<[^>]*>/g, '' );

export default function Edit( { attributes, setAttributes } ) {
	const {
		heading,
		subHeading,
		headingTag,
		currencySymbol,
		currencySymbolCustom,
		currencyPosition,
		currencyFormat,
		price,
		sale,
		originalPrice,
		period,
		periodPosition,
		features,
		buttonText,
		link,
		buttonSize,
		footerInfo,
		showRibbon,
		ribbonTitle,
		ribbonPosition,
	} = attributes;
	const blockProps = useBlockProps(
		elementProps(
			{ ...attributes, classes: attributes.classes || CLASSES },
			'widget',
			'price-table.default'
		)
	);
	const Tag = TAGS.includes( headingTag ) ? headingTag : 'h3';
	let symbol = '';
	if ( currencySymbol === 'custom' ) {
		symbol = ( currencySymbolCustom || '' ).trim();
	} else if ( SYMBOLS[ currencySymbol ] ) {
		symbol = SYMBOLS[ currencySymbol ][ 0 ];
	}
	const position = currencyPosition === 'after' ? 'after' : 'before';
	const parts = `${ price ?? '' }`.split(
		currencyFormat === ',' ? ',' : '.'
	);
	const integer = parts[ 0 ];
	const fraction = parts.length === 2 ? parts[ 1 ] : '';
	const numeric = integer.trim() !== '' && ! isNaN( Number( integer ) );
	const beside = periodPosition === 'beside';
	const currency = ( place ) =>
		symbol && place === position ? (
			<span
				className={ `elementor-price-table__currency elementor-currency--${ place }` }
			>
				{ symbol }
			</span>
		) : null;
	const periodEl = (
		<RichText
			tagName="span"
			className="elementor-price-table__period elementor-typo-excluded"
			value={ period }
			onChange={ ( value ) => setAttributes( { period: value } ) }
			allowedFormats={ [] }
			placeholder={ __( 'Period', 'harlow' ) }
		/>
	);
	const setFeatures = ( next ) => setAttributes( { features: next } );
	const changeFeature = ( index, patch ) =>
		setFeatures(
			features.map( ( item, i ) =>
				i === index ? { ...item, ...patch } : item
			)
		);
	const moveFeature = ( index, by ) => {
		const next = [ ...features ];
		const [ item ] = next.splice( index, 1 );
		next.splice( index + by, 0, item );
		setFeatures( next );
	};
	const size = [ 'xs', 'sm', 'md', 'lg', 'xl' ].includes( buttonSize )
		? buttonSize
		: 'md';
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Header', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Title HTML tag', 'harlow' ) }
						value={ Tag }
						options={ TAGS.map( ( t ) => ( {
							value: t,
							label: t.toUpperCase(),
						} ) ) }
						onChange={ ( value ) =>
							setAttributes( { headingTag: value } )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Pricing', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Currency symbol', 'harlow' ) }
						value={ currencySymbol }
						options={ [
							{ value: '', label: __( 'None', 'harlow' ) },
							...Object.entries( SYMBOLS ).map(
								( [ value, [ sign, label ] ] ) => ( {
									value,
									label: `${ sign } ${ label }`,
								} )
							),
							{
								value: 'custom',
								label: __( 'Custom', 'harlow' ),
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { currencySymbol: value } )
						}
					/>
					{ currencySymbol === 'custom' && (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Custom symbol', 'harlow' ) }
							value={ currencySymbolCustom }
							onChange={ ( value ) =>
								setAttributes( { currencySymbolCustom: value } )
							}
						/>
					) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Currency position', 'harlow' ) }
						value={ position }
						options={ [
							{
								value: 'before',
								label: __( 'Before', 'harlow' ),
							},
							{ value: 'after', label: __( 'After', 'harlow' ) },
						] }
						onChange={ ( value ) =>
							setAttributes( { currencyPosition: value } )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Price', 'harlow' ) }
						value={ price }
						onChange={ ( value ) =>
							setAttributes( { price: value } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Currency format', 'harlow' ) }
						value={ currencyFormat === ',' ? ',' : '.' }
						options={ [
							{ value: '.', label: '1,234.56' },
							{ value: ',', label: '1.234,56' },
						] }
						onChange={ ( value ) =>
							setAttributes( { currencyFormat: value } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Sale', 'harlow' ) }
						checked={ sale }
						onChange={ ( value ) =>
							setAttributes( { sale: value } )
						}
					/>
					{ sale && (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Original price', 'harlow' ) }
							value={ originalPrice }
							onChange={ ( value ) =>
								setAttributes( { originalPrice: value } )
							}
						/>
					) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Period position', 'harlow' ) }
						value={ beside ? 'beside' : 'below' }
						options={ [
							{ value: 'below', label: __( 'Below', 'harlow' ) },
							{
								value: 'beside',
								label: __( 'Beside', 'harlow' ),
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { periodPosition: value } )
						}
					/>
				</PanelBody>
				{ features.map( ( item, index ) => (
					<PanelBody
						key={ index }
						title={
							plain( item.text ) ||
							sprintf(
								/* translators: %d: the feature's number. */
								__( 'Feature %d', 'harlow' ),
								index + 1
							)
						}
						initialOpen={ false }
					>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Text', 'harlow' ) }
							value={ item.text || '' }
							onChange={ ( value ) =>
								changeFeature( index, { text: value } )
							}
						/>
						<BaseControl
							__nextHasNoMarginBottom
							id={ `harlow-price-table-icon-colour-${ attributes.element }-${ index }` }
							label={ __( 'Icon colour', 'harlow' ) }
						>
							<ColorPalette
								colors={ COLOURS }
								value={ item.iconColor || '' }
								onChange={ ( value ) =>
									changeFeature( index, {
										iconColor: value || '',
									} )
								}
								clearable
							/>
						</BaseControl>
						<p>{ __( 'Icon', 'harlow' ) }</p>
						<IconPicker
							allowNone
							value={ item.icon || '' }
							onChange={ ( value ) =>
								changeFeature( index, { icon: value } )
							}
						/>
						<Flex justify="flex-start" wrap>
							<Button
								variant="secondary"
								size="small"
								disabled={ index === 0 }
								onClick={ () => moveFeature( index, -1 ) }
							>
								{ __( 'Move up', 'harlow' ) }
							</Button>
							<Button
								variant="secondary"
								size="small"
								disabled={ index === features.length - 1 }
								onClick={ () => moveFeature( index, 1 ) }
							>
								{ __( 'Move down', 'harlow' ) }
							</Button>
							<Button
								variant="secondary"
								size="small"
								isDestructive
								onClick={ () =>
									setFeatures(
										features.filter(
											( x, i ) => i !== index
										)
									)
								}
							>
								{ __( 'Remove', 'harlow' ) }
							</Button>
						</Flex>
					</PanelBody>
				) ) }
				<PanelBody>
					<Button
						variant="secondary"
						onClick={ () =>
							setFeatures( [
								...features,
								{
									id: newId(),
									text: sprintf(
										/* translators: %d: the feature's number. */
										__( 'List Item #%d', 'harlow' ),
										features.length + 1
									),
									icon: CHECK,
									iconColor: '',
								},
							] )
						}
					>
						{ __( 'Add a feature', 'harlow' ) }
					</Button>
				</PanelBody>
				<PanelBody
					title={ __( 'Footer', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Button size', 'harlow' ) }
						value={ size }
						options={ [
							{
								value: 'xs',
								label: __( 'Extra Small', 'harlow' ),
							},
							{ value: 'sm', label: __( 'Small', 'harlow' ) },
							{ value: 'md', label: __( 'Medium', 'harlow' ) },
							{ value: 'lg', label: __( 'Large', 'harlow' ) },
							{
								value: 'xl',
								label: __( 'Extra Large', 'harlow' ),
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { buttonSize: value } )
						}
					/>
					<LinkFields
						value={ attributes }
						onChange={ setAttributes }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Ribbon', 'harlow' ) }
					initialOpen={ false }
				>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show', 'harlow' ) }
						checked={ showRibbon }
						onChange={ ( value ) =>
							setAttributes( { showRibbon: value } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Position', 'harlow' ) }
						value={ ribbonPosition === 'left' ? 'left' : 'right' }
						options={ [
							{ value: 'left', label: __( 'Left', 'harlow' ) },
							{ value: 'right', label: __( 'Right', 'harlow' ) },
						] }
						onChange={ ( value ) =>
							setAttributes( { ribbonPosition: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<div className="elementor-widget-container">
					<div className="elementor-price-table">
						<div className="elementor-price-table__header">
							<RichText
								tagName={ Tag }
								className="elementor-price-table__heading"
								value={ heading }
								onChange={ ( value ) =>
									setAttributes( { heading: value } )
								}
								allowedFormats={ [
									'core/bold',
									'core/italic',
								] }
								placeholder={ __( 'Title', 'harlow' ) }
							/>
							<RichText
								tagName="span"
								className="elementor-price-table__subheading"
								value={ subHeading }
								onChange={ ( value ) =>
									setAttributes( { subHeading: value } )
								}
								allowedFormats={ [
									'core/bold',
									'core/italic',
								] }
								placeholder={ __( 'Description', 'harlow' ) }
							/>
						</div>
						<div className="elementor-price-table__price">
							{ sale && `${ originalPrice ?? '' }`.trim() && (
								<div className="elementor-price-table__original-price elementor-typo-excluded">
									{ currency( 'before' ) }
									{ originalPrice }
									{ currency( 'after' ) }
								</div>
							) }
							{ numeric && currency( 'before' ) }
							<span className="elementor-price-table__integer-part">
								{ integer }
							</span>
							{ ( fraction !== '' ||
								( plain( period ) && beside ) ) && (
								<div className="elementor-price-table__after-price">
									<span className="elementor-price-table__fractional-part">
										{ fraction }
									</span>
									{ beside && periodEl }
								</div>
							) }
							{ numeric && currency( 'after' ) }
							{ ! beside && periodEl }
						</div>
						{ features.length > 0 && (
							<ul className="elementor-price-table__features-list">
								{ features.map( ( item, index ) => (
									<li
										key={ index }
										className={
											item.id
												? `elementor-repeater-item-${ item.id }`
												: undefined
										}
										style={
											item.iconColor
												? {
														'--e-price-table-feature-icon-color':
															item.iconColor,
													}
												: undefined
										}
									>
										<div className="elementor-price-table__feature-inner">
											{ item.icon && (
												<span
													className="harlow-price-table__icon"
													dangerouslySetInnerHTML={ iconHtml(
														item.icon,
														false
													) }
												/>
											) }
											<RichText
												tagName="span"
												value={ item.text || '' }
												onChange={ ( value ) =>
													changeFeature( index, {
														text: value,
													} )
												}
												allowedFormats={ [
													'core/bold',
													'core/italic',
												] }
												placeholder={ __(
													'Feature',
													'harlow'
												) }
											/>
										</div>
									</li>
								) ) }
							</ul>
						) }
						<div className="elementor-price-table__footer">
							<RichText
								tagName="a"
								className={ `elementor-price-table__button elementor-button elementor-size-${ size }` }
								href={ link ? linkUrl( link ) : undefined }
								value={ buttonText }
								onChange={ ( value ) =>
									setAttributes( { buttonText: value } )
								}
								allowedFormats={ [
									'core/bold',
									'core/italic',
								] }
								placeholder={ __( 'Button', 'harlow' ) }
							/>
							<RichText
								tagName="div"
								className="elementor-price-table__additional_info"
								value={ footerInfo }
								onChange={ ( value ) =>
									setAttributes( { footerInfo: value } )
								}
								allowedFormats={ [
									'core/bold',
									'core/italic',
									'core/link',
								] }
								placeholder={ __(
									'Additional info',
									'harlow'
								) }
							/>
						</div>
					</div>
					{ showRibbon && (
						<div
							className={ `elementor-price-table__ribbon elementor-ribbon-${
								ribbonPosition === 'left' ? 'left' : 'right'
							}` }
						>
							<RichText
								tagName="div"
								className="elementor-price-table__ribbon-inner"
								value={ ribbonTitle }
								onChange={ ( value ) =>
									setAttributes( { ribbonTitle: value } )
								}
								allowedFormats={ [] }
								placeholder={ __( 'Ribbon', 'harlow' ) }
							/>
						</div>
					) }
				</div>
			</div>
		</>
	);
}
