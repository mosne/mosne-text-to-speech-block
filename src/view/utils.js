/**
 * Helper functions for text-to-speech functionality
 */

import { DEFAULTS } from './constants';
import {
	SecureStorage,
	SecureDOM,
	ContentSanitizer,
	SecureErrorHandler
} from './security';

export const getLocalStorageItem = ( key, defaultValue ) => {
	return SecureStorage.getItem( key, defaultValue );
};

export const getCurrentLocale = () => {
	try {
		const lang = document.documentElement.lang;
		return ContentSanitizer.sanitizeText( lang ) || 'en';
	} catch ( error ) {
		SecureErrorHandler.logError( 'Get Current Locale', error );
		return 'en';
	}
};

export const getBlockWrapper = () => {
	return SecureDOM.querySelector( '[data-wp-interactive="mosne-text-to-speech-block"]' );
};

export const getMainElement = () => {
	return SecureDOM.querySelector( 'main' );
};

// Detect browser for specific handling
export const getBrowser = () => {
	try {
		const userAgent = window.navigator.userAgent;
		if ( ! userAgent || typeof userAgent !== 'string' ) {
			return 'other';
		}

		// Sanitize user agent string
		const sanitizedUA = ContentSanitizer.sanitizeText( userAgent );
		
		if ( sanitizedUA.indexOf( 'Firefox' ) !== -1 ) {
			return 'firefox';
		}
		if (
			sanitizedUA.indexOf( 'Edge' ) !== -1 ||
			sanitizedUA.indexOf( 'Edg' ) !== -1
		) {
			return 'edge';
		}
		if (
			sanitizedUA.indexOf( 'Safari' ) !== -1 &&
			sanitizedUA.indexOf( 'Chrome' ) === -1
		) {
			return 'safari';
		}
		if ( sanitizedUA.indexOf( 'Chrome' ) !== -1 ) {
			return 'chrome';
		}
		return 'other';
	} catch ( error ) {
		SecureErrorHandler.logError( 'Get Browser', error );
		return 'other';
	}
};

export const initHighlightColors = () => {
	try {
		const mainElement = getMainElement();
		const blockWrapper = getBlockWrapper();

		if ( ! mainElement || ! blockWrapper ) {
			SecureErrorHandler.logError( 'Init Highlight Colors', new Error( 'Required elements not found' ) );
			return false;
		}

		// Get highlight colors from block settings or use defaults
		const rawHighlightBackground = blockWrapper.dataset.highlightBackground || DEFAULTS.HIGHLIGHT_BG;
		const rawHighlightColor = blockWrapper.dataset.highlightColor || DEFAULTS.HIGHLIGHT_COLOR;

		// Sanitize color values
		const highlightBackground = ContentSanitizer.sanitizeColor( rawHighlightBackground );
		const highlightColor = ContentSanitizer.sanitizeColor( rawHighlightColor );

		// Set CSS custom properties securely
		const bgSuccess = SecureDOM.setCSSProperty(
			mainElement,
			'--mosne-tts-highlight-bg',
			highlightBackground
		);
		
		const colorSuccess = SecureDOM.setCSSProperty(
			mainElement,
			'--mosne-tts-highlight-color',
			highlightColor
		);

		return bgSuccess && colorSuccess;
	} catch ( error ) {
		SecureErrorHandler.logError( 'Init Highlight Colors', error );
		return false;
	}
};
