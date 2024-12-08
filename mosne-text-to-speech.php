<?php
/**
 * Plugin Name:       Mosne Text to Speech Block
 * Description:       Read the content of of a page using native Speech Synthesis and  Interactivity API.
 * Version:           0.1.0
 * Requires at least: 6.6
 * Requires PHP:      7.2
 * Author:            The WordPress Contributors
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       mosne-speech-to-text-block
 *
 * @package           create-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 * Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://developer.wordpress.org/reference/functions/register_block_type/
 */
function mosne_text_to_speach_init() {
	register_block_type_from_metadata( __DIR__ . '/build' );

	// Register block styles
	register_block_style(
			'mosne/text-to-speech',
			 [
				'name'         => 'minimal',
				'label'        => 'Minimal',
			]
	);
}
add_action( 'init', 'mosne_text_to_speach_init' );
