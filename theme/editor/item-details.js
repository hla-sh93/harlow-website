/**
 * An item's screen (a project, a news item, a post, a job, a business model, a person, a
 * testimonial): a panel at the top of the sidebar says what the item is and where it shows,
 * holds its own fields (the theme's registered meta, saved with the item through the REST
 * API: a project's short description, year and pictures, a business model's icon and page,
 * a testimonial's position), and leads to where its page and its cards are designed
 * (functions/item-screen.php). A new item's screen says once what goes where.
 */
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import {
	Button,
	SelectControl,
	TextControl,
	TextareaControl,
} from '@wordpress/components';
import { store as coreStore, useEntityProp } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { external, layout, plus } from '@wordpress/icons';
import { registerPlugin } from '@wordpress/plugins';

import { PicturePicker, usePictureUrl } from './shared';

const site = window.harlowEditor || {};

/** Each type: the panel's title, what the item is and where it shows, its own fields. */
const TYPES = {
	albahoo_project: {
		title: __( 'Project details', 'harlow' ),
		about: __(
			'A project has its own page and a card in the projects lists: the card shows the featured image, the name and the first words of the text (or the excerpt).',
			'harlow'
		),
		fields: [
			[
				'_harlow_summary',
				'textarea',
				__( 'Short description', 'harlow' ),
				__( 'Shown beside the name on the project’s page.', 'harlow' ),
			],
			[ '_harlow_year', 'text', __( 'Year', 'harlow' ) ],
			[
				'_harlow_gallery',
				'pictures',
				__( 'Pictures', 'harlow' ),
				__( 'The gallery of the project’s page.', 'harlow' ),
			],
		],
	},
	news: {
		title: __( 'News item', 'harlow' ),
		about: __(
			'A news item has its own page and a card in the news lists: the featured image, the headline, the date and the first words of the text (or the excerpt).',
			'harlow'
		),
	},
	post: {
		title: __( 'Post', 'harlow' ),
		about: __(
			'A post has its own page and a card in the blog’s lists: the featured image, the title, the date and the first words of the text (or the excerpt). Its category is below.',
			'harlow'
		),
	},
	job: {
		title: __( 'Job', 'harlow' ),
		about: __(
			'A job has its own page with the application form, and a card in the careers list: the title and the first words of the description.',
			'harlow'
		),
	},
	business_model: {
		title: __( 'Business model details', 'harlow' ),
		about: __(
			'A business model has no page of its own: its card on the home page shows its icon, name and first words (or the excerpt), and opens the page chosen here.',
			'harlow'
		),
		fields: [
			[ '_harlow_icon', 'picture', __( 'Icon', 'harlow' ) ],
			[ '_harlow_link', 'page', __( 'Page the card opens', 'harlow' ) ],
		],
	},
	harlows_person: {
		title: __( 'Person', 'harlow' ),
		about: __(
			'A person has no page of their own: their card on Harlow’s people shows the featured image, the name and the first words, and opens a window with all of the text.',
			'harlow'
		),
	},
	testimonial: {
		title: __( 'Testimonial details', 'harlow' ),
		about: __(
			'A testimonial is a card: the featured image, what the person said (the text), their name (the title) and their position.',
			'harlow'
		),
		fields: [
			[
				'_harlow_position',
				'text',
				__( 'Position', 'harlow' ),
				__( 'Shown under the name.', 'harlow' ),
			],
		],
	},
};

/**
 * The pictures of a gallery field, in their order, chosen together from the Media Library.
 *
 * @param {Object}   props
 * @param {string}   props.label    The field's label.
 * @param {string}   props.help     What it is for.
 * @param {number[]} props.value    The pictures.
 * @param {Function} props.onChange Called with the pictures.
 */
