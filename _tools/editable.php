<?php
/**
 * The owner's test, inside WordPress (run by verify_editable.py, which copies this file to
 * _env/ and calls `wp eval-file /env/verify-editable.php <step>` as the administrator).
 *
 *   mark        every field of every block of every page, of the major clients' synced
 *               pattern, and of every item turned into a marker; what each page and item was
 *               written down first (/env/editable/kept.json). Nothing is saved here: the
 *               marked pages and items are handed back, and the check saves them through the
 *               REST API as the editor does.
 *   back        everything written down put back, the marker pictures and the revisions the
 *               saves made deleted, the modification times put back.
 *   seo         every page's and item's Rank Math fields turned into markers (and seo-back).
 *   keep-slugs  the addresses, old addresses and Rank Math redirections, before the
 *               addresses are changed (and slugs-back, after).
 *
 * Markers are `Zx<5 digits>x`: a word becomes one, a link https://probe.example/<marker>, a
 * picture a picture of the Media Library named after one, an icon an SVG carrying one as
 * its class, a date a day of the year 19NN.
 *
 * @package Harlow
 */

// phpcs:ignoreFile -- a check run by WP-CLI, not part of the theme.

$what  = isset( $args[0] ) ? $args[0] : '';
$store = '/env/editable';
$input = file_exists( '/env/verify-editable.json' ) ? json_decode( file_get_contents( '/env/verify-editable.json' ), true ) : array();
$out   = array();

$GLOBALS['vx'] = array(
	'n'        => 0,
	'markers'  => array(),
	'pictures' => array(),
	'post'     => 0,
	'styled'   => isset( $input['styled'] ) ? (array) $input['styled'] : array(),
);

/** A new marker, written down with what it replaced. */
function vx_mark( $kind, $block, $attr, $was ) {
	$marker                               = sprintf( 'Zx%05dx', ++$GLOBALS['vx']['n'] );
	$GLOBALS['vx']['markers'][ $marker ] = array(
		'kind'  => $kind,
		'post'  => $GLOBALS['vx']['post'],
		'block' => $block,
		'attr'  => $attr,
		'was'   => mb_substr( trim( wp_strip_all_tags( is_scalar( $was ) ? (string) $was : wp_json_encode( $was ) ) ), 0, 80 ),
	);
	return $marker;
}

/** A picture of the Media Library named after a new marker: its id. */
function vx_picture( $block, $attr, $was, $from = '', $width = 4, $height = 4 ) {
	$marker = vx_mark( 'picture', $block, $attr, $was );
	$dir    = wp_get_upload_dir();
	wp_mkdir_p( $dir['basedir'] . '/probe' );
	$file = $dir['basedir'] . '/probe/' . $marker . '.png';
	if ( '' !== $from && file_exists( $from ) ) {
		// A picture the check made, as large as it says (a share picture Rank Math accepts).
		copy( $from, $file );
	} else {
		// A 4 x 4 grey PNG.
		file_put_contents( $file, base64_decode( 'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEklEQVR4nGNgYGD4z8DAwMDAAAAJAAH+jsj4AAAAAElFTkSuQmCC' ) );
		$width  = 4;
		$height = 4;
	}
	$id = wp_insert_attachment(
		array(
			'post_title'     => $marker,
			'post_mime_type' => 'image/png',
			'post_status'    => 'inherit',
		),
		$file
	);
	wp_update_attachment_metadata( $id, array( 'width' => $width, 'height' => $height, 'file' => 'probe/' . $marker . '.png', 'sizes' => array() ) );
	update_post_meta( $id, '_wp_attachment_image_alt', $marker );
	$GLOBALS['vx']['pictures'][] = $id;
	return $id;
}

function vx_link( $block, $attr, $was ) {
	return 'https://probe.example/' . vx_mark( 'link', $block, $attr, $was );
}

function vx_icon( $block, $attr, $was ) {
	return '<svg class="' . vx_mark( 'icon', $block, $attr, $was ) . '" aria-hidden="true" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h8v8H0z"></path></svg>';
}

