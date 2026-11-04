<?php
/**
 * The posts lists (the posts and archive posts widgets): Elementor Pro's posts widget,
 * skin by skin (classic, cards, full content), with its pager (numbers, previous and next,
 * load more on click or on scroll) and a filter bar by term (Elementor Pro's portfolio
 * filter). The cards' words and pictures are cut and printed by the theme's card helpers
 * (functions/loops.php: harlow_card_text(), harlow_card_image()).
 *
 * A pager's next pages are the page's own address with the page number (/blog/2/), as
 * Elementor's are; load more fetches the next page and takes its cards
 * (assets/js/widgets/posts.js), so no other address is needed.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The content types a posts list can show.
 *
 * @return string[]
 */
function harlow_posts_types() {
	return array( 'post', 'page', 'news', 'albahoo_project', 'gallery_item', 'job' );
}

/**
 * The page of the list being shown: the pager's page number in the address.
 *
 * @return int
 */
function harlow_posts_current_page() {
	return max( 1, (int) get_query_var( 'paged' ), (int) get_query_var( 'page' ) );
}

/**
 * The address of a page of the list, as Elementor Pro gives it: the page's own address
 * with the number (/blog/2/; /page/2/ on the front page and on lists of posts).
 *
 * @param int $number The page number.
 * @return string
 */
function harlow_posts_page_link( $number ) {
	global $wp_rewrite;
	$post = get_post();
	if ( ( ! is_singular() || is_front_page() ) && did_action( 'wp' ) && ! defined( 'REST_REQUEST' ) ) {
		return get_pagenum_link( $number );
	}
	$url = $post ? (string) get_permalink( $post ) : home_url( '/' );
	if ( $number <= 1 ) {
		return $url;
	}
	if ( '' === get_option( 'permalink_structure' ) ) {
		return add_query_arg( 'page', $number, $url );
	}
	if ( $post && 'page' === get_option( 'show_on_front' ) && (int) get_option( 'page_on_front' ) === $post->ID ) {
		return trailingslashit( $url ) . user_trailingslashit( $wp_rewrite->pagination_base . '/' . $number, 'single_paged' );
	}
	return trailingslashit( $url ) . user_trailingslashit( (string) $number, 'single_paged' );
}

/**
 * The query of a posts widget: its type, terms, order, offset and how many, at a page.
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @param int                 $page       The page.
 * @return WP_Query
 */
function harlow_posts_query( $attributes, $page ) {
	$type     = in_array( $attributes['postType'], harlow_posts_types(), true ) ? $attributes['postType'] : 'post';
	$per_page = max( 1, min( 100, (int) $attributes['perPage'] ) );
	$offset   = max( 0, (int) $attributes['offset'] );
	$orderby  = in_array( $attributes['orderby'], array( 'date', 'title', 'menu_order', 'rand', 'modified', 'comment_count' ), true ) ? $attributes['orderby'] : 'date';
	$args     = array(
		'post_type'           => $type,
		'post_status'         => 'publish',
		'posts_per_page'      => $per_page,
		'paged'               => $page,
		'orderby'             => $orderby,
		'order'               => 'ASC' === strtoupper( (string) $attributes['order'] ) ? 'ASC' : 'DESC',
		'ignore_sticky_posts' => true,
	);
	if ( $offset ) {
		$args['offset'] = $offset + ( $page - 1 ) * $per_page;
	}
	if ( 'post' === $type ) {
		$include = array_filter( array_map( 'intval', (array) $attributes['includeTerms'] ) );
		$exclude = array_filter( array_map( 'intval', (array) $attributes['excludeTerms'] ) );
		if ( $include ) {
			$args['category__in'] = $include;
		}
		if ( $exclude ) {
			$args['category__not_in'] = $exclude;
		}
	}
	if ( $attributes['excludeCurrent'] && get_the_ID() ) {
		$args['post__not_in'] = array( (int) get_the_ID() );
	}
	$query = new WP_Query( $args );
	if ( $offset ) {
		// Elementor counts the pages of an offset list without the items it skips.
		$query->max_num_pages = (int) ceil( max( 0, $query->found_posts - $offset ) / $per_page );
	}
	return $query;
}

/**
 * A posts widget: the element, its filter bar, its cards and its pager.
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @param WP_Query            $query      The items, at the page shown.
 * @param string              $type       Elementor's widget type: posts or archive-posts.
 * @param int                 $page       The page shown.
 * @return string
 */
