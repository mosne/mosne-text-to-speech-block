/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const { actions } = store( 'mosne-speech-to-text-block', {
	state: {
		isPlaying: false,
		currentVoice: null,
		utterance: null,
		voices: [],
	},
	actions: {
		async loadVoices() {
			// console.log( 'loadVoices' );
			const context = getContext();
			const availableVoices = window.speechSynthesis.getVoices();
			// console.log( 'voices', availableVoices );
			context.voices = availableVoices;
			context.currentVoice = availableVoices[ 0 ];

			// get current docuemtn locale
			const currentLocale = document.documentElement.lang;
			// console.log( 'currentLocale', currentLocale );

			// Set default French voice or first available
			const localVoices = availableVoices.filter( ( voice ) =>
				voice.lang.startsWith( currentLocale )
			);

			console.log( 'localVoices', localVoices );
			if ( localVoices.length > 0 ) {
				context.voices = localVoices;
				context.currentVoice = localVoices[ 0 ];
				//	console.log( 'current', context.currentVoice );
				//	console.log( 'voices', context.voices );
			}
			// Create initial utterance
			actions.createUtterance();
		},
		createUtterance() {
			const context = getContext();
			const content = actions.getContent();

			const newUtterance = new SpeechSynthesisUtterance( content );
			newUtterance.lang = document.documentElement.lang;

			if ( context.currentVoice ) {
				//	console.log( 'voice', context.currentVoice );
				newUtterance.voice = context.currentVoice;
			}

			context.utterance = newUtterance;
			//console.log( 'utterance', context.utterance );
		},
		upadateUtterance() {
			const context = getContext();
			const utterance = context.utterance;
			if ( utterance ) {
				window.speechSynthesis.cancel();
				context.isPlaying = false;
				actions.createUtterance();
			}
		},
		Play() {
			const context = getContext();
			context.isPlaying = true;
			// console.log( 'play', context.utterance );
			// console.log( 'status', window.speechSynthesis );
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
		getContent() {
			// grab all the text content from the page inside the main element exclude recursivelly the text inside the class skip-speach
			let content = '';
			let cloneMain = document.querySelector( 'main' ).cloneNode( true );
			if ( cloneMain ) {
				const skip = cloneMain.querySelectorAll( '.skip-speach' );
				skip.forEach( ( el ) => {
					el.remove();
				} );
				content = cloneMain.textContent;
				cloneMain = null;
			}
			return content;
		},
	},
	callbacks: {
		init() {
			// Initialize voices when available
			if ( window.speechSynthesis ) {
				window.speechSynthesis.cancel();
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
