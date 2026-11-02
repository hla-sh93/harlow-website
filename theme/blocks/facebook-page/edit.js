/**
 * A Facebook page in the editor: includes/sections/facebook-page.php's markup, with a box
 * in it saying what Facebook's SDK will draw there, at the page's height (the SDK runs on
 * the page, not in the editor); the page's address, its tabs, parts and height in the
 * sidebar.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	CheckboxControl,
	PanelBody,
	RangeControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

import { elementProps } from '../../editor/shared';

const CLASSES =
	'elementor-element elementor-widget elementor-widget-facebook-page';
const LOGO =
	'<svg aria-hidden="true" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path></svg>';

export default function Edit( { attributes, setAttributes } ) {
	const { url, smallHeader, showCover, showFacepile, showCta } = attributes;
	const tabs = [ 'timeline', 'events', 'messages' ].filter( ( tab ) =>
		( attributes.tabs || [] ).includes( tab )
	);
	const height = `${ Math.max(
		70,
		Math.min( 1000, Number( attributes.height ) || 500 )
	) }px`;
	const blockProps = useBlockProps(
		elementProps(
			{ ...attributes, classes: attributes.classes || CLASSES },
			'widget',
			'facebook-page.default'
		)
	);
	const toggle = ( label, key ) => (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ label }
			checked={ attributes[ key ] }
			onChange={ ( value ) => setAttributes( { [ key ]: value } ) }
		/>
	);
	const tabLabels = {
		timeline: __( 'Timeline', 'harlow' ),
		events: __( 'Events', 'harlow' ),
		messages: __( 'Messages', 'harlow' ),
	};
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Page', 'harlow' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'URL', 'harlow' ) }
						placeholder="https://www.facebook.com/your-page/"
						value={ url }
						onChange={ ( value ) =>
							setAttributes( { url: value } )
						}
					/>
					<p>{ __( 'Layout', 'harlow' ) }</p>
					{ Object.entries( tabLabels ).map( ( [ tab, label ] ) => (
						<CheckboxControl
							key={ tab }
							__nextHasNoMarginBottom
							label={ label }
							checked={ tabs.includes( tab ) }
							onChange={ ( on ) =>
								setAttributes( {
									tabs: on
										? [ ...tabs, tab ]
										: tabs.filter( ( t ) => t !== tab ),
								} )
							}
						/>
					) ) }
					{ toggle( __( 'Small Header', 'harlow' ), 'smallHeader' ) }
					{ toggle( __( 'Cover Photo', 'harlow' ), 'showCover' ) }
					{ toggle(
						__( 'Profile Photos', 'harlow' ),
						'showFacepile'
					) }
					{ toggle( __( 'Custom CTA Button', 'harlow' ), 'showCta' ) }
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Height (px)', 'harlow' ) }
						min={ 70 }
						max={ 1000 }
						value={ parseInt( height, 10 ) }
						onChange={ ( value ) =>
							setAttributes( { height: value ?? 500 } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<div className="elementor-widget-container">
					{ url.trim() ? (
						<div
							className="elementor-facebook-widget fb-page"
							data-href={ url.trim() }
							data-tabs={ tabs.join( ',' ) }
							data-height={ height }
							data-width="500px"
							data-small-header={ smallHeader ? 'true' : 'false' }
							data-hide-cover={ showCover ? 'false' : 'true' }
							data-show-facepile={
								showFacepile ? 'true' : 'false'
							}
							data-hide-cta={ showCta ? 'false' : 'true' }
							style={ { minHeight: '1px', height } }
						>
							<div className="harlow-facebook-placeholder">
								<span
									dangerouslySetInnerHTML={ { __html: LOGO } }
								/>
								<span>
									{ sprintf(
										/* translators: 1: the page's address, 2: what it shows. */
										__(
											'The Facebook page %1$s (%2$s)',
											'harlow'
										),
										url.trim(),
										tabs
											.map( ( tab ) => tabLabels[ tab ] )
											.join( ', ' ) ||
											__( 'header only', 'harlow' )
									) }
								</span>
							</div>
						</div>
					) : (
						__(
							'Facebook Page: Please enter a valid URL',
							'harlow'
						)
					) }
				</div>
			</div>
		</>
	);
}
