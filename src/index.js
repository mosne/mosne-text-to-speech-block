/**
 * Registers a new block provided a unique name and an object defining its behavior.
 *
 * @see https://developer.wordpress.org/block-editor/developers/block-api/#registering-a-block
 */
import { registerBlockType } from '@wordpress/blocks';
import { SVG, Path, Circle } from '@wordpress/components';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * All files containing `style` keyword are bundled together. The code used
 * gets applied both to the front of your site and to the editor. All other files
 * get applied to the editor only.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './style.scss';

/**
 * Internal dependencies
 */
import Edit from './edit';
import metadata from './block.json';

/**
 * Every block starts by registering a new block type definition.
 *
 * @see https://developer.wordpress.org/block-editor/developers/block-api/#registering-a-block
 */
registerBlockType( metadata.name, {
	icon: {
		src: (
			<SVG
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
			>
				<Circle cx="12" cy="12" r="12" fill="#FF7A00" />
				<Path
					fill="#181818"
					fillRule="evenodd"
					d="m11.388 7.908-2.72 2.72a.578.578 0 0 1-.408.17h-.917v2.31h.917c.153 0 .3.062.408.17l2.72 2.72v-8.09Zm-.817-.817c.728-.728 1.973-.213 1.973.817v8.09c0 1.03-1.245 1.545-1.973.818l-2.55-2.551h-.678a1.156 1.156 0 0 1-1.155-1.156v-2.312c0-.638.517-1.155 1.155-1.155h.677l2.551-2.551Zm4.664.776a.578.578 0 0 1 .817 0 5.779 5.779 0 0 1 0 8.172.578.578 0 1 1-.817-.817 4.623 4.623 0 0 0 0-6.538.578.578 0 0 1 0-.817ZM13.601 9.5a.578.578 0 0 1 .817 0 3.467 3.467 0 0 1 0 4.904.578.578 0 0 1-.817-.817 2.311 2.311 0 0 0 0-3.27.578.578 0 0 1 0-.817Z"
					clipRule="evenodd"
				/>
			</SVG>
		),
		foreground: 'transparent', // Optional: Set the icon color in the block inserter
	},
	/**
	 * @see ./edit.js
	 */
	edit: Edit,
} );
