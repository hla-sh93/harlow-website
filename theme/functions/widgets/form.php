<?php
/**
 * The form widget (harlow/form): Elementor Pro's form, for the forms the owner makes
 * (the site's own two forms are Contact Form 7's, functions/forms.php).
 *
 * The form's markup is built here and printed by includes/sections/form.php; the edit
 * view (blocks/form/edit.js) prints the same elements. A form is sent to the REST route
 * harlow/v1/form: assets/js/widgets/form.js sends it without leaving the page; without
 * JavaScript the browser posts it and is sent back to the page, where the answer shows.
 * The route finds the form's block in the page (the page's id and the form's element id)
 * and runs the actions saved with the block, never anything the browser says: emails,
 * the submission kept (Submissions in the dashboard), a webhook, a redirect, a popup of
 * the Theme Builder opened or closed.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** The kinds of field Elementor's form offers. */
const HARLOW_FORM_TYPES = array( 'text', 'email', 'textarea', 'url', 'tel', 'radio', 'select', 'checkbox', 'acceptance', 'number', 'date', 'time', 'upload', 'password', 'html', 'hidden', 'step' );

/** The column widths of a field and of the button, in percent. */
const HARLOW_FORM_WIDTHS = array( '100', '80', '75', '66', '60', '50', '40', '33', '25', '20' );

/** The sizes of the fields and of the button. */
const HARLOW_FORM_SIZES = array( 'xs', 'sm', 'md', 'lg', 'xl' );

/** What can happen when a form is sent. */
const HARLOW_FORM_ACTIONS = array( 'email', 'email2', 'redirect', 'webhook', 'collect', 'popup' );

/** The kinds of step indicator. */
const HARLOW_FORM_STEP_TYPES = array( 'none', 'text', 'icon', 'number', 'progress_bar', 'number_text', 'icon_text' );

/** The kinds of field a form receives nothing from. */
const HARLOW_FORM_NO_VALUE = array( 'html', 'step' );

/**
 * A step's icon when the owner chose none (Elementor's default, a star).
 */
const HARLOW_FORM_STAR = '<svg aria-hidden="true" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.53L12 17.5l-5.87 3.07 1.12-6.53L2.5 9.41l6.56-.95z"></path></svg>';

/**
 * The caret of a list (select), as Elementor draws it.
 */
const HARLOW_FORM_CARET = '<svg aria-hidden="true" class="e-font-icon-svg e-eicon-caret-down" viewBox="0 0 10 6" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h10L5 6z"></path></svg>';

/**
 * Elementor's default messages.
 *
 * @return array<string,string>
 */
function harlow_form_default_messages() {
	return array(
		'success'  => __( 'Your submission was successful.', 'harlow' ),
		'error'    => __( 'Your submission failed because of an error.', 'harlow' ),
		'required' => __( 'This field is required.', 'harlow' ),
		'invalid'  => __( 'There\'s something wrong. The form is invalid.', 'harlow' ),
	);
}

/**
 * An email action's settings as Elementor starts them.
 *
 * @param string $key 'email' or 'email2'.
 * @return array<string,mixed>
 */
function harlow_form_email_defaults( $key ) {
	return array(
		'to'       => '',
		'subject'  => '',
		'content'  => '[all-fields]',
		'from'     => '',
		'fromName' => '',
		'replyTo'  => '',
		'cc'       => '',
		'bcc'      => '',
		'html'     => true,
		'meta'     => 'email' === $key ? array( 'date', 'time', 'page_url', 'user_agent', 'remote_ip' ) : array(),
	);
}

/**
 * A word of a list, or the list's first.
 *
 * @param mixed    $value   The value.
 * @param string[] $words   The words allowed.
 * @param string   $fallback What stands when the value is none of them.
 * @return string
 */
function harlow_form_word( $value, $words, $fallback ) {
	return is_string( $value ) && in_array( $value, $words, true ) ? $value : $fallback;
}

/**
 * The block's settings, every one of a kind the markup and the sending can trust.
 *
 * @param array<string,mixed> $attributes The block's attributes (defaults filled).
 * @return array<string,mixed>
 */
function harlow_form_settings( $attributes ) {
	$s = wp_parse_args(
		is_array( $attributes ) ? $attributes : array(),
		array(
			'element'           => '',
			'classes'           => '',
			'settings'          => '',
			'htmlId'            => '',
			'formName'          => '',
			'fields'            => array(),
			'inputSize'         => 'sm',
			'showLabels'        => true,
			'markRequired'      => false,
			'buttonText'        => '',
			'buttonSize'        => 'sm',
			'buttonWidth'       => '100',
			'buttonWidthTablet' => '',
			'buttonWidthMobile' => '',
			'buttonAlign'       => 'stretch',
			'buttonAlignTablet' => '',
			'buttonAlignMobile' => '',
			'buttonIcon'        => '',
			'buttonIconAlign'   => 'left',
			'buttonId'          => '',
			'stepType'          => 'number_text',
			'stepShape'         => 'circle',
			'stepPrevious'      => '',
			'stepNext'          => '',
			'actions'           => array(),
			'email'             => array(),
			'email2'            => array(),
			'redirectTo'        => '',
			'webhookUrl'        => '',
			'webhookAdvanced'   => false,
			'popupAction'       => 'open',
			'popupId'           => 0,
			'formId'            => '',
			'customMessages'    => false,
			'messages'          => array(),
			'honeypot'          => true,
			'formStyle'         => array(),
			'style'             => array(),
		)
	);

	$s['element']    = preg_replace( '/[^a-z0-9]/', '', strtolower( (string) $s['element'] ) );
	$s['formName']   = (string) $s['formName'];
	$s['inputSize']  = harlow_form_word( $s['inputSize'], HARLOW_FORM_SIZES, 'sm' );
	$s['buttonSize'] = harlow_form_word( $s['buttonSize'], HARLOW_FORM_SIZES, 'sm' );
	foreach ( array( 'buttonWidth', 'buttonWidthTablet', 'buttonWidthMobile' ) as $key ) {
		$s[ $key ] = harlow_form_word( (string) $s[ $key ], HARLOW_FORM_WIDTHS, 'buttonWidth' === $key ? '100' : '' );
	}
	foreach ( array( 'buttonAlign', 'buttonAlignTablet', 'buttonAlignMobile' ) as $key ) {
		$s[ $key ] = harlow_form_word( $s[ $key ], array( 'start', 'center', 'end', 'stretch' ), 'buttonAlign' === $key ? 'stretch' : '' );
	}
	$s['buttonIconAlign'] = harlow_form_word( $s['buttonIconAlign'], array( 'left', 'right' ), 'left' );
	$s['stepType']        = harlow_form_word( $s['stepType'], HARLOW_FORM_STEP_TYPES, 'number_text' );
	$s['stepShape']       = harlow_form_word( $s['stepShape'], array( 'circle', 'square', 'rounded', 'none' ), 'circle' );
	$s['stepPrevious']    = '' !== trim( (string) $s['stepPrevious'] ) ? (string) $s['stepPrevious'] : __( 'Previous', 'harlow' );
	$s['stepNext']        = '' !== trim( (string) $s['stepNext'] ) ? (string) $s['stepNext'] : __( 'Next', 'harlow' );
	$s['actions']         = array_values( array_intersect( HARLOW_FORM_ACTIONS, is_array( $s['actions'] ) ? $s['actions'] : array() ) );
	$s['email']           = wp_parse_args( is_array( $s['email'] ) ? $s['email'] : array(), harlow_form_email_defaults( 'email' ) );
	$s['email2']          = wp_parse_args( is_array( $s['email2'] ) ? $s['email2'] : array(), harlow_form_email_defaults( 'email2' ) );
	$s['popupAction']     = harlow_form_word( $s['popupAction'], array( 'open', 'close' ), 'open' );
	$s['popupId']         = absint( $s['popupId'] );
	$s['showLabels']      = ! empty( $s['showLabels'] );
	$s['markRequired']    = ! empty( $s['markRequired'] );
	$s['honeypot']        = ! empty( $s['honeypot'] );
	$s['webhookAdvanced'] = ! empty( $s['webhookAdvanced'] );
	$s['customMessages']  = ! empty( $s['customMessages'] );
	$s['formStyle']       = is_array( $s['formStyle'] ) ? $s['formStyle'] : array();
	return $s;
}

/**
 * The messages the form shows: Elementor's, or the owner's own where Custom messages is on.
 *
 * @param array<string,mixed> $settings The form's settings.
 * @return array<string,string>
 */
function harlow_form_messages( $settings ) {
	$messages = harlow_form_default_messages();
	if ( $settings['customMessages'] && is_array( $settings['messages'] ) ) {
		foreach ( array_keys( $messages ) as $key ) {
			if ( isset( $settings['messages'][ $key ] ) && '' !== trim( (string) $settings['messages'][ $key ] ) ) {
				$messages[ $key ] = (string) $settings['messages'][ $key ];
			}
		}
	}
	return $messages;
}

/**
 * One field of the form, every setting of a kind the markup can trust.
 *
 * @param mixed $raw   The field as the block keeps it.
 * @param int   $index Its place in the form.
 * @return array<string,mixed>
 */
function harlow_form_field( $raw, $index ) {
	$field = wp_parse_args(
		is_array( $raw ) ? $raw : array(),
		array(
			'id'          => '',
			'type'        => 'text',
			'label'       => '',
			'placeholder' => '',
			'required'    => false,
			'value'       => '',
			'options'     => '',
			'inline'      => false,
			'multiple'    => false,
			'selectSize'  => 0,
			'rows'        => 4,
			'min'         => '',
			'max'         => '',
			'fileTypes'   => '',
			'fileSize'    => 0,
			'maxFiles'    => 0,
			'attach'      => false,
			'acceptance'  => '',
			'checked'     => false,
			'html'        => '',
			'previous'    => '',
			'next'        => '',
			'icon'        => '',
			'width'       => '100',
			'widthTablet' => '',
			'widthMobile' => '',
			'cssClasses'  => '',
		)
	);

	$field['type'] = harlow_form_word( $field['type'], HARLOW_FORM_TYPES, 'text' );
	$field['id']   = preg_replace( '/[^A-Za-z0-9_]/', '', (string) $field['id'] );
	if ( '' === $field['id'] ) {
		$field['id'] = 'field_' . ( $index + 1 );
	}
	foreach ( array( 'width', 'widthTablet', 'widthMobile' ) as $key ) {
		$field[ $key ] = harlow_form_word( (string) $field[ $key ], HARLOW_FORM_WIDTHS, 'width' === $key ? '100' : '' );
	}
	foreach ( array( 'label', 'placeholder', 'value', 'options', 'min', 'max', 'fileTypes', 'acceptance', 'html', 'previous', 'next', 'icon', 'cssClasses' ) as $key ) {
		$field[ $key ] = is_scalar( $field[ $key ] ) ? (string) $field[ $key ] : '';
	}
	$field['required']   = ! empty( $field['required'] ) && ! in_array( $field['type'], array( 'html', 'hidden', 'step' ), true );
	$field['inline']     = ! empty( $field['inline'] );
	$field['multiple']   = ! empty( $field['multiple'] );
	$field['attach']     = ! empty( $field['attach'] );
	$field['checked']    = ! empty( $field['checked'] );
	$field['rows']       = max( 1, min( 50, absint( $field['rows'] ) ) );
	$field['selectSize'] = min( 50, absint( $field['selectSize'] ) );
	$field['fileSize']   = min( 1024, absint( $field['fileSize'] ) );
	$field['maxFiles']   = min( 100, absint( $field['maxFiles'] ) );
	$field['cssClasses'] = implode( ' ', array_filter( array_map( 'sanitize_html_class', preg_split( '/\s+/', $field['cssClasses'] ) ) ) );
	return $field;
}

/**
 * The form's fields, each with an id of its own.
 *
 * @param array<string,mixed> $settings The form's settings.
 * @return array<int,array<string,mixed>>
 */
function harlow_form_fields( $settings ) {
	$fields = array();
	$seen   = array();
	foreach ( array_values( is_array( $settings['fields'] ) ? $settings['fields'] : array() ) as $index => $raw ) {
		$field = harlow_form_field( $raw, $index );
		while ( isset( $seen[ $field['id'] ] ) ) {
			$field['id'] .= '_' . ( $index + 1 );
		}
		$seen[ $field['id'] ] = true;
		$fields[]             = $field;
	}
	return $fields;
}

