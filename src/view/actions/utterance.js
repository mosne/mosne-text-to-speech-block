/**
 * Utterance management actions
 */

import { getContext } from '@wordpress/interactivity';
import { getCurrentLocale } from '../utils';
import {
	handleBoundaryEvent,
	setupSafariHighlighting,
	clearHighlights,
} from './highlight';

// Utterance Management
export const createUtterance = ( state ) => {
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

	setupUtteranceEvents( state, newUtterance, content );
	state.utterance = newUtterance;
};

export const setupUtteranceEvents = ( state, utterance, content ) => {
	// Safari doesn't reliably fire boundary events, so use workarounds
	if ( state.browserType === 'safari' ) {
		// For Safari, we'll use word-level events and timeouts
		utterance.onboundary = ( event ) => {
			// Still try to use boundary events if they work
			utterance._lastCharIndex = event.charIndex || 0;
			handleBoundaryEvent( state, event, content );
		};

		// Also add a timer-based highlighting as fallback for Safari
		utterance._safariTimerId = setupSafariHighlighting( state, content );
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

			handleBoundaryEvent( state, adjustedEvent, content );
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
			createUtterance( state );

			// Small delay to ensure proper timing
			setTimeout( () => {
				if ( state.isPlaying && state.utterance ) {
					window.speechSynthesis.speak( state.utterance );
				}
			}, 50 );
		} else {
			// This is the last chunk, perform cleanup
			const context = getContext();
			if ( context ) {
				context.isPlaying = false;
			}
			state.isPlaying = false;
			clearHighlights( state );
		}
	};

	// Ensure we can track errors across browsers
	utterance.onerror = ( event ) => {
		console.error( 'Speech synthesis error:', event );
		handleUtteranceEnd( state );
	};
};

export const handleUtteranceEnd = ( state ) => {
	// Clear any remaining highlights
	clearHighlights( state );

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
};
