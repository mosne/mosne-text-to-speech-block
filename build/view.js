import * as __WEBPACK_EXTERNAL_MODULE__wordpress_interactivity_8e89b257__ from "@wordpress/interactivity";
/******/ var __webpack_modules__ = ({

/***/ "./src/view/actions/content.js":
/*!*************************************!*\
  !*** ./src/view/actions/content.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   chunkText: () => (/* binding */ chunkText),
/* harmony export */   getContent: () => (/* binding */ getContent)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../constants */ "./src/view/constants.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils */ "./src/view/utils.js");
/* harmony import */ var _highlight__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./highlight */ "./src/view/actions/highlight.js");
/**
 * Content processing actions
 */




const getContent = state => {
  // Check if there is highlighted text
  const mainElement = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getMainElement)();
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
      const blockWrapper = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getBlockWrapper)();
      const excludeClassesStr = blockWrapper?.dataset.excludeClass || _constants__WEBPACK_IMPORTED_MODULE_0__.DEFAULTS.EXCLUDE_CLASS;
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

      // Pre-build the node position map for faster highlighting
      if (mainElement) {
        (0,_highlight__WEBPACK_IMPORTED_MODULE_2__.buildNodePositionsMap)(state, mainElement, excludeClassesStr.split(/\s+/));
      }
    }
    state.selectedTextRange = {
      hasSelection: false
    };
  }

  // Process content into chunks of approximately 200 words
  state.textChunks = chunkText(content, _constants__WEBPACK_IMPORTED_MODULE_0__.DEFAULTS.WORDS_PER_CHUNK);
  state.currentChunk = 0;

  // Return the first chunk to start with
  return state.textChunks.length > 0 ? state.textChunks[0] : '';
};

// Method to chunk text into approximately word-sized pieces
const chunkText = (text, wordsPerChunk) => {
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
};

/***/ }),

/***/ "./src/view/actions/highlight.js":
/*!***************************************!*\
  !*** ./src/view/actions/highlight.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   buildNodePositionsMap: () => (/* binding */ buildNodePositionsMap),
/* harmony export */   clearHighlights: () => (/* binding */ clearHighlights),
/* harmony export */   createHighlightWrapper: () => (/* binding */ createHighlightWrapper),
/* harmony export */   handleBoundaryEvent: () => (/* binding */ handleBoundaryEvent),
/* harmony export */   setupSafariHighlighting: () => (/* binding */ setupSafariHighlighting)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../constants */ "./src/view/constants.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils */ "./src/view/utils.js");
/**
 * Highlighting management actions
 */




// Highlighting Management
const clearHighlights = state => {
  if (state.currentSelection) {
    try {
      state.currentSelection.removeAllRanges();
    } catch (e) {
      // Handle Edge/IE errors with selection
      console.warn('Error clearing highlights:', e);
    }
    state.currentSelection = null;
  }
  state.currentHighlightedNode = null;
};
const createHighlightWrapper = (state, node) => {
  // Use the node's document for selection to avoid global selection issues
  if (!node) {
    return null;
  }
  const doc = node.ownerDocument;
  const docView = doc.defaultView;
  if (!docView) {
    return null;
  }

  // Clear any existing selection
  clearHighlights(state);
  try {
    // Create a new range for the node text content
    const range = doc.createRange();

    // Only select the text node's content instead of the entire node
    if (node.nodeType === Node.TEXT_NODE) {
      range.setStart(node, 0);
      range.setEnd(node, node.length);
    } else {
      range.selectNodeContents(node);
    }

    // Apply the selection
    const selection = docView.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);

      // Store the current selection for cleanup
      state.currentSelection = selection;

      // Apply CSS custom properties via selection styles
      // This uses the CSS variables we set on init
      if (selection.rangeCount > 0) {
        selection.getRangeAt(0);
        selection.getRangeAt(0);
      }
    }
  } catch (e) {
    console.warn('Error creating highlight:', e);
  }
};

