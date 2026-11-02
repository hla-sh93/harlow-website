/**
 * The form's fields in the sidebar, as Elementor's Form Fields repeater: one panel per
 * field with the settings its kind has (label, placeholder, required, options, rows, the
 * numbers or dates it takes, the files it takes, its column on each device, its id),
 * and buttons to move, duplicate and remove fields and to add one.
 */
import {
	Button,
	Flex,
	PanelBody,
	SelectControl,
	TextControl,
	TextareaControl,
	ToggleControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

import { IconPicker } from '../../editor/shared';
import { TYPES, WIDTHS, newFieldId } from './model';

/** Which settings each kind of field has (Elementor's conditions). */
const HAS = {
	placeholder: [
		'text',
		'email',
		'textarea',
		'url',
		'tel',
		'number',
		'password',
	],
	required: [
		'text',
		'email',
		'textarea',
		'url',
		'tel',
		'radio',
		'select',
		'checkbox',
		'acceptance',
		'number',
		'date',
		'time',
		'upload',
		'password',
	],
	value: [
		'text',
		'email',
		'textarea',
		'url',
		'tel',
		'radio',
		'select',
		'checkbox',
		'number',
		'date',
		'time',
		'hidden',
	],
	options: [ 'select', 'radio', 'checkbox' ],
	width: [
		'text',
		'email',
		'textarea',
		'url',
		'tel',
		'radio',
		'select',
		'checkbox',
		'acceptance',
		'number',
		'date',
		'time',
		'upload',
		'password',
		'html',
	],
};

const TYPE_LABELS = Object.fromEntries( TYPES );

/**
 * A column width chooser.
 *
 * @param {Object}   props
 * @param {string}   props.label    What it is.
 * @param {string}   props.value    The width.
 * @param {Function} props.onChange Called with the width.
 * @param {boolean}  props.inherit  Offer "as on the larger screen".
 */
export function WidthControl( { label, value, onChange, inherit = false } ) {
	return (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			value={ value || '' }
			options={ [
				...( inherit
					? [ { value: '', label: __( 'Default', 'harlow' ) } ]
					: [] ),
				...WIDTHS.map( ( w ) => ( { value: w, label: `${ w }%` } ) ),
			] }
			onChange={ onChange }
		/>
	);
}

/**
 * One field's settings.
 *
 * @param {Object}   props
 * @param {Object}   props.field    The field as the block keeps it.
 * @param {Function} props.onChange Called with the changed settings.
 */
function FieldSettings( { field, onChange } ) {
	const type = field.type || 'text';
	const has = ( key ) => HAS[ key ].includes( type );
	const text = ( key, label, help, props = {} ) => (
		<TextControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			help={ help }
			value={ field[ key ] ?? '' }
			onChange={ ( v ) => onChange( { [ key ]: v } ) }
			{ ...props }
		/>
	);
	const toggle = ( key, label, help ) => (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ label }
			help={ help }
			checked={ !! field[ key ] }
			onChange={ ( v ) => onChange( { [ key ]: v } ) }
		/>
	);
	return (
		<>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Type', 'harlow' ) }
				value={ type }
				options={ TYPES.map( ( [ value, label ] ) => ( {
					value,
					label,
				} ) ) }
				onChange={ ( v ) => onChange( { type: v } ) }
			/>
			{ type !== 'html' &&
				text(
					'label',
					__( 'Label', 'harlow' ),
					type === 'step'
						? __( 'The step’s name in its indicator.', 'harlow' )
						: undefined
				) }
			{ has( 'placeholder' ) &&
				text( 'placeholder', __( 'Placeholder', 'harlow' ) ) }
			{ has( 'required' ) &&
				toggle( 'required', __( 'Required', 'harlow' ) ) }
			{ has( 'options' ) && (
				<TextareaControl
					__nextHasNoMarginBottom
					label={ __( 'Options', 'harlow' ) }
					help={ __(
						'One option per line. To give an option a value of its own, write label|value.',
						'harlow'
					) }
					value={ field.options || '' }
					rows={ 4 }
					onChange={ ( v ) => onChange( { options: v } ) }
				/>
			) }
			{ ( type === 'radio' || type === 'checkbox' ) &&
				toggle( 'inline', __( 'Inline List', 'harlow' ) ) }
			{ type === 'select' &&
				toggle( 'multiple', __( 'Multiple Selection', 'harlow' ) ) }
			{ type === 'select' &&
				field.multiple &&
				text( 'selectSize', __( 'Rows', 'harlow' ), undefined, {
					type: 'number',
					min: 2,
				} ) }
			{ type === 'textarea' &&
				text( 'rows', __( 'Rows', 'harlow' ), undefined, {
					type: 'number',
					min: 1,
				} ) }
			{ ( type === 'number' || type === 'date' ) && (
				<>
					{ text(
						'min',
						type === 'date'
							? __( 'Min. Date', 'harlow' )
							: __( 'Min. Value', 'harlow' ),
						undefined,
						{ type }
					) }
					{ text(
						'max',
						type === 'date'
							? __( 'Max. Date', 'harlow' )
							: __( 'Max. Value', 'harlow' ),
						undefined,
						{ type }
					) }
				</>
			) }
			{ type === 'upload' && (
				<>
					{ text(
						'fileSize',
						__( 'Max. File Size (MB)', 'harlow' ),
						__( 'Empty for the most the server takes.', 'harlow' ),
						{ type: 'number', min: 1 }
					) }
					{ text(
						'fileTypes',
						__( 'Allowed File Types', 'harlow' ),
						__(
							'Extensions separated by commas, such as pdf, docx, jpg. Empty for every type the site accepts.',
							'harlow'
						)
					) }
					{ toggle( 'multiple', __( 'Multiple Files', 'harlow' ) ) }
					{ field.multiple &&
						text( 'maxFiles', __( 'Max. Files', 'harlow' ), '', {
							type: 'number',
							min: 1,
						} ) }
					{ toggle(
						'attach',
						__( 'Attach the files to the emails', 'harlow' ),
						__(
							'Off: the emails and the submission link to the files, kept on the site. On: the emails carry the files, which are not kept.',
							'harlow'
						)
					) }
				</>
			) }
			{ type === 'acceptance' && (
				<>
					<TextareaControl
						__nextHasNoMarginBottom
						label={ __( 'Acceptance Text', 'harlow' ) }
						help={ __(
							'May hold a link: <a href="…">terms</a>.',
							'harlow'
						) }
						value={ field.acceptance || '' }
						rows={ 3 }
						onChange={ ( v ) => onChange( { acceptance: v } ) }
					/>
					{ toggle(
						'checked',
						__( 'Checked by Default', 'harlow' )
					) }
				</>
			) }
			{ type === 'html' && (
				<TextareaControl
					__nextHasNoMarginBottom
					label={ __( 'HTML', 'harlow' ) }
					value={ field.html || '' }
					rows={ 5 }
					onChange={ ( v ) => onChange( { html: v } ) }
				/>
			) }
			{ type === 'step' && (
				<>
					{ text(
						'previous',
						__( 'Previous Button', 'harlow' ),
						__( 'Empty for the form’s own words.', 'harlow' )
					) }
					{ text(
						'next',
						__( 'Next Button', 'harlow' ),
						__( 'Empty for the form’s own words.', 'harlow' )
					) }
					<p className="components-base-control__label">
						{ __( 'Icon', 'harlow' ) }
					</p>
					<IconPicker
						value={ field.icon || '' }
						allowNone
						noneLabel={ __( 'The default star', 'harlow' ) }
						onChange={ ( icon ) => onChange( { icon } ) }
					/>
				</>
			) }
			{ has( 'value' ) &&
				text(
					'value',
					__( 'Default Value', 'harlow' ),
					[ 'select', 'checkbox' ].includes( type )
						? __(
								'An option’s value; several separated by commas.',
								'harlow'
							)
						: undefined
				) }
			{ has( 'width' ) && (
				<>
					<WidthControl
						label={ __( 'Column Width', 'harlow' ) }
						value={ field.width || '100' }
						onChange={ ( width ) => onChange( { width } ) }
					/>
					<WidthControl
						label={ __( 'Column Width (tablet)', 'harlow' ) }
						value={ field.widthTablet }
						inherit
						onChange={ ( widthTablet ) =>
							onChange( { widthTablet } )
						}
					/>
					<WidthControl
						label={ __( 'Column Width (mobile)', 'harlow' ) }
						value={ field.widthMobile }
						inherit
						onChange={ ( widthMobile ) =>
							onChange( { widthMobile } )
						}
					/>
				</>
			) }
			{ text(
				'id',
				__( 'ID', 'harlow' ),
				sprintf(
					/* translators: %s: the field's shortcode. */
					__(
						'Letters, numbers and _ only, unique in the form. In emails and the redirect: %s',
						'harlow'
					),
					`[field id="${ field.id }"]`
				),
				{
					onChange: ( v ) =>
						onChange( { id: v.replace( /[^A-Za-z0-9_]/g, '' ) } ),
				}
			) }
			{ text( 'cssClasses', __( 'CSS Classes', 'harlow' ) ) }
		</>
	);
}

