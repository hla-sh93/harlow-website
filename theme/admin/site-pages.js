/*
 * Appearance > Site pages: "Install the pages" asks for the installer's rounds one after
 * another (REST harlow/v1/install), shows how far it is, and shows the screen again when
 * the run is done. The box switches what the table says for pages with content of their own.
 */
( () => {
	const button = document.getElementById( 'harlow-install' );
	const replace = document.getElementById( 'harlow-replace' );
	if ( ! button || ! replace ) {
		return;
	}
	const { __, sprintf } = wp.i18n;
	const holder = document.querySelector( '.harlow-site-pages__progress' );
	const bar = document.getElementById( 'harlow-install-progress' );
	const message = document.getElementById( 'harlow-install-message' );

	replace.addEventListener( 'change', () => {
		document
			.querySelectorAll( '.harlow-site-pages__will' )
			.forEach( ( cell ) => {
				cell.textContent = replace.checked
					? cell.dataset.replace
					: cell.dataset.keep;
			} );
	} );

	const round = ( start ) =>
		wp
			.apiFetch( {
				path: '/harlow/v1/install',
				method: 'POST',
				data: { start, replace: replace.checked },
			} )
			.then( ( run ) => {
				const { done, total, step } = run.progress;
				bar.max = total;
				bar.value = done;
				if ( run.done ) {
					message.textContent = __( 'Installed.', 'harlow' );
					window.location.assign(
						window.location.pathname +
							'?page=harlow-site-pages&installed=1'
					);
					return;
				}
				message.textContent = sprintf(
					/* translators: 1: the step, 2: units done, 3: units in all, 4: rounds so far. */
					__(
						'Installing (%1$s): %2$d of %3$d, round %4$d…',
						'harlow'
					),
					step,
					done,
					total,
					run.rounds
				);
				return round( false );
			} );

	button.addEventListener( 'click', () => {
		button.disabled = true;
		replace.disabled = true;
		holder.hidden = false;
		message.textContent = __( 'Installing…', 'harlow' );
		round( true ).catch( ( error ) => {
			message.textContent = sprintf(
				/* translators: %s: the error. */
				__(
					'Installing stopped: %s. Press the button again to go on.',
					'harlow'
				),
				error.message || error.code || ''
			);
			button.disabled = false;
			replace.disabled = false;
		} );
	} );
} )();