/**
 * The options of a list, radio buttons or checkboxes: one per line, `label|value` or a
 * label that is its own value.
 *
 * @param string $text The options as typed.
 * @return array<int,array{label:string,value:string}>
 */
function harlow_form_options( $text ) {
	$options = array();
	foreach ( preg_split( '/\r\n|\r|\n/', (string) $text ) as $line ) {
		if ( '' === trim( $line ) ) {
			continue;
		}
		$parts     = explode( '|', $line, 2 );
		$options[] = array(
			'label' => trim( $parts[0] ),
			'value' => isset( $parts[1] ) ? trim( $parts[1] ) : trim( $parts[0] ),
		);
	}
	return $options;
}

/**
 * Attributes as HTML, each value escaped: null and false leave the attribute out.
 *
 * @param array<string,mixed> $attrs Attribute names and values.
 * @return string Attributes, each with its leading space.
 */
function harlow_form_attrs( $attrs ) {
	$out = '';
	foreach ( $attrs as $name => $value ) {
		if ( null === $value || false === $value ) {
			continue;
		}
		$out .= ' ' . $name . '="' . esc_attr( (string) $value ) . '"';
	}
	return $out;
}

/**
 * The form's spacing chosen per device in the Style tab's Form group (columns gap, rows
 * gap, label spacing, HTML field spacing), as the form's own custom properties; the
 * widget's stylesheet reads them for each device.
 *
 * @param array<string,mixed> $form_style The block's formStyle attribute.
 * @return string The style attribute's value, or ''.
 */
function harlow_form_style_vars( $form_style ) {
	$names = array(
		'columnGap'    => 'column-gap',
		'rowGap'       => 'row-gap',
		'labelSpacing' => 'label-spacing',
		'htmlSpacing'  => 'html-spacing',
	);
	$css   = '';
	foreach ( array( 'desktop', 'tablet', 'mobile' ) as $device ) {
		if ( empty( $form_style[ $device ] ) || ! is_array( $form_style[ $device ] ) ) {
			continue;
		}
		foreach ( $names as $key => $name ) {
			$value = isset( $form_style[ $device ][ $key ] ) ? $form_style[ $device ][ $key ] : '';
			if ( '' === $value || null === $value || ! is_numeric( $value ) || (float) $value < 0 ) {
				continue;
			}
			$css .= '--harlow-form-' . $name . ( 'desktop' === $device ? '' : '-' . $device ) . ':' . min( 500, (float) $value ) . 'px;';
		}
	}
	return $css;
}

/**
 * The classes the widget's element adds to Elementor's: the button's alignment, per
 * device, as Elementor's prefix classes.
 *
 * @param array<string,mixed> $settings The form's settings.
 * @return string Classes, each with its leading space.
 */
function harlow_form_root_classes( $settings ) {
	$out = ' elementor-button-align-' . $settings['buttonAlign'];
	if ( '' !== $settings['buttonAlignTablet'] ) {
		$out .= ' elementor-tablet-button-align-' . $settings['buttonAlignTablet'];
	}
	if ( '' !== $settings['buttonAlignMobile'] ) {
		$out .= ' elementor-mobile-button-align-' . $settings['buttonAlignMobile'];
	}
	return $out;
}

/**
 * A column's width classes (Elementor's: elementor-col-, -md- for tablets, -sm- for phones).
 *
 * @param string $width  The width.
 * @param string $tablet The width on tablets, or ''.
 * @param string $mobile The width on phones, or ''.
 * @return string[]
 */
function harlow_form_width_classes( $width, $tablet, $mobile ) {
	$classes = array( 'elementor-col-' . $width );
	if ( '' !== $tablet ) {
		$classes[] = 'elementor-md-' . $tablet;
	}
	if ( '' !== $mobile ) {
		$classes[] = 'elementor-sm-' . $mobile;
	}
	return $classes;
}

/**
 * The input of a field (what Elementor prints after the label), by the field's kind.
 *
 * @param array<string,mixed> $field    The field.
 * @param array<string,mixed> $settings The form's settings.
 * @return string
 */
function harlow_form_input( $field, $settings ) {
	$type     = $field['type'];
	$name     = 'form_fields[' . $field['id'] . ']';
	$id       = 'form-field-' . $field['id'];
	$size     = 'elementor-size-' . $settings['inputSize'];
	$required = $field['required'] ? array(
		'required'      => 'required',
		'aria-required' => 'true',
	) : array();
	$extra    = '' !== $field['cssClasses'] ? ' ' . $field['cssClasses'] : '';

	switch ( $type ) {
		case 'html':
			return do_shortcode( wp_kses_post( $field['html'] ) );

		case 'textarea':
			return '<textarea' . harlow_form_attrs(
				array_merge(
					array(
						'class'       => 'elementor-field-textual elementor-field' . $extra . ' ' . $size,
						'name'        => $name,
						'id'          => $id,
						'rows'        => $field['rows'],
						'placeholder' => '' !== $field['placeholder'] ? $field['placeholder'] : null,
					),
					$required
				)
			) . '>' . esc_textarea( $field['value'] ) . '</textarea>';

		case 'select':
			$defaults = array_map( 'trim', explode( ',', $field['value'] ) );
			$options  = '';
			foreach ( harlow_form_options( $field['options'] ) as $option ) {
				$options .= '<option' . harlow_form_attrs(
					array(
						'value'    => $option['value'],
						'selected' => '' !== $field['value'] && in_array( $option['value'], $defaults, true ) ? 'selected' : null,
					)
				) . '>' . esc_html( $option['label'] ) . '</option>' . "\n";
			}
			$select = '<select' . harlow_form_attrs(
				array_merge(
					array(
						'name'     => $name . ( $field['multiple'] ? '[]' : '' ),
						'id'       => $id,
						'class'    => 'elementor-field-textual ' . $size,
						'multiple' => $field['multiple'] ? 'multiple' : null,
						'size'     => $field['multiple'] && $field['selectSize'] ? $field['selectSize'] : null,
					),
					$required
				)
			) . '>' . "\n" . $options . '</select>';
			$caret  = $field['multiple'] ? '' : '<div class="select-caret-down-wrapper">' . "\n" . HARLOW_FORM_CARET . "\n" . '</div>' . "\n";
			return '<div class="elementor-field elementor-select-wrapper remove-before' . $extra . '">' . "\n" . $caret . $select . "\n" . '</div>';

		case 'radio':
		case 'checkbox':
			$options  = harlow_form_options( $field['options'] );
			$defaults = array_map( 'trim', explode( ',', $field['value'] ) );
			$html     = '<div class="elementor-field-subgroup' . $extra . ( $field['inline'] ? ' elementor-subgroup-inline' : '' ) . '">';
			foreach ( $options as $key => $option ) {
				$option_id = $id . '-' . $key;
				$html     .= '<span class="elementor-field-option"><input' . harlow_form_attrs(
					array_merge(
						array(
							'type'    => $type,
							'value'   => $option['value'],
							'id'      => $option_id,
							'name'    => $name . ( 'checkbox' === $type && count( $options ) > 1 ? '[]' : '' ),
							'checked' => '' !== $field['value'] && in_array( $option['value'], $defaults, true ) ? 'checked' : null,
						),
						'radio' === $type ? $required : array()
					)
				) . '> <label for="' . esc_attr( $option_id ) . '">' . esc_html( $option['label'] ) . '</label></span>';
			}
			return $html . '</div>';

		case 'acceptance':
			$label = '' !== $field['acceptance'] ? '<label for="' . esc_attr( $id ) . '">' . wp_kses_post( $field['acceptance'] ) . '</label>' : '';
			return '<div class="elementor-field-subgroup">' . "\n" . '<span class="elementor-field-option">' . "\n" . '<input' . harlow_form_attrs(
				array_merge(
					array(
						'type'    => 'checkbox',
						'name'    => $name,
						'id'      => $id,
						'class'   => 'elementor-field ' . $size . $extra . ' elementor-acceptance-field',
						'checked' => $field['checked'] ? 'checked' : null,
					),
					$required
				)
			) . '>' . "\n" . $label . "\n" . '</span>' . "\n" . '</div>';

		case 'upload':
			$types = harlow_form_file_types( $field );
			return '<input' . harlow_form_attrs(
				array_merge(
					array(
						'type'                 => 'file',
						'name'                 => $name . ( $field['multiple'] ? '[]' : '' ),
						'id'                   => $id,
						'class'                => 'elementor-field ' . $size . $extra . ' elementor-upload-field',
						'multiple'             => $field['multiple'] ? 'multiple' : null,
						'accept'               => $types ? '.' . implode( ',.', $types ) : null,
						'data-maxsize'         => $field['fileSize'] ? $field['fileSize'] : null,
						'data-maxsize-message' => $field['fileSize'] ? __( 'This file exceeds the maximum allowed size.', 'harlow' ) : null,
						'data-maxfiles'        => $field['multiple'] && $field['maxFiles'] ? $field['maxFiles'] : null,
					),
					$required
				)
			) . '>';
	}

	// The fields typed into: text, email, URL, telephone, number, date, time, password, hidden.
	$attrs = array(
		'size'        => '1',
		'type'        => $type,
		'name'        => $name,
		'id'          => $id,
		'class'       => 'elementor-field ' . $size . $extra . ' elementor-field-textual' . ( 'date' === $type ? ' elementor-date-field' : '' ) . ( 'time' === $type ? ' elementor-time-field' : '' ),
		'placeholder' => 'hidden' !== $type && '' !== $field['placeholder'] ? $field['placeholder'] : null,
		'value'       => '' !== $field['value'] ? $field['value'] : null,
	);
	if ( 'number' === $type || 'date' === $type ) {
		$attrs['min'] = '' !== $field['min'] ? $field['min'] : null;
		$attrs['max'] = '' !== $field['max'] ? $field['max'] : null;
	}
	if ( 'tel' === $type ) {
		$attrs['pattern'] = '[0-9\(\)#&\+\*=\.\s\-]+';
		$attrs['title']   = __( 'Only numbers and phone characters (#, -, *, etc) are accepted.', 'harlow' );
	}
	if ( 'date' === $type ) {
		$attrs['pattern'] = '[0-9]{4}-[0-9]{2}-[0-9]{2}';
	}
	if ( 'time' === $type ) {
		$attrs['pattern'] = '[0-9]{2}:[0-9]{2}';
	}
	return '<input' . harlow_form_attrs( array_merge( $attrs, $required ) ) . '>';
}

/**
 * A field as Elementor prints it: its group (column), label and input, and the error the
 * last sending found in it (without JavaScript).
 *
 * @param array<string,mixed> $field    The field.
 * @param array<string,mixed> $settings The form's settings.
 * @param string              $error    The field's error from the last sending, or ''.
 * @return string
 */
function harlow_form_field_markup( $field, $settings, $error = '' ) {
	$type  = $field['type'];
	$group = array_merge(
		array( 'elementor-field-type-' . $type, 'elementor-field-group', 'elementor-column', 'elementor-field-group-' . $field['id'] ),
		harlow_form_width_classes( $field['width'], $field['widthTablet'], '' )
	);
	if ( $field['multiple'] && ( 'select' === $type || 'upload' === $type ) ) {
		$group[] = 'elementor-field-type-' . $type . '-multiple';
	}
	if ( '' !== $field['widthMobile'] ) {
		$group[] = 'elementor-sm-' . $field['widthMobile'];
	}
	if ( $field['required'] ) {
		$group[] = 'elementor-field-required';
		if ( $settings['markRequired'] ) {
			$group[] = 'elementor-mark-required';
		}
	}
	if ( '' !== $error ) {
		$group[] = 'elementor-error';
	}

	$html = '<div class="' . esc_attr( implode( ' ', $group ) ) . '">' . "\n";
	if ( ! in_array( $type, array( 'hidden', 'html' ), true ) && '' !== trim( $field['label'] ) ) {
		$html .= '<label for="form-field-' . esc_attr( $field['id'] ) . '" class="elementor-field-label' . ( $settings['showLabels'] ? '' : ' elementor-screen-only' ) . '">' . "\n"
			. wp_kses_post( $field['label'] ) . "\n"
			. '</label>' . "\n";
	}
	$html .= harlow_form_input( $field, $settings ) . "\n";
	if ( '' !== $error ) {
		$html .= '<span class="elementor-message elementor-message-danger elementor-help-inline elementor-form-help-inline" role="alert">' . esc_html( $error ) . '</span>' . "\n";
	}
	return $html . '</div>';
}

