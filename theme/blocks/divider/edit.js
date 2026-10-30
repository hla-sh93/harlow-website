/**
 * A divider in the editor: includes/sections/divider.php.
 */
import { useBlockProps } from '@wordpress/block-editor';

import { elementProps } from '../../editor/shared';

export default function Edit( { attributes } ) {
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'divider.default' )
	);
	return (
		<div { ...blockProps }>
			{ '\n' }
			<div className="elementor-widget-container">
				{ '\n' }
				<div className="elementor-divider">
					{ '\n' }
					<span className="elementor-divider-separator">
						{ '\n' }
					</span>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
			{ '\n' }
		</div>
	);
}
