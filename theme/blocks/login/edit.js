/**
 * A login form in the editor: includes/sections/login.php's form, as Elementor's editor
 * shows it (also to a logged-in owner); the button's words typed in place; the labels and
 * placeholders, the sizes, alignment, the addresses after logging in and out and the links
 * in the sidebar. The form does not send from the editor.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { elementProps } from '../../editor/shared';

const CLASSES = 'elementor-element elementor-widget elementor-widget-login';
const SIZES = [
	{ value: 'xs', label: __( 'Extra Small', 'harlow' ) },
	{ value: 'sm', label: __( 'Small', 'harlow' ) },
	{ value: 'md', label: __( 'Medium', 'harlow' ) },
	{ value: 'lg', label: __( 'Large', 'harlow' ) },
	{ value: 'xl', label: __( 'Extra Large', 'harlow' ) },
];

export default function Edit( { attributes, setAttributes } ) {
	const {
		element,
		showLabels,
		userLabel,
		userPlaceholder,
		passwordLabel,
		passwordPlaceholder,
		buttonText,
		buttonAlign,
		redirectAfterLogin,
		redirectAfterLogout,
		showLostPassword,
		showRegister,
		showRememberMe,
	} = attributes;
	const align = [ 'start', 'center', 'end', 'stretch' ].includes(
		buttonAlign
	)
		? buttonAlign
		: '';
	const blockProps = useBlockProps(
		elementProps(
			{
				...attributes,
				classes: `${ attributes.classes || CLASSES }${
					align ? ` elementor-button-align-${ align }` : ''
				}`,
			},
			'widget',
			'login.default'
		)
	);
	const size = ( value ) =>
		[ 'xs', 'sm', 'md', 'lg', 'xl' ].includes( value ) ? value : 'sm';
	const text = ( label, key, help ) => (
		<TextControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			help={ help }
			value={ attributes[ key ] }
			onChange={ ( value ) => setAttributes( { [ key ]: value } ) }
		/>
	);
	const toggle = ( label, key, help ) => (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ label }
			help={ help }
			checked={ attributes[ key ] }
			onChange={ ( value ) => setAttributes( { [ key ]: value } ) }
		/>
	);
	const select = ( label, key, options ) => (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			value={ attributes[ key ] }
			options={ options }
			onChange={ ( value ) => setAttributes( { [ key ]: value } ) }
		/>
	);
	const group =
		'elementor-field-type-text elementor-field-group elementor-column elementor-col-100 elementor-field-required';
	const field = ( key, type, name, label, placeholder ) => (
		<div className={ group }>
			{ showLabels && (
				<label
					htmlFor={ `${ key }-${ element }` }
					className="elementor-field-label"
				>
					{ ( label || '' ).replace( /<[^>]*>/g, '' ) }
				</label>
			) }
			<input
				size="1"
				type={ type }
				name={ name }
				id={ `${ key }-${ element }` }
				placeholder={ ( placeholder || '' ).replace( /<[^>]*>/g, '' ) }
				className={ `elementor-field elementor-field-textual elementor-size-${ size(
					attributes.inputSize
				) }` }
				readOnly
				tabIndex={ -1 }
			/>
		</div>
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Form Fields', 'harlow' ) }>
					{ toggle( __( 'Label', 'harlow' ), 'showLabels' ) }
					{ text( __( 'Username Label', 'harlow' ), 'userLabel' ) }
					{ text(
						__( 'Username Placeholder', 'harlow' ),
						'userPlaceholder'
					) }
					{ text(
						__( 'Password Label', 'harlow' ),
						'passwordLabel'
					) }
					{ text(
						__( 'Password Placeholder', 'harlow' ),
						'passwordPlaceholder'
					) }
					{ select(
						__( 'Input Size', 'harlow' ),
						'inputSize',
						SIZES
					) }
				</PanelBody>
				<PanelBody
					title={ __( 'Button', 'harlow' ) }
					initialOpen={ false }
				>
					{ select( __( 'Size', 'harlow' ), 'buttonSize', SIZES ) }
					{ select( __( 'Alignment', 'harlow' ), 'buttonAlign', [
						{ value: '', label: __( 'Default', 'harlow' ) },
						{ value: 'start', label: __( 'Start', 'harlow' ) },
						{ value: 'center', label: __( 'Center', 'harlow' ) },
						{ value: 'end', label: __( 'End', 'harlow' ) },
						{ value: 'stretch', label: __( 'Stretch', 'harlow' ) },
					] ) }
				</PanelBody>
				<PanelBody
					title={ __( 'Additional Options', 'harlow' ) }
					initialOpen={ false }
				>
					{ toggle(
						__( 'Redirect After Login', 'harlow' ),
						'redirectAfterLogin'
					) }
					{ redirectAfterLogin &&
						text(
							__( 'Login redirect address', 'harlow' ),
							'redirectUrl',
							__(
								'A page of the site (about-us.html) or a full address.',
								'harlow'
							)
						) }
					{ toggle(
						__( 'Redirect After Logout', 'harlow' ),
						'redirectAfterLogout'
					) }
					{ redirectAfterLogout &&
						text(
							__( 'Logout redirect address', 'harlow' ),
							'redirectLogoutUrl',
							__(
								'A page of the site (about-us.html) or a full address.',
								'harlow'
							)
						) }
					{ toggle(
						__( 'Lost your password?', 'harlow' ),
						'showLostPassword'
					) }
					{ toggle(
						__( 'Register', 'harlow' ),
						'showRegister',
						__(
							'Shown only while Settings → General lets anyone register.',
							'harlow'
						)
					) }
					{ toggle(
						__( 'Remember Me', 'harlow' ),
						'showRememberMe'
					) }
					{ toggle(
						__( 'Logged in Message', 'harlow' ),
						'showLoggedInMessage'
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<div className="elementor-widget-container">
					<form
						className="elementor-login elementor-form"
						method="post"
						aria-label={ __( 'Login form', 'harlow' ) }
						onSubmit={ ( event ) => event.preventDefault() }
					>
						<div className="elementor-form-fields-wrapper">
							{ field(
								'user',
								'text',
								'log',
								userLabel,
								userPlaceholder
							) }
							{ field(
								'password',
								'password',
								'pwd',
								passwordLabel,
								passwordPlaceholder
							) }
							{ showRememberMe && (
								<div className="elementor-field-type-checkbox elementor-field-group elementor-column elementor-col-100 elementor-remember-me">
									<label htmlFor="elementor-login-remember-me">
										<input
											type="checkbox"
											id="elementor-login-remember-me"
											name="rememberme"
											value="forever"
											readOnly
											tabIndex={ -1 }
										/>
										{ __( 'Remember Me', 'harlow' ) }
									</label>
								</div>
							) }
							<div className="elementor-field-group elementor-column elementor-field-type-submit elementor-col-100">
								<button
									type="button"
									className={ `elementor-size-${ size(
										attributes.buttonSize
									) } elementor-button` }
									name="wp-submit"
								>
									<RichText
										tagName="span"
										className="elementor-button-text"
										value={ buttonText }
										onChange={ ( value ) =>
											setAttributes( {
												buttonText: value,
											} )
										}
										allowedFormats={ [] }
										placeholder={ __( 'Log In', 'harlow' ) }
									/>
								</button>
							</div>
							{ ( showLostPassword || showRegister ) && (
								<div className="elementor-field-group elementor-column elementor-col-100">
									{ showLostPassword && (
										<a
											className="elementor-lost-password"
											href="#lost-password"
											onClick={ ( event ) =>
												event.preventDefault()
											}
										>
											{ __(
												'Lost your password?',
												'harlow'
											) }
										</a>
									) }
									{ showLostPassword && showRegister && (
										<span className="elementor-login-separator">
											{ ' | ' }
										</span>
									) }
									{ showRegister && (
										<a
											className="elementor-register"
											href="#register"
											onClick={ ( event ) =>
												event.preventDefault()
											}
										>
											{ __( 'Register', 'harlow' ) }
										</a>
									) }
								</div>
							) }
						</div>
					</form>
				</div>
			</div>
		</>
	);
}
