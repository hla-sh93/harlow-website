/**
 * A form in the editor: includes/sections/form.php, the same elements (preview.js),
 * which are not typed into here. Everything is set in the sidebar, as in Elementor's
 * panel: Form Fields (the fields repeater), Buttons, Steps Settings, Actions After Submit
 * and each action's panel, Additional Options; in the Style tab, the Form group's
 * spacing for each device, beside the parts of parts.json (labels, field, buttons,
 * messages, steps).
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	Button,
	Flex,
	PanelBody,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import { elementProps, IconPicker } from '../../editor/shared';
import {
	ActionsPanel,
	CollectPanel,
	EmailPanel,
	PopupPanel,
	RedirectPanel,
	WebhookPanel,
} from './actions';
import FieldPanels, { WidthControl } from './fields';
import {
	SHAPES,
	SIZES,
	STEP_TYPES,
	formFields,
	formSteps,
	rootClasses,
} from './model';
import FormPreview from './preview';

/** The devices of the Style tab, and the editor's preview of each. */
const DEVICES = [
	[ 'desktop', 'Desktop', __( 'Desktop', 'harlow' ) ],
	[ 'tablet', 'Tablet', __( 'Tablet', 'harlow' ) ],
	[ 'mobile', 'Mobile', __( 'Mobile', 'harlow' ) ],
];

/** The alignments of the buttons. */
const ALIGNS = [
	{ value: 'start', label: __( 'Start', 'harlow' ) },
	{ value: 'center', label: __( 'Center', 'harlow' ) },
	{ value: 'end', label: __( 'End', 'harlow' ) },
	{ value: 'stretch', label: __( 'Stretch', 'harlow' ) },
];

/** The default messages, as Elementor's. */
const MESSAGES = {
	success: __( 'Your submission was successful.', 'harlow' ),
	error: __( 'Your submission failed because of an error.', 'harlow' ),
	required: __( 'This field is required.', 'harlow' ),
	invalid: __( 'There’s something wrong. The form is invalid.', 'harlow' ),
};

/**
 * The Style tab's Form group: columns gap, rows gap, label spacing and HTML field
 * spacing, for the device the editor shows (harlow_form_style_vars()).
 *
 * @param {Object}   props
 * @param {Object}   props.value    The block's formStyle attribute.
 * @param {Function} props.onChange Called with the new formStyle, or undefined.
 */
function FormStylePanel( { value, onChange } ) {
	const preview = useSelect(
		( select ) => select( 'core/editor' )?.getDeviceType?.() || 'Desktop',
		[]
	);
	const { setDeviceType } = useDispatch( 'core/editor' );
	const device =
		DEVICES.find( ( [ , shown ] ) => shown === preview )?.[ 0 ] ||
		'desktop';
	const one = value?.[ device ] || {};
	const set = ( key, v ) => {
		const next = { ...one, [ key ]: v };
		if ( v === undefined || v === '' || v === null ) {
			delete next[ key ];
		}
		const all = { ...( value || {} ), [ device ]: next };
		if ( ! Object.keys( next ).length ) {
			delete all[ device ];
		}
		onChange( Object.keys( all ).length ? all : undefined );
	};
	const range = ( key, label, max, fallback ) => (
		<RangeControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			help={
				device === 'desktop'
					? sprintf(
							/* translators: %d: the design's value in pixels. */
							__( 'In px. Empty: %d.', 'harlow' ),
							fallback
						)
					: __( 'In px. Empty: the larger screen’s value.', 'harlow' )
			}
			value={ one[ key ] ?? undefined }
			min={ 0 }
			max={ max }
			allowReset
			resetFallbackValue={ undefined }
			onChange={ ( v ) => set( key, v ) }
		/>
	);
	return (
		<PanelBody title={ __( 'Form', 'harlow' ) } initialOpen={ false }>
			<Flex justify="flex-start">
				{ DEVICES.map( ( [ key, shown, label ] ) => (
					<Button
						key={ key }
						size="small"
						variant={ key === device ? 'primary' : 'secondary' }
						onClick={ () => setDeviceType( shown ) }
					>
						{ label }
					</Button>
				) ) }
			</Flex>
			{ range( 'columnGap', __( 'Columns Gap', 'harlow' ), 60, 10 ) }
			{ range( 'rowGap', __( 'Rows Gap', 'harlow' ), 60, 10 ) }
			{ range( 'labelSpacing', __( 'Label Spacing', 'harlow' ), 60, 0 ) }
			{ range(
				'htmlSpacing',
				__( 'HTML Field Spacing', 'harlow' ),
				100,
				0
			) }
		</PanelBody>
	);
}

