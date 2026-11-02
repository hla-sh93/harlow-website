/**
 * The form as the page prints it (harlow_form_markup()), element for element, so the
 * canvas is styled by the same stylesheet: the steps' indicators, the fields in their
 * steps, the honeypot and the submit button. One step shows, the one picked in the
 * sidebar; nothing here can be typed into or sent.
 */
import { useCallback } from '@wordpress/element';
import { escapeHTML } from '@wordpress/escape-html';
import { __ } from '@wordpress/i18n';

import {
	CARET,
	STAR,
	formSteps,
	oneOf,
	parseOptions,
	styleVars,
	widthClasses,
} from './model';

const SIZE_KEYS = [ 'xs', 'sm', 'md', 'lg', 'xl' ];

/**
 * A field's input, by its kind (harlow_form_input()).
 *
 * @param {Object} props
 * @param {Object} props.field The field.
 * @param {string} props.size  The fields' size class.
 */
function FieldInput( { field, size } ) {
	const name = `form_fields[${ field.id }]`;
	const id = `form-field-${ field.id }`;
	const extra = field.cssClasses ? ` ${ field.cssClasses }` : '';
	const required = field.required
		? { required: true, 'aria-required': 'true' }
		: {};
	const defaults = `${ field.value || '' }`
		.split( ',' )
		.map( ( v ) => v.trim() );
	const isDefault = ( value ) =>
		field.value !== '' && defaults.includes( value );

	switch ( field.type ) {
		case 'textarea':
			return (
				<textarea
					className={ `elementor-field-textual elementor-field${ extra } ${ size }` }
					name={ name }
					id={ id }
					rows={ field.rows || 4 }
					placeholder={ field.placeholder || undefined }
					value={ field.value || '' }
					readOnly
					{ ...required }
				/>
			);

		case 'select': {
			const options = parseOptions( field.options );
			return (
				<div
					className={ `elementor-field elementor-select-wrapper remove-before${ extra }` }
				>
					{ '\n' }
					{ ! field.multiple && (
						<>
							<div
								className="select-caret-down-wrapper"
								dangerouslySetInnerHTML={ {
									__html: `\n${ CARET }\n`,
								} }
							/>
							{ '\n' }
						</>
					) }
					<select
						name={ name + ( field.multiple ? '[]' : '' ) }
						id={ id }
						className={ `elementor-field-textual ${ size }` }
						multiple={ field.multiple || undefined }
						size={
							field.multiple && field.selectSize
								? field.selectSize
								: undefined
						}
						value={
							field.multiple
								? options
										.map( ( o ) => o.value )
										.filter( isDefault )
								: ( options.find( ( o ) =>
										isDefault( o.value )
									)?.value ?? options[ 0 ]?.value )
						}
						onChange={ () => {} }
						{ ...required }
					>
						{ '\n' }
						{ options.map( ( option, i ) => (
							<option key={ i } value={ option.value }>
								{ option.label }
							</option>
						) ) }
					</select>
					{ '\n' }
				</div>
			);
		}

		case 'radio':
		case 'checkbox': {
			const options = parseOptions( field.options );
			return (
				<div
					className={ `elementor-field-subgroup${ extra }${
						field.inline ? ' elementor-subgroup-inline' : ''
					}` }
				>
					{ options.map( ( option, i ) => (
						<span key={ i } className="elementor-field-option">
							<input
								type={ field.type }
								value={ option.value }
								id={ `${ id }-${ i }` }
								name={
									name +
									( field.type === 'checkbox' &&
									options.length > 1
										? '[]'
										: '' )
								}
								checked={ isDefault( option.value ) }
								readOnly
								{ ...( field.type === 'radio'
									? required
									: {} ) }
							/>{ ' ' }
							<label htmlFor={ `${ id }-${ i }` }>
								{ option.label }
							</label>
						</span>
					) ) }
				</div>
			);
		}

		case 'acceptance':
			return (
				<div className="elementor-field-subgroup">
					{ '\n' }
					<span className="elementor-field-option">
						{ '\n' }
						<input
							type="checkbox"
							name={ name }
							id={ id }
							className={ `elementor-field ${ size }${ extra } elementor-acceptance-field` }
							checked={ !! field.checked }
							readOnly
							{ ...required }
						/>
						{ '\n' }
						{ field.acceptance !== '' && (
							// eslint-disable-next-line jsx-a11y/label-has-associated-control -- its words are the owner's markup.
							<label
								htmlFor={ id }
								dangerouslySetInnerHTML={ {
									__html: field.acceptance,
								} }
							/>
						) }
						{ '\n' }
					</span>
					{ '\n' }
				</div>
			);

		case 'upload':
			return (
				<input
					type="file"
					name={ name + ( field.multiple ? '[]' : '' ) }
					id={ id }
					className={ `elementor-field ${ size }${ extra } elementor-upload-field` }
					multiple={ field.multiple || undefined }
					{ ...required }
				/>
			);
	}

	let more = '';
	if ( field.type === 'date' ) {
		more = ' elementor-date-field';
	} else if ( field.type === 'time' ) {
		more = ' elementor-time-field';
	}
	return (
		<input
			size="1"
			type={ field.type }
			name={ name }
			id={ id }
			className={ `elementor-field ${ size }${ extra } elementor-field-textual${ more }` }
			placeholder={
				field.type !== 'hidden' && field.placeholder !== ''
					? field.placeholder
					: undefined
			}
			value={ field.value || '' }
			min={
				[ 'number', 'date' ].includes( field.type ) && field.min !== ''
					? field.min
					: undefined
			}
			max={
				[ 'number', 'date' ].includes( field.type ) && field.max !== ''
					? field.max
					: undefined
			}
			readOnly
			{ ...required }
		/>
	);
}

