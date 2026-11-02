/**
 * Facebook comments in the editor: includes/sections/facebook-comments.php's markup, with a
 * box in it saying what Facebook's SDK will draw there (the SDK runs on the page, not in
 * the editor); how many comments, their order and the address in the sidebar.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	TextControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

import { elementProps } from '../../editor/shared';

const CLASSES =
	'elementor-element elementor-widget elementor-widget-facebook-comments';
const LOGO =
	'<svg aria-hidden="true" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path></svg>';
const ORDERS = [ 'social', 'reverse_time', 'time' ];

export default function Edit( { attributes, setAttributes } ) {
	const { commentsNumber, orderBy, urlType, url, urlFormat } = attributes;
	const blockProps = useBlockProps(
		elementProps(
			{ ...attributes, classes: attributes.classes || CLASSES },
			'widget',
			'facebook-comments.default'
		)
	);
	const custom = urlType === 'custom';
	const valid = ! custom || /^https?:\/\/\S+$/i.test( ( url || '' ).trim() );
	const count = Math.max(
		5,
		Math.min( 100, Number( commentsNumber ) || 10 )
	);
	let target = __( 'this page (its plain address)', 'harlow' );
	if ( custom ) {
		target = url;
	} else if ( urlFormat === 'pretty' ) {
		target = __( 'this page’s address', 'harlow' );
	}
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Comments Box', 'harlow' ) }>
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Comment Count', 'harlow' ) }
						min={ 5 }
						max={ 100 }
						value={ count }
						onChange={ ( value ) =>
							setAttributes( { commentsNumber: value ?? 10 } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Order By', 'harlow' ) }
						value={ orderBy }
						options={ [
							{
								value: 'social',
								label: __( 'Social', 'harlow' ),
							},
							{
								value: 'reverse_time',
								label: __( 'Reverse Time', 'harlow' ),
							},
							{ value: 'time', label: __( 'Time', 'harlow' ) },
						] }
						onChange={ ( value ) =>
							setAttributes( { orderBy: value } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Target URL', 'harlow' ) }
						value={ urlType }
						options={ [
							{
								value: 'current_page',
								label: __( 'Current Page', 'harlow' ),
							},
							{
								value: 'custom',
								label: __( 'Custom', 'harlow' ),
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { urlType: value } )
						}
					/>
					{ custom ? (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Link', 'harlow' ) }
							placeholder="https://"
							value={ url }
							onChange={ ( value ) =>
								setAttributes( { url: value } )
							}
						/>
					) : (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'URL Format', 'harlow' ) }
							value={ urlFormat }
							options={ [
								{
									value: 'plain',
									label: __( 'Plain Permalink', 'harlow' ),
								},
								{
									value: 'pretty',
									label: __( 'Pretty Permalink', 'harlow' ),
								},
							] }
							onChange={ ( value ) =>
								setAttributes( { urlFormat: value } )
							}
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<div className="elementor-widget-container">
					{ valid ? (
						<div
							className="elementor-facebook-widget fb-comments"
							data-href={ custom ? url : undefined }
							data-width="100%"
							data-numposts={ count }
							data-order-by={
								ORDERS.includes( orderBy ) ? orderBy : 'social'
							}
							style={ { minHeight: '1px' } }
						>
							<div className="harlow-facebook-placeholder">
								<span
									dangerouslySetInnerHTML={ { __html: LOGO } }
								/>
								<span>
									{ sprintf(
										/* translators: 1: how many comments, 2: the address. */
										__(
											'Facebook’s comments box (%1$d comments), for %2$s',
											'harlow'
										),
										count,
										target
									) }
								</span>
							</div>
						</div>
					) : (
						__(
							'Facebook Comments: Please enter a valid URL',
							'harlow'
						)
					) }
				</div>
			</div>
		</>
	);
}