function harlow_posts_widget( $attributes, $query, $type, $page ) {
	$skin      = in_array( $attributes['skin'], array( 'classic', 'cards', 'full_content' ), true ) ? $attributes['skin'] : 'classic';
	$skin_name = ( 'archive-posts' === $type ? 'archive_' : '' ) . $skin;
	$thumbnail = 'cards' === $skin ? 'top' : ( in_array( $attributes['thumbnail'], array( 'top', 'left', 'right', 'none' ), true ) ? $attributes['thumbnail'] : 'top' );
	$pager     = in_array( $attributes['pagination'], array( 'numbers', 'prev_next', 'numbers_and_prev_next', 'load_more_on_click', 'load_more_infinite_scroll' ), true ) ? $attributes['pagination'] : '';
	$max_pages = (int) $query->max_num_pages;
	if ( $attributes['pageLimit'] > 0 ) {
		$max_pages = min( $max_pages, (int) $attributes['pageLimit'] );
	}

	// The element's classes: columns per device, the picture's place, the card's shadow and
	// hover, the alignment (Elementor's prefix classes).
	$extra = array(
		'elementor-grid-' . max( 1, min( 6, (int) $attributes['columns'] ) ),
		'elementor-grid-tablet-' . max( 1, min( 6, (int) $attributes['columnsTablet'] ) ),
		'elementor-grid-mobile-' . max( 1, min( 6, (int) $attributes['columnsMobile'] ) ),
		'elementor-posts--thumbnail-' . $thumbnail,
	);
	if ( 'cards' === $skin ) {
		if ( $attributes['cardShadow'] ) {
			$extra[] = 'elementor-card-shadow-yes';
		}
		if ( in_array( $attributes['hoverEffect'], array( 'gradient', 'zoom-in', 'zoom-out' ), true ) ) {
			$extra[] = 'elementor-posts__hover-' . $attributes['hoverEffect'];
		}
		if ( $attributes['showAvatar'] ) {
			$extra[] = 'elementor-posts--show-avatar';
		}
	}
	if ( in_array( $attributes['align'], array( 'left', 'center', 'right' ), true ) ) {
		$extra[] = 'elementor-posts--align-' . $attributes['align'];
	}
	$element = harlow_theme_builder_classes( $attributes, $type, $extra );
	if ( in_array( $pager, array( 'load_more_on_click', 'load_more_infinite_scroll' ), true ) ) {
		$settings                    = json_decode( (string) $element['settings'], true );
		$settings                    = is_array( $settings ) ? $settings : array();
		$settings['pagination_type'] = $pager;
		$element['settings']         = (string) wp_json_encode( $settings );
	}

	// The cards' look chosen in the sidebar that Elementor writes as CSS: the picture's
	// ratio and width, the details' separator, as custom properties.
	$ratio = (float) $attributes['imageRatio'];
	$vars  = '';
	if ( 'none' !== $thumbnail && $ratio > 0 && abs( $ratio - 0.66 ) > 0.001 ) {
		$vars .= '--harlow-posts-ratio:' . min( 2, $ratio ) . ';';
	}
	if ( 'cards' !== $skin && 'none' !== $thumbnail && (int) $attributes['imageWidth'] > 0 ) {
		$vars .= '--harlow-posts-image-width:' . min( 100, (int) $attributes['imageWidth'] ) . '%;';
	}
	$separator = harlow_theme_builder_css_text( $attributes['metaSeparator'] );
	if ( ( 'cards' === $skin ? '•' : '///' ) !== $separator ) {
		$vars .= '--harlow-posts-separator:"' . $separator . '";';
	}
	$container_classes = 'elementor-posts-container elementor-posts elementor-posts--skin-' . $skin . ' elementor-grid' . ( 'none' !== $thumbnail && $ratio > 0 ? ' elementor-has-item-ratio' : '' );

	// The pager, with the page's own address (before the cards set up their items).
	$pager_html = harlow_posts_pager( $attributes, $pager, $page, $max_pages );

	// The cards, and the terms they belong to for the filter bar.
	$cards = '';
	$terms = array();
	while ( $query->have_posts() ) {
		$query->the_post();
		$filter = array();
		if ( $attributes['filter'] ) {
			$item_terms = get_the_terms( get_the_ID(), sanitize_key( $attributes['filterTaxonomy'] ) );
			foreach ( is_array( $item_terms ) ? $item_terms : array() as $term ) {
				$terms[ $term->term_id ] = $term->name;
				$filter[]                = 'elementor-filter-' . $term->term_id;
			}
		}
		$cards .= "\n" . harlow_posts_card( $attributes, $skin, $thumbnail, $filter );
	}
	wp_reset_postdata();

	$inner = '';
	if ( $attributes['filter'] && $terms ) {
		asort( $terms );
		$inner .= '<ul class="elementor-portfolio__filters">' . "\n"
			. '<li class="elementor-portfolio__filter elementor-active" data-filter="__all" tabindex="0">' . esc_html( $attributes['filterAllText'] ) . '</li>' . "\n";
		foreach ( $terms as $id => $name ) {
			$inner .= '<li class="elementor-portfolio__filter" data-filter="' . (int) $id . '" tabindex="0">' . esc_html( $name ) . '</li>' . "\n";
		}
		$inner .= '</ul>' . "\n";
	}
	if ( '' === $cards ) {
		$nothing = (string) $attributes['nothingFound'];
		$inner  .= '' !== $nothing ? '<div class="elementor-posts-nothing-found">' . esc_html( $nothing ) . '</div>' . "\n" : '';
	} else {
		$inner .= '<div class="' . esc_attr( $container_classes ) . '"' . ( '' !== $vars ? ' style="' . esc_attr( $vars ) . '"' : '' ) . '>' . $cards . "\n" . '</div>' . "\n";
		$inner .= $pager_html;
	}

	return '<div' . harlow_element_attributes( $element, 'widget', $type . '.' . $skin_name ) . '>' . "\n"
		. '<div class="elementor-widget-container">' . "\n" . $inner . '</div>' . "\n"
		. '</div>';
}

