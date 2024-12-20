<div
	<?php echo get_block_wrapper_attributes( array( "class" => "skip-speech" ) ); ?>
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
	<div class="wp-block-mosne-text-to-speech__title">
		<?php echo wp_kses_post( $attributes['label'] ); ?>
	</div>
	<div class="wp-block-mosne-text-to-speech__content">
		<div class="wp-block-mosne-text-to-speech__controls">

			<button
					class="wp-block-mosne-text-to-speech__button wp-element-button"
					data-wp-on--click="actions.Play"
					data-wp-bind--hidden="context.isPlaying"
			>
				<?php esc_html_e( 'Play', 'mosne-text-to-speech' ); ?>
			</button>

			<button
					class="wp-block-mosne-text-to-speech__button wp-element-button"
					data-wp-on--click="actions.Pause"
					data-wp-bind--hidden="!context.isPlaying"
			>
				<?php esc_html_e( 'Pause', 'mosne-text-to-speech' ); ?>
			</button>

			<button
					class="wp-block-mosne-text-to-speech__button wp-element-button"
					data-wp-on--click="actions.Restart"
					data-wp-bind--hidden="!context.isPlaying"
			>
				<?php esc_html_e( 'Restart', 'mosne-text-to-speech' ); ?>
			</button>

			<button
					class="wp-block-mosne-text-to-speech__button wp-element-button"
					data-wp-on--click="actions.toggleSettings"
			>
				<?php esc_html_e( 'Settings', 'mosne-text-to-speech' ); ?>
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
