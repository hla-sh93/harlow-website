/**
 * The theme's blocks in the editor: each block's edit view prints the same elements as its
 * includes/sections/ file, so the canvas is styled by the page's own rules, with the words
 * typed in place. Built with wp-scripts into theme/build/ (committed: nothing to build for
 * whoever installs the theme).
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';

import './ui.css';
import './paragraph-data';
import './design-classes';
import './page';

import accordion from '../blocks/accordion/block.json';
import accordionEdit from '../blocks/accordion/edit';
import accordionItem from '../blocks/accordion-item/block.json';
import accordionItemEdit from '../blocks/accordion-item/edit';
import box from '../blocks/box/block.json';
import boxEdit from '../blocks/box/edit';
import button from '../blocks/button/block.json';
import buttonEdit from '../blocks/button/edit';
import container from '../blocks/container/block.json';
import containerEdit from '../blocks/container/edit';
import divider from '../blocks/divider/block.json';
import dividerEdit from '../blocks/divider/edit';
import documentBlock from '../blocks/document/block.json';
import documentEdit from '../blocks/document/edit';
import gallery from '../blocks/gallery/block.json';
import galleryEdit from '../blocks/gallery/edit';
import heading from '../blocks/heading/block.json';
import headingEdit from '../blocks/heading/edit';
import html from '../blocks/html/block.json';
import htmlEdit from '../blocks/html/edit';
import icon from '../blocks/icon/block.json';
import iconEdit from '../blocks/icon/edit';
import iconList from '../blocks/icon-list/block.json';
import iconListEdit from '../blocks/icon-list/edit';
import image from '../blocks/image/block.json';
import imageEdit from '../blocks/image/edit';
import loop from '../blocks/loop/block.json';
import markup from '../blocks/markup/block.json';
import markupEdit from '../blocks/markup/edit';
import loopEdit from '../blocks/loop/edit';
import navMenu from '../blocks/nav-menu/block.json';
import navMenuEdit from '../blocks/nav-menu/edit';
import postContent from '../blocks/post-content/block.json';
import postContentEdit from '../blocks/post-content/edit';
import shortcode from '../blocks/shortcode/block.json';
import shortcodeEdit from '../blocks/shortcode/edit';
import sitePart from '../blocks/site-part/block.json';
import sitePartEdit from '../blocks/site-part/edit';
import socialIcons from '../blocks/social-icons/block.json';
import socialIconsEdit from '../blocks/social-icons/edit';
import template from '../blocks/template/block.json';
import templateEdit from '../blocks/template/edit';
import text from '../blocks/text/block.json';
import textEdit from '../blocks/text/edit';

// The blocks that hold other blocks save them; the rest are printed by the server.
const inner = () => <InnerBlocks.Content />;
const none = () => null;

[
	[ accordion, accordionEdit, inner ],
	[ accordionItem, accordionItemEdit, inner ],
	[ box, boxEdit, inner ],
	[ button, buttonEdit, none ],
	[ container, containerEdit, inner ],
	[ divider, dividerEdit, none ],
	[ documentBlock, documentEdit, inner ],
	[ gallery, galleryEdit, none ],
	[ heading, headingEdit, none ],
	[ html, htmlEdit, none ],
	[ icon, iconEdit, none ],
	[ iconList, iconListEdit, none ],
	[ image, imageEdit, none ],
	[ loop, loopEdit, none ],
	[ markup, markupEdit, none ],
	[ navMenu, navMenuEdit, none ],
	[ postContent, postContentEdit, none ],
	[ shortcode, shortcodeEdit, none ],
	[ sitePart, sitePartEdit, none ],
	[ socialIcons, socialIconsEdit, none ],
	[ template, templateEdit, inner ],
	[ text, textEdit, inner ],
].forEach( ( [ metadata, edit, save ] ) =>
	registerBlockType( metadata, { edit, save } )
);
