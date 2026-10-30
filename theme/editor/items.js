/**
 * The sidebar of a block whose lines are a list in its attributes (an icon list, social
 * icons): one panel per line, with buttons to add, move and remove lines.
 */
import { InspectorControls } from '@wordpress/block-editor';
import { Button, Flex, PanelBody } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * @param {Object}   props
 * @param {Object[]} props.items    The lines.
 * @param {Function} props.onChange Called with the new lines.
 * @param {Object}   props.blank    A new line.
 * @param {Function} props.children Renders the fields of one line: ( item, update ) => fields.
 */
export default function ItemPanels( { items, onChange, blank, children } ) {
	const update = ( index, patch ) =>
		onChange(
			items.map( ( item, i ) =>
				i === index ? { ...item, ...patch } : item
			)
		);
	const move = ( index, by ) => {
		const next = [ ...items ];
		const [ item ] = next.splice( index, 1 );
		next.splice( index + by, 0, item );
		onChange( next );
	};
	return (
		<InspectorControls>
			{ items.map( ( item, index ) => (
				<PanelBody
					key={ index }
					/* translators: %d: the line's number. */
					title={ sprintf( __( 'Line %d', 'harlow' ), index + 1 ) }
					initialOpen={ false }
				>
					{ children( item, ( patch ) => update( index, patch ) ) }
					<Flex justify="flex-start" wrap>
						<Button
							variant="secondary"
							size="small"
							disabled={ index === 0 }
							onClick={ () => move( index, -1 ) }
						>
							{ __( 'Move up', 'harlow' ) }
						</Button>
						<Button
							variant="secondary"
							size="small"
							disabled={ index === items.length - 1 }
							onClick={ () => move( index, 1 ) }
						>
							{ __( 'Move down', 'harlow' ) }
						</Button>
						<Button
							variant="secondary"
							size="small"
							isDestructive
							onClick={ () =>
								onChange(
									items.filter( ( x, i ) => i !== index )
								)
							}
						>
							{ __( 'Remove', 'harlow' ) }
						</Button>
					</Flex>
				</PanelBody>
			) ) }
			<PanelBody>
				<Button
					variant="secondary"
					onClick={ () =>
						onChange( [
							...items,
							{ ...( items[ items.length - 1 ] || blank ) },
						] )
					}
				>
					{ __( 'Add a line', 'harlow' ) }
				</Button>
			</PanelBody>
		</InspectorControls>
	);
}
