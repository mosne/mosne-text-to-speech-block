<div
	<?php echo get_block_wrapper_attributes(); ?>
	data-wp-interactive="create-block"
	<?php echo wp_interactivity_data_wp_context( array( 'isPlaying' => false ) ); ?>
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
	data-wp-on--change="actions.ChangeVoice"
	data-wp-context='{ "voices": ["voice1","voice2"] }'>
	>
		<option value=""><?php esc_html_e( 'Select a voice', 'mosne-speech-to-text-block' ); ?></option>
		<template data-wp-each="context.voices">
        	<option data-wp-text="context.item" data-wp-value="context.item"></option>
    	</template>
	</select>
</div>
