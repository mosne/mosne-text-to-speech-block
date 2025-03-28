/**
 * Callback functions for the text-to-speech functionality
 */

import { getContext } from '@wordpress/interactivity';
import { getBlockWrapper, getMainElement, initHighlightColors } from './utils';
import { DEFAULTS } from './constants';
import { loadVoices } from './actions/voice';
import { buildNodePositionsMap } from './actions/highlight';

export const init = ( state ) => {
	if ( ! window.speechSynthesis ) {
		console.warn( 'Speech synthesis not supported in this browser' );
		return;
	}

	// Cancel any ongoing speech
	window.speechSynthesis.cancel();

	// Initialize highlight colors once at startup
	initHighlightColors();

	// Load available voices
	loadVoices( state );

	if ( window.speechSynthesis.onvoiceschanged !== undefined ) {
		window.speechSynthesis.onvoiceschanged = () => loadVoices( state );
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
			blockWrapper?.dataset.excludeClass || DEFAULTS.EXCLUDE_CLASS;
		setTimeout( () => {
			buildNodePositionsMap(
				state,
				mainElement,
				excludeClassesStr.split( /\s+/ )
			);
		}, 500 ); // Delay to ensure DOM is ready
	}
};

export const isSelected = ( state ) => {
	const context = getContext();
	return context.voice?.voiceURI === state.currentVoice?.voiceURI;
};
