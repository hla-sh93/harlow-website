/**
 * A search form in the editor: the server's markup of includes/sections/search-form.php,
 * the skin, placeholder, button and sizes in the sidebar. The full screen skin's overlay
 * opens on the page only (assets/js/widgets/search-form.js); the canvas shows its toggle.
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	TextControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { ServerMarkup } from '../../editor/shared';

export default function Edit( { attributes, setAttributes } ) {
	const { skin, buttonType } = attributes;
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Search Form', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Skin', 'harlow' ) }
						value={ skin }
						options={ [
							{
								value: 'classic',
								label: __( 'Classic', 'harlow' ),
							},
							{
								value: 'minimal',
								label: __( 'Minimal', 'harlow' ),
							},
							{
								value: 'full_screen',
								label: __( 'Full Screen', 'harlow' ),
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { skin: value } )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Placeholder', 'harlow' ) }
						value={ attributes.placeholder }
						onChange={ ( placeholder ) =>
							setAttributes( { placeholder } )
						}
					/>
					{ skin !== 'full_screen' && (
						<RangeControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Size', 'harlow' ) }
							value={ attributes.size }
							min={ 20 }
							max={ 120 }
							onChange={ ( size ) =>
								setAttributes( { size: size || 50 } )
							}
						/>
					) }
				</PanelBody>
				{ skin === 'classic' && (
					<PanelBody
						title={ __( 'Button', 'harlow' ) }
						initialOpen={ false }
					>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Type', 'harlow' ) }
							value={ buttonType }
							options={ [
								{
									value: 'icon',
									label: __( 'Icon', 'harlow' ),
								},
								{
									value: 'text',
									label: __( 'Text', 'harlow' ),
								},
							] }
							onChange={ ( value ) =>
								setAttributes( { buttonType: value } )
							}
						/>
						{ buttonType === 'text' ? (
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Text', 'harlow' ) }
								value={ attributes.buttonText }
								onChange={ ( buttonText ) =>
									setAttributes( { buttonText } )
								}
							/>
						) : (
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Icon', 'harlow' ) }
								value={ attributes.icon }
								options={ [
									{
										value: 'search',
										label: __( 'Search', 'harlow' ),
									},
									{
										value: 'arrow',
										label: __( 'Arrow', 'harlow' ),
									},
								] }
								onChange={ ( icon ) =>
									setAttributes( { icon } )
								}
							/>
						) }
					</PanelBody>
				) }
				{ skin === 'full_screen' && (
					<PanelBody
						title={ __( 'Toggle', 'harlow' ) }
						initialOpen={ false }
					>
						<RangeControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Size', 'harlow' ) }
							value={ attributes.toggleSize }
							min={ 10 }
							max={ 120 }
							onChange={ ( toggleSize ) =>
								setAttributes( {
									toggleSize: toggleSize || 33,
								} )
							}
						/>
					</PanelBody>
				) }
			</InspectorControls>
			<ServerMarkup name="harlow/search-form" attributes={ attributes } />
		</>
	);
}
