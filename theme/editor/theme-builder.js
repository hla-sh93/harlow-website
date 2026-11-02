/**
 * The Theme Builder's sidebar (a template of Appearance → Theme Builder,
 * functions/theme-builder.php): the template's kind; its display conditions, each
 * including or excluding a part of the site; and a popup's settings, triggers and rules.
 * The template's Elementor document block follows its kind.
 */
import {
	Button,
	CheckboxControl,
	ComboboxControl,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { store as coreStore, useEntityProp } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';

const site = window.harlowEditor || {};

/** Elementor's document type of each kind (harlow_template_kinds()). */
const DOC_TYPES = {
	header: 'header',
	footer: 'footer',
	single: 'single-post',
	archive: 'archive',
	search: 'search-results',
	error: 'error-404',
	'loop-item': 'loop-item',
	popup: 'popup',
};

/** The rules a condition may name, and what each needs beside it. */
const RULES = [
	[ 'entire', __( 'Entire site', 'harlow' ), '' ],
	[ 'front', __( 'Front page', 'harlow' ), '' ],
	[ 'singular', __( 'Every page and item', 'harlow' ), '' ],
	[ 'page', __( 'Every page', 'harlow' ), '' ],
	[ 'type', __( 'Every item of a type…', 'harlow' ), 'type' ],
	[ 'id', __( 'One page or item…', 'harlow' ), 'id' ],
	[ 'archive', __( 'Every archive', 'harlow' ), '' ],
	[ 'archive-type', __( 'The archive of a type…', 'harlow' ), 'type' ],
	[ 'term', __( 'A category…', 'harlow' ), 'term' ],
	[ 'search', __( 'Search results', 'harlow' ), '' ],
	[ '404', __( '404 page', 'harlow' ), '' ],
	[ 'author', __( 'Author archives', 'harlow' ), '' ],
	[ 'date', __( 'Date archives', 'harlow' ), '' ],
];

/**
 * A condition's rule split into its parts: [ rule, value ].
 *
 * @param {string} rule The stored rule (type:news, id:12, archive:post, term:category:5).
 * @return {Array<string>} The rule's name as the list names it, and its value.
 */
function splitRule( rule = 'entire' ) {
	const [ name, ...rest ] = rule.split( ':' );
	if ( name === 'archive' && rest.length ) {
		return [ 'archive-type', rest.join( ':' ) ];
	}
	if ( name === 'term' ) {
		return [ 'term', rest.slice( 1 ).join( ':' ) ];
	}
	return [ name, rest.join( ':' ) ];
}

/**
 * The stored rule of a rule's name and value.
 *
 * @param {string} name  The rule's name.
 * @param {string} value Its value.
 * @return {string} The rule.
 */
function joinRule( name, value ) {
	if ( name === 'archive-type' ) {
		return value ? `archive:${ value }` : 'archive';
	}
	if ( name === 'term' ) {
		return `term:category:${ value || '' }`;
	}
	return value ? `${ name }:${ value }` : name;
}

/**
 * Parse a JSON field, or give its fallback.
 *
 * @param {string} text     The JSON.
 * @param {*}      fallback What an empty field is.
 * @return {*} The value.
 */
function parse( text, fallback ) {
	try {
		return text ? JSON.parse( text ) : fallback;
	} catch {
		return fallback;
	}
}

/**
 * One condition: include or exclude, its rule, and what the rule names.
 *
 * @param {Object}   props
 * @param {Object}   props.value    The condition.
 * @param {Function} props.onChange Called with the condition.
 * @param {Function} props.onRemove Called to remove it.
 * @param {Array}    props.types    The post types: [ { slug, name } ].
 * @param {Array}    props.items    Pages and items: [ { value, label } ].
 * @param {Array}    props.terms    Categories: [ { value, label } ].
 */
function Condition( { value, onChange, onRemove, types, items, terms } ) {
	const [ name, extra ] = splitRule( value.rule );
	const needs = RULES.find( ( r ) => r[ 0 ] === name )?.[ 2 ] || '';
	return (
		<div className="harlow-condition">
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Include or exclude', 'harlow' ) }
				value={ value.type || 'include' }
				options={ [
					{ value: 'include', label: __( 'Include', 'harlow' ) },
					{ value: 'exclude', label: __( 'Exclude', 'harlow' ) },
				] }
				onChange={ ( type ) => onChange( { ...value, type } ) }
			/>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Where', 'harlow' ) }
				value={ name }
				options={ RULES.map( ( [ v, label ] ) => ( {
					value: v,
					label,
				} ) ) }
				onChange={ ( v ) =>
					onChange( { ...value, rule: joinRule( v, '' ) } )
				}
			/>
			{ needs === 'type' && (
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Type', 'harlow' ) }
					value={ extra }
					options={ [
						{ value: '', label: __( 'Choose…', 'harlow' ) },
						...types.map( ( t ) => ( {
							value: t.slug,
							label: t.name,
						} ) ),
					] }
					onChange={ ( v ) =>
						onChange( { ...value, rule: joinRule( name, v ) } )
					}
				/>
			) }
			{ needs === 'id' && (
				<ComboboxControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Page or item', 'harlow' ) }
					value={ extra }
					options={ items }
					onChange={ ( v ) =>
						onChange( {
							...value,
							rule: joinRule( name, v || '' ),
						} )
					}
				/>
			) }
			{ needs === 'term' && (
				<ComboboxControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Category', 'harlow' ) }
					value={ extra }
					options={ terms }
					onChange={ ( v ) =>
						onChange( {
							...value,
							rule: joinRule( name, v || '' ),
						} )
					}
				/>
			) }
			<Button variant="link" isDestructive onClick={ onRemove }>
				{ __( 'Remove this condition', 'harlow' ) }
			</Button>
		</div>
	);
}

/**
 * A popup's settings: layout, close, animation, triggers, advanced rules.
 *
 * @param {Object}   props
 * @param {Object}   props.value    The settings.
 * @param {Function} props.onChange Called with the settings.
 */
function PopupSettings( { value, onChange } ) {
	const set = ( patch ) => onChange( { ...value, ...patch } );
	const number = ( key, label, help ) => (
		<TextControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			type="number"
			min={ 0 }
			label={ label }
			help={ help }
			value={ value[ key ] ?? '' }
			onChange={ ( v ) => set( { [ key ]: v } ) }
		/>
	);
	const devices = value.devices || [];
	return (
		<>
			<p className="harlow-style__group">{ __( 'Layout', 'harlow' ) }</p>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Position', 'harlow' ) }
				value={ value.position || 'center' }
				options={ [
					[ 'center', __( 'Centre', 'harlow' ) ],
					[ 'top', __( 'Top', 'harlow' ) ],
					[ 'bottom', __( 'Bottom', 'harlow' ) ],
					[ 'left', __( 'Left', 'harlow' ) ],
					[ 'right', __( 'Right', 'harlow' ) ],
					[ 'top-left', __( 'Top left', 'harlow' ) ],
					[ 'top-right', __( 'Top right', 'harlow' ) ],
					[ 'bottom-left', __( 'Bottom left', 'harlow' ) ],
					[ 'bottom-right', __( 'Bottom right', 'harlow' ) ],
				].map( ( [ v, label ] ) => ( { value: v, label } ) ) }
				onChange={ ( position ) => set( { position } ) }
			/>
			{ number( 'width', __( 'Width (px)', 'harlow' ) ) }
			{ number(
				'height',
				__( 'Height (px, empty: fits its content)', 'harlow' )
			) }
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Overlay behind it', 'harlow' ) }
				checked={ value.overlay !== false }
				onChange={ ( overlay ) => set( { overlay } ) }
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Close button', 'harlow' ) }
				checked={ value.close !== false }
				onChange={ ( close ) => set( { close } ) }
			/>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Entrance animation', 'harlow' ) }
				value={ value.entrance || 'fadeIn' }
				options={ [
					'none',
					'fadeIn',
					'fadeInUp',
					'fadeInDown',
					'fadeInLeft',
					'fadeInRight',
					'zoomIn',
					'slideInUp',
					'slideInDown',
					'slideInLeft',
					'slideInRight',
					'bounceIn',
				].map( ( v ) => ( { value: v, label: v } ) ) }
				onChange={ ( entrance ) => set( { entrance } ) }
			/>
			{ number( 'duration', __( 'Animation duration (ms)', 'harlow' ) ) }
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Close with the Escape key', 'harlow' ) }
				checked={ value.escape !== false }
				onChange={ ( escape ) => set( { escape } ) }
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Close with a click on the overlay', 'harlow' ) }
				checked={ value.overlayClose !== false }
				onChange={ ( overlayClose ) => set( { overlayClose } ) }
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __(
					'Keep the page from scrolling while it is open',
					'harlow'
				) }
				checked={ !! value.lockScroll }
				onChange={ ( lockScroll ) => set( { lockScroll } ) }
			/>
			<p className="harlow-style__group">
				{ __( 'Triggers', 'harlow' ) }
			</p>
			{ number(
				'load',
				__( 'On page load, after (seconds)', 'harlow' ),
				__( 'Empty: not on page load.', 'harlow' )
			) }
			{ number(
				'scroll',
				__( 'On scroll, at (% of the page)', 'harlow' )
			) }
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __(
					'On scrolling to an element (CSS selector)',
					'harlow'
				) }
				value={ value.scrollTo || '' }
				onChange={ ( scrollTo ) => set( { scrollTo } ) }
			/>
			{ number(
				'clicks',
				__( 'After this many clicks on the page', 'harlow' )
			) }
			{ number(
				'inactivity',
				__( 'After inactivity (seconds)', 'harlow' )
			) }
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'When the visitor is about to leave', 'harlow' ) }
				checked={ !! value.exit }
				onChange={ ( exit ) => set( { exit } ) }
			/>
			<p className="harlow-style__group">
				{ __( 'Advanced rules', 'harlow' ) }
			</p>
			{ number(
				'times',
				__( 'Show up to (times, empty: always)', 'harlow' )
			) }
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Counted per', 'harlow' ) }
				value={ value.per || 'session' }
				options={ [
					[ 'session', __( 'Visit', 'harlow' ) ],
					[ 'day', __( 'Day', 'harlow' ) ],
					[ 'week', __( 'Week', 'harlow' ) ],
					[ 'month', __( 'Month', 'harlow' ) ],
					[ 'ever', __( 'Ever', 'harlow' ) ],
				].map( ( [ v, label ] ) => ( { value: v, label } ) ) }
				onChange={ ( per ) => set( { per } ) }
			/>
			{ number(
				'afterViews',
				__( 'After this many pages seen', 'harlow' )
			) }
			{ number(
				'afterSessions',
				__( 'After this many visits', 'harlow' )
			) }
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __(
					'When arriving from an address holding',
					'harlow'
				) }
				value={ value.from || '' }
				onChange={ ( from ) => set( { from } ) }
			/>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Show to', 'harlow' ) }
				value={ value.loggedIn || '' }
				options={ [
					{ value: '', label: __( 'Everyone', 'harlow' ) },
					{
						value: 'in',
						label: __( 'Logged-in visitors', 'harlow' ),
					},
					{
						value: 'out',
						label: __( 'Visitors who are not logged in', 'harlow' ),
					},
				] }
				onChange={ ( loggedIn ) => set( { loggedIn } ) }
			/>
			{ [
				[ 'desktop', __( 'Show on desktop', 'harlow' ) ],
				[ 'tablet', __( 'Show on tablet', 'harlow' ) ],
				[ 'mobile', __( 'Show on mobile', 'harlow' ) ],
			].map( ( [ key, label ] ) => (
				<CheckboxControl
					key={ key }
					__nextHasNoMarginBottom
					label={ label }
					checked={ ! devices.length || devices.includes( key ) }
					onChange={ ( on ) => {
						const all = devices.length
							? devices
							: [ 'desktop', 'tablet', 'mobile' ];
						const next = on
							? [ ...new Set( [ ...all, key ] ) ]
							: all.filter( ( d ) => d !== key );
						set( { devices: next.length === 3 ? [] : next } );
					} }
				/>
			) ) }
			<p className="description">
				{ __(
					'A link to #harlow-popup-ID (this template’s number) opens it; a link to #harlow-popup-close closes it.',
					'harlow'
				) }
			</p>
		</>
	);
}