/**
 * The submit button's inside: its icon (before or after the words) and its words.
 *
 * @param array<string,mixed> $settings The form's settings.
 * @return string
 */
function harlow_form_button_content( $settings ) {
	$text  = trim( (string) $settings['buttonText'] );
	$parts = array();
	if ( '' !== $text ) {
		$parts[] = '<span class="elementor-button-text">' . esc_html( $text ) . '</span>';
	}
	if ( '' !== $settings['buttonIcon'] ) {
		$icon = '<span class="elementor-button-icon elementor-align-icon-' . $settings['buttonIconAlign'] . '">' . "\n"
			. harlow_icon( $settings['buttonIcon'] ) . "\n"
			. ( '' === $text ? '<span class="elementor-screen-only">' . esc_html__( 'Submit', 'harlow' ) . '</span>' . "\n" : '' )
			. '</span>';
		if ( 'right' === $settings['buttonIconAlign'] ) {
			$parts[] = $icon;
		} else {
			array_unshift( $parts, $icon );
		}
	}
	return '<span class="elementor-button-content-wrapper">' . "\n" . implode( "\n", $parts ) . "\n" . '</span>';
}

/**
 * The submit button and its group. In a form of steps, the group is one of the last
 * step's buttons.
 *
 * @param array<string,mixed> $settings The form's settings.
 * @param bool                $steps    Whether the form has steps.
 * @return string
 */
function harlow_form_submit_markup( $settings, $steps ) {
	if ( $steps ) {
		$group  = 'elementor-field-type-submit elementor-field-group e-form__buttons__wrapper';
		$button = 'elementor-button elementor-size-' . $settings['buttonSize'] . ' e-form__buttons__wrapper__button';
	} else {
		$group  = implode( ' ', array_merge( array( 'elementor-field-group', 'elementor-column', 'elementor-field-type-submit' ), harlow_form_width_classes( $settings['buttonWidth'], $settings['buttonWidthTablet'], $settings['buttonWidthMobile'] ) ) ) . ' e-form__buttons';
		$button = 'elementor-button elementor-size-' . $settings['buttonSize'];
	}
	$id = sanitize_html_class( (string) $settings['buttonId'] );
	return '<div class="' . esc_attr( $group ) . '">' . "\n"
		. '<button' . harlow_form_attrs(
			array(
				'class' => $button,
				'type'  => 'submit',
				'id'    => '' !== $id ? $id : null,
			)
		) . '>' . "\n"
		. harlow_form_button_content( $settings ) . "\n"
		. '</button>' . "\n"
		. '</div>';
}

/**
 * A step's Previous or Next button.
 *
 * @param string              $kind     'previous' or 'next'.
 * @param string              $label    Its words.
 * @param array<string,mixed> $settings The form's settings.
 * @return string
 */
function harlow_form_step_button( $kind, $label, $settings ) {
	return '<div class="elementor-field-type-' . $kind . ' elementor-field-group e-form__buttons__wrapper">' . "\n"
		. '<button type="button" class="elementor-button elementor-size-' . esc_attr( $settings['buttonSize'] ) . ' e-form__buttons__wrapper__button e-form__buttons__wrapper__button-' . $kind . '">' . esc_html( $label ) . '</button>' . "\n"
		. '</div>';
}

/**
 * The form's steps: the fields between one Step field and the next. Fields before the
 * first Step field belong to the first step.
 *
 * @param array<int,array<string,mixed>> $fields The form's fields.
 * @return array<int,array{step:array<string,mixed>|null,fields:array<int,array<string,mixed>>}>
 */
function harlow_form_steps( $fields ) {
	$steps = array();
	foreach ( $fields as $field ) {
		if ( 'step' === $field['type'] ) {
			if ( 1 === count( $steps ) && null === $steps[0]['step'] ) {
				$steps[0]['step'] = $field;
			} else {
				$steps[] = array(
					'step'   => $field,
					'fields' => array(),
				);
			}
			continue;
		}
		if ( ! $steps ) {
			$steps[] = array(
				'step'   => null,
				'fields' => array(),
			);
		}
		$steps[ count( $steps ) - 1 ]['fields'][] = $field;
	}
	return $steps;
}

/**
 * The steps' indicators, as Elementor's script draws them: a label, an icon or a number for
 * each step with a divider between them, or one progress bar.
 *
 * @param array<int,array<string,mixed>> $steps    The form's steps.
 * @param array<string,mixed>            $settings The form's settings.
 * @param int                            $current  The step shown.
 * @return string
 */
function harlow_form_indicators( $steps, $settings, $current = 0 ) {
	$type = $settings['stepType'];
	if ( 'none' === $type ) {
		return '';
	}
	$html = '<div class="e-form__indicators e-form__indicators--type-' . $type . '">' . "\n";
	if ( 'progress_bar' === $type ) {
		$percent = (int) round( ( $current + 1 ) / count( $steps ) * 100 );
		return $html . '<div class="e-form__indicators__indicator e-form__indicators__indicator__progress">' . "\n"
			. '<div class="e-form__indicators__indicator__progress__meter" style="--e-form-steps-indicator-progress-meter-width: ' . $percent . '%;">' . $percent . '%</div>' . "\n"
			. '</div>' . "\n"
			. '</div>';
	}
	$shape = ' e-form__indicators__indicator--shape-' . $settings['stepShape'];
	foreach ( $steps as $index => $step ) {
		if ( $index > 0 ) {
			$html .= '<div class="e-form__indicators__indicator__separator"></div>' . "\n";
		}
		$state = 'inactive';
		if ( $index === $current ) {
			$state = 'active';
		} elseif ( $index < $current ) {
			$state = 'completed';
		}
		$html .= '<div class="e-form__indicators__indicator e-form__indicators__indicator--state-' . $state . '">' . "\n";
		if ( 'icon' === $type || 'icon_text' === $type ) {
			$icon  = $step['step'] && '' !== $step['step']['icon'] ? harlow_icon( $step['step']['icon'] ) : HARLOW_FORM_STAR;
			$html .= '<div class="e-form__indicators__indicator__icon' . $shape . '">' . "\n" . $icon . "\n" . '</div>' . "\n";
		}
		if ( 'number' === $type || 'number_text' === $type ) {
			$html .= '<div class="e-form__indicators__indicator__number' . $shape . '">' . ( $index + 1 ) . '</div>' . "\n";
		}
		if ( 'text' === $type || 'icon_text' === $type || 'number_text' === $type ) {
			$html .= '<div class="e-form__indicators__indicator__label">' . esc_html( $step['step'] ? wp_strip_all_tags( $step['step']['label'] ) : '' ) . '</div>' . "\n";
		}
		$html .= '</div>' . "\n";
	}
	return $html . '</div>';
}

/**
 * The answer of the last sending of this form, kept for the visitor sent back to the page
 * without JavaScript.
 *
 * @param string $element The form's element id.
 * @return array<string,mixed>|null
 */
function harlow_form_result( $element ) {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- only shows the answer kept for this sending; changes nothing.
	$token = isset( $_GET['harlow-form-result'] ) ? sanitize_key( wp_unslash( $_GET['harlow-form-result'] ) ) : '';
	if ( '' === $token ) {
		return null;
	}
	$result = get_transient( 'harlow_form_result_' . $token );
	return is_array( $result ) && isset( $result['form'] ) && $result['form'] === $element ? $result : null;
}

/**
 * The form as Elementor prints it: the hidden fields Elementor posts, the steps'
 * indicators, the fields (in their steps), the honeypot and the submit button.
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @return string
 */
function harlow_form_markup( $attributes ) {
	static $noscript = false;

	$settings = harlow_form_settings( $attributes );
	$messages = harlow_form_messages( $settings );
	$fields   = harlow_form_fields( $settings );
	$element  = $settings['element'];
	$result   = harlow_form_result( $element );
	$errors   = $result && ! empty( $result['errors'] ) && is_array( $result['errors'] ) ? $result['errors'] : array();
	$post_id  = (int) get_the_ID();
	$queried  = (int) get_queried_object_id();
	$has_step = (bool) array_filter(
		$fields,
		function ( $field ) {
			return 'step' === $field['type'];
		}
	);

	$field_html = function ( $field ) use ( $settings, $errors ) {
		$error = isset( $errors[ $field['id'] ] ) ? (string) $errors[ $field['id'] ] : '';
		return harlow_form_field_markup( $field, $settings, $error ) . "\n";
	};

	$inner = '';
	if ( ! $has_step ) {
		foreach ( $fields as $field ) {
			$inner .= $field_html( $field );
		}
	} else {
		$steps = harlow_form_steps( $fields );
		$last  = count( $steps ) - 1;
		foreach ( $steps as $index => $step ) {
			$own     = $step['step'];
			$buttons = '';
			if ( $index > 0 ) {
				$buttons .= harlow_form_step_button( 'previous', $own && '' !== trim( $own['previous'] ) ? $own['previous'] : $settings['stepPrevious'], $settings ) . "\n";
			}
			$buttons .= $index < $last
				? harlow_form_step_button( 'next', $own && '' !== trim( $own['next'] ) ? $own['next'] : $settings['stepNext'], $settings ) . "\n"
				: harlow_form_submit_markup( $settings, true ) . "\n";
			$inner   .= '<div class="e-form__step' . ( $index > 0 ? ' elementor-hidden' : '' ) . '"' . harlow_form_attrs( array( 'data-label' => $own ? wp_strip_all_tags( $own['label'] ) : '' ) ) . '>' . "\n";
			foreach ( $step['fields'] as $field ) {
				$inner .= $field_html( $field );
			}
			$inner .= '<div class="' . esc_attr( implode( ' ', array_merge( array( 'e-form__buttons', 'elementor-column' ), harlow_form_width_classes( $settings['buttonWidth'], $settings['buttonWidthTablet'], $settings['buttonWidthMobile'] ) ) ) ) . '">' . "\n"
				. $buttons
				. '</div>' . "\n"
				. '</div>' . "\n";
		}
	}
	if ( $settings['honeypot'] ) {
		$inner .= '<div class="elementor-field-type-honeypot elementor-field-group elementor-column elementor-col-100">' . "\n"
			. '<input size="1" type="text" name="harlow_website" id="form-field-harlow-website-' . esc_attr( $element ) . '" class="elementor-field elementor-size-' . esc_attr( $settings['inputSize'] ) . ' elementor-field-textual" tabindex="-1" autocomplete="off">' . "\n"
			. '</div>' . "\n";
	}
	if ( ! $has_step ) {
		$inner .= harlow_form_submit_markup( $settings, false ) . "\n";
	}

	$form_id = sanitize_html_class( (string) $settings['formId'] );
	$vars    = harlow_form_style_vars( $settings['formStyle'] );
	$hidden  = '<input type="hidden" name="post_id" value="' . esc_attr( (string) $post_id ) . '"/>'
		. '<input type="hidden" name="form_id" value="' . esc_attr( $element ) . '"/>'
		. '<input type="hidden" name="referer_title" value="' . esc_attr( wp_strip_all_tags( (string) get_the_title( $queried ? $queried : $post_id ) ) ) . '" />'
		. '<input type="hidden" name="queried_id" value="' . esc_attr( (string) ( $queried ? $queried : $post_id ) ) . '"/>'
		. '<input type="hidden" name="harlow_form_nonce" value="' . esc_attr( wp_create_nonce( 'harlow_form_' . $element ) ) . '"/>';
	// A logged-in visitor's request keeps its session (the REST API's own nonce).
	if ( is_user_logged_in() ) {
		$hidden .= '<input type="hidden" name="_wpnonce" value="' . esc_attr( wp_create_nonce( 'wp_rest' ) ) . '"/>';
	}

	$message = '';
	if ( $result && isset( $result['message'] ) ) {
		$message = '<div class="elementor-message elementor-message-' . ( empty( $result['success'] ) ? 'danger' : 'success' ) . '" role="alert">' . esc_html( (string) $result['message'] ) . '</div>' . "\n";
	}

	// Without JavaScript every step shows, with the submit button at the end.
	$before = '';
	if ( $has_step && ! $noscript ) {
		$noscript = true;
		$before   = '<noscript><style>.elementor-widget-form .e-form__step.elementor-hidden{display:flex}.elementor-widget-form .e-form__indicators,.elementor-widget-form .e-form__buttons__wrapper:not(.elementor-field-type-submit){display:none}</style></noscript>' . "\n";
	}

	return $before . '<form' . harlow_form_attrs(
		array(
			'class'                 => 'elementor-form',
			'method'                => 'post',
			'action'                => rest_url( 'harlow/v1/form' ),
			'enctype'               => 'multipart/form-data',
			'id'                    => '' !== $form_id ? $form_id : null,
			'name'                  => $settings['formName'],
			'aria-label'            => $settings['formName'],
			'data-harlow-form'      => $element,
			'data-required-message' => $messages['required'],
			'data-error-message'    => $messages['error'],
			'style'                 => '' !== $vars ? $vars : null,
		)
	) . '>' . "\n"
		. $hidden . "\n"
		. ( $has_step ? harlow_form_indicators( harlow_form_steps( $fields ), $settings ) . "\n" : '' )
		. '<div class="elementor-form-fields-wrapper elementor-labels-above">' . "\n"
		. $inner
		. '</div>' . "\n"
		. $message
		. '</form>';
}

