<?php
$block_title 	= $attributes['label'] ?? '';
$class_options  = $attributes['classOptions'] ?? '';
?>
<div
	<?php echo get_block_wrapper_attributes( array( "class" => "skip-speech ".$class_options ) ); ?>
		data-wp-interactive="mosne-text-to-speech-block"
		data-wp-init="callbacks.init"
	<?php echo wp_interactivity_data_wp_context(
		[
			'isPlaying'    => false,
			'voices'       => [],
			'showSettings' => false,
			'currentSpeed' => 1.0, // Add default speed
			'currentPitch' => 1.0  // Add default pitch
		]
	);
	?>
>
	<?php if(!empty($block_title)): ?>
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
					<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
				</svg>
				<span>
					<?php esc_html_e( 'Play', 'mosne-text-to-speech' ); ?>
				</span>
			</button>

			<button
					class="wp-block-mosne-text-to-speech__button wp-element-button"
					data-wp-on--click="actions.Pause"
					data-wp-bind--hidden="!context.isPlaying"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
					<path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clip-rule="evenodd" />
				</svg>
				<span>
					<?php esc_html_e( 'Pause', 'mosne-text-to-speech' ); ?>
				</span>
			</button>

			<button
					class="wp-block-mosne-text-to-speech__button wp-element-button"
					data-wp-on--click="actions.Restart"
					data-wp-bind--hidden="!context.isPlaying"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061A1.125 1.125 0 0 1 21 8.689v8.122ZM11.25 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061a1.125 1.125 0 0 1 1.683.977v8.122Z" />
				</svg>
				<span>
					<?php esc_html_e( 'Restart', 'mosne-text-to-speech' ); ?>
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
				<?php esc_html_e( 'Show Settings', 'mosne-text-to-speech' ); ?>
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
				<?php esc_html_e( 'Hide settings', 'mosne-text-to-speech' ); ?>
				</span>
			</button>
		</div>

		<div class="wp-block-mosne-text-to-speech__settings" data-wp-bind--hidden="!context.showSettings">

			<label class="wp-block-mosne-text-to-speech__label">
				<?php esc_html_e( 'Speed', 'mosne-text-to-speech' ); ?>

				<input type="range" min="0.5" max="2" step="0.1" data-wp-bind--value="context.currentSpeed" data-wp-on--change="actions.changeSpeed">
			</label>

			<label class="wp-block-mosne-text-to-speech__label">
				<?php esc_html_e( 'Pitch', 'mosne-text-to-speech' ); ?>

				<input type="range" min="0.5" max="2" step="0.1" data-wp-bind--value="context.currentPitch" data-wp-on--change="actions.changePitch">
			</label>

			<label class="wp-block-mosne-text-to-speech__label">
				<?php esc_html_e( 'Voice', 'mosne-text-to-speech' ); ?>

				<select
						class="wp-block-mosne-text-to-speech__select"
						data-wp-on--change="actions.changeVoice"
						data-wp-context='{ "voices" }'>
					>
					<template data-wp-each--voice="context.voices">
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
