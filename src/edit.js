/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import {
	RichText,
	useBlockProps,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line
	PanelBody,
	PanelRow,
	ColorPalette,
} from '@wordpress/components';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props               Properties passed to the function.
 * @param {Object}   props.attributes    Available block attributes.
 * @param {Function} props.setAttributes Function that updates individual attributes.
 *
 * @return {Element} Element to render.
 */
export default function Edit( { attributes, setAttributes } ) {
	const { label, classOptions, highlightBackground, highlightColor } = attributes;
	const blockProps = useBlockProps( {
		className: classOptions,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Settings', 'mosne-text-to-speech-block' ) }
				>
					<ToggleGroupControl
						__nextHasNoMarginBottom
						isBlock
						value={ classOptions }
						label={ __( 'Options', 'mosne-text-to-speech-block' ) }
						onChange={ ( value ) =>
							setAttributes( { classOptions: value } )
						}
					>
						<ToggleGroupControlOption
							label={ __( 'Icon', 'mosne-text-to-speech-block' ) }
							value="has-icon hide-label"
						/>
						<ToggleGroupControlOption
							label={ __(
								'Label',
								'mosne-text-to-speech-block'
							) }
							value="has-label hide-icon"
						/>
						<ToggleGroupControlOption
							label={ __( 'Both', 'mosne-text-to-speech-block' ) }
							value="has-icon has-label"
						/>
					</ToggleGroupControl>
				</PanelBody>
				<PanelBody title={ __( 'Highlight Settings', 'mosne-text-to-speech-block' ) }>
					<PanelRow>
						<div>
							<p>{ __( 'Highlight Background Color', 'mosne-text-to-speech-block' ) }</p>
							<ColorPalette
								value={ highlightBackground }
								onChange={ ( value ) => setAttributes( { highlightBackground: value } ) }
							/>
						</div>
					</PanelRow>
					<PanelRow>
						<div>
							<p>{ __( 'Highlight Text Color', 'mosne-text-to-speech-block' ) }</p>
							<ColorPalette
								value={ highlightColor }
								onChange={ ( value ) => setAttributes( { highlightColor: value } ) }
							/>
						</div>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<RichText
					tagName="p"
					className="wp-block-mosne-text-to-speech__title"
					allowedFormats={ [
						'core/image',
						'core/italic',
						'core/bold',
					] }
					value={ label }
					placeholder={ __(
						'Listen to this article',
						'mosne-text-to-speech-block'
					) }
					onChange={ ( content ) => {
						setAttributes( { label: content } );
					} }
				/>
				<div className="wp-block-mosne-text-to-speech__content">
					<div className="wp-block-mosne-text-to-speech__controls">
						<button className="wp-block-mosne-text-to-speech__button wp-element-button">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="currentColor"
								className="size-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
								/>
							</svg>
							<span>
								{ __( 'Play', 'mosne-text-to-speech-block' ) }
							</span>
						</button>
						<button className="wp-block-mosne-text-to-speech__button wp-element-button">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="currentColor"
								className="size-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
								/>
							</svg>
							<span>
								{ __(
									'Settings',
									'mosne-text-to-speech-block'
								) }
							</span>
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
