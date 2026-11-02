/**
 * What happens when the form is sent, in the sidebar, as Elementor's Actions After
 * Submit: the actions chosen as checkboxes, then a panel for each one chosen (Email,
 * Email 2, Redirect, Webhook, Collect Submissions, Popup). functions/widgets/form.php
 * runs them from these saved settings.
 */
import {
	CheckboxControl,
	PanelBody,
	SelectControl,
	TextControl,
	TextareaControl,
	ToggleControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/** The actions, as Elementor names them. */
export const ACTIONS = [
	[ 'email', __( 'Email', 'harlow' ) ],
	[ 'email2', __( 'Email 2', 'harlow' ) ],
	[ 'redirect', __( 'Redirect', 'harlow' ) ],
	[ 'webhook', __( 'Webhook', 'harlow' ) ],
	[ 'collect', __( 'Collect Submissions', 'harlow' ) ],
	[ 'popup', __( 'Popup', 'harlow' ) ],
];

/** The details an email may add under its message. */
const META = [
	[ 'date', __( 'Date', 'harlow' ) ],
	[ 'time', __( 'Time', 'harlow' ) ],
	[ 'page_url', __( 'Page URL', 'harlow' ) ],
	[ 'user_agent', __( 'User Agent', 'harlow' ) ],
	[ 'remote_ip', __( 'Remote IP', 'harlow' ) ],
];

/** An email's settings as Elementor starts them. */
const EMAIL = {
	to: '',
	subject: '',
	content: '[all-fields]',
	from: '',
	fromName: '',
	replyTo: '',
	cc: '',
	bcc: '',
	html: true,
	meta: [],
};

/**
 * The shortcodes of the form's fields, for the help under a field that takes them.
 *
 * @param {Object[]} fields The form's fields.
 * @return {string} The shortcodes.
 */
function shortcodes( fields ) {
	return fields
		.filter( ( f ) => ! [ 'html', 'step' ].includes( f.type ) )
		.map( ( f ) => `[field id="${ f.id }"]` )
		.join( ' ' );
}

/**
 * The checkboxes of the actions.
 *
 * @param {Object}   props
 * @param {string[]} props.value    The actions chosen.
 * @param {Function} props.onChange Called with the actions chosen.
 */
export function ActionsPanel( { value, onChange } ) {
	const chosen = Array.isArray( value ) ? value : [];
	return (
		<PanelBody title={ __( 'Actions After Submit', 'harlow' ) }>
			{ ACTIONS.map( ( [ key, label ] ) => (
				<CheckboxControl
					__nextHasNoMarginBottom
					key={ key }
					label={ label }
					checked={ chosen.includes( key ) }
					onChange={ ( on ) =>
						onChange(
							on
								? ACTIONS.map( ( [ k ] ) => k ).filter(
										( k ) =>
											k === key || chosen.includes( k )
									)
								: chosen.filter( ( k ) => k !== key )
						)
					}
				/>
			) ) }
		</PanelBody>
	);
}

/**
 * Email or Email 2.
 *
 * @param {Object}   props
 * @param {string}   props.which    'email' or 'email2'.
 * @param {Object}   props.value    The email's settings.
 * @param {Function} props.onChange Called with its settings.
 * @param {Object[]} props.fields   The form's fields.
 */
export function EmailPanel( { which, value, onChange, fields } ) {
	const mail = { ...EMAIL, ...( value || {} ) };
	const set = ( patch ) => onChange( { ...mail, ...patch } );
	const codes = shortcodes( fields );
	const text = ( key, label, help, placeholder ) => (
		<TextControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			help={ help }
			placeholder={ placeholder }
			value={ mail[ key ] || '' }
			onChange={ ( v ) => set( { [ key ]: v } ) }
		/>
	);
	const first = which === 'email';
	return (
		<PanelBody
			title={
				first ? __( 'Email', 'harlow' ) : __( 'Email 2', 'harlow' )
			}
			initialOpen={ false }
		>
			{ text(
				'to',
				__( 'To', 'harlow' ),
				first
					? __(
							'Addresses separated by commas. Empty: the site’s administration address.',
							'harlow'
						)
					: sprintf(
							/* translators: %s: the form's field shortcodes. */
							__(
								'Addresses separated by commas, or a field, such as the sender’s: %s',
								'harlow'
							),
							codes
						)
			) }
			{ text(
				'subject',
				__( 'Subject', 'harlow' ),
				__(
					'Empty: New message from "the site’s name". Fields may be named in it.',
					'harlow'
				)
			) }
			<TextareaControl
				__nextHasNoMarginBottom
				label={ __( 'Message', 'harlow' ) }
				help={ sprintf(
					/* translators: %s: the form's field shortcodes. */
					__(
						'[all-fields] is every field with its label; a field alone: %s',
						'harlow'
					),
					codes
				) }
				value={ mail.content }
				rows={ 5 }
				onChange={ ( content ) => set( { content } ) }
			/>
			{ text(
				'from',
				__( 'From Email', 'harlow' ),
				__( 'Empty: the site’s own sending address.', 'harlow' )
			) }
			{ text(
				'fromName',
				__( 'From Name', 'harlow' ),
				__( 'Empty: the site’s name.', 'harlow' )
			) }
			{ text(
				'replyTo',
				__( 'Reply-To', 'harlow' ),
				first
					? __(
							'An address or a field. Empty: the form’s first email field, so a reply goes to the sender.',
							'harlow'
						)
					: __( 'An address or a field.', 'harlow' )
			) }
			{ text( 'cc', __( 'Cc', 'harlow' ) ) }
			{ text( 'bcc', __( 'Bcc', 'harlow' ) ) }
			<p className="components-base-control__label">
				{ __( 'Meta Data', 'harlow' ) }
			</p>
			{ META.map( ( [ key, label ] ) => (
				<CheckboxControl
					__nextHasNoMarginBottom
					key={ key }
					label={ label }
					checked={ ( mail.meta || [] ).includes( key ) }
					onChange={ ( on ) =>
						set( {
							meta: on
								? META.map( ( [ k ] ) => k ).filter(
										( k ) =>
											k === key ||
											( mail.meta || [] ).includes( k )
									)
								: ( mail.meta || [] ).filter(
										( k ) => k !== key
									),
						} )
					}
				/>
			) ) }
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Send As', 'harlow' ) }
				value={ mail.html ? 'html' : 'plain' }
				options={ [
					{ value: 'html', label: __( 'HTML', 'harlow' ) },
					{ value: 'plain', label: __( 'Plain', 'harlow' ) },
				] }
				onChange={ ( v ) => set( { html: v === 'html' } ) }
			/>
		</PanelBody>
	);
}

/**
 * Redirect.
 *
 * @param {Object}   props
 * @param {string}   props.value    The address.
 * @param {Function} props.onChange Called with the address.
 * @param {Object[]} props.fields   The form's fields.
 */
export function RedirectPanel( { value, onChange, fields } ) {
	return (
		<PanelBody title={ __( 'Redirect', 'harlow' ) } initialOpen={ false }>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Redirect To', 'harlow' ) }
				help={ sprintf(
					/* translators: %s: the form's field shortcodes. */
					__(
						'An address, or a page of the site by its name (about-us.html). Fields may be named in it: %s',
						'harlow'
					),
					shortcodes( fields )
				) }
				value={ value || '' }
				onChange={ onChange }
			/>
		</PanelBody>
	);
}

/**
 * Webhook.
 *
 * @param {Object}   props
 * @param {string}   props.url      The webhook's address.
 * @param {boolean}  props.advanced Advanced Data.
 * @param {Function} props.onChange Called with the changed attributes.
 */
export function WebhookPanel( { url, advanced, onChange } ) {
	return (
		<PanelBody title={ __( 'Webhook', 'harlow' ) } initialOpen={ false }>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				type="url"
				label={ __( 'Webhook URL', 'harlow' ) }
				help={ __(
					'The fields are posted to this address when the form is sent.',
					'harlow'
				) }
				value={ url || '' }
				onChange={ ( webhookUrl ) => onChange( { webhookUrl } ) }
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Advanced Data', 'harlow' ) }
				help={ __(
					'Off: each field by its label. On: the form, every field with its id and type, and the details of the sending.',
					'harlow'
				) }
				checked={ !! advanced }
				onChange={ ( webhookAdvanced ) =>
					onChange( { webhookAdvanced } )
				}
			/>
		</PanelBody>
	);
}

/**
 * Collect Submissions: nothing to set, where they are kept.
 */
export function CollectPanel() {
	return (
		<PanelBody
			title={ __( 'Collect Submissions', 'harlow' ) }
			initialOpen={ false }
		>
			<p>
				{ __(
					'Each submission is kept in the dashboard, under Submissions: its fields, date and page, read or unread, and the list as a CSV file.',
					'harlow'
				) }
			</p>
		</PanelBody>
	);
}

/**
 * Popup.
 *
 * @param {Object}   props
 * @param {string}   props.action   'open' or 'close'.
 * @param {number}   props.popup    The popup's id.
 * @param {Function} props.onChange Called with the changed attributes.
 */
export function PopupPanel( { action, popup, onChange } ) {
	const popups = ( window.harlowEditor?.templates || [] ).filter(
		( t ) => t.kind === 'popup'
	);
	return (
		<PanelBody title={ __( 'Popup', 'harlow' ) } initialOpen={ false }>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Action', 'harlow' ) }
				value={ action || 'open' }
				options={ [
					{ value: 'open', label: __( 'Open Popup', 'harlow' ) },
					{ value: 'close', label: __( 'Close Popup', 'harlow' ) },
				] }
				onChange={ ( popupAction ) => onChange( { popupAction } ) }
			/>
			{ action === 'close' ? (
				<p>
					{ __(
						'Closes the popup the form is in, once the form is sent.',
						'harlow'
					) }
				</p>
			) : (
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Popup', 'harlow' ) }
					help={ __(
						'A popup of Appearance → Theme Builder. It opens once the form is sent, on a page where its conditions show it.',
						'harlow'
					) }
					value={ `${ popup || 0 }` }
					options={ [
						{ value: '0', label: __( '— Choose —', 'harlow' ) },
						...popups.map( ( t ) => ( {
							value: `${ t.id }`,
							label: t.title || `#${ t.id }`,
						} ) ),
						...( popup && ! popups.some( ( t ) => t.id === popup )
							? [ { value: `${ popup }`, label: `#${ popup }` } ]
							: [] ),
					] }
					onChange={ ( v ) =>
						onChange( { popupId: parseInt( v, 10 ) || 0 } )
					}
				/>
			) }
		</PanelBody>
	);
}
