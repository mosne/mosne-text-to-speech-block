/**
 * Content processing actions
 */

import { DEFAULTS } from '../constants';
import { getBlockWrapper, getMainElement } from '../utils';
import { buildNodePositionsMap } from './highlight';
import { ContentSanitizer, SecureDOM, SecureErrorHandler } from '../security';

export const getContent = ( state ) => {
	try {
		// Check if there is highlighted text
		const mainElement = getMainElement();
		if ( ! mainElement ) {
			SecureErrorHandler.logError(
				'Get Content',
				new Error( 'Main element not found' )
			);
			return '';
		}

		const docView = mainElement.ownerDocument.defaultView;
		const selection = docView ? docView.getSelection() : null;
		let content = '';

		if ( selection && selection.toString().trim().length > 0 ) {
			// Get selected text and sanitize it
			const rawContent = selection.toString();
			content = ContentSanitizer.sanitizeText( rawContent );

			state.selectedTextRange = {
				text: content,
				hasSelection: true,
			};
		} else {
			// Get content from main element using secure methods
			const blockWrapper = getBlockWrapper();
			const excludeClassesStr =
				blockWrapper?.dataset.excludeClass || DEFAULTS.EXCLUDE_CLASS;
			const excludeClasses = excludeClassesStr
				.split( /\s+/ )
				.filter( ( cls ) => cls.trim() );

			// Clone and remove excluded classes to filter out unwanted content
			let cloneMain = mainElement.cloneNode( true );
			if ( cloneMain ) {
				const safeClassPattern = /^[A-Za-z0-9_-]+$/;
				excludeClasses.forEach( ( excludeClass ) => {
					if (
						excludeClass &&
						safeClassPattern.test( excludeClass )
					) {
						// Escape class if CSS.escape is available
						const escapedClass =
							typeof CSS !== 'undefined' && CSS.escape
								? CSS.escape( excludeClass )
								: excludeClass;
						const toRemove = cloneMain.querySelectorAll(
							`.${ escapedClass }`
						);
						toRemove.forEach( ( el ) => {
							el.remove();
						} );
					}
				} );

				// Use secure text extraction on the filtered clone
				content = SecureDOM.getTextContent( cloneMain );
				cloneMain = null;
			}

			// Pre-build the node position map for faster highlighting
			if ( mainElement ) {
				buildNodePositionsMap( state, mainElement, excludeClasses );
			}

			state.selectedTextRange = {
				hasSelection: false,
			};
		}

		// Validate content length
		if ( content.length > 50000 ) {
			// Reasonable limit for TTS
			SecureErrorHandler.logError(
				'Get Content',
				new Error( 'Content too long for processing' )
			);
			content = content.substring( 0, 50000 );
		}

		// Process content into chunks of approximately 200 words
		state.textChunks = chunkText( content, DEFAULTS.WORDS_PER_CHUNK );
		state.currentChunk = 0;

		// Return the first chunk to start with
		return state.textChunks.length > 0 ? state.textChunks[ 0 ] : '';
	} catch ( error ) {
		SecureErrorHandler.logError( 'Get Content', error );
		return '';
	}
};

// Method to chunk text into approximately word-sized pieces
export const chunkText = ( text, wordsPerChunk ) => {
	try {
		// Validate inputs
		if ( ! text || typeof text !== 'string' || text.trim() === '' ) {
			return [ '' ];
		}

		if ( ! wordsPerChunk || wordsPerChunk < 1 || wordsPerChunk > 1000 ) {
			wordsPerChunk = DEFAULTS.WORDS_PER_CHUNK;
		}

		// Sanitize text before processing
		const sanitizedText = ContentSanitizer.sanitizeText( text );

		// Split the text into words
		const words = sanitizedText
			.trim()
			.split( /\s+/ )
			.filter( ( word ) => word.length > 0 );
		const chunks = [];

		// Create chunks of approximately wordsPerChunk words
		for ( let i = 0; i < words.length; i += wordsPerChunk ) {
			const chunk = words.slice( i, i + wordsPerChunk ).join( ' ' );
			if ( chunk.trim().length > 0 ) {
				chunks.push( chunk );
			}
		}

		return chunks.length > 0 ? chunks : [ '' ];
	} catch ( error ) {
		SecureErrorHandler.logError( 'Chunk Text', error );
		return [ '' ];
	}
};
