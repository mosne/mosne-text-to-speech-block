/**
 * Callback functions for the text-to-speech functionality
 */

import { getContext } from '@wordpress/interactivity';
import { getBlockWrapper, getMainElement, initHighlightColors } from './utils';
import { DEFAULTS } from './constants';
import { loadVoices } from './actions/voice';
import { buildNodePositionsMap } from './actions/highlight';
import { SecureErrorHandler } from './security';

export const init = ( state ) => {
	try {
		if ( ! window.speechSynthesis ) {
			SecureErrorHandler.logError(
				'Init Callback',
				new Error( 'Speech synthesis not supported in this browser' )
			);
			return false;
		}

		// Cancel any ongoing speech
		window.speechSynthesis.cancel();

		// Initialize highlight colors once at startup
		const highlightSuccess = initHighlightColors();
		if ( ! highlightSuccess ) {
			SecureErrorHandler.logError(
				'Init Callback',
				new Error( 'Failed to initialize highlight colors' )
			);
		}

		// Load available voices
		const voiceSuccess = loadVoices( state );
		if ( ! voiceSuccess ) {
			SecureErrorHandler.logError(
				'Init Callback',
				new Error( 'Failed to load voices' )
			);
		}

		if ( window.speechSynthesis.onvoiceschanged !== undefined ) {
			window.speechSynthesis.onvoiceschanged = () => {
				try {
					loadVoices( state );
				} catch ( error ) {
					SecureErrorHandler.logError(
						'Voices Changed Event',
						error
					);
				}
			};
		}

		window.addEventListener( 'beforeunload', () => {
			try {
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
			} catch ( error ) {
				SecureErrorHandler.logError( 'Before Unload Event', error );
			}
		} );

		// Initial node map building for better performance when playback starts
		const mainElement = getMainElement();
		if ( mainElement ) {
			const blockWrapper = getBlockWrapper();
			const excludeClassesStr =
				blockWrapper?.dataset.excludeClass || DEFAULTS.EXCLUDE_CLASS;
			const excludeClasses = excludeClassesStr
				.split( /\s+/ )
				.filter( ( cls ) => cls.trim() );

			setTimeout( () => {
				try {
					buildNodePositionsMap( state, mainElement, excludeClasses );
				} catch ( error ) {
					SecureErrorHandler.logError(
						'Build Node Positions Map',
						error
					);
				}
			}, 500 ); // Delay to ensure DOM is ready
		}

		return true;
	} catch ( error ) {
		SecureErrorHandler.logError( 'Init Callback', error );
		return false;
	}
};

export const isSelected = ( state ) => {
	try {
		const context = getContext();
		if ( ! context || ! state ) {
			return false;
		}

		return context.voice?.voiceURI === state.currentVoice?.voiceURI;
	} catch ( error ) {
		SecureErrorHandler.logError( 'Is Selected Callback', error );
		return false;
	}
};
