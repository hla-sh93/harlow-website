/**
 * SoundCloud in the editor: the server's markup of includes/sections/audio.php (SoundCloud's
 * player), the track's address and the player's settings in the sidebar, as Elementor's
 * panel has them.
 */
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { ServerMarkup } from '../../editor/shared';

export default function Edit( { attributes, setAttributes } ) {
	const set = ( name ) => ( value ) => setAttributes( { [ name ]: value } );
	const toggle = ( name, label ) => (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ label }
			checked={ attributes[ name ] }
			onChange={ set( name ) }
		/>
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'SoundCloud', 'harlow' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Link', 'harlow' ) }
						help={ __(
							'The address of a track or a playlist on soundcloud.com.',
							'harlow'
						) }
						value={ attributes.link }
						onChange={ set( 'link' ) }
					/>
					{ toggle( 'visual', __( 'Visual player', 'harlow' ) ) }
				</PanelBody>
				<PanelBody
					title={ __( 'Additional Options', 'harlow' ) }
					initialOpen={ false }
				>
					{ toggle( 'autoplay', __( 'Autoplay', 'harlow' ) ) }
					{ toggle( 'buying', __( 'Buy button', 'harlow' ) ) }
					{ toggle( 'liking', __( 'Like button', 'harlow' ) ) }
					{ toggle( 'download', __( 'Download button', 'harlow' ) ) }
					{ ! attributes.visual &&
						toggle( 'artwork', __( 'Artwork', 'harlow' ) ) }
					{ toggle( 'sharing', __( 'Share button', 'harlow' ) ) }
					{ toggle( 'comments', __( 'Comments', 'harlow' ) ) }
					{ toggle( 'playCount', __( 'Play counts', 'harlow' ) ) }
					{ toggle( 'user', __( 'Username', 'harlow' ) ) }
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Controls color', 'harlow' ) }
						help={ __(
							'A hex colour, such as #ff5500.',
							'harlow'
						) }
						value={ attributes.color }
						onChange={ set( 'color' ) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						min="0"
						label={ __( 'Height (px)', 'harlow' ) }
						help={ __(
							'Empty: SoundCloud’s own (400 for the visual player, 200 for the classic one).',
							'harlow'
						) }
						value={ attributes.height }
						onChange={ set( 'height' ) }
					/>
				</PanelBody>
			</InspectorControls>
			<ServerMarkup name="harlow/audio" attributes={ attributes } />
		</>
	);
}