// Safari-specific timer-based highlighting fallback
const setupSafariHighlighting = (state, content) => {
  if (state.browserType !== 'safari') {
    return null;
  }

  // Estimate reading speed (chars per second)
  const charsPerSecond = 15 * state.currentSpeed;
  const intervalTime = 250; // Check every 250ms

  let currentIndex = 0;
  const timerId = setInterval(() => {
    if (!state.isPlaying) {
      clearInterval(timerId);
      return;
    }

    // Create a synthetic boundary event for Safari
    const syntheticEvent = {
      charIndex: currentIndex,
      charLength: 1
    };
    handleBoundaryEvent(state, syntheticEvent, content);

    // Advance the position based on estimated reading speed
    currentIndex += Math.ceil(charsPerSecond * intervalTime / 1000);
  }, intervalTime);
  return timerId;
};
const handleBoundaryEvent = (state, event) => {
  const mainElement = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getMainElement)();
  if (!mainElement) {
    return;
  }
  try {
    // Calculate the absolute position by adding offsets of previous chunks
    let absoluteCharIndex = event.charIndex;
    if (state.currentChunk > 0) {
      // Add lengths of all previous chunks
      for (let i = 0; i < state.currentChunk; i++) {
        absoluteCharIndex += state.textChunks[i].length + 1; // +1 for space between chunks
      }
    }
    if (state.selectedTextRange?.hasSelection) {
      // Handle selected text case...
    } else {
      // Handle main content highlighting
      const blockWrapper = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getBlockWrapper)();
      const excludeClassesStr = blockWrapper?.dataset.excludeClass || _constants__WEBPACK_IMPORTED_MODULE_0__.DEFAULTS.EXCLUDE_CLASS;
      const excludeClasses = excludeClassesStr.split(/\s+/);

      // Rebuild node positions map if empty
      if (state.nodePositions.size === 0) {
        buildNodePositionsMap(state, mainElement, excludeClasses);
      }

      // Find the node containing the current absolute position
      let targetNode = null;
      let bestMatch = {
        node: null,
        distance: Number.MAX_SAFE_INTEGER
      };

      // Find the closest position in the map using absolute position
      const positions = Array.from(state.nodePositions.keys()).sort((a, b) => a - b);
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const nodeData = state.nodePositions.get(pos);

        // Exact match using absolute position
        if (pos <= absoluteCharIndex && absoluteCharIndex < pos + nodeData.length) {
          targetNode = nodeData.node;
          break;
        }

        // For Firefox, track approximate matches as fallback
        if (state.browserType === 'firefox') {
          const distance = Math.abs(pos - absoluteCharIndex);
          if (distance < bestMatch.distance) {
            bestMatch = {
              node: nodeData.node,
              distance
            };
          }
        }
      }

      // Use best approximate match for Firefox if no exact match
      if (!targetNode && state.browserType === 'firefox' && bestMatch.node) {
        targetNode = bestMatch.node;
      }

      // Update highlight if we found a new node
      if (targetNode && targetNode !== state.currentHighlightedNode && targetNode.textContent.trim().length > 0) {
        clearHighlights(state);
        createHighlightWrapper(state, targetNode);
        state.currentHighlightedNode = targetNode;

        // Scroll the highlighted word into view
        if (targetNode.nodeType !== Node.TEXT_NODE) {
          targetNode.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        } else if (targetNode.parentNode) {
          targetNode.parentNode.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }
  } catch (e) {
    console.error('Highlighting error:', e);
  }
};

// Add a new method to build the node positions map more efficiently
const buildNodePositionsMap = (state, rootElement, excludeClasses) => {
  state.nodePositions.clear();

  // Optimized node collection with filtering
  const collectTextNodes = (element, charCount = 0) => {
    // Skip excluded elements
    if (element.classList) {
      for (const excludeClass of excludeClasses) {
        if (excludeClass && element.classList.contains(excludeClass)) {
          return charCount;
        }
      }
    }

    // Process text nodes
    if (element.nodeType === Node.TEXT_NODE) {
      const text = element.textContent;
      if (text.trim().length > 0) {
        state.nodePositions.set(charCount, {
          node: element,
          length: text.length
        });
        charCount += text.length;
      }
      return charCount;
    }

    // Process element children
    if (element.childNodes && element.childNodes.length > 0) {
      for (const child of element.childNodes) {
        charCount = collectTextNodes(child, charCount);
      }
    }
    return charCount;
  };

  // Start the collection process
  collectTextNodes(rootElement);
};

/***/ }),

/***/ "./src/view/actions/index.js":
/*!***********************************!*\
  !*** ./src/view/actions/index.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Pause: () => (/* reexport safe */ _playback__WEBPACK_IMPORTED_MODULE_4__.Pause),