function Pictures( { label, help, value = [], onChange } ) {
	return (
		<div className="harlow-item__pictures">
			<p className="harlow-item__label">{ label }</p>
			{ help && <p className="harlow-item__help">{ help }</p> }
			{ value.length > 0 && (
				<div className="harlow-item__thumbs">
					{ value.map( ( id ) => (
						<Thumb key={ id } id={ id } />
					) ) }
				</div>
			) }
			<MediaUploadCheck>
				<MediaUpload
					multiple
					gallery
					allowedTypes={ [ 'image' ] }
					value={ value }
					onSelect={ ( items ) =>
						onChange( items.map( ( item ) => item.id ) )
					}
					render={ ( { open } ) => (
						<Button variant="secondary" onClick={ open }>
							{ value.length
								? __( 'Change the pictures', 'harlow' )
								: __( 'Choose the pictures', 'harlow' ) }
						</Button>
					) }
				/>
			</MediaUploadCheck>
			{ value.length > 0 && (
				<Button
					variant="link"
					isDestructive
					className="harlow-item__remove"
					onClick={ () => onChange( [] ) }
				>
					{ __( 'Remove all', 'harlow' ) }
				</Button>
			) }
		</div>
	);
}

/**
 * One picture of a gallery field, small.
 *
 * @param {Object} props
 * @param {number} props.id The picture.
 */
function Thumb( { id } ) {
	const url = usePictureUrl( id );
	return url ? (
		<img className="harlow-item__thumb" src={ url } alt="" />
	) : (
		<span className="harlow-item__thumb" />
	);
}

/**
 * The page a card opens, chosen from the site's pages.
 *
 * @param {Object}   props
 * @param {string}   props.label    The field's label.
 * @param {number}   props.value    The page, 0 for none.
 * @param {Function} props.onChange Called with the page.
 */
function PageField( { label, value, onChange } ) {
	const pages = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords( 'postType', 'page', {
				per_page: 100,
				status: 'publish',
				orderby: 'title',
				order: 'asc',
				_fields: 'id,title',
			} ) || [],
		[]
	);
	return (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			value={ String( value || 0 ) }
			options={ [
				{ value: '0', label: __( '(no page)', 'harlow' ) },
				...pages.map( ( page ) => ( {
					value: String( page.id ),
					label: page.title?.rendered || `#${ page.id }`,
				} ) ),
			] }
			onChange={ ( v ) => onChange( Number( v ) ) }
		/>
	);
}

/**
 * Where the item's page and its cards are designed.
 *
 * @param {Object} props
 * @param {Object} props.item What the server says of the type (item-screen.php).
 */
function Design( { item } ) {
	return (
		<div className="harlow-item__design">
			<p className="harlow-item__label">{ __( 'Design', 'harlow' ) }</p>
			{ item.hasPage && item.pageDesign && (
				<>
					<Button
						variant="secondary"
						icon={ layout }
						href={ item.pageDesign }
						className="harlow-item__button"
					>
						{ __( 'Page design', 'harlow' ) }
					</Button>
					<p className="harlow-item__help">
						{ __(
							'Every item of this type shares one page design; this item’s title, pictures, text and fields fill it.',
							'harlow'
						) }
					</p>
				</>
			) }
			{ ( item.lists || [] ).map( ( list ) => (
				<Button
					key={ list.url }
					variant="secondary"
					icon={ external }
					iconPosition="right"
					href={ list.url }
					className="harlow-item__button"
				>
					{ sprintf(
						/* translators: %s: a page with a list of these items' cards */
						__( 'Cards on: %s', 'harlow' ),
						list.title
					) }
				</Button>
			) ) }
			{ ( item.lists || [] ).length > 0 && (
				<p className="harlow-item__help">
					{ __(
						'Card design: open the page, select its list, then Styles → Card, Card: picture, Card: title, Card: text, Card: button.',
						'harlow'
					) }
				</p>
			) }
			<Button
				variant="tertiary"
				icon={ plus }
				href={ item.newCard }
				className="harlow-item__button"
			>
				{ __( 'New card design (Theme Builder)', 'harlow' ) }
			</Button>
			<p className="harlow-item__help">
				{ __(
					'A card of your own, built from blocks; a list shows it once its Card setting names it.',
					'harlow'
				) }
			</p>
		</div>
	);
}

