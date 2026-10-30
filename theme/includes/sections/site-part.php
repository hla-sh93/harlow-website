<?php
/**
 * The site header or footer inside a page (harlow/site-part): the home page builds its
 * header and footer into its own sections, as live does.
 *
 * @package Harlow
 *
 * @var array<string,mixed> $attributes The block's attributes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_template_part( 'includes/parts/site-' . ( 'footer' === $attributes['part'] ? 'footer' : 'header' ), null, array( 'embedded' => (bool) $attributes['embedded'] ) );
