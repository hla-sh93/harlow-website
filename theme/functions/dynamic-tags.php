<?php
/**
 * Dynamic tags (Elementor Pro's): words in any block that show the page's or the site's
 * data as the page is printed. The editor marks them (editor/dynamic-tags.js) as
 * <span class="harlow-dynamic" data-tag="post-title">…</span>; here each is replaced by its
 * value (or its fallback), escaped. A link may also be dynamic (`dynamic:post-url`,
 * harlow_dynamic_link()).
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The tags: name => label (the editor offers them; editor/dynamic-tags.js names the same).
 *
 * @return array<string,string>
 */
function harlow_dynamic_tags() {
	return array(
		'post-title'          => __( 'Post title', 'harlow' ),
		'post-excerpt'        => __( 'Post excerpt', 'harlow' ),
		'post-date'           => __( 'Post date', 'harlow' ),
		'post-time'           => __( 'Post time', 'harlow' ),
		'post-modified'       => __( 'Post modified date', 'harlow' ),
		'post-terms'          => __( 'Post categories', 'harlow' ),
		'post-id'             => __( 'Post ID', 'harlow' ),
		'post-url'            => __( 'Post address', 'harlow' ),
		'comments-number'     => __( 'Comments number', 'harlow' ),
		'author-name'         => __( 'Author name', 'harlow' ),
		'author-bio'          => __( 'Author biography', 'harlow' ),
		'archive-title'       => __( 'Archive title', 'harlow' ),
		'archive-description' => __( 'Archive description', 'harlow' ),
		'page-title'          => __( 'Page title', 'harlow' ),
		'site-title'          => __( 'Site title', 'harlow' ),
		'site-tagline'        => __( 'Site tagline', 'harlow' ),
		'site-url'            => __( 'Site address', 'harlow' ),
		'current-date'        => __( 'Current date and time', 'harlow' ),
		'user-name'           => __( 'Visitor’s name (logged in)', 'harlow' ),
		'request'             => __( 'Request parameter', 'harlow' ),
		'custom-field'        => __( 'Custom field', 'harlow' ),
		'shortcode'           => __( 'Shortcode', 'harlow' ),
	);
}

/**
 * A tag's value now, as plain text ('' when it has none here).
 *
 * @param string $tag    The tag.
 * @param string $key    A custom field's key, a request parameter's name or a shortcode.
 * @param string $format A date's format (PHP's), or ''.
 * @return string
 */
function harlow_dynamic_value( $tag, $key = '', $format = '' ) {
	$post   = get_post();
	$format = '' !== $format ? $format : (string) get_option( 'date_format' );
	switch ( $tag ) {
		case 'post-title':
			return $post ? get_the_title( $post ) : '';
		case 'post-excerpt':
			return $post ? get_the_excerpt( $post ) : '';
		case 'post-date':
			return $post ? (string) get_the_date( $format, $post ) : '';
		case 'post-time':
			return $post ? (string) get_the_time( '' !== $key ? $key : (string) get_option( 'time_format' ), $post ) : '';
		case 'post-modified':
			return $post ? (string) get_the_modified_date( $format, $post ) : '';
		case 'post-terms':
			$terms = $post ? get_the_terms( $post, '' !== $key ? sanitize_key( $key ) : 'category' ) : false;
			return is_array( $terms ) ? implode( ', ', wp_list_pluck( $terms, 'name' ) ) : '';
		case 'post-id':
			return $post ? (string) $post->ID : '';
		case 'post-url':
			return $post ? (string) get_permalink( $post ) : '';
		case 'comments-number':
			return $post ? (string) get_comments_number( $post ) : '';
		case 'author-name':
			return $post ? (string) get_the_author_meta( 'display_name', (int) $post->post_author ) : '';
		case 'author-bio':
			return $post ? (string) get_the_author_meta( 'description', (int) $post->post_author ) : '';
		case 'archive-title':
			return wp_strip_all_tags( get_the_archive_title() );
		case 'archive-description':
			return wp_strip_all_tags( get_the_archive_description() );
		case 'page-title':
			return wp_strip_all_tags( wp_get_document_title() );
		case 'site-title':
			return (string) get_bloginfo( 'name' );
		case 'site-tagline':
			return (string) get_bloginfo( 'description' );
		case 'site-url':
			return home_url( '/' );
		case 'current-date':
			return wp_date( $format );
		case 'user-name':
			return is_user_logged_in() ? wp_get_current_user()->display_name : '';
		case 'request':
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- a value shown, escaped, never acted on.
			return '' !== $key && isset( $_GET[ $key ] ) ? sanitize_text_field( wp_unslash( $_GET[ $key ] ) ) : '';
		case 'custom-field':
			$value = $post && '' !== $key && '_' !== substr( $key, 0, 1 ) ? get_post_meta( $post->ID, $key, true ) : '';
			return is_scalar( $value ) ? (string) $value : '';
		case 'shortcode':
			return '' !== $key ? wp_strip_all_tags( do_shortcode( $key ) ) : '';
	}
	return '';
}

/**
 * Replace the dynamic tags a block printed with their values.
 *
 * @param string $html The block as printed.
 * @return string
 */
function harlow_dynamic_render( $html ) {
	if ( false === strpos( $html, 'harlow-dynamic' ) ) {
		return $html;
	}
	return preg_replace_callback(
		'#<span class="harlow-dynamic"([^>]*)>(.*?)</span>#s',
		static function ( $m ) {
			$attr  = static function ( $name ) use ( $m ) {
				return preg_match( '/\sdata-' . $name . '="([^"]*)"/', $m[1], $a ) ? html_entity_decode( $a[1], ENT_QUOTES ) : '';
			};
			$value = harlow_dynamic_value( $attr( 'tag' ), $attr( 'key' ), $attr( 'format' ) );
			$value = '' !== $value ? $value : $attr( 'fallback' );
			return esc_html( $attr( 'before' ) . $value . ( '' !== $value ? $attr( 'after' ) : '' ) );
		},
		$html
	);
}
add_filter( 'render_block', 'harlow_dynamic_render', 20 );

/**
 * A dynamic link's address (`dynamic:post-url`, `dynamic:site-url`, `dynamic:archive-url`,
 * `dynamic:author-url`, `dynamic:custom-field:<key>`), or '' for another link.
 *
 * @param string $link The link as written.
 * @return string
 */
function harlow_dynamic_link( $link ) {
	if ( 0 !== strpos( $link, 'dynamic:' ) ) {
		return '';
	}
	$parts = explode( ':', $link, 3 );
	$post  = get_post();
	switch ( $parts[1] ) {
		case 'post-url':
			return $post ? (string) get_permalink( $post ) : home_url( '/' );
		case 'site-url':
			return home_url( '/' );
		case 'archive-url':
			$type = $post ? get_post_type( $post ) : 'post';
			$url  = 'post' === $type ? get_permalink( (int) get_option( 'page_for_posts' ) ) : get_post_type_archive_link( $type );
			return $url ? (string) $url : home_url( '/' );
		case 'author-url':
			return $post ? (string) get_author_posts_url( (int) $post->post_author ) : home_url( '/' );
		case 'custom-field':
			$value = $post && isset( $parts[2] ) && '_' !== substr( $parts[2], 0, 1 ) ? get_post_meta( $post->ID, $parts[2], true ) : '';
			return is_string( $value ) ? esc_url_raw( $value ) : '';
	}
	return home_url( '/' );
}
