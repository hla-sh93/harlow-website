<?php
/**
 * The site's content types, under live's names and addresses, and their extra fields.
 *
 * The names are live's (`news`, `albahoo_project`, ...), so the items already in the live
 * WordPress show the same way when this theme goes live. A type with pages of its own keeps
 * live's address (/news/<item>/, /albahoo-project/<item>/). Live sends the pages of
 * business models, Harlow's people and team members to the home page (301): they are
 * cards and slides, not pages; so does this theme.
 *
 * The extra fields (a business model's icon and page, a testimonial's position) are in a
 * box under the editor; everything else is WordPress's own: title, text, excerpt, featured
 * picture, date.
 *
 * @package Harlow
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The content types: name => [plural label, singular label, address or '' for none, supports, menu icon].
 *
 * @return array<string,array{0:string,1:string,2:string,3:string[],4:string}>
 */
function harlow_content_types() {
	return array(
		'news'            => array( __( 'News', 'harlow' ), __( 'News item', 'harlow' ), 'news', array( 'title', 'editor', 'excerpt', 'thumbnail' ), 'dashicons-megaphone' ),
		'albahoo_project' => array( __( 'Projects', 'harlow' ), __( 'Project', 'harlow' ), 'albahoo-project', array( 'title', 'editor', 'excerpt', 'thumbnail' ), 'dashicons-building' ),
		'gallery_item'    => array( __( 'Gallery', 'harlow' ), __( 'Gallery item', 'harlow' ), 'gallery-item', array( 'title', 'thumbnail' ), 'dashicons-format-gallery' ),
		'job'             => array( __( 'Jobs', 'harlow' ), __( 'Job', 'harlow' ), 'job', array( 'title', 'editor', 'excerpt' ), 'dashicons-id' ),
		'business_model'  => array( __( 'Business models', 'harlow' ), __( 'Business model', 'harlow' ), 'business-model', array( 'title', 'editor', 'excerpt', 'thumbnail' ), 'dashicons-portfolio' ),
		'harlows_person'  => array( __( 'Harlow\'s people', 'harlow' ), __( 'Person', 'harlow' ), 'harlows-person', array( 'title', 'editor', 'thumbnail' ), 'dashicons-groups' ),
		'team_member'     => array( __( 'Team members', 'harlow' ), __( 'Team member', 'harlow' ), 'team-member', array( 'title', 'thumbnail' ), 'dashicons-businessperson' ),
		'testimonial'     => array( __( 'Testimonials', 'harlow' ), __( 'Testimonial', 'harlow' ), '', array( 'title', 'editor', 'thumbnail' ), 'dashicons-format-quote' ),
		'client_logo'     => array( __( 'Client logos', 'harlow' ), __( 'Client logo', 'harlow' ), '', array( 'title', 'thumbnail', 'page-attributes' ), 'dashicons-awards' ),
	);
}

/** The types whose pages live sends to the home page. */
const HARLOW_TYPES_WITHOUT_PAGES = array( 'business_model', 'harlows_person', 'team_member' );

/**
 * Register the types.
 */
function harlow_register_content_types() {
	foreach ( harlow_content_types() as $type => $type_info ) {
		list( $plural, $singular, $address, $supports, $icon ) = $type_info;
		register_post_type(
			$type,
			array(
				'labels'       => array(
					'name'          => $plural,
					'singular_name' => $singular,
					/* translators: %s: the singular name of a content type, e.g. Project. */
					'add_new_item'  => sprintf( __( 'Add %s', 'harlow' ), $singular ),
					/* translators: %s: the singular name of a content type, e.g. Project. */
					'edit_item'     => sprintf( __( 'Edit %s', 'harlow' ), $singular ),
				),
				'public'       => '' !== $address,
				'show_ui'      => true,
				'show_in_rest' => true,
				'has_archive'  => false,
				'rewrite'      => '' !== $address ? array(
					'slug'       => $address,
					'with_front' => false,
				) : false,
				'supports'     => $supports,
				'menu_icon'    => $icon,
				'hierarchical' => false,
			)
		);
	}

	$fields = array(
		'business_model' => array(
			'_harlow_icon' => 'integer',
			'_harlow_link' => 'integer',
		),
		'testimonial'    => array( '_harlow_position' => 'string' ),
		'client_logo'    => array( '_harlow_element' => 'string' ),
	);
	foreach ( $fields as $type => $keys ) {
		foreach ( $keys as $key => $kind ) {
			register_post_meta(
				$type,
				$key,
				array(
					'type'          => $kind,
					'single'        => true,
					'show_in_rest'  => true,
					'auth_callback' => static function () {
						return current_user_can( 'edit_posts' );
					},
				)
			);
		}
	}
}
add_action( 'init', 'harlow_register_content_types' );

