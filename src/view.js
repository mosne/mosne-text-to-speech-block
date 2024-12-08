/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const { state, actions } = store( 'create-block', {
	state: {
		isPlaying: false,
		currentVoice: null,
		utterance: null,
		voices: [],
	},
	actions: {
		async loadVoices() {
			console.log( 'loadVoices' );
			const context = getContext();
			const availableVoices = window.speechSynthesis.getVoices();
			context.voices = availableVoices;

			// get current docuemtn locale
			const currentLocale = document.documentElement.lang;

			// Set default French voice or first available
			const localVoices = availableVoices.filter( ( voice ) =>
				voice.lang.startsWith( currentLocale )
			);
			if ( localVoices.length > 0 ) {
				context.voices = localVoices;
				context.currentVoice = localVoices[ 0 ];
				console.log( 'current', context.currentVoice );
				console.log( 'voices', context.voices );
			}
			// Create initial utterance
			actions.createUtterance();
		},
		createUtterance() {
			const context = getContext();
			const content = document.querySelector( 'main' )?.innerText || '';
			const newUtterance = new SpeechSynthesisUtterance( content );
			newUtterance.lang = document.documentElement.lang;

			if ( context.currentVoice ) {
				console.log( 'voice', context.currentVoice );
				newUtterance.voice = context.currentVoice;
			}

			context.utterance = newUtterance;
			console.log( 'utterance', context.utterance );
		},
		upadateUtterance() {
			const context = getContext();
			const utterance = context.utterance;
			if ( utterance ) {
				window.speechSynthesis.cancel();
				utterance.voice = context.currentVoice;
				context.isPlaying = false;
				// console.log('changed',utterance);
			}
		},
		Play() {
			const context = getContext();
			context.isPlaying = true;
			console.log( 'play', context.utterance );
			console.log( 'status', window.speechSynthesis );
			// init speach to text
			if ( window.speechSynthesis.paused ) {
				window.speechSynthesis.resume();
			} else if ( context.utterance ) {
				window.speechSynthesis.cancel();
				window.speechSynthesis.speak( context.utterance );
			}
		},
		Pause() {
			//console.log('pause');
			const context = getContext();
			context.isPlaying = false;
			window.speechSynthesis.pause();
			// pause speach to text
		},
		Restart() {
			//console.log('pause');
			const context = getContext();
			context.isPlaying = false;
			window.speechSynthesis.cancel();
		},
		changeVoice( e ) {
			const context = getContext();
			const voice = context.voices.find(
				( v ) => v.voiceURI === e.target.value
			);
			if ( voice ) {
				context.currentVoice = voice;
				// console.log('change',context.currentVoice);
				actions.upadateUtterance();
			}
		},
	},
	callbacks: {
		init() {
			// Initialize voices when available
			if ( window.speechSynthesis ) {
				actions.loadVoices();
				//console.log('init1');
				if ( window.speechSynthesis.onvoiceschanged !== undefined ) {
					window.speechSynthesis.onvoiceschanged = actions.loadVoices;
					//console.log('init2');
				}
			}
		},
		isSelected() {
			const context = getContext();
			//console.log('isSelected',context.voice.voiceURI, context.currentVoice.voiceURI);
			return context.voice.voiceURI === context.currentVoice.voiceURI;
		},
	},
} );
