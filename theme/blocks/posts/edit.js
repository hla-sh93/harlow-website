/**
 * A posts list in the editor: the server's markup of includes/sections/posts.php (the
 * items are kept in their own screens), the query in the sidebar with the cards, pager and
 * filter bar (card-fields.js). The filter bar and load more work on the page
 * (assets/js/widgets/posts.js).
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	CheckboxControl,
	PanelBody,
	RangeControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { ServerMarkup } from '../../editor/shared';
import { CardFields } from './card-fields';

const TYPES = [
	{ value: 'post', label: __( 'Posts', 'harlow' ) },
	{ value: 'news', label: __( 'News', 'harlow' ) },
	{ value: 'albahoo_project', label: __( 'Projects', 'harlow' ) },
	{ value: 'gallery_item', label: __( 'Gallery', 'harlow' ) },
	{ value: 'job', label: __( 'Jobs', 'harlow' ) },
	{ value: 'page', label: __( 'Pages', 'harlow' ) },
];

/**
 * Categories to tick, for including or leaving out.
 *
 * @param {Object}   props
 * @param {string}   props.label    What the list is.
 * @param {number[]} props.value    The categories ticked.
 * @param {Object[]} props.terms    The site's categories.
 * @param {Function} props.onChange Called with the categories ticked.
 */
function TermChecks( { label, value, terms, onChange } ) {
	const picked = Array.isArray( value ) ? value : [];
	return (
		<>
			<p className="components-base-control__label">{ label }</p>
			{ terms.map( ( term ) => (
				<CheckboxControl
					__nextHasNoMarginBottom
					key={ term.id }
					label={ term.name }
					checked={ picked.includes( term.id ) }
					onChange={ ( on ) =>
						onChange(
							on
								? [ ...picked, term.id ]
								: picked.filter( ( id ) => id !== term.id )
						)
					}
				/>
			) ) }
		</>
	);
}

export default function Edit( { attributes, setAttributes } ) {
	const terms = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords( 'taxonomy', 'category', {
				per_page: 100,
			} ) || [],
		[]
	);
	const a = attributes;
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Query', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Source', 'harlow' ) }
						value={ a.postType }
						options={ TYPES }
						onChange={ ( postType ) =>
							setAttributes( { postType } )
						}
					/>
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Posts Per Page', 'harlow' ) }
						value={ a.perPage }
						min={ 1 }
						max={ 50 }
						onChange={ ( perPage ) =>
							setAttributes( { perPage: perPage || 1 } )
						}
					/>
					{ a.postType === 'post' && terms.length > 0 && (
						<>
							<TermChecks
								label={ __( 'Include: categories', 'harlow' ) }
								value={ a.includeTerms }
								terms={ terms }
								onChange={ ( includeTerms ) =>
									setAttributes( { includeTerms } )
								}
							/>
							<TermChecks
								label={ __( 'Exclude: categories', 'harlow' ) }
								value={ a.excludeTerms }
								terms={ terms }
								onChange={ ( excludeTerms ) =>
									setAttributes( { excludeTerms } )
								}
							/>
						</>
					) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Order By', 'harlow' ) }
						value={ a.orderby }
						options={ [
							{ value: 'date', label: __( 'Date', 'harlow' ) },
							{ value: 'title', label: __( 'Title', 'harlow' ) },
							{
								value: 'menu_order',
								label: __( 'Menu Order', 'harlow' ),
							},
							{
								value: 'modified',
								label: __( 'Last Modified', 'harlow' ),
							},
							{
								value: 'comment_count',
								label: __( 'Comment Count', 'harlow' ),
							},
							{ value: 'rand', label: __( 'Random', 'harlow' ) },
						] }
						onChange={ ( orderby ) => setAttributes( { orderby } ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Order', 'harlow' ) }
						value={ a.order }
						options={ [
							{ value: 'DESC', label: __( 'DESC', 'harlow' ) },
							{ value: 'ASC', label: __( 'ASC', 'harlow' ) },
						] }
						onChange={ ( order ) => setAttributes( { order } ) }
					/>
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Offset', 'harlow' ) }
						value={ a.offset }
						min={ 0 }
						max={ 50 }
						onChange={ ( offset ) =>
							setAttributes( { offset: offset || 0 } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Exclude the current item', 'harlow' ) }
						checked={ !! a.excludeCurrent }
						onChange={ ( excludeCurrent ) =>
							setAttributes( { excludeCurrent } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<CardFields attributes={ a } setAttributes={ setAttributes } />
			<ServerMarkup name="harlow/posts" attributes={ a } />
		</>
	);
}
