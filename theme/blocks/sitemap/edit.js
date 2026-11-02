/**
 * A sitemap in the editor: the server's markup of includes/sections/sitemap.php (the pages,
 * items and terms are the site's own), each section and the columns in the sidebar.
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { ServerMarkup } from '../../editor/shared';
import ItemPanels from '../../editor/items';

const POST_TYPES = [
	{ value: 'page', label: __( 'Pages', 'harlow' ) },
	{ value: 'post', label: __( 'Posts', 'harlow' ) },
	{ value: 'news', label: __( 'News', 'harlow' ) },
	{ value: 'albahoo_project', label: __( 'Projects', 'harlow' ) },
	{ value: 'gallery_item', label: __( 'Gallery', 'harlow' ) },
	{ value: 'job', label: __( 'Jobs', 'harlow' ) },
];

const TAXONOMIES = [
	{ value: 'category', label: __( 'Categories', 'harlow' ) },
	{ value: 'post_tag', label: __( 'Tags', 'harlow' ) },
];

const TAGS = [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ];

export default function Edit( { attributes, setAttributes } ) {
	const number = ( key, label, min, max ) => (
		<RangeControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			value={ attributes[ key ] }
			min={ min }
			max={ max }
			onChange={ ( value ) => setAttributes( { [ key ]: value || min } ) }
		/>
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Sitemap', 'harlow' ) }>
					{ number( 'columns', __( 'Columns', 'harlow' ), 1, 6 ) }
					{ number(
						'columnsTablet',
						__( 'Columns (tablet)', 'harlow' ),
						1,
						6
					) }
					{ number(
						'columnsMobile',
						__( 'Columns (mobile)', 'harlow' ),
						1,
						6
					) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Title HTML Tag', 'harlow' ) }
						value={ attributes.titleTag }
						options={ TAGS.map( ( t ) => ( {
							value: t,
							label: t,
						} ) ) }
						onChange={ ( titleTag ) =>
							setAttributes( { titleTag } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Bullet Style', 'harlow' ) }
						value={ attributes.bullet }
						options={ [
							{ value: 'disc', label: __( 'Disc', 'harlow' ) },
							{
								value: 'circle',
								label: __( 'Circle', 'harlow' ),
							},
							{
								value: 'square',
								label: __( 'Square', 'harlow' ),
							},
							{ value: 'none', label: __( 'None', 'harlow' ) },
						] }
						onChange={ ( bullet ) => setAttributes( { bullet } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Add nofollow', 'harlow' ) }
						checked={ !! attributes.nofollow }
						onChange={ ( nofollow ) =>
							setAttributes( { nofollow } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<ItemPanels
				items={ attributes.sections || [] }
				onChange={ ( sections ) => setAttributes( { sections } ) }
				blank={ {
					type: 'post_type',
					postType: 'page',
					taxonomy: 'category',
					title: __( 'Pages', 'harlow' ),
					orderby: 'post_title',
					order: 'asc',
					hierarchical: true,
					depth: 0,
				} }
			>
				{ ( section, update ) => {
					const taxonomy = section.type === 'taxonomy';
					return (
						<>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Type', 'harlow' ) }
								value={ section.type }
								options={ [
									{
										value: 'post_type',
										label: __( 'Post Type', 'harlow' ),
									},
									{
										value: 'taxonomy',
										label: __( 'Taxonomy', 'harlow' ),
									},
								] }
								onChange={ ( type ) =>
									update( {
										type,
										orderby:
											type === 'taxonomy'
												? 'name'
												: 'post_title',
									} )
								}
							/>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Source', 'harlow' ) }
								value={
									taxonomy
										? section.taxonomy || 'category'
										: section.postType || 'page'
								}
								options={ taxonomy ? TAXONOMIES : POST_TYPES }
								onChange={ ( value ) =>
									update(
										taxonomy
											? { taxonomy: value }
											: { postType: value }
									)
								}
							/>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Title', 'harlow' ) }
								value={ section.title || '' }
								onChange={ ( title ) => update( { title } ) }
							/>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Order By', 'harlow' ) }
								value={ section.orderby }
								options={
									taxonomy
										? [
												{
													value: 'name',
													label: __(
														'Name',
														'harlow'
													),
												},
												{
													value: 'id',
													label: __( 'ID', 'harlow' ),
												},
												{
													value: 'count',
													label: __(
														'Count',
														'harlow'
													),
												},
												{
													value: 'slug',
													label: __(
														'Slug',
														'harlow'
													),
												},
											]
										: [
												{
													value: 'post_date',
													label: __(
														'Date',
														'harlow'
													),
												},
												{
													value: 'post_title',
													label: __(
														'Title',
														'harlow'
													),
												},
												{
													value: 'menu_order',
													label: __(
														'Menu Order',
														'harlow'
													),
												},
												{
													value: 'rand',
													label: __(
														'Random',
														'harlow'
													),
												},
											]
								}
								onChange={ ( orderby ) =>
									update( { orderby } )
								}
							/>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Order', 'harlow' ) }
								value={ section.order || 'asc' }
								options={ [
									{
										value: 'asc',
										label: __( 'ASC', 'harlow' ),
									},
									{
										value: 'desc',
										label: __( 'DESC', 'harlow' ),
									},
								] }
								onChange={ ( order ) => update( { order } ) }
							/>
							{ taxonomy && (
								<ToggleControl
									__nextHasNoMarginBottom
									label={ __( 'Hide Empty', 'harlow' ) }
									checked={ !! section.hideEmpty }
									onChange={ ( hideEmpty ) =>
										update( { hideEmpty } )
									}
								/>
							) }
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Hierarchical View', 'harlow' ) }
								checked={ section.hierarchical !== false }
								onChange={ ( hierarchical ) =>
									update( { hierarchical } )
								}
							/>
							{ section.hierarchical !== false && (
								<RangeControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ __( 'Depth', 'harlow' ) }
									help={ __(
										'0 shows every level.',
										'harlow'
									) }
									value={ section.depth || 0 }
									min={ 0 }
									max={ 6 }
									onChange={ ( depth ) =>
										update( { depth: depth || 0 } )
									}
								/>
							) }
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Exclude (IDs)', 'harlow' ) }
								help={ __( 'Separated by commas.', 'harlow' ) }
								value={ section.exclude || '' }
								onChange={ ( exclude ) =>
									update( { exclude } )
								}
							/>
							{ ! taxonomy && (
								<ToggleControl
									__nextHasNoMarginBottom
									label={ __(
										'Exclude current page',
										'harlow'
									) }
									checked={ !! section.excludeCurrent }
									onChange={ ( excludeCurrent ) =>
										update( { excludeCurrent } )
									}
								/>
							) }
						</>
					);
				} }
			</ItemPanels>
			<ServerMarkup name="harlow/sitemap" attributes={ attributes } />
		</>
	);
}
