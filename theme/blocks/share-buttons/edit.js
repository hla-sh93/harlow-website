/**
 * Share buttons in the editor: includes/sections/share-buttons.php. The buttons are a list
 * in the sidebar (a network each, its own name if wanted); the view, skin, shape, columns,
 * alignment, what is shared and the colours in the sidebar. The networks' names and icons
 * are networks.json, which the page reads too.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	BaseControl,
	ColorPalette,
	Flex,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import ItemPanels from '../../editor/items';
import { elementProps } from '../../editor/shared';
import NETWORKS from './networks.json';

const CLASSES =
	'elementor-element elementor-widget elementor-widget-share-buttons';
const COLUMNS = [ '0', '1', '2', '3', '4', '5', '6' ];
const COLOURS = [
	{ name: __( 'Primary', 'harlow' ), color: '#0165A1' },
	{ name: __( 'Dark', 'harlow' ), color: '#001420' },
	{ name: __( 'Accent', 'harlow' ), color: '#00CCCC' },
	{ name: __( 'Light', 'harlow' ), color: '#F2F2F2' },
	{ name: __( 'Text', 'harlow' ), color: '#000000' },
	{ name: __( 'White', 'harlow' ), color: '#FFFFFF' },
];

const pick = ( value, list, fallback ) =>
	list.includes( value ) ? value : fallback;

export default function Edit( { attributes, setAttributes } ) {
	const { buttons, showLabel, colorMode, align } = attributes;
	const view = pick(
		attributes.view,
		[ 'icon-text', 'icon', 'text' ],
		'icon-text'
	);
	const skin = pick(
		attributes.skin,
		[ 'gradient', 'minimal', 'framed', 'boxed', 'flat' ],
		'gradient'
	);
	const shape = pick(
		attributes.shape,
		[ 'square', 'rounded', 'circle' ],
		'square'
	);
	const colour = colorMode === 'custom' ? 'custom' : 'official';
	const classes = [
		`elementor-share-buttons--view-${ view }`,
		`elementor-share-buttons--skin-${ skin }`,
		`elementor-share-buttons--shape-${ shape }`,
		`elementor-grid-${ pick( `${ attributes.columns }`, COLUMNS, '0' ) }`,
	];
	[
		[ 'Tablet', 'tablet' ],
		[ 'Mobile', 'mobile' ],
	].forEach( ( [ device, suffix ] ) => {
		const value = `${ attributes[ `columns${ device }` ] ?? '' }`;
		if ( COLUMNS.includes( value ) ) {
			classes.push( `elementor-grid-${ suffix }-${ value }` );
		}
	} );
	classes.push( `elementor-share-buttons--color-${ colour }` );
	if ( [ 'left', 'center', 'right', 'justify' ].includes( align ) ) {
		classes.push( `elementor-share-buttons--align-${ align }` );
	}
	const blockProps = useBlockProps(
		elementProps(
			{
				...attributes,
				classes: `${ attributes.classes || CLASSES } ${ classes.join(
					' '
				) }`,
			},
			'widget',
			'share-buttons.default'
		)
	);
	const style = {};
	if ( colour === 'custom' ) {
		[
			[ 'primaryColor', 'primary-color' ],
			[ 'secondaryColor', 'secondary-color' ],
			[ 'primaryHover', 'primary-color-hover' ],
			[ 'secondaryHover', 'secondary-color-hover' ],
		].forEach( ( [ key, property ] ) => {
			if ( attributes[ key ] ) {
				style[ `--e-share-buttons-${ property }` ] = attributes[ key ];
			}
		} );
	}
	const networkOptions = Object.entries( NETWORKS ).map(
		( [ value, network ] ) => ( { value, label: network.title } )
	);
	const select = ( label, key, options ) => (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			value={ `${ attributes[ key ] ?? '' }` }
			options={ options }
			onChange={ ( value ) => setAttributes( { [ key ]: value } ) }
		/>
	);
	const columnOptions = ( empty ) => [
		...( empty ? [ { value: '', label: empty } ] : [] ),
		...COLUMNS.map( ( value ) => ( {
			value,
			label: value === '0' ? __( 'Auto', 'harlow' ) : value,
		} ) ),
	];
	const colourField = ( label, key ) => (
		<BaseControl
			__nextHasNoMarginBottom
			id={ `harlow-share-buttons-${ key }-${ attributes.element }` }
			label={ label }
		>
			<ColorPalette
				colors={ COLOURS }
				value={ attributes[ key ] || '' }
				onChange={ ( value ) =>
					setAttributes( { [ key ]: value || '' } )
				}
				clearable
			/>
		</BaseControl>
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Share buttons', 'harlow' ) }>
					{ select( __( 'View', 'harlow' ), 'view', [
						{
							value: 'icon-text',
							label: __( 'Icon & Text', 'harlow' ),
						},
						{ value: 'icon', label: __( 'Icon', 'harlow' ) },
						{ value: 'text', label: __( 'Text', 'harlow' ) },
					] ) }
					{ view === 'icon-text' && (
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Label', 'harlow' ) }
							checked={ showLabel }
							onChange={ ( value ) =>
								setAttributes( { showLabel: value } )
							}
						/>
					) }
					{ select( __( 'Skin', 'harlow' ), 'skin', [
						{
							value: 'gradient',
							label: __( 'Gradient', 'harlow' ),
						},
						{ value: 'minimal', label: __( 'Minimal', 'harlow' ) },
						{ value: 'framed', label: __( 'Framed', 'harlow' ) },
						{ value: 'boxed', label: __( 'Boxed Icon', 'harlow' ) },
						{ value: 'flat', label: __( 'Flat', 'harlow' ) },
					] ) }
					{ select( __( 'Shape', 'harlow' ), 'shape', [
						{ value: 'square', label: __( 'Square', 'harlow' ) },
						{ value: 'rounded', label: __( 'Rounded', 'harlow' ) },
						{ value: 'circle', label: __( 'Circle', 'harlow' ) },
					] ) }
					<Flex align="flex-start">
						{ select(
							__( 'Columns', 'harlow' ),
							'columns',
							columnOptions( '' )
						) }
						{ select(
							__( 'Tablet', 'harlow' ),
							'columnsTablet',
							columnOptions( __( 'As desktop', 'harlow' ) )
						) }
						{ select(
							__( 'Mobile', 'harlow' ),
							'columnsMobile',
							columnOptions( __( 'As tablet', 'harlow' ) )
						) }
					</Flex>
					{ select( __( 'Alignment', 'harlow' ), 'align', [
						{ value: '', label: __( 'Default', 'harlow' ) },
						{ value: 'left', label: __( 'Left', 'harlow' ) },
						{ value: 'center', label: __( 'Center', 'harlow' ) },
						{ value: 'right', label: __( 'Right', 'harlow' ) },
						{ value: 'justify', label: __( 'Justify', 'harlow' ) },
					] ) }
					{ select( __( 'Target URL', 'harlow' ), 'shareUrlType', [
						{
							value: 'current_page',
							label: __( 'Current Page', 'harlow' ),
						},
						{
							value: 'custom_url',
							label: __( 'Custom', 'harlow' ),
						},
					] ) }
					{ attributes.shareUrlType === 'custom_url' && (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Link', 'harlow' ) }
							value={ attributes.shareUrl }
							onChange={ ( value ) =>
								setAttributes( { shareUrl: value } )
							}
						/>
					) }
				</PanelBody>
				<PanelBody
					title={ __( 'Colours', 'harlow' ) }
					initialOpen={ false }
				>
					{ select( __( 'Color', 'harlow' ), 'colorMode', [
						{
							value: 'official',
							label: __( 'Official', 'harlow' ),
						},
						{ value: 'custom', label: __( 'Custom', 'harlow' ) },
					] ) }
					{ colour === 'custom' && (
						<>
							{ colourField(
								__( 'Primary colour', 'harlow' ),
								'primaryColor'
							) }
							{ colourField(
								__( 'Secondary colour', 'harlow' ),
								'secondaryColor'
							) }
							{ colourField(
								__( 'Primary colour on hover', 'harlow' ),
								'primaryHover'
							) }
							{ colourField(
								__( 'Secondary colour on hover', 'harlow' ),
								'secondaryHover'
							) }
						</>
					) }
				</PanelBody>
			</InspectorControls>
			<ItemPanels
				items={ buttons }
				onChange={ ( next ) => setAttributes( { buttons: next } ) }
				blank={ { network: 'facebook', text: '' } }
			>
				{ ( item, update ) => (
					<Fragment>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Network', 'harlow' ) }
							value={ item.network }
							options={ networkOptions }
							onChange={ ( value ) =>
								update( { network: value } )
							}
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Custom label', 'harlow' ) }
							help={ __(
								'Empty: the network’s name.',
								'harlow'
							) }
							value={ item.text || '' }
							onChange={ ( value ) => update( { text: value } ) }
						/>
					</Fragment>
				) }
			</ItemPanels>
			<div { ...blockProps }>
				<div className="elementor-widget-container">
					<div
						className="elementor-grid"
						role="list"
						style={
							Object.keys( style ).length ? style : undefined
						}
					>
						{ buttons
							.filter( ( item ) => NETWORKS[ item.network ] )
							.map( ( item, index ) => {
								const network = NETWORKS[ item.network ];
								return (
									<div
										key={ index }
										className="elementor-grid-item"
										role="listitem"
									>
										<div
											className={ `elementor-share-btn elementor-share-btn_${ item.network }` }
											role="button"
											tabIndex={ 0 }
											aria-label={ sprintf(
												/* translators: %s: the network's name. */
												__( 'Share on %s', 'harlow' ),
												network.title
											) }
										>
											{ view !== 'text' && (
												<span
													className="elementor-share-btn__icon"
													dangerouslySetInnerHTML={ {
														__html: network.icon,
													} }
												/>
											) }
											{ ( view === 'text' ||
												( view === 'icon-text' &&
													showLabel ) ) && (
												<div className="elementor-share-btn__text">
													<span className="elementor-share-btn__title">
														{ (
															item.text || ''
														).trim() ||
															network.title }
													</span>
												</div>
											) }
										</div>
									</div>
								);
							} ) }
					</div>
				</div>
			</div>
		</>
	);
}
