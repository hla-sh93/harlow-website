/**
 * A countdown in the editor: includes/sections/countdown.php, its boxes showing the time
 * left when the editor opened (the page's count goes on every second). A new countdown
 * ends a month from the day it is put on the page, as Elementor's does. The type, the due
 * date or the evergreen time, the boxes and labels, and what happens at the end are in the
 * sidebar.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	CheckboxControl,
	PanelBody,
	SelectControl,
	TextareaControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { elementProps, LinkFields } from '../../editor/shared';

const PARTS = [
	[ 'days', 'showDays', 'labelDays', __( 'Days', 'harlow' ) ],
	[ 'hours', 'showHours', 'labelHours', __( 'Hours', 'harlow' ) ],
	[ 'minutes', 'showMinutes', 'labelMinutes', __( 'Minutes', 'harlow' ) ],
	[ 'seconds', 'showSeconds', 'labelSeconds', __( 'Seconds', 'harlow' ) ],
];

const ACTIONS = [
	[ 'hide', __( 'Hide', 'harlow' ) ],
	[ 'redirect', __( 'Redirect', 'harlow' ) ],
	[ 'message', __( 'Show message', 'harlow' ) ],
];

/**
 * The element's classes with the labels' display, as countdown.php writes them.
 *
 * @param {Object} attributes The block's attributes.
 * @return {string} The classes.
 */
function countdownClasses( attributes ) {
	const own = ( attributes.classes || '' )
		.split( /\s+/ )
		.filter(
			( c ) => c && ! c.startsWith( 'elementor-countdown--label-' )
		);
	return [
		...[
			'elementor-element',
			'elementor-widget',
			'elementor-widget-countdown',
		].filter( ( c ) => ! own.includes( c ) ),
		...own,
		`elementor-countdown--label-${
			attributes.labelDisplay === 'inline' ? 'inline' : 'block'
		}`,
	].join( ' ' );
}

/**
 * A date as the due date is kept: Y-m-d H:i.
 *
 * @param {Date} date The date.
 * @return {string} The date written.
 */
function dueDate( date ) {
	const two = ( n ) => String( n ).padStart( 2, '0' );
	return `${ date.getFullYear() }-${ two( date.getMonth() + 1 ) }-${ two(
		date.getDate()
	) } ${ two( date.getHours() ) }:${ two( date.getMinutes() ) }`;
}

