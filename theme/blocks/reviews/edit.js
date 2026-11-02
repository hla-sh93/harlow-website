/**
 * Reviews in the editor: includes/sections/reviews.php. The reviews are a list in the
 * sidebar (picture, name, title, rating, icon, link, words), their words also typed in
 * place; the stars' style, the separator, slides per view and the carousel's options in
 * the sidebar. The carousel is the testimonial carousel's (its edit view's pieces).
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Flex,
	PanelBody,
	RangeControl,
	SelectControl,
	TextareaControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import {
	elementProps,
	IconPicker,
	LinkFields,
	linkUrl,
	PicturePicker,
} from '../../editor/shared';
import {
	carouselElement,
	CarouselFrame,
	CarouselOptions,
	carouselSettings,
	DeviceNumbers,
	Repeater,
	SIZES,
	usePictures,
} from '../testimonial-carousel/edit';

const CLASSES = 'elementor-element elementor-widget elementor-widget-reviews';
const X_ICON =
	'<svg aria-hidden="true" class="e-font-icon-svg e-fab-x-twitter" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path></svg>';

/**
 * A rating's stars (harlow_reviews_stars()).
 *
 * @param {Object} props
 * @param {number} props.rating   The rating, 0 to 5.
 * @param {string} props.unmarked 'solid' or 'outline'.
 */
function Stars( { rating, unmarked } ) {
	const value = Math.max( 0, Math.min( 5, Number( rating ) || 0 ) );
	const floored = Math.floor( value );
	const char = unmarked === 'outline' ? '☆' : '★';
	return (
		<div className="elementor-star-rating">
			{ [ 1, 2, 3, 4, 5 ].map( ( star ) => {
				let name = 'elementor-star-empty';
				if ( star <= floored ) {
					name = 'elementor-star-full';
				} else if ( star === floored + 1 && value > floored ) {
					name = `elementor-star-${ Math.max(
						1,
						Math.min( 9, Math.round( ( value - floored ) * 10 ) )
					) }`;
				}
				return (
					<i key={ star } className={ name }>
						{ char }
					</i>
				);
			} ) }
		</div>
	);
}

/**
 * The social network of an icon, from its class (harlow_reviews_network()).
 *
 * @param {string} svg The icon's markup.
 * @return {string} The network's name, or ''.
 */
function network( svg ) {
	const m = /\be-fa[brs]?-([a-z0-9-]+)/.exec( svg || '' );
	return m ? m[ 1 ] : '';
}

const plain = ( html ) => ( html || '' ).replace( /<[^>]*>/g, '' );

