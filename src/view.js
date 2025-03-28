/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import { initialState } from './view/state';
import * as a from './view/actions';
import * as c from './view/callbacks';

// Store configuration
const { state } = store( 'mosne-text-to-speech-block', {
	state: initialState,

	// Map action creators to pass state as first argument
	actions: {
		// Synthesis
		checkSynthesisReady: () => a.checkSynthesisReady( state ),
		setupSafariKeepAlive: () => a.setupSafariKeepAlive( state ),
		//highlight
		buildNodePositionsMap: () => a.buildNodePositionsMap( state ),
		handleBoundaryEvent: () => a.handleBoundaryEvent( state ),
		setupSafariHighlighting: () => a.setupSafariHighlighting( state ),
		clearHighlights: () => a.clearHighlights( state ),
		// Voice
		loadVoices: () => a.loadVoices( state ),
		changeVoice: ( e ) => a.changeVoice( state, e ),
		// Utterance
		createUtterance: () => a.createUtterance( state ),
		setupUtteranceEvents: () => a.setupUtteranceEvents( state ),
		handleUtteranceEnd: () => a.handleUtteranceEnd( state ),
		// playback
		Play: () => a.Play( state ),
		Pause: () => a.Pause( state ),
		Restart: () => a.Restart( state ),
		changeSpeed: ( e ) => a.changeSpeed( state, e ),
		changePitch: ( e ) => a.changePitch( state, e ),
		toggleSettings: () => a.toggleSettings( state ),
		// content
		getContent: () => a.getContent( state ),
	},

	// Map callback creators to pass state as argument
	callbacks: {
		init: () => c.init( state ),
		isSelected: () => c.isSelected( state ),
	},
} );
