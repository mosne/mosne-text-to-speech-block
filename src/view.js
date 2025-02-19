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
			const newUtterance = new window.SpeechSynthesisUtterance(content);
			newUtterance.lang = document.documentElement.lang;
			newUtterance.rate = state.currentSpeed;
			newUtterance.pitch = state.currentPitch;

			// Get the main element for highlighting
			const mainElement = document.querySelector('main');
			
			// Add word boundary event handler
			newUtterance.onboundary = (event) => {
				if (event.name === 'word') {
					// Remove any existing highlights
					const existing = mainElement.querySelector('.mosne-tts-highlighted-word');
					if (existing) {
						const parent = existing.parentNode;
						parent.replaceChild(
							document.createTextNode(existing.textContent),
							existing
						);
					}

					// Find and highlight the current word
					const wordPosition = event.charIndex;
					const wordLength = event.charLength || 1;
					const range = document.createRange();
					const walker = document.createTreeWalker(
						mainElement,
						NodeFilter.SHOW_TEXT,
						{
							acceptNode: function(node) {
								// Skip nodes that are within .skip-speech elements
								if (node.parentElement.closest('.skip-speech')) {
									return NodeFilter.FILTER_REJECT;
								}
								return NodeFilter.FILTER_ACCEPT;
							}
						},
						false
					);

					let currentIndex = 0;
					let node = walker.nextNode();

					// Find the text node containing the word
					while (node) {
						if (currentIndex + node.length > wordPosition) {
							const nodeOffset = wordPosition - currentIndex;
							
							// Create highlight span
							const span = document.createElement('span');
							span.className = 'mosne-tts-highlighted-word';
							
							// Set the range to the current word
							range.setStart(node, nodeOffset);
							range.setEnd(node, nodeOffset + wordLength);
							
							try {
								// Replace the text with highlighted span
								range.surroundContents(span);
							} catch (e) {
								// If highlighting fails, continue without highlighting this word
								console.warn('Failed to highlight word:', e);
							}
							break;
						}
						currentIndex += node.length;
						node = walker.nextNode();
					}
				}
			};

			// Reset highlighting when speech ends
			newUtterance.onend = () => {
				const highlighted = mainElement.querySelectorAll('.mosne-tts-highlighted-word');
				highlighted.forEach(el => {
					const parent = el.parentNode;
					parent.replaceChild(
						document.createTextNode(el.textContent),
						el
					);
				});
			};

			if (state.currentVoice) {
				const voice = state.voices.find(
					(v) => v.voiceURI === state.currentVoice.voiceURI
				);
				newUtterance.voice = voice;
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
			
			// Remove any existing highlights
			const mainElement = document.querySelector('main');
			const highlighted = mainElement.querySelectorAll('.mosne-tts-highlighted-word');
			highlighted.forEach(el => {
				const parent = el.parentNode;
				parent.replaceChild(
					document.createTextNode(el.textContent),
					el
				);
			});
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

class TextToSpeechManager {
	constructor() {
		this.utterance = null;
		this.highlightedElement = null;
		this.originalText = '';
		this.synth = window.speechSynthesis;
	}

	speak(text, element) {
		// Cancel any ongoing speech
		this.synth.cancel();
		
		this.utterance = new SpeechSynthesisUtterance(text);
		this.highlightedElement = element;
		this.originalText = text;

		// Split text into words while preserving punctuation
		const words = text.match(/[\w'-]+|[.,!?;]|\s+/g);
		let currentIndex = 0;

		this.utterance.onboundary = (event) => {
			if (event.name === 'word') {
				// Remove previous highlighting
				this.highlightedElement.innerHTML = this.originalText;
				
				// Calculate the word position
				const wordPosition = event.charIndex;
				const wordLength = event.charLength || 1;

				// Create highlighted version
				const beforeText = this.originalText.substring(0, wordPosition);
				const highlightedWord = this.originalText.substring(wordPosition, wordPosition + wordLength);
				const afterText = this.originalText.substring(wordPosition + wordLength);

				// Apply highlighting
				this.highlightedElement.innerHTML = `${beforeText}<span class="highlighted-word">${highlightedWord}</span>${afterText}`;
			}
		};

		this.utterance.onend = () => {
			// Reset highlighting when speech ends
			if (this.highlightedElement) {
				this.highlightedElement.innerHTML = this.originalText;
			}
		};

		this.synth.speak(this.utterance);
	}

	stop() {
		this.synth.cancel();
		if (this.highlightedElement) {
			this.highlightedElement.innerHTML = this.originalText;
		}
	}
}

// Add CSS styles for highlighting
const style = document.createElement('style');
style.textContent = `
	.mosne-tts-highlighted-word {
		outline: 2px solid currentColor;
		outline-offset: 3px;
	}
`;
document.head.appendChild(style);
