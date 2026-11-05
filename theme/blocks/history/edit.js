/**
 * The history slider in the editor: includes/sections/history.php's markup, drawn from the
 * milestones in the sidebar (each a year, a title in two colours, words, its pictures). A
 * year clicked on the canvas, or a milestone being changed, shows that milestone, as the
 * page's script shows one after another (the canvas runs no script).
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	TextControl,
	TextareaControl,
} from '@wordpress/components';
import { useRefEffect } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { escapeAttribute, escapeHTML } from '@wordpress/escape-html';
import { __, sprintf } from '@wordpress/i18n';

import ItemPanels from '../../editor/items';
import {
	elementProps,
	linkUrl,
	PICKED,
	PicturePicker,
} from '../../editor/shared';

/** A milestone added to an empty slider. */
const BLANK = {
	year: '',
	title: '',
	highlight: '',
	text: '',
	picture: 0,
	pictureMobile: 0,
};

/**
 * The addresses of some Media Library pictures, by id ('' for none or not loaded yet).
 *
 * @param {number[]} ids The pictures.
 * @return {string[]} Their addresses, in the same order.
 */
function usePictureUrls( ids ) {
	const key = ids.join( ',' );
	const joined = useSelect(
		( select ) =>
			key
				.split( ',' )
				.map( ( id ) =>
					Number( id )
						? select( coreStore ).getEntityRecord(
								'postType',
								'attachment',
								Number( id )
							)?.source_url ||
							PICKED[ id ] ||
							''
						: ''
				)
				.join( '\n' ),
		[ key ]
	);
	return joined.split( '\n' );
}

/**
 * The slider's markup, as includes/sections/history.php prints it (the first milestone
 * shown, as the page starts).
 *
 * @param {Object} attributes The block's attributes.
 * @param {Object} urls       The pictures chosen: { icon, items: [ [ picture, phones ] ] }.
 * @return {string} The markup.
 */
export function sliderMarkup( attributes, urls ) {
	const items = attributes.items || [];
	const icon =
		urls.icon ||
		( attributes.labelImage ? linkUrl( attributes.labelImage ) : '' );
	const label =
		( icon
			? ` <img decoding="async" src="${ escapeAttribute( icon ) }" alt="">`
			: '' ) +
		` <span>${ escapeHTML( attributes.label || '' ) }</span> </div>`;
	let slides = '';
	let thumbs = '';
	items.forEach( ( item, n ) => {
		const on = n === 0;
		const [ picture, phones ] = urls.items[ n ] || [];
		const style =
			( picture ? `--hl-slide-picture: url("${ picture }");` : '' ) +
			( phones ? `--hl-slide-picture-mobile: url("${ phones }");` : '' );
		slides +=
			` <div class="history_slide history_slide_${ n }"${
				style ? ` style="${ escapeAttribute( style ) }"` : ''
			}>` +
			` <div class="history_slide_content"> <div class="milestone_wrapper${
				on ? ' active-content' : ''
			}">${ label }` +
			` <div class="slide_title_wrapper"> <p class="${
				on ? 'active-content' : ''
			}"> ${ escapeHTML( item.title || '' ) }` +
			` <span style="color: rgb(106, 218, 219)">${ escapeHTML(
				item.highlight || ''
			) }</span> </p>` +
			` <p class="slide_text${ on ? ' active-content' : '' }">${ escapeHTML(
				item.text || ''
			) }</p>` +
			' </div> </div> </div>';
		let mark = '';
		if ( on ) {
			mark = ' active-thumb';
		} else if ( n === 1 ) {
			mark = ' active';
		}
		thumbs += ` <div class="thumb-wrapper${ mark }"> <span>${ escapeHTML(
			item.year || ''
		) }</span> <span class="thumb"></span> </div>`;
	} );
	const every = Number( attributes.interval );
	return (
		`<div id="history-slider"${
			every > 0 && every !== 9 ? ` data-interval="${ every }"` : ''
		}>` +
		slides +
		' <div class="navigation-wrapper"> <div class="connector-wrapper"> <span class="connector"></span> </div> <div class="slide-nav">' +
		thumbs +
		' </div> </div> </div>'
	);
}

/**
 * Shows one milestone in the canvas as the page's script does (assets/js/history-slider.js),
 * on the elements already drawn: its slide over the others, its words and its year marked.
 *
 * @param {Element} node  The widget's container.
 * @param {number}  shown The milestone (0: the first, as the page starts).
 */
function showMilestone( node, shown ) {
	node.querySelectorAll( '.history_slide' ).forEach( ( slide, n ) => {
		// The page's stylesheet shows the first; another is shown over it.
		slide.style.opacity = shown ? String( Number( n === shown ) ) : '';
		[
			slide.querySelector( '.milestone_wrapper' ),
			slide.querySelector( '.slide_title_wrapper p' ),
			slide.querySelector( '.slide_title_wrapper .slide_text' ),
		]
			.filter( Boolean )
			.forEach( ( el ) =>
				el.classList.toggle( 'active-content', n === shown )
			);
	} );
	node.querySelectorAll( '.thumb-wrapper' ).forEach( ( thumb, n ) =>
		thumb.classList.toggle( 'active-thumb', n === shown )
	);
}

