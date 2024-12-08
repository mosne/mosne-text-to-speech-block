<div
	<?php echo get_block_wrapper_attributes(array("class"=>"skip-speach")); ?>
	data-wp-interactive="mosne-speech-to-text-block"
	data-wp-init="callbacks.init"
	<?php echo wp_interactivity_data_wp_context( 
		[
		 'isPlaying' => false,
		 'voices' => []
		 ]
		 );
		  ?>
>
	<button
		data-wp-on--click="actions.Play"
		data-wp-bind--hidden="context.isPlaying"
	>
	<?php esc_html_e( 'Play', 'mosne-speech-to-text-block' ); ?>
	</button>

	<button
		data-wp-on--click="actions.Pause"
		data-wp-bind--hidden="!context.isPlaying"
	>
	<?php esc_html_e( 'Pause', 'mosne-speech-to-text-block' ); ?>
	</button>

	<button
		data-wp-on--click="actions.Restart"
		data-wp-bind--hidden="!context.isPlaying"
	>
	<?php esc_html_e( 'Restart', 'mosne-speech-to-text-block' ); ?>
	</button>
	<label>
		<?php esc_html_e( 'Voices', 'mosne-speech-to-text-block' ); ?>
	</label>
	<select
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
</div>
