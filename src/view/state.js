/**
 * Initial state for the text-to-speech functionality
 */

import { STORAGE_KEYS } from './constants';
import { getLocalStorageItem, getCurrentLocale, getBrowser } from './utils';

export const initialState = {
	isPlaying: false,
	currentVoice: null,
	preferredVoice: getLocalStorageItem(
		STORAGE_KEYS.LANG( getCurrentLocale() ),
		null
	),
	utterance: null,
	voices: [],
	currentSpeed: getLocalStorageItem(
		STORAGE_KEYS.SPEED( getCurrentLocale() ),
		1
	),
	currentPitch: getLocalStorageItem(
		STORAGE_KEYS.PITCH( getCurrentLocale() ),
		1
	),
	selectedTextRange: { hasSelection: false },
	currentChunk: 0,
	textChunks: [],
	isProcessingChunks: false,
	currentHighlightedNode: null,
	nodePositions: new Map(),
	currentSelection: null,
	pausedAt: null,
	browserType: getBrowser(),
	// For Safari ping-pong to keep synthesis alive
	safariKeepAliveTimer: null,
};
