/**
 * Security utilities for text-to-speech functionality
 *
 * Provides comprehensive input validation, content sanitization,
 * and secure operations to prevent XSS, injection attacks, and data corruption.
 *
 * @since 1.0.0
 */

/**
 * Security configuration constants
 */
const SECURITY_CONFIG = {
	MAX_INPUT_LENGTH: 1000,
	MAX_SPEED: 10,
	MIN_SPEED: 0.1,
	MAX_PITCH: 2,
	MIN_PITCH: 0.1,
	ALLOWED_CSS_PROPERTIES: [
		'--mosne-tts-highlight-bg',
		'--mosne-tts-highlight-color',
	],
	SAFE_COLOR_PATTERN:
		/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$|^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)$/,
	SAFE_KEY_PATTERN: /^[a-zA-Z0-9-_]+$/,
	SAFE_VOICE_URI_PATTERN: /^[a-zA-Z0-9._-]+$/,
};

/**
 * Input validation utilities
 */
export const InputValidator = {
	/**
	 * Validate and sanitize string input
	 *
	 * @param {*}      input     - Input to validate
	 * @param {number} maxLength - Maximum allowed length
	 * @return {string|null} Sanitized string or null if invalid
	 */
	validateString: ( input, maxLength = SECURITY_CONFIG.MAX_INPUT_LENGTH ) => {
		if ( typeof input !== 'string' ) {
			return null;
		}

		if ( input.length > maxLength ) {
			return null;
		}

		// Remove potentially dangerous characters
		return input.replace( /[<>'"&]/g, '' ).trim();
	},

	/**
	 * Validate numeric input within range
	 *
	 * @param {*}      input - Input to validate
	 * @param {number} min   - Minimum allowed value
	 * @param {number} max   - Maximum allowed value
	 * @return {number|null} Validated number or null if invalid
	 */
	validateNumber: ( input, min, max ) => {
		const num = parseFloat( input );

		if ( isNaN( num ) || num < min || num > max ) {
			return null;
		}

		return num;
	},

	/**
	 * Validate event object
	 *
	 * @param {*} event - Event object to validate
	 * @return {Object|null} Validated event or null if invalid
	 */
	validateEvent: ( event ) => {
		if ( ! event || typeof event !== 'object' ) {
			return null;
		}

		if ( ! event.target || typeof event.target !== 'object' ) {
			return null;
		}

		return event;
	},

	/**
	 * Validate voice URI
	 *
	 * @param {string} voiceURI - Voice URI to validate
	 * @return {string|null} Validated URI or null if invalid
	 */
	validateVoiceURI: ( voiceURI ) => {
		if ( ! voiceURI || typeof voiceURI !== 'string' ) {
			return null;
		}

		if ( ! SECURITY_CONFIG.SAFE_VOICE_URI_PATTERN.test( voiceURI ) ) {
			return null;
		}

		return voiceURI;
	},
};

/**
 * Content sanitization utilities
 */
export const ContentSanitizer = {
	/**
	 * Sanitize HTML content to prevent XSS
	 *
	 * @param {string} input - HTML content to sanitize
	 * @return {string} Sanitized content
	 */
	sanitizeHTML: ( input ) => {
		if ( typeof input !== 'string' ) {
			return '';
		}

		// Create a temporary div element
		const div = document.createElement( 'div' );
		div.textContent = input;
		return div.innerHTML;
	},

	/**
	 * Sanitize text content for safe display
	 *
	 * @param {string} input - Text content to sanitize
	 * @return {string} Sanitized text
	 */
	sanitizeText: ( input ) => {
		if ( typeof input !== 'string' ) {
			return '';
		}

		// Remove potentially dangerous characters
		return input
			.replace( /[<>'"&]/g, '' )
			.replace( /\s+/g, ' ' )
			.trim();
	},

	/**
	 * Sanitize CSS color values
	 *
	 * @param {string} color - CSS color value to sanitize
	 * @return {string} Sanitized color or default
	 */
	sanitizeColor: ( color ) => {
		if ( typeof color !== 'string' ) {
			return '#ffeb3b';
		}

		if ( SECURITY_CONFIG.SAFE_COLOR_PATTERN.test( color ) ) {
			return color;
		}

		return '#ffeb3b';
	},
};

/**
 * Secure localStorage operations
 */
export const SecureStorage = {
	/**
	 * Safely set localStorage item
	 *
	 * @param {string} key   - Storage key
	 * @param {string} value - Value to store
	 * @return {boolean} True if successful, false otherwise
	 */
	setItem: ( key, value ) => {
		try {
			// Validate key format
			if ( ! SECURITY_CONFIG.SAFE_KEY_PATTERN.test( key ) ) {
				console.warn( 'Invalid storage key format:', key );
				return false;
			}

			// Sanitize value
			const sanitizedValue = InputValidator.validateString( value );
			if ( ! sanitizedValue ) {
				console.warn( 'Invalid storage value:', value );
				return false;
			}

			window.localStorage.setItem( key, sanitizedValue );
			return true;
		} catch ( error ) {
			console.warn( 'Storage operation failed:', error.message );
			return false;
		}
	},

	/**
	 * Safely get localStorage item
	 *
	 * @param {string} key          - Storage key
	 * @param {string} defaultValue - Default value if key not found
	 * @return {string} Stored value or default
	 */
	getItem: ( key, defaultValue = null ) => {
		try {
			// Validate key format
			if ( ! SECURITY_CONFIG.SAFE_KEY_PATTERN.test( key ) ) {
				return defaultValue;
			}

			const value = window.localStorage.getItem( key );
			if ( ! value ) {
				return defaultValue;
			}

			// Validate retrieved value
			const sanitizedValue = InputValidator.validateString( value );
			return sanitizedValue || defaultValue;
		} catch ( error ) {
			console.warn( 'Storage retrieval failed:', error.message );
			return defaultValue;
		}
	},
};

/**
 * Secure DOM operations
 */
export const SecureDOM = {
	/**
	 * Safely set CSS custom property
	 *
	 * @param {Element} element  - Target element
	 * @param {string}  property - CSS property name
	 * @param {string}  value    - CSS property value
	 * @return {boolean} True if successful, false otherwise
	 */
	setCSSProperty: ( element, property, value ) => {
		if ( ! element || ! property || ! value ) {
			return false;
		}

		// Validate property name
		if ( ! SECURITY_CONFIG.ALLOWED_CSS_PROPERTIES.includes( property ) ) {
			console.warn( 'Unsafe CSS property:', property );
			return false;
		}

		// Sanitize CSS value
		const sanitizedValue = ContentSanitizer.sanitizeColor( value );
		element.style.setProperty( property, sanitizedValue );
		return true;
	},

	/**
	 * Safely get text content from element
	 *
	 * @param {Element} element - Target element
	 * @return {string} Sanitized text content
	 */
	getTextContent: ( element ) => {
		if ( ! element ) {
			return '';
		}

		// Use textContent instead of innerHTML to prevent XSS
		const text = element.textContent || '';
		return ContentSanitizer.sanitizeText( text );
	},

	/**
	 * Safely query selector with validation
	 *
	 * @param {string}  selector - CSS selector
	 * @param {Element} context  - Context element (optional)
	 * @return {Element|null} Found element or null
	 */
	querySelector: ( selector, context = document ) => {
		if ( ! selector || typeof selector !== 'string' ) {
			return null;
		}

		// Validate selector contains only safe characters
		if ( ! /^[a-zA-Z0-9\s._\-\[\]#:(),>+~*="']+$/.test( selector ) ) {
			console.warn( 'Potentially unsafe selector:', selector );
			return null;
		}

		try {
			return context.querySelector( selector );
		} catch ( error ) {
			console.warn( 'Query selector failed:', error.message );
			return null;
		}
	},
};

/**
 * Secure error handling
 */
export const SecureErrorHandler = {
	/**
	 * Log error without exposing sensitive information
	 *
	 * @param {string} context        - Error context
	 * @param {Error}  error          - Error object
	 * @param {Object} additionalData - Additional data to log (optional)
	 */
	logError: ( context, error, additionalData = {} ) => {
		const errorInfo = {
			context,
			message: error.message || 'Unknown error',
			timestamp: new Date().toISOString(),
			...additionalData,
		};

		// Log sanitized error information
		console.error( `[TTS Error] ${ context }:`, errorInfo );
	},

	/**
	 * Handle speech synthesis errors securely
	 *
	 * @param {Event}  event - Speech synthesis error event
	 * @param {Object} state - Current state object
	 */
	handleSpeechError: ( event, state ) => {
		const errorContext = {
			errorType: event.error || 'unknown',
			isPlaying: state.isPlaying,
			currentChunk: state.currentChunk,
		};

		SecureErrorHandler.logError( 'Speech Synthesis', event, errorContext );

		// Reset state safely
		if ( state ) {
			state.isPlaying = false;
			state.currentChunk = 0;
		}
	},
};

/**
 * Input validation for specific TTS actions
 */
export const TTSValidator = {
	/**
	 * Validate speed input
	 *
	 * @param {*} input - Speed input to validate
	 * @return {number|null} Validated speed or null
	 */
	validateSpeed: ( input ) => {
		return InputValidator.validateNumber(
			input,
			SECURITY_CONFIG.MIN_SPEED,
			SECURITY_CONFIG.MAX_SPEED
		);
	},

	/**
	 * Validate pitch input
	 *
	 * @param {*} input - Pitch input to validate
	 * @return {number|null} Validated pitch or null
	 */
	validatePitch: ( input ) => {
		return InputValidator.validateNumber(
			input,
			SECURITY_CONFIG.MIN_PITCH,
			SECURITY_CONFIG.MAX_PITCH
		);
	},

	/**
	 * Validate voice selection
	 *
	 * @param {string} voiceURI        - Voice URI to validate
	 * @param {Array}  availableVoices - Array of available voices
	 * @return {Object|null} Validated voice object or null
	 */
	validateVoice: ( voiceURI, availableVoices = [] ) => {
		const validatedURI = InputValidator.validateVoiceURI( voiceURI );
		if ( ! validatedURI ) {
			return null;
		}

		// Check if voice exists in available voices
		const voice = availableVoices.find(
			( v ) => v.voiceURI === validatedURI
		);
		return voice || null;
	},
};