/*
 * Markup the owner types (the words of a paragraph, a list, an HTML element): every run of
 * text, every link and picture; and an element a stylesheet gives a background picture
 * by its class gets one in its own style, as the owner would write it in the HTML.
 */
function vx_markup( $block, $markup ) {
	$parts = preg_split( '#(<(script|style)\b.*?</\2>)#is', $markup, -1, PREG_SPLIT_DELIM_CAPTURE );
	$done  = '';
	for ( $i = 0; $i < count( $parts ); $i++ ) {
		if ( preg_match( '#^<(script|style)\b#i', $parts[ $i ] ) ) {
			$done .= $parts[ $i ];
			++$i; // The captured tag name.
			continue;
		}
		$chunk = preg_replace_callback(
			'/(^|>)([^<>]+)(?=<|$)/',
			function ( $m ) use ( $block ) {
				$text = html_entity_decode( $m[2], ENT_QUOTES | ENT_HTML5, 'UTF-8' );
				if ( ! preg_match( '/[\p{L}\p{N}]/u', $text ) ) {
					return $m[0];
				}
				return $m[1] . vx_mark( 'word', $block, 'markup', $text );
			},
			$parts[ $i ]
		);
		$chunk = preg_replace_callback(
			'/(\s)(alt|title)="([^"]*)"/',
			function ( $m ) use ( $block ) {
				return $m[1] . $m[2] . '="' . vx_mark( 'alt', $block, $m[2], $m[3] ) . '"';
			},
			$chunk
		);
		$chunk = preg_replace_callback(
			'/(\s)(href|src|poster|srcset)="([^"]*)"/',
			function ( $m ) use ( $block ) {
				if ( 'href' === $m[2] ) {
					return $m[1] . 'href="' . vx_link( $block, 'href', $m[3] ) . '"';
				}
				$url = wp_get_attachment_url( vx_picture( $block, $m[2], $m[3] ) );
				return $m[1] . $m[2] . '="' . $url . ( 'srcset' === $m[2] ? ' 4w' : '' ) . '"';
			},
			$chunk
		);
		if ( $GLOBALS['vx']['styled'] ) {
			$chunk = preg_replace_callback(
				'/<([a-z][a-z0-9]*)(\s[^>]*?\bclass="([^"]*)"[^>]*)>/i',
				function ( $m ) use ( $block ) {
					$classes = preg_split( '/\s+/', $m[3] );
					if ( ! array_intersect( $classes, $GLOBALS['vx']['styled'] ) || false !== strpos( $m[2], 'style=' ) ) {
						return $m[0];
					}
					$url = wp_get_attachment_url( vx_picture( $block, 'style', implode( ' ', array_intersect( $classes, $GLOBALS['vx']['styled'] ) ) ) );
					return '<' . $m[1] . $m[2] . ' style="background-image: url(' . $url . ')">';
				},
				$chunk
			);
		}
		$done .= $chunk;
	}
	return $done;
}

