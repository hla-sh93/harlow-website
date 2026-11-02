<?php
/**
 * The site-wide features of the theme, set up and put back for verify_site_features.py, run
 * by WP-CLI as the site's administrator: `wp eval-file /env/verify-site-features.php <step>`.
 *
 *   set      every Site setting given a test value; Theme Builder templates of every kind
 *            with their conditions; a popup; what was there before kept in an option
 *   expect   what the settings' CSS must hold, and the dynamic tags, the role manager and a
 *            list's card as PHP prints them
 *   on       maintenance mode on, showing the about page
 *   restore  everything put back as it was
 *
 * It prints HARLOW-JSON and its result.
 *
 * @package Harlow
 */

$step = isset( $args[0] ) ? $args[0] : '';
$keep = 'harlow_verify_site_features';
$out  = array();

/**
 * A test value for a setting of a type, different for each setting.
 *
 * @param string $type The setting's type.
 * @param int    $n    The setting's number.
 * @return string
 */
function harlow_verify_value( $type, $n ) {
	switch ( $type ) {
		case 'color':
			return sprintf( '#%02x%02x%02x', 16 + $n % 200, 40 + ( $n * 7 ) % 200, 80 + ( $n * 13 ) % 170 );
		case 'px':
			return (string) ( 10 + $n );
		case 'em':
			return '1.' . ( $n % 9 + 1 );
		case 'number':
			return '0.' . ( $n % 8 + 1 );
		case 'font':
			return 'Roboto';
		case 'weight':
			return '700';
		case 'transform':
			return 'uppercase';
		case 'line':
			return 'dashed';
		case 'shown':
			return 'none';
		case 'entrance':
			return 'harlow-transition-slide-out-up';
		case 'exit':
			return 'harlow-transition-zoom-in';
		case 'preloader':
			return 'harlow-preloader-spin';
		case 'ms':
			return (string) ( 300 + $n );
	}
	return '';
}

if ( 'set' === $step ) {
	$saved = array( 'mods' => array() );
	$n     = 0;
	foreach ( harlow_site_settings() as $key => $setting ) {
		$saved['mods'][ $key ] = get_theme_mod( 'harlow_style_' . $key, null );
		$value                 = harlow_verify_value( $setting['type'], ++$n );
		if ( '' !== $value && ! empty( $setting['css'] ) ) {
			set_theme_mod( 'harlow_style_' . $key, $value );
		}
	}
	// The page transition stays on (off would hide what the check compares) and the
	// page background picture is not set (no picture is uploaded for the check).
	remove_theme_mod( 'harlow_style_transition_shown' );
	set_theme_mod( 'harlow_style_custom_colours', "Sand | #e0c9a6\nNight | #0b0b2b" );
	set_theme_mod( 'harlow_style_google_fonts', 'Lora' );
	set_theme_mod( 'harlow_style_bp_laptop', '1366' );
	set_theme_mod( 'harlow_style_bp_widescreen', '2400' );
	foreach ( array( 'custom_colours', 'google_fonts', 'bp_laptop', 'bp_widescreen' ) as $key ) {
		if ( ! array_key_exists( $key, $saved['mods'] ) ) {
			$saved['mods'][ $key ] = null;
		}
	}

	$news = get_posts(
		array(
			'post_type'   => 'news',
			'numberposts' => 1,
			'fields'      => 'ids',
		)
	);
	$block = static function ( $element, $words ) {
		return '<!-- wp:harlow/heading {"element":"' . $element . '","classes":"elementor-element elementor-widget elementor-widget-heading","text":"' . $words . '"} /-->';
	};
	$made     = array();
	$template = static function ( $kind, $title, $conditions, $inner ) use ( &$made ) {
		$id = wp_insert_post(
			array(
				'post_type'    => 'harlow_template',
				'post_status'  => 'publish',
				'post_title'   => $title,
				// wp_insert_post() takes its data slashed: the blocks' escaped quotes survive it.
				'post_content' => wp_slash( '<!-- wp:harlow/document {"docType":"' . harlow_template_kinds()[ $kind ][1] . '","location":"' . $kind . '"} -->' . $inner . '<!-- /wp:harlow/document -->' ),
			)
		);
		update_post_meta( $id, '_harlow_template_kind', $kind );
		update_post_meta( $id, '_harlow_conditions', wp_json_encode( $conditions ) );
		$made[ $kind ] = $id;
		return $id;
	};
	$about = get_page_by_path( 'about-us' );
	$template( 'header', 'Check header', array( array( 'type' => 'include', 'rule' => 'entire' ), array( 'type' => 'exclude', 'rule' => 'front' ) ), $block( 'aa00001', 'Check header words' ) );
	$template( 'footer', 'Check footer', array( array( 'type' => 'include', 'rule' => 'id:' . $about->ID ) ), $block( 'aa00002', 'Check footer words' ) );
	$template( 'single', 'Check single', array( array( 'type' => 'include', 'rule' => 'type:news' ) ), $block( 'aa00003', 'Check single words' ) . '<!-- wp:harlow/post-content {"element":"aa00009","classes":"elementor-element elementor-widget elementor-widget-theme-post-content"} /-->' );
	$template( 'archive', 'Check archive', array( array( 'type' => 'include', 'rule' => 'archive' ) ), $block( 'aa00004', 'Check archive words' ) );
	$template( 'search', 'Check search', array( array( 'type' => 'include', 'rule' => 'search' ) ), $block( 'aa00005', 'Check search words' ) );
	$template( 'error', 'Check 404', array( array( 'type' => 'include', 'rule' => '404' ) ), $block( 'aa00006', 'Check 404 words' ) );
	$template( 'loop-item', 'Check card', array(), '<!-- wp:harlow/heading {"element":"aa00007","classes":"elementor-element elementor-widget elementor-widget-heading","text":"Card: <span class=\"harlow-dynamic\" data-tag=\"post-title\">[Post title]</span>"} /-->' );
	$popup = $template( 'popup', 'Check popup', array( array( 'type' => 'include', 'rule' => 'id:' . $about->ID ) ), $block( 'aa00008', 'Check popup words' ) );
	update_post_meta( $popup, '_harlow_popup', wp_json_encode( array( 'load' => 1, 'position' => 'bottom-right', 'width' => 400 ) ) );

	$saved['templates'] = $made;
	$saved['news']      = $news ? (int) $news[0] : 0;
	$saved['tools']     = get_option( 'harlow_site_tools', null );
	update_option( $keep, $saved, false );
	$out = array(
		'templates' => $made,
		'news'      => $saved['news'] ? get_permalink( $saved['news'] ) : '',
	);
}

