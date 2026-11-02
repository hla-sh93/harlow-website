/**
 * The author box in the editor: the server's markup of includes/sections/author-box.php
 * (the author is the item's own, kept in Users, or one typed in here), what it shows,
 * its links and layout in the sidebar.
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextareaControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { PicturePicker, ServerMarkup } from '../../editor/shared';

const TAGS = [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'p' ];

export default function Edit( { attributes, setAttributes } ) {
	const custom = attributes.source === 'custom';
	const toggle = ( key, label ) => (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ label }
			checked={ !! attributes[ key ] }
			onChange={ ( value ) => setAttributes( { [ key ]: value } ) }
		/>
	);
	const text = ( key, label, help ) => (
		<TextControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ label }
			help={ help }
			value={ attributes[ key ] }
			onChange={ ( value ) => setAttributes( { [ key ]: value } ) }
		/>
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Author Info', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Source', 'harlow' ) }
						help={
							custom
								? ''
								: __(
										'The author’s name, picture, biography and website are their profile’s, in Users.',
										'harlow'
									)
						}
						value={ attributes.source }
						options={ [
							{
								value: 'current',
								label: __( 'Current Author', 'harlow' ),
							},
							{
								value: 'custom',
								label: __( 'Custom', 'harlow' ),
							},
						] }
						onChange={ ( source ) => setAttributes( { source } ) }
					/>
					{ toggle( 'avatar', __( 'Profile Picture', 'harlow' ) ) }
					{ custom && attributes.avatar && (
						<PicturePicker
							label={ __( 'Profile Picture', 'harlow' ) }
							value={ attributes.customAvatar }
							onChange={ ( customAvatar ) =>
								setAttributes( { customAvatar } )
							}
							none={ __( 'Default picture', 'harlow' ) }
						/>
					) }
					{ toggle( 'name', __( 'Display Name', 'harlow' ) ) }
					{ custom &&
						attributes.name &&
						text( 'customName', __( 'Name', 'harlow' ) ) }
					{ attributes.name && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'HTML Tag', 'harlow' ) }
							value={ attributes.nameTag }
							options={ TAGS.map( ( t ) => ( {
								value: t,
								label: t,
							} ) ) }
							onChange={ ( nameTag ) =>
								setAttributes( { nameTag } )
							}
						/>
					) }
					{ toggle( 'bio', __( 'Biography', 'harlow' ) ) }
					{ custom && attributes.bio && (
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Biography', 'harlow' ) }
							value={ attributes.customBio }
							onChange={ ( customBio ) =>
								setAttributes( { customBio } )
							}
						/>
					) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Link', 'harlow' ) }
						help={ __(
							'Where the picture and the name lead.',
							'harlow'
						) }
						value={ attributes.linkTo }
						options={ [
							{ value: '', label: __( 'None', 'harlow' ) },
							{
								value: 'website',
								label: __( 'Website', 'harlow' ),
							},
							{
								value: 'posts_archive',
								label: __( 'Posts Archive', 'harlow' ),
							},
						] }
						onChange={ ( linkTo ) => setAttributes( { linkTo } ) }
					/>
					{ custom &&
						attributes.linkTo === 'website' &&
						text( 'customWebsite', __( 'Website', 'harlow' ) ) }
					{ toggle( 'button', __( 'Archive Button', 'harlow' ) ) }
					{ attributes.button &&
						text( 'buttonText', __( 'Archive Text', 'harlow' ) ) }
					{ custom &&
						( attributes.button ||
							attributes.linkTo === 'posts_archive' ) &&
						text(
							'customArchive',
							__( 'Posts Archive', 'harlow' ),
							__(
								'A page of the site (about-us.html) or an address.',
								'harlow'
							)
						) }
				</PanelBody>
				<PanelBody
					title={ __( 'Layout', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Image Position', 'harlow' ) }
						value={ attributes.layout }
						options={ [
							{ value: '', label: __( 'Default', 'harlow' ) },
							{ value: 'left', label: __( 'Left', 'harlow' ) },
							{ value: 'above', label: __( 'Top', 'harlow' ) },
							{ value: 'right', label: __( 'Right', 'harlow' ) },
						] }
						onChange={ ( layout ) => setAttributes( { layout } ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Alignment', 'harlow' ) }
						value={ attributes.align }
						options={ [
							{ value: '', label: __( 'Default', 'harlow' ) },
							{ value: 'left', label: __( 'Left', 'harlow' ) },
							{
								value: 'center',
								label: __( 'Center', 'harlow' ),
							},
							{ value: 'right', label: __( 'Right', 'harlow' ) },
						] }
						onChange={ ( align ) => setAttributes( { align } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<ServerMarkup name="harlow/author-box" attributes={ attributes } />
		</>
	);
}
