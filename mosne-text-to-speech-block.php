<?php
/**
 * Plugin Name:       Mosne Text to Speech Block
 * Description:       Read the content of of a page using native Speech Synthesis and  Interactivity API.
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Version:           0.1.1
 * Author:            Mosne
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * author URI:        https://mosne.it
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       mosne-text-to-speech-block
 *
 * @package           create-block
 */

namespace Mosne\TextToSpeech;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Plugin constants
define( 'MOSNE_TEXT_TO_SPEECH_VERSION', '0.1.1' );

add_action( 'init', __NAMESPACE__ . '\\mosne_text_to_speach_init' );


/**
 * Registers the block using the metadata loaded from the `block.json` file.
 * Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://developer.wordpress.org/reference/functions/register_block_type/
 */
function mosne_text_to_speach_init() {
	register_block_type_from_metadata( __DIR__ . '/build' );
}
