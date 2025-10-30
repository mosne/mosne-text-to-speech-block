/**
 * Voice management actions
 */

import { getCurrentLocale } from '../utils';
import { createUtterance } from './utterance';
import { getContext } from '@wordpress/interactivity';
import {
	InputValidator,
	TTSValidator,
	SecureStorage,
	SecureErrorHandler,
} from '../security';
// Voice Management
export const loadVoices = async ( state ) => {
	try {
		// For Safari/iOS, ensure we have access to voices
		if ( state.browserType === 'safari' ) {
			// Safari sometimes needs speech synthesis to be triggered first
			window.speechSynthesis.speak( new SpeechSynthesisUtterance( '' ) );
			window.speechSynthesis.cancel();
		}

		const availableVoices = window.speechSynthesis.getVoices();

		if ( ! availableVoices?.length ) {
			// Try again in a bit - browsers load voices asynchronously
			setTimeout( () => loadVoices( state ), 100 );
			return;
		}

		const currentLocale = getCurrentLocale();

		// Validate and filter voices
		const validVoices = availableVoices.filter( ( voice ) => {
			return (
				voice &&
				typeof voice.lang === 'string' &&
				typeof voice.voiceURI === 'string' &&
				voice.lang.length > 0 &&
				voice.voiceURI.length > 0
			);
		} );

		if ( validVoices.length === 0 ) {
			SecureErrorHandler.logError(
				'Load Voices',
				new Error( 'No valid voices found' )
			);
			return;
		}

		const localVoices = validVoices.filter( ( voice ) =>
			voice.lang.startsWith( currentLocale )
		);

		state.voices = localVoices.length > 0 ? localVoices : validVoices;
		state.currentVoice = state.voices[ 0 ];

		if ( state.preferredVoice ) {
			const validatedVoice = TTSValidator.validateVoice(
				state.preferredVoice,
				state.voices
			);
			if ( validatedVoice ) {
				state.currentVoice = validatedVoice;
			}
		}

		setTimeout( () => createUtterance( state ), 50 );
		return true;
	} catch ( error ) {
		SecureErrorHandler.logError( 'Load Voices', error );
		return false;
	}
};

export const changeVoice = ( state, e ) => {
	try {
		// Validate input
		const validatedEvent = InputValidator.validateEvent( e );
		if ( ! validatedEvent ) {
			SecureErrorHandler.logError(
				'Change Voice',
				new Error( 'Invalid event object' )
			);
			return false;
		}

		const voiceURI = InputValidator.validateString(
			validatedEvent.target.value
		);
		if ( ! voiceURI ) {
			SecureErrorHandler.logError(
				'Change Voice',
				new Error( 'Invalid voice URI' )
			);
			return false;
		}

		// Cancel any ongoing speech
		window.speechSynthesis.cancel();

		const context = getContext();
		if ( context ) {
			context.isPlaying = false;
		}

		// Validate voice exists in available voices
		const voice = TTSValidator.validateVoice( voiceURI, state.voices );
		if ( ! voice ) {
			SecureErrorHandler.logError(
				'Change Voice',
				new Error( 'Voice not found in available voices' )
			);
			return false;
		}

		state.currentVoice = voice;

		// Secure localStorage operation
		const currentLocale = getCurrentLocale();
		const storageKey = `mosne-tts-lang-${ currentLocale }`;
		const success = SecureStorage.setItem( storageKey, voice.voiceURI );

		if ( ! success ) {
			SecureErrorHandler.logError(
				'Change Voice',
				new Error( 'Failed to save voice to localStorage' )
			);
		}

		return true;
	} catch ( error ) {
		SecureErrorHandler.logError( 'Change Voice', error );
		return false;
	}
};