/**
 * Every field's panel, and the button that adds one.
 *
 * @param {Object}   props
 * @param {Object[]} props.fields   The block's fields.
 * @param {Function} props.onChange Called with the new fields.
 */
export default function FieldPanels( { fields, onChange } ) {
	const list = Array.isArray( fields ) ? fields : [];
	const update = ( index, patch ) =>
		onChange(
			list.map( ( field, i ) =>
				i === index ? { ...field, ...patch } : field
			)
		);
	const move = ( index, by ) => {
		const next = [ ...list ];
		const [ field ] = next.splice( index, 1 );
		next.splice( index + by, 0, field );
		onChange( next );
	};
	const duplicate = ( index ) => {
		const next = [ ...list ];
		next.splice( index + 1, 0, {
			...list[ index ],
			id: newFieldId( list ),
		} );
		onChange( next );
	};
	return (
		<>
			{ list.map( ( field, index ) => {
				const type = TYPE_LABELS[ field.type ] || TYPE_LABELS.text;
				const label = `${ field.label || '' }`
					.replace( /<[^>]*>/g, '' )
					.trim();
				return (
					<PanelBody
						key={ index }
						title={ label ? `${ label } (${ type })` : type }
						initialOpen={ false }
					>
						<FieldSettings
							field={ field }
							onChange={ ( patch ) => update( index, patch ) }
						/>
						<Flex justify="flex-start" wrap>
							<Button
								variant="secondary"
								size="small"
								disabled={ index === 0 }
								onClick={ () => move( index, -1 ) }
							>
								{ __( 'Move up', 'harlow' ) }
							</Button>
							<Button
								variant="secondary"
								size="small"
								disabled={ index === list.length - 1 }
								onClick={ () => move( index, 1 ) }
							>
								{ __( 'Move down', 'harlow' ) }
							</Button>
							<Button
								variant="secondary"
								size="small"
								onClick={ () => duplicate( index ) }
							>
								{ __( 'Duplicate', 'harlow' ) }
							</Button>
							<Button
								variant="secondary"
								size="small"
								isDestructive
								onClick={ () =>
									onChange(
										list.filter( ( f, i ) => i !== index )
									)
								}
							>
								{ __( 'Remove', 'harlow' ) }
							</Button>
						</Flex>
					</PanelBody>
				);
			} ) }
			<PanelBody>
				<Button
					variant="secondary"
					onClick={ () =>
						onChange( [
							...list,
							{
								id: newFieldId( list ),
								type: 'text',
								label: '',
								placeholder: '',
								required: false,
								width: '100',
							},
						] )
					}
				>
					{ __( 'Add Item', 'harlow' ) }
				</Button>
			</PanelBody>
		</>
	);
}
