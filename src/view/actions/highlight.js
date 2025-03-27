/**
 * Highlighting management actions
 */

import { DEFAULTS } from '../constants';
import { getBlockWrapper, getMainElement } from '../utils';

// Highlighting Management
export const clearHighlights = ( state ) => {
	if ( state.currentSelection ) {
		try {
			state.currentSelection.removeAllRanges();
		} catch ( e ) {
			// Handle Edge/IE errors with selection
			console.warn( 'Error clearing highlights:', e );
		}
		state.currentSelection = null;
	}
	state.currentHighlightedNode = null;
};

export const createHighlightWrapper = ( state, node ) => {
	// Use the node's document for selection to avoid global selection issues
	if ( ! node ) {
		return null;
	}

	const doc = node.ownerDocument;
	const docView = doc.defaultView;

	if ( ! docView ) {
		return null;
	}

	// Clear any existing selection
	clearHighlights( state );

	try {
		// Create a new range for the node text content
		const range = doc.createRange();

		// Only select the text node's content instead of the entire node
		if ( node.nodeType === Node.TEXT_NODE ) {
			range.setStart( node, 0 );
			range.setEnd( node, node.length );
		} else {
			range.selectNodeContents( node );
		}

		// Apply the selection
		const selection = docView.getSelection();
		if ( selection ) {
			selection.removeAllRanges();
			selection.addRange( range );

			// Store the current selection for cleanup
			state.currentSelection = selection;

			// Apply CSS custom properties via selection styles
			// This uses the CSS variables we set on init
			if ( selection.rangeCount > 0 ) {
				selection.getRangeAt( 0 );
				selection.getRangeAt( 0 );
			}
		}
	} catch ( e ) {
		console.warn( 'Error creating highlight:', e );
	}
};

// Safari-specific timer-based highlighting fallback
export const setupSafariHighlighting = ( state, content ) => {
	if ( state.browserType !== 'safari' ) {
		return null;
	}

	// Estimate reading speed (chars per second)
	const charsPerSecond = 15 * state.currentSpeed;
	const intervalTime = 250; // Check every 250ms

	let currentIndex = 0;
	const timerId = setInterval( () => {
		if ( ! state.isPlaying ) {
			clearInterval( timerId );
			return;
		}

		// Create a synthetic boundary event for Safari
		const syntheticEvent = {
			charIndex: currentIndex,
			charLength: 1,
		};

		handleBoundaryEvent( state, syntheticEvent, content );

		// Advance the position based on estimated reading speed
		currentIndex += Math.ceil( ( charsPerSecond * intervalTime ) / 1000 );
	}, intervalTime );

	return timerId;
};

export const handleBoundaryEvent = ( state, event ) => {
	const mainElement = getMainElement();
	if ( ! mainElement ) {
		return;
	}

	try {
		// Calculate the absolute position by adding offsets of previous chunks
		let absoluteCharIndex = event.charIndex;
		if ( state.currentChunk > 0 ) {
			// Add lengths of all previous chunks
			for ( let i = 0; i < state.currentChunk; i++ ) {
				absoluteCharIndex += state.textChunks[ i ].length + 1; // +1 for space between chunks
			}
		}

		if ( state.selectedTextRange?.hasSelection ) {
			// Handle selected text case...
		} else {
			// Handle main content highlighting
			const blockWrapper = getBlockWrapper();
			const excludeClassesStr =
				blockWrapper?.dataset.excludeClass || DEFAULTS.EXCLUDE_CLASS;
			const excludeClasses = excludeClassesStr.split( /\s+/ );

			// Rebuild node positions map if empty
			if ( state.nodePositions.size === 0 ) {
				buildNodePositionsMap( state, mainElement, excludeClasses );
			}

			// Find the node containing the current absolute position
			let targetNode = null;
			let bestMatch = {
				node: null,
				distance: Number.MAX_SAFE_INTEGER,
			};

			// Find the closest position in the map using absolute position
			const positions = Array.from( state.nodePositions.keys() ).sort(
				( a, b ) => a - b
			);

			for ( let i = 0; i < positions.length; i++ ) {
				const pos = positions[ i ];
				const nodeData = state.nodePositions.get( pos );

				// Exact match using absolute position
				if (
					pos <= absoluteCharIndex &&
					absoluteCharIndex < pos + nodeData.length
				) {
					targetNode = nodeData.node;
					break;
				}

				// For Firefox, track approximate matches as fallback
				if ( state.browserType === 'firefox' ) {
					const distance = Math.abs( pos - absoluteCharIndex );
					if ( distance < bestMatch.distance ) {
						bestMatch = { node: nodeData.node, distance };
					}
				}
			}

			// Use best approximate match for Firefox if no exact match
			if (
				! targetNode &&
				state.browserType === 'firefox' &&
				bestMatch.node
			) {
				targetNode = bestMatch.node;
			}

			// Update highlight if we found a new node
			if (
				targetNode &&
				targetNode !== state.currentHighlightedNode &&
				targetNode.textContent.trim().length > 0
			) {
				clearHighlights( state );
				createHighlightWrapper( state, targetNode );
				state.currentHighlightedNode = targetNode;

				// Scroll the highlighted word into view
				if ( targetNode.nodeType !== Node.TEXT_NODE ) {
					targetNode.scrollIntoView( {
						behavior: 'smooth',
						block: 'center',
					} );
				} else if ( targetNode.parentNode ) {
					targetNode.parentNode.scrollIntoView( {
						behavior: 'smooth',
						block: 'center',
					} );
				}
			}
		}
	} catch ( e ) {
		console.error( 'Highlighting error:', e );
	}
};

// Add a new method to build the node positions map more efficiently
export const buildNodePositionsMap = ( state, rootElement, excludeClasses ) => {
	state.nodePositions.clear();

	// Optimized node collection with filtering
	const collectTextNodes = ( element, charCount = 0 ) => {
		// Skip excluded elements
		if ( element.classList ) {
			for ( const excludeClass of excludeClasses ) {
				if (
					excludeClass &&
					element.classList.contains( excludeClass )
				) {
					return charCount;
				}
			}
		}

		// Process text nodes
		if ( element.nodeType === Node.TEXT_NODE ) {
			const text = element.textContent;
			if ( text.trim().length > 0 ) {
				state.nodePositions.set( charCount, {
					node: element,
					length: text.length,
				} );
				charCount += text.length;
			}
			return charCount;
		}

		// Process element children
		if ( element.childNodes && element.childNodes.length > 0 ) {
			for ( const child of element.childNodes ) {
				charCount = collectTextNodes( child, charCount );
			}
		}

		return charCount;
	};

	// Start the collection process
	collectTextNodes( rootElement );
};