/* harmony export */   Play: () => (/* reexport safe */ _playback__WEBPACK_IMPORTED_MODULE_4__.Play),
/* harmony export */   Restart: () => (/* reexport safe */ _playback__WEBPACK_IMPORTED_MODULE_4__.Restart),
/* harmony export */   buildNodePositionsMap: () => (/* reexport safe */ _highlight__WEBPACK_IMPORTED_MODULE_1__.buildNodePositionsMap),
/* harmony export */   changePitch: () => (/* reexport safe */ _playback__WEBPACK_IMPORTED_MODULE_4__.changePitch),
/* harmony export */   changeSpeed: () => (/* reexport safe */ _playback__WEBPACK_IMPORTED_MODULE_4__.changeSpeed),
/* harmony export */   changeVoice: () => (/* reexport safe */ _voice__WEBPACK_IMPORTED_MODULE_2__.changeVoice),
/* harmony export */   checkSynthesisReady: () => (/* reexport safe */ _synthesis__WEBPACK_IMPORTED_MODULE_0__.checkSynthesisReady),
/* harmony export */   chunkText: () => (/* reexport safe */ _content__WEBPACK_IMPORTED_MODULE_5__.chunkText),
/* harmony export */   clearHighlights: () => (/* reexport safe */ _highlight__WEBPACK_IMPORTED_MODULE_1__.clearHighlights),
/* harmony export */   createHighlightWrapper: () => (/* reexport safe */ _highlight__WEBPACK_IMPORTED_MODULE_1__.createHighlightWrapper),
/* harmony export */   createUtterance: () => (/* reexport safe */ _utterance__WEBPACK_IMPORTED_MODULE_3__.createUtterance),
/* harmony export */   getContent: () => (/* reexport safe */ _content__WEBPACK_IMPORTED_MODULE_5__.getContent),
/* harmony export */   handleBoundaryEvent: () => (/* reexport safe */ _highlight__WEBPACK_IMPORTED_MODULE_1__.handleBoundaryEvent),
/* harmony export */   handleUtteranceEnd: () => (/* reexport safe */ _utterance__WEBPACK_IMPORTED_MODULE_3__.handleUtteranceEnd),
/* harmony export */   loadVoices: () => (/* reexport safe */ _voice__WEBPACK_IMPORTED_MODULE_2__.loadVoices),
/* harmony export */   setupSafariHighlighting: () => (/* reexport safe */ _highlight__WEBPACK_IMPORTED_MODULE_1__.setupSafariHighlighting),
/* harmony export */   setupSafariKeepAlive: () => (/* reexport safe */ _synthesis__WEBPACK_IMPORTED_MODULE_0__.setupSafariKeepAlive),
/* harmony export */   setupUtteranceEvents: () => (/* reexport safe */ _utterance__WEBPACK_IMPORTED_MODULE_3__.setupUtteranceEvents),
/* harmony export */   toggleSettings: () => (/* reexport safe */ _playback__WEBPACK_IMPORTED_MODULE_4__.toggleSettings)
/* harmony export */ });
/* harmony import */ var _synthesis__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./synthesis */ "./src/view/actions/synthesis.js");
/* harmony import */ var _highlight__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./highlight */ "./src/view/actions/highlight.js");
/* harmony import */ var _voice__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./voice */ "./src/view/actions/voice.js");
/* harmony import */ var _utterance__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utterance */ "./src/view/actions/utterance.js");
/* harmony import */ var _playback__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./playback */ "./src/view/actions/playback.js");
/* harmony import */ var _content__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./content */ "./src/view/actions/content.js");
/**
 * Export all actions for easy import
 */








/***/ }),

/***/ "./src/view/actions/playback.js":
/*!**************************************!*\
  !*** ./src/view/actions/playback.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Pause: () => (/* binding */ Pause),
/* harmony export */   Play: () => (/* binding */ Play),
/* harmony export */   Restart: () => (/* binding */ Restart),
/* harmony export */   changePitch: () => (/* binding */ changePitch),
/* harmony export */   changeSpeed: () => (/* binding */ changeSpeed),
/* harmony export */   toggleSettings: () => (/* binding */ toggleSettings)
/* harmony export */ });
/* harmony import */ var _wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/interactivity */ "@wordpress/interactivity");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils */ "./src/view/utils.js");
/* harmony import */ var _synthesis__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./synthesis */ "./src/view/actions/synthesis.js");
/* harmony import */ var _highlight__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./highlight */ "./src/view/actions/highlight.js");
/* harmony import */ var _utterance__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utterance */ "./src/view/actions/utterance.js");
/* harmony import */ var _content__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./content */ "./src/view/actions/content.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../constants */ "./src/view/constants.js");
/**
 * Playback control actions
 */