/**
 * One card (an article of the list), in the loop: as the skin prints it.
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @param string              $skin       classic, cards or full_content.
 * @param string              $thumbnail  Where the picture is: top, left, right, none.
 * @param string[]            $filter     The filter bar's classes of the card's terms.
 * @return string
 */
function harlow_posts_card( $attributes, $skin, $thumbnail, $filter ) {
	$link    = esc_url( get_permalink() );
	$new_tab = $attributes['newTab'] ? ' target="_blank"' : '';
	$title   = wp_kses_post( get_the_title() );
	$tag     = in_array( $attributes['titleTag'], array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ), true ) ? $attributes['titleTag'] : 'h3';
	$size    = in_array( $attributes['imageSize'], array( 'thumbnail', 'medium', 'medium_large', 'large', 'full' ), true ) ? $attributes['imageSize'] : 'medium';

	$picture = '';
	if ( 'none' !== $thumbnail && has_post_thumbnail() ) {
		$picture = '<a class="elementor-post__thumbnail__link" href="' . $link . '" tabindex="-1"' . $new_tab . '>' . "\n"
			. '<div class="elementor-post__thumbnail">' . harlow_card_image( get_post_thumbnail_id(), $size ) . '</div>' . "\n"
			. '</a>' . "\n";
	}
	$heading = $attributes['showTitle']
		? '<' . $tag . ' class="elementor-post__title">' . "\n" . '<a href="' . $link . '"' . $new_tab . '>' . "\n" . $title . "\n" . '</a>' . "\n" . '</' . $tag . '>' . "\n"
		: '';
	$meta    = harlow_posts_meta( (array) $attributes['meta'] );
	$excerpt = $attributes['showExcerpt'] && 'full_content' !== $skin
		? '<div class="elementor-post__excerpt">' . "\n" . '<p>' . esc_html( harlow_card_text( max( 1, (int) $attributes['excerptLength'] ), '' ) ) . '</p>' . "\n" . '</div>' . "\n"
		: '';
	$more    = $attributes['showReadMore'] && 'full_content' !== $skin && '' !== $attributes['readMoreText']
		/* translators: %s: an item's title. */
		? '<a class="elementor-post__read-more" href="' . $link . '" aria-label="' . esc_attr( sprintf( __( 'Read more about %s', 'harlow' ), wp_strip_all_tags( get_the_title() ) ) ) . '" tabindex="-1"' . $new_tab . '>' . "\n" . esc_html( $attributes['readMoreText'] ) . "\n" . '</a>' . "\n"
		: '';
	$classes = array_merge( array( 'elementor-post', 'elementor-grid-item' ), $filter, get_post_class() );
	$article = '<article class="' . esc_attr( implode( ' ', $classes ) ) . '" role="listitem">' . "\n";

	if ( 'cards' === $skin ) {
		$badge = '';
		if ( $attributes['showBadge'] ) {
			$badge_terms = get_the_terms( get_the_ID(), sanitize_key( $attributes['badgeTaxonomy'] ) );
			if ( is_array( $badge_terms ) && $badge_terms ) {
				$badge = '<div class="elementor-post__badge">' . esc_html( $badge_terms[0]->name ) . '</div>' . "\n";
			}
		}
		$author = (int) get_the_author_meta( 'ID' );
		$avatar = $attributes['showAvatar'] ? '<div class="elementor-post__avatar">' . "\n" . get_avatar( $author, 128, '', get_the_author_meta( 'display_name', $author ) ) . "\n" . '</div>' . "\n" : '';
		return $article . '<div class="elementor-post__card">' . "\n"
			. $picture . $badge . $avatar
			. '<div class="elementor-post__text">' . "\n" . $heading . $excerpt . $more . '</div>' . "\n"
			. $meta
			. '</div>' . "\n" . '</article>';
	}
	if ( 'full_content' === $skin ) {
		// The item's whole text; never the page's own (it holds this list).
		$content = get_the_ID() === get_queried_object_id() || harlow_text_printing( (int) get_the_ID() )
			? '<p>' . esc_html( harlow_card_text( 55, '…' ) ) . '</p>'
			: apply_filters( 'the_content', get_the_content() ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- WordPress's own filter.
		return $article . $picture
			. '<div class="elementor-post__text">' . "\n" . $heading . $meta . $content . "\n" . '</div>' . "\n"
			. '</article>';
	}
	return $article . $picture
		. '<div class="elementor-post__text">' . "\n" . $heading . $meta . $excerpt . $more . '</div>' . "\n"
		. '</article>';
}