/*
 * Sending.
 */

/**
 * The REST route a form is sent to.
 */
function harlow_form_rest_routes() {
	register_rest_route(
		'harlow/v1',
		'/form',
		array(
			'methods'             => 'POST',
			'callback'            => 'harlow_form_submit',
			// Anyone may send a form; the form's own nonce is checked in the callback.
			'permission_callback' => '__return_true',
			'args'                => array(
				'post_id' => array(
					'type'     => 'integer',
					'required' => true,
				),
				'form_id' => array(
					'type'     => 'string',
					'required' => true,
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'harlow_form_rest_routes' );

/**
 * The block of a form, found in the page it was sent from (its own blocks, the synced
 * patterns it shows and, for an item's page, its item page templates), with every
 * attribute's default filled as WordPress fills them when it prints the block.
 *
 * @param int    $post_id The page's id.
 * @param string $element The form's element id.
 * @return array<string,mixed>|null The block's attributes.
 */
function harlow_form_find( $post_id, $element ) {
	$found = get_post( $post_id );
	if ( ! $found || '' === $element ) {
		return null;
	}
	if ( ! is_post_publicly_viewable( $found ) && ! current_user_can( 'read_post', $found->ID ) ) {
		return null;
	}
	$content = (string) $found->post_content;
	if ( 'page' !== $found->post_type && function_exists( 'harlow_single_templates' ) && function_exists( 'harlow_single_template_blocks' ) ) {
		foreach ( array_keys( harlow_single_templates() ) as $template ) {
			$content .= harlow_single_template_blocks( $template );
		}
	}
	$block = harlow_form_find_in( parse_blocks( $content ), $element, 0 );
	$type  = WP_Block_Type_Registry::get_instance()->get_registered( 'harlow/form' );
	if ( ! $block || ! $type ) {
		return null;
	}
	return $type->prepare_attributes_for_render( is_array( $block['attrs'] ) ? $block['attrs'] : array() );
}

/**
 * Look for a form's block among blocks, inside other blocks and synced patterns.
 *
 * @param array<int,array<string,mixed>> $blocks  Parsed blocks.
 * @param string                         $element The form's element id.
 * @param int                            $depth   How deep in synced patterns.
 * @return array<string,mixed>|null
 */
function harlow_form_find_in( $blocks, $element, $depth ) {
	foreach ( $blocks as $block ) {
		if ( 'harlow/form' === $block['blockName'] && isset( $block['attrs']['element'] ) && $element === $block['attrs']['element'] ) {
			return $block;
		}
		if ( 'core/block' === $block['blockName'] && ! empty( $block['attrs']['ref'] ) && $depth < 5 ) {
			$pattern = get_post( (int) $block['attrs']['ref'] );
			if ( $pattern && 'wp_block' === $pattern->post_type && 'publish' === $pattern->post_status ) {
				$inside = harlow_form_find_in( parse_blocks( $pattern->post_content ), $element, $depth + 1 );
				if ( $inside ) {
					return $inside;
				}
			}
		}
		if ( ! empty( $block['innerBlocks'] ) ) {
			$inside = harlow_form_find_in( $block['innerBlocks'], $element, $depth );
			if ( $inside ) {
				return $inside;
			}
		}
	}
	return null;
}

/**
 * The visitor's address, for the rate limit and the Remote IP of the emails.
 *
 * @return string
 */
function harlow_form_client_ip() {
	$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	/**
	 * The visitor's address, for a site behind a proxy that hands it on in a header it trusts.
	 *
	 * @param string $ip The address the connection came from.
	 */
	$ip = (string) apply_filters( 'harlow_form_client_ip', $ip );
	return filter_var( $ip, FILTER_VALIDATE_IP ) ? $ip : '';
}

/**
 * Has this address sent too many forms lately? Counts this sending.
 *
 * @return bool
 */
function harlow_form_rate_limited() {
	$ip = harlow_form_client_ip();
	if ( '' === $ip ) {
		return false;
	}
	/**
	 * How many forms one address may send in ten minutes.
	 *
	 * @param int $limit The number of sendings.
	 */
	$limit  = (int) apply_filters( 'harlow_form_rate_limit', 10 );
	$key    = 'harlow_form_rate_' . md5( $ip );
	$window = 10 * MINUTE_IN_SECONDS;
	$now    = time();
	$seen   = get_transient( $key );
	$seen   = is_array( $seen ) && isset( $seen['count'], $seen['start'] ) && $now - (int) $seen['start'] < $window ? $seen : array(
		'count' => 0,
		'start' => $now,
	);
	if ( $limit > 0 && (int) $seen['count'] >= $limit ) {
		return true;
	}
	++$seen['count'];
	set_transient( $key, $seen, max( 1, (int) $seen['start'] + $window - $now ) );
	return false;
}

/**
 * The files sent with the form, per field: each a file as PHP describes an upload.
 *
 * @param WP_REST_Request $request The request.
 * @return array<string,array<int,array<string,mixed>>>
 */
function harlow_form_files( $request ) {
	$all   = $request->get_file_params();
	$files = isset( $all['form_fields'] ) && is_array( $all['form_fields'] ) ? $all['form_fields'] : array();
	$out   = array();
	if ( empty( $files['name'] ) || ! is_array( $files['name'] ) ) {
		return $out;
	}
	foreach ( $files['name'] as $id => $names ) {
		foreach ( (array) $names as $index => $name ) {
			$one = array();
			foreach ( array( 'name', 'type', 'tmp_name', 'error', 'size' ) as $key ) {
				$value       = isset( $files[ $key ][ $id ] ) ? $files[ $key ][ $id ] : '';
				$one[ $key ] = is_array( $value ) ? ( isset( $value[ $index ] ) ? $value[ $index ] : '' ) : $value;
			}
			if ( UPLOAD_ERR_NO_FILE === (int) $one['error'] || '' === (string) $one['name'] ) {
				continue;
			}
			$one['name']           = sanitize_file_name( (string) $one['name'] );
			$out[ (string) $id ][] = $one;
		}
	}
	return $out;
}

/**
 * The file types an upload field takes: the owner's list, kept to the types WordPress
 * lets anyone upload; every type WordPress allows when the owner listed none.
 *
 * @param array<string,mixed> $field The field.
 * @return string[] Extensions.
 */
function harlow_form_file_types( $field ) {
	$allowed = array();
	foreach ( array_keys( get_allowed_mime_types() ) as $pattern ) {
		foreach ( explode( '|', $pattern ) as $ext ) {
			$allowed[] = strtolower( $ext );
		}
	}
	$wanted = array_filter( array_map( 'trim', explode( ',', strtolower( str_replace( array( '.', ' ' ), array( '', ',' ), $field['fileTypes'] ) ) ) ) );
	return $wanted ? array_values( array_intersect( array_unique( $wanted ), $allowed ) ) : array();
}

/**
 * Check the values sent against the form's fields, on the server: required fields, emails,
 * addresses, phone numbers, numbers, dates, times, the options offered, the files.
 *
 * @param WP_REST_Request                $request  The request.
 * @param array<int,array<string,mixed>> $fields   The form's fields.
 * @param array<string,string>           $messages The form's messages.
 * @return array{0:array<int,array<string,mixed>>,1:array<string,string>,2:array<string,array<int,array<string,mixed>>>} The record, the errors, the files.
 */
function harlow_form_validate( $request, $fields, $messages ) {
	$posted  = $request->get_param( 'form_fields' );
	$posted  = is_array( $posted ) ? $posted : array();
	$files   = harlow_form_files( $request );
	$record  = array();
	$errors  = array();
	$uploads = array();

	foreach ( $fields as $field ) {
		$type = $field['type'];
		$id   = $field['id'];
		if ( in_array( $type, HARLOW_FORM_NO_VALUE, true ) ) {
			continue;
		}
		$entry = array(
			'id'    => $id,
			'type'  => $type,
			'title' => '' !== trim( wp_strip_all_tags( $field['label'] ) ) ? trim( wp_strip_all_tags( $field['label'] ) ) : $id,
			'value' => '',
			'raw'   => '',
		);

		if ( 'upload' === $type ) {
			$sent  = isset( $files[ $id ] ) ? $files[ $id ] : array();
			$error = harlow_form_check_files( $field, $sent, $messages );
			if ( '' !== $error ) {
				$errors[ $id ] = $error;
			}
			$uploads[ $id ] = $sent;
			$record[]       = $entry;
			continue;
		}

		$raw = isset( $posted[ $id ] ) ? $posted[ $id ] : '';
		if ( is_array( $raw ) ) {
			$raw = array_values( array_filter( array_map( 'sanitize_text_field', array_map( 'strval', array_filter( $raw, 'is_scalar' ) ) ), 'strlen' ) );
		} elseif ( 'textarea' === $type ) {
			$raw = sanitize_textarea_field( (string) $raw );
		} else {
			$raw = sanitize_text_field( (string) $raw );
		}
		$empty = is_array( $raw ) ? ! $raw : '' === trim( $raw );
		if ( $empty ) {
			if ( $field['required'] ) {
				$errors[ $id ] = $messages['required'];
			}
			$record[] = $entry;
			continue;
		}

		$error = '';
		$value = $raw;
		switch ( $type ) {
			case 'email':
				// Refused as typed, never quietly cleaned: a line break would carry a mail header.
				$value = trim( (string) $raw );
				if ( preg_match( '/[\r\n]/', $value ) || ! is_email( $value ) ) {
					$error = __( 'Invalid email address.', 'harlow' );
				}
				break;
			case 'url':
				$scheme = strtolower( (string) wp_parse_url( (string) $raw, PHP_URL_SCHEME ) );
				if ( ! filter_var( $raw, FILTER_VALIDATE_URL ) || ! in_array( $scheme, array( 'http', 'https' ), true ) ) {
					$error = __( 'This URL is invalid.', 'harlow' );
				} else {
					$value = esc_url_raw( (string) $raw );
				}
				break;
			case 'tel':
				if ( ! preg_match( '/^[0-9()#&+*=.\s-]+$/', (string) $raw ) ) {
					$error = __( 'The field accepts only numbers and phone characters (#, -, *, etc).', 'harlow' );
				}
				break;
			case 'number':
				if ( ! is_numeric( $raw ) ) {
					$error = __( 'The field accepts only numbers.', 'harlow' );
				} elseif ( '' !== $field['min'] && is_numeric( $field['min'] ) && (float) $raw < (float) $field['min'] ) {
					/* translators: %s: the smallest number the field takes. */
					$error = sprintf( __( 'The field value must be greater than or equal to %s.', 'harlow' ), $field['min'] );
				} elseif ( '' !== $field['max'] && is_numeric( $field['max'] ) && (float) $raw > (float) $field['max'] ) {
					/* translators: %s: the largest number the field takes. */
					$error = sprintf( __( 'The field value must be less than or equal to %s.', 'harlow' ), $field['max'] );
				}
				break;
			case 'date':
				$parts = explode( '-', (string) $raw );
				if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', (string) $raw ) || ! checkdate( (int) $parts[1], (int) $parts[2], (int) $parts[0] ) ) {
					$error = __( 'The date is invalid.', 'harlow' );
				} elseif ( '' !== $field['min'] && $raw < $field['min'] ) {
					/* translators: %s: the first date the field takes. */
					$error = sprintf( __( 'The date must be %s or later.', 'harlow' ), $field['min'] );
				} elseif ( '' !== $field['max'] && $raw > $field['max'] ) {
					/* translators: %s: the last date the field takes. */
					$error = sprintf( __( 'The date must be %s or earlier.', 'harlow' ), $field['max'] );
				}
				break;
			case 'time':
				if ( ! preg_match( '/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/', (string) $raw ) ) {
					$error = __( 'The time is invalid.', 'harlow' );
				}
				break;
			case 'select':
			case 'radio':
			case 'checkbox':
				$offered = wp_list_pluck( harlow_form_options( $field['options'] ), 'value' );
				$chosen  = (array) $raw;
				if ( ( 'radio' === $type || ( 'select' === $type && ! $field['multiple'] ) ) && count( $chosen ) > 1 ) {
					$error = $messages['invalid'];
				}
				foreach ( $chosen as $one ) {
					if ( ! in_array( $one, $offered, true ) ) {
						$error = $messages['invalid'];
					}
				}
				break;
			case 'acceptance':
				$value = 'on';
				break;
			default:
				// Text, password, hidden, textarea: kept to a sensible length.
				$value = is_string( $raw ) ? mb_substr( $raw, 0, 'textarea' === $type ? 20000 : 2000 ) : $raw;
		}
		if ( '' !== $error ) {
			$errors[ $id ] = $error;
		}
		$entry['raw']   = $value;
		$entry['value'] = is_array( $value ) ? implode( ', ', $value ) : (string) $value;
		$record[]       = $entry;
	}
	return array( $record, $errors, $uploads );
}

/**
 * Check an upload field's files: how many, their sizes and types.
 *
 * @param array<string,mixed>            $field    The field.
 * @param array<int,array<string,mixed>> $sent     Its files.
 * @param array<string,string>           $messages The form's messages.
 * @return string The error, or ''.
 */
function harlow_form_check_files( $field, $sent, $messages ) {
	if ( ! $sent ) {
		return $field['required'] ? $messages['required'] : '';
	}
	$most = $field['multiple'] ? ( $field['maxFiles'] ? $field['maxFiles'] : 10 ) : 1;
	if ( count( $sent ) > $most ) {
		/* translators: %d: how many files the field takes. */
		return sprintf( _n( 'You can upload only %d file.', 'You can upload only %d files.', $most, 'harlow' ), $most );
	}
	$limit = $field['fileSize'] ? $field['fileSize'] * MB_IN_BYTES : wp_max_upload_size();
	$types = harlow_form_file_types( $field );
	foreach ( $sent as $file ) {
		if ( UPLOAD_ERR_OK !== (int) $file['error'] ) {
			return UPLOAD_ERR_INI_SIZE === (int) $file['error'] || UPLOAD_ERR_FORM_SIZE === (int) $file['error']
				? __( 'This file exceeds the maximum allowed size.', 'harlow' )
				: __( 'There was an error while trying to upload your file.', 'harlow' );
		}
		if ( (int) $file['size'] > $limit ) {
			return __( 'This file exceeds the maximum allowed size.', 'harlow' );
		}
		$check = wp_check_filetype_and_ext( (string) $file['tmp_name'], (string) $file['name'] );
		if ( empty( $check['ext'] ) || empty( $check['type'] ) || ( $types && ! in_array( strtolower( $check['ext'] ), $types, true ) ) ) {
			return __( 'This file type is not allowed.', 'harlow' );
		}
	}
	return '';
}

/**
 * The folder the forms' files go to (uploads/harlow-forms), not listed by the web server
 * and running nothing.
 *
 * @param array<string,mixed> $dirs WordPress's upload folder.
 * @return array<string,mixed>
 */
function harlow_form_upload_dir( $dirs ) {
	$dirs['subdir'] = '/harlow-forms';
	$dirs['path']   = $dirs['basedir'] . '/harlow-forms';
	$dirs['url']    = $dirs['baseurl'] . '/harlow-forms';
	return $dirs;
}

/**
 * A file's name in the forms' folder: a random part first, so no address can be guessed.
 *
 * @param string $dir  The folder.
 * @param string $name The file's name.
 * @param string $ext  Its extension.
 * @return string
 */
function harlow_form_unique_name( $dir, $name, $ext ) {
	unset( $ext );
	return wp_unique_filename( $dir, strtolower( wp_generate_password( 12, false ) ) . '-' . $name );
}

/**
 * Keep the files sent with the form in uploads/harlow-forms.
 *
 * @param array<string,array<int,array<string,mixed>>> $uploads The files, per field.
 * @param array<int,array<string,mixed>>               $fields  The form's fields.
 * @return array<string,array<int,array{file:string,url:string,name:string}>>|WP_Error The files kept, per field.
 */
function harlow_form_store_files( $uploads, $fields ) {
	$kept = array();
	if ( ! array_filter( $uploads ) ) {
		return $kept;
	}
	require_once ABSPATH . 'wp-admin/includes/file.php';
	$base = wp_upload_dir();
	$dir  = $base['basedir'] . '/harlow-forms';
	if ( ! wp_mkdir_p( $dir ) ) {
		return new WP_Error( 'harlow_form_folder', 'The forms folder cannot be made.' );
	}
	if ( ! file_exists( $dir . '/index.php' ) ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- two small files of the theme's own, in its own folder.
		file_put_contents( $dir . '/index.php', "<?php\n// Silence is golden.\n" );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- as above.
		file_put_contents( $dir . '/.htaccess', "Options -Indexes\n<FilesMatch \"\\.(php|phtml|phar|php\\d)$\">\nRequire all denied\n</FilesMatch>\n" );
	}
	$by_id = array();
	foreach ( $fields as $field ) {
		$by_id[ $field['id'] ] = $field;
	}
	add_filter( 'upload_dir', 'harlow_form_upload_dir' );
	foreach ( $uploads as $id => $files ) {
		$types = isset( $by_id[ $id ] ) ? harlow_form_file_types( $by_id[ $id ] ) : array();
		$mimes = array();
		foreach ( get_allowed_mime_types() as $pattern => $mime ) {
			if ( ! $types || array_intersect( explode( '|', $pattern ), $types ) ) {
				$mimes[ $pattern ] = $mime;
			}
		}
		foreach ( $files as $file ) {
			$name  = (string) $file['name'];
			$moved = wp_handle_upload(
				$file,
				array(
					'test_form'                => false,
					'mimes'                    => $mimes,
					'unique_filename_callback' => 'harlow_form_unique_name',
				)
			);
			if ( empty( $moved['file'] ) ) {
				remove_filter( 'upload_dir', 'harlow_form_upload_dir' );
				return new WP_Error( 'harlow_form_upload', isset( $moved['error'] ) ? (string) $moved['error'] : 'The file was not kept.', array( 'field' => $id ) );
			}
			$kept[ $id ][] = array(
				'file' => $moved['file'],
				'url'  => $moved['url'],
				'name' => $name,
			);
		}
	}
	remove_filter( 'upload_dir', 'harlow_form_upload_dir' );
	return $kept;
}

/**
 * A text with `[field id="…"]` replaced by the fields' values, and, in an email's message,
 * `[all-fields]` by every field: one pass, so nothing a visitor typed is read as a
 * shortcode.
 *
 * @param string                         $text   The text.
 * @param array<int,array<string,mixed>> $record The values sent.
 * @param string                         $mode   'html' (values escaped, lines as <br>), 'plain' or 'url' (values encoded).
 * @return string
 */
function harlow_form_shortcodes( $text, $record, $mode ) {
	$values = array();
	foreach ( $record as $entry ) {
		$values[ $entry['id'] ] = $entry;
	}
	$format = function ( $entry ) use ( $mode ) {
		$value = (string) $entry['value'];
		if ( 'url' === $mode ) {
			return rawurlencode( $value );
		}
		if ( 'html' === $mode ) {
			return 'upload' === $entry['type'] ? harlow_form_links( $entry ) : nl2br( esc_html( $value ), false );
		}
		return $value;
	};
	return (string) preg_replace_callback(
		'/\[all-fields\]|\[field\s+id=(?:"|&quot;|\'|&#039;|&#8221;|&#8243;)?([A-Za-z0-9_]+)(?:"|&quot;|\'|&#039;|&#8221;|&#8243;)?\s*\]/',
		function ( $m ) use ( $values, $format, $mode ) {
			if ( '[all-fields]' === $m[0] ) {
				$line = 'html' === $mode ? '<br>' : "\n";
				$all  = '';
				foreach ( $values as $entry ) {
					$all .= ( 'html' === $mode ? esc_html( $entry['title'] ) : $entry['title'] ) . ': ' . $format( $entry ) . $line;
				}
				return $all;
			}
			return isset( $values[ $m[1] ] ) ? $format( $values[ $m[1] ] ) : '';
		},
		(string) $text
	);
}

/**
 * An upload field's files as links (an HTML email).
 *
 * @param array<string,mixed> $entry The field's value.
 * @return string
 */
function harlow_form_links( $entry ) {
	$links = array();
	foreach ( array_filter( array_map( 'trim', explode( ' , ', (string) $entry['value'] ) ) ) as $url ) {
		$links[] = '<a href="' . esc_url( $url ) . '">' . esc_html( $url ) . '</a>';
	}
	return implode( ', ', $links );
}

/**
 * Words for an email header: no tags, no line breaks.
 *
 * @param string $text The words.
 * @return string
 */
function harlow_form_header_text( $text ) {
	return trim( str_replace( array( '<', '>', '"' ), '', wp_strip_all_tags( (string) $text, true ) ) );
}

/**
 * The email addresses of a list (commas, semicolons or spaces between them), each a valid
 * address.
 *
 * @param string $text The list.
 * @return string[]
 */
function harlow_form_addresses( $text ) {
	$out = array();
	foreach ( preg_split( '/[\s,;]+/', wp_strip_all_tags( (string) $text, true ) ) as $one ) {
		$one = sanitize_email( $one );
		if ( '' !== $one && is_email( $one ) ) {
			$out[] = $one;
		}
	}
	return array_values( array_unique( $out ) );
}

/**
 * The details of the sending an email may add (Elementor's metadata).
 *
 * @param array<string,mixed> $context The sending's page, address and browser.
 * @return array<string,array{0:string,1:string}>
 */
function harlow_form_meta( $context ) {
	return array(
		'date'       => array( __( 'Date', 'harlow' ), wp_date( (string) get_option( 'date_format' ) ) ),
		'time'       => array( __( 'Time', 'harlow' ), wp_date( (string) get_option( 'time_format' ) ) ),
		'page_url'   => array( __( 'Page URL', 'harlow' ), $context['page_url'] ),
		'user_agent' => array( __( 'User Agent', 'harlow' ), $context['user_agent'] ),
		'remote_ip'  => array( __( 'Remote IP', 'harlow' ), $context['ip'] ),
	);
}

/**
 * Send one of the form's emails (Email or Email 2).
 *
 * @param string                         $key         'email' or 'email2'.
 * @param array<string,mixed>            $settings    The form's settings.
 * @param array<int,array<string,mixed>> $record      The values sent.
 * @param array<string,mixed>            $context     The sending's page, address and browser.
 * @param string[]                       $attachments Files to attach.
 * @return bool Whether it was sent (true when Email 2 has no one to go to).
 */
function harlow_form_send_email( $key, $settings, $record, $context, $attachments ) {
	$mail = $settings[ $key ];
	$site = wp_specialchars_decode( (string) get_option( 'blogname' ), ENT_QUOTES );
	$html = ! empty( $mail['html'] );

	$to = '' !== trim( (string) $mail['to'] ) ? harlow_form_shortcodes( (string) $mail['to'], $record, 'plain' ) : ( 'email' === $key ? (string) get_option( 'admin_email' ) : '' );
	$to = harlow_form_addresses( $to );
	if ( ! $to ) {
		return 'email2' === $key;
	}

	/* translators: %s: the site's name. */
	$subject = '' !== trim( (string) $mail['subject'] ) ? harlow_form_shortcodes( (string) $mail['subject'], $record, 'plain' ) : sprintf( __( 'New message from "%s"', 'harlow' ), $site );
	$subject = trim( wp_strip_all_tags( $subject, true ) );

	$template = '' !== trim( (string) $mail['content'] ) ? (string) $mail['content'] : '[all-fields]';
	$line     = $html ? '<br>' : "\n";
	$body     = harlow_form_shortcodes( $html ? nl2br( $template, false ) : $template, $record, $html ? 'html' : 'plain' );
	$meta     = array_intersect_key( harlow_form_meta( $context ), array_flip( is_array( $mail['meta'] ) ? $mail['meta'] : array() ) );
	if ( $meta ) {
		$body .= $line . '---' . $line . $line;
		foreach ( $meta as $item ) {
			$body .= ( $html ? esc_html( $item[0] . ': ' . $item[1] ) : $item[0] . ': ' . $item[1] ) . $line;
		}
	}

	$headers = array( 'Content-Type: ' . ( $html ? 'text/html' : 'text/plain' ) . '; charset=UTF-8' );
	$from    = harlow_form_addresses( harlow_form_shortcodes( (string) $mail['from'], $record, 'plain' ) );
	$name    = harlow_form_header_text( '' !== trim( (string) $mail['fromName'] ) ? harlow_form_shortcodes( (string) $mail['fromName'], $record, 'plain' ) : $site );
	if ( $from ) {
		$headers[] = 'From: ' . ( '' !== $name ? $name . ' ' : '' ) . '<' . $from[0] . '>';
	}
	// Email answers the sender (the form's first email field) unless the owner chose otherwise.
	$reply = '' !== trim( (string) $mail['replyTo'] ) ? harlow_form_shortcodes( (string) $mail['replyTo'], $record, 'plain' ) : '';
	if ( '' === $reply && 'email' === $key ) {
		foreach ( $record as $entry ) {
			if ( 'email' === $entry['type'] && '' !== $entry['value'] ) {
				$reply = (string) $entry['value'];
				break;
			}
		}
	}
	$reply = harlow_form_addresses( $reply );
	if ( $reply ) {
		$headers[] = 'Reply-To: ' . $reply[0];
	}
	foreach ( array(
		'cc'  => 'Cc',
		'bcc' => 'Bcc',
	) as $field => $header ) {
		foreach ( harlow_form_addresses( harlow_form_shortcodes( (string) $mail[ $field ], $record, 'plain' ) ) as $address ) {
			$headers[] = $header . ': ' . $address;
		}
	}

	// The sender's name when no address is given: WordPress's own address, under that name.
	$name_filter = function () use ( $name ) {
		return $name;
	};
	if ( ! $from && '' !== $name ) {
		add_filter( 'wp_mail_from_name', $name_filter );
	}
	$sent = wp_mail( $to, $subject, $body, $headers, $attachments );
	remove_filter( 'wp_mail_from_name', $name_filter );
	return (bool) $sent;
}

/**
 * Keep the submission (Collect Submissions): a private post of its own, in Submissions.
 *
 * @param array<string,mixed>            $settings The form's settings.
 * @param array<int,array<string,mixed>> $record   The values sent.
 * @param array<string,mixed>            $context  The sending's page, address and browser.
 * @return int The submission's id, 0 when it was not kept.
 */
function harlow_form_collect( $settings, $record, $context ) {
	$main = '';
	foreach ( $record as $entry ) {
		if ( 'email' === $entry['type'] && '' !== $entry['value'] ) {
			$main = $entry['value'];
			break;
		}
	}
	if ( '' === $main ) {
		foreach ( $record as $entry ) {
			if ( '' !== $entry['value'] && 'password' !== $entry['type'] ) {
				$main = $entry['value'];
				break;
			}
		}
	}
	$name = '' !== trim( $settings['formName'] ) ? $settings['formName'] : __( 'Form', 'harlow' );
	$id   = wp_insert_post(
		array(
			'post_type'    => 'harlow_submission',
			'post_status'  => 'publish',
			'post_title'   => wp_strip_all_tags( $name . ( '' !== $main ? ': ' . mb_substr( $main, 0, 80 ) : '' ) ),
			'post_content' => '',
			'post_author'  => 0,
		)
	);
	if ( ! $id || is_wp_error( $id ) ) {
		return 0;
	}
	$fields = array();
	foreach ( $record as $entry ) {
		$fields[] = array(
			'id'    => $entry['id'],
			'type'  => $entry['type'],
			'title' => $entry['title'],
			'value' => $entry['value'],
		);
	}
	update_post_meta( $id, '_harlow_form_fields', $fields );
	update_post_meta( $id, '_harlow_form_name', $name );
	update_post_meta( $id, '_harlow_form_element', $settings['element'] );
	update_post_meta( $id, '_harlow_form_post', (int) $context['post_id'] );
	update_post_meta( $id, '_harlow_form_page_url', $context['page_url'] );
	update_post_meta( $id, '_harlow_form_ip', $context['ip'] );
	update_post_meta( $id, '_harlow_form_user_agent', $context['user_agent'] );
	update_post_meta( $id, '_harlow_read', '0' );

	$names = get_option( 'harlow_form_names', array() );
	$names = is_array( $names ) ? $names : array();
	if ( ! in_array( $name, $names, true ) ) {
		$names[] = $name;
		update_option( 'harlow_form_names', $names, false );
	}
	return (int) $id;
}

/**
 * Send the values to the owner's webhook (Elementor's: the fields by their labels, or,
 * with Advanced Data, the form, the fields and the details of the sending).
 *
 * @param array<string,mixed>            $settings The form's settings.
 * @param array<int,array<string,mixed>> $record   The values sent.
 * @param array<string,mixed>            $context  The sending's page, address and browser.
 * @return bool Whether the webhook took them.
 */
function harlow_form_webhook( $settings, $record, $context ) {
	$url = esc_url_raw( trim( (string) $settings['webhookUrl'] ) );
	if ( '' === $url ) {
		return true;
	}
	if ( $settings['webhookAdvanced'] ) {
		$fields = array();
		foreach ( $record as $entry ) {
			$fields[ $entry['id'] ] = array(
				'id'        => $entry['id'],
				'type'      => $entry['type'],
				'title'     => $entry['title'],
				'value'     => $entry['value'],
				'raw_value' => $entry['raw'],
			);
		}
		$meta = array();
		foreach ( harlow_form_meta( $context ) as $key => $item ) {
			$meta[ $key ] = array(
				'title' => $item[0],
				'value' => $item[1],
			);
		}
		$body = array(
			'form'   => array(
				'id'   => $settings['element'],
				'name' => $settings['formName'],
			),
			'fields' => $fields,
			'meta'   => $meta,
		);
	} else {
		$body = array();
		foreach ( $record as $entry ) {
			$body[ $entry['title'] ] = $entry['value'];
		}
		$body['form_id']   = $settings['element'];
		$body['form_name'] = $settings['formName'];
	}
	$response = wp_safe_remote_post(
		$url,
		array(
			'body'    => $body,
			'timeout' => 15,
		)
	);
	$code     = (int) wp_remote_retrieve_response_code( $response );
	return ! is_wp_error( $response ) && $code >= 200 && $code < 300;
}

/**
 * Where the visitor goes after sending (Redirect): the owner's address, with the fields'
 * values where it names them; a page of the site by its name.
 *
 * @param array<string,mixed>            $settings The form's settings.
 * @param array<int,array<string,mixed>> $record   The values sent.
 * @return string
 */
function harlow_form_redirect( $settings, $record ) {
	$to = trim( harlow_form_shortcodes( (string) $settings['redirectTo'], $record, 'url' ) );
	if ( '' === $to ) {
		return '';
	}
	if ( function_exists( 'harlow_link_url' ) ) {
		$to = harlow_link_url( $to );
	}
	return esc_url_raw( $to, array( 'http', 'https' ) );
}

/**
 * The page the form was sent from: the page the browser came from when it is this site's,
 * else the page's own address.
 *
 * @param WP_REST_Request $request The request.
 * @param int             $post_id The page's id.
 * @return string
 */
function harlow_form_page_url( $request, $post_id ) {
	$queried  = (int) $request->get_param( 'queried_id' );
	$fallback = get_permalink( $queried && get_post( $queried ) && is_post_publicly_viewable( $queried ) ? $queried : $post_id );
	$fallback = $fallback ? $fallback : home_url( '/' );
	$referer  = (string) $request->get_header( 'referer' );
	return '' !== $referer ? wp_validate_redirect( esc_url_raw( $referer ), $fallback ) : $fallback;
}

/**
 * The answer: JSON for the widget's script; for a browser that posted the form itself,
 * back to the page (or on to the redirect), the answer kept for the page to show.
 *
 * @param WP_REST_Request     $request The request.
 * @param array<string,mixed> $answer  success, message, errors, data.
 * @param int                 $status  The HTTP status of the JSON answer.
 * @param string              $back    The page the form was sent from.
 * @return WP_REST_Response
 */
function harlow_form_answer( $request, $answer, $status, $back ) {
	$answer = wp_parse_args(
		$answer,
		array(
			'success' => false,
			'message' => '',
			'errors'  => array(),
			'data'    => array(),
		)
	);
	if ( '1' === (string) $request->get_param( 'harlow_js' ) ) {
		$answer['errors'] = (object) $answer['errors'];
		$answer['data']   = (object) $answer['data'];
		return new WP_REST_Response( $answer, $status );
	}
	$element = preg_replace( '/[^a-z0-9]/', '', strtolower( (string) $request->get_param( 'form_id' ) ) );
	if ( $answer['success'] && ! empty( $answer['data']['redirect_url'] ) ) {
		$to = (string) $answer['data']['redirect_url'];
	} else {
		$token = strtolower( wp_generate_password( 20, false ) );
		set_transient(
			'harlow_form_result_' . $token,
			array(
				'form'    => $element,
				'success' => (bool) $answer['success'],
				'message' => (string) $answer['message'],
				'errors'  => (array) $answer['errors'],
			),
			10 * MINUTE_IN_SECONDS
		);
		$to = add_query_arg( 'harlow-form-result', $token, remove_query_arg( 'harlow-form-result', $back ) );
	}
	$response = new WP_REST_Response( null, 303 );
	$response->header( 'Location', esc_url_raw( $to ) );
	return $response;
}

/**
 * A form sent: checked, its files kept, its actions run.
 *
 * @param WP_REST_Request $request The request.
 * @return WP_REST_Response
 */
function harlow_form_submit( $request ) {
	$post_id  = (int) $request->get_param( 'post_id' );
	$element  = preg_replace( '/[^a-z0-9]/', '', strtolower( (string) $request->get_param( 'form_id' ) ) );
	$found    = harlow_form_find( $post_id, $element );
	$defaults = harlow_form_default_messages();
	$back     = harlow_form_page_url( $request, $post_id );
	if ( ! $found ) {
		return harlow_form_answer( $request, array( 'message' => $defaults['invalid'] ), 404, $back );
	}
	$settings = harlow_form_settings( $found );
	$messages = harlow_form_messages( $settings );
	$fields   = harlow_form_fields( $settings );

	if ( harlow_form_rate_limited() ) {
		return harlow_form_answer( $request, array( 'message' => $messages['error'] ), 429, $back );
	}
	if ( ! wp_verify_nonce( (string) $request->get_param( 'harlow_form_nonce' ), 'harlow_form_' . $element ) ) {
		return harlow_form_answer( $request, array( 'message' => $messages['invalid'] ), 403, $back );
	}
	if ( $settings['honeypot'] && '' !== trim( (string) $request->get_param( 'harlow_website' ) ) ) {
		return harlow_form_answer( $request, array( 'message' => $messages['invalid'] ), 400, $back );
	}

	list( $record, $errors, $uploads ) = harlow_form_validate( $request, $fields, $messages );
	if ( $errors ) {
		return harlow_form_answer(
			$request,
			array(
				'message' => $messages['invalid'],
				'errors'  => $errors,
			),
			400,
			$back
		);
	}

	$kept = harlow_form_store_files( $uploads, $fields );
	if ( is_wp_error( $kept ) ) {
		$data = $kept->get_error_data();
		return harlow_form_answer(
			$request,
			array(
				'message' => $messages['error'],
				'errors'  => isset( $data['field'] ) ? array( $data['field'] => __( 'There was an error while trying to upload your file.', 'harlow' ) ) : array(),
			),
			500,
			$back
		);
	}
	$attachments = array();
	$attached    = array();
	foreach ( $record as $index => $entry ) {
		if ( empty( $kept[ $entry['id'] ] ) ) {
			continue;
		}
		$field = null;
		foreach ( $fields as $one ) {
			if ( $one['id'] === $entry['id'] ) {
				$field = $one;
			}
		}
		$files = $kept[ $entry['id'] ];
		if ( $field && $field['attach'] ) {
			// Attached to the emails, then gone, as Elementor's Attach File does: the names stay.
			$attachments = array_merge( $attachments, wp_list_pluck( $files, 'file' ) );
			$attached    = array_merge( $attached, wp_list_pluck( $files, 'file' ) );
			$value       = implode( ', ', wp_list_pluck( $files, 'name' ) );
		} else {
			$value = implode( ' , ', wp_list_pluck( $files, 'url' ) );
		}
		$record[ $index ]['value'] = $value;
		$record[ $index ]['raw']   = wp_list_pluck( $files, 'url' );
	}

	$user_agent = mb_substr( sanitize_text_field( (string) $request->get_header( 'user_agent' ) ), 0, 255 );
	$context    = array(
		'post_id'    => $post_id,
		'page_url'   => $back,
		'ip'         => harlow_form_client_ip(),
		'user_agent' => $user_agent,
	);
	$actions    = $settings['actions'];
	$failed     = false;
	$data       = array();

	if ( in_array( 'collect', $actions, true ) ) {
		$data['submission'] = harlow_form_collect( $settings, $record, $context ) > 0;
		$failed             = $failed || ! $data['submission'];
	}
	if ( in_array( 'email', $actions, true ) && ! harlow_form_send_email( 'email', $settings, $record, $context, $attachments ) ) {
		$failed = true;
	}
	if ( in_array( 'email2', $actions, true ) && ! harlow_form_send_email( 'email2', $settings, $record, $context, $attachments ) ) {
		$failed = true;
	}
	foreach ( $attached as $file ) {
		wp_delete_file( $file );
	}
	if ( in_array( 'webhook', $actions, true ) && ! harlow_form_webhook( $settings, $record, $context ) ) {
		$failed = true;
	}
	if ( in_array( 'popup', $actions, true ) && ( 'close' === $settings['popupAction'] || $settings['popupId'] ) ) {
		$data['popup'] = array(
			'action' => $settings['popupAction'],
			'id'     => $settings['popupId'],
		);
		/**
		 * A form asks for a popup to open, or for the popup it is in to close (the widget's
		 * script hands it to assets/js/popup.js, as a link to #harlow-popup-<id> or
		 * #harlow-popup-close would).
		 *
		 * @param array<string,mixed>            $popup    The action (open, close) and the popup's id.
		 * @param array<int,array<string,mixed>> $record   The values sent.
		 * @param array<string,mixed>            $settings The form's settings.
		 */
		do_action( 'harlow_form_popup', $data['popup'], $record, $settings );
	}
	if ( in_array( 'redirect', $actions, true ) ) {
		$redirect = harlow_form_redirect( $settings, $record );
		if ( '' !== $redirect ) {
			$data['redirect_url'] = $redirect;
		}
	}

	/**
	 * A form was sent and its actions run.
	 *
	 * @param array<int,array<string,mixed>> $record   The values sent.
	 * @param array<string,mixed>            $settings The form's settings.
	 * @param bool                           $failed   Whether an action failed.
	 */
	do_action( 'harlow_form_sent', $record, $settings, $failed );

	if ( $failed ) {
		unset( $data['redirect_url'] );
		return harlow_form_answer(
			$request,
			array(
				'message' => $messages['error'],
				'data'    => $data,
			),
			500,
			$back
		);
	}
	return harlow_form_answer(
		$request,
		array(
			'success' => true,
			'message' => $messages['success'],
			'data'    => $data,
		),
		200,
		$back
	);
}

/*
 * Submissions: what the forms collected, in the dashboard.
 */

/**
 * The submissions' post type: private, seen and managed only by administrators, made only
 * by the forms.
 */
function harlow_form_submissions_type() {
	$cap = 'manage_options';
	register_post_type(
		'harlow_submission',
		array(
			'labels'              => array(
				'name'               => __( 'Submissions', 'harlow' ),
				'singular_name'      => __( 'Submission', 'harlow' ),
				'menu_name'          => __( 'Submissions', 'harlow' ),
				'all_items'          => __( 'All submissions', 'harlow' ),
				'edit_item'          => __( 'Submission', 'harlow' ),
				'view_item'          => __( 'View submission', 'harlow' ),
				'search_items'       => __( 'Search submissions', 'harlow' ),
				'not_found'          => __( 'No submissions yet.', 'harlow' ),
				'not_found_in_trash' => __( 'No submissions in the trash.', 'harlow' ),
			),
			'public'              => false,
			'show_ui'             => true,
			'show_in_menu'        => true,
			'show_in_admin_bar'   => false,
			'show_in_nav_menus'   => false,
			'show_in_rest'        => false,
			'exclude_from_search' => true,
			'publicly_queryable'  => false,
			'has_archive'         => false,
			'rewrite'             => false,
			'query_var'           => false,
			'menu_position'       => 26,
			'menu_icon'           => 'dashicons-feedback',
			'supports'            => false,
			'map_meta_cap'        => false,
			'capabilities'        => array(
				'edit_post'              => $cap,
				'read_post'              => $cap,
				'delete_post'            => $cap,
				'edit_posts'             => $cap,
				'edit_others_posts'      => $cap,
				'edit_published_posts'   => $cap,
				'edit_private_posts'     => $cap,
				'delete_posts'           => $cap,
				'delete_others_posts'    => $cap,
				'delete_published_posts' => $cap,
				'delete_private_posts'   => $cap,
				'read_private_posts'     => $cap,
				'read'                   => $cap,
				'publish_posts'          => 'do_not_allow',
				'create_posts'           => 'do_not_allow',
			),
		)
	);
}
add_action( 'init', 'harlow_form_submissions_type' );

/**
 * How many submissions no one has opened yet.
 *
 * @return int
 */
function harlow_form_unread_count() {
	static $count = null;
	if ( null === $count ) {
		$query = new WP_Query(
			array(
				'post_type'      => 'harlow_submission',
				'post_status'    => 'publish',
				'meta_key'       => '_harlow_read', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- one small query, in the dashboard only.
				'meta_value'     => '0', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value -- as above.
				'fields'         => 'ids',
				'posts_per_page' => 1,
			)
		);
		$count = (int) $query->found_posts;
	}
	return $count;
}

/**
 * The number of unread submissions beside Submissions in the dashboard's menu.
 *
 * @param array<int,array<int,string>> $items The menu.
 * @return array<int,array<int,string>>
 */
function harlow_form_menu_count( $items ) {
	if ( ! current_user_can( 'manage_options' ) ) {
		return $items;
	}
	$count = harlow_form_unread_count();
	if ( ! $count ) {
		return $items;
	}
	foreach ( $items as $key => $item ) {
		if ( isset( $item[2] ) && 'edit.php?post_type=harlow_submission' === $item[2] ) {
			$items[ $key ][0] .= ' <span class="awaiting-mod">' . esc_html( number_format_i18n( $count ) ) . '</span>';
		}
	}
	return $items;
}
add_filter( 'add_menu_classes', 'harlow_form_menu_count' );

/**
 * The submissions' columns: the submission, its form, its page, read or not, its date.
 *
 * @param array<string,string> $columns The list's columns.
 * @return array<string,string>
 */
function harlow_form_columns( $columns ) {
	return array(
		'cb'            => isset( $columns['cb'] ) ? $columns['cb'] : '',
		'title'         => __( 'Submission', 'harlow' ),
		'harlow_form'   => __( 'Form', 'harlow' ),
		'harlow_page'   => __( 'Page', 'harlow' ),
		'harlow_status' => __( 'Status', 'harlow' ),
		'date'          => __( 'Date', 'harlow' ),
	);
}
add_filter( 'manage_harlow_submission_posts_columns', 'harlow_form_columns' );

/**
 * A submission's form, page and status in the list.
 *
 * @param string $column  The column.
 * @param int    $post_id The submission.
 */
function harlow_form_column( $column, $post_id ) {
	if ( 'harlow_form' === $column ) {
		echo esc_html( (string) get_post_meta( $post_id, '_harlow_form_name', true ) );
	} elseif ( 'harlow_page' === $column ) {
		$page_id = (int) get_post_meta( $post_id, '_harlow_form_post', true );
		$url     = (string) get_post_meta( $post_id, '_harlow_form_page_url', true );
		if ( $page_id && get_post( $page_id ) ) {
			echo '<a href="' . esc_url( '' !== $url ? $url : (string) get_permalink( $page_id ) ) . '">' . esc_html( get_the_title( $page_id ) ) . '</a>';
		}
	} elseif ( 'harlow_status' === $column ) {
		echo '1' === get_post_meta( $post_id, '_harlow_read', true ) ? esc_html__( 'Read', 'harlow' ) : '<strong>' . esc_html__( 'Unread', 'harlow' ) . '</strong>';
	}
}
add_action( 'manage_harlow_submission_posts_custom_column', 'harlow_form_column', 10, 2 );

/**
 * Unread submissions stand out in the list.
 *
 * @param string[] $classes The row's classes.
 * @param string[] $extra   Classes asked for.
 * @param int      $post_id The post.
 * @return string[]
 */
function harlow_form_row_class( $classes, $extra, $post_id ) {
	unset( $extra );
	if ( is_admin() && 'harlow_submission' === get_post_type( $post_id ) && '1' !== get_post_meta( $post_id, '_harlow_read', true ) ) {
		$classes[] = 'harlow-unread';
	}
	return $classes;
}
add_filter( 'post_class', 'harlow_form_row_class', 10, 3 );

/**
 * The list's look: read submissions in plain weight, unread ones bold.
 */
function harlow_form_list_style() {
	if ( 'harlow_submission' !== get_current_screen()->post_type ) {
		return;
	}
	echo '<style>.post-type-harlow_submission tr:not(.harlow-unread) .row-title{font-weight:400}.post-type-harlow_submission .harlow-submission-fields th{width:30%;text-align:left;vertical-align:top}.post-type-harlow_submission .harlow-submission-fields td{word-break:break-word}</style>' . "\n";
}
add_action( 'admin_head-edit.php', 'harlow_form_list_style' );
add_action( 'admin_head-post.php', 'harlow_form_list_style' );

/**
 * A link that marks a submission read or unread.
 *
 * @param int  $post_id The submission.
 * @param bool $read    Read (true) or unread.
 * @return string
 */
function harlow_form_read_url( $post_id, $read ) {
	return wp_nonce_url(
		add_query_arg(
			array(
				'action' => 'harlow_submission_read',
				'post'   => $post_id,
				'read'   => $read ? '1' : '0',
			),
			admin_url( 'admin-post.php' )
		),
		'harlow_submission_read_' . $post_id
	);
}

/**
 * A submission's links in the list: View, Mark as read or unread, Trash (no quick edit).
 *
 * @param array<string,string> $actions The row's links.
 * @param WP_Post              $item    The submission.
 * @return array<string,string>
 */
function harlow_form_row_actions( $actions, $item ) {
	if ( 'harlow_submission' !== $item->post_type ) {
		return $actions;
	}
	$read = '1' === get_post_meta( $item->ID, '_harlow_read', true );
	$out  = array(
		'view'        => '<a href="' . esc_url( (string) get_edit_post_link( $item->ID ) ) . '">' . esc_html__( 'View', 'harlow' ) . '</a>',
		'harlow_read' => '<a href="' . esc_url( harlow_form_read_url( $item->ID, ! $read ) ) . '">' . ( $read ? esc_html__( 'Mark as unread', 'harlow' ) : esc_html__( 'Mark as read', 'harlow' ) ) . '</a>',
	);
	foreach ( array( 'trash', 'untrash', 'delete' ) as $key ) {
		if ( isset( $actions[ $key ] ) ) {
			$out[ $key ] = $actions[ $key ];
		}
	}
	return $out;
}
add_filter( 'post_row_actions', 'harlow_form_row_actions', 10, 2 );

/**
 * Mark a submission read or unread (its link in the list and on its screen).
 */
function harlow_form_mark_read() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- the id names the nonce checked on the next line.
	$post_id = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : 0;
	check_admin_referer( 'harlow_submission_read_' . $post_id );
	if ( ! $post_id || 'harlow_submission' !== get_post_type( $post_id ) || ! current_user_can( 'edit_post', $post_id ) ) {
		wp_die( esc_html__( 'You may not change this submission.', 'harlow' ), '', array( 'response' => 403 ) );
	}
	$read = isset( $_GET['read'] ) && '1' === sanitize_key( wp_unslash( $_GET['read'] ) );
	update_post_meta( $post_id, '_harlow_read', $read ? '1' : '0' );
	wp_safe_redirect( admin_url( 'edit.php?post_type=harlow_submission' ) );
	exit;
}
add_action( 'admin_post_harlow_submission_read', 'harlow_form_mark_read' );

/**
 * Mark as read and Mark as unread among the list's bulk actions; no bulk edit.
 *
 * @param array<string,string> $actions The bulk actions.
 * @return array<string,string>
 */
function harlow_form_bulk_actions( $actions ) {
	unset( $actions['edit'] );
	$actions['harlow_read']   = __( 'Mark as read', 'harlow' );
	$actions['harlow_unread'] = __( 'Mark as unread', 'harlow' );
	return $actions;
}
add_filter( 'bulk_actions-edit-harlow_submission', 'harlow_form_bulk_actions' );

/**
 * Mark the submissions chosen read or unread (WordPress has checked the list's nonce).
 *
 * @param string $redirect Where the list goes after.
 * @param string $action   The bulk action.
 * @param int[]  $ids      The submissions chosen.
 * @return string
 */
function harlow_form_do_bulk( $redirect, $action, $ids ) {
	if ( 'harlow_read' !== $action && 'harlow_unread' !== $action ) {
		return $redirect;
	}
	foreach ( $ids as $id ) {
		if ( 'harlow_submission' === get_post_type( $id ) && current_user_can( 'edit_post', $id ) ) {
			update_post_meta( (int) $id, '_harlow_read', 'harlow_read' === $action ? '1' : '0' );
		}
	}
	return $redirect;
}
add_filter( 'handle_bulk_actions-edit-harlow_submission', 'harlow_form_do_bulk', 10, 3 );

/**
 * Above the list: the submissions of one form, and the list as a CSV file.
 *
 * @param string $post_type The list's post type.
 */
function harlow_form_list_tools( $post_type ) {
	if ( 'harlow_submission' !== $post_type ) {
		return;
	}
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- the list's own filter, read to show it.
	$current = isset( $_GET['harlow_form'] ) ? sanitize_text_field( wp_unslash( $_GET['harlow_form'] ) ) : '';
	$names   = get_option( 'harlow_form_names', array() );
	echo '<label class="screen-reader-text" for="harlow-form-filter">' . esc_html__( 'Filter by form', 'harlow' ) . '</label>';
	echo '<select name="harlow_form" id="harlow-form-filter"><option value="">' . esc_html__( 'All forms', 'harlow' ) . '</option>';
	foreach ( is_array( $names ) ? $names : array() as $name ) {
		echo '<option value="' . esc_attr( $name ) . '"' . selected( $current, $name, false ) . '>' . esc_html( $name ) . '</option>';
	}
	echo '</select>';
	$export = wp_nonce_url(
		add_query_arg(
			array(
				'action' => 'harlow_submissions_export',
				'form'   => $current,
			),
			admin_url( 'admin-post.php' )
		),
		'harlow_submissions_export'
	);
	echo '<a class="button" href="' . esc_url( $export ) . '" style="margin-right:6px">' . esc_html__( 'Export to CSV', 'harlow' ) . '</a>';
}
add_action( 'restrict_manage_posts', 'harlow_form_list_tools' );

/**
 * The list kept to one form's submissions when one is chosen.
 *
 * @param WP_Query $query The list's query.
 */
function harlow_form_filter_list( $query ) {
	if ( ! is_admin() || ! $query->is_main_query() || 'harlow_submission' !== $query->get( 'post_type' ) ) {
		return;
	}
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- the list's own filter.
	$form = isset( $_GET['harlow_form'] ) ? sanitize_text_field( wp_unslash( $_GET['harlow_form'] ) ) : '';
	if ( '' !== $form ) {
		$query->set( 'meta_key', '_harlow_form_name' ); // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- the dashboard's list, not a page view.
		$query->set( 'meta_value', $form ); // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value -- as above.
	}
}
add_action( 'pre_get_posts', 'harlow_form_filter_list' );

/**
 * One line of a CSV file, every cell quoted; a cell a spreadsheet would read as a formula
 * starts with an apostrophe.
 *
 * @param string[] $cells The cells.
 * @return string
 */
function harlow_form_csv_line( $cells ) {
	$out = array();
	foreach ( $cells as $cell ) {
		$cell = (string) $cell;
		if ( '' !== $cell && in_array( $cell[0], array( '=', '+', '-', '@', "\t", "\r" ), true ) ) {
			$cell = "'" . $cell;
		}
		$out[] = '"' . str_replace( '"', '""', $cell ) . '"';
	}
	return implode( ',', $out ) . "\r\n";
}

/**
 * The submissions (all, or one form's) as a CSV file: date, form, page, read, and a column
 * for each field.
 */
function harlow_form_export() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You may not export submissions.', 'harlow' ), '', array( 'response' => 403 ) );
	}
	check_admin_referer( 'harlow_submissions_export' );
	$form = isset( $_GET['form'] ) ? sanitize_text_field( wp_unslash( $_GET['form'] ) ) : '';

	$rows    = array();
	$columns = array();
	$paged   = 1;
	do {
		$args = array(
			'post_type'      => 'harlow_submission',
			'post_status'    => 'publish',
			'posts_per_page' => 100,
			'paged'          => $paged,
			'orderby'        => 'date',
			'order'          => 'DESC',
		);
		if ( '' !== $form ) {
			$args['meta_key']   = '_harlow_form_name'; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- an export asked for in the dashboard.
			$args['meta_value'] = $form; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value -- as above.
		}
		$query = new WP_Query( $args );
		foreach ( $query->posts as $item ) {
			$values = array();
			$fields = get_post_meta( $item->ID, '_harlow_form_fields', true );
			foreach ( is_array( $fields ) ? $fields : array() as $field ) {
				$columns[ $field['id'] ] = isset( $columns[ $field['id'] ] ) ? $columns[ $field['id'] ] : $field['title'];
				$values[ $field['id'] ]  = $field['value'];
			}
			$rows[] = array(
				'date'   => get_the_date( 'Y-m-d H:i', $item ),
				'form'   => (string) get_post_meta( $item->ID, '_harlow_form_name', true ),
				'page'   => (string) get_post_meta( $item->ID, '_harlow_form_page_url', true ),
				'read'   => '1' === get_post_meta( $item->ID, '_harlow_read', true ) ? __( 'Read', 'harlow' ) : __( 'Unread', 'harlow' ),
				'values' => $values,
			);
		}
		++$paged;
	} while ( $paged <= (int) $query->max_num_pages );

	$csv = "\xEF\xBB\xBF" . harlow_form_csv_line( array_merge( array( __( 'Date', 'harlow' ), __( 'Form', 'harlow' ), __( 'Page', 'harlow' ), __( 'Status', 'harlow' ) ), array_values( $columns ) ) );
	foreach ( $rows as $row ) {
		$cells = array( $row['date'], $row['form'], $row['page'], $row['read'] );
		foreach ( array_keys( $columns ) as $id ) {
			$cells[] = isset( $row['values'][ $id ] ) ? $row['values'][ $id ] : '';
		}
		$csv .= harlow_form_csv_line( $cells );
	}
	nocache_headers();
	header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename="submissions-' . gmdate( 'Y-m-d' ) . '.csv"' );
	echo $csv; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- a CSV file, every cell quoted in harlow_form_csv_line(), not HTML.
	exit;
}
add_action( 'admin_post_harlow_submissions_export', 'harlow_form_export' );

