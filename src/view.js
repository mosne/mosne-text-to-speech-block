/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import { initialState } from './view/state';
import * as actionCreators from './view/actions';
import * as callbackCreators from './view/callbacks';

// Store configuration
const { state, actions } = store( 'mosne-text-to-speech-block', {
	state: initialState,

	// Map action creators to pass state as first argument
	actions: Object.fromEntries(
		Object.entries( actionCreators ).map( ( [ key, fn ] ) => [
			key,
			function ( ...args ) {
				return fn( state, ...args );
			},
		] )
	),

	// Map callback creators to pass state as argument
	callbacks: {
		init: () => callbackCreators.init( state ),
		isSelected: () => callbackCreators.isSelected( state ),
	},
} );
