<?php
/**
 * An item's edit screen (a post, a news item, a project, a job, a business model, a person, a
 * testimonial): what the editor needs to say what the item is and where it shows, as
 * editor/item-details.js shows it in the sidebar with the item's own fields: the item pages'
 * design (its type's single template, a synced pattern) and the pages whose lists show its
 * cards, where their design is styled; a card of its own is made in the Theme Builder. The
 * words over the title and the text say what goes there.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The item types with an edit screen of blocks (their own fields in the sidebar).
 *
 * @return string[]
 */
function harlow_item_types() {
	$types = array( 'post' );
	foreach ( harlow_content_types() as $type => $info ) {
		if ( in_array( 'editor', $info[3], true ) ) {
			$types[] = $type;
		}
	}
	return $types;
}

/**
 * The pages and shared sections whose lists show a type's cards: [ title, edit address ].
 *
 * @param string $type The item type.
 * @return array<int,array{title:string,url:string}>
 */
function harlow_lists_of_type( $type ) {
	$out   = array();
	$posts = get_posts(
		array(
			'post_type'      => array( 'page', 'wp_block' ),
			'post_status'    => array( 'publish', 'draft', 'private' ),
			's'              => 'wp:harlow/loop',
			'search_columns' => array( 'post_content' ),
			'posts_per_page' => 100,
		)
	);
	$find  = static function ( $blocks ) use ( &$find, $type ) {
		foreach ( $blocks as $block ) {
			if ( 'harlow/loop' === $block['blockName'] && ( $block['attrs']['postType'] ?? 'post' ) === $type ) {
				return true;
			}
			if ( ! empty( $block['innerBlocks'] ) && $find( $block['innerBlocks'] ) ) {
				return true;
			}
		}
		return false;
	};
	foreach ( $posts as $post ) {
		if ( $find( parse_blocks( $post->post_content ) ) ) {
			$out[] = array(
				'title' => html_entity_decode( get_the_title( $post ), ENT_QUOTES, 'UTF-8' ),
				'url'   => (string) get_edit_post_link( $post->ID, 'raw' ),
			);
		}
	}
	return $out;
}

/**
 * What the editor shows of an item's type: the item page's design and the lists of its
 * cards; null on any other screen.
 *
 * @param WP_Post|null $post The post being edited.
 * @return array<string,mixed>|null
 */
function harlow_item_screen( $post ) {
	if ( ! $post || ! in_array( $post->post_type, harlow_item_types(), true ) ) {
		return null;
	}
	$single  = HARLOW_SINGLES[ $post->post_type ] ?? '';
	$pattern = $single ? harlow_single_template_id( $single ) : 0;
	return array(
		'type'       => $post->post_type,
		'hasPage'    => ! in_array( $post->post_type, HARLOW_TYPES_WITHOUT_PAGES, true ) && 'testimonial' !== $post->post_type,
		'pageDesign' => $pattern ? (string) get_edit_post_link( $pattern, 'raw' ) : '',
		'lists'      => harlow_lists_of_type( $post->post_type ),
		'newCard'    => admin_url( 'post-new.php?post_type=harlow_template&harlow_kind=loop-item' ),
	);
}

/**
 * The words over an item's title, by its type.
 *
 * @param string  $text The words.
 * @param WP_Post $post The item.
 * @return string
 */
function harlow_item_title_words( $text, $post ) {
	$words = array(
		'albahoo_project' => __( 'Project name', 'harlow' ),
		'news'            => __( 'News headline', 'harlow' ),
		'post'            => __( 'Post title', 'harlow' ),
		'job'             => __( 'Job title', 'harlow' ),
		'business_model'  => __( 'Business model name', 'harlow' ),
		'harlows_person'  => __( 'Person’s name', 'harlow' ),
		'testimonial'     => __( 'Name of the person quoted', 'harlow' ),
	);
	return $words[ $post->post_type ] ?? $text;
}
add_filter( 'enter_title_here', 'harlow_item_title_words', 10, 2 );

/**
 * The words in an item's empty text, by its type: what its text is and where it shows.
 *
 * @param string  $text The words.
 * @param WP_Post $post The item.
 * @return string
 */
function harlow_item_text_words( $text, $post ) {
	$words = array(
		'albahoo_project' => __( 'Write the project’s text: it shows on the project’s page, and its first words on its card (unless an excerpt is written). Its short description, year and pictures are in Project details, on the right.', 'harlow' ),
		'news'            => __( 'Write the news item: it shows on its page under the headline, and its first words on its card (unless an excerpt is written).', 'harlow' ),
		'post'            => __( 'Write the post: it shows on its page under the title, and its first words on its card (unless an excerpt is written).', 'harlow' ),
		'job'             => __( 'Write the job’s description: it shows on its page, and its first words on its card in the careers list.', 'harlow' ),
		'business_model'  => __( 'Write about the business model: its card on the home page shows the first words (unless an excerpt is written). It has no page of its own; its card opens the page chosen in Business model details.', 'harlow' ),
		'harlows_person'  => __( 'Write about the person: their card shows the first words, the window it opens shows all of it.', 'harlow' ),
		'testimonial'     => __( 'Write what the person said: it shows on their card, with their name and position.', 'harlow' ),
	);
	return $words[ $post->post_type ] ?? $text;
}
add_filter( 'write_your_story', 'harlow_item_text_words', 10, 2 );

/**
 * A new Theme Builder template asked for as a kind (an item's "New card design" asks for a
 * list card): the new draft starts as that kind.
 *
 * @param int     $post_id The new template.
 * @param WP_Post $post    It.
 */
function harlow_new_template_kind( $post_id, $post ) {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- only presets the kind of the user's own new draft, as a link of the editor asks.
	$kind = isset( $_GET['harlow_kind'] ) ? sanitize_key( wp_unslash( $_GET['harlow_kind'] ) ) : '';
	if ( '' !== $kind && 'auto-draft' === $post->post_status && current_user_can( 'edit_post', $post_id ) ) {
		update_post_meta( $post_id, '_harlow_template_kind', harlow_sanitize_template_kind( $kind ) );
	}
}
add_action( 'save_post_harlow_template', 'harlow_new_template_kind', 10, 2 );
