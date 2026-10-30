<?php
/**
 * One element of a text written as HTML (harlow/markup), printed as it is, with its
 * readable links made addresses.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

echo harlow_resolve_links( $attributes['html'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- markup saved in the page by someone allowed to write HTML, printed as core's HTML block prints it.
