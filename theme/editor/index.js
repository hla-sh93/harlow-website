/**
 * The theme's blocks in the editor: each block's edit view prints the same elements as its
 * includes/sections/ file, so the canvas is styled by the page's own rules, with the words
 * typed in place. Built with wp-scripts into theme/build/ (committed: nothing to build for
 * whoever installs the theme).
 *
 * Every folder of theme/blocks/ is a block: its block.json and its edit.js, found here by
 * themselves, so a new widget needs no line in this file.
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';

import { WIDGET_TYPES } from './widget-types';
import './ui.css';
import './paragraph-data';
import './design-classes';
import './styles';
import './new-element';
import './page';
import './theme-builder';
import './dynamic-tags';
import './copy-style';
import './item-details';
import './link-format';

// The blocks that hold other blocks save them; the rest are printed by the server. A
// block's edit.js may name its own `save`.
const inner = () => <InnerBlocks.Content />;
const none = () => null;
const HOLDERS = [
	'accordion',
	'accordion-item',
	'box',
	'container',
	'document',
	'template',
	'text',
];

const metadata = require.context( '../blocks', true, /\/block\.json$/ );
const edits = require.context( '../blocks', true, /\/edit\.js$/ );

metadata.keys().forEach( ( path ) => {
	const folder = path.split( '/' )[ 1 ];
	// A folder without its edit view yet is not a block yet.
	if ( ! edits.keys().includes( `./${ folder }/edit.js` ) ) {
		return;
	}
	const edit = edits( `./${ folder }/edit.js` );
	// Elementor's widget type, when it is not the folder's name (theme-site-logo...).
	if ( metadata( path ).harlowWidget ) {
		WIDGET_TYPES[ folder ] = metadata( path ).harlowWidget;
	}
	registerBlockType( metadata( path ), {
		edit: edit.default,
		save: edit.save || ( HOLDERS.includes( folder ) ? inner : none ),
	} );
} );