export default function Edit( { attributes, setAttributes } ) {
	const [ step, setStep ] = useState( 0 );
	const postId = useSelect(
		( select ) => select( 'core/editor' )?.getCurrentPostId(),
		[]
	);
	const fields = formFields( attributes.fields );
	const steps = fields.some( ( f ) => f.type === 'step' )
		? formSteps( fields )
		: [];
	const actions = Array.isArray( attributes.actions )
		? attributes.actions
		: [];
	const messages = { ...MESSAGES, ...( attributes.messages || {} ) };

	const props = elementProps( attributes, 'widget', 'form.default' );
	const blockProps = useBlockProps( {
		...props,
		className: `${ props.className || '' }${ rootClasses(
			attributes
		) }`.trim(),
	} );

	const text = ( key, label, help ) => (
		<TextControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			help={ help }
			value={ attributes[ key ] || '' }
			onChange={ ( v ) => setAttributes( { [ key ]: v } ) }
		/>
	);
	const select = ( key, label, options ) => (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			value={ attributes[ key ] || '' }
			options={ options }
			onChange={ ( v ) => setAttributes( { [ key ]: v } ) }
		/>
	);
	const toggle = ( key, label, help ) => (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ label }
			help={ help }
			checked={ !! attributes[ key ] }
			onChange={ ( v ) => setAttributes( { [ key ]: v } ) }
		/>
	);
	const sizes = SIZES.map( ( [ value, label ] ) => ( { value, label } ) );
	const inherit = [ { value: '', label: __( 'Default', 'harlow' ) } ];

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Form Fields', 'harlow' ) }>
					{ text( 'formName', __( 'Form Name', 'harlow' ) ) }
					{ select(
						'inputSize',
						__( 'Input Size', 'harlow' ),
						sizes
					) }
					{ toggle( 'showLabels', __( 'Label', 'harlow' ) ) }
					{ toggle(
						'markRequired',
						__( 'Required Mark', 'harlow' ),
						__(
							'A * after the label of a required field.',
							'harlow'
						)
					) }
					<p>
						{ __(
							'Each field has its panel below: open it to set it, move it, duplicate it or remove it.',
							'harlow'
						) }
					</p>
				</PanelBody>
				<FieldPanels
					fields={ attributes.fields }
					onChange={ ( next ) => setAttributes( { fields: next } ) }
				/>
				<PanelBody
					title={ __( 'Buttons', 'harlow' ) }
					initialOpen={ false }
				>
					{ text( 'buttonText', __( 'Text', 'harlow' ) ) }
					{ select( 'buttonSize', __( 'Size', 'harlow' ), sizes ) }
					<WidthControl
						label={ __( 'Column Width', 'harlow' ) }
						value={ attributes.buttonWidth || '100' }
						onChange={ ( buttonWidth ) =>
							setAttributes( { buttonWidth } )
						}
					/>
					<WidthControl
						label={ __( 'Column Width (tablet)', 'harlow' ) }
						value={ attributes.buttonWidthTablet }
						inherit
						onChange={ ( buttonWidthTablet ) =>
							setAttributes( { buttonWidthTablet } )
						}
					/>
					<WidthControl
						label={ __( 'Column Width (mobile)', 'harlow' ) }
						value={ attributes.buttonWidthMobile }
						inherit
						onChange={ ( buttonWidthMobile ) =>
							setAttributes( { buttonWidthMobile } )
						}
					/>
					{ select(
						'buttonAlign',
						__( 'Alignment', 'harlow' ),
						ALIGNS
					) }
					{ select(
						'buttonAlignTablet',
						__( 'Alignment (tablet)', 'harlow' ),
						[ ...inherit, ...ALIGNS ]
					) }
					{ select(
						'buttonAlignMobile',
						__( 'Alignment (mobile)', 'harlow' ),
						[ ...inherit, ...ALIGNS ]
					) }
					<p className="components-base-control__label">
						{ __( 'Icon', 'harlow' ) }
					</p>
					<IconPicker
						value={ attributes.buttonIcon }
						allowNone
						onChange={ ( buttonIcon ) =>
							setAttributes( { buttonIcon } )
						}
					/>
					{ attributes.buttonIcon &&
						select(
							'buttonIconAlign',
							__( 'Icon Position', 'harlow' ),
							[
								{
									value: 'left',
									label: __( 'Before', 'harlow' ),
								},
								{
									value: 'right',
									label: __( 'After', 'harlow' ),
								},
							]
						) }
					{ text(
						'buttonId',
						__( 'Button ID', 'harlow' ),
						__(
							'An id of its own for the button, without #. Letters, numbers, - and _.',
							'harlow'
						)
					) }
				</PanelBody>
				{ steps.length > 0 && (
					<PanelBody
						title={ __( 'Steps Settings', 'harlow' ) }
						initialOpen={ false }
					>
						{ select(
							'stepType',
							__( 'Type', 'harlow' ),
							STEP_TYPES.map( ( [ value, label ] ) => ( {
								value,
								label,
							} ) )
						) }
						{ [
							'icon',
							'icon_text',
							'number',
							'number_text',
						].includes( attributes.stepType ) &&
							select(
								'stepShape',
								__( 'Shape', 'harlow' ),
								SHAPES.map( ( [ value, label ] ) => ( {
									value,
									label,
								} ) )
							) }
						{ text(
							'stepPrevious',
							__( 'Previous Button', 'harlow' )
						) }
						{ text( 'stepNext', __( 'Next Button', 'harlow' ) ) }
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Step shown in the editor', 'harlow' ) }
							value={ `${ Math.min( step, steps.length - 1 ) }` }
							options={ steps.map( ( one, index ) => ( {
								value: `${ index }`,
								label:
									`${ index + 1 }. ` +
									( one.step?.label?.replace(
										/<[^>]*>/g,
										''
									) || __( 'Step', 'harlow' ) ),
							} ) ) }
							onChange={ ( v ) =>
								setStep( parseInt( v, 10 ) || 0 )
							}
						/>
					</PanelBody>
				) }
				<ActionsPanel
					value={ actions }
					onChange={ ( next ) => setAttributes( { actions: next } ) }
				/>
				{ actions.includes( 'email' ) && (
					<EmailPanel
						which="email"
						value={ attributes.email }
						fields={ fields }
						onChange={ ( email ) => setAttributes( { email } ) }
					/>
				) }
				{ actions.includes( 'email2' ) && (
					<EmailPanel
						which="email2"
						value={ attributes.email2 }
						fields={ fields }
						onChange={ ( email2 ) => setAttributes( { email2 } ) }
					/>
				) }
				{ actions.includes( 'redirect' ) && (
					<RedirectPanel
						value={ attributes.redirectTo }
						fields={ fields }
						onChange={ ( redirectTo ) =>
							setAttributes( { redirectTo } )
						}
					/>
				) }
				{ actions.includes( 'webhook' ) && (
					<WebhookPanel
						url={ attributes.webhookUrl }
						advanced={ attributes.webhookAdvanced }
						onChange={ setAttributes }
					/>
				) }
				{ actions.includes( 'collect' ) && <CollectPanel /> }
				{ actions.includes( 'popup' ) && (
					<PopupPanel
						action={ attributes.popupAction }
						popup={ attributes.popupId }
						onChange={ setAttributes }
					/>
				) }
				<PanelBody
					title={ __( 'Additional Options', 'harlow' ) }
					initialOpen={ false }
				>
					{ text(
						'formId',
						__( 'Form ID', 'harlow' ),
						__(
							'An id of its own for the form, without #. Letters, numbers, - and _.',
							'harlow'
						)
					) }
					{ toggle(
						'honeypot',
						__( 'Honeypot', 'harlow' ),
						__(
							'A field people never see: a form that comes back with it filled was sent by a machine, and is refused.',
							'harlow'
						)
					) }
					{ toggle(
						'customMessages',
						__( 'Custom Messages', 'harlow' )
					) }
					{ attributes.customMessages &&
						[
							[ 'success', __( 'Success Message', 'harlow' ) ],
							[ 'error', __( 'Error Message', 'harlow' ) ],
							[ 'required', __( 'Required Message', 'harlow' ) ],
							[ 'invalid', __( 'Invalid Message', 'harlow' ) ],
						].map( ( [ key, label ] ) => (
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								key={ key }
								label={ label }
								value={ messages[ key ] }
								onChange={ ( v ) =>
									setAttributes( {
										messages: { ...messages, [ key ]: v },
									} )
								}
							/>
						) ) }
				</PanelBody>
			</InspectorControls>
			<InspectorControls group="styles">
				<FormStylePanel
					value={ attributes.formStyle }
					onChange={ ( formStyle ) => setAttributes( { formStyle } ) }
				/>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<FormPreview
						attributes={ attributes }
						fields={ fields }
						step={ step }
						postId={ postId }
					/>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
