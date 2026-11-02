/**
 * Google Maps in the editor: the server's markup of includes/sections/google-maps.php
 * (Google's map of the address), the address, the zoom and the height in the sidebar, as
 * Elementor's panel has them.
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	TextControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

import { ServerMarkup } from '../../editor/shared';

const DEVICES = [
	[ '', __( 'Desktop', 'harlow' ) ],
	[ 'Tablet', __( 'Tablet', 'harlow' ) ],
	[ 'Mobile', __( 'Mobile', 'harlow' ) ],
];

export default function Edit( { attributes, setAttributes } ) {
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Map', 'harlow' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Location', 'harlow' ) }
						value={ attributes.address }
						onChange={ ( address ) => setAttributes( { address } ) }
					/>
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Zoom', 'harlow' ) }
						min={ 1 }
						max={ 20 }
						value={ attributes.zoom }
						onChange={ ( zoom ) =>
							setAttributes( { zoom: zoom || 10 } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Height unit', 'harlow' ) }
						value={ attributes.heightUnit }
						options={ [
							{ value: 'px', label: 'px' },
							{ value: 'vh', label: 'vh' },
						] }
						onChange={ ( heightUnit ) =>
							setAttributes( { heightUnit } )
						}
					/>
					{ DEVICES.map( ( [ suffix, device ] ) => (
						<TextControl
							key={ suffix }
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							type="number"
							min="0"
							label={ sprintf(
								// translators: %s: a device (desktop, tablet, mobile).
								__( 'Height (%s)', 'harlow' ),
								device
							) }
							help={
								suffix ? '' : __( 'Empty: 300px.', 'harlow' )
							}
							value={ attributes[ `height${ suffix }` ] }
							onChange={ ( value ) =>
								setAttributes( {
									[ `height${ suffix }` ]: value,
								} )
							}
						/>
					) ) }
				</PanelBody>
			</InspectorControls>
			<ServerMarkup name="harlow/google-maps" attributes={ attributes } />
		</>
	);
}
