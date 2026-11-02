/**
 * The sidebar of a posts list (posts, archive posts), as Elementor Pro's posts widget has
 * it: the skin and its layout (columns, picture, title, excerpt, details, Read More, the
 * cards skin's badge, avatar and hover), the pager and the filter bar.
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	CheckboxControl,
	PanelBody,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const SIZES = [
	{ value: 'thumbnail', label: __( 'Thumbnail', 'harlow' ) },
	{ value: 'medium', label: __( 'Medium', 'harlow' ) },
	{ value: 'medium_large', label: __( 'Medium Large', 'harlow' ) },
	{ value: 'large', label: __( 'Large', 'harlow' ) },
	{ value: 'full', label: __( 'Full', 'harlow' ) },
];

const TAGS = [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ];

const META = [
	{ value: 'author', label: __( 'Author', 'harlow' ) },
	{ value: 'date', label: __( 'Date', 'harlow' ) },
	{ value: 'time', label: __( 'Time', 'harlow' ) },
	{ value: 'comments', label: __( 'Comments', 'harlow' ) },
	{ value: 'modified', label: __( 'Date Modified', 'harlow' ) },
];

const TAXONOMIES = [
	{ value: 'category', label: __( 'Categories', 'harlow' ) },
	{ value: 'post_tag', label: __( 'Tags', 'harlow' ) },
];

/**
 * The fields of a posts list's cards, pager and filter bar.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes    The block's attributes.
 * @param {Function} props.setAttributes The block's setter.
 */
