/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

// Constants
const STORAGE_KEYS = {
	LANG: ( lang ) => `mosne-tts-lang-${ lang }`,
	SPEED: ( lang ) => `mosne-tts-speed-${ lang }`,
	PITCH: ( lang ) => `mosne-tts-pitch-${ lang }`,
};

const DEFAULTS = {
	HIGHLIGHT_BG: '#ffeb3b',
	HIGHLIGHT_COLOR: '#000000',
	EXCLUDE_CLASS: 'skip-speech',
	WORDS_PER_CHUNK: 200,
};

// Helper functions
const getLocalStorageItem = ( key, defaultValue ) =>
	window.localStorage.getItem( key ) || defaultValue;

const getCurrentLocale = () => document.documentElement.lang;

const getBlockWrapper = () =>
	document.querySelector(
		'[data-wp-interactive="mosne-text-to-speech-block"]'
	);

const getMainElement = () => document.querySelector( 'main' );

const isLeafNode = ( node ) => {
	// Check if this is a text node
	if ( node.nodeType === Node.TEXT_NODE ) {
		return true;
	}

	// For element nodes, check if they only contain text nodes (no other elements)
	if ( node.nodeType === Node.ELEMENT_NODE ) {
		for ( const child of node.childNodes ) {
			if ( child.nodeType !== Node.TEXT_NODE ) {
				return false;
			}
		}
		return true;
	}

	return false;
};

