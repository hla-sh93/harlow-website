<?php
/**
 * A box (harlow/box): a div or section around paragraphs, with its classes, id and data
 * attributes, as the text of an older page has it.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 * @var string              $content    The blocks inside, printed.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$harlow_tag   = 'section' === $attributes['tag'] ? 'section' : 'div';
$harlow_attrs = '';
foreach ( (array) $attributes['htmlAttributes'] as $harlow_name => $harlow_value ) {
	if ( preg_match( '/^(class|id|data-[a-z0-9_-]+)$/', (string) $harlow_name ) ) {
		$harlow_attrs .= ' ' . $harlow_name . '="' . esc_attr( (string) $harlow_value ) . '"';
	}
}
echo '<' . $harlow_tag . $harlow_attrs . '>' . $content . '</' . $harlow_tag . '>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- the tag is one of two, the attribute names are checked and their values escaped; the inside is the inner blocks, printed by WordPress.
