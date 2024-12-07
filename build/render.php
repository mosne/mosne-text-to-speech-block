<div
	<?php echo get_block_wrapper_attributes(); ?>
	data-wp-interactive="create-block"
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
		data-wp--hide="state.isPlaying"
	>
	<?php esc_html_e( 'Play', 'mosne-speech-to-text-block' ); ?>
	</button>
	<button
		data-wp-on--click="actions.Pause"
		data-wp--hide="!state.isPlaying"
	>
	<?php esc_html_e( 'Pause', 'mosne-speech-to-text-block' ); ?>
	</button>
	<select
	data-wp-on--change="actions.changeVoice"
	data-wp-context='{ "voices" }'>
	>
		<option value=""><?php esc_html_e( 'Select a voice', 'mosne-speech-to-text-block' ); ?></option>
		<template data-wp-each--voice="context.voices">
        	<option
			data-wp-text="context.voice.voiceURI"
			data-wp-key="context.voice.voiceURI"
			data-wp-bind--value="context.voice.voiceURI"
			data-wp-bind--selected="context.voice.voiceURI === context.currentVoice"
			></option>
    	</template>
	</select>
</div>
