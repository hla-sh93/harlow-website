/**
 * A button in the editor: includes/sections/button.php, its words typed in place, its link
 * and icon in the sidebar.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import {
	elementProps,
	IconPicker,
	LinkFields,
	linkUrl,
	PicturePicker,
	pictureStyle,
	usePictureUrl,
} from '../../editor/shared';

export default function Edit( { attributes, setAttributes } ) {
	const {
		text,
		hasIcon,
		icon,
		iconAfter,
		buttonClass,
		link,
		linkTarget,
		linkRel,
		linkId,
		picture,
	} = attributes;
	const pictureUrl = usePictureUrl( picture );
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'button.default' )
	);
	const words = (
		<RichText
			key="text"
			tagName="span"
			className="elementor-button-text"
			value={ text }
			onChange={ ( value ) => setAttributes( { text: value } ) }
			placeholder={ __( 'Button', 'harlow' ) }
			withoutInteractiveFormatting
		/>
	);
	const parts = [ words ];
	if ( hasIcon ) {
		const iconPart = (
			<span
				key="icon"
				className="elementor-button-icon"
				dangerouslySetInnerHTML={ {
					__html: '\n' + ( icon ? icon + '\n' : '' ),
				} }
			/>
		);
		if ( iconAfter ) {
			parts.push( iconPart );
		} else {
			parts.unshift( iconPart );
		}
	}
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Link', 'harlow' ) }>
					<LinkFields
						value={ attributes }
						onChange={ setAttributes }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Icon', 'harlow' ) }
					initialOpen={ false }
				>
					<IconPicker
						allowNone
						value={ hasIcon ? icon : '' }
						onChange={ ( value ) =>
							setAttributes( { icon: value, hasIcon: !! value } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Icon after the words', 'harlow' ) }
						checked={ iconAfter }
						onChange={ ( value ) =>
							setAttributes( { iconAfter: value } )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Background', 'harlow' ) }
					initialOpen={ false }
				>
					<PicturePicker
						label={ __( 'Background picture', 'harlow' ) }
						value={ picture }
						onChange={ ( id ) => setAttributes( { picture: id } ) }
						none={ __( 'Default', 'harlow' ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div
					className="elementor-widget-container"
					style={ pictureStyle( pictureUrl ) }
				>
					{ '\n' }
					<div className="elementor-button-wrapper">
						{ '\n' }
						<a
							className={ buttonClass }
							href={ link ? linkUrl( link ) : undefined }
							target={
								link && linkTarget ? linkTarget : undefined
							}
							rel={ link && linkRel ? linkRel : undefined }
							id={ linkId || undefined }
							onClick={ ( event ) => event.preventDefault() }
						>
							{ '\n' }
							<span className="elementor-button-content-wrapper">
								{ '\n' }
								{ parts.flatMap( ( part, i ) =>
									i ? [ '\n', part ] : [ part ]
								) }
								{ '\n' }
							</span>
							{ '\n' }
						</a>
						{ '\n' }
					</div>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