// Playback Controls
const Play = async state => {
  const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
  if (context) {
    context.isPlaying = true;
  }
  state.isPlaying = true;

  // Firefox resume handling
  if (state.browserType === 'firefox' && state.pausedAt) {
    // Create a new utterance from the paused position
    const remainingText = state.pausedAt.text.substring(state.pausedAt.charIndex);

    // Set the current chunk back to where we paused
    state.currentChunk = state.pausedAt.chunk;

    // Create new utterance for the remaining text
    const newUtterance = new window.SpeechSynthesisUtterance(remainingText);
    newUtterance.lang = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getCurrentLocale)();
    newUtterance.rate = state.currentSpeed;
    newUtterance.pitch = state.currentPitch;

    // Initialize the last character index for the new utterance
    newUtterance._lastCharIndex = 0;

    // Store the content offset for highlighting calculations
    newUtterance._contentOffset = state.pausedAt.contentPosition;
    if (state.currentVoice) {
      const voice = state.voices.find(v => v.voiceURI === state.currentVoice.voiceURI);
      newUtterance.voice = voice;
    }

    // Create a custom boundary handler specific to this resumed utterance
    newUtterance.onboundary = event => {
      // Save last character index for pause handling
      newUtterance._lastCharIndex = event.charIndex || 0;

      // Calculate the absolute position in the original content
      const absolutePosition = (event.charIndex || 0) + state.pausedAt.contentPosition;

      // Create an adjusted event with the correct character index
      const adjustedEvent = {
        ...event,
        charIndex: absolutePosition,
        // Ensure charLength is always valid
        charLength: event.charLength || 1
      };

      // Pass to normal boundary handler but with full original text
      const mainElement = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getMainElement)();
      if (mainElement) {
        // Force rebuild node positions to ensure synchronization
        const blockWrapper = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getBlockWrapper)();
        const excludeClassesStr = blockWrapper?.dataset.excludeClass || _constants__WEBPACK_IMPORTED_MODULE_6__.DEFAULTS.EXCLUDE_CLASS;
        if (state.nodePositions.size === 0) {
          (0,_highlight__WEBPACK_IMPORTED_MODULE_3__.buildNodePositionsMap)(state, mainElement, excludeClassesStr.split(/\s+/));
        }

        // Handle the boundary event with the full content context
        (0,_highlight__WEBPACK_IMPORTED_MODULE_3__.handleBoundaryEvent)(state, adjustedEvent, state.pausedAt.fullText || state.pausedAt.text);
      }
    };
    newUtterance.onend = () => (0,_utterance__WEBPACK_IMPORTED_MODULE_4__.handleUtteranceEnd)(state);
    state.utterance = newUtterance;

    // Speak the new utterance
    window.speechSynthesis.speak(state.utterance);

    // In Safari, set up the keep-alive timer
    if (state.browserType === 'safari') {
      (0,_synthesis__WEBPACK_IMPORTED_MODULE_2__.setupSafariKeepAlive)(state);
    }

    // Clear the paused state
    state.pausedAt = null;
    return;
  }
  if (state.textChunks.length === 0 || state.currentChunk === 0) {
    (0,_content__WEBPACK_IMPORTED_MODULE_5__.getContent)(state);
    (0,_utterance__WEBPACK_IMPORTED_MODULE_4__.createUtterance)(state, context);
  }
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      return;
    }
  } catch (e) {
    console.warn('Resume failed, recreating speech:', e);
    // If resume fails, recreate the utterance
    (0,_utterance__WEBPACK_IMPORTED_MODULE_4__.createUtterance)(state, context);
  }

  // Chrome and Edge fix - recreate utterance if speaking
  if (state.browserType === 'chrome' || state.browserType === 'edge') {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        if (state.utterance) {
          window.speechSynthesis.speak(state.utterance);
        }
      }, 50);
      return;
    }
  }
  if (state.utterance) {
    window.speechSynthesis.speak(state.utterance);

    // In Safari, set up the keep-alive timer
    if (state.browserType === 'safari') {
      (0,_synthesis__WEBPACK_IMPORTED_MODULE_2__.setupSafariKeepAlive)(state);
    }
  }
};
const Pause = async state => {
  const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
  if (context) {
    context.isPlaying = false;
  }
  state.isPlaying = false;

  // Firefox doesn't fully support pause, so we need to handle it differently
  if (state.browserType === 'firefox') {
    // Store the current position
    if (window.speechSynthesis.speaking) {
      // Get the full text content for context
      const fullText = state.textChunks.join(' ');

      // Save current speech state for later resuming
      state.pausedAt = {
        text: state.utterance.text,
        charIndex: state.utterance._lastCharIndex || 0,
        chunk: state.currentChunk,
        // Track full content position to correctly restore highlighting
        contentPosition: state.utterance._lastCharIndex + (state.currentChunk > 0 ? state.textChunks.slice(0, state.currentChunk).reduce((sum, chunk) => sum + chunk.length, 0) : 0),
        // Store full text for better context on resume
        fullText
      };

      // Cancel current speech
      window.speechSynthesis.cancel();
    }
  } else if (state.browserType === 'safari') {
    // Safari's pause is also unreliable
    if (window.speechSynthesis.speaking) {
      // Get the full text content for context
      const fullText = state.textChunks.join(' ');

      // Save position like Firefox
      state.pausedAt = {
        text: state.utterance.text,
        charIndex: state.utterance._lastCharIndex || 0,
        chunk: state.currentChunk,
        contentPosition: state.utterance._lastCharIndex + (state.currentChunk > 0 ? state.textChunks.slice(0, state.currentChunk).reduce((sum, chunk) => sum + chunk.length, 0) : 0),
        // Store full text for better context on resume
        fullText
      };

      // Clear any Safari timers
      if (state.utterance._safariTimerId) {
        clearInterval(state.utterance._safariTimerId);
      }
      if (state.safariKeepAliveTimer) {
        clearInterval(state.safariKeepAliveTimer);
        state.safariKeepAliveTimer = null;
      }
      window.speechSynthesis.cancel();
    }
  } else if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    // Standard pause for Chrome and other browsers
    window.speechSynthesis.pause();
  }
};
const Restart = state => {
  const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
  if (context) {
    context.isPlaying = false;
  }
  state.isPlaying = false;

  // Clear any Safari timers
  if (state.browserType === 'safari') {
    if (state.utterance && state.utterance._safariTimerId) {
      clearInterval(state.utterance._safariTimerId);
    }
    if (state.safariKeepAliveTimer) {
      clearInterval(state.safariKeepAliveTimer);
      state.safariKeepAliveTimer = null;
    }
  }
  window.speechSynthesis.cancel();
  state.currentChunk = 0;
  state.textChunks = [];
  (0,_highlight__WEBPACK_IMPORTED_MODULE_3__.clearHighlights)(state);
};
const changeSpeed = async (state, e) => {
  const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
  if (context) {
    context.isPlaying = false;
  }
  window.speechSynthesis.cancel();
  state.currentSpeed = e.target.value;
  window.localStorage.setItem('mosne-tts-speed-' + document.documentElement.lang, e.target.value);
  await (0,_synthesis__WEBPACK_IMPORTED_MODULE_2__.checkSynthesisReady)();
  (0,_utterance__WEBPACK_IMPORTED_MODULE_4__.createUtterance)(state, context);
  if (context && context.isPlaying) {
    setTimeout(() => {
      window.speechSynthesis.speak(state.utterance);
    }, 50);
  }
};
const changePitch = async (state, e) => {
  const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
  if (context) {
    context.isPlaying = false;
  }
  window.speechSynthesis.cancel();
  state.currentPitch = e.target.value;
  window.localStorage.setItem('mosne-tts-pitch-' + document.documentElement.lang, e.target.value);
  await (0,_synthesis__WEBPACK_IMPORTED_MODULE_2__.checkSynthesisReady)();
  (0,_utterance__WEBPACK_IMPORTED_MODULE_4__.createUtterance)(state, context);
  if (context && context.isPlaying) {
    setTimeout(() => {
      window.speechSynthesis.speak(state.utterance);
    }, 50);
  }
};
const toggleSettings = () => {
  const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
  if (context) {
    context.showSettings = !context.showSettings;
  }
};

