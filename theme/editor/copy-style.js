/**
 * Copy and paste an element's style (Elementor's Copy Style / Paste Style): two items of a
 * block's menu. Copying keeps the element's Styles tab (every device, its classes, motion,
 * conditions) in this browser; pasting gives it to the blocks chosen, whatever their kind
 * (what a kind does not have is left unused, as in Elementor).
 */
import { BlockSettingsMenuControls } from '@wordpress/block-editor';
import { MenuItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';

const KEY = 'harlow-copied-style';

/**
 * The style copied, or null.
 *
 * @return {Object|null} The style.
 */
function copied() {
	try {
		return JSON.parse( window.localStorage.getItem( KEY ) );
	} catch {
		return null;
	}
}

/**
 * The block menu's items.
 */
function CopyStyle() {
	const selected = useSelect(
		( select ) =>
			select( 'core/block-editor' )
				.getSelectedBlockClientIds()
				.map( ( id ) => select( 'core/block-editor' ).getBlock( id ) ),
		[]
	);
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
	const styled = selected.filter(
		( b ) => b?.name.startsWith( 'harlow/' ) && 'style' in b.attributes
	);
	if ( ! styled.length ) {
		return null;
	}
	return (
		<BlockSettingsMenuControls>
			{ ( { onClose } ) => (
				<>
					{ styled.length === 1 && (
						<MenuItem
							onClick={ () => {
								try {
									window.localStorage.setItem(
										KEY,
										JSON.stringify(
											styled[ 0 ].attributes.style || {}
										)
									);
								} catch {
									// A browser that keeps nothing cannot copy.
								}
								onClose();
							} }
						>
							{ __( 'Copy style', 'harlow' ) }
						</MenuItem>
					) }
					<MenuItem
						disabled={ ! copied() }
						onClick={ () => {
							const style = copied();
							if ( style ) {
								updateBlockAttributes(
									styled.map( ( b ) => b.clientId ),
									{
										style: Object.keys( style ).length
											? style
											: undefined,
									}
								);
							}
							onClose();
						} }
					>
						{ __( 'Paste style', 'harlow' ) }
					</MenuItem>
				</>
			) }
		</BlockSettingsMenuControls>
	);
}

registerPlugin( 'harlow-copy-style', { render: CopyStyle } );
