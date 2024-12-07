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

const {
  state,
  actions
} = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.store)('create-block', {
  state: {
    isPlaying: false,
    currentVoice: null,
    utterance: null,
    voices: [],
    get availableVoices() {
      return this.voices;
    },
    get currentVoiceURI() {
      return this.currentVoice?.voiceURI;
    },
    get isPlaying() {
      return this.isPlaying;
    }
  },
  actions: {
    loadVoices() {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      const availableVoices = window.speechSynthesis.getVoices();
      context.voices = availableVoices;

      // get current docuemtn locale
      const currentLocale = document.documentElement.lang;

      // Set default French voice or first available
      const localVoice = availableVoices.find(voice => voice.lang.startsWith(currentLocale)) || availableVoices[0];
      context.currentVoice = localVoice;

      // Create initial utterance
      actions.createUtterance();
    },
    createUtterance() {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      const content = document.querySelector('main')?.innerText || '';
      const newUtterance = new SpeechSynthesisUtterance(content);
      newUtterance.lang = document.documentElement.lang;
      if (context.currentVoice) {
        newUtterance.voice = context.currentVoice;
      }
      context.utterance = newUtterance;
    },
    Play() {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      context.isPlaying = true;
      // init speach to text
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else if (context.utterance) {
        window.speechSynthesis.speak(context.utterance);
      }
    },
    Pause() {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      context.isPlaying = false;
      window.speechSynthesis.pause();
      // pause speach to text
    },
    changeVoice(e) {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      const voice = context.voices.find(v => v.voiceURI === e.target.value);
      if (voice) {
        context.currentVoice = voice;
        actions.createUtterance();
      }
    }
  },
  callbacks: {
    init() {
      // Initialize voices when available
      if (window.speechSynthesis) {
        actions.loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = actions.loadVoices;
        }
      }
    }
  }
});
})();


//# sourceMappingURL=view.js.map