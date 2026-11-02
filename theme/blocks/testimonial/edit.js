/**
 * A testimonial in the editor: includes/sections/testimonial.php, the words, name and title
 * typed in place; the picture, its size and place, the alignment and the link in the
 * sidebar.
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import {
	elementProps,
	LinkFields,
	linkUrl,
	PicturePicker,
} from '../../editor/shared';

const CLASSES =
	'elementor-element elementor-widget elementor-widget-testimonial';

const SIZES = [
	{ value: 'thumbnail', label: __( 'Thumbnail', 'harlow' ) },
	{ value: 'medium', label: __( 'Medium', 'harlow' ) },
	{ value: 'medium_large', label: __( 'Medium large', 'harlow' ) },
	{ value: 'large', label: __( 'Large', 'harlow' ) },
	{ value: 'full', label: __( 'Full', 'harlow' ) },
];

/**
 * A picture of the Media Library at one of its sizes.
 *
 * @param {number} id   The picture.
 * @param {string} size The size's name.
 * @return {Object|null} { src, alt, width, height }, or null.
 */
function usePicture( id, size ) {
	return useSelect(
		( select ) => {
			if ( ! id ) {
				return null;
			}
			const media = select( coreStore ).getEntityRecord(
				'postType',
				'attachment',
				id
			);
			if ( ! media ) {
				return null;
			}
			const sized = media.media_details?.sizes?.[ size ];
			return {
				src: sized?.source_url || media.source_url,
				alt: media.alt_text || '',
				width: sized?.width || media.media_details?.width,
				height: sized?.height || media.media_details?.height,
			};
		},
		[ id, size ]
	);
}

export default function Edit( { attributes, setAttributes } ) {
	const { content, image, imageSize, name, job, link, imagePosition, align } =
		attributes;
	const picture = usePicture( image, imageSize );
	const blockProps = useBlockProps(
		elementProps(
			{
				...attributes,
				classes: `${ attributes.classes || CLASSES } elementor-testimonial--align-${ align }`,
			},
			'widget',
			'testimonial.default'
		)
	);
	const linked = !! link;
	const linkProps = linked
		? {
				href: linkUrl( link ),
				target: attributes.linkTarget || undefined,
				rel: attributes.linkRel || undefined,
				onClick: ( event ) => event.preventDefault(),
			}
		: {};
	const img = picture ? (
		<img
			className={ `attachment-${ imageSize } size-${ imageSize } wp-image-${ image }` }
			src={ picture.src }
			alt={ picture.alt }
			width={ picture.width }
			height={ picture.height }
		/>
	) : null;
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Testimonial', 'harlow' ) }>
					<PicturePicker
						label={ __( 'Picture', 'harlow' ) }
						value={ image }
						onChange={ ( value ) =>
							setAttributes( { image: value } )
						}
						none={ __( 'No picture', 'harlow' ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Picture resolution', 'harlow' ) }
						value={ imageSize }
						options={ SIZES }
						onChange={ ( value ) =>
							setAttributes( { imageSize: value } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Picture position', 'harlow' ) }
						value={ imagePosition }
						options={ [
							{ value: 'aside', label: __( 'Aside', 'harlow' ) },
							{ value: 'top', label: __( 'Top', 'harlow' ) },
						] }
						onChange={ ( value ) =>
							setAttributes( { imagePosition: value } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Alignment', 'harlow' ) }
						value={ align }
						options={ [
							{ value: 'left', label: __( 'Left', 'harlow' ) },
							{
								value: 'center',
								label: __( 'Center', 'harlow' ),
							},
							{ value: 'right', label: __( 'Right', 'harlow' ) },
						] }
						onChange={ ( value ) =>
							setAttributes( { align: value } )
						}
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Link', 'harlow' ) }
					initialOpen={ false }
				>
					<LinkFields
						value={ attributes }
						onChange={ setAttributes }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<div className="elementor-widget-container">
					<div className="elementor-testimonial-wrapper">
						<RichText
							tagName="div"
							className="elementor-testimonial-content"
							value={ content }
							onChange={ ( value ) =>
								setAttributes( { content: value } )
							}
							allowedFormats={ [
								'core/bold',
								'core/italic',
								'core/link',
							] }
							placeholder={ __( 'What they said', 'harlow' ) }
						/>
						<div
							className={ `elementor-testimonial-meta${
								img ? ' elementor-has-image' : ''
							} elementor-testimonial-image-position-${
								imagePosition === 'top' ? 'top' : 'aside'
							}` }
						>
							<div className="elementor-testimonial-meta-inner">
								{ img && (
									<div className="elementor-testimonial-image">
										{ linked ? (
											<a { ...linkProps }>{ img }</a>
										) : (
											img
										) }
									</div>
								) }
								<div className="elementor-testimonial-details">
									<RichText
										tagName={ linked ? 'a' : 'div' }
										className="elementor-testimonial-name"
										{ ...linkProps }
										value={ name }
										onChange={ ( value ) =>
											setAttributes( { name: value } )
										}
										allowedFormats={ [] }
										placeholder={ __( 'Name', 'harlow' ) }
									/>
									<RichText
										tagName={ linked ? 'a' : 'div' }
										className="elementor-testimonial-job"
										{ ...linkProps }
										value={ job }
										onChange={ ( value ) =>
											setAttributes( { job: value } )
										}
										allowedFormats={ [] }
										placeholder={ __( 'Title', 'harlow' ) }
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
