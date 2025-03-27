/**
 * Playback control actions
 */

import { getContext } from '@wordpress/interactivity';
import { getCurrentLocale, getMainElement, getBlockWrapper } from '../utils';
import { checkSynthesisReady, setupSafariKeepAlive } from './synthesis';
import {
	clearHighlights,
	buildNodePositionsMap,
	handleBoundaryEvent,
} from './highlight';
import { createUtterance, handleUtteranceEnd } from './utterance';
import { getContent } from './content';
import { DEFAULTS } from '../constants';

// Playback Controls
export const Play = async ( state ) => {
	const context = getContext();
	if ( context ) {
		context.isPlaying = true;
	}
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
				( event.charIndex || 0 ) + state.pausedAt.contentPosition;

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
					buildNodePositionsMap(
						state,
						mainElement,
						excludeClassesStr.split( /\s+/ )
					);
				}

				// Handle the boundary event with the full content context
				handleBoundaryEvent(
					state,
					adjustedEvent,
					state.pausedAt.fullText || state.pausedAt.text
				);
			}
		};

		newUtterance.onend = () => handleUtteranceEnd( state );

		state.utterance = newUtterance;

		// Speak the new utterance
		window.speechSynthesis.speak( state.utterance );

		// In Safari, set up the keep-alive timer
		if ( state.browserType === 'safari' ) {
			setupSafariKeepAlive( state );
		}

		// Clear the paused state
		state.pausedAt = null;

		return;
	}

	if ( state.textChunks.length === 0 || state.currentChunk === 0 ) {
		getContent( state );
		createUtterance( state );
	}

	try {
		if ( window.speechSynthesis.paused ) {
			window.speechSynthesis.resume();
			return;
		}
	} catch ( e ) {
		console.warn( 'Resume failed, recreating speech:', e );
		// If resume fails, recreate the utterance
		createUtterance( state );
	}

	// Chrome and Edge fix - recreate utterance if speaking
	if ( state.browserType === 'chrome' || state.browserType === 'edge' ) {
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
			setupSafariKeepAlive( state );
		}
	}
};

export const Pause = async ( state ) => {
	const context = getContext();
	if ( context ) {
		context.isPlaying = false;
	}
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
									( sum, chunk ) => sum + chunk.length,
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
									( sum, chunk ) => sum + chunk.length,
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
		// Standard pause for Chrome and other browsers
		window.speechSynthesis.pause();
	}
};

export const Restart = ( state ) => {
	const context = getContext();
	if ( context ) {
		context.isPlaying = false;
	}
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

	clearHighlights( state );
};

export const changeSpeed = async ( state, e ) => {
	const context = getContext();
	if ( context ) {
		context.isPlaying = false;
	}
	window.speechSynthesis.cancel();

	state.currentSpeed = e.target.value;
	window.localStorage.setItem(
		'mosne-tts-speed-' + document.documentElement.lang,
		e.target.value
	);

	await checkSynthesisReady();
	createUtterance( state );

	if ( context && context.isPlaying ) {
		setTimeout( () => {
			window.speechSynthesis.speak( state.utterance );
		}, 50 );
	}
};

export const changePitch = async ( state, e ) => {
	const context = getContext();
	if ( context ) {
		context.isPlaying = false;
	}
	window.speechSynthesis.cancel();

	state.currentPitch = e.target.value;
	window.localStorage.setItem(
		'mosne-tts-pitch-' + document.documentElement.lang,
		e.target.value
	);

	await checkSynthesisReady();
	createUtterance( state );

	if ( context && context.isPlaying ) {
		setTimeout( () => {
			window.speechSynthesis.speak( state.utterance );
		}, 50 );
	}
};

export const toggleSettings = () => {
	const context = getContext();
	if ( context ) {
		context.showSettings = ! context.showSettings;
	}
};
