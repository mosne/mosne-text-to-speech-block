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
			if ( ! availableVoices || availableVoices.length === 0 ) {
				// If voices aren't available yet, try again after a short delay
				setTimeout( () => actions.loadVoices(), 100 );
				return;
			}

			state.voices = availableVoices;
			state.currentVoice = availableVoices[ 0 ];

			const currentLocale = document.documentElement.lang;
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

			// Create initial utterance after a small delay
			setTimeout( () => {
				actions.createUtterance();
			}, 50 );
		},
		createUtterance() {
			const content = actions.getContent();

			const newUtterance = new window.SpeechSynthesisUtterance( content );
			newUtterance.lang = document.documentElement.lang;
			newUtterance.rate = state.currentSpeed;
			newUtterance.pitch = state.currentPitch;

			// Get the main element for highlighting
			const mainElement = document.querySelector( 'main' );

			newUtterance.onboundary = function ( event ) {
				if ( ! mainElement ) return;

				// Remove previous highlights by unwrapping
				const highlighted = mainElement.querySelectorAll(
					'.mosne-tts-highlighted-word'
				);
				highlighted.forEach( ( wrapper ) => {
					// Replace the wrapper with its text content
					const parent = wrapper.parentNode;
					parent.replaceChild(
						document.createTextNode( wrapper.textContent ),
						wrapper
					);
				} );

				// Safety check for valid boundary event
				if (
					! event.charIndex ||
					! event.charLength ||
					event.charIndex + event.charLength > content.length
				) {
					return;
				}

				try {
					const walker = document.createTreeWalker(
						mainElement,
						NodeFilter.SHOW_TEXT,
						{
							acceptNode: function ( node ) {
								let current = node.parentElement;
								while ( current ) {
									if (
										current.classList &&
										current.classList.contains(
											'skip-speech'
										)
									) {
										return NodeFilter.FILTER_REJECT;
									}
									current = current.parentElement;
								}
								return NodeFilter.FILTER_ACCEPT;
							},
						},
						false
					);

					let charCount = 0;
					let node;

					// Find the text node that contains the current position
					while ( ( node = walker.nextNode() ) ) {
						const nodeLength = node.length;
						if ( charCount + nodeLength > event.charIndex ) {
							// Found the node containing the current position
							const blockWrapper = document.querySelector(
								'[data-wp-interactive="mosne-text-to-speech-block"]'
							);
							const highlightBackground =
								blockWrapper?.dataset.highlightBackground ||
								'#ffeb3b';
							const highlightColor =
								blockWrapper?.dataset.highlightColor ||
								'#000000';

							// Create wrapper span
							const wrapper = document.createElement( 'span' );
							wrapper.className = 'mosne-tts-highlighted-word';
							wrapper.style.setProperty(
								'--mosne-tts-highlight-bg',
								highlightBackground
							);
							wrapper.style.setProperty(
								'--mosne-tts-highlight-color',
								highlightColor
							);

							// Wrap the text content
							wrapper.textContent = node.textContent;
							node.parentNode.replaceChild( wrapper, node );
							break;
						}
						charCount += nodeLength;
					}
				} catch ( e ) {
					console.error( 'Highlighting error:', e );
				}
			};

			// Update the onend event handler to unwrap text
			newUtterance.onend = function () {
				if ( mainElement ) {
					const highlighted = mainElement.querySelectorAll(
						'.mosne-tts-highlighted-word'
					);
					highlighted.forEach( ( wrapper ) => {
						const parent = wrapper.parentNode;
						parent.replaceChild(
							document.createTextNode( wrapper.textContent ),
							wrapper
						);
					} );
				}
			};

			if ( state.currentVoice ) {
				const voice = state.voices.find(
					( v ) => v.voiceURI === state.currentVoice.voiceURI
				);
				newUtterance.voice = voice;
			}
			state.utterance = newUtterance;
		},
		updateUtterance() {
			const utterance = state.utterance;
			if ( utterance ) {
				window.speechSynthesis.cancel();

				// Remove any existing highlights
				const mainElement = document.querySelector( 'main' );
				if ( mainElement ) {
					const highlighted = mainElement.querySelectorAll(
						'.mosne-tts-highlighted-word'
					);
					highlighted.forEach( ( el ) => {
						const parent = el.parentNode;
						parent.replaceChild(
							document.createTextNode( el.textContent ),
							el
						);
					} );
				}

				// Update state directly without relying on context
				state.isPlaying = false;

				// Check if synthesis is ready using a promise
				const checkSynthesisReady = () => {
					return new Promise( ( resolve ) => {
						const check = () => {
							if (
								! window.speechSynthesis.speaking &&
								! window.speechSynthesis.pending
							) {
								resolve();
							} else {
								setTimeout( check, 100 );
							}
						};
						check();
					} );
				};

				// Wait for synthesis to be ready before creating new utterance
				checkSynthesisReady().then( () => {
					actions.createUtterance();
				} );
			}
		},
		Play() {
			const context = getContext();
			context.isPlaying = true;

			// If paused, just resume
			if ( window.speechSynthesis.paused ) {
				window.speechSynthesis.resume();
				return;
			}

			// Chrome fix: force reset synthesis if it's in a bad state
			if ( window.speechSynthesis.speaking ) {
				window.speechSynthesis.cancel();
				setTimeout( () => {
					if ( state.utterance ) {
						window.speechSynthesis.speak( state.utterance );
					}
				}, 50 );
				return;
			}

			// Start new speech if not already speaking
			if ( state.utterance ) {
				window.speechSynthesis.speak( state.utterance );
			}
		},
		Pause() {
			const context = getContext();
			context.isPlaying = false;

			// Only pause if currently speaking and the browser supports pausing
			if (
				window.speechSynthesis.speaking &&
				! window.speechSynthesis.paused
			) {
				window.speechSynthesis.pause();
			}
		},
		Restart() {
			const context = getContext();
			context.isPlaying = false;
			window.speechSynthesis.cancel();

			// Remove any existing highlights
			const mainElement = document.querySelector( 'main' );
			const highlighted = mainElement.querySelectorAll(
				'.mosne-tts-highlighted-word'
			);
			highlighted.forEach( ( el ) => {
				const parent = el.parentNode;
				parent.replaceChild(
					document.createTextNode( el.textContent ),
					el
				);
			} );
		},
		changeVoice( e ) {
			const context = getContext();
			context.isPlaying = false;

			// Cancel any ongoing speech
			window.speechSynthesis.cancel();

			const voice = state.voices.find(
				( v ) => v.voiceURI === e.target.value
			);

			if ( voice ) {
				state.currentVoice = voice;
				window.localStorage.setItem(
					'mosne-tts-lang-' + document.documentElement.lang,
					voice.voiceURI
				);

				// Small delay to ensure speech synthesis is ready
				setTimeout( () => {
					actions.updateUtterance();
				}, 50 );
			}
		},
		changeSpeed( e ) {
			const context = getContext();
			context.isPlaying = false;

			// Cancel current speech
			window.speechSynthesis.cancel();

			// Update state
			state.currentSpeed = e.target.value;
			window.localStorage.setItem(
				'mosne-tts-speed-' + document.documentElement.lang,
				e.target.value
			);

			// Check if synthesis is ready using a promise
			const checkSynthesisReady = () => {
				return new Promise( ( resolve ) => {
					const check = () => {
						if (
							! window.speechSynthesis.speaking &&
							! window.speechSynthesis.pending
						) {
							resolve();
						} else {
							setTimeout( check, 100 );
						}
					};
					check();
				} );
			};

			// Wait for synthesis to be ready before creating new utterance
			checkSynthesisReady().then( () => {
				actions.createUtterance();
				if ( context.isPlaying ) {
					setTimeout( () => {
						window.speechSynthesis.speak( state.utterance );
					}, 50 );
				}
			} );
		},
		changePitch( e ) {
			const context = getContext();
			context.isPlaying = false;

			// Cancel current speech
			window.speechSynthesis.cancel();

			// Update state
			state.currentPitch = e.target.value;
			window.localStorage.setItem(
				'mosne-tts-pitch-' + document.documentElement.lang,
				e.target.value
			);

			// Check if synthesis is ready using a promise
			const checkSynthesisReady = () => {
				return new Promise( ( resolve ) => {
					const check = () => {
						if (
							! window.speechSynthesis.speaking &&
							! window.speechSynthesis.pending
						) {
							resolve();
						} else {
							setTimeout( check, 100 );
						}
					};
					check();
				} );
			};

			// Wait for synthesis to be ready before creating new utterance
			checkSynthesisReady().then( () => {
				actions.createUtterance();
				if ( context.isPlaying ) {
					setTimeout( () => {
						window.speechSynthesis.speak( state.utterance );
					}, 50 );
				}
			} );
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

				// Add beforeunload event listener
				window.addEventListener( 'beforeunload', () => {
					window.speechSynthesis.cancel();
				} );
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

	speak( text, element ) {
		// Cancel any ongoing speech
		this.synth.cancel();

		this.utterance = new SpeechSynthesisUtterance( text );
		this.highlightedElement = element;
		this.originalText = text;

		// Split text into words while preserving punctuation
		const words = text.match( /[\w'-]+|[.,!?;]|\s+/g );
		let currentIndex = 0;

		this.utterance.onboundary = ( event ) => {
			if ( event.name === 'word' ) {
				// Remove previous highlighting
				this.highlightedElement.innerHTML = this.originalText;

				// Calculate the word position
				const wordPosition = event.charIndex;
				const wordLength = event.charLength || 1;

				// Create highlighted version
				const beforeText = this.originalText.substring(
					0,
					wordPosition
				);
				const highlightedWord = this.originalText.substring(
					wordPosition,
					wordPosition + wordLength
				);
				const afterText = this.originalText.substring(
					wordPosition + wordLength
				);

				// Apply highlighting
				this.highlightedElement.innerHTML = `${ beforeText }<span class="highlighted-word">${ highlightedWord }</span>${ afterText }`;
			}
		};

		this.utterance.onend = () => {
			// Reset highlighting when speech ends
			if ( this.highlightedElement ) {
				this.highlightedElement.innerHTML = this.originalText;
			}
		};

		this.synth.speak( this.utterance );
	}

	stop() {
		this.synth.cancel();
		if ( this.highlightedElement ) {
			this.highlightedElement.innerHTML = this.originalText;
		}
	}
}
