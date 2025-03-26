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
const getLocalStorageItem = ( key, defaultValue ) => {
	try {
		return window.localStorage.getItem( key ) || defaultValue;
	} catch ( e ) {
		// Handle private browsing mode in Safari
		return defaultValue;
	}
};

const getCurrentLocale = () => document.documentElement.lang || 'en';

const getBlockWrapper = () =>
	document.querySelector(
		'[data-wp-interactive="mosne-text-to-speech-block"]'
	);

const getMainElement = () => document.querySelector( 'main' );

// Detect browser for specific handling
const getBrowser = () => {
	const userAgent = window.navigator.userAgent;
	if ( userAgent.indexOf( 'Firefox' ) !== -1 ) {
		return 'firefox';
	}
	if (
		userAgent.indexOf( 'Edge' ) !== -1 ||
		userAgent.indexOf( 'Edg' ) !== -1
	) {
		return 'edge';
	}
	if (
		userAgent.indexOf( 'Safari' ) !== -1 &&
		userAgent.indexOf( 'Chrome' ) === -1
	) {
		return 'safari';
	}
	if ( userAgent.indexOf( 'Chrome' ) !== -1 ) {
		return 'chrome';
	}
	return 'other';
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
		nodePositions: new Map(),
		currentSelection: null,
		pausedAt: null,
		browserType: getBrowser(),
		// For Safari ping-pong to keep synthesis alive
		safariKeepAliveTimer: null,
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
			if ( state.currentSelection ) {
				try {
					state.currentSelection.removeAllRanges();
				} catch ( e ) {
					// Handle Edge/IE errors with selection
					console.warn( 'Error clearing highlights:', e );
				}
				state.currentSelection = null;
			}
			state.currentHighlightedNode = null;
		},

		createHighlightWrapper( node ) {
			// Use the node's document for selection to avoid global selection issues
			if ( ! node ) {
				return null;
			}

			const doc = node.ownerDocument;
			const docView = doc.defaultView;

			if ( ! docView ) {
				return null;
			}

			// Clear any existing selection
			actions.clearHighlights();

			try {
				// Create a new range for the node text content
				const range = doc.createRange();

				// Only select the text node's content instead of the entire node
				if ( node.nodeType === Node.TEXT_NODE ) {
					range.setStart( node, 0 );
					range.setEnd( node, node.length );
				} else {
					range.selectNodeContents( node );
				}

				// Apply the selection
				const selection = docView.getSelection();
				if ( selection ) {
					selection.removeAllRanges();
					selection.addRange( range );

					// Store the current selection for cleanup
					state.currentSelection = selection;

					// Apply CSS custom properties via selection styles
					// This uses the CSS variables we set on init
					if ( selection.rangeCount > 0 ) {
						selection.getRangeAt( 0 );
						selection.getRangeAt( 0 );
					}
				}
			} catch ( e ) {
				console.warn( 'Error creating highlight:', e );
			}
		},

		// Voice Management
		async loadVoices() {
			// For Safari/iOS, ensure we have access to voices
			if ( state.browserType === 'safari' ) {
				// Safari sometimes needs speech synthesis to be triggered first
				window.speechSynthesis.speak(
					new SpeechSynthesisUtterance( '' )
				);
				window.speechSynthesis.cancel();
			}

			const availableVoices = window.speechSynthesis.getVoices();

			if ( ! availableVoices?.length ) {
				// Try again in a bit - browsers load voices asynchronously
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
			// Get the content for the current chunk
			const content = state.textChunks[ state.currentChunk ];
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
			// Safari doesn't reliably fire boundary events, so use workarounds
			if ( state.browserType === 'safari' ) {
				// For Safari, we'll use word-level events and timeouts
				utterance.onboundary = ( event ) => {
					// Still try to use boundary events if they work
					utterance._lastCharIndex = event.charIndex || 0;
					actions.handleBoundaryEvent( event, content );
				};

				// Also add a timer-based highlighting as fallback for Safari
				utterance._safariTimerId =
					actions.setupSafariHighlighting( content );
			} else {
				utterance.onboundary = ( event ) => {
					// Save last character index for pause handling
					utterance._lastCharIndex = event.charIndex || 0;

					// If this utterance has a content offset (resumed utterance)
					// create an adjusted event with the correct character index
					const adjustedEvent =
						utterance._contentOffset !== undefined
							? {
									...event,
									charIndex:
										( event.charIndex || 0 ) +
										utterance._contentOffset,
							  }
							: event;

					actions.handleBoundaryEvent( adjustedEvent, content );
				};
			}

			utterance.onend = () => {
				// Clear Safari timer if it exists
				if ( utterance._safariTimerId ) {
					clearInterval( utterance._safariTimerId );
				}

				// Check if there are more chunks to process
				if ( state.currentChunk < state.textChunks.length - 1 ) {
					// Move to next chunk
					state.currentChunk++;

					// Create and speak the next utterance
					actions.createUtterance();

					// Small delay to ensure proper timing
					setTimeout( () => {
						if ( state.isPlaying && state.utterance ) {
							window.speechSynthesis.speak( state.utterance );
						}
					}, 50 );
				} else {
					// This is the last chunk, perform cleanup
					actions.Restart();
				}
			};

			// Ensure we can track errors across browsers
			utterance.onerror = ( event ) => {
				console.error( 'Speech synthesis error:', event );
				actions.handleUtteranceEnd();
			};
		},

		// Safari-specific timer-based highlighting fallback
		setupSafariHighlighting( content ) {
			if ( state.browserType !== 'safari' ) {
				return null;
			}

			// Estimate reading speed (chars per second)
			const charsPerSecond = 15 * state.currentSpeed;
			const intervalTime = 250; // Check every 250ms

			let currentIndex = 0;
			const timerId = setInterval( () => {
				if ( ! state.isPlaying ) {
					clearInterval( timerId );
					return;
				}

				// Create a synthetic boundary event for Safari
				const syntheticEvent = {
					charIndex: currentIndex,
					charLength: 1,
				};

				actions.handleBoundaryEvent( syntheticEvent, content );

				// Advance the position based on estimated reading speed
				currentIndex += Math.ceil(
					( charsPerSecond * intervalTime ) / 1000
				);
			}, intervalTime );

			return timerId;
		},

		// Safari requires periodic "ping" to keep speech synthesis active
		setupSafariKeepAlive() {
			if ( state.browserType !== 'safari' ) {
				return;
			}

			// Clear any existing timer
			if ( state.safariKeepAliveTimer ) {
				clearInterval( state.safariKeepAliveTimer );
			}

			// Every 10 seconds, ping speechSynthesis to keep it alive
			state.safariKeepAliveTimer = setInterval( () => {
				if ( state.isPlaying && window.speechSynthesis.speaking ) {
					window.speechSynthesis.pause();
					window.speechSynthesis.resume();
				} else {
					clearInterval( state.safariKeepAliveTimer );
					state.safariKeepAliveTimer = null;
				}
			}, 10000 );
		},

		// Playback Controls
		async Play() {
			const context = getContext();
			context.isPlaying = true;
			state.isPlaying = true;

			// Firefox resume handling
			if ( state.browserType === 'firefox' && state.pausedAt ) {
				// Create a new utterance from the paused position
				const remainingText = state.pausedAt.text.substring(
					state.pausedAt.charIndex
				);

				// Set the current chunk back to where we paused
				state.currentChunk = state.pausedAt.chunk;

				// Create new utterance for the remaining text
				const newUtterance = new window.SpeechSynthesisUtterance(
					remainingText
				);
				newUtterance.lang = getCurrentLocale();
				newUtterance.rate = state.currentSpeed;
				newUtterance.pitch = state.currentPitch;

				// Initialize the last character index for the new utterance
				newUtterance._lastCharIndex = 0;

				// Store the content offset for highlighting calculations
				newUtterance._contentOffset = state.pausedAt.contentPosition;

				if ( state.currentVoice ) {
					const voice = state.voices.find(
						( v ) => v.voiceURI === state.currentVoice.voiceURI
					);
					newUtterance.voice = voice;
				}

				// Create a custom boundary handler specific to this resumed utterance
				newUtterance.onboundary = ( event ) => {
					// Save last character index for pause handling
					newUtterance._lastCharIndex = event.charIndex || 0;

					// Calculate the absolute position in the original content
					const absolutePosition =
						( event.charIndex || 0 ) +
						state.pausedAt.contentPosition;

					// Create an adjusted event with the correct character index
					const adjustedEvent = {
						...event,
						charIndex: absolutePosition,
						// Ensure charLength is always valid
						charLength: event.charLength || 1,
					};

					// Pass to normal boundary handler but with full original text
					const mainElement = getMainElement();
					if ( mainElement ) {
						// Force rebuild node positions to ensure synchronization
						const blockWrapper = getBlockWrapper();
						const excludeClassesStr =
							blockWrapper?.dataset.excludeClass ||
							DEFAULTS.EXCLUDE_CLASS;

						if ( state.nodePositions.size === 0 ) {
							actions.buildNodePositionsMap(
								mainElement,
								excludeClassesStr.split( /\s+/ )
							);
						}

						// Handle the boundary event with the full content context
						actions.handleBoundaryEvent(
							adjustedEvent,
							state.pausedAt.fullText || state.pausedAt.text
						);
					}
				};

				newUtterance.onend = () => actions.handleUtteranceEnd();

				state.utterance = newUtterance;

				// Speak the new utterance
				window.speechSynthesis.speak( state.utterance );

				// In Safari, set up the keep-alive timer
				if ( state.browserType === 'safari' ) {
					actions.setupSafariKeepAlive();
				}

				// Clear the paused state
				state.pausedAt = null;

				return;
			}

			if ( state.textChunks.length === 0 || state.currentChunk === 0 ) {
				actions.getContent();
				actions.createUtterance();
			}

			try {
				if ( window.speechSynthesis.paused ) {
					window.speechSynthesis.resume();
					return;
				}
			} catch ( e ) {
				console.warn( 'Resume failed, recreating speech:', e );
				// If resume fails, recreate the utterance
				actions.createUtterance();
			}

			// Chrome and Edge fix - recreate utterance if speaking
			if (
				state.browserType === 'chrome' ||
				state.browserType === 'edge'
			) {
				if ( window.speechSynthesis.speaking ) {
					window.speechSynthesis.cancel();
					setTimeout( () => {
						if ( state.utterance ) {
							window.speechSynthesis.speak( state.utterance );
						}
					}, 50 );
					return;
				}
			}

			if ( state.utterance ) {
				window.speechSynthesis.speak( state.utterance );

				// In Safari, set up the keep-alive timer
				if ( state.browserType === 'safari' ) {
					actions.setupSafariKeepAlive();
				}
			}
		},

		async Pause() {
			const context = getContext();
			context.isPlaying = false;
			state.isPlaying = false;

			// Firefox doesn't fully support pause, so we need to handle it differently
			if ( state.browserType === 'firefox' ) {
				// Store the current position
				if ( window.speechSynthesis.speaking ) {
					// Get the full text content for context
					const fullText = state.textChunks.join( ' ' );

					// Save current speech state for later resuming
					state.pausedAt = {
						text: state.utterance.text,
						charIndex: state.utterance._lastCharIndex || 0,
						chunk: state.currentChunk,
						// Track full content position to correctly restore highlighting
						contentPosition:
							state.utterance._lastCharIndex +
							( state.currentChunk > 0
								? state.textChunks
										.slice( 0, state.currentChunk )
										.reduce(
											( sum, chunk ) =>
												sum + chunk.length,
											0
										)
								: 0 ),
						// Store full text for better context on resume
						fullText,
					};

					// Cancel current speech
					window.speechSynthesis.cancel();
				}
			} else if ( state.browserType === 'safari' ) {
				// Safari's pause is also unreliable
				if ( window.speechSynthesis.speaking ) {
					// Get the full text content for context
					const fullText = state.textChunks.join( ' ' );

					// Save position like Firefox
					state.pausedAt = {
						text: state.utterance.text,
						charIndex: state.utterance._lastCharIndex || 0,
						chunk: state.currentChunk,
						contentPosition:
							state.utterance._lastCharIndex +
							( state.currentChunk > 0
								? state.textChunks
										.slice( 0, state.currentChunk )
										.reduce(
											( sum, chunk ) =>
												sum + chunk.length,
											0
										)
								: 0 ),
						// Store full text for better context on resume
						fullText,
					};

					// Clear any Safari timers
					if ( state.utterance._safariTimerId ) {
						clearInterval( state.utterance._safariTimerId );
					}

					if ( state.safariKeepAliveTimer ) {
						clearInterval( state.safariKeepAliveTimer );
						state.safariKeepAliveTimer = null;
					}

					window.speechSynthesis.cancel();
				}
			} else if (
				window.speechSynthesis.speaking &&
				! window.speechSynthesis.paused
			) {
				// Standard pause for Chrome and other browsers - fixed lonely if
				window.speechSynthesis.pause();
			}
		},

		Restart() {
			const context = getContext();
			context.isPlaying = false;
			state.isPlaying = false;

			// Clear any Safari timers
			if ( state.browserType === 'safari' ) {
				if ( state.utterance && state.utterance._safariTimerId ) {
					clearInterval( state.utterance._safariTimerId );
				}

				if ( state.safariKeepAliveTimer ) {
					clearInterval( state.safariKeepAliveTimer );
					state.safariKeepAliveTimer = null;
				}
			}

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

					// Pre-build the node position map for faster highlighting
					if ( mainElement ) {
						actions.buildNodePositionsMap(
							mainElement,
							excludeClassesStr.split( /\s+/ )
						);
					}
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
		handleBoundaryEvent( event ) {
			const mainElement = getMainElement();
			if ( ! mainElement ) {
				return;
			}

			try {
				// Calculate the absolute position by adding offsets of previous chunks
				let absoluteCharIndex = event.charIndex;
				if ( state.currentChunk > 0 ) {
					// Add lengths of all previous chunks
					for ( let i = 0; i < state.currentChunk; i++ ) {
						absoluteCharIndex += state.textChunks[ i ].length + 1; // +1 for space between chunks
					}
				}

				if ( state.selectedTextRange?.hasSelection ) {
					// Handle selected text case...
				} else {
					// Handle main content highlighting
					const blockWrapper = getBlockWrapper();
					const excludeClassesStr =
						blockWrapper?.dataset.excludeClass ||
						DEFAULTS.EXCLUDE_CLASS;
					const excludeClasses = excludeClassesStr.split( /\s+/ );

					// Rebuild node positions map if empty
					if ( state.nodePositions.size === 0 ) {
						actions.buildNodePositionsMap(
							mainElement,
							excludeClasses
						);
					}

					// Find the node containing the current absolute position
					let targetNode = null;
					let bestMatch = {
						node: null,
						distance: Number.MAX_SAFE_INTEGER,
					};

					// Find the closest position in the map using absolute position
					const positions = Array.from(
						state.nodePositions.keys()
					).sort( ( a, b ) => a - b );

					for ( let i = 0; i < positions.length; i++ ) {
						const pos = positions[ i ];
						const nodeData = state.nodePositions.get( pos );

						// Exact match using absolute position
						if (
							pos <= absoluteCharIndex &&
							absoluteCharIndex < pos + nodeData.length
						) {
							targetNode = nodeData.node;
							break;
						}

						// For Firefox, track approximate matches as fallback
						if ( state.browserType === 'firefox' ) {
							const distance = Math.abs(
								pos - absoluteCharIndex
							);
							if ( distance < bestMatch.distance ) {
								bestMatch = { node: nodeData.node, distance };
							}
						}
					}

					// Use best approximate match for Firefox if no exact match
					if (
						! targetNode &&
						state.browserType === 'firefox' &&
						bestMatch.node
					) {
						targetNode = bestMatch.node;
					}

					// Update highlight if we found a new node
					if (
						targetNode &&
						targetNode !== state.currentHighlightedNode &&
						targetNode.textContent.trim().length > 0
					) {
						actions.clearHighlights();
						actions.createHighlightWrapper( targetNode );
						state.currentHighlightedNode = targetNode;

						// Scroll the highlighted word into view
						if ( targetNode.nodeType !== Node.TEXT_NODE ) {
							targetNode.scrollIntoView( {
								behavior: 'smooth',
								block: 'center',
							} );
						} else if ( targetNode.parentNode ) {
							targetNode.parentNode.scrollIntoView( {
								behavior: 'smooth',
								block: 'center',
							} );
						}
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
		// Add a new method to build the node positions map more efficiently
		buildNodePositionsMap( rootElement, excludeClasses ) {
			state.nodePositions.clear();

			// Optimized node collection with filtering
			const collectTextNodes = ( element, charCount = 0 ) => {
				// Skip excluded elements
				if ( element.classList ) {
					for ( const excludeClass of excludeClasses ) {
						if (
							excludeClass &&
							element.classList.contains( excludeClass )
						) {
							return charCount;
						}
					}
				}

				// Process text nodes
				if ( element.nodeType === Node.TEXT_NODE ) {
					const text = element.textContent;
					if ( text.trim().length > 0 ) {
						state.nodePositions.set( charCount, {
							node: element,
							length: text.length,
						} );
						charCount += text.length;
					}
					return charCount;
				}

				// Process element children
				if ( element.childNodes && element.childNodes.length > 0 ) {
					for ( const child of element.childNodes ) {
						charCount = collectTextNodes( child, charCount );
					}
				}

				return charCount;
			};

			// Start the collection process
			collectTextNodes( rootElement );
		},
	},
	callbacks: {
		init() {
			if ( ! window.speechSynthesis ) {
				console.warn(
					'Speech synthesis not supported in this browser'
				);
				return;
			}

			// Cancel any ongoing speech
			window.speechSynthesis.cancel();

			// Detect browser type
			state.browserType = getBrowser();

			// Initialize highlight colors once at startup
			initHighlightColors();

			// Load available voices
			actions.loadVoices();

			if ( window.speechSynthesis.onvoiceschanged !== undefined ) {
				window.speechSynthesis.onvoiceschanged = actions.loadVoices;
			}

			window.addEventListener( 'beforeunload', () => {
				window.speechSynthesis.cancel();

				// Clear any Safari timers
				if ( state.browserType === 'safari' ) {
					if ( state.utterance && state.utterance._safariTimerId ) {
						clearInterval( state.utterance._safariTimerId );
					}

					if ( state.safariKeepAliveTimer ) {
						clearInterval( state.safariKeepAliveTimer );
					}
				}
			} );

			// Initial node map building for better performance when playback starts
			const mainElement = getMainElement();
			if ( mainElement ) {
				const blockWrapper = getBlockWrapper();
				const excludeClassesStr =
					blockWrapper?.dataset.excludeClass ||
					DEFAULTS.EXCLUDE_CLASS;
				setTimeout( () => {
					actions.buildNodePositionsMap(
						mainElement,
						excludeClassesStr.split( /\s+/ )
					);
				}, 500 ); // Delay to ensure DOM is ready
			}
		},
		isSelected() {
			const context = getContext();
			return context.voice.voiceURI === state.currentVoice.voiceURI;
		},
	},
} );

// Add this function after the helper functions at the top
const initHighlightColors = () => {
	const mainElement = getMainElement();
	const blockWrapper = getBlockWrapper();

	if ( ! mainElement || ! blockWrapper ) {
		return;
	}

	// Get highlight colors from block settings or use defaults
	const highlightBackground =
		blockWrapper.dataset.highlightBackground || DEFAULTS.HIGHLIGHT_BG;
	const highlightColor =
		blockWrapper.dataset.highlightColor || DEFAULTS.HIGHLIGHT_COLOR;

	// Set CSS custom properties on the main element for easier styling
	mainElement.style.setProperty(
		'--mosne-tts-highlight-bg',
		highlightBackground
	);
	mainElement.style.setProperty(
		'--mosne-tts-highlight-color',
		highlightColor
	);
};
