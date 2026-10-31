<?php
/**
 * Rank Math's head for pages made of blocks.
 *
 * Each page's SEO fields and the site's are Rank Math's own (the installer lays live's,
 * install/seo.json). One thing Rank Math reads from the page itself: for a page with no
 * featured picture, the first picture in its text is its primary image (the schema, at
 * 200 x 200, as Rank Math writes any picture it finds there) and, when the page has no
 * social picture of its own, its social picture. On live that text is Elementor's copy of
 * the page; here a page's pictures are its blocks' attributes, which Rank Math does not
 * read, so the first picture the page's blocks show is handed to it.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The first picture a page's own blocks show (not a list's cards, which are other items):
 * a picture block, or an image in a block's markup.
 *
 * @param int $post_id The page.
 * @return array{id: int, url: string}|null
 */
function harlow_first_picture( $post_id ) {
	$content = (string) get_post_field( 'post_content', $post_id );
	if ( false === strpos( $content, '<!-- wp:harlow/' ) ) {
		return null;
	}
	$find    = function ( $blocks ) use ( &$find ) {
		foreach ( $blocks as $block ) {
			if ( 'harlow/loop' === $block['blockName'] ) {
				continue;
			}
			if ( 'harlow/image' === $block['blockName'] ) {
				$attrs = $block['attrs'];
				if ( ! empty( $attrs['image'] ) && wp_attachment_is_image( (int) $attrs['image'] ) ) {
					$src = wp_get_attachment_image_src( (int) $attrs['image'], isset( $attrs['size'] ) ? $attrs['size'] : 'large' );
					return array(
						'id'  => (int) $attrs['image'],
						'url' => $src ? $src[0] : '',
					);
				}
				if ( ! empty( $attrs['src'] ) ) {
					return array(
						'id'  => 0,
						'url' => harlow_link_url( $attrs['src'] ),
					);
				}
			}
			if ( preg_match( '/<img\b[^>]*\bsrc="([^"]+)"/', $block['innerHTML'], $m ) ) {
				$url = harlow_link_url( html_entity_decode( $m[1] ) );
				return array(
					'id'  => (int) attachment_url_to_postid( $url ),
					'url' => $url,
				);
			}
			$inner = $find( $block['innerBlocks'] );
			if ( $inner ) {
				return $inner;
			}
		}
		return null;
	};
	$picture = $find( parse_blocks( $content ) );
	return $picture && '' !== $picture['url'] ? $picture : null;
}

/**
 * The page's first picture, for the schema, when the page has no featured picture and
 * Rank Math will write the page's schema at all (it writes none for most pages, as live).
 *
 * @param array<string,mixed>    $data   The schema graph so far.
 * @param RankMath\Schema\JsonLD $jsonld Rank Math's schema writer.
 * @return array<string,mixed>
 */
function harlow_seo_primary_image( $data, $jsonld ) {
	if ( ! is_singular( 'page' ) || has_post_thumbnail() || ! $jsonld->can_add_global_entities( $data ) ) {
		return $data;
	}
	$picture = harlow_first_picture( get_queried_object_id() );
	if ( $picture ) {
		$data['primaryImage'] = array(
			'@type'  => 'ImageObject',
			'@id'    => $picture['url'],
			'url'    => $picture['url'],
			'width'  => '200',
			'height' => '200',
		);
		$jsonld->add_prop( 'language', $data['primaryImage'] );
	}
	return $data;
}
add_filter( 'rank_math/json_ld', 'harlow_seo_primary_image', 9, 2 );

/**
 * Rank Math puts a page's social picture in the primary image's place when the page has
 * one; live's comes first from its text. The page's first picture is put back, and what
 * named Rank Math's picture names it. The picture stands where Rank Math puts its own:
 * right before the page.
 *
 * @param array<string,mixed> $data The schema graph.
 * @return array<string,mixed>
 */
function harlow_seo_primary_image_kept( $data ) {
	if ( ! is_singular( 'page' ) || has_post_thumbnail() || empty( $data['primaryImage']['@id'] ) ) {
		return $data;
	}
	$picture = harlow_first_picture( get_queried_object_id() );
	if ( ! $picture ) {
		return $data;
	}
	if ( $picture['url'] === $data['primaryImage']['@id'] ) {
		return harlow_seo_image_before_page( $data );
	}
	$replaced = $data['primaryImage']['@id'];
	$language = isset( $data['primaryImage']['inLanguage'] ) ? $data['primaryImage']['inLanguage'] : '';
	array_walk_recursive(
		$data,
		function ( &$value, $key ) use ( $replaced, $picture ) {
			if ( '@id' === $key && $value === $replaced ) {
				$value = $picture['url'];
			}
		}
	);
	$data['primaryImage'] = array_filter(
		array(
			'@type'      => 'ImageObject',
			'@id'        => $picture['url'],
			'url'        => $picture['url'],
			'width'      => '200',
			'height'     => '200',
			'inLanguage' => $language,
		)
	);
	return harlow_seo_image_before_page( $data );
}

/**
 * The primary image moved to right before the page's node, where Rank Math writes it.
 *
 * @param array<string,mixed> $data The schema graph.
 * @return array<string,mixed>
 */
function harlow_seo_image_before_page( $data ) {
	if ( ! isset( $data['primaryImage'], $data['WebPage'] ) ) {
		return $data;
	}
	$image = $data['primaryImage'];
	unset( $data['primaryImage'] );
	$out = array();
	foreach ( $data as $key => $node ) {
		if ( 'WebPage' === $key ) {
			$out['primaryImage'] = $image;
		}
		$out[ $key ] = $node;
	}
	return $out;
}
add_filter( 'rank_math/json_ld', 'harlow_seo_primary_image_kept', 11 );

/**
 * The page's first picture as its social picture when it has none of its own and no
 * featured picture (Rank Math's own last step before its default picture).
 *
 * @param RankMath\OpenGraph\Image $image Rank Math's pictures for one network.
 */
function harlow_seo_social_image( $image ) {
	if ( ! is_singular( 'page' ) || $image->has_images() ) {
		return;
	}
	$picture = harlow_first_picture( get_queried_object_id() );
	if ( ! $picture ) {
		return;
	}
	if ( $picture['id'] ) {
		$image->add_image_by_id( $picture['id'] );
	} else {
		$image->add_image( $picture['url'] );
	}
}
add_action( 'rank_math/opengraph/facebook/add_additional_images', 'harlow_seo_social_image' );
add_action( 'rank_math/opengraph/twitter/add_additional_images', 'harlow_seo_social_image' );