export default function Edit( { attributes, setAttributes, isSelected } ) {
	const [ shown, setShown ] = useState( 0 );
	// Left, the slider starts again at its first milestone, as the page does.
	useEffect( () => {
		if ( ! isSelected ) {
			setShown( 0 );
		}
	}, [ isSelected ] );
	const box = useRef();
	const items = attributes.items || [];
	const found = usePictureUrls( [
		attributes.labelPicture,
		...items.flatMap( ( item ) => [ item.picture, item.pictureMobile ] ),
	] );
	const urls = {
		icon: found[ 0 ],
		items: items.map( ( item, n ) => [
			found[ 1 + n * 2 ],
			found[ 2 + n * 2 ],
		] ),
	};
	const at = Math.min( shown, Math.max( items.length - 1, 0 ) );
	// A year clicked on the canvas shows its milestone.
	const yearClicks = useRefEffect( ( node ) => {
		box.current = node;
		const onClick = ( event ) => {
			const thumb = event.target.closest?.( '.thumb-wrapper' );
			if ( thumb ) {
				setShown( [ ...thumb.parentNode.children ].indexOf( thumb ) );
			}
		};
		node.addEventListener( 'click', onClick );
		return () => node.removeEventListener( 'click', onClick );
	}, [] );
	const markup = sliderMarkup( attributes, urls );
	// The milestone shown, on the elements drawn (drawn again when the markup changes).
	useEffect( () => {
		if ( box.current ) {
			showMilestone( box.current, at );
		}
	}, [ at, markup ] );
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'html.default' )
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'History slider', 'harlow' ) }>
					<p className="harlow-item__help">
						{ __(
							'Each milestone below is one slide: its year on the timeline, its title in two colours, its words and its picture. Click a year on the page to see its milestone here.',
							'harlow'
						) }
					</p>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Label', 'harlow' ) }
						value={ attributes.label }
						onChange={ ( label ) => setAttributes( { label } ) }
					/>
					<PicturePicker
						label={ __( 'Label icon', 'harlow' ) }
						value={ attributes.labelPicture }
						onChange={ ( labelPicture ) =>
							setAttributes( { labelPicture } )
						}
						none={ __( "The design's icon", 'harlow' ) }
					/>
					<RangeControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Seconds on each milestone', 'harlow' ) }
						value={ attributes.interval }
						min={ 3 }
						max={ 30 }
						onChange={ ( interval ) =>
							setAttributes( { interval: interval || 9 } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<ItemPanels
				items={ items }
				onChange={ ( next ) => setAttributes( { items: next } ) }
				blank={ BLANK }
				title={ ( n ) =>
					sprintf(
						/* translators: 1: the milestone's number, 2: its year. */
						__( 'Milestone %1$d: %2$s', 'harlow' ),
						n,
						items[ n - 1 ]?.year || ''
					)
				}
				addLabel={ __( 'Add a milestone', 'harlow' ) }
			>
				{ ( item, update ) => {
					const n = items.indexOf( item );
					// A milestone being changed is the one the canvas shows.
					const edit = ( patch ) => {
						setShown( Math.max( n, 0 ) );
						update( patch );
					};
					return (
						<>
							<TextControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'Year', 'harlow' ) }
								value={ item.year || '' }
								onChange={ ( year ) => edit( { year } ) }
							/>
							<TextControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'Title', 'harlow' ) }
								value={ item.title || '' }
								onChange={ ( title ) => edit( { title } ) }
							/>
							<TextControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'Title: second colour', 'harlow' ) }
								help={ __(
									'Shown after the title, in the second colour.',
									'harlow'
								) }
								value={ item.highlight || '' }
								onChange={ ( highlight ) =>
									edit( { highlight } )
								}
							/>
							<TextareaControl
								__nextHasNoMarginBottom
								label={ __( 'Text', 'harlow' ) }
								value={ item.text || '' }
								onChange={ ( text ) => edit( { text } ) }
							/>
							<PicturePicker
								label={ __( 'Picture', 'harlow' ) }
								value={ item.picture || 0 }
								onChange={ ( picture ) => edit( { picture } ) }
								none={ __(
									"The design's picture for this place",
									'harlow'
								) }
							/>
							<PicturePicker
								label={ __( 'Picture on phones', 'harlow' ) }
								value={ item.pictureMobile || 0 }
								onChange={ ( pictureMobile ) =>
									edit( { pictureMobile } )
								}
								none={ __( 'The picture above', 'harlow' ) }
							/>
						</>
					);
				} }
			</ItemPanels>
			<div { ...blockProps }>
				{ '\n' }
				<div
					ref={ yearClicks }
					className="elementor-widget-container"
					dangerouslySetInnerHTML={ { __html: '\n' + markup + '\n' } }
				/>
				{ '\n' }
			</div>
		</>
	);
}
