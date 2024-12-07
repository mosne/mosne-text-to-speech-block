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
    get availableVoices() {
      return this.voices;
    },
    get currentVoiceURI() {
      return this.currentVoice?.voiceURI;
    },
    get isPlaying() {
      return this.isPlaying;
    }
	},
	actions: {
		loadVoices() {
      const context = getContext();
      const availableVoices = window.speechSynthesis.getVoices();
      context.voices = availableVoices;

			// get current docuemtn locale
			const currentLocale = document.documentElement.lang;

			// Set default French voice or first available
      const localVoice = availableVoices.find(voice =>
        voice.lang.startsWith(currentLocale)) || availableVoices[0];
      context.currentVoice = localVoice;

      // Create initial utterance
      actions.createUtterance();
    },
		createUtterance() {
      const context = getContext();
      const content = document.querySelector('main')?.innerText || '';
      const newUtterance = new SpeechSynthesisUtterance(content);
      newUtterance.lang = document.documentElement.lang;

			if (context.currentVoice) {
        newUtterance.voice = context.currentVoice;
      }

      context.utterance = newUtterance;
    },
		Play() {
			const context = getContext();
			context.isPlaying = true;
			// init speach to text
			if (window.speechSynthesis.paused) {
				window.speechSynthesis.resume();
			} else if (context.utterance) {
				window.speechSynthesis.speak(context.utterance);
			}
		},
		Pause() {
			const context = getContext();
			context.isPlaying = false;
			window.speechSynthesis.pause();
			// pause speach to text
		},
		changeVoice(e) {
			const context = getContext();
      const voice = context.voices.find(v => v.voiceURI === e.target.value);
      if (voice) {
        context.currentVoice = voice;
        actions.createUtterance();
      }
		}
	},
	callbacks: {
		init() {
			// Initialize voices when available
			if (window.speechSynthesis) {
				actions.loadVoices();
				if (window.speechSynthesis.onvoiceschanged !== undefined) {
				window.speechSynthesis.onvoiceschanged = actions.loadVoices;
				}
			}
		}
	},
} );
