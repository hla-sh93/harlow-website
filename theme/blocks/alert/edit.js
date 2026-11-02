/**
 * An alert in the editor: includes/sections/alert.php, its title and words typed in place,
 * its type and dismiss button in the sidebar.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { elementProps, iconHtml, IconPicker } from '../../editor/shared';

const TYPES = [
	{ value: 'info', label: __( 'Info', 'harlow' ) },
	{ value: 'success', label: __( 'Success', 'harlow' ) },
	{ value: 'warning', label: __( 'Warning', 'harlow' ) },
	{ value: 'danger', label: __( 'Danger', 'harlow' ) },
];

export default function Edit( { attributes, setAttributes } ) {
	const { alertType, title, description, showDismiss, dismissIcon } =
		attributes;
	const blockProps = useBlockProps(
		elementProps( attributes, 'widget', 'alert.default' )
	);
	const type = TYPES.some( ( t ) => t.value === alertType )
		? alertType
		: 'info';
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Alert', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Type', 'harlow' ) }
						value={ type }
						options={ TYPES }
						onChange={ ( value ) =>
							setAttributes( { alertType: value } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Dismiss Button', 'harlow' ) }
						checked={ showDismiss }
						onChange={ ( value ) =>
							setAttributes( { showDismiss: value } )
						}
					/>
				</PanelBody>
				{ showDismiss && (
					<PanelBody
						title={ __( 'Dismiss Icon', 'harlow' ) }
						initialOpen={ false }
					>
						<IconPicker
							value={ dismissIcon }
							allowNone
							noneLabel={ __( 'The × sign', 'harlow' ) }
							onChange={ ( icon ) =>
								setAttributes( { dismissIcon: icon } )
							}
						/>
					</PanelBody>
				) }
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<div
						className={ `elementor-alert elementor-alert-${ type }` }
						role="alert"
					>
						{ '\n' }
						<RichText
							tagName="span"
							className="elementor-alert-title"
							value={ title }
							onChange={ ( value ) =>
								setAttributes( { title: value } )
							}
							placeholder={ __( 'Title', 'harlow' ) }
							allowedFormats={ [] }
						/>
						{ '\n' }
						<RichText
							tagName="span"
							className="elementor-alert-description"
							value={ description }
							onChange={ ( value ) =>
								setAttributes( { description: value } )
							}
							placeholder={ __( 'Description', 'harlow' ) }
							allowedFormats={ [
								'core/bold',
								'core/italic',
								'core/link',
							] }
						/>
						{ '\n' }
						{ showDismiss && (
							<button
								type="button"
								className="elementor-alert-dismiss"
								aria-label={ __(
									'Dismiss this alert.',
									'harlow'
								) }
								dangerouslySetInnerHTML={
									dismissIcon
										? iconHtml( dismissIcon )
										: {
												__html: '\n<span aria-hidden="true">&times;</span>\n',
											}
								}
							/>
						) }
						{ showDismiss && '\n' }
					</div>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