/**
 * A field's group: its column, label and input (harlow_form_field_markup()).
 *
 * @param {Object} props
 * @param {Object} props.field      The field.
 * @param {Object} props.attributes The block's attributes.
 * @param {string} props.size       The fields' size class.
 */
function FieldGroup( { field, attributes, size } ) {
	const group = [
		`elementor-field-type-${ field.type }`,
		'elementor-field-group',
		'elementor-column',
		`elementor-field-group-${ field.id }`,
		...widthClasses( field.width, field.widthTablet, '' ),
	];
	if (
		field.multiple &&
		( field.type === 'select' || field.type === 'upload' )
	) {
		group.push( `elementor-field-type-${ field.type }-multiple` );
	}
	if ( field.widthMobile ) {
		group.push( `elementor-sm-${ field.widthMobile }` );
	}
	if ( field.required ) {
		group.push( 'elementor-field-required' );
		if ( attributes.markRequired ) {
			group.push( 'elementor-mark-required' );
		}
	}
	if ( field.type === 'html' ) {
		return (
			<div
				className={ group.join( ' ' ) }
				dangerouslySetInnerHTML={ { __html: `\n${ field.html }\n` } }
			/>
		);
	}
	const showLabel =
		field.type !== 'hidden' && `${ field.label || '' }`.trim() !== '';
	return (
		<div className={ group.join( ' ' ) }>
			{ '\n' }
			{ showLabel && (
				<>
					{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control -- its words are the owner's markup. */ }
					<label
						htmlFor={ `form-field-${ field.id }` }
						className={ `elementor-field-label${
							attributes.showLabels
								? ''
								: ' elementor-screen-only'
						}` }
						dangerouslySetInnerHTML={ {
							__html: `\n${ field.label }\n`,
						} }
					/>
					{ '\n' }
				</>
			) }
			<FieldInput field={ field } size={ size } />
			{ '\n' }
		</div>
	);
}

/**
 * The submit button's inside (harlow_form_button_content()).
 *
 * @param {Object} props
 * @param {Object} props.attributes The block's attributes.
 */
function ButtonContent( { attributes } ) {
	const text = `${ attributes.buttonText || '' }`.trim();
	const align = oneOf(
		attributes.buttonIconAlign,
		[ 'left', 'right' ],
		'left'
	);
	const icon = attributes.buttonIcon ? (
		<span
			className={ `elementor-button-icon elementor-align-icon-${ align }` }
			dangerouslySetInnerHTML={ {
				__html: `\n${ attributes.buttonIcon }\n${
					text === ''
						? `<span class="elementor-screen-only">${ escapeHTML(
								__( 'Submit', 'harlow' )
							) }</span>\n`
						: ''
				}`,
			} }
		/>
	) : null;
	const words = text ? (
		<span className="elementor-button-text">{ text }</span>
	) : null;
	return (
		<span className="elementor-button-content-wrapper">
			{ '\n' }
			{ align === 'right' ? words : icon }
			{ words && icon ? '\n' : '' }
			{ align === 'right' ? icon : words }
			{ '\n' }
		</span>
	);
}

/**
 * The submit button and its group (harlow_form_submit_markup()).
 *
 * @param {Object}  props
 * @param {Object}  props.attributes The block's attributes.
 * @param {boolean} props.steps      Whether the form has steps.
 */
function Submit( { attributes, steps } ) {
	const size = oneOf( attributes.buttonSize, SIZE_KEYS, 'sm' );
	const group = steps
		? 'elementor-field-type-submit elementor-field-group e-form__buttons__wrapper'
		: [
				'elementor-field-group',
				'elementor-column',
				'elementor-field-type-submit',
				...widthClasses(
					attributes.buttonWidth,
					attributes.buttonWidthTablet,
					attributes.buttonWidthMobile
				),
				'e-form__buttons',
			].join( ' ' );
	const id = `${ attributes.buttonId || '' }`.replace(
		/[^A-Za-z0-9_-]/g,
		''
	);
	return (
		<div className={ group }>
			{ '\n' }
			<button
				className={ `elementor-button elementor-size-${ size }${
					steps ? ' e-form__buttons__wrapper__button' : ''
				}` }
				type="submit"
				id={ id || undefined }
			>
				{ '\n' }
				<ButtonContent attributes={ attributes } />
				{ '\n' }
			</button>
			{ '\n' }
		</div>
	);
}

/**
 * A step's Previous or Next button (harlow_form_step_button()).
 *
 * @param {Object} props
 * @param {string} props.kind  'previous' or 'next'.
 * @param {string} props.label Its words.
 * @param {string} props.size  The button's size.
 */
function StepButton( { kind, label, size } ) {
	return (
		<div
			className={ `elementor-field-type-${ kind } elementor-field-group e-form__buttons__wrapper` }
		>
			{ '\n' }
			<button
				type="button"
				className={ `elementor-button elementor-size-${ size } e-form__buttons__wrapper__button e-form__buttons__wrapper__button-${ kind }` }
			>
				{ label }
			</button>
			{ '\n' }
		</div>
	);
}

/**
 * The steps' indicators (harlow_form_indicators()).
 *
 * @param {Object}   props
 * @param {Object[]} props.steps      The form's steps.
 * @param {Object}   props.attributes The block's attributes.
 * @param {number}   props.current    The step shown.
 */
function Indicators( { steps, attributes, current } ) {
	const type = attributes.stepType || 'number_text';
	if ( type === 'none' ) {
		return null;
	}
	if ( type === 'progress_bar' ) {
		const percent = Math.round( ( ( current + 1 ) / steps.length ) * 100 );
		return (
			<div
				className={ `e-form__indicators e-form__indicators--type-${ type }` }
			>
				{ '\n' }
				<div className="e-form__indicators__indicator e-form__indicators__indicator__progress">
					{ '\n' }
					<div
						className="e-form__indicators__indicator__progress__meter"
						style={ {
							'--e-form-steps-indicator-progress-meter-width': `${ percent }%`,
						} }
					>
						{ `${ percent }%` }
					</div>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		);
	}
	const shape = ` e-form__indicators__indicator--shape-${
		attributes.stepShape || 'circle'
	}`;
	return (
		<div
			className={ `e-form__indicators e-form__indicators--type-${ type }` }
		>
			{ '\n' }
			{ steps.map( ( step, index ) => {
				let state = 'inactive';
				if ( index === current ) {
					state = 'active';
				} else if ( index < current ) {
					state = 'completed';
				}
				return [
					index > 0 && (
						<div
							key={ `s${ index }` }
							className="e-form__indicators__indicator__separator"
						/>
					),
					<div
						key={ `i${ index }` }
						className={ `e-form__indicators__indicator e-form__indicators__indicator--state-${ state }` }
					>
						{ '\n' }
						{ ( type === 'icon' || type === 'icon_text' ) && (
							<div
								className={ `e-form__indicators__indicator__icon${ shape }` }
								dangerouslySetInnerHTML={ {
									__html: `\n${ step.step?.icon || STAR }\n`,
								} }
							/>
						) }
						{ ( type === 'number' || type === 'number_text' ) && (
							<div
								className={ `e-form__indicators__indicator__number${ shape }` }
							>
								{ index + 1 }
							</div>
						) }
						{ [ 'text', 'icon_text', 'number_text' ].includes(
							type
						) && (
							<div className="e-form__indicators__indicator__label">
								{ step.step
									? step.step.label.replace( /<[^>]*>/g, '' )
									: '' }
							</div>
						) }
						{ '\n' }
					</div>,
				];
			} ) }
		</div>
	);
}

/**
 * The form, as the page prints it.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes The block's attributes.
 * @param {Object[]} props.fields     The form's fields (formFields()).
 * @param {number}   props.step       The step to show.
 * @param {number}   props.postId     The page's id.
 */
export default function FormPreview( { attributes, fields, step, postId } ) {
	const size = `elementor-size-${ oneOf(
		attributes.inputSize,
		SIZE_KEYS,
		'sm'
	) }`;
	const buttonSize = oneOf( attributes.buttonSize, SIZE_KEYS, 'sm' );
	const hasSteps = fields.some( ( f ) => f.type === 'step' );
	const steps = hasSteps ? formSteps( fields ) : [];
	const current = Math.min( step || 0, Math.max( 0, steps.length - 1 ) );
	// Nothing in the form takes a click or a key in the editor: a click selects the block.
	const inert = useCallback( ( el ) => {
		if ( el ) {
			el.setAttribute( 'inert', '' );
		}
	}, [] );
	const group = ( field ) => (
		<FieldGroup
			key={ field.id }
			field={ field }
			attributes={ attributes }
			size={ size }
		/>
	);
	const formId = `${ attributes.formId || '' }`.replace(
		/[^A-Za-z0-9_-]/g,
		''
	);

	return (
		<form
			ref={ inert }
			className="elementor-form"
			method="post"
			encType="multipart/form-data"
			id={ formId || undefined }
			name={ attributes.formName }
			aria-label={ attributes.formName }
			data-harlow-form={ attributes.element }
			style={ styleVars( attributes.formStyle ) }
			onSubmit={ ( event ) => event.preventDefault() }
		>
			{ '\n' }
			<input type="hidden" name="post_id" value={ postId || 0 } />
			<input type="hidden" name="form_id" value={ attributes.element } />
			{ '\n' }
			{ hasSteps && (
				<>
					<Indicators
						steps={ steps }
						attributes={ attributes }
						current={ current }
					/>
					{ '\n' }
				</>
			) }
			<div className="elementor-form-fields-wrapper elementor-labels-above">
				{ '\n' }
				{ ! hasSteps && fields.map( group ) }
				{ hasSteps &&
					steps.map( ( one, index ) => {
						const own = one.step;
						const last = index === steps.length - 1;
						return (
							<div
								key={ index }
								className={ `e-form__step${
									index === current ? '' : ' elementor-hidden'
								}` }
								data-label={
									own
										? own.label.replace( /<[^>]*>/g, '' )
										: ''
								}
							>
								{ '\n' }
								{ one.fields.map( group ) }
								<div
									className={ [
										'e-form__buttons',
										'elementor-column',
										...widthClasses(
											attributes.buttonWidth,
											attributes.buttonWidthTablet,
											attributes.buttonWidthMobile
										),
									].join( ' ' ) }
								>
									{ '\n' }
									{ index > 0 && (
										<StepButton
											kind="previous"
											size={ buttonSize }
											label={
												own?.previous?.trim()
													? own.previous
													: attributes.stepPrevious ||
														__(
															'Previous',
															'harlow'
														)
											}
										/>
									) }
									{ ! last && (
										<StepButton
											kind="next"
											size={ buttonSize }
											label={
												own?.next?.trim()
													? own.next
													: attributes.stepNext ||
														__( 'Next', 'harlow' )
											}
										/>
									) }
									{ last && (
										<Submit
											attributes={ attributes }
											steps
										/>
									) }
									{ '\n' }
								</div>
								{ '\n' }
							</div>
						);
					} ) }
				{ attributes.honeypot && (
					<div className="elementor-field-type-honeypot elementor-field-group elementor-column elementor-col-100">
						{ '\n' }
						<input
							size="1"
							type="text"
							name="harlow_website"
							className={ `elementor-field ${ size } elementor-field-textual` }
							tabIndex={ -1 }
							autoComplete="off"
							readOnly
						/>
						{ '\n' }
					</div>
				) }
				{ ! hasSteps && (
					<Submit attributes={ attributes } steps={ false } />
				) }
				{ '\n' }
			</div>
			{ '\n' }
		</form>
	);
}
