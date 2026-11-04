/**
 * A link on words (Ctrl+K, or Link in the toolbar): the same fields as a button's link in
 * the sidebar (shared.js's LinkFields), in a window under the words: a page of the site
 * picked from a list (written as the page's name, "faq.html", so the link follows the page
 * when its address changes: harlow_prose_links()), or an address typed (another site,
 * mailto:, tel:), a part of the page, a new tab, the rel. WordPress's own link format keeps
 * its name, its markup and its pasting rules; only its window is this one.
 */
import {
	RichTextShortcut,
	RichTextToolbarButton,
} from '@wordpress/block-editor';
import { Button, Popover } from '@wordpress/components';
import { select, subscribe, dispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { link as linkIcon, linkOff } from '@wordpress/icons';
import {
	applyFormat,
	create,
	insert,
	isCollapsed,
	removeFormat,
	useAnchor,
} from '@wordpress/rich-text';

import { LinkFields } from './shared';

const NAME = 'core/link';

/**
 * Where a link starts and ends: the words chosen, or, with the caret in a link, the whole
 * link around it.
 *
 * @param {Object} value The rich text value.
 * @return {number[]} [ start, end ].
 */
function linkBounds( value ) {
	const has = ( i ) =>
		( value.formats[ i ] || [] ).some( ( f ) => f.type === NAME );
	let start = value.start;
	let end = value.end;
	if ( start === end ) {
		while ( start > 0 && has( start - 1 ) ) {
			start--;
		}
		while ( end < value.text.length && has( end ) ) {
			end++;
		}
	}
	return [ start, end ];
}

/**
 * The link format's toolbar button, shortcuts and window.
 *
 * @param {Object} settings WordPress's link format, its markup and rules kept.
 * @return {Function} The format's edit component.
 */
function makeEdit( settings ) {
	return function Edit( {
		isActive,
		activeAttributes,
		value,
		onChange,
		onFocus,
		contentRef,
	} ) {
		const [ open, setOpen ] = useState( false );
		const [ draft, setDraft ] = useState( {} );
		const anchor = useAnchor( {
			editableContentElement: contentRef.current,
			settings: { ...settings, isActive },
		} );
		const start = () => {
			setDraft( {
				link: activeAttributes?.url || '',
				linkTarget: activeAttributes?.target || '',
				linkRel: activeAttributes?.rel || '',
			} );
			setOpen( true );
		};
		const close = () => {
			setOpen( false );
			onFocus();
		};
		const unlink = () => {
			const [ from, to ] = linkBounds( value );
			onChange( removeFormat( value, NAME, from, to ) );
			close();
		};
		const apply = () => {
			const url = ( draft.link || '' ).trim();
			if ( ! url ) {
				unlink();
				return;
			}
			const attributes = { url };
			if ( draft.linkTarget === '_blank' ) {
				attributes.target = '_blank';
			}
			if ( draft.linkRel ) {
				attributes.rel = draft.linkRel;
			}
			const format = { type: NAME, attributes };
			if ( isCollapsed( value ) && ! isActive ) {
				// No words chosen: the address goes in as the words, linked.
				const words = applyFormat(
					create( { text: url } ),
					format,
					0,
					url.length
				);
				onChange( insert( value, words ) );
			} else {
				const [ from, to ] = linkBounds( value );
				onChange(
					applyFormat(
						removeFormat( value, NAME, from, to ),
						format,
						from,
						to
					)
				);
			}
			close();
		};
		return (
			<>
				<RichTextShortcut
					type="primary"
					character="k"
					onUse={ start }
				/>
				<RichTextShortcut
					type="primaryShift"
					character="k"
					onUse={ unlink }
				/>
				<RichTextToolbarButton
					name="link"
					icon={ linkIcon }
					title={
						isActive
							? __( 'Edit link', 'harlow' )
							: __( 'Link', 'harlow' )
					}
					onClick={ start }
					isActive={ isActive }
					shortcutType="primary"
					shortcutCharacter="k"
				/>
				{ isActive && (
					<RichTextToolbarButton
						name="link"
						icon={ linkOff }
						title={ __( 'Unlink', 'harlow' ) }
						onClick={ unlink }
						shortcutType="primaryShift"
						shortcutCharacter="k"
					/>
				) }
				{ open && (
					<Popover
						anchor={ anchor }
						placement="bottom"
						focusOnMount="firstElement"
						onClose={ close }
						className="harlow-link"
					>
						<div className="harlow-link__body">
							<p className="harlow-link__title">
								{ isActive
									? __( 'Edit link', 'harlow' )
									: __( 'Add a link', 'harlow' ) }
							</p>
							<LinkFields
								value={ draft }
								onChange={ ( patch ) =>
									setDraft( { ...draft, ...patch } )
								}
							/>
							<div className="harlow-link__actions">
								{ isActive && (
									<Button
										variant="tertiary"
										isDestructive
										onClick={ unlink }
									>
										{ __( 'Remove link', 'harlow' ) }
									</Button>
								) }
								<Button variant="secondary" onClick={ close }>
									{ __( 'Cancel', 'harlow' ) }
								</Button>
								<Button
									variant="primary"
									onClick={ apply }
									disabled={ ! ( draft.link || '' ).trim() }
								>
									{ __( 'Apply', 'harlow' ) }
								</Button>
							</div>
						</div>
					</Popover>
				) }
			</>
		);
	};
}

// WordPress registers its link format with the editor's format library, and Rank Math
// registers it again with its own window; whichever is there is registered again with this
// window (its name, markup and pasting rules kept), each time another takes its place.
function swap() {
	const core = select( 'core/rich-text' ).getFormatType( NAME );
	if ( core && ! core.harlow ) {
		dispatch( 'core/rich-text' ).removeFormatTypes( NAME );
		dispatch( 'core/rich-text' ).addFormatTypes( {
			...core,
			harlow: true,
			edit: makeEdit( core ),
		} );
	}
}

swap();
subscribe( swap );