export default function Edit( { attributes, setAttributes } ) {
	const { slides, imageSize, starStyle, unmarkedStarStyle, separator } =
		attributes;
	const { settings, style } = carouselSettings(
		attributes,
		slides.length,
		[ 3, 2, 1 ]
	);
	const own = [
		`elementor--star-style-${
			starStyle === 'star_unicode' ? 'star_unicode' : 'star_fontawesome'
		}`,
		`elementor-review--unmarked-${
			unmarkedStarStyle === 'outline' ? 'outline' : 'solid'
		}`,
	];
	if ( separator ) {
		own.push( 'elementor-review--has-separator' );
	}
	const blockProps = useBlockProps(
		elementProps(
			carouselElement( attributes, CLASSES, settings, own ),
			'widget',
			'reviews.default'
		)
	);
	const pictures = usePictures(
		slides.map( ( slide ) => slide.image || 0 ),
		imageSize
	);
	const setSlides = ( next ) => setAttributes( { slides: next } );
	const changeSlide = ( index, patch ) =>
		setSlides(
			slides.map( ( slide, i ) =>
				i === index ? { ...slide, ...patch } : slide
			)
		);
	const items = slides.map( ( slide, index ) => {
		const linked = !! ( slide.link || '' ).trim();
		const Header = linked ? 'a' : 'div';
		const hasHeader =
			pictures[ slide.image ] ||
			plain( slide.name ) ||
			plain( slide.title );
		return (
			<div
				key={ index }
				className={ `elementor-testimonial${
					slide.id ? ` elementor-repeater-item-${ slide.id }` : ''
				}` }
			>
				{ hasHeader && (
					<Header
						className="elementor-testimonial__header"
						href={ linked ? linkUrl( slide.link ) : undefined }
						target={ ( linked && slide.linkTarget ) || undefined }
						rel={ ( linked && slide.linkRel ) || undefined }
						onClick={ ( event ) => event.preventDefault() }
					>
						{ pictures[ slide.image ] && (
							<div className="elementor-testimonial__image">
								<img
									src={ pictures[ slide.image ] }
									alt={ plain( slide.name ) }
								/>
							</div>
						) }
						<cite className="elementor-testimonial__cite">
							<RichText
								tagName="span"
								className="elementor-testimonial__name"
								value={ slide.name || '' }
								onChange={ ( value ) =>
									changeSlide( index, { name: value } )
								}
								allowedFormats={ [] }
								placeholder={ __( 'Name', 'harlow' ) }
							/>
							{ Number( slide.rating ) > 0 && (
								<Stars
									rating={ slide.rating }
									unmarked={ unmarkedStarStyle }
								/>
							) }
							<RichText
								tagName="span"
								className="elementor-testimonial__title"
								value={ slide.title || '' }
								onChange={ ( value ) =>
									changeSlide( index, { title: value } )
								}
								allowedFormats={ [] }
								placeholder={ __( 'Title', 'harlow' ) }
							/>
						</cite>
						{ slide.icon && (
							<div
								className={ `elementor-testimonial__icon elementor-icon${
									network( slide.icon )
										? ` elementor-icon-${ network(
												slide.icon
											) }`
										: ''
								}` }
								dangerouslySetInnerHTML={ {
									__html: `${ slide.icon }<span class="elementor-screen-only">${ __(
										'Read More',
										'harlow'
									) }</span>`,
								} }
							/>
						) }
					</Header>
				) }
				<div className="elementor-testimonial__content">
					<RichText
						tagName="div"
						className="elementor-testimonial__text"
						value={ slide.content || '' }
						onChange={ ( value ) =>
							changeSlide( index, { content: value } )
						}
						allowedFormats={ [
							'core/bold',
							'core/italic',
							'core/link',
						] }
						placeholder={ __( 'The review', 'harlow' ) }
					/>
				</div>
			</div>
		);
	} );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Slides', 'harlow' ) }>
					<p>
						{ __(
							'Each review below; its words are also typed in place.',
							'harlow'
						) }
					</p>
				</PanelBody>
				<Repeater
					items={ slides }
					onChange={ setSlides }
					blank={ {
						image: 0,
						name: 'John Doe',
						title: '@username',
						rating: 5,
						icon: X_ICON,
						link: '',
						content: '',
					} }
					title={ ( slide, index ) =>
						plain( slide.name ) ||
						sprintf(
							/* translators: %d: the review's number. */
							__( 'Review %d', 'harlow' ),
							index + 1
						)
					}
					add={ __( 'Add a review', 'harlow' ) }
				>
					{ ( slide, change ) => (
						<Fragment>
							<PicturePicker
								label={ __( 'Image', 'harlow' ) }
								value={ slide.image || 0 }
								onChange={ ( value ) =>
									change( { image: value } )
								}
								none={ __( 'No picture', 'harlow' ) }
							/>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Name', 'harlow' ) }
								value={ slide.name || '' }
								onChange={ ( value ) =>
									change( { name: value } )
								}
							/>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Title', 'harlow' ) }
								value={ slide.title || '' }
								onChange={ ( value ) =>
									change( { title: value } )
								}
							/>
							<RangeControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Rating', 'harlow' ) }
								min={ 0 }
								max={ 5 }
								step={ 0.1 }
								value={ Number( slide.rating ) || 0 }
								onChange={ ( value ) =>
									change( { rating: value ?? 0 } )
								}
							/>
							<p>{ __( 'Icon', 'harlow' ) }</p>
							<IconPicker
								allowNone
								value={ slide.icon || '' }
								onChange={ ( value ) =>
									change( { icon: value } )
								}
							/>
							<LinkFields value={ slide } onChange={ change } />
							<TextareaControl
								__nextHasNoMarginBottom
								label={ __( 'Review', 'harlow' ) }
								value={ slide.content || '' }
								onChange={ ( value ) =>
									change( { content: value } )
								}
							/>
						</Fragment>
					) }
				</Repeater>
				<PanelBody
					title={ __( 'Layout', 'harlow' ) }
					initialOpen={ false }
				>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Image resolution', 'harlow' ) }
						value={ imageSize }
						options={ SIZES }
						onChange={ ( value ) =>
							setAttributes( { imageSize: value } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Header separator', 'harlow' ) }
						checked={ separator }
						onChange={ ( value ) =>
							setAttributes( { separator: value } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Star style', 'harlow' ) }
						value={ starStyle }
						options={ [
							{
								value: 'star_fontawesome',
								label: __( 'Icon', 'harlow' ),
							},
							{
								value: 'star_unicode',
								label: __( 'Unicode', 'harlow' ),
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { starStyle: value } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Unmarked style', 'harlow' ) }
						value={ unmarkedStarStyle }
						options={ [
							{ value: 'solid', label: __( 'Solid', 'harlow' ) },
							{
								value: 'outline',
								label: __( 'Outline', 'harlow' ),
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { unmarkedStarStyle: value } )
						}
					/>
					<DeviceNumbers
						label={ __( 'Slides per view', 'harlow' ) }
						name="slidesPerView"
						attributes={ attributes }
						setAttributes={ setAttributes }
						help={ __(
							'Empty: 3 on desktops, 2 on tablets, 1 on mobiles.',
							'harlow'
						) }
					/>
					<DeviceNumbers
						label={ __( 'Slides to scroll', 'harlow' ) }
						name="slidesToScroll"
						attributes={ attributes }
						setAttributes={ setAttributes }
					/>
					<Flex align="flex-end">
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							type="number"
							min={ 0 }
							label={ __( 'Width', 'harlow' ) }
							value={ attributes.width }
							onChange={ ( value ) =>
								setAttributes( { width: value } )
							}
						/>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Unit', 'harlow' ) }
							value={ attributes.widthUnit }
							options={ [
								{ value: '%', label: '%' },
								{ value: 'px', label: 'px' },
								{ value: 'vw', label: 'vw' },
							] }
							onChange={ ( value ) =>
								setAttributes( { widthUnit: value } )
							}
						/>
					</Flex>
				</PanelBody>
				<CarouselOptions
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
			</InspectorControls>
			<div { ...blockProps }>
				{ slides.length > 0 && (
					<div className="elementor-widget-container">
						<CarouselFrame
							settings={ settings }
							style={ style }
							slides={ items }
						/>
					</div>
				) }
			</div>
		</>
	);
}
