<?php
/**
 * PHP file to use when rendering the block type on the server to show on the front end.
 *
 * The following variables are exposed to the file:
 *     $attributes (array): The block attributes.
 *     $content (string): The block default content.
 *     $block (WP_Block): The block instance.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
} // Exit if access directly

$block_title   = $attributes['label'] ?? '';
$class_options = $attributes['classOptions'] ?? '';
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'skip-speech ' . $class_options ) ) ); ?>
	data-wp-interactive="mosne-text-to-speech-block"
	data-wp-init="callbacks.init"
	<?php
	echo wp_kses_data(
		wp_interactivity_data_wp_context(
			[
				'isPlaying'    => false,
				'voices'       => [],
				'showSettings' => false,
				'currentSpeed' => 1.0, // Add default speed
				'currentPitch' => 1.0,  // Add default pitch
			]
		)
	);
	?>
>
	<?php if ( ! empty( $block_title ) ) : ?>
		<div class="wp-block-mosne-text-to-speech__title">
			<?php echo wp_kses_post( $block_title ); ?>
		</div>
	<?php endif; ?>
	<div class="wp-block-mosne-text-to-speech__content">
		<div class="wp-block-mosne-text-to-speech__controls">

			<button
				class="wp-block-mosne-text-to-speech__button wp-element-button"
				data-wp-on--click="actions.Play"
				data-wp-bind--hidden="context.isPlaying"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"/>
				</svg>
				<span>
					<?php esc_html_e( 'Play', 'mosne-text-to-speech-block' ); ?>
				</span>
			</button>

			<button
				class="wp-block-mosne-text-to-speech__button wp-element-button"
				data-wp-on--click="actions.Pause"
				data-wp-bind--hidden="!context.isPlaying"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"/>
				</svg>

				<span>
					<?php esc_html_e( 'Pause', 'mosne-text-to-speech-block' ); ?>
				</span>
			</button>

			<button
				class="wp-block-mosne-text-to-speech__button wp-element-button"
				data-wp-on--click="actions.Restart"
				data-wp-bind--hidden="!context.isPlaying"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
				</svg>

				<span>
					<?php esc_html_e( 'Restart', 'mosne-text-to-speech-block' ); ?>
				</span>
			</button>

			<button
				class="wp-block-mosne-text-to-speech__button wp-element-button"
				data-wp-on--click="actions.toggleSettings"
				data-wp-bind--hidden="context.showSettings"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"/>
				</svg>
				<span>
				<?php esc_html_e( 'Show Settings', 'mosne-text-to-speech-block' ); ?>
				</span>
			</button>
			<button
				class="wp-block-mosne-text-to-speech__button wp-element-button"
				data-wp-on--click="actions.toggleSettings"
				data-wp-bind--hidden="!context.showSettings"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"/>
				</svg>
				<span>
				<?php esc_html_e( 'Hide settings', 'mosne-text-to-speech-block' ); ?>
				</span>
			</button>
		</div>

		<div class="wp-block-mosne-text-to-speech__settings" data-wp-bind--hidden="!context.showSettings">

			<label class="wp-block-mosne-text-to-speech__label">
				<?php esc_html_e( 'Speed', 'mosne-text-to-speech-block' ); ?>

				<input type="range" min="0.5" max="2" step="0.1" data-wp-bind--value="state.currentSpeed" data-wp-on--change="actions.changeSpeed">
			</label>

			<label class="wp-block-mosne-text-to-speech__label">
				<?php esc_html_e( 'Pitch', 'mosne-text-to-speech-block' ); ?>

				<input type="range" min="0.5" max="2" step="0.1" data-wp-bind--value="state.currentPitch" data-wp-on--change="actions.changePitch">
			</label>

			<label class="wp-block-mosne-text-to-speech__label">
				<?php esc_html_e( 'Voice', 'mosne-text-to-speech-block' ); ?>

				<select
					class="wp-block-mosne-text-to-speech__select"
					data-wp-on--change="actions.changeVoice"
				>
					<template data-wp-each--voice="state.voices">
						<option
							data-wp-text="context.voice.name"
							data-wp-key="context.voice.voiceURI"
							data-wp-bind--value="context.voice.voiceURI"
							data-wp-bind--selected="callbacks.isSelected"
						></option>
					</template>
				</select>
			</label>
		</div>
	</div>
</div>
