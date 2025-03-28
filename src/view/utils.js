/**
 * Helper functions for text-to-speech functionality
 */

import { DEFAULTS } from './constants';

export const getLocalStorageItem = ( key, defaultValue ) => {
	try {
		return window.localStorage.getItem( key ) || defaultValue;
	} catch ( e ) {
		// Handle private browsing mode in Safari
		return defaultValue;
	}
};

export const getCurrentLocale = () => document.documentElement.lang || 'en';

export const getBlockWrapper = () =>
	document.querySelector(
		'[data-wp-interactive="mosne-text-to-speech-block"]'
	);

export const getMainElement = () => document.querySelector( 'main' );

// Detect browser for specific handling
export const getBrowser = () => {
	const userAgent = window.navigator.userAgent;
	if ( userAgent.indexOf( 'Firefox' ) !== -1 ) {
		return 'firefox';
	}
	if (
		userAgent.indexOf( 'Edge' ) !== -1 ||
		userAgent.indexOf( 'Edg' ) !== -1
	) {
		return 'edge';
	}
	if (
		userAgent.indexOf( 'Safari' ) !== -1 &&
		userAgent.indexOf( 'Chrome' ) === -1
	) {
		return 'safari';
	}
	if ( userAgent.indexOf( 'Chrome' ) !== -1 ) {
		return 'chrome';
	}
	return 'other';
};

export const initHighlightColors = () => {
	const mainElement = getMainElement();
	const blockWrapper = getBlockWrapper();

	if ( ! mainElement || ! blockWrapper ) {
		return;
	}

	// Get highlight colors from block settings or use defaults
	const highlightBackground =
		blockWrapper.dataset.highlightBackground || DEFAULTS.HIGHLIGHT_BG;
	const highlightColor =
		blockWrapper.dataset.highlightColor || DEFAULTS.HIGHLIGHT_COLOR;

	// Set CSS custom properties on the main element for easier styling
	mainElement.style.setProperty(
		'--mosne-tts-highlight-bg',
		highlightBackground
	);
	mainElement.style.setProperty(
		'--mosne-tts-highlight-color',
		highlightColor
	);
};
