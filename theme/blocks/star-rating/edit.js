/**
 * A star rating in the editor: includes/sections/star-rating.php, the same stars from the
 * rating; the scale, rating, star style, title and alignment (for the device the editor
 * previews) in the sidebar.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { elementProps } from '../../editor/shared';
import { useDevice } from '../spacer/responsive';

const ALIGNS = [ 'left', 'center', 'right', 'justify' ];

/** Elementor's classes the stylesheet reads, taken off before they are written again. */
const OWN_CLASSES =
	/(^|\s)elementor(--star-style-|--unmarked-style-|-star-rating(-tablet|-mobile)?--align-)\S+/g;

export default function Edit( { attributes, setAttributes } ) {
	const { ratingScale, rating, starStyle, unmarkedStyle, title } = attributes;
	const [ device, deviceLabel ] = useDevice();

	const scale = `${ ratingScale }` === '10' ? 10 : 5;
	const value = Math.max( 0, Math.min( Number( rating ) || 0, scale ) );
	const text = `${ value }/${ scale }`;
	const unicode = starStyle === 'star_unicode';
	const outline = unmarkedStyle === 'outline';
	let glyph = outline ? '' : '';
	if ( unicode ) {
		glyph = outline ? '☆' : '★';
	}
	const whole = Math.floor( value );
	const stars = [];
	for ( let star = 1; star <= scale; star++ ) {
		let className = 'elementor-star-empty';
		if ( star <= whole ) {
			className = 'elementor-star-full';
		} else if ( star === whole + 1 && value > whole ) {
			className = `elementor-star-${ Math.max(
				1,
				Math.min( 9, Math.round( ( value - whole ) * 10 ) )
			) }`;
		}
		stars.push(
			<i key={ star } className={ className }>
				{ glyph }
			</i>
		);
	}

	const classes = [
		`elementor--star-style-${
			unicode ? 'star_unicode' : 'star_fontawesome'
		}`,
	];
	if ( outline ) {
		classes.push( 'elementor--unmarked-style-outline' );
	}
	[
		[ 'align', '' ],
		[ 'alignTablet', '-tablet' ],
		[ 'alignMobile', '-mobile' ],
	].forEach( ( [ key, suffix ] ) => {
		if ( ALIGNS.includes( attributes[ key ] ) ) {
			classes.push(
				`elementor-star-rating${ suffix }--align-${ attributes[ key ] }`
			);
		}
	} );
	const blockProps = useBlockProps(
		elementProps(
			{
				...attributes,
				classes: `${ ( attributes.classes || '' ).replace(
					OWN_CLASSES,
					''
				) } ${ classes.join( ' ' ) }`.trim(),
			},
			'widget',
			'star-rating.default'
		)
	);
	const alignKey = `align${ device }`;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Rating', 'harlow' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Rating Scale', 'harlow' ) }
						value={ `${ scale }` }
						options={ [
							{ value: '5', label: '0-5' },
							{ value: '10', label: '0-10' },
						] }
						onChange={ ( v ) =>
							setAttributes( { ratingScale: v } )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Rating', 'harlow' ) }
						type="number"
						min={ 0 }
						max={ scale }
						step={ 0.1 }
						value={ rating ?? '' }
						onChange={ ( v ) =>
							setAttributes( {
								rating: v === '' ? undefined : Number( v ),
							} )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Icon', 'harlow' ) }
						value={ unicode ? 'star_unicode' : 'star_fontawesome' }
						options={ [
							{
								value: 'star_fontawesome',
								label: __( 'Font Awesome', 'harlow' ),
							},
							{
								value: 'star_unicode',
								label: __( 'Unicode', 'harlow' ),
							},
						] }
						onChange={ ( v ) => setAttributes( { starStyle: v } ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Unmarked Style', 'harlow' ) }
						value={ outline ? 'outline' : 'solid' }
						options={ [
							{ value: 'solid', label: __( 'Solid', 'harlow' ) },
							{
								value: 'outline',
								label: __( 'Outline', 'harlow' ),
							},
						] }
						onChange={ ( v ) =>
							setAttributes( { unmarkedStyle: v } )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Title', 'harlow' ) }
						value={ title }
						onChange={ ( v ) => setAttributes( { title: v } ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ `${ __( 'Alignment', 'harlow' ) } (${ deviceLabel })` }
						value={ attributes[ alignKey ] || '' }
						options={ [
							{ value: '', label: __( 'Default', 'harlow' ) },
							{ value: 'left', label: __( 'Left', 'harlow' ) },
							{
								value: 'center',
								label: __( 'Center', 'harlow' ),
							},
							{ value: 'right', label: __( 'Right', 'harlow' ) },
							{
								value: 'justify',
								label: __( 'Justified', 'harlow' ),
							},
						] }
						onChange={ ( v ) =>
							setAttributes( { [ alignKey ]: v } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ '\n' }
				<div className="elementor-widget-container">
					{ '\n' }
					<div className="elementor-star-rating__wrapper">
						{ '\n' }
						{ title.trim() !== '' && (
							<div className="elementor-star-rating__title">
								{ title.trim() }
							</div>
						) }
						{ title.trim() !== '' && '\n' }
						<div
							className="elementor-star-rating"
							title={ text }
							itemType="http://schema.org/Rating"
							itemScope
							itemProp="reviewRating"
						>
							{ stars }{ ' ' }
							<span
								itemProp="ratingValue"
								className="elementor-screen-only"
							>
								{ text }
							</span>
						</div>
						{ '\n' }
					</div>
					{ '\n' }
				</div>
				{ '\n' }
			</div>
		</>
	);
}
