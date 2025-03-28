/**
 * Content processing actions
 */

import { DEFAULTS } from '../constants';
import { getBlockWrapper, getMainElement } from '../utils';
import { buildNodePositionsMap } from './highlight';

export const getContent = ( state ) => {
	// Check if there is highlighted text
	const mainElement = getMainElement();
	const docView = mainElement?.ownerDocument.defaultView;
	const selection = docView ? docView.getSelection() : null;
	let content = '';

	if ( selection && selection.toString().trim().length > 0 ) {
		// Get selected text
		content = selection.toString();
		state.selectedTextRange = {
			text: content,
			hasSelection: true,
		};
	} else {
		// Get content from main element
		let cloneMain = mainElement?.cloneNode( true );
		if ( cloneMain ) {
			// Use the same exclude classes logic for consistency
			const blockWrapper = getBlockWrapper();
			const excludeClassesStr =
				blockWrapper?.dataset.excludeClass || DEFAULTS.EXCLUDE_CLASS;
			const excludeClasses = excludeClassesStr.split( /\s+/ );

			// Remove all elements with excluded classes
			excludeClasses.forEach( ( excludeClass ) => {
				if ( excludeClass ) {
					const skip = cloneMain.querySelectorAll(
						`.${ excludeClass }`
					);
					skip.forEach( ( el ) => {
						el.remove();
					} );
				}
			} );

			content = cloneMain.textContent;
			cloneMain = null;

			// Pre-build the node position map for faster highlighting
			if ( mainElement ) {
				buildNodePositionsMap(
					state,
					mainElement,
					excludeClassesStr.split( /\s+/ )
				);
			}
		}

		state.selectedTextRange = {
			hasSelection: false,
		};
	}

	// Process content into chunks of approximately 200 words
	state.textChunks = chunkText( content, DEFAULTS.WORDS_PER_CHUNK );
	state.currentChunk = 0;

	// Return the first chunk to start with
	return state.textChunks.length > 0 ? state.textChunks[ 0 ] : '';
};

// Method to chunk text into approximately word-sized pieces
export const chunkText = ( text, wordsPerChunk ) => {
	if ( ! text || text.trim() === '' ) {
		return [ '' ];
	}

	// Split the text into words
	const words = text.trim().split( /\s+/ );
	const chunks = [];

	// Create chunks of approximately wordsPerChunk words
	for ( let i = 0; i < words.length; i += wordsPerChunk ) {
		const chunk = words.slice( i, i + wordsPerChunk ).join( ' ' );
		chunks.push( chunk );
	}

	return chunks;
};