function ItemDetails() {
	const { type, isNew, empty } = useSelect( ( select ) => {
		const editor = select( 'core/editor' );
		return {
			type: editor.getCurrentPostType(),
			isNew: editor.getCurrentPost()?.status === 'auto-draft',
			empty: ! editor.getEditedPostContent(),
		};
	}, [] );
	const [ meta, setMeta ] = useEntityProp( 'postType', type, 'meta' );
	const { createNotice } = useDispatch( 'core/notices' );
	// The panel opens the first time an item's screen is seen; after that it stays as the
	// owner leaves it (WordPress keeps a panel closed until it is opened).
	const panel = 'harlow-item-details/harlow-item';
	const { opened, seen } = useSelect(
		( select ) => ( {
			opened: select( 'core/editor' ).isEditorPanelOpened( panel ),
			seen: select( 'core/preferences' ).get( 'harlow', 'itemPanelSeen' ),
		} ),
		[]
	);
	const { toggleEditorPanelOpened } = useDispatch( 'core/editor' );
	const { set: setPreference } = useDispatch( 'core/preferences' );
	const info = TYPES[ type ];
	const item = site.item;
	// A new item says once what goes where.
	useEffect( () => {
		if ( info && isNew && empty ) {
			createNotice(
				'info',
				sprintf(
					/* translators: %s: the panel's title (Project details…) */
					__(
						'Write the title and the text here. The featured image, the excerpt and “%s” are in the sidebar on the right.',
						'harlow'
					),
					info.title
				),
				{ id: 'harlow-item-guide', isDismissible: true }
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ type ] );
	// (After the editor's own start, which sets the open panels from the saved preferences.)
	useEffect( () => {
		if ( ! info || ! item || ( seen && ! isNew ) ) {
			return;
		}
		const timer = setTimeout( () => {
			if ( ! opened ) {
				toggleEditorPanelOpened( panel );
			}
			setPreference( 'harlow', 'itemPanelSeen', true );
		}, 800 );
		return () => clearTimeout( timer );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );
	if ( ! info || ! item ) {
		return null;
	}
	const set = ( key, value ) => setMeta( { ...meta, [ key ]: value } );
	return (
		<PluginDocumentSettingPanel
			name="harlow-item"
			title={ info.title }
			className="harlow-item"
			initialOpen
		>
			<p className="harlow-item__about">{ info.about }</p>
			{ ( info.fields || [] ).map( ( [ key, kind, label, help ] ) => {
				const value = meta?.[ key ];
				if ( kind === 'textarea' ) {
					return (
						<TextareaControl
							key={ key }
							__nextHasNoMarginBottom
							label={ label }
							help={ help }
							value={ value || '' }
							rows={ 3 }
							onChange={ ( v ) => set( key, v ) }
						/>
					);
				}
				if ( kind === 'text' ) {
					return (
						<TextControl
							key={ key }
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ label }
							help={ help }
							value={ value || '' }
							onChange={ ( v ) => set( key, v ) }
						/>
					);
				}
				if ( kind === 'picture' ) {
					return (
						<PicturePicker
							key={ key }
							label={ label }
							value={ value || 0 }
							onChange={ ( id ) => set( key, id ) }
							none={ __( 'None chosen', 'harlow' ) }
						/>
					);
				}
				if ( kind === 'page' ) {
					return (
						<PageField
							key={ key }
							label={ label }
							value={ value }
							onChange={ ( id ) => set( key, id ) }
						/>
					);
				}
				return (
					<Pictures
						key={ key }
						label={ label }
						help={ help }
						value={ Array.isArray( value ) ? value : [] }
						onChange={ ( ids ) => set( key, ids ) }
					/>
				);
			} ) }
			<Design item={ item } />
		</PluginDocumentSettingPanel>
	);
}

registerPlugin( 'harlow-item-details', { render: ItemDetails } );
