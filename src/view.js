/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import { initialState } from './view/state';
import * as acts from './view/actions';
import * as calls from './view/callbacks';

// Store configuration
const { state } = store( 'mosne-text-to-speech-block', {
	state: initialState,

	// Map action creators to pass state as first argument
	actions: {
		// Synthesis
		checkSynthesisReady: () => acts.checkSynthesisReady( state ),
		setupSafariKeepAlive: () => acts.setupSafariKeepAlive( state ),
		//highlight
		buildNodePositionsMap: () => acts.buildNodePositionsMap( state ),
		handleBoundaryEvent: () => acts.handleBoundaryEvent( state ),
		setupSafariHighlighting: () => acts.setupSafariHighlighting( state ),
		clearHighlights: () => acts.clearHighlights( state ),
		// Voice
		loadVoices: () => acts.loadVoices( state ),
		changeVoice: ( e ) => acts.changeVoice( state, e ),
		// Utterance
		createUtterance: () => acts.createUtterance( state ),
		setupUtteranceEvents: () => acts.setupUtteranceEvents( state ),
		handleUtteranceEnd: () => acts.handleUtteranceEnd( state ),
		// playback
		Play: () => acts.Play( state ),
		Pause: () => acts.Pause( state ),
		Restart: () => acts.Restart( state ),
		changeSpeed: ( e ) => acts.changeSpeed( state, e ),
		changePitch: ( e ) => acts.changePitch( state, e ),
		toggleSettings: () => acts.toggleSettings( state ),
		// content
		getContent: () => acts.getContent( state ),
	},

	// Map callback creators to pass state as argument
	callbacks: {
		init: () => calls.init( state ),
		isSelected: () => calls.isSelected( state ),
	},
} );