/***/ }),

/***/ "./src/view/actions/synthesis.js":
/*!***************************************!*\
  !*** ./src/view/actions/synthesis.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   checkSynthesisReady: () => (/* binding */ checkSynthesisReady),
/* harmony export */   setupSafariKeepAlive: () => (/* binding */ setupSafariKeepAlive)
/* harmony export */ });
/**
 * Speech synthesis management actions
 */

// Speech Synthesis Management
const checkSynthesisReady = () => {
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
};

// Safari requires periodic "ping" to keep speech synthesis active
const setupSafariKeepAlive = state => {
  if (state.browserType !== 'safari') {
    return;
  }

  // Clear any existing timer
  if (state.safariKeepAliveTimer) {
    clearInterval(state.safariKeepAliveTimer);
  }

  // Every 10 seconds, ping speechSynthesis to keep it alive
  state.safariKeepAliveTimer = setInterval(() => {
    if (state.isPlaying && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    } else {
      clearInterval(state.safariKeepAliveTimer);
      state.safariKeepAliveTimer = null;
    }
  }, 10000);
};

/***/ }),

/***/ "./src/view/actions/utterance.js":
/*!***************************************!*\
  !*** ./src/view/actions/utterance.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createUtterance: () => (/* binding */ createUtterance),
/* harmony export */   handleUtteranceEnd: () => (/* binding */ handleUtteranceEnd),
/* harmony export */   setupUtteranceEvents: () => (/* binding */ setupUtteranceEvents)
/* harmony export */ });
/* harmony import */ var _wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/interactivity */ "@wordpress/interactivity");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils */ "./src/view/utils.js");
/* harmony import */ var _highlight__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./highlight */ "./src/view/actions/highlight.js");
/**
 * Utterance management actions
 */