/**
 * Business models, people and team members have no page: their addresses lead home, as on live.
 */
function harlow_redirect_cards() {
	if ( is_singular( HARLOW_TYPES_WITHOUT_PAGES ) ) {
		wp_safe_redirect( home_url( '/' ), 301 );
		exit;
	}
}
add_action( 'template_redirect', 'harlow_redirect_cards' );

/**
 * The box of extra fields, on the types that have some.
 */
function harlow_add_field_boxes() {
	add_meta_box( 'harlow-model-fields', __( 'Card', 'harlow' ), 'harlow_model_fields_box', 'business_model', 'side' );
	add_meta_box( 'harlow-testimonial-fields', __( 'Person', 'harlow' ), 'harlow_testimonial_fields_box', 'testimonial', 'side' );
}
add_action( 'add_meta_boxes', 'harlow_add_field_boxes' );

/**
 * A business model's icon and the page its card opens.
 *
 * @param WP_Post $post The business model.
 */
function harlow_model_fields_box( $post ) {
	wp_nonce_field( 'harlow_fields', 'harlow_fields_nonce' );
	$icon = (int) get_post_meta( $post->ID, '_harlow_icon', true );
	?>
	<p><strong><?php esc_html_e( 'Icon', 'harlow' ); ?></strong></p>
	<div class="harlow-image-field">
		<input type="hidden" name="harlow_icon" value="<?php echo esc_attr( (string) $icon ); ?>">
		<div class="harlow-image-preview"><?php echo $icon ? wp_get_attachment_image( $icon, 'thumbnail' ) : ''; ?></div>
		<button type="button" class="button harlow-image-choose"><?php esc_html_e( 'Choose an icon', 'harlow' ); ?></button>
		<button type="button" class="button-link harlow-image-remove"><?php esc_html_e( 'Remove', 'harlow' ); ?></button>
	</div>
	<p><label for="harlow-link"><strong><?php esc_html_e( 'Page the card opens', 'harlow' ); ?></strong></label></p>
	<?php
	wp_dropdown_pages(
		array(
			'name'              => 'harlow_link',
			'id'                => 'harlow-link',
			'selected'          => (int) get_post_meta( $post->ID, '_harlow_link', true ),
			'show_option_none'  => esc_html__( '(this item has no page)', 'harlow' ),
			'option_none_value' => '0',
		)
	);
}

/**
 * A testimonial's position, shown under the name.
 *
 * @param WP_Post $post The testimonial.
 */
function harlow_testimonial_fields_box( $post ) {
	wp_nonce_field( 'harlow_fields', 'harlow_fields_nonce' );
	?>
	<p><label for="harlow-position"><strong><?php esc_html_e( 'Position', 'harlow' ); ?></strong></label></p>
	<input type="text" class="widefat" id="harlow-position" name="harlow_position" value="<?php echo esc_attr( (string) get_post_meta( $post->ID, '_harlow_position', true ) ); ?>">
	<?php
}

/**
 * Save the extra fields.
 *
 * @param int $post_id The item.
 */
function harlow_save_fields( $post_id ) {
	if ( ! isset( $_POST['harlow_fields_nonce'] ) || ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['harlow_fields_nonce'] ) ), 'harlow_fields' ) ) {
		return;
	}
	if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	if ( isset( $_POST['harlow_icon'] ) ) {
		update_post_meta( $post_id, '_harlow_icon', absint( $_POST['harlow_icon'] ) );
	}
	if ( isset( $_POST['harlow_link'] ) ) {
		update_post_meta( $post_id, '_harlow_link', absint( $_POST['harlow_link'] ) );
	}
	if ( isset( $_POST['harlow_position'] ) ) {
		update_post_meta( $post_id, '_harlow_position', sanitize_text_field( wp_unslash( $_POST['harlow_position'] ) ) );
	}
}
add_action( 'save_post_business_model', 'harlow_save_fields' );
add_action( 'save_post_testimonial', 'harlow_save_fields' );

/**
 * The picture chooser of the icon field.
 *
 * @param string $hook The admin screen.
 */
function harlow_field_scripts( $hook ) {
	if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) || 'business_model' !== get_current_screen()->post_type ) {
		return;
	}
	wp_enqueue_media();
	wp_enqueue_script( 'harlow-image-field', get_theme_file_uri( 'admin/image-field.js' ), array( 'jquery' ), harlow_asset_version( 'admin/image-field.js' ), true );
}
add_action( 'admin_enqueue_scripts', 'harlow_field_scripts' );
