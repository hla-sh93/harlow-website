/**
 * A spacer in the editor: includes/sections/spacer.php, its space for the device the editor
 * previews in the sidebar.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { elementProps } from '../../editor/shared';
import { lengthVars, ResponsiveLength } from './responsive';

export default function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( {
		...elementProps( attributes, 'widget', 'spacer.default' ),
		style: lengthVars( attributes, 'space', '--harlow-spacer' ),
	} );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Spacer', 'harlow' ) }>
					<ResponsiveLength
						label={ __( 'Space', 'harlow' ) }
						name="space"
						numeric
						attributes={ attributes }
						setAttributes={ setAttributes }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<div className="elementor-spacer">
						{ '\n' }
						<div className="elementor-spacer-inner" />
						{ '\n' }
					</div>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
