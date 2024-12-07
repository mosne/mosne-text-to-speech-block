/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const { state } = store( 'create-block', {
	state: {
		get currentLocale() {
			return 'en';
		},
		isPlaying: false,
		get isPlaying() {
			return this.isPlaying;
		},
		get voices() {
			return ['voice1', 'voice2'];
		},
		get currentVoice() {
			return 'voice1';
		}
	},
	actions: {
		Play() {
			const context = getContext();
			context.isPlaying = true;
			// init speach to text
		},
		Pause() {
			const context = getContext();
			context.isPlaying = false;
			// pause speach to text
		},
		changeVoice() {
			const context = getContext();
			context.isPlaying = false;
			// pause speach to text
		}
	},
	callbacks: {
		getPageConent: () => {
			// get all voices
			return document.querySelector(main).innerText;
		},
	},
} );