/**
 * Opening a submission marks it read, as opening a message does.
 */
function harlow_form_opened() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- opening a submission only marks it read.
	$post_id = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : 0;
	if ( $post_id && 'harlow_submission' === get_post_type( $post_id ) && current_user_can( 'edit_post', $post_id ) ) {
		update_post_meta( $post_id, '_harlow_read', '1' );
	}
}
add_action( 'load-post.php', 'harlow_form_opened' );

/**
 * A submission's screen: its fields, and its details (form, page, date, address, browser)
 * with its links, in place of the editor's boxes.
 *
 * @param WP_Post $item The submission.
 */
function harlow_form_boxes( $item ) {
	unset( $item );
	remove_meta_box( 'submitdiv', 'harlow_submission', 'side' );
	remove_meta_box( 'slugdiv', 'harlow_submission', 'normal' );
	add_meta_box( 'harlow-submission-fields', __( 'Fields', 'harlow' ), 'harlow_form_fields_box', 'harlow_submission', 'normal', 'high' );
	add_meta_box( 'harlow-submission-details', __( 'Details', 'harlow' ), 'harlow_form_details_box', 'harlow_submission', 'side', 'high' );
}
add_action( 'add_meta_boxes_harlow_submission', 'harlow_form_boxes' );

/**
 * The fields of a submission.
 *
 * @param WP_Post $item The submission.
 */
