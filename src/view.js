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
import {
	InputValidator,
	TTSValidator,
	SecureErrorHandler,
} from './view/security';

// Store configuration
const { state } = store( 'mosne-text-to-speech-block', {
	state: initialState,

	// Map action creators to pass state as first argument
	actions: {
		// Synthesis
		checkSynthesisReady: () => {
			try {
				return a.checkSynthesisReady( state );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Synthesis Ready Check', error );
				return false;
			}
		},
		setupSafariKeepAlive: () => {
			try {
				return a.setupSafariKeepAlive( state );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Safari Keep Alive', error );
				return false;
			}
		},

		// Highlighting
		buildNodePositionsMap: () => {
			try {
				return a.buildNodePositionsMap( state );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Node Positions Map', error );
				return false;
			}
		},
		handleBoundaryEvent: () => {
			try {
				return a.handleBoundaryEvent( state );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Boundary Event', error );
				return false;
			}
		},
		setupSafariHighlighting: () => {
			try {
				return a.setupSafariHighlighting( state );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Safari Highlighting', error );
				return false;
			}
		},
		clearHighlights: () => {
			try {
				return a.clearHighlights( state );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Clear Highlights', error );
				return false;
			}
		},

		// Voice management
		loadVoices: () => {
			try {
				return a.loadVoices( state );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Load Voices', error );
				return false;
			}
		},
		changeVoice: ( event ) => {
			try {
				const validatedEvent = InputValidator.validateEvent( event );
				if ( ! validatedEvent ) {
					console.warn( 'Invalid voice change event' );
					return false;
				}

				const voiceURI = InputValidator.validateString(
					validatedEvent.target.value
				);
				if ( ! voiceURI ) {
					console.warn( 'Invalid voice URI' );
					return false;
				}

				// Create secure event object
				const secureEvent = {
					target: { value: voiceURI },
				};

				return a.changeVoice( state, secureEvent );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Change Voice', error );
				return false;
			}
		},

		// Utterance management
		createUtterance: () => {
			try {
				return a.createUtterance( state );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Create Utterance', error );
				return false;
			}
		},
		setupUtteranceEvents: () => {
			try {
				return a.setupUtteranceEvents( state );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Setup Utterance Events', error );
				return false;
			}
		},
		handleUtteranceEnd: () => {
			try {
				return a.handleUtteranceEnd( state );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Handle Utterance End', error );
				return false;
			}
		},

		// Playback controls
		Play: () => {
			try {
				return a.Play( state );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Play Action', error );
				return false;
			}
		},
		Pause: () => {
			try {
				return a.Pause( state );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Pause Action', error );
				return false;
			}
		},
		Restart: () => {
			try {
				return a.Restart( state );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Restart Action', error );
				return false;
			}
		},
		changeSpeed: ( event ) => {
			try {
				const validatedEvent = InputValidator.validateEvent( event );
				if ( ! validatedEvent ) {
					console.warn( 'Invalid speed change event' );
					return false;
				}

				const speed = TTSValidator.validateSpeed(
					validatedEvent.target.value
				);
				if ( speed === null ) {
					console.warn(
						'Invalid speed value:',
						validatedEvent.target.value
					);
					return false;
				}

				// Create secure event object
				const secureEvent = {
					target: { value: speed.toString() },
				};

				return a.changeSpeed( state, secureEvent );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Change Speed', error );
				return false;
			}
		},
		changePitch: ( event ) => {
			try {
				const validatedEvent = InputValidator.validateEvent( event );
				if ( ! validatedEvent ) {
					console.warn( 'Invalid pitch change event' );
					return false;
				}

				const pitch = TTSValidator.validatePitch(
					validatedEvent.target.value
				);
				if ( pitch === null ) {
					console.warn(
						'Invalid pitch value:',
						validatedEvent.target.value
					);
					return false;
				}

				// Create secure event object
				const secureEvent = {
					target: { value: pitch.toString() },
				};

				return a.changePitch( state, secureEvent );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Change Pitch', error );
				return false;
			}
		},
		toggleSettings: () => {
			try {
				return a.toggleSettings( state );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Toggle Settings', error );
				return false;
			}
		},

		// Content management
		getContent: () => {
			try {
				return a.getContent( state );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Get Content', error );
				return false;
			}
		},
	},

	// Map callback creators to pass state as argument
	callbacks: {
		init: () => {
			try {
				return c.init( state );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Init Callback', error );
				return false;
			}
		},
		isSelected: () => {
			try {
				return c.isSelected( state );
			} catch ( error ) {
				SecureErrorHandler.logError( 'Is Selected Callback', error );
				return false;
			}
		},
	},
} );
