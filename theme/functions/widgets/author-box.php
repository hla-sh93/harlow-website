<?php
/**
 * The author the author box shows.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The author of the item the page shows (a sample post's where there is none), or the one
 * typed in the widget: name, picture, biography, website and the address of their posts.
 *
 * @param array<string,mixed> $attributes The block's attributes: source, customName,
 *                                        customAvatar, customBio, customWebsite, customArchive.
 * @return array{name:string,avatar:string,bio:string,website:string,archive:string}
 */
function harlow_author_box_author( $attributes ) {
	if ( 'custom' === $attributes['source'] ) {
		$avatar = $attributes['customAvatar'] ? (string) wp_get_attachment_image_url( (int) $attributes['customAvatar'], 'medium' ) : '';
		return array(
			'name'    => (string) $attributes['customName'],
			'avatar'  => '' !== $avatar ? $avatar : (string) get_avatar_url( 0, array( 'size' => 300 ) ),
			'bio'     => (string) $attributes['customBio'],
			'website' => harlow_link_url( (string) $attributes['customWebsite'] ),
			'archive' => harlow_link_url( (string) $attributes['customArchive'] ),
		);
	}
	$post   = harlow_theme_builder_post();
	$author = $post ? (int) $post->post_author : 0;
	return array(
		'name'    => $author ? (string) get_the_author_meta( 'display_name', $author ) : '',
		'avatar'  => (string) get_avatar_url( $author, array( 'size' => 300 ) ),
		'bio'     => $author ? (string) get_the_author_meta( 'description', $author ) : '',
		'website' => $author ? (string) get_the_author_meta( 'user_url', $author ) : '',
		'archive' => $author ? (string) get_author_posts_url( $author ) : '',
	);
}
