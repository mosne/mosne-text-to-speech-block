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
} = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.store)('mosne-text-to-speech-block', {
  state: {
    isPlaying: false,
    currentVoice: null,
    preferredVoice: localStorage.getItem('mosne-tts-lang-' + document.documentElement.lang) || null,
    utterance: null,
    voices: [],
    currentSpeed: localStorage.getItem('mosne-tts-speed-' + document.documentElement.lang) || 1,
    currentPitch: localStorage.getItem('mosne-tts-pitch-' + document.documentElement.lang) || 1
  },
  actions: {
    async loadVoices() {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      const availableVoices = window.speechSynthesis.getVoices();
      context.voices = availableVoices;
      context.currentVoice = availableVoices[0];

      // get current docuemtn locale
      const currentLocale = document.documentElement.lang;

      // Set default French voice or first available
      const localVoices = availableVoices.filter(voice => voice.lang.startsWith(currentLocale));
      if (localVoices.length > 0) {
        context.voices = localVoices;
        context.currentVoice = localVoices[0];
        if (state.preferredVoice) {
          const voice = localVoices.find(v => v.voiceURI === state.preferredVoice);
          if (voice) {
            context.currentVoice = voice;
          }
        }
      }
      // Create initial utterance
      actions.createUtterance();
    },
    createUtterance() {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      const content = actions.getContent();
      const newUtterance = new SpeechSynthesisUtterance(content);
      newUtterance.lang = document.documentElement.lang;
      newUtterance.rate = state.currentSpeed;
      newUtterance.pitch = state.currentPitch;
      if (context.currentVoice) {
        newUtterance.voice = context.currentVoice;
      } else {
        console.warn('Current Voice not found');
      }
      context.utterance = newUtterance;
    },
    upadateUtterance() {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      const utterance = context.utterance;
      if (utterance) {
        window.speechSynthesis.cancel();
        context.isPlaying = false;
        actions.createUtterance();
      } else {
        console.warn('Utterance not found');
      }
    },
    Play() {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      context.isPlaying = true;

      // init speach to text
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else if (context.utterance) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(context.utterance);
      } else {
        console.warn('Utterance not found');
      }
    },
    Pause() {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      context.isPlaying = false;
      window.speechSynthesis.pause();
    },
    Restart() {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      context.isPlaying = false;
      window.speechSynthesis.cancel();
    },
    changeVoice(e) {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      context.isPlaying = false;
      const voice = context.voices.find(v => v.voiceURI === e.target.value);
      // Reset current utterance
      window.speechSynthesis.cancel();
      if (voice) {
        context.currentVoice = voice;
        localStorage.setItem('mosne-tts-lang-' + document.documentElement.lang, voice.voiceURI);
        actions.upadateUtterance();
      } else {
        console.warn('Voice not found');
      }
    },
    changeSpeed(e) {
      state.currentSpeed = e.target.value;
      localStorage.setItem('mosne-tts-speed-' + document.documentElement.lang, e.target.value);
      actions.upadateUtterance();
    },
    changePitch(e) {
      state.currentPitch = e.target.value;
      localStorage.setItem('mosne-tts-pitch-' + document.documentElement.lang, e.target.value);
      actions.upadateUtterance();
    },
    toggleSettings() {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      context.showSettings = !context.showSettings;
    },
    getContent() {
      // grab all the text content from the page inside the main element exclude recursivelly the text inside the class skip-speach
      let content = '';
      let cloneMain = document.querySelector('main').cloneNode(true);
      if (cloneMain) {
        const skip = cloneMain.querySelectorAll('.skip-speech');
        skip.forEach(el => {
          el.remove();
        });
        content = cloneMain.textContent;
        cloneMain = null;
      }
      return content;
    }
  },
  callbacks: {
    init() {
      // Initialize voices when available
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        actions.loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = actions.loadVoices;
        }
      }
    },
    isSelected() {
      const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
      return context.voice.voiceURI === context.currentVoice.voiceURI;
    }
  }
});
})();


//# sourceMappingURL=view.js.map