const { state, actions } = store( 'mosne-text-to-speech-block', {
	state: {
		isPlaying: false,
		currentVoice: null,
		preferredVoice: getLocalStorageItem(
			STORAGE_KEYS.LANG( getCurrentLocale() ),
			null
		),
		utterance: null,
		voices: [],
		currentSpeed: getLocalStorageItem(
			STORAGE_KEYS.SPEED( getCurrentLocale() ),
			1
		),
		currentPitch: getLocalStorageItem(
			STORAGE_KEYS.PITCH( getCurrentLocale() ),
			1
		),
		selectedTextRange: { hasSelection: false },
		currentChunk: 0,
		textChunks: [],
		isProcessingChunks: false,
		currentHighlightedNode: null,
	},
	actions: {
		// Speech Synthesis Management
		checkSynthesisReady() {
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
		},

		// Highlighting Management
		clearHighlights() {
			const mainElement = getMainElement();
			if ( ! mainElement ) {
				return;
			}

			const highlighted = mainElement.querySelectorAll(
				'.mosne-tts-highlighted-section'
			);
			highlighted.forEach( ( el ) => {
				const parent = el.parentNode;
				parent.replaceChild(
					document.createTextNode( el.textContent ),
					el
				);
			} );
		},

		createHighlightWrapper( background, color ) {
			const wrapper = document.createElement( 'span' );
			wrapper.className = 'mosne-tts-highlighted-section';
			wrapper.style.backgroundColor = background;
			wrapper.style.color = color;
			return wrapper;
		},

		// Voice Management
		async loadVoices() {
			const availableVoices = window.speechSynthesis.getVoices();
			if ( ! availableVoices?.length ) {
				setTimeout( () => actions.loadVoices(), 100 );
				return;
			}

			const currentLocale = getCurrentLocale();
			const localVoices = availableVoices.filter( ( voice ) =>
				voice.lang.startsWith( currentLocale )
			);

			state.voices =
				localVoices.length > 0 ? localVoices : availableVoices;
			state.currentVoice = state.voices[ 0 ];

			if ( state.preferredVoice ) {
				const voice = state.voices.find(
					( v ) => v.voiceURI === state.preferredVoice
				);
				if ( voice ) {
					state.currentVoice = voice;
				}
			}

			setTimeout( () => actions.createUtterance(), 50 );
		},

		// Utterance Management
		createUtterance() {
			const content =
				state.textChunks.length > 0
					? state.textChunks[ state.currentChunk ]
					: actions.getContent();

			const newUtterance = new window.SpeechSynthesisUtterance( content );
			newUtterance.lang = getCurrentLocale();
			newUtterance.rate = state.currentSpeed;
			newUtterance.pitch = state.currentPitch;

			if ( state.currentVoice ) {
				const voice = state.voices.find(
					( v ) => v.voiceURI === state.currentVoice.voiceURI
				);
				newUtterance.voice = voice;
			}

			actions.setupUtteranceEvents( newUtterance, content );
			state.utterance = newUtterance;
		},

		setupUtteranceEvents( utterance, content ) {
			utterance.onboundary = ( event ) =>
				actions.handleBoundaryEvent( event, content );
			utterance.onend = () => actions.handleUtteranceEnd();
		},

		// Playback Controls
		async Play() {
			const context = getContext();
			context.isPlaying = true;
			state.isPlaying = true;

			if ( state.textChunks.length === 0 || state.currentChunk === 0 ) {
				actions.getContent();
				actions.createUtterance();
			}

			if ( window.speechSynthesis.paused ) {
				window.speechSynthesis.resume();
				return;
			}

			// Chrome fix
			if ( window.speechSynthesis.speaking ) {
				window.speechSynthesis.cancel();
				setTimeout( () => {
					if ( state.utterance ) {
						window.speechSynthesis.speak( state.utterance );
					}
				}, 50 );
				return;
			}

			if ( state.utterance ) {
				window.speechSynthesis.speak( state.utterance );
			}
		},

		Pause() {
			const context = getContext();
			context.isPlaying = false;
			state.isPlaying = false;

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
			state.isPlaying = false;
			window.speechSynthesis.cancel();

			state.currentChunk = 0;
			state.textChunks = [];

			actions.clearHighlights();
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
		async changeSpeed( e ) {
			const context = getContext();
			context.isPlaying = false;
			window.speechSynthesis.cancel();

			state.currentSpeed = e.target.value;
			window.localStorage.setItem(
				'mosne-tts-speed-' + document.documentElement.lang,
				e.target.value
			);

			await actions.checkSynthesisReady();
			actions.createUtterance();

			if ( context.isPlaying ) {
				setTimeout( () => {
					window.speechSynthesis.speak( state.utterance );
				}, 50 );
			}
		},
		async changePitch( e ) {
			const context = getContext();
			context.isPlaying = false;
			window.speechSynthesis.cancel();

			state.currentPitch = e.target.value;
			window.localStorage.setItem(
				'mosne-tts-pitch-' + document.documentElement.lang,
				e.target.value
			);

			await actions.checkSynthesisReady();
			actions.createUtterance();

			if ( context.isPlaying ) {
				setTimeout( () => {
					window.speechSynthesis.speak( state.utterance );
				}, 50 );
			}
		},
		toggleSettings() {
			const context = getContext();
			context.showSettings = ! context.showSettings;
		},
		getContent() {
			// Check if there is highlighted text
			const mainElement = getMainElement();
			const docView = mainElement?.ownerDocument.defaultView;
			const selection = docView ? docView.getSelection() : null;
			let content = '';

			if ( selection && selection.toString().trim().length > 0 ) {
				// Get selected text
				content = selection.toString();
				state.selectedTextRange = {
					text: content,
					hasSelection: true,
				};
			} else {
				// Get content from main element
				let cloneMain = mainElement?.cloneNode( true );
				if ( cloneMain ) {
					// Use the same exclude classes logic for consistency
					const blockWrapper = getBlockWrapper();
					const excludeClassesStr =
						blockWrapper?.dataset.excludeClass ||
						DEFAULTS.EXCLUDE_CLASS;
					const excludeClasses = excludeClassesStr.split( /\s+/ );

					// Remove all elements with excluded classes
					excludeClasses.forEach( ( excludeClass ) => {
						if ( excludeClass ) {
							const skip = cloneMain.querySelectorAll(
								`.${ excludeClass }`
							);
							skip.forEach( ( el ) => {
								el.remove();
							} );
						}
					} );

					content = cloneMain.textContent;
					cloneMain = null;
				}

				state.selectedTextRange = {
					hasSelection: false,
				};
			}

			// Process content into chunks of approximately 200 words
			state.textChunks = actions.chunkText(
				content,
				DEFAULTS.WORDS_PER_CHUNK
			);
			state.currentChunk = 0;

			// Return the first chunk to start with
			return state.textChunks.length > 0 ? state.textChunks[ 0 ] : '';
		},
		// New method to chunk text into approximately word-sized pieces
		chunkText( text, wordsPerChunk ) {
			if ( ! text || text.trim() === '' ) {
				return [ '' ];
			}

			// Split the text into words
			const words = text.trim().split( /\s+/ );
			const chunks = [];

			// Create chunks of approximately wordsPerChunk words
			for ( let i = 0; i < words.length; i += wordsPerChunk ) {
				const chunk = words.slice( i, i + wordsPerChunk ).join( ' ' );
				chunks.push( chunk );
			}

			return chunks;
		},
		handleBoundaryEvent( event, content ) {
			const mainElement = getMainElement();
			if ( ! mainElement ) {
				return;
			}

			// Safety check for valid boundary event
			if (
				! event.charIndex ||
				! event.charLength ||
				event.charIndex + event.charLength > content.length
			) {
				return;
			}

			try {
				const blockWrapper = getBlockWrapper();
				const highlightBackground =
					blockWrapper?.dataset.highlightBackground ||
					DEFAULTS.HIGHLIGHT_BG;
				const highlightColor =
					blockWrapper?.dataset.highlightColor ||
					DEFAULTS.HIGHLIGHT_COLOR;

				if ( state.selectedTextRange?.hasSelection ) {
					// Handle selected text highlighting
					const docView = mainElement?.ownerDocument.defaultView;
					const selection = docView?.getSelection();

					if ( selection?.rangeCount > 0 ) {
						const selectionRange = selection.getRangeAt( 0 );
						const wrapper = actions.createHighlightWrapper(
							highlightBackground,
							highlightColor
						);
						try {
							selectionRange.surroundContents( wrapper );
						} catch ( e ) {
							// Fallback for when surroundContents fails
							const textContent = selectionRange.toString();
							wrapper.textContent = textContent;
							selectionRange.deleteContents();
							selectionRange.insertNode( wrapper );
						}
					}
				} else {
					// Handle main content highlighting
					const excludeClassesStr =
						blockWrapper?.dataset.excludeClass ||
						DEFAULTS.EXCLUDE_CLASS;
					const excludeClasses = excludeClassesStr.split( /\s+/ );

					// Create TreeWalker to find text nodes
					const walker = document.createTreeWalker(
						mainElement,
						NodeFilter.SHOW_TEXT,
						{
							acceptNode( node ) {
								// Check if node's parent has excluded classes
								let current = node.parentElement;
								while ( current ) {
									if ( current.classList ) {
										for ( const excludeClass of excludeClasses ) {
											if (
												excludeClass &&
												current.classList.contains(
													excludeClass
												)
											) {
												return NodeFilter.FILTER_REJECT;
											}
										}
									}
									current = current.parentElement;
								}
								return NodeFilter.FILTER_ACCEPT;
							},
						}
					);

					// Find the node containing the current position
					let charCount = 0;
					let targetNode = null;
					let node;

					while ( ( node = walker.nextNode() ) ) {
						const nodeLength = node.textContent.length;
						if (
							charCount <= event.charIndex &&
							event.charIndex < charCount + nodeLength &&
							isLeafNode( node )
						) {
							targetNode = node;
							break;
						}
						charCount += nodeLength;
					}

					// Only update highlight if we've found a new leaf node and it's different from the current one
					if (
						targetNode &&
						targetNode !== state.currentHighlightedNode &&
						targetNode.textContent.trim().length > 0
					) {
						// Clear previous highlight
						actions.clearHighlights();

						// Create new highlight
						const wrapper = actions.createHighlightWrapper(
							highlightBackground,
							highlightColor
						);
						wrapper.textContent = targetNode.textContent;
						targetNode.parentNode.replaceChild(
							wrapper,
							targetNode
						);

						// Update current node reference
						state.currentHighlightedNode = wrapper.firstChild;
					}
				}
			} catch ( e ) {
				console.error( 'Highlighting error:', e );
			}
		},
		handleUtteranceEnd() {
			// Clear any remaining highlights
			actions.clearHighlights();

			// Update playing state
			const context = getContext();
			context.isPlaying = false;
			state.isPlaying = false;

			// Reset chunk tracking
			state.currentChunk = 0;
			state.textChunks = [];

			// Reset highlight tracking
			state.currentHighlightedNode = null;

			// Clear selected text range
			state.selectedTextRange = {
				hasSelection: false,
			};
		},
	},
	callbacks: {
		init() {
			if ( ! window.speechSynthesis ) {
				return;
			}

			window.speechSynthesis.cancel();
			actions.loadVoices();

			if ( window.speechSynthesis.onvoiceschanged !== undefined ) {
				window.speechSynthesis.onvoiceschanged = actions.loadVoices;
			}

			window.addEventListener( 'beforeunload', () => {
				window.speechSynthesis.cancel();
			} );
		},
		isSelected() {
			const context = getContext();
			return context.voice.voiceURI === state.currentVoice.voiceURI;
		},
	},
} );