export default function Edit( { attributes, setAttributes } ) {
	const {
		countdownType,
		evergreenHours,
		evergreenMinutes,
		labelDisplay,
		showLabels,
		customLabels,
		expireActions,
		expireMessage,
		expireRedirect,
	} = attributes;
	const evergreen = countdownType === 'evergreen';

	// A new countdown ends a month from now.
	useEffect( () => {
		if ( ! attributes.dueDate ) {
			const date = new Date();
			date.setMonth( date.getMonth() + 1 );
			setAttributes( { dueDate: dueDate( date ) } );
		}
	}, [ attributes.dueDate, setAttributes ] );

	// The time left, in seconds, when the editor drew it.
	const left = useMemo( () => {
		if ( evergreen ) {
			return (
				Math.max( 0, Number( evergreenHours ) || 0 ) * 3600 +
				Math.max( 0, Number( evergreenMinutes ) || 0 ) * 60
			);
		}
		const end = new Date(
			( attributes.dueDate || '' ).replace( ' ', 'T' )
		).getTime();
		return isNaN( end ) ? 0 : Math.max( 0, ( end - Date.now() ) / 1000 );
	}, [ evergreen, evergreenHours, evergreenMinutes, attributes.dueDate ] );

	// Each box's digits, the boxes hidden passing their time to the next one down.
	const digits = {};
	let rest = Math.floor( left );
	const sizes = { days: 86400, hours: 3600, minutes: 60, seconds: 1 };
	PARTS.forEach( ( [ part, show ] ) => {
		if ( attributes[ show ] || part === 'seconds' ) {
			digits[ part ] = Math.floor( rest / sizes[ part ] );
			rest -= digits[ part ] * sizes[ part ];
		}
	} );

	const blockProps = useBlockProps(
		elementProps(
			{ ...attributes, classes: countdownClasses( attributes ) },
			'widget',
			'countdown.default'
		)
	);
	const actions = Array.isArray( expireActions ) ? expireActions : [];
	const setAction = ( action, on ) =>
		setAttributes( {
			expireActions: on
				? [ ...actions.filter( ( a ) => a !== action ), action ]
				: actions.filter( ( a ) => a !== action ),
		} );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Countdown', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Type', 'harlow' ) }
						value={ evergreen ? 'evergreen' : 'due_date' }
						options={ [
							{
								value: 'due_date',
								label: __( 'Due Date', 'harlow' ),
							},
							{
								value: 'evergreen',
								label: __( 'Evergreen Timer', 'harlow' ),
							},
						] }
						onChange={ ( v ) =>
							setAttributes( { countdownType: v } )
						}
					/>
					{ evergreen ? (
						<>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								type="number"
								min={ 0 }
								label={ __( 'Hours', 'harlow' ) }
								value={ evergreenHours }
								onChange={ ( v ) =>
									setAttributes( {
										evergreenHours: Math.max(
											0,
											parseInt( v, 10 ) || 0
										),
									} )
								}
							/>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								type="number"
								min={ 0 }
								label={ __( 'Minutes', 'harlow' ) }
								value={ evergreenMinutes }
								onChange={ ( v ) =>
									setAttributes( {
										evergreenMinutes: Math.max(
											0,
											parseInt( v, 10 ) || 0
										),
									} )
								}
							/>
						</>
					) : (
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							type="datetime-local"
							label={ __( 'Due date', 'harlow' ) }
							help={ __( 'In the site’s time zone.', 'harlow' ) }
							value={ ( attributes.dueDate || '' ).replace(
								' ',
								'T'
							) }
							onChange={ ( v ) =>
								setAttributes( {
									dueDate: ( v || '' )
										.replace( 'T', ' ' )
										.slice( 0, 16 ),
								} )
							}
						/>
					) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'View', 'harlow' ) }
						value={ labelDisplay === 'inline' ? 'inline' : 'block' }
						options={ [
							{ value: 'block', label: __( 'Block', 'harlow' ) },
							{
								value: 'inline',
								label: __( 'Inline', 'harlow' ),
							},
						] }
						onChange={ ( v ) =>
							setAttributes( { labelDisplay: v } )
						}
					/>
					{ PARTS.map( ( [ part, show, , label ] ) => (
						<ToggleControl
							key={ part }
							__nextHasNoMarginBottom
							label={ label }
							checked={ !! attributes[ show ] }
							onChange={ ( v ) =>
								setAttributes( { [ show ]: v } )
							}
						/>
					) ) }
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show label', 'harlow' ) }
						checked={ !! showLabels }
						onChange={ ( v ) => setAttributes( { showLabels: v } ) }
					/>
					{ showLabels && (
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Custom label', 'harlow' ) }
							checked={ !! customLabels }
							onChange={ ( v ) =>
								setAttributes( { customLabels: v } )
							}
						/>
					) }
					{ showLabels &&
						customLabels &&
						PARTS.map( ( [ part, show, key, label ] ) =>
							attributes[ show ] ? (
								<TextControl
									key={ part }
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ label }
									value={ attributes[ key ] }
									onChange={ ( v ) =>
										setAttributes( { [ key ]: v } )
									}
								/>
							) : null
						) }
				</PanelBody>
				<PanelBody
					title={ __( 'Actions After Expire', 'harlow' ) }
					initialOpen={ false }
				>
					{ ACTIONS.map( ( [ action, label ] ) => (
						<CheckboxControl
							key={ action }
							__nextHasNoMarginBottom
							label={ label }
							checked={ actions.includes( action ) }
							onChange={ ( on ) => setAction( action, on ) }
						/>
					) ) }
					{ actions.includes( 'message' ) && (
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Message', 'harlow' ) }
							value={ expireMessage }
							onChange={ ( v ) =>
								setAttributes( { expireMessage: v } )
							}
						/>
					) }
					{ actions.includes( 'redirect' ) && (
						<LinkFields
							value={ { link: expireRedirect } }
							onChange={ ( patch ) =>
								'link' in patch &&
								setAttributes( { expireRedirect: patch.link } )
							}
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<div className="elementor-countdown-wrapper">
						{ PARTS.map( ( [ part, show, key, label ] ) =>
							attributes[ show ] ? (
								<div
									key={ part }
									className="elementor-countdown-item"
								>
									<span
										className={ `elementor-countdown-digits elementor-countdown-${ part }` }
									>
										{ String( digits[ part ] ).padStart(
											2,
											'0'
										) }
									</span>
									{ showLabels && (
										<>
											{ ' ' }
											<span className="elementor-countdown-label">
												{ customLabels
													? attributes[ key ]
													: label }
											</span>
										</>
									) }
								</div>
							) : null
						) }
					</div>
					{ actions.includes( 'message' ) && (
						<>
							{ '\n' }
							<div
								className="elementor-countdown-expire--message"
								dangerouslySetInnerHTML={ {
									__html: expireMessage,
								} }
							/>
						</>
					) }
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
