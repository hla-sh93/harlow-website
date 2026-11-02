/**
 * Elementor's widget type of each block whose type is not its folder's name, as
 * harlow_widget_kind() reads it back: the element's classes (`elementor-widget-<type>`)
 * are made from it. A block.json may name its own (`harlowWidget`).
 */
export const WIDGET_TYPES = {
	text: 'text-editor',
	'post-content': 'theme-post-content',
	markup: 'text-editor',
	'site-part': 'template',
};
