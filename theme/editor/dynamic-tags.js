/**
 * Dynamic tags in the words of any block (Elementor Pro's): a button of the words' toolbar
 * puts a tag where the cursor is (or over the words chosen), shown in the editor as its
 * name in brackets and printed on the page as its value (functions/dynamic-tags.php).
 */
import { RichTextToolbarButton } from '@wordpress/block-editor';
import {
	Button,
	Popover,
	SelectControl,
	TextControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { create, insert, registerFormatType } from '@wordpress/rich-text';

/** The tags, as harlow_dynamic_tags() names them; `key` says what a tag also asks for. */
const TAGS = [
	[ 'post-title', __( 'Post title', 'harlow' ) ],
	[ 'post-excerpt', __( 'Post excerpt', 'harlow' ) ],
	[ 'post-date', __( 'Post date', 'harlow' ), 'format' ],
	[ 'post-time', __( 'Post time', 'harlow' ), 'format' ],
	[ 'post-modified', __( 'Post modified date', 'harlow' ), 'format' ],
	[ 'post-terms', __( 'Post categories', 'harlow' ), 'taxonomy' ],
	[ 'post-id', __( 'Post ID', 'harlow' ) ],
	[ 'post-url', __( 'Post address', 'harlow' ) ],
	[ 'comments-number', __( 'Comments number', 'harlow' ) ],
	[ 'author-name', __( 'Author name', 'harlow' ) ],
	[ 'author-bio', __( 'Author biography', 'harlow' ) ],
	[ 'archive-title', __( 'Archive title', 'harlow' ) ],
	[ 'archive-description', __( 'Archive description', 'harlow' ) ],
	[ 'page-title', __( 'Page title', 'harlow' ) ],
	[ 'site-title', __( 'Site title', 'harlow' ) ],
	[ 'site-tagline', __( 'Site tagline', 'harlow' ) ],
	[ 'site-url', __( 'Site address', 'harlow' ) ],
	[ 'current-date', __( 'Current date and time', 'harlow' ), 'format' ],
	[ 'user-name', __( 'Visitor’s name (logged in)', 'harlow' ) ],
	[ 'request', __( 'Request parameter', 'harlow' ), 'key' ],
	[ 'custom-field', __( 'Custom field', 'harlow' ), 'key' ],
	[ 'shortcode', __( 'Shortcode', 'harlow' ), 'key' ],
];

const NAME = 'harlow/dynamic';

/**
 * The toolbar button and its window: which tag, what it asks for, the words before and
 * after it, and what shows when it has no value.
 *
 * @param {Object}   props
 * @param {Object}   props.value    The words' value.
 * @param {Function} props.onChange Called with the new value.
 * @param {boolean}  props.isActive Whether the cursor is on a tag.
 */
function Edit( { value, onChange, isActive } ) {
	const [ open, setOpen ] = useState( false );
	const [ tag, setTag ] = useState( 'post-title' );
	const [ key, setKey ] = useState( '' );
	const [ before, setBefore ] = useState( '' );
	const [ after, setAfter ] = useState( '' );
	const [ fallback, setFallback ] = useState( '' );
	const asks = TAGS.find( ( t ) => t[ 0 ] === tag )?.[ 2 ];
	const label = TAGS.find( ( t ) => t[ 0 ] === tag )?.[ 1 ] || tag;
	const put = () => {
		const attrs = { tag };
		if ( key ) {
			attrs[ asks === 'format' ? 'format' : 'key' ] = key;
		}
		if ( before ) {
			attrs.before = before;
		}
		if ( after ) {
			attrs.after = after;
		}
		if ( fallback ) {
			attrs.fallback = fallback;
		}
		const words = create( { text: `[${ label }]` } );
		words.formats = words.formats.map( () => [
			{ type: NAME, attributes: attrs },
		] );
		onChange( insert( value, words ) );
		setOpen( false );
	};
	return (
		<>
			<RichTextToolbarButton
				icon="database"
				title={ __( 'Dynamic tag', 'harlow' ) }
				onClick={ () => setOpen( true ) }
				isActive={ isActive }
			/>
			{ open && (
				<Popover
					placement="bottom"
					onClose={ () => setOpen( false ) }
					className="harlow-dynamic-popover"
				>
					<div className="harlow-dynamic-popover__body">
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Dynamic tag', 'harlow' ) }
							value={ tag }
							options={ TAGS.map( ( [ v, l ] ) => ( {
								value: v,
								label: l,
							} ) ) }
							onChange={ ( v ) => {
								setTag( v );
								setKey( '' );
							} }
						/>
						{ asks && (
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={
									{
										format: __(
											'Format (PHP date format, empty: the site’s)',
											'harlow'
										),
										taxonomy: __(
											'Taxonomy (empty: categories)',
											'harlow'
										),
										key: __(
											'Key, name or shortcode',
											'harlow'
										),
									}[ asks ]
								}
								value={ key }
								onChange={ setKey }
							/>
						) }
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Before', 'harlow' ) }
							value={ before }
							onChange={ setBefore }
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'After', 'harlow' ) }
							value={ after }
							onChange={ setAfter }
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __(
								'Fallback (when it has no value)',
								'harlow'
							) }
							value={ fallback }
							onChange={ setFallback }
						/>
						<Button variant="primary" onClick={ put }>
							{ __( 'Insert', 'harlow' ) }
						</Button>
					</div>
				</Popover>
			) }
		</>
	);
}

registerFormatType( NAME, {
	title: __( 'Dynamic tag', 'harlow' ),
	tagName: 'span',
	className: 'harlow-dynamic',
	attributes: {
		tag: 'data-tag',
		key: 'data-key',
		format: 'data-format',
		before: 'data-before',
		after: 'data-after',
		fallback: 'data-fallback',
	},
	edit: Edit,
} );
