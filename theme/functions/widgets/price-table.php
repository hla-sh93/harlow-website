<?php
/**
 * The price table widget: Elementor Pro's currency symbols, and the colour a feature's icon
 * may have.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The currency symbols Elementor Pro's price table offers, by name (its euro is the euro
 * sign itself, not the code point Elementor prints for it).
 *
 * @return array<string,string>
 */
function harlow_price_table_symbols() {
	return array(
		'dollar'       => '$',
		'euro'         => '€',
		'baht'         => '฿',
		'franc'        => 'Fr',
		'guilder'      => 'ƒ',
		'krona'        => 'kr',
		'lira'         => '₤',
		'peseta'       => '₧',
		'peso'         => '₱',
		'pound'        => '£',
		'real'         => 'R$',
		'ruble'        => '₽',
		'rupee'        => '₨',
		'indian_rupee' => '₹',
		'shekel'       => '₪',
		'won'          => '₩',
		'yen'          => '¥',
	);
}

/**
 * The currency symbol of a price table: a named one, the owner's own, or none.
 *
 * @param string $name   The symbol's name, 'custom' or ''.
 * @param string $custom The owner's own symbol.
 * @return string
 */
function harlow_price_table_symbol( $name, $custom ) {
	if ( 'custom' === $name ) {
		return trim( (string) $custom );
	}
	$symbols = harlow_price_table_symbols();
	return isset( $symbols[ $name ] ) ? $symbols[ $name ] : '';
}

/**
 * A colour the owner picked, if it is one: #hex, rgb(a) or hsl(a), or one of the kit's.
 *
 * @param mixed $colour The colour.
 * @return string The colour, or ''.
 */
function harlow_price_table_colour( $colour ) {
	$colour = trim( (string) $colour );
	if ( preg_match( '/^#[0-9a-f]{3,8}$/i', $colour ) || preg_match( '/^(rgb|hsl)a?\([\d\s.,%\/]+\)$/i', $colour ) || preg_match( '/^var\(--e-global-color-[a-z0-9_-]+\)$/i', $colour ) ) {
		return $colour;
	}
	return '';
}
