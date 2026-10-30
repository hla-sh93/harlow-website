/**
 * A shortcode widget in the editor: includes/sections/shortcode.php, the markup it printed
 * on live shown as the page shows it and written in the sidebar.
 */
import { useBlockProps } from '@wordpress/block-editor';

import { MarkupPanel } from '../html/edit';
import { elementProps, resolveLinks } from '../../editor/shared';

export default function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'shortcode.default' )
	);
	return (
		<>
			<MarkupPanel
				value={ attributes.html }
				onChange={ ( html ) => setAttributes( { html } ) }
			/>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<div
						className="elementor-shortcode"
						dangerouslySetInnerHTML={ {
							__html: resolveLinks( attributes.html ),
						} }
					/>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