if ( 'expect' === $step ) {
	$css     = harlow_site_css();
	$missing = array();
	$checked = 0;
	foreach ( harlow_site_settings() as $key => $setting ) {
		if ( empty( $setting['css'] ) ) {
			continue;
		}
		$value = harlow_site_css_value( $setting['type'], harlow_site_setting( $key ) );
		if ( '' === $value ) {
			continue;
		}
		foreach ( $setting['css'] as $pair ) {
			++$checked;
			if ( false === strpos( $css, $pair[1] . ':' . $value ) ) {
				$missing[] = $key . ' ' . $pair[1];
			}
		}
	}
	$saved = get_option( $keep );
	// A list's card made in the Theme Builder, with a dynamic tag in its words.
	$list = do_blocks( '<!-- wp:harlow/loop {"element":"aa00010","classes":"elementor-element elementor-widget elementor-widget-loop-grid","widgetType":"loop-grid.post","postType":"news","perPage":2,"cardTemplate":' . (int) $saved['templates']['loop-item'] . '} /-->' );
	// The role manager: a person with the editor role, on the words and pictures only.
	update_option( 'harlow_site_tools', array_merge( harlow_site_tools(), array( 'content_only' => array( 'editor' ) ) ) );
	$person        = new WP_User();
	$person->ID    = 999999;
	$person->roles = array( 'editor' );
	$admin         = wp_get_current_user();
	$GLOBALS['current_user'] = $person; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- a person in memory, for this check only.
	$content_only  = harlow_content_only();
	$GLOBALS['current_user'] = $admin; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- back.
	$out = array(
		'checked'      => $checked,
		'missing'      => $missing,
		'custom'       => false !== strpos( $css, '--e-global-color-sand:#e0c9a6' ),
		'devices'      => array_keys( harlow_devices() ),
		'fonts'        => harlow_owner_fonts(),
		'cards'        => preg_match_all( '/class="[^"]*(?<![\w-])e-loop-item(?![\w-])/', $list ),
		'card words'   => (bool) preg_match( '/Card: (?!\[Post title\])[^<]+/', $list ),
		'content only' => $content_only,
		'admin free'   => ! harlow_content_only(),
	);
}

if ( 'on' === $step ) {
	$about = get_page_by_path( 'about-us' );
	update_option(
		'harlow_site_tools',
		array_merge(
			harlow_site_tools(),
			array(
				'mode' => 'maintenance',
				'page' => $about->ID,
			)
		)
	);
	$out = array( 'page' => $about->ID );
}

if ( 'restore' === $step ) {
	$saved = get_option( $keep );
	if ( is_array( $saved ) ) {
		foreach ( $saved['mods'] as $key => $value ) {
			if ( null === $value ) {
				remove_theme_mod( 'harlow_style_' . $key );
			} else {
				set_theme_mod( 'harlow_style_' . $key, $value );
			}
		}
		foreach ( $saved['templates'] as $id ) {
			wp_delete_post( (int) $id, true );
		}
		if ( null === $saved['tools'] ) {
			delete_option( 'harlow_site_tools' );
		} else {
			update_option( 'harlow_site_tools', $saved['tools'] );
		}
		delete_option( $keep );
	}
	$out = array(
		'templates left' => count(
			get_posts(
				array(
					'post_type'   => 'harlow_template',
					'post_status' => 'any',
					'numberposts' => -1,
					'fields'      => 'ids',
				)
			)
		),
	);
}

echo 'HARLOW-JSON' . wp_json_encode( $out );