/** Each field of a block of the theme, the empty ones too. */
function vx_attrs( $name, $attrs ) {
	$short = substr( $name, strlen( 'harlow/' ) );
	$id    = isset( $attrs['element'] ) ? $attrs['element'] : $short;
	$where = $short . ' ' . $id;
	$item  = function ( $items, $fields ) use ( $where ) {
		foreach ( (array) $items as $n => $one ) {
			foreach ( $fields as $field ) {
				$was = isset( $one[ $field ] ) ? $one[ $field ] : '';
				if ( 'link' === $field ) {
					$items[ $n ][ $field ] = vx_link( $where, "items.$field", $was );
				} elseif ( 'icon' === $field ) {
					$items[ $n ][ $field ] = vx_icon( $where, "items.$field", $was );
				} else {
					$items[ $n ][ $field ] = vx_mark( 'word', $where, "items.$field", $was );
				}
			}
		}
		return $items;
	};
	switch ( $short ) {
		case 'heading':
			if ( '' === $attrs['source'] ) {
				$attrs['text'] = vx_mark( 'word', $where, 'text', $attrs['text'] );
			}
			break;
		case 'button':
			$attrs['text'] = vx_mark( 'word', $where, 'text', $attrs['text'] );
			$attrs['link'] = vx_link( $where, 'link', $attrs['link'] );
			if ( $attrs['hasIcon'] ) {
				$attrs['icon'] = vx_icon( $where, 'icon', $attrs['icon'] );
			}
			$attrs['picture'] = vx_picture( $where, 'picture', $attrs['picture'] );
			break;
		case 'image':
			if ( '' === $attrs['source'] ) {
				$attrs['image'] = vx_picture( $where, 'image', $attrs['image'] ? $attrs['image'] : $attrs['src'] );
				$attrs['src']   = wp_get_attachment_url( $attrs['image'] );
			}
			$attrs['alt']   = vx_mark( 'alt', $where, 'alt', $attrs['alt'] );
			$attrs['title'] = vx_mark( 'title', $where, 'title', $attrs['title'] );
			$attrs['link']  = vx_link( $where, 'link', $attrs['link'] );
			break;
		case 'icon-list':
			$attrs['items'] = $item( $attrs['items'], array( 'text', 'link', 'icon' ) );
			break;
		case 'social-icons':
			$attrs['items'] = $item( $attrs['items'], array( 'label', 'link', 'icon' ) );
			break;
		case 'container':
			$attrs['video'] = vx_link( $where, 'video', $attrs['video'] );
			if ( array_key_exists( 'picture', $attrs ) ) {
				$attrs['picture'] = vx_picture( $where, 'picture', $attrs['picture'] );
			}
			break;
		case 'gallery':
			if ( '' === $attrs['source'] ) {
				$count             = max( 1, count( (array) $attrs['pictures'] ) );
				$attrs['pictures'] = array();
				for ( $n = 0; $n < $count; $n++ ) {
					$attrs['pictures'][] = vx_picture( $where, 'pictures', '' );
				}
			}
			break;
		case 'accordion':
			$attrs['iconClosed'] = vx_icon( $where, 'iconClosed', $attrs['iconClosed'] );
			$attrs['iconOpened'] = vx_icon( $where, 'iconOpened', $attrs['iconOpened'] );
			break;
		case 'accordion-item':
			$attrs['title'] = vx_mark( 'word', $where, 'title', $attrs['title'] );
			break;
		case 'icon':
			$attrs['icon'] = vx_icon( $where, 'icon', $attrs['icon'] );
			break;
		case 'html':
		case 'markup':
			$attrs['html'] = vx_markup( $where, $attrs['html'] );
			break;
		case 'shortcode':
			if ( '' === $attrs['shortcode'] ) {
				$attrs['html'] = vx_markup( $where, $attrs['html'] );
			}
			break;
		case 'loop':
			// The parts of a card a list sets, on the cards that have them (blocks/loop/edit.js).
			$cards = array(
				'post-card'      => array( 'more', 'badge', 'moreArrow' ),
				'business-model' => array( 'more', 'moreArrow' ),
				'project'        => array( 'more' ),
				'person'         => array( 'more' ),
				'job'            => array( 'more' ),
			);
			foreach ( isset( $cards[ $attrs['template'] ] ) ? $cards[ $attrs['template'] ] : array() as $part ) {
				$attrs[ $part ] = 'more' === $part ? vx_mark( 'word', $where, $part, $attrs[ $part ] ) : vx_picture( $where, $part, $attrs[ $part ] );
			}
			if ( 'carousel' === $attrs['layout'] ) {
				$attrs['iconPrevious'] = vx_icon( $where, 'iconPrevious', $attrs['iconPrevious'] );
				$attrs['iconNext']     = vx_icon( $where, 'iconNext', $attrs['iconNext'] );
			}
			break;
	}
	return $attrs;
}

