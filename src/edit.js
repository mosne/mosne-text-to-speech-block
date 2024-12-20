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
import { RichText, useBlockProps } from '@wordpress/block-editor';

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
	const blockProps = useBlockProps();
	const { label } = attributes;

	return (
		<div { ...blockProps }>
			<RichText
				tagName="p"
				className="wp-block-mosne-text-to-speech__title"
				allowedFormats={ [ 'core/image', 'core/italic', 'core/bold' ] }
				value={ label }
				placeholder={ __(
					'Listen to this article',
					'mosne-text-to-speech'
				) }
				onChange={ ( content ) => {
					setAttributes( { label: content } );
				} }
			/>
			<div className="wp-block-mosne-text-to-speech__content">
				<div className="wp-block-mosne-text-to-speech__controls">
					<button className="wp-block-mosne-text-to-speech__button wp-element-button">
						{ __( 'Play', 'mosne-text-to-speech' ) }
					</button>
				</div>
				<div className="wp-block-mosne-text-to-speech__voices">
					<label
						htmlFor="voices"
						className="wp-block-mosne-text-to-speech__label"
					>
						{ __( 'Voice', 'mosne-text-to-speech' ) }
					</label>
					<select
						id="voices"
						className="wp-block-mosne-text-to-speech__select"
					>
						<option value="">
							{ __( 'Select a voice', 'mosne-text-to-speech' ) }
						</option>
					</select>
				</div>
			</div>
		</div>
	);
}
