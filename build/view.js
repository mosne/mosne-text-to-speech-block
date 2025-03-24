import * as __WEBPACK_EXTERNAL_MODULE__wordpress_interactivity_8e89b257__ from "@wordpress/interactivity";
/******/ var __webpack_modules__ = ({

/***/ "@wordpress/interactivity":
/*!*******************************************!*\
  !*** external "@wordpress/interactivity" ***!
  \*******************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE__wordpress_interactivity_8e89b257__;

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*********************!*\
  !*** ./src/view.js ***!
  \*********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/interactivity */ "@wordpress/interactivity");
/**
 * WordPress dependencies
 */


// Constants
const STORAGE_KEYS = {
  LANG: lang => `mosne-tts-lang-${lang}`,
  SPEED: lang => `mosne-tts-speed-${lang}`,
  PITCH: lang => `mosne-tts-pitch-${lang}`
};
const DEFAULTS = {
  HIGHLIGHT_BG: '#ffeb3b',
  HIGHLIGHT_COLOR: '#000000',
  EXCLUDE_CLASS: 'skip-speech',
  WORDS_PER_CHUNK: 200
};

// Helper functions
const getLocalStorageItem = (key, defaultValue) => window.localStorage.getItem(key) || defaultValue;
const getCurrentLocale = () => document.documentElement.lang;
const getBlockWrapper = () => document.querySelector('[data-wp-interactive="mosne-text-to-speech-block"]');
const getMainElement = () => document.querySelector('main');
const {
  state,
  actions
} = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.store)('mosne-text-to-speech-block', {
  state: {
    isPlaying: false,
    currentVoice: null,
    preferredVoice: getLocalStorageItem(STORAGE_KEYS.LANG(getCurrentLocale()), null),
    utterance: null,
    voices: [],
    currentSpeed: getLocalStorageItem(STORAGE_KEYS.SPEED(getCurrentLocale()), 1),
    currentPitch: getLocalStorageItem(STORAGE_KEYS.PITCH(getCurrentLocale()), 1),
    selectedTextRange: {
      hasSelection: false
    },
    currentChunk: 0,
    textChunks: [],
    isProcessingChunks: false
  },
  actions: {
    // Speech Synthesis Management
    checkSynthesisReady() {
      return new Promise(resolve => {
        const check = () => {
          if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    },
    // Highlighting Management
    clearHighlights() {
      const mainElement = getMainElement();
      if (!mainElement) {
        return;
      }
      const highlighted = mainElement.querySelectorAll('.mosne-tts-highlighted-section');
      highlighted.forEach(el => {
        const parent = el.parentNode;
        parent.replaceChild(document.createTextNode(el.textContent), el);
      });
    },
    createHighlightWrapper(background, color) {
      const wrapper = document.createElement('span');
      wrapper.className = 'mosne-tts-highlighted-section';
      wrapper.style.backgroundColor = background;
      wrapper.style.color = color;
      return wrapper;
    },
    // Voice Management
    async loadVoices() {
      const availableVoices = window.speechSynthesis.getVoices();
      if (!availableVoices?.length) {
        setTimeout(() => actions.loadVoices(), 100);
        return;
      }
      const currentLocale = getCurrentLocale();
      const localVoices = availableVoices.filter(voice => voice.lang.startsWith(currentLocale));
      state.voices = localVoices.length > 0 ? localVoices : availableVoices;
      state.currentVoice = state.voices[0];
      if (state.preferredVoice) {
        const voice = state.voices.find(v => v.voiceURI === state.preferredVoice);
        if (voice) {
          state.currentVoice = voice;
        }
      }
      setTimeout(() => actions.createUtterance(), 50);
    },
    // Utterance Management
    createUtterance() {
      const content = state.textChunks.length > 0 ? state.textChunks[state.currentChunk] : actions.getContent();
      const newUtterance = new window.SpeechSynthesisUtterance(content);
      newUtterance.lang = getCurrentLocale();
      newUtterance.rate = state.currentSpeed;
      newUtterance.pitch = state.currentPitch;
      if (state.currentVoice) {
        const voice = state.voices.find(v => v.voiceURI === state.currentVoice.voiceURI);
        newUtterance.voice = voice;
      }
      actions.setupUtteranceEvents(newUtterance, content);
      state.utterance = newUtterance;
    },
    setupUtteranceEvents(utterance, content) {
      utterance.onboundary = event => actions.handleBoundaryEvent(event, content);
      utterance.onend = () => actions.handleUtteranceEnd();
    },
    // Playback Controls
    async Play() {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      context.isPlaying = true;
      state.isPlaying = true;
      if (state.textChunks.length === 0 || state.currentChunk === 0) {
        actions.getContent();
        actions.createUtterance();
      }
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        return;
      }

      // Chrome fix
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setTimeout(() => {
          if (state.utterance) {
            window.speechSynthesis.speak(state.utterance);
          }
        }, 50);
        return;
      }
      if (state.utterance) {
        window.speechSynthesis.speak(state.utterance);
      }
    },
    Pause() {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      context.isPlaying = false;
      state.isPlaying = false;

      // Only pause if currently speaking and the browser supports pausing
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
      }
    },
    Restart() {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      context.isPlaying = false;
      state.isPlaying = false;
      window.speechSynthesis.cancel();
      state.currentChunk = 0;
      state.textChunks = [];
      actions.clearHighlights();
    },
    changeVoice(e) {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      context.isPlaying = false;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const voice = state.voices.find(v => v.voiceURI === e.target.value);
      if (voice) {
        state.currentVoice = voice;
        window.localStorage.setItem('mosne-tts-lang-' + document.documentElement.lang, voice.voiceURI);

        // Small delay to ensure speech synthesis is ready
        setTimeout(() => {
          actions.updateUtterance();
        }, 50);
      }
    },
    async changeSpeed(e) {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      context.isPlaying = false;
      window.speechSynthesis.cancel();
      state.currentSpeed = e.target.value;
      window.localStorage.setItem('mosne-tts-speed-' + document.documentElement.lang, e.target.value);
      await actions.checkSynthesisReady();
      actions.createUtterance();
      if (context.isPlaying) {
        setTimeout(() => {
          window.speechSynthesis.speak(state.utterance);
        }, 50);
      }
    },
    async changePitch(e) {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      context.isPlaying = false;
      window.speechSynthesis.cancel();
      state.currentPitch = e.target.value;
      window.localStorage.setItem('mosne-tts-pitch-' + document.documentElement.lang, e.target.value);
      await actions.checkSynthesisReady();
      actions.createUtterance();
      if (context.isPlaying) {
        setTimeout(() => {
          window.speechSynthesis.speak(state.utterance);
        }, 50);
      }
    },
    toggleSettings() {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      context.showSettings = !context.showSettings;
    },
    getContent() {
      // Check if there is highlighted text
      const mainElement = getMainElement();
      const docView = mainElement?.ownerDocument.defaultView;
      const selection = docView ? docView.getSelection() : null;
      let content = '';
      if (selection && selection.toString().trim().length > 0) {
        // Get selected text
        content = selection.toString();
        state.selectedTextRange = {
          text: content,
          hasSelection: true
        };
      } else {
        // Get content from main element
        let cloneMain = mainElement?.cloneNode(true);
        if (cloneMain) {
          // Use the same exclude classes logic for consistency
          const blockWrapper = getBlockWrapper();
          const excludeClassesStr = blockWrapper?.dataset.excludeClass || DEFAULTS.EXCLUDE_CLASS;
          const excludeClasses = excludeClassesStr.split(/\s+/);

          // Remove all elements with excluded classes
          excludeClasses.forEach(excludeClass => {
            if (excludeClass) {
              const skip = cloneMain.querySelectorAll(`.${excludeClass}`);
              skip.forEach(el => {
                el.remove();
              });
            }
          });
          content = cloneMain.textContent;
          cloneMain = null;
        }
        state.selectedTextRange = {
          hasSelection: false
        };
      }

      // Process content into chunks of approximately 200 words
      state.textChunks = actions.chunkText(content, DEFAULTS.WORDS_PER_CHUNK);
      state.currentChunk = 0;

      // Return the first chunk to start with
      return state.textChunks.length > 0 ? state.textChunks[0] : '';
    },
    // New method to chunk text into approximately word-sized pieces
    chunkText(text, wordsPerChunk) {
      if (!text || text.trim() === '') {
        return [''];
      }

      // Split the text into words
      const words = text.trim().split(/\s+/);
      const chunks = [];

      // Create chunks of approximately wordsPerChunk words
      for (let i = 0; i < words.length; i += wordsPerChunk) {
        const chunk = words.slice(i, i + wordsPerChunk).join(' ');
        chunks.push(chunk);
      }
      return chunks;
    },
    handleBoundaryEvent(event, content) {
      const mainElement = getMainElement();
      if (!mainElement) {
        return;
      }

      // Clear previous highlights
      actions.clearHighlights();

      // Safety check for valid boundary event
      if (!event.charIndex || !event.charLength || event.charIndex + event.charLength > content.length) {
        return;
      }
      try {
        const blockWrapper = getBlockWrapper();
        const highlightBackground = blockWrapper?.dataset.highlightBackground || DEFAULTS.HIGHLIGHT_BG;
        const highlightColor = blockWrapper?.dataset.highlightColor || DEFAULTS.HIGHLIGHT_COLOR;
        if (state.selectedTextRange?.hasSelection) {
          // Handle selected text highlighting
          const docView = mainElement?.ownerDocument.defaultView;
          const selection = docView?.getSelection();
          if (selection?.rangeCount > 0) {
            const selectionRange = selection.getRangeAt(0);
            const wrapper = actions.createHighlightWrapper(highlightBackground, highlightColor);
            try {
              selectionRange.surroundContents(wrapper);
            } catch (e) {
              // Fallback for when surroundContents fails
              const textContent = selectionRange.toString();
              wrapper.textContent = textContent;
              selectionRange.deleteContents();
              selectionRange.insertNode(wrapper);
            }
          }
        } else {
          // Handle main content highlighting
          const excludeClassesStr = blockWrapper?.dataset.excludeClass || DEFAULTS.EXCLUDE_CLASS;
          const excludeClasses = excludeClassesStr.split(/\s+/);

          // Find the current word being spoken to locate the correct node
          const text = content;
          const wordStart = text.lastIndexOf(' ', event.charIndex) + 1;
          const wordEnd = text.indexOf(' ', event.charIndex);
          const currentWord = text.substring(wordStart, wordEnd > -1 ? wordEnd : text.length);
          if (currentWord) {
            // Create TreeWalker to find text nodes
            const walker = document.createTreeWalker(mainElement, NodeFilter.SHOW_TEXT, {
              acceptNode(node) {
                // Check if node's parent has excluded classes
                let current = node.parentElement;
                while (current) {
                  if (current.classList) {
                    for (const excludeClass of excludeClasses) {
                      if (excludeClass && current.classList.contains(excludeClass)) {
                        return NodeFilter.FILTER_REJECT;
                      }
                    }
                  }
                  current = current.parentElement;
                }
                return node.textContent.includes(currentWord) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
              }
            });

            // Find and highlight the first matching text node
            const node = walker.nextNode();
            if (node) {
              const wrapper = actions.createHighlightWrapper(highlightBackground, highlightColor);
              // Highlight the entire node content
              wrapper.textContent = node.textContent;
              node.parentNode.replaceChild(wrapper, node);
            }
          }
        }
      } catch (e) {
        console.error('Highlighting error:', e);
      }
    },
    handleUtteranceEnd() {
      // Clear any remaining highlights
      actions.clearHighlights();

      // Update playing state
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      context.isPlaying = false;
      state.isPlaying = false;

      // Reset chunk tracking
      state.currentChunk = 0;
      state.textChunks = [];

      // Clear selected text range
      state.selectedTextRange = {
        hasSelection: false
      };
    }
  },
  callbacks: {
    init() {
      if (!window.speechSynthesis) {
        return;
      }
      window.speechSynthesis.cancel();
      actions.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = actions.loadVoices;
      }
      window.addEventListener('beforeunload', () => {
        window.speechSynthesis.cancel();
      });
    },
    isSelected() {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      return context.voice.voiceURI === state.currentVoice.voiceURI;
    }
  }
});
})();


//# sourceMappingURL=view.js.map