import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { audioPlayer } from '../../services/audioPlayer';

export interface GeminiAudioBridgeHandle {
  play: (audioUrl: string, rate?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setRate: (rate: number) => void;
  startListening?: () => void;
  stopListening?: () => void;
}

interface GeminiAudioPlayerProps {
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: any) => void;
  onSpeechRecognized?: (text: string, isFinal: boolean) => void;
  onSpeechError?: (error: string) => void;
  onSpeechEnd?: () => void;
}

const HTML_CONTENT = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="background:transparent;margin:0;padding:0;">
  <audio id="player" playsinline preload="auto"></audio>
  <script>
    const player = document.getElementById('player');
    let isPausedLocally = false;

    player.addEventListener('play', () => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'onStart' }));
    });

    player.addEventListener('pause', () => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'onPause' }));
    });

    player.addEventListener('ended', () => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'onDone' }));
    });

    player.addEventListener('error', (e) => {
      const err = player.error ? (player.error.message || 'Media playback error code: ' + player.error.code) : 'Audio error';
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'onError', error: err }));
    });

    window.playAudio = function(src, rate) {
      try {
        isPausedLocally = false;
        player.pause();
        player.currentTime = 0;
        player.src = src;
        player.playbackRate = Number(rate) || 1.0;
        const playPromise = player.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'onError', error: err.message }));
          });
        }
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'onError', error: e.message }));
      }
    };

    window.pauseAudio = function() {
      try {
        isPausedLocally = true;
        player.pause();
      } catch (e) {}
    };

    window.resumeAudio = function() {
      try {
        isPausedLocally = false;
        const playPromise = player.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'onError', error: err.message }));
          });
        }
      } catch (e) {}
    };

    window.stopAudio = function() {
      try {
        isPausedLocally = false;
        player.pause();
        player.currentTime = 0;
      } catch (e) {}
    };

    window.setRate = function(rate) {
      try { player.playbackRate = Number(rate) || 1.0; } catch (e) {}
    };

    // Speech Recognition Support
    let recognition = null;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = function(event) {
          let transcript = '';
          let isFinal = false;
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
            if (event.results[i].isFinal) isFinal = true;
          }
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'onSpeechRecognized',
            text: transcript,
            isFinal: isFinal
          }));
        };

        recognition.onerror = function(event) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'onSpeechError',
            error: event.error || 'Speech error'
          }));
        };

        recognition.onend = function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'onSpeechEnd'
          }));
        };
      } catch(e) {}
    }

    window.startListening = function() {
      if (recognition) {
        try {
          recognition.start();
        } catch(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'onSpeechError', error: e.message }));
        }
      } else {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'onSpeechUnavailable' }));
      }
    };

    window.stopListening = function() {
      if (recognition) {
        try { recognition.stop(); } catch(e) {}
      }
    };
  </script>
</body>
</html>
`;

export const GeminiAudioPlayer = forwardRef<GeminiAudioBridgeHandle, GeminiAudioPlayerProps>(
  ({ onStart, onDone, onError, onSpeechRecognized, onSpeechError, onSpeechEnd }, ref) => {
    const webViewRef = useRef<any>(null);

    const bridge: GeminiAudioBridgeHandle = {
      play: (audioUrl: string, rate = 1.0) => {
        if (!webViewRef.current) return;
        const escapedUrl = JSON.stringify(audioUrl);
        const script = `window.playAudio && window.playAudio(${escapedUrl}, ${rate}); true;`;
        webViewRef.current.injectJavaScript(script);
      },
      pause: () => {
        webViewRef.current?.injectJavaScript(`window.pauseAudio && window.pauseAudio(); true;`);
      },
      resume: () => {
        webViewRef.current?.injectJavaScript(`window.resumeAudio && window.resumeAudio(); true;`);
      },
      stop: () => {
        webViewRef.current?.injectJavaScript(`window.stopAudio && window.stopAudio(); true;`);
      },
      setRate: (rate: number) => {
        webViewRef.current?.injectJavaScript(`window.setRate && window.setRate(${rate}); true;`);
      },
      startListening: () => {
        webViewRef.current?.injectJavaScript(`window.startListening && window.startListening(); true;`);
      },
      stopListening: () => {
        webViewRef.current?.injectJavaScript(`window.stopListening && window.stopListening(); true;`);
      },
    };

    useImperativeHandle(ref, () => bridge);

    useEffect(() => {
      audioPlayer.registerBridge(bridge);
      return () => {
        audioPlayer.unregisterBridge();
      };
    }, []);

    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'onStart') {
          onStart?.();
          audioPlayer.notifyBridgeStart();
        } else if (data.type === 'onDone') {
          onDone?.();
          audioPlayer.notifyBridgeDone();
        } else if (data.type === 'onError') {
          console.warn('Gemini Audio Player bridge error:', data.error);
          onError?.(data.error);
          audioPlayer.notifyBridgeError(data.error);
        } else if (data.type === 'onSpeechRecognized') {
          onSpeechRecognized?.(data.text, data.isFinal);
        } else if (data.type === 'onSpeechError') {
          onSpeechError?.(data.error);
        } else if (data.type === 'onSpeechEnd') {
          onSpeechEnd?.();
        } else if (data.type === 'onSpeechUnavailable') {
          onSpeechError?.('Speech recognition not supported in this environment');
        }
      } catch (e) {
        // Message parsing error
      }
    };

    return (
      <View style={styles.hiddenContainer} pointerEvents="none">
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: HTML_CONTENT }}
          onMessage={handleMessage}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          style={styles.webView}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  hiddenContainer: {
    width: 0,
    height: 0,
    opacity: 0,
    position: 'absolute',
    left: -1000,
    top: -1000,
    overflow: 'hidden',
  },
  webView: {
    width: 1,
    height: 1,
  },
});
