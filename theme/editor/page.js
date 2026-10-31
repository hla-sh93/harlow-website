/**
 * What the editor offers for a whole page (functions/kinds.php, functions/page-tools.php):
 * a new page asks what kind of page it is, takes that kind's template and, if wanted, its
 * ready sections (the kind's starter pattern, real words to replace); a page the site was
 * installed with can put its original sections back.
 */
import { parse } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	Button,
	CheckboxControl,
	Modal,
	RadioControl,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	PluginDocumentSettingPanel,
	store as editorStore,
} from '@wordpress/editor';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';

const site = window.harlowEditor || {};

/**
 * "What kind of page is this?": shown once on a new page whose document is still empty.
 */
function KindChooser() {
	const [ closed, setClosed ] = useState( false );
	const [ kind, setKind ] = useState( '' );
	const [ withSections, setWithSections ] = useState( true );
	const { isNew, documentId, patterns } = useSelect( ( select ) => {
		const editor = select( editorStore );
		const blocks = select( blockEditorStore ).getBlocks();
		const doc =
			blocks.length === 1 &&
			blocks[ 0 ].name === 'harlow/document' &&
			! blocks[ 0 ].innerBlocks.length
				? blocks[ 0 ]
				: null;
		return {
			isNew:
				editor.getCurrentPostType() === 'page' &&
				editor.isEditedPostNew() &&
				! editor.getEditedPostAttribute( 'template' ) &&
				!! doc,
			documentId: doc ? doc.clientId : '',
			patterns: select( coreStore ).getBlockPatterns(),
		};
	}, [] );
	const { editPost } = useDispatch( editorStore );
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const kinds = Object.entries( site.kinds || {} );

	if ( closed || ! isNew || ! kinds.length ) {
		return null;
	}
	// The starter arrives with the site's patterns, which the editor loads after it opens.
	const starter =
		kind &&
		( patterns || [] ).find(
			( p ) => p.name === site.kinds[ kind ].starter
		);
	const start = () => {
		editPost( { template: `kind-${ kind }` } );
		if ( withSections ) {
			replaceInnerBlocks( documentId, parse( starter.content ) );
		}
		setClosed( true );
	};
	return (
		<Modal
			title={ __( 'What kind of page is this?', 'harlow' ) }
			className="harlow-kinds"
			onRequestClose={ () => setClosed( true ) }
		>
			<p>
				{ __(
					'The kind is the page’s template: its look around the sections. You can change it later under Template.',
					'harlow'
				) }
			</p>
			<RadioControl
				label={ __( 'Kind of page', 'harlow' ) }
				hideLabelFromVision
				selected={ kind }
				options={ kinds.map( ( [ value, info ] ) => ( {
					value,
					label: info.title,
					description: sprintf(
						/* translators: %s: the title of the page the kind is modelled on. */
						__( 'Like “%s”', 'harlow' ),
						info.model_title
					),
				} ) ) }
				onChange={ setKind }
			/>
			<CheckboxControl
				__nextHasNoMarginBottom
				label={ __(
					'Start with its ready sections (real words to replace)',
					'harlow'
				) }
				checked={ withSections }
				onChange={ setWithSections }
			/>
			<div className="harlow-kinds__actions">
				<Button variant="tertiary" onClick={ () => setClosed( true ) }>
					{ __( 'Skip', 'harlow' ) }
				</Button>
				<Button
					variant="primary"
					disabled={ ! kind || ( withSections && ! starter ) }
					onClick={ start }
				>
					{ __( 'Start', 'harlow' ) }
				</Button>
			</div>
		</Modal>
	);
}

/**
 * Put the page's original sections back (the page as the site was installed with it).
 */
function OriginalPanel() {
	const [ asking, setAsking ] = useState( false );
	const { resetEditorBlocks } = useDispatch( editorStore );
	if ( ! site.original ) {
		return null;
	}
	return (
		<PluginDocumentSettingPanel
			name="harlow-original"
			title={ __( 'Original sections', 'harlow' ) }
		>
			<p>
				{ __(
					'The sections this page had when the site was installed. Nothing is saved until you press Save, and Undo takes it back.',
					'harlow'
				) }
			</p>
			<Button variant="secondary" onClick={ () => setAsking( true ) }>
				{ __( 'Put back the original sections', 'harlow' ) }
			</Button>
			{ asking && (
				<Modal
					title={ __( 'Put back the original sections?', 'harlow' ) }
					size="small"
					onRequestClose={ () => setAsking( false ) }
				>
					<p>
						{ __(
							'The page’s sections are replaced with its original ones.',
							'harlow'
						) }
					</p>
					<div className="harlow-kinds__actions">
						<Button
							variant="tertiary"
							onClick={ () => setAsking( false ) }
						>
							{ __( 'Cancel', 'harlow' ) }
						</Button>
						<Button
							variant="primary"
							onClick={ () => {
								resetEditorBlocks( parse( site.original ) );
								setAsking( false );
							} }
						>
							{ __( 'Put them back', 'harlow' ) }
						</Button>
					</div>
				</Modal>
			) }
		</PluginDocumentSettingPanel>
	);
}

registerPlugin( 'harlow-page', {
	render: () => (
		<>
			<KindChooser />
			<OriginalPanel />
		</>
	),
} );