function vx_walk( array $blocks ) {
	$registry = WP_Block_Type_Registry::get_instance();
	foreach ( $blocks as $i => $block ) {
		if ( empty( $block['blockName'] ) || 'core/block' === $block['blockName'] ) {
			continue;
		}
		if ( 0 === strpos( $block['blockName'], 'harlow/' ) ) {
			$type  = $registry->get_registered( $block['blockName'] );
			$attrs = (array) $block['attrs'];
			foreach ( $type ? $type->attributes : array() as $key => $schema ) {
				if ( ! array_key_exists( $key, $attrs ) ) {
					$attrs[ $key ] = array_key_exists( 'default', $schema ) ? $schema['default'] : null;
				}
			}
			$changed = vx_attrs( $block['blockName'], $attrs );
			foreach ( $changed as $key => $value ) {
				if ( array_key_exists( $key, $block['attrs'] ) || ( isset( $type->attributes[ $key ]['default'] ) ? $type->attributes[ $key ]['default'] : null ) !== $value ) {
					$block['attrs'][ $key ] = $value;
				}
			}
		} else {
			foreach ( $block['innerContent'] as $j => $chunk ) {
				if ( is_string( $chunk ) ) {
					$block['innerContent'][ $j ] = vx_markup( $block['blockName'], $chunk );
				}
			}
		}
		$block['innerBlocks'] = vx_walk( $block['innerBlocks'] );
		$blocks[ $i ]         = $block;
	}
	return $blocks;
}

/*
 * A record is written with the install it was made on (the moment the administrator was
 * made, which a rebuild makes anew): a record left by a run that died before a rebuild names
 * ids that are other posts now, and is dropped rather than put back.
 */
function vx_site() {
	$admins = get_users( array( 'role' => 'administrator', 'number' => 1 ) );
	return $admins ? $admins[0]->user_registered : '';
}

function vx_keep( $file, $data ) {
	wp_mkdir_p( dirname( $file ) );
	file_put_contents( $file, wp_json_encode( array( 'site' => vx_site(), 'data' => $data ) ) );
}

function vx_kept( $file ) {
	if ( ! file_exists( $file ) ) {
		return null;
	}
	$kept = json_decode( file_get_contents( $file ), true );
	if ( ! is_array( $kept ) || ! isset( $kept['site'] ) || vx_site() !== $kept['site'] ) {
		unlink( $file );
		$GLOBALS['vx']['dropped'] = basename( $file );
		return null;
	}
	return $kept['data'];
}

function vx_pages() {
	return get_posts( array( 'post_type' => 'page', 'post_status' => 'publish', 'numberposts' => -1, 'orderby' => 'ID', 'order' => 'ASC' ) );
}

function vx_items() {
	$types = array_values( array_unique( wp_list_pluck( harlow_site_data( 'items.json' )['items'], 'type' ) ) );
	return get_posts( array( 'post_type' => $types, 'post_status' => 'publish', 'numberposts' => -1, 'orderby' => 'ID', 'order' => 'ASC' ) );
}

/** The fields of an item's box that a visitor sees, by their kind. */
function vx_item_meta( $type ) {
	$keys = array();
	foreach ( get_registered_meta_keys( 'post', $type ) as $key => $args ) {
		if ( 0 === strpos( $key, '_harlow_' ) && '_harlow_element' !== $key && ! empty( $args['show_in_rest'] ) ) {
			$keys[ $key ] = $args['type'];
		}
	}
	return $keys;
}

$seo_keys = array(
	'rank_math_title', 'rank_math_description', 'rank_math_focus_keyword', 'rank_math_robots', 'rank_math_canonical_url',
	'rank_math_facebook_title', 'rank_math_facebook_description', 'rank_math_facebook_image', 'rank_math_facebook_image_id',
	'rank_math_twitter_use_facebook', 'rank_math_twitter_title', 'rank_math_twitter_description',
	'rank_math_twitter_image', 'rank_math_twitter_image_id', 'rank_math_twitter_card_type',
);

