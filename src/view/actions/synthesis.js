/**
 * Speech synthesis management actions
 */

// Speech Synthesis Management
export const checkSynthesisReady = () => {
	return new Promise( ( resolve ) => {
		const check = () => {
			if (
				! window.speechSynthesis.speaking &&
				! window.speechSynthesis.pending
			) {
				resolve();
			} else {
				setTimeout( check, 100 );
			}
		};
		check();
	} );
};

// Safari requires periodic "ping" to keep speech synthesis active
export const setupSafariKeepAlive = ( state ) => {
	if ( state.browserType !== 'safari' ) {
		return;
	}

	// Clear any existing timer
	if ( state.safariKeepAliveTimer ) {
		clearInterval( state.safariKeepAliveTimer );
	}

	// Every 10 seconds, ping speechSynthesis to keep it alive
	state.safariKeepAliveTimer = setInterval( () => {
		if ( state.isPlaying && window.speechSynthesis.speaking ) {
			window.speechSynthesis.pause();
			window.speechSynthesis.resume();
		} else {
			clearInterval( state.safariKeepAliveTimer );
			state.safariKeepAliveTimer = null;
		}
	}, 10000 );
};