function harlow_form_fields_box( $item ) {
	$fields = get_post_meta( $item->ID, '_harlow_form_fields', true );
	echo '<table class="widefat striped harlow-submission-fields"><tbody>';
	foreach ( is_array( $fields ) ? $fields : array() as $field ) {
		$value = (string) $field['value'];
		if ( 'upload' === $field['type'] && false !== strpos( $value, '://' ) ) {
			$shown = harlow_form_links( $field );
		} else {
			$shown = nl2br( esc_html( $value ), false );
		}
		echo '<tr><th scope="row">' . esc_html( (string) $field['title'] ) . '</th><td>' . wp_kses_post( $shown ) . '</td></tr>';
	}
	echo '</tbody></table>';
}

/**
 * The details of a submission and its links.
 *
 * @param WP_Post $item The submission.
 */
function harlow_form_details_box( $item ) {
	$page_id = (int) get_post_meta( $item->ID, '_harlow_form_post', true );
	$url     = (string) get_post_meta( $item->ID, '_harlow_form_page_url', true );
	$rows    = array(
		__( 'Form', 'harlow' )       => esc_html( (string) get_post_meta( $item->ID, '_harlow_form_name', true ) ),
		__( 'Page', 'harlow' )       => $page_id && get_post( $page_id ) ? '<a href="' . esc_url( '' !== $url ? $url : (string) get_permalink( $page_id ) ) . '">' . esc_html( get_the_title( $page_id ) ) . '</a>' : esc_html( $url ),
		__( 'Date', 'harlow' )       => esc_html( get_the_date( '', $item ) . ' ' . get_the_time( '', $item ) ),
		__( 'Remote IP', 'harlow' )  => esc_html( (string) get_post_meta( $item->ID, '_harlow_form_ip', true ) ),
		__( 'User Agent', 'harlow' ) => esc_html( (string) get_post_meta( $item->ID, '_harlow_form_user_agent', true ) ),
	);
	echo '<p>';
	foreach ( $rows as $label => $value ) {
		echo '<strong>' . esc_html( $label ) . ':</strong> ' . wp_kses_post( $value ) . '<br>';
	}
	echo '</p><p><a class="button" href="' . esc_url( harlow_form_read_url( $item->ID, false ) ) . '">' . esc_html__( 'Mark as unread', 'harlow' ) . '</a> ';
	echo '<a class="submitdelete" href="' . esc_url( (string) get_delete_post_link( $item->ID ) ) . '">' . esc_html__( 'Move to Trash', 'harlow' ) . '</a></p>';
}