switch ( $what ) {
	case 'mark':
		if ( null !== vx_kept( "$store/kept.json" ) ) {
			$out['__error'] = 'a run left its changes: put them back first (back)';
			break;
		}
		global $wpdb;
		$kept = array(
			'max_id'   => (int) $wpdb->get_var( "SELECT MAX(ID) FROM {$wpdb->posts}" ),
			'posts'    => array(),
			'pictures' => array(),
		);
		// The pages, the major clients' synced pattern and the item page templates' patterns.
		$shared  = harlow_shared_section_id();
		$targets = array_merge( vx_pages(), $shared ? array( get_post( $shared ) ) : array() );
		foreach ( array_keys( harlow_single_templates() ) as $template ) {
			if ( harlow_single_template_id( $template ) ) {
				$targets[] = get_post( harlow_single_template_id( $template ) );
			}
		}
		$items    = vx_items();
		foreach ( array_merge( $targets, $items ) as $post ) {
			$meta = array();
			foreach ( array_merge( array( '_thumbnail_id' => 'integer' ), vx_item_meta( $post->post_type ) ) as $key => $kind ) {
				$meta[ $key ] = metadata_exists( 'post', $post->ID, $key ) ? get_post_meta( $post->ID, $key, true ) : null;
			}
			$kept['posts'][ $post->ID ] = array(
				'post_title'        => $post->post_title,
				'post_content'      => $post->post_content,
				'post_excerpt'      => $post->post_excerpt,
				'post_date'         => $post->post_date,
				'post_date_gmt'     => $post->post_date_gmt,
				'post_modified'     => $post->post_modified,
				'post_modified_gmt' => $post->post_modified_gmt,
				'meta'              => $meta,
			);
		}
		vx_keep( "$store/kept.json", $kept );

		$out['pages'] = array();
		foreach ( $targets as $post ) {
			$GLOBALS['vx']['post'] = $post->ID;
			$out['pages'][ $post->ID ] = array(
				'type'    => $post->post_type,
				'name'    => (string) get_post_meta( $post->ID, '_harlow_name', true ),
				'content' => serialize_blocks( vx_walk( parse_blocks( $post->post_content ) ) ),
			);
		}
		$out['items'] = array();
		$year         = 1900;
		foreach ( $items as $post ) {
			$GLOBALS['vx']['post'] = $post->ID;
			$type                  = get_post_type_object( $post->post_type );
			$data                  = array( 'title' => vx_mark( 'word', $post->post_type, 'title', $post->post_title ) );
			if ( post_type_supports( $post->post_type, 'editor' ) ) {
				$data['content'] = vx_markup( $post->post_type, $post->post_content );
			}
			// An empty excerpt is left on every other item, and on every item of a type without
			// pages (its text shows only on its card): a card then shows the first words of the
			// text, as live's cards do (none of live's items has an excerpt).
			if ( post_type_supports( $post->post_type, 'excerpt' ) && isset( HARLOW_SINGLES[ $post->post_type ] ) && ( '' !== $post->post_excerpt || $year % 2 ) ) {
				$data['excerpt'] = vx_mark( 'word', $post->post_type, 'excerpt', $post->post_excerpt );
			}
			if ( post_type_supports( $post->post_type, 'thumbnail' ) ) {
				$data['featured_media'] = vx_picture( $post->post_type, 'featured', get_post_thumbnail_id( $post ) );
			}
			// A date, where a page shows one (posts and news): a day of a year of its own, which
			// the page prints in its own format.
			++$year;
			if ( in_array( $post->post_type, array( 'post', 'news' ), true ) ) {
				$data['date']                             = sprintf( '%d-%02d-%02dT10:00:00', $year, 1 + $year % 12, 1 + $year % 28 );
				$GLOBALS['vx']['markers'][ 'Y' . $year ] = array( 'kind' => 'date', 'post' => $post->ID, 'block' => $post->post_type, 'attr' => 'date', 'was' => $post->post_date );
			}
			$data['meta'] = array();
			foreach ( vx_item_meta( $post->post_type ) as $key => $kind ) {
				$was = get_post_meta( $post->ID, $key, true );
				if ( '_harlow_link' === $key ) {
					// A business model's page: another page of the site, its address the marker.
					$pages                = wp_list_pluck( vx_pages(), 'ID' );
					$to                   = $pages[ ( array_search( $post->ID, wp_list_pluck( $items, 'ID' ), true ) * 3 ) % count( $pages ) ];
					$data['meta'][ $key ] = $to;
					$GLOBALS['vx']['markers'][ 'L' . $post->ID ] = array( 'kind' => 'page-link', 'post' => $post->ID, 'block' => $post->post_type, 'attr' => $key, 'was' => $was, 'href' => get_permalink( $to ) );
				} elseif ( 'integer' === $kind ) {
					$data['meta'][ $key ] = vx_picture( $post->post_type, $key, $was );
				} elseif ( 'array' === $kind ) {
					$data['meta'][ $key ] = array();
					for ( $n = 0; $n < max( 1, count( (array) $was ) ); $n++ ) {
						$data['meta'][ $key ][] = vx_picture( $post->post_type, $key, '' );
					}
				} else {
					$data['meta'][ $key ] = vx_mark( 'word', $post->post_type, $key, $was );
				}
			}
			$out['items'][ $post->ID ] = array(
				'type' => $post->post_type,
				'base' => $type->rest_base ? $type->rest_base : $post->post_type,
				'name' => (string) get_post_meta( $post->ID, '_harlow_name', true ),
				'data' => $data,
			);
		}
		$kept['pictures'] = $GLOBALS['vx']['pictures'];
		vx_keep( "$store/kept.json", $kept );
		$out['markers'] = $GLOBALS['vx']['markers'];
		$out['forms']   = array();
		foreach ( get_posts( array( 'post_type' => 'wpcf7_contact_form', 'numberposts' => -1 ) ) as $form ) {
			$out['forms'][ $form->ID ] = (string) get_post_meta( $form->ID, '_form', true );
		}
		break;

	case 'back':
		global $wpdb;
		$kept = vx_kept( "$store/kept.json" );
		if ( null === $kept ) {
			$out['__nothing'] = true;
			break;
		}
		add_filter( 'wp_revisions_to_keep', '__return_zero', 99 );
		kses_remove_filters();
		foreach ( $kept['posts'] as $id => $was ) {
			$id = (int) $id;
			wp_update_post(
				wp_slash(
					array(
						'ID'            => $id,
						'post_title'    => $was['post_title'],
						'post_content'  => $was['post_content'],
						'post_excerpt'  => $was['post_excerpt'],
						'post_date'     => $was['post_date'],
						'post_date_gmt' => $was['post_date_gmt'],
						'edit_date'     => true,
					)
				)
			);
			foreach ( $was['meta'] as $key => $value ) {
				if ( null === $value ) {
					delete_post_meta( $id, $key );
				} else {
					update_post_meta( $id, $key, $value );
				}
			}
			$wpdb->update( $wpdb->posts, array( 'post_modified' => $was['post_modified'], 'post_modified_gmt' => $was['post_modified_gmt'] ), array( 'ID' => $id ) );
			clean_post_cache( $id );
			$now        = get_post( $id );
			$out[ $id ] = $now->post_content === $was['post_content'] && $now->post_title === $was['post_title']
				&& $now->post_excerpt === $was['post_excerpt'] && $now->post_date === $was['post_date'];
		}
		kses_init();
		foreach ( $kept['pictures'] as $picture ) {
			wp_delete_attachment( (int) $picture, true );
		}
		$dir = wp_get_upload_dir();
		array_map( 'unlink', (array) glob( $dir['basedir'] . '/probe/*' ) );
		if ( is_dir( $dir['basedir'] . '/probe' ) ) {
			rmdir( $dir['basedir'] . '/probe' );
		}
		// The revisions the saves made.
		foreach ( $wpdb->get_col( $wpdb->prepare( "SELECT ID FROM {$wpdb->posts} WHERE post_type = 'revision' AND ID > %d", $kept['max_id'] ) ) as $revision ) {
			wp_delete_post_revision( (int) $revision );
		}
		unlink( "$store/kept.json" );
		break;

	case 'seo':
		// Two rounds: every field (the robots left indexed, or Rank Math leaves the
		// canonical out), then the robots too.
		$was = vx_kept( "$store/seo.json" );
		if ( null === $was ) {
			$kept = array();
			foreach ( array_merge( vx_pages(), vx_items() ) as $post ) {
				foreach ( $seo_keys as $key ) {
					$kept[ $post->ID ][ $key ] = metadata_exists( 'post', $post->ID, $key ) ? get_post_meta( $post->ID, $key, true ) : null;
				}
			}
			vx_keep( "$store/seo.json", array( 'meta' => $kept, 'pictures' => array() ) );
			// Rank Math leaves out a share picture too small to share: 1200 x 630, as the check made them.
			$share = array(
				1 => vx_picture( 'seo', 'facebook', '', "$store/share-1.png", 1200, 630 ),
				2 => vx_picture( 'seo', 'twitter', '', "$store/share-2.png", 1200, 630 ),
			);
			vx_keep( "$store/seo.json", array( 'meta' => $kept, 'pictures' => array_values( $share ) ) );
		} else {
			$share = array( 1 => (int) $was['pictures'][0], 2 => (int) $was['pictures'][1] );
		}
		foreach ( array_merge( vx_pages(), vx_items() ) as $post ) {
			$id   = $post->ID;
			$mark = function ( $part ) use ( $id ) {
				return sprintf( 'Zs%05d%sx', $id, $part );
			};
			update_post_meta( $id, 'rank_math_title', $mark( 't' ) );
			update_post_meta( $id, 'rank_math_description', $mark( 'd' ) );
			update_post_meta( $id, 'rank_math_focus_keyword', $mark( 'k' ) );
			update_post_meta( $id, 'rank_math_facebook_title', $mark( 'ft' ) );
			update_post_meta( $id, 'rank_math_facebook_description', $mark( 'fd' ) );
			update_post_meta( $id, 'rank_math_facebook_image_id', $share[1] );
			update_post_meta( $id, 'rank_math_facebook_image', wp_get_attachment_url( $share[1] ) );
			update_post_meta( $id, 'rank_math_twitter_use_facebook', 'off' );
			update_post_meta( $id, 'rank_math_twitter_title', $mark( 'tt' ) );
			update_post_meta( $id, 'rank_math_twitter_description', $mark( 'td' ) );
			update_post_meta( $id, 'rank_math_twitter_image_id', $share[2] );
			update_post_meta( $id, 'rank_math_twitter_image', wp_get_attachment_url( $share[2] ) );
			update_post_meta( $id, 'rank_math_twitter_card_type', 'summary' );
			update_post_meta( $id, 'rank_math_canonical_url', 'https://probe.example/' . $mark( 'c' ) );
			if ( ! empty( $input['robots'] ) ) {
				update_post_meta( $id, 'rank_math_robots', array( 'noindex', 'nofollow' ) );
			}
			$out[ $id ] = array(
				'facebook' => wp_get_attachment_url( $share[1] ),
				'twitter'  => wp_get_attachment_url( $share[2] ),
				'url'      => get_permalink( $post ),
				'type'     => $post->post_type,
			);
		}
		break;

	case 'keep':
		// Before the kinds and addresses parts: what their saves change besides what they
		// set (modification times, revisions, old addresses, Rank Math's redirections, the
		// typed menu links that follow an address).
		global $wpdb;
		if ( null !== vx_kept( "$store/snapshot.json" ) ) {
			$out['__error'] = 'a run left its changes: put them back first (--back)';
			break;
		}
		$posts = array();
		foreach ( array_merge( vx_pages(), vx_items() ) as $post ) {
			$posts[ $post->ID ] = array(
				'name'     => $post->post_name,
				'template' => (string) get_post_meta( $post->ID, '_wp_page_template', true ),
				'modified' => array( $post->post_modified, $post->post_modified_gmt ),
				'old'      => get_post_meta( $post->ID, '_wp_old_slug', false ),
				'url'      => get_permalink( $post ),
				'type'     => $post->post_type,
				'base'     => get_post_type_object( $post->post_type )->rest_base ? get_post_type_object( $post->post_type )->rest_base : $post->post_type,
				'title'    => $post->post_title,
			);
		}
		$links = array();
		foreach ( get_posts( array( 'post_type' => 'nav_menu_item', 'numberposts' => -1, 'post_status' => 'any' ) ) as $item ) {
			$links[ $item->ID ] = (string) get_post_meta( $item->ID, '_menu_item_url', true );
		}
		$table = $wpdb->prefix . 'rank_math_redirections';
		vx_keep(
			"$store/snapshot.json",
			array(
				'max_id'      => (int) $wpdb->get_var( "SELECT MAX(ID) FROM {$wpdb->posts}" ),
				'posts'       => $posts,
				'links'       => $links,
				'redirection' => (int) $wpdb->get_var( "SELECT COALESCE(MAX(id), 0) FROM $table" ),
			)
		);
		$out = array(
			'posts' => $posts,
			'kinds' => array_map(
				function ( $kind ) {
					return 'kind-' . strtolower( $kind );
				},
				array_keys( harlow_kinds()['pages'] )
			),
		);
		break;

	case 'restore':
		global $wpdb;
		$kept = vx_kept( "$store/snapshot.json" );
		if ( null === $kept ) {
			$out['__nothing'] = true;
			break;
		}
		foreach ( $kept['posts'] as $id => $was ) {
			$id = (int) $id;
			if ( get_post_field( 'post_name', $id ) !== $was['name'] ) {
				wp_update_post( array( 'ID' => $id, 'post_name' => $was['name'] ) );
			}
			if ( 'page' === $was['type'] && (string) get_post_meta( $id, '_wp_page_template', true ) !== $was['template'] ) {
				update_post_meta( $id, '_wp_page_template', $was['template'] );
			}
			delete_post_meta( $id, '_wp_old_slug' );
			foreach ( $was['old'] as $old ) {
				add_post_meta( $id, '_wp_old_slug', $old );
			}
			$wpdb->update( $wpdb->posts, array( 'post_modified' => $was['modified'][0], 'post_modified_gmt' => $was['modified'][1] ), array( 'ID' => $id ) );
			clean_post_cache( $id );
			$out[ $id ] = get_post_field( 'post_name', $id ) === $was['name'] && get_permalink( $id ) === $was['url'];
		}
		foreach ( $kept['links'] as $id => $url ) {
			update_post_meta( (int) $id, '_menu_item_url', $url );
		}
		$table = $wpdb->prefix . 'rank_math_redirections';
		$wpdb->query( $wpdb->prepare( "DELETE FROM $table WHERE id > %d", $kept['redirection'] ) );
		$wpdb->query( "DELETE FROM {$wpdb->prefix}rank_math_redirections_cache WHERE redirection_id NOT IN ( SELECT id FROM $table )" );
		foreach ( $wpdb->get_col( $wpdb->prepare( "SELECT ID FROM {$wpdb->posts} WHERE post_type = 'revision' AND ID > %d", $kept['max_id'] ) ) as $revision ) {
			wp_delete_post_revision( (int) $revision );
		}
		unlink( "$store/snapshot.json" );
		break;

	case 'seo-back':
		$kept = vx_kept( "$store/seo.json" );
		foreach ( (array) ( $kept ? $kept['meta'] : array() ) as $id => $meta ) {
			foreach ( $meta as $key => $value ) {
				if ( null === $value ) {
					delete_post_meta( (int) $id, $key );
				} else {
					update_post_meta( (int) $id, $key, $value );
				}
			}
			$out[ $id ] = true;
		}
		foreach ( (array) ( $kept ? $kept['pictures'] : array() ) as $picture ) {
			wp_delete_attachment( (int) $picture, true );
		}
		$dir = wp_get_upload_dir();
		array_map( 'unlink', (array) glob( $dir['basedir'] . '/probe/*' ) );
		if ( file_exists( "$store/seo.json" ) ) {
			unlink( "$store/seo.json" );
		}
		break;
}

if ( ! empty( $GLOBALS['vx']['dropped'] ) ) {
	$out['__dropped'] = $GLOBALS['vx']['dropped'];
}
echo 'HARLOW-JSON' . wp_json_encode( $out );
