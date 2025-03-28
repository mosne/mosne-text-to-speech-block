/**
 * Constants for the text-to-speech functionality
 */

export const STORAGE_KEYS = {
	LANG: ( lang ) => `mosne-tts-lang-${ lang }`,
	SPEED: ( lang ) => `mosne-tts-speed-${ lang }`,
	PITCH: ( lang ) => `mosne-tts-pitch-${ lang }`,
};

export const DEFAULTS = {
	HIGHLIGHT_BG: '#ffeb3b',
	HIGHLIGHT_COLOR: '#000000',
	EXCLUDE_CLASS: 'skip-speech',
	WORDS_PER_CHUNK: 200,
};
