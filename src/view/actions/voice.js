/**
 * Voice management actions
 */

import { getCurrentLocale } from '../utils';
import { createUtterance } from './utterance';

// Voice Management
export const loadVoices = async ( state ) => {
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
	const localVoices = availableVoices.filter( ( voice ) =>
		voice.lang.startsWith( currentLocale )
	);

	state.voices = localVoices.length > 0 ? localVoices : availableVoices;
	state.currentVoice = state.voices[ 0 ];

	if ( state.preferredVoice ) {
		const voice = state.voices.find(
			( v ) => v.voiceURI === state.preferredVoice
		);
		if ( voice ) {
			state.currentVoice = voice;
		}
	}

	setTimeout( () => createUtterance( state ), 50 );
};

export const changeVoice = ( state, e ) => {
	const context = getContext();
	if ( context ) {
		context.isPlaying = false;
	}

	// Cancel any ongoing speech
	window.speechSynthesis.cancel();

	const voice = state.voices.find( ( v ) => v.voiceURI === e.target.value );

	if ( voice ) {
		state.currentVoice = voice;
		window.localStorage.setItem(
			'mosne-tts-lang-' + document.documentElement.lang,
			voice.voiceURI
		);
	}
};
