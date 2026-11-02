/**
 * The item's details in the editor: the server's markup of includes/sections/post-info.php
 * (the author, date, comments and terms are the item's own, or a sample post's in an item
 * page template), the layout and each line in the sidebar.
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { IconPicker, LinkFields, ServerMarkup } from '../../editor/shared';
import ItemPanels from '../../editor/items';

const TYPES = [
	{ value: 'author', label: __( 'Author', 'harlow' ) },
	{ value: 'date', label: __( 'Date', 'harlow' ) },
	{ value: 'time', label: __( 'Time', 'harlow' ) },
	{ value: 'comments', label: __( 'Comments', 'harlow' ) },
	{ value: 'terms', label: __( 'Terms', 'harlow' ) },
	{ value: 'custom', label: __( 'Custom', 'harlow' ) },
];

const DATE_FORMATS = [
	{ value: 'default', label: __( 'Default', 'harlow' ) },
	{ value: '0', label: 'March 6, 2018 (F j, Y)' },
	{ value: '1', label: '2018-03-06 (Y-m-d)' },
	{ value: '2', label: '03/06/2018 (m/d/Y)' },
	{ value: '3', label: '06/03/2018 (d/m/Y)' },
	{ value: 'custom', label: __( 'Custom', 'harlow' ) },
];

const TIME_FORMATS = [
	{ value: 'default', label: __( 'Default', 'harlow' ) },
	{ value: '0', label: '3:31 pm (g:i a)' },
	{ value: '1', label: '3:31 PM (g:i A)' },
	{ value: '2', label: '15:31 (H:i)' },
	{ value: 'custom', label: __( 'Custom', 'harlow' ) },
];

const TAXONOMIES = [
	{ value: 'category', label: __( 'Categories', 'harlow' ) },
	{ value: 'post_tag', label: __( 'Tags', 'harlow' ) },
];

/**
 * The lines with an id each, as Elementor's repeater gives them (a copied line gets one of
 * its own).
 *
 * @param {Object[]} items The lines.
 * @return {Object[]} The lines, ids unique.
 */
function withIds( items ) {
	const seen = new Set();
	return items.map( ( item ) => {
		let id = item.id;
		while ( ! id || seen.has( id ) ) {
			id = Math.floor( Math.random() * 0xfffffff )
				.toString( 16 )
				.padStart( 7, '0' );
		}
		seen.add( id );
		return id === item.id ? item : { ...item, id };
	} );
}

export default function Edit( { attributes, setAttributes } ) {
	const field = ( item, update, key, label, fallback = '' ) => (
		<TextControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			value={ item[ key ] ?? fallback }
			onChange={ ( value ) => update( { [ key ]: value } ) }
		/>
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Meta Data', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Layout', 'harlow' ) }
						value={ attributes.layout }
						options={ [
							{
								value: 'default',
								label: __( 'Default', 'harlow' ),
							},
							{
								value: 'inline',
								label: __( 'Inline', 'harlow' ),
							},
						] }
						onChange={ ( layout ) => setAttributes( { layout } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<ItemPanels
				items={ attributes.items || [] }
				onChange={ ( items ) =>
					setAttributes( { items: withIds( items ) } )
				}
				blank={ { type: 'date', link: true, icon: 'default' } }
			>
				{ ( item, update ) => (
					<>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Type', 'harlow' ) }
							value={ item.type }
							options={ TYPES }
							onChange={ ( type ) => update( { type } ) }
						/>
						{ item.type === 'date' && (
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Date Format', 'harlow' ) }
								value={ item.dateFormat || 'default' }
								options={ DATE_FORMATS }
								onChange={ ( dateFormat ) =>
									update( { dateFormat } )
								}
							/>
						) }
						{ item.type === 'date' &&
							item.dateFormat === 'custom' &&
							field(
								item,
								update,
								'customDate',
								__( 'Custom Date Format', 'harlow' ),
								'F j, Y'
							) }
						{ item.type === 'time' && (
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Time Format', 'harlow' ) }
								value={ item.timeFormat || 'default' }
								options={ TIME_FORMATS }
								onChange={ ( timeFormat ) =>
									update( { timeFormat } )
								}
							/>
						) }
						{ item.type === 'time' &&
							item.timeFormat === 'custom' &&
							field(
								item,
								update,
								'customTime',
								__( 'Custom Time Format', 'harlow' ),
								'g:i a'
							) }
						{ item.type === 'terms' && (
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Taxonomy', 'harlow' ) }
								value={ item.taxonomy || 'category' }
								options={ TAXONOMIES }
								onChange={ ( taxonomy ) =>
									update( { taxonomy } )
								}
							/>
						) }
						{ field(
							item,
							update,
							'prefix',
							__( 'Before', 'harlow' )
						) }
						{ item.type === 'author' && (
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Avatar', 'harlow' ) }
								checked={ !! item.avatar }
								onChange={ ( avatar ) => update( { avatar } ) }
							/>
						) }
						{ item.type === 'comments' && (
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Custom Format', 'harlow' ) }
								checked={ !! item.commentsCustom }
								onChange={ ( commentsCustom ) =>
									update( { commentsCustom } )
								}
							/>
						) }
						{ item.type === 'comments' && item.commentsCustom && (
							<>
								{ field(
									item,
									update,
									'noComments',
									__( 'No Comments', 'harlow' ),
									__( 'No Comments', 'harlow' )
								) }
								{ field(
									item,
									update,
									'oneComment',
									__( 'One Comment', 'harlow' ),
									__( 'One Comment', 'harlow' )
								) }
								{ field(
									item,
									update,
									'comments',
									__( 'Comments', 'harlow' ),
									/* translators: %s: how many comments. */
									__( '%s Comments', 'harlow' )
								) }
							</>
						) }
						{ item.type === 'custom' &&
							field(
								item,
								update,
								'customText',
								__( 'Custom', 'harlow' )
							) }
						{ item.type !== 'time' && (
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Link', 'harlow' ) }
								checked={ item.link !== false }
								onChange={ ( link ) => update( { link } ) }
							/>
						) }
						{ item.type === 'custom' && item.link !== false && (
							<LinkFields
								value={ { link: item.customUrl || '' } }
								onChange={ ( patch ) => {
									if ( 'link' in patch ) {
										update( { customUrl: patch.link } );
									}
								} }
							/>
						) }
						{ ! ( item.type === 'author' && item.avatar ) && (
							<>
								<SelectControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ __( 'Icon', 'harlow' ) }
									value={ item.icon || 'default' }
									options={ [
										{
											value: 'default',
											label: __( 'Default', 'harlow' ),
										},
										{
											value: 'custom',
											label: __( 'Custom', 'harlow' ),
										},
										{
											value: 'none',
											label: __( 'None', 'harlow' ),
										},
									] }
									onChange={ ( icon ) => update( { icon } ) }
								/>
								{ item.icon === 'custom' && (
									<IconPicker
										value={ item.svg || '' }
										onChange={ ( svg ) =>
											update( { svg } )
										}
									/>
								) }
							</>
						) }
					</>
				) }
			</ItemPanels>
			<ServerMarkup name="harlow/post-info" attributes={ attributes } />
		</>
	);
}