/**
 * A card's details: author, date, time, comments, the date it was changed.
 *
 * @param string[] $meta Which, in order.
 * @return string
 */
function harlow_posts_meta( $meta ) {
	$spans = '';
	foreach ( $meta as $item ) {
		switch ( $item ) {
			case 'author':
				$spans .= '<span class="elementor-post-author">' . "\n" . esc_html( get_the_author() ) . "\n" . '</span>' . "\n";
				break;
			case 'date':
				$spans .= '<span class="elementor-post-date">' . "\n" . esc_html( get_the_date() ) . "\n" . '</span>' . "\n";
				break;
			case 'modified':
				$spans .= '<span class="elementor-post-date">' . "\n" . esc_html( get_the_modified_date() ) . "\n" . '</span>' . "\n";
				break;
			case 'time':
				$spans .= '<span class="elementor-post-time">' . "\n" . esc_html( get_the_time() ) . "\n" . '</span>' . "\n";
				break;
			case 'comments':
				$count  = (int) get_comments_number();
				$words  = 0 === $count ? __( 'No Comments', 'harlow' ) : ( 1 === $count ? __( 'One Comment', 'harlow' ) : sprintf( /* translators: %s: how many comments. */ __( '%s Comments', 'harlow' ), number_format_i18n( $count ) ) );
				$spans .= '<span class="elementor-post-avatar">' . "\n" . esc_html( $words ) . "\n" . '</span>' . "\n";
				break;
		}
	}
	return '' !== $spans ? '<div class="elementor-post__meta-data">' . "\n" . $spans . '</div>' . "\n" : '';
}

/**
 * The pager under the cards: page numbers, previous and next, or load more (a button, or
 * on scroll), as Elementor Pro prints them.
 *
 * @param array<string,mixed> $attributes The block's attributes.
 * @param string              $pager      The kind of pager, '' for none.
 * @param int                 $page       The page shown.
 * @param int                 $max_pages  How many pages.
 * @return string
 */
