/**
 * Code highlight in the editor: the server's markup of includes/sections/code-highlight.php,
 * coloured by the page's own script (assets/js/widgets/code-highlight.js) as on the page;
 * the code and the settings in the sidebar, as Elementor's panel has them.
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	TextareaControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import { ServerMarkup } from '../../editor/shared';

const site = window.harlowEditor || { themeUri: '' };

/** The languages Elementor offers, as Prism names them. */
const LANGUAGES = [
	[ 'markup', 'Markup' ],
	[ 'html', 'HTML' ],
	[ 'css', 'CSS' ],
	[ 'sass', 'Sass (Sass)' ],
	[ 'scss', 'Sass (Scss)' ],
	[ 'less', 'Less' ],
	[ 'javascript', 'JavaScript' ],
	[ 'typescript', 'TypeScript' ],
	[ 'jsx', 'React JSX' ],
	[ 'tsx', 'React TSX' ],
	[ 'php', 'PHP' ],
	[ 'ruby', 'Ruby' ],
	[ 'json', 'JSON' ],
	[ 'sql', 'SQL' ],
	[ 'bash', 'Bash' ],
	[ 'powershell', 'PowerShell' ],
	[ 'python', 'Python' ],
	[ 'c', 'C' ],
	[ 'cpp', 'C++' ],
	[ 'csharp', 'C#' ],
	[ 'java', 'Java' ],
	[ 'go', 'Go' ],
	[ 'kotlin', 'Kotlin' ],
	[ 'swift', 'Swift' ],
	[ 'rust', 'Rust' ],
	[ 'perl', 'Perl' ],
	[ 'r', 'R' ],
	[ 'yaml', 'YAML' ],
	[ 'markdown', 'Markdown' ],
	[ 'git', 'Git' ],
	[ 'xml', 'XML' ],
	[ 'svg', 'SVG' ],
].map( ( [ value, label ] ) => ( { value, label } ) );

const DEVICES = [
	[ '', __( 'Desktop', 'harlow' ) ],
	[ 'Tablet', __( 'Tablet', 'harlow' ) ],
	[ 'Mobile', __( 'Mobile', 'harlow' ) ],
];

/**
 * The widget's own script in the canvas's document, loaded once: what it registers
 * (window.harlowWidgets[ name ]), or null.
 *
 * @param {Document} doc  The canvas's document.
 * @param {string}   name The widget.
 * @return {Promise<Function|null>} The script's init.
 */
function widgetScript( doc, name ) {
	const win = doc.defaultView;
	win.harlowWidgetsManual = true;
	if ( win.harlowWidgets && win.harlowWidgets[ name ] ) {
		return Promise.resolve( win.harlowWidgets[ name ] );
	}
	win.harlowWidgetLoads = win.harlowWidgetLoads || {};
	if ( ! win.harlowWidgetLoads[ name ] ) {
		win.harlowWidgetLoads[ name ] = new Promise( ( resolve ) => {
			const script = doc.createElement( 'script' );
			script.src = `${ site.themeUri }/assets/js/widgets/${ name }.js`;
			script.onload = () =>
				resolve( ( win.harlowWidgets || {} )[ name ] || null );
			script.onerror = () => resolve( null );
			doc.head.appendChild( script );
		} );
	}
	return win.harlowWidgetLoads[ name ];
}

export default function Edit( { attributes, setAttributes } ) {
	const set = ( name ) => ( value ) => setAttributes( { [ name ]: value } );
	const onMarkup = useCallback( ( el ) => {
		let stop;
		let live = true;
		widgetScript( el.ownerDocument, 'code-highlight' ).then( ( init ) => {
			if ( live && init ) {
				stop = init( el, { editor: true } );
			}
		} );
		return () => {
			live = false;
			if ( stop ) {
				stop();
			}
		};
	}, [] );
	const devices = ( name, label ) =>
		DEVICES.map( ( [ suffix, device ] ) => (
			<TextControl
				key={ name + suffix }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				type="number"
				min="0"
				label={ sprintf(
					// translators: 1: a setting, 2: a device (desktop, tablet, mobile).
					__( '%1$s (%2$s)', 'harlow' ),
					label,
					device
				) }
				value={ attributes[ name + suffix ] }
				onChange={ set( name + suffix ) }
			/>
		) );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Code Highlight', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Language', 'harlow' ) }
						value={ attributes.language }
						options={ LANGUAGES }
						onChange={ set( 'language' ) }
					/>
					<TextareaControl
						__nextHasNoMarginBottom
						label={ __( 'Code', 'harlow' ) }
						rows={ 12 }
						spellCheck={ false }
						style={ { fontFamily: 'monospace', whiteSpace: 'pre' } }
						value={ attributes.code }
						onChange={ set( 'code' ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Line numbers', 'harlow' ) }
						checked={ attributes.lineNumbers }
						onChange={ set( 'lineNumbers' ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Copy to clipboard', 'harlow' ) }
						checked={ attributes.copyToClipboard }
						onChange={ set( 'copyToClipboard' ) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Highlight lines', 'harlow' ) }
						help={ __(
							'Such as 1, 3–6 (written with a hyphen).',
							'harlow'
						) }
						value={ attributes.highlightLines }
						onChange={ set( 'highlightLines' ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Word wrap', 'harlow' ) }
						checked={ attributes.wordWrap }
						onChange={ set( 'wordWrap' ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Theme', 'harlow' ) }
						value={ attributes.theme }
						options={ [
							{
								value: 'default',
								label: __( 'Solid', 'harlow' ),
							},
							{ value: 'dark', label: __( 'Dark', 'harlow' ) },
							{ value: 'okaidia', label: 'Okaidia' },
							{
								value: 'solarizedlight',
								label: 'Solarized light',
							},
							{ value: 'tomorrow', label: 'Tomorrow' },
							{ value: 'twilight', label: 'Twilight' },
						] }
						onChange={ set( 'theme' ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Size', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Height unit', 'harlow' ) }
						value={ attributes.heightUnit }
						options={ [
							{ value: 'px', label: 'px' },
							{ value: 'vh', label: 'vh' },
							{ value: 'em', label: 'em' },
						] }
						onChange={ set( 'heightUnit' ) }
					/>
					{ devices( 'height', __( 'Height', 'harlow' ) ) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Font size unit', 'harlow' ) }
						value={ attributes.fontSizeUnit }
						options={ [
							{ value: 'px', label: 'px' },
							{ value: 'em', label: 'em' },
							{ value: 'rem', label: 'rem' },
							{ value: 'vw', label: 'vw' },
						] }
						onChange={ set( 'fontSizeUnit' ) }
					/>
					{ devices( 'fontSize', __( 'Font size', 'harlow' ) ) }
				</PanelBody>
			</InspectorControls>
			<ServerMarkup
				name="harlow/code-highlight"
				attributes={ attributes }
				onMarkup={ onMarkup }
			/>
		</>
	);
}
