/**
 * The picture of a widget that holds one (image box, call to action, flip box), as
 * functions/widgets/image-box.php prints it: the Media Library's picture at the size
 * chosen, or a placeholder while none is chosen; and its fields in the sidebar.
 */
import { SelectControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { PicturePicker } from '../../editor/shared';

/** The placeholder (harlow_image_box_placeholder()). */
export const PLACEHOLDER =
	'data:image/svg+xml,' +
	encodeURIComponent(
		'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">' +
			'<rect width="1200" height="800" fill="#e5e5e5"/>' +
			'<circle cx="560" cy="350" r="24" fill="#c4c4c4"/>' +
			'<path d="M500 470l70-90 45 55 35-40 80 75z" fill="#c4c4c4"/>' +
			'</svg>'
	);

/**
 * A picture of the Media Library at a size.
 *
 * @param {number} id   The picture, 0 for none.
 * @param {string} size Its size.
 * @return {Object|null} { url, width, height, alt, sizes }, or null (none, or not loaded).
 */
export function usePicture( id, size ) {
	const media = useSelect(
		( select ) =>
			id
				? select( coreStore ).getEntityRecord(
						'postType',
						'attachment',
						id
					)
				: null,
		[ id ]
	);
	if ( ! media?.source_url ) {
		return null;
	}
	const details = media.media_details || {};
	const one = size && size !== 'full' ? details.sizes?.[ size ] : null;
	return {
		url: one?.source_url || media.source_url,
		width: one?.width || details.width,
		height: one?.height || details.height,
		alt: media.alt_text || '',
		sizes: [
			...Object.entries( details.sizes || {} )
				.filter( ( [ name ] ) => name !== 'full' )
				.map( ( [ name, s ] ) => ( {
					value: name,
					label: `${ name } (${ s.width } × ${ s.height })`,
				} ) ),
			{
				value: 'full',
				label: `${ __( 'full', 'harlow' ) } (${ details.width } × ${
					details.height
				})`,
			},
		],
	};
}

/**
 * The picture as the page prints it (harlow_image_box_picture()).
 *
 * @param {Object} props
 * @param {number} props.id   The picture, 0 for none.
 * @param {string} props.size Its size.
 */
export function Picture( { id, size } ) {
	const picture = usePicture( id, size );
	const name = size || 'full';
	if ( ! picture ) {
		return <img src={ PLACEHOLDER } title="" alt="" loading="lazy" />;
	}
	return (
		<img
			width={ picture.width }
			height={ picture.height }
			src={ picture.url }
			className={ `attachment-${ name } size-${ name } wp-image-${ id }` }
			alt={ picture.alt }
		/>
	);
}

/**
 * A picture's fields: the picture (Media Library or uploaded) and its size.
 *
 * @param {Object}   props
 * @param {string}   props.label    What the picture is.
 * @param {number}   props.id       The picture, 0 for none.
 * @param {string}   props.size     Its size.
 * @param {Function} props.onChange Called with { id } or { size }.
 */
export function PictureFields( { label, id, size, onChange } ) {
	const picture = usePicture( id, size );
	return (
		<>
			<PicturePicker
				label={ label }
				value={ id }
				onChange={ ( picked ) => onChange( { id: picked } ) }
				none={ __(
					'A placeholder until a picture is chosen.',
					'harlow'
				) }
			/>
			{ picture && (
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Image Resolution', 'harlow' ) }
					value={ size || 'full' }
					options={ picture.sizes }
					onChange={ ( value ) => onChange( { size: value } ) }
				/>
			) }
		</>
	);
}