export function CardFields( { attributes, setAttributes } ) {
	const a = attributes;
	const cards = a.skin === 'cards';
	const full = a.skin === 'full_content';
	const set = ( key ) => ( value ) => setAttributes( { [ key ]: value } );
	const toggle = ( key, label ) => (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ label }
			checked={ !! a[ key ] }
			onChange={ set( key ) }
		/>
	);
	const text = ( key, label ) => (
		<TextControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			value={ a[ key ] }
			onChange={ set( key ) }
		/>
	);
	const range = ( key, label, min, max, step = 1 ) => (
		<RangeControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			value={ a[ key ] }
			min={ min }
			max={ max }
			step={ step }
			onChange={ ( value ) =>
				setAttributes( { [ key ]: value === undefined ? min : value } )
			}
		/>
	);
	const meta = Array.isArray( a.meta ) ? a.meta : [];
	return (
		<InspectorControls>
			<PanelBody title={ __( 'Layout', 'harlow' ) }>
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Skin', 'harlow' ) }
					value={ a.skin }
					options={ [
						{ value: 'classic', label: __( 'Classic', 'harlow' ) },
						{ value: 'cards', label: __( 'Cards', 'harlow' ) },
						{
							value: 'full_content',
							label: __( 'Full Content', 'harlow' ),
						},
					] }
					onChange={ ( skin ) => {
						const patch = { skin };
						// Each skin's own separator, unless one was typed.
						if ( [ '///', '•' ].includes( a.metaSeparator ) ) {
							patch.metaSeparator =
								skin === 'cards' ? '•' : '///';
						}
						setAttributes( patch );
					} }
				/>
				{ range( 'columns', __( 'Columns', 'harlow' ), 1, 6 ) }
				{ range(
					'columnsTablet',
					__( 'Columns (tablet)', 'harlow' ),
					1,
					6
				) }
				{ range(
					'columnsMobile',
					__( 'Columns (mobile)', 'harlow' ),
					1,
					6
				) }
				{ ! cards && (
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Image Position', 'harlow' ) }
						value={ a.thumbnail }
						options={ [
							{ value: 'top', label: __( 'Top', 'harlow' ) },
							{ value: 'left', label: __( 'Left', 'harlow' ) },
							{ value: 'right', label: __( 'Right', 'harlow' ) },
							{ value: 'none', label: __( 'None', 'harlow' ) },
						] }
						onChange={ set( 'thumbnail' ) }
					/>
				) }
				{ ( cards || a.thumbnail !== 'none' ) && (
					<>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Image Resolution', 'harlow' ) }
							value={ a.imageSize }
							options={ SIZES }
							onChange={ set( 'imageSize' ) }
						/>
						{ range(
							'imageRatio',
							__(
								'Image Ratio (0: the picture’s own)',
								'harlow'
							),
							0,
							2,
							0.01
						) }
						{ ! cards &&
							range(
								'imageWidth',
								__( 'Image Width % (0: default)', 'harlow' ),
								0,
								100
							) }
					</>
				) }
				{ toggle( 'showTitle', __( 'Title', 'harlow' ) ) }
				{ a.showTitle && (
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Title HTML Tag', 'harlow' ) }
						value={ a.titleTag }
						options={ TAGS.map( ( t ) => ( {
							value: t,
							label: t,
						} ) ) }
						onChange={ set( 'titleTag' ) }
					/>
				) }
				{ ! full && toggle( 'showExcerpt', __( 'Excerpt', 'harlow' ) ) }
				{ ! full &&
					a.showExcerpt &&
					range(
						'excerptLength',
						__( 'Excerpt Length', 'harlow' ),
						1,
						100
					) }
				<p className="components-base-control__label">
					{ __( 'Meta Data', 'harlow' ) }
				</p>
				{ META.map( ( m ) => (
					<CheckboxControl
						__nextHasNoMarginBottom
						key={ m.value }
						label={ m.label }
						checked={ meta.includes( m.value ) }
						onChange={ ( on ) =>
							setAttributes( {
								meta: on
									? META.map( ( x ) => x.value ).filter(
											( v ) =>
												v === m.value ||
												meta.includes( v )
										)
									: meta.filter( ( v ) => v !== m.value ),
							} )
						}
					/>
				) ) }
				{ meta.length > 0 &&
					text(
						'metaSeparator',
						__( 'Separator Between', 'harlow' )
					) }
				{ ! full &&
					toggle( 'showReadMore', __( 'Read More', 'harlow' ) ) }
				{ ! full &&
					a.showReadMore &&
					text( 'readMoreText', __( 'Read More Text', 'harlow' ) ) }
				{ toggle( 'newTab', __( 'Open in new window', 'harlow' ) ) }
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Alignment', 'harlow' ) }
					value={ a.align }
					options={ [
						{ value: '', label: __( 'Default', 'harlow' ) },
						{ value: 'left', label: __( 'Left', 'harlow' ) },
						{ value: 'center', label: __( 'Center', 'harlow' ) },
						{ value: 'right', label: __( 'Right', 'harlow' ) },
					] }
					onChange={ set( 'align' ) }
				/>
			</PanelBody>
			{ cards && (
				<PanelBody
					title={ __( 'Cards', 'harlow' ) }
					initialOpen={ false }
				>
					{ toggle( 'showBadge', __( 'Badge', 'harlow' ) ) }
					{ a.showBadge && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Badge Taxonomy', 'harlow' ) }
							value={ a.badgeTaxonomy }
							options={ TAXONOMIES }
							onChange={ set( 'badgeTaxonomy' ) }
						/>
					) }
					{ toggle( 'showAvatar', __( 'Avatar', 'harlow' ) ) }
					{ toggle( 'cardShadow', __( 'Card Shadow', 'harlow' ) ) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Hover Effect', 'harlow' ) }
						value={ a.hoverEffect }
						options={ [
							{ value: '', label: __( 'None', 'harlow' ) },
							{
								value: 'gradient',
								label: __( 'Gradient', 'harlow' ),
							},
							{
								value: 'zoom-in',
								label: __( 'Zoom In', 'harlow' ),
							},
							{
								value: 'zoom-out',
								label: __( 'Zoom Out', 'harlow' ),
							},
						] }
						onChange={ set( 'hoverEffect' ) }
					/>
				</PanelBody>
			) }
			<PanelBody
				title={ __( 'Pagination', 'harlow' ) }
				initialOpen={ false }
			>
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Pagination', 'harlow' ) }
					value={ a.pagination }
					options={ [
						{ value: '', label: __( 'None', 'harlow' ) },
						{ value: 'numbers', label: __( 'Numbers', 'harlow' ) },
						{
							value: 'prev_next',
							label: __( 'Previous/Next', 'harlow' ),
						},
						{
							value: 'numbers_and_prev_next',
							label: __( 'Numbers + Previous/Next', 'harlow' ),
						},
						{
							value: 'load_more_on_click',
							label: __( 'Load on Click', 'harlow' ),
						},
						{
							value: 'load_more_infinite_scroll',
							label: __( 'Infinite Scroll', 'harlow' ),
						},
					] }
					onChange={ set( 'pagination' ) }
				/>
				{ a.pagination !== '' &&
					range( 'pageLimit', __( 'Page Limit', 'harlow' ), 0, 50 ) }
				{ [ 'numbers', 'numbers_and_prev_next' ].includes(
					a.pagination
				) && toggle( 'shorten', __( 'Shorten', 'harlow' ) ) }
				{ [ 'prev_next', 'numbers_and_prev_next' ].includes(
					a.pagination
				) && (
					<>
						{ text(
							'prevLabel',
							__( 'Previous Label', 'harlow' )
						) }
						{ text( 'nextLabel', __( 'Next Label', 'harlow' ) ) }
					</>
				) }
				{ a.pagination === 'load_more_on_click' &&
					text( 'loadMoreText', __( 'Button Text', 'harlow' ) ) }
				{ a.pagination.startsWith( 'load_more' ) &&
					text(
						'noMoreText',
						__( 'No more posts message', 'harlow' )
					) }
				{ text(
					'nothingFound',
					__( 'Nothing Found Message', 'harlow' )
				) }
			</PanelBody>
			<PanelBody
				title={ __( 'Filter Bar', 'harlow' ) }
				initialOpen={ false }
			>
				{ toggle( 'filter', __( 'Show Filter Bar', 'harlow' ) ) }
				{ a.filter && (
					<>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Taxonomy', 'harlow' ) }
							value={ a.filterTaxonomy }
							options={ TAXONOMIES }
							onChange={ set( 'filterTaxonomy' ) }
						/>
						{ text(
							'filterAllText',
							__( '"All" Filter Label', 'harlow' )
						) }
					</>
				) }
			</PanelBody>
		</InspectorControls>
	);
}
