/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const { state, actions } = store( 'mosne-text-to-speech-block', {
	state: {
		isPlaying: false,
		currentVoice: null,
		preferredVoice:
			window.localStorage.getItem(
				'mosne-tts-lang-' + document.documentElement.lang
			) || null,
		utterance: null,
		voices: [],
		currentSpeed:
			window.localStorage.getItem(
				'mosne-tts-speed-' + document.documentElement.lang
			) || 1,
		currentPitch:
			window.localStorage.getItem(
				'mosne-tts-pitch-' + document.documentElement.lang
			) || 1,
	},
	actions: {
		loadVoices() {
			const availableVoices = window.speechSynthesis.getVoices();
			if ( ! availableVoices ) {
				console.warn( 'No voices available' ); // eslint-disable-line
				return;
			}
			state.voices = availableVoices;
			state.currentVoice = availableVoices[ 0 ];

			// get current docuemtn locale
			const currentLocale = document.documentElement.lang;

			// Set default French voice or first available
			const localVoices = availableVoices.filter( ( voice ) =>
				voice.lang.startsWith( currentLocale )
			);

			if ( localVoices.length > 0 ) {
				state.voices = localVoices;
				state.currentVoice = localVoices[ 0 ];
				if ( state.preferredVoice ) {
					const voice = localVoices.find(
						( v ) => v.voiceURI === state.preferredVoice
					);
					if ( voice ) {
						state.currentVoice = voice;
					}
				}
			}
			// Create initial utterance
			actions.createUtterance();
		},
		createUtterance() {
			const content = actions.getContent();

			const newUtterance = new window.SpeechSynthesisUtterance( content );
			newUtterance.lang = document.documentElement.lang;
			newUtterance.rate = state.currentSpeed;
			newUtterance.pitch = state.currentPitch;

			if ( state.currentVoice ) {
				const voice = state.voices.find(
					( v ) => v.voiceURI === state.currentVoice.voiceURI
				);
				newUtterance.voice = voice;
			} else {
				console.warn( 'Current Voice not found' ); // eslint-disable-line
			}
			state.utterance = newUtterance;
		},
		upadateUtterance() {
			const context = getContext();
			const utterance = state.utterance;
			if ( utterance ) {
				window.speechSynthesis.cancel();
				context.utterance = null;
				context.isPlaying = false;
				actions.createUtterance();
			} else {
				console.warn( 'Utterance not found' ); // eslint-disable-line
			}
		},
		Play() {
			const context = getContext();
			context.isPlaying = true;

			// init speach to text
			if ( window.speechSynthesis.paused ) {
				window.speechSynthesis.resume();
			} else if ( state.utterance ) {
				window.speechSynthesis.cancel();
				window.speechSynthesis.speak( state.utterance );
			} else {
				console.warn( 'Utterance not found' ); // eslint-disable-line
			}
		},
		Pause() {
			const context = getContext();
			context.isPlaying = false;
			window.speechSynthesis.pause();
		},
		Restart() {
			const context = getContext();
			context.isPlaying = false;
			window.speechSynthesis.cancel();
		},
		changeVoice( e ) {
			const context = getContext();
			context.isPlaying = false;
			const voice = state.voices.find(
				( v ) => v.voiceURI === e.target.value
			);
			// Reset current utterance
			window.speechSynthesis.cancel();
			if ( voice ) {
				state.currentVoice = voice;
				window.localStorage.setItem(
					'mosne-tts-lang-' + document.documentElement.lang,
					voice.voiceURI
				);
				actions.upadateUtterance();
			} else {
				console.warn( 'Voice not found' ); // eslint-disable-line
			}
		},
		changeSpeed( e ) {
			state.currentSpeed = e.target.value;
			window.localStorage.setItem(
				'mosne-tts-speed-' + document.documentElement.lang,
				e.target.value
			);
			actions.upadateUtterance();
		},
		changePitch( e ) {
			state.currentPitch = e.target.value;
			window.localStorage.setItem(
				'mosne-tts-pitch-' + document.documentElement.lang,
				e.target.value
			);
			actions.upadateUtterance();
		},
		toggleSettings() {
			const context = getContext();
			context.showSettings = ! context.showSettings;
		},
		getContent() {
			// grab all the text content from the page inside the main element exclude recursivelly the text inside the class skip-speach
			let content = '';
			let cloneMain = document.querySelector( 'main' ).cloneNode( true );
			if ( cloneMain ) {
				const skip = cloneMain.querySelectorAll( '.skip-speech' );
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
				if ( window.speechSynthesis.onvoiceschanged !== undefined ) {
					window.speechSynthesis.onvoiceschanged = actions.loadVoices;
				}
			}
		},
		isSelected() {
			const context = getContext();
			return context.voice.voiceURI === state.currentVoice.voiceURI;
		},
	},
} );
