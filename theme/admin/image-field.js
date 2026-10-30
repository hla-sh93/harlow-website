/*
 * A picture field in a box under the editor: Choose opens the Media Library, Remove empties it.
 * The field keeps the attachment id (several, comma-separated and in the order chosen, with
 * data-multiple); the preview shows the chosen pictures.
 */
( () => {
	document.querySelectorAll( '.harlow-image-field' ).forEach( ( field ) => {
		const input = field.querySelector( 'input' );
		const preview = field.querySelector( '.harlow-image-preview' );
		const multiple = field.dataset.multiple === '1';
		let frame = null;

		field
			.querySelector( '.harlow-image-choose' )
			.addEventListener( 'click', () => {
				if ( ! frame ) {
					frame = wp.media( {
						library: { type: 'image' },
						multiple: multiple ? 'add' : false,
					} );
					frame.on( 'select', () => {
						const pictures = frame
							.state()
							.get( 'selection' )
							.toJSON();
						input.value = pictures.map( ( p ) => p.id ).join( ',' );
						preview.innerHTML = '';
						pictures.forEach( ( picture ) => {
							const size =
								( picture.sizes &&
									( picture.sizes.thumbnail ||
										picture.sizes.full ) ) ||
								picture;
							const img = document.createElement( 'img' );
							img.src = size.url;
							img.alt = '';
							preview.appendChild( img );
						} );
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