function harlow_posts_pager( $attributes, $pager, $page, $max_pages ) {
	if ( '' === $pager || $max_pages < 2 ) {
		return '';
	}
	$anchor = '<div class="e-load-more-anchor" data-page="' . (int) $page . '" data-max-page="' . (int) $max_pages . '" data-next-page="' . esc_url( harlow_posts_page_link( $page + 1 ) ) . '"></div>' . "\n";
	if ( 'load_more_on_click' === $pager || 'load_more_infinite_scroll' === $pager ) {
		$spinner = '<span class="e-load-more-spinner">' . "\n" . harlow_theme_builder_icon( 'spinner' ) . "\n" . '</span>' . "\n";
		$button  = 'load_more_on_click' === $pager
			? '<div class="elementor-button-wrapper">' . "\n"
				. '<a href="#" class="elementor-button-link elementor-button" role="button">' . "\n"
				. '<span class="elementor-button-content-wrapper">' . "\n"
				. '<span class="elementor-button-text">' . esc_html( $attributes['loadMoreText'] ) . '</span>' . "\n"
				. '</span>' . "\n"
				. $spinner
				. '</a>' . "\n"
				. '</div>' . "\n"
			: $spinner;
		return $anchor . $button . '<div class="e-load-more-message">' . esc_html( $attributes['noMoreText'] ) . '</div>' . "\n";
	}
	$links = array();
	if ( 'prev_next' !== $pager ) {
		// The first page's address, then the rest of a page's (/2/, /page/2/, ?page=2).
		$first   = harlow_posts_page_link( 1 );
		$base    = false === strpos( $first, '?' ) ? trailingslashit( $first ) : $first;
		$numbers = paginate_links(
			array(
				'base'               => $base . '%_%',
				'format'             => str_replace( array( $base, '999999999' ), array( '', '%#%' ), harlow_posts_page_link( 999999999 ) ),
				'current'            => $page,
				'total'              => $max_pages,
				'prev_next'          => false,
				'show_all'           => ! $attributes['shorten'],
				'type'               => 'array',
				'before_page_number' => '<span class="elementor-screen-only">' . esc_html__( 'Page', 'harlow' ) . '</span>',
			)
		);
		$links   = is_array( $numbers ) ? $numbers : array();
	}
	if ( 'numbers' !== $pager ) {
		$prev  = $page > 1
			? '<a class="page-numbers prev" href="' . esc_url( harlow_posts_page_link( $page - 1 ) ) . '">' . esc_html( $attributes['prevLabel'] ) . '</a>'
			: '<span class="page-numbers prev">' . esc_html( $attributes['prevLabel'] ) . '</span>';
		$next  = $page < $max_pages
			? '<a class="page-numbers next" href="' . esc_url( harlow_posts_page_link( $page + 1 ) ) . '">' . esc_html( $attributes['nextLabel'] ) . '</a>'
			: '<span class="page-numbers next">' . esc_html( $attributes['nextLabel'] ) . '</span>';
		$links = array_merge( array( $prev ), $links, array( $next ) );
	}
	return $anchor . '<nav class="elementor-pagination" aria-label="' . esc_attr__( 'Pagination', 'harlow' ) . '">' . "\n" . implode( "\n", $links ) . "\n" . '</nav>' . "\n";
}

/**
 * A page holding a posts list keeps its pager's pages (/blog/2/): WordPress would send
 * /blog/2/ back to /blog/, the page's own text having one page.
 *
 * @param string|false $redirect Where WordPress would send the visitor.
 * @return string|false
 */
function harlow_posts_keep_pages( $redirect ) {
	if ( is_singular() && (int) get_query_var( 'page' ) > 1 && harlow_posts_on( get_queried_object_id() ) ) {
		return false;
	}
	return $redirect;
}
add_filter( 'redirect_canonical', 'harlow_posts_keep_pages' );

/**
 * The pager's pages of a page holding a posts list are found (200): WordPress answers 404
 * for /blog/2/ because the page's own text is not split into pages.
 *
 * @param bool     $handled Whether the request was dealt with already.
 * @param WP_Query $query   The main query.
 * @return bool
 */
function harlow_posts_pages_found( $handled, $query ) {
	if ( $query->is_singular() && (int) $query->get( 'page' ) > 1 && $query->posts && harlow_posts_on( $query->posts[0] ) ) {
		status_header( 200 );
		return true;
	}
	return $handled;
}
add_filter( 'pre_handle_404', 'harlow_posts_pages_found', 10, 2 );

/**
 * Does a page hold a posts list with a pager?
 *
 * @param int|WP_Post $post The page.
 * @return bool
 */
function harlow_posts_on( $post ) {
	$content = (string) get_post_field( 'post_content', $post );
	return ( has_block( 'harlow/posts', $content ) || has_block( 'harlow/archive-posts', $content ) ) && false !== strpos( $content, '"pagination":"' );
}