// Utterance Management
const createUtterance = (state, context) => {
  // Get the content for the current chunk
  const content = state.textChunks[state.currentChunk];
  const newUtterance = new window.SpeechSynthesisUtterance(content);
  newUtterance.lang = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getCurrentLocale)();
  newUtterance.rate = state.currentSpeed;
  newUtterance.pitch = state.currentPitch;
  if (state.currentVoice) {
    const voice = state.voices.find(v => v.voiceURI === state.currentVoice.voiceURI);
    newUtterance.voice = voice;
  }
  setupUtteranceEvents(state, newUtterance, content, context);
  state.utterance = newUtterance;
};
const setupUtteranceEvents = (state, utterance, content, context) => {
  // Safari doesn't reliably fire boundary events, so use workarounds
  if (state.browserType === 'safari') {
    // For Safari, we'll use word-level events and timeouts
    utterance.onboundary = event => {
      // Still try to use boundary events if they work
      utterance._lastCharIndex = event.charIndex || 0;
      (0,_highlight__WEBPACK_IMPORTED_MODULE_2__.handleBoundaryEvent)(state, event, content);
    };

    // Also add a timer-based highlighting as fallback for Safari
    utterance._safariTimerId = (0,_highlight__WEBPACK_IMPORTED_MODULE_2__.setupSafariHighlighting)(state, content);
  } else {
    utterance.onboundary = event => {
      // Save last character index for pause handling
      utterance._lastCharIndex = event.charIndex || 0;

      // If this utterance has a content offset (resumed utterance)
      // create an adjusted event with the correct character index
      const adjustedEvent = utterance._contentOffset !== undefined ? {
        ...event,
        charIndex: (event.charIndex || 0) + utterance._contentOffset
      } : event;
      (0,_highlight__WEBPACK_IMPORTED_MODULE_2__.handleBoundaryEvent)(state, adjustedEvent, content);
    };
  }
  utterance.onend = () => {
    // Clear Safari timer if it exists
    if (utterance._safariTimerId) {
      clearInterval(utterance._safariTimerId);
    }

    // Check if there are more chunks to process
    if (state.currentChunk < state.textChunks.length - 1) {
      // Move to next chunk
      state.currentChunk++;

      // Create and speak the next utterance
      createUtterance(state, context);

      // Small delay to ensure proper timing
      setTimeout(() => {
        if (state.isPlaying && state.utterance) {
          window.speechSynthesis.speak(state.utterance);
        }
      }, 50);
    } else {
      // This is the last chunk, perform cleanup
      if (context) {
        context.isPlaying = false;
      }
      state.isPlaying = false;
      (0,_highlight__WEBPACK_IMPORTED_MODULE_2__.clearHighlights)(state);
    }
  };

  // Ensure we can track errors across browsers
  utterance.onerror = event => {
    console.error('Speech synthesis error:', event);
    handleUtteranceEnd(state);
  };
};
const handleUtteranceEnd = state => {
  // Clear any remaining highlights
  (0,_highlight__WEBPACK_IMPORTED_MODULE_2__.clearHighlights)(state);

  // Update playing state
  state.isPlaying = false;

  // Reset chunk tracking
  state.currentChunk = 0;
  state.textChunks = [];

  // Reset highlight tracking
  state.currentHighlightedNode = null;

  // Clear selected text range
  state.selectedTextRange = {
    hasSelection: false
  };
};

/***/ }),

/***/ "./src/view/actions/voice.js":
/*!***********************************!*\
  !*** ./src/view/actions/voice.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   changeVoice: () => (/* binding */ changeVoice),
/* harmony export */   loadVoices: () => (/* binding */ loadVoices)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/view/utils.js");
/* harmony import */ var _utterance__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utterance */ "./src/view/actions/utterance.js");
/* harmony import */ var _wordpress_interactivity__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/interactivity */ "@wordpress/interactivity");
/**
 * Voice management actions
 */




// Voice Management
const loadVoices = async state => {
  // For Safari/iOS, ensure we have access to voices
  if (state.browserType === 'safari') {
    // Safari sometimes needs speech synthesis to be triggered first
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    window.speechSynthesis.cancel();
  }
  const availableVoices = window.speechSynthesis.getVoices();
  if (!availableVoices?.length) {
    // Try again in a bit - browsers load voices asynchronously
    setTimeout(() => loadVoices(state), 100);
    return;
  }
  const currentLocale = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.getCurrentLocale)();
  const localVoices = availableVoices.filter(voice => voice.lang.startsWith(currentLocale));
  state.voices = localVoices.length > 0 ? localVoices : availableVoices;
  state.currentVoice = state.voices[0];
  if (state.preferredVoice) {
    const voice = state.voices.find(v => v.voiceURI === state.preferredVoice);
    if (voice) {
      state.currentVoice = voice;
    }
  }
  setTimeout(() => (0,_utterance__WEBPACK_IMPORTED_MODULE_1__.createUtterance)(state), 50);
};
const changeVoice = (state, e) => {
  const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_2__.getContext)();
  if (context) {
    context.isPlaying = false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  const voice = state.voices.find(v => v.voiceURI === e.target.value);
  if (voice) {
    state.currentVoice = voice;
    window.localStorage.setItem('mosne-tts-lang-' + document.documentElement.lang, voice.voiceURI);
  }
};

/***/ }),

/***/ "./src/view/callbacks.js":
/*!*******************************!*\
  !*** ./src/view/callbacks.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   init: () => (/* binding */ init),
