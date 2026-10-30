/*
 * A picture field in a box under the editor: Choose opens the Media Library, Remove empties it.
 * The field keeps the attachment id; the preview shows the chosen picture.
 */
( () => {
	document.querySelectorAll( '.harlow-image-field' ).forEach( ( field ) => {
		const input = field.querySelector( 'input' );
		const preview = field.querySelector( '.harlow-image-preview' );
		let frame = null;

		field
			.querySelector( '.harlow-image-choose' )
			.addEventListener( 'click', () => {
				if ( ! frame ) {
					frame = wp.media( {
						library: { type: 'image' },
						multiple: false,
					} );
					frame.on( 'select', () => {
						const picture = frame
							.state()
							.get( 'selection' )
							.first()
							.toJSON();
						const size =
							( picture.sizes &&
								( picture.sizes.thumbnail ||
									picture.sizes.full ) ) ||
							picture;
						input.value = picture.id;
						preview.innerHTML = '';
						const img = document.createElement( 'img' );
						img.src = size.url;
						img.alt = '';
						preview.appendChild( img );
					} );
				}
				frame.open();
			} );

		field
			.querySelector( '.harlow-image-remove' )
			.addEventListener( 'click', () => {
				input.value = '0';
				preview.innerHTML = '';
			} );
	} );
} )();