/**
 * The sidebar of a Theme Builder template.
 */
function TemplatePanel() {
	const postType = useSelect(
		( select ) => select( 'core/editor' ).getCurrentPostType(),
		[]
	);
	const postId = useSelect(
		( select ) => select( 'core/editor' ).getCurrentPostId(),
		[]
	);
	const [ meta, setMeta ] = useEntityProp(
		'postType',
		'harlow_template',
		'meta'
	);
	const { types, items, terms, documentId, document } = useSelect(
		( select ) => {
			const core = select( coreStore );
			const editor = select( 'core/block-editor' );
			const viewable = (
				core.getPostTypes( { per_page: -1 } ) || []
			).filter( ( t ) => t.viewable && t.slug !== 'attachment' );
			const all = [];
			for ( const t of viewable ) {
				for ( const r of core.getEntityRecords( 'postType', t.slug, {
					per_page: 100,
					status: 'publish',
				} ) || [] ) {
					all.push( {
						value: String( r.id ),
						label: `${ r.title?.rendered || r.slug } (${ t.name })`,
					} );
				}
			}
			const first = editor.getBlocks()[ 0 ];
			return {
				types: viewable.map( ( t ) => ( {
					slug: t.slug,
					name: t.name,
				} ) ),
				items: all,
				terms: (
					core.getEntityRecords( 'taxonomy', 'category', {
						per_page: 100,
					} ) || []
				).map( ( c ) => ( { value: String( c.id ), label: c.name } ) ),
				documentId:
					first?.name === 'harlow/document' ? first.clientId : '',
				document: first?.attributes,
			};
		},
		[]
	);
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
	const isTemplate = postType === 'harlow_template' && !! meta;
	const kind = ( isTemplate && meta._harlow_template_kind ) || 'header';
	// A new template's document box takes its kind and number once.
	useEffect( () => {
		if ( isTemplate && documentId && document && ! document.docId ) {
			updateBlockAttributes( documentId, {
				docType: DOC_TYPES[ kind ],
				docId: postId,
				location: kind,
			} );
		}
	}, [
		isTemplate,
		documentId,
		document,
		kind,
		postId,
		updateBlockAttributes,
	] );
	if ( ! isTemplate ) {
		return null;
	}
	const conditions = parse( meta._harlow_conditions, [] );
	const popup = parse( meta._harlow_popup, {} );
	const setConditions = ( next ) =>
		setMeta( { ...meta, _harlow_conditions: JSON.stringify( next ) } );
	const setKind = ( next ) => {
		setMeta( { ...meta, _harlow_template_kind: next } );
		// The document box follows the kind, as Elementor's theme builder prints it.
		if ( documentId ) {
			updateBlockAttributes( documentId, {
				docType: DOC_TYPES[ next ],
				docId: postId,
				location: next,
			} );
		}
	};
	return (
		<>
			<PluginDocumentSettingPanel
				name="harlow-template"
				title={ __( 'Template', 'harlow' ) }
				initialOpen
			>
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Kind of template', 'harlow' ) }
					value={ kind }
					options={ Object.entries( site.templateKinds || {} ).map(
						( [ value, label ] ) => ( { value, label } )
					) }
					onChange={ setKind }
				/>
			</PluginDocumentSettingPanel>
			<PluginDocumentSettingPanel
				name="harlow-template-conditions"
				title={ __( 'Display conditions', 'harlow' ) }
				initialOpen
			>
				{ kind === 'loop-item' ? (
					<p>
						{ __(
							'A card shows where a list names it (the list’s Card setting).',
							'harlow'
						) }
					</p>
				) : (
					<>
						{ conditions.map( ( condition, i ) => (
							<Condition
								key={ i }
								value={ condition }
								types={ types }
								items={ items }
								terms={ terms }
								onChange={ ( next ) =>
									setConditions(
										conditions.map( ( c, j ) =>
											j === i ? next : c
										)
									)
								}
								onRemove={ () =>
									setConditions(
										conditions.filter( ( c, j ) => j !== i )
									)
								}
							/>
						) ) }
						<Button
							variant="secondary"
							onClick={ () =>
								setConditions( [
									...conditions,
									{ type: 'include', rule: 'entire' },
								] )
							}
						>
							{ __( 'Add a condition', 'harlow' ) }
						</Button>
					</>
				) }
			</PluginDocumentSettingPanel>
			{ kind === 'popup' && (
				<PluginDocumentSettingPanel
					name="harlow-template-popup"
					title={ __( 'Popup', 'harlow' ) }
					initialOpen
				>
					<PopupSettings
						value={ popup }
						onChange={ ( next ) =>
							setMeta( {
								...meta,
								_harlow_popup: JSON.stringify( next ),
							} )
						}
					/>
				</PluginDocumentSettingPanel>
			) }
		</>
	);
}

registerPlugin( 'harlow-theme-builder', { render: TemplatePanel } );