/* harmony export */   isSelected: () => (/* binding */ isSelected)
/* harmony export */ });
/* harmony import */ var _wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/interactivity */ "@wordpress/interactivity");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils */ "./src/view/utils.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./constants */ "./src/view/constants.js");
/* harmony import */ var _actions_voice__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./actions/voice */ "./src/view/actions/voice.js");
/* harmony import */ var _actions_highlight__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./actions/highlight */ "./src/view/actions/highlight.js");
/**
 * Callback functions for the text-to-speech functionality
 */






const init = state => {
  if (!window.speechSynthesis) {
    console.warn('Speech synthesis not supported in this browser');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Initialize highlight colors once at startup
  (0,_utils__WEBPACK_IMPORTED_MODULE_1__.initHighlightColors)();

  // Load available voices
  (0,_actions_voice__WEBPACK_IMPORTED_MODULE_3__.loadVoices)(state);
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => (0,_actions_voice__WEBPACK_IMPORTED_MODULE_3__.loadVoices)(state);
  }
  window.addEventListener('beforeunload', () => {
    window.speechSynthesis.cancel();

    // Clear any Safari timers
    if (state.browserType === 'safari') {
      if (state.utterance && state.utterance._safariTimerId) {
        clearInterval(state.utterance._safariTimerId);
      }
      if (state.safariKeepAliveTimer) {
        clearInterval(state.safariKeepAliveTimer);
      }
    }
  });

  // Initial node map building for better performance when playback starts
  const mainElement = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getMainElement)();
  if (mainElement) {
    const blockWrapper = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getBlockWrapper)();
    const excludeClassesStr = blockWrapper?.dataset.excludeClass || _constants__WEBPACK_IMPORTED_MODULE_2__.DEFAULTS.EXCLUDE_CLASS;
    setTimeout(() => {
      (0,_actions_highlight__WEBPACK_IMPORTED_MODULE_4__.buildNodePositionsMap)(state, mainElement, excludeClassesStr.split(/\s+/));
    }, 500); // Delay to ensure DOM is ready
  }
};
const isSelected = state => {
  const context = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.getContext)();
  return context.voice?.voiceURI === state.currentVoice?.voiceURI;
};

/***/ }),

/***/ "./src/view/constants.js":
/*!*******************************!*\
  !*** ./src/view/constants.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULTS: () => (/* binding */ DEFAULTS),
/* harmony export */   STORAGE_KEYS: () => (/* binding */ STORAGE_KEYS)
/* harmony export */ });
/**
 * Constants for the text-to-speech functionality
 */

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

/***/ }),

/***/ "./src/view/state.js":
/*!***************************!*\
  !*** ./src/view/state.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initialState: () => (/* binding */ initialState)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants */ "./src/view/constants.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils */ "./src/view/utils.js");
/**
 * Initial state for the text-to-speech functionality
 */



const initialState = {
  isPlaying: false,
  currentVoice: null,
  preferredVoice: (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getLocalStorageItem)(_constants__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.LANG((0,_utils__WEBPACK_IMPORTED_MODULE_1__.getCurrentLocale)()), null),
  utterance: null,
  voices: [],
  currentSpeed: (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getLocalStorageItem)(_constants__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.SPEED((0,_utils__WEBPACK_IMPORTED_MODULE_1__.getCurrentLocale)()), 1),
  currentPitch: (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getLocalStorageItem)(_constants__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.PITCH((0,_utils__WEBPACK_IMPORTED_MODULE_1__.getCurrentLocale)()), 1),
  selectedTextRange: {
    hasSelection: false
  },
  currentChunk: 0,
  textChunks: [],
  isProcessingChunks: false,
  currentHighlightedNode: null,
  nodePositions: new Map(),
  currentSelection: null,
  pausedAt: null,
  browserType: (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getBrowser)(),
  // For Safari ping-pong to keep synthesis alive
  safariKeepAliveTimer: null
};

/***/ }),

/***/ "./src/view/utils.js":
/*!***************************!*\
  !*** ./src/view/utils.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getBlockWrapper: () => (/* binding */ getBlockWrapper),
/* harmony export */   getBrowser: () => (/* binding */ getBrowser),
/* harmony export */   getCurrentLocale: () => (/* binding */ getCurrentLocale),
/* harmony export */   getLocalStorageItem: () => (/* binding */ getLocalStorageItem),
/* harmony export */   getMainElement: () => (/* binding */ getMainElement),
/* harmony export */   initHighlightColors: () => (/* binding */ initHighlightColors)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants */ "./src/view/constants.js");
/**
 * Helper functions for text-to-speech functionality
 */


const getLocalStorageItem = (key, defaultValue) => {
  try {
    return window.localStorage.getItem(key) || defaultValue;
  } catch (e) {
    // Handle private browsing mode in Safari
    return defaultValue;
  }
};
const getCurrentLocale = () => document.documentElement.lang || 'en';
const getBlockWrapper = () => document.querySelector('[data-wp-interactive="mosne-text-to-speech-block"]');
const getMainElement = () => document.querySelector('main');

// Detect browser for specific handling
const getBrowser = () => {
  const userAgent = window.navigator.userAgent;
  if (userAgent.indexOf('Firefox') !== -1) {
    return 'firefox';
  }
  if (userAgent.indexOf('Edge') !== -1 || userAgent.indexOf('Edg') !== -1) {
    return 'edge';
  }
  if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
    return 'safari';
  }
  if (userAgent.indexOf('Chrome') !== -1) {
    return 'chrome';
  }
  return 'other';
};
const initHighlightColors = () => {
  const mainElement = getMainElement();
  const blockWrapper = getBlockWrapper();
  if (!mainElement || !blockWrapper) {
    return;
  }

  // Get highlight colors from block settings or use defaults
  const highlightBackground = blockWrapper.dataset.highlightBackground || _constants__WEBPACK_IMPORTED_MODULE_0__.DEFAULTS.HIGHLIGHT_BG;
  const highlightColor = blockWrapper.dataset.highlightColor || _constants__WEBPACK_IMPORTED_MODULE_0__.DEFAULTS.HIGHLIGHT_COLOR;

  // Set CSS custom properties on the main element for easier styling
  mainElement.style.setProperty('--mosne-tts-highlight-bg', highlightBackground);
  mainElement.style.setProperty('--mosne-tts-highlight-color', highlightColor);
};

/***/ }),

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
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
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
/* harmony import */ var _view_state__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./view/state */ "./src/view/state.js");
/* harmony import */ var _view_actions__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./view/actions */ "./src/view/actions/index.js");
/* harmony import */ var _view_callbacks__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./view/callbacks */ "./src/view/callbacks.js");
/**
 * WordPress dependencies
 */


/**
 * Internal dependencies
 */




// Store configuration
const {
  state
} = (0,_wordpress_interactivity__WEBPACK_IMPORTED_MODULE_0__.store)('mosne-text-to-speech-block', {
  state: _view_state__WEBPACK_IMPORTED_MODULE_1__.initialState,
  // Map action creators to pass state as first argument
  actions: {
    // Synthesis
    checkSynthesisReady: () => _view_actions__WEBPACK_IMPORTED_MODULE_2__.checkSynthesisReady(state),
    setupSafariKeepAlive: () => _view_actions__WEBPACK_IMPORTED_MODULE_2__.setupSafariKeepAlive(state),
    //highlight
    buildNodePositionsMap: () => _view_actions__WEBPACK_IMPORTED_MODULE_2__.buildNodePositionsMap(state),
    handleBoundaryEvent: () => _view_actions__WEBPACK_IMPORTED_MODULE_2__.handleBoundaryEvent(state),
    setupSafariHighlighting: () => _view_actions__WEBPACK_IMPORTED_MODULE_2__.setupSafariHighlighting(state),
    clearHighlights: () => _view_actions__WEBPACK_IMPORTED_MODULE_2__.clearHighlights(state),
    // Voice
    loadVoices: () => _view_actions__WEBPACK_IMPORTED_MODULE_2__.loadVoices(state),
    changeVoice: e => _view_actions__WEBPACK_IMPORTED_MODULE_2__.changeVoice(state, e),
    // Utterance
    createUtterance: () => _view_actions__WEBPACK_IMPORTED_MODULE_2__.createUtterance(state),
    setupUtteranceEvents: () => _view_actions__WEBPACK_IMPORTED_MODULE_2__.setupUtteranceEvents(state),
    handleUtteranceEnd: () => _view_actions__WEBPACK_IMPORTED_MODULE_2__.handleUtteranceEnd(state),
    // playback
    Play: () => _view_actions__WEBPACK_IMPORTED_MODULE_2__.Play(state),
    Pause: () => _view_actions__WEBPACK_IMPORTED_MODULE_2__.Pause(state),
    Restart: () => _view_actions__WEBPACK_IMPORTED_MODULE_2__.Restart(state),
    changeSpeed: e => _view_actions__WEBPACK_IMPORTED_MODULE_2__.changeSpeed(state, e),
    changePitch: e => _view_actions__WEBPACK_IMPORTED_MODULE_2__.changePitch(state, e),
    toggleSettings: () => _view_actions__WEBPACK_IMPORTED_MODULE_2__.toggleSettings(state),
    // content
    getContent: () => _view_actions__WEBPACK_IMPORTED_MODULE_2__.getContent(state)
  },
  // Map callback creators to pass state as argument
  callbacks: {
    init: () => _view_callbacks__WEBPACK_IMPORTED_MODULE_3__.init(state),
    isSelected: () => _view_callbacks__WEBPACK_IMPORTED_MODULE_3__.isSelected(state)
  }
});
})();


//# sourceMappingURL=view.js.map