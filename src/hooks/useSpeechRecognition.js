import { useRef, useCallback } from 'react'
import useStore from '../store/useStore'

const SEND_AFTER_MS = 1800 // send to AI after 1.8 s of silence

export function useSpeechRecognition({ onFinalTranscript }) {
  const recognitionRef = useRef(null)
  const isListeningRef = useRef(false)
  const debounceRef = useRef(null)
  const { appendTranscript, setInterimTranscript, setIsListening } = useStore()

  const stopListening = useCallback(() => {
    isListeningRef.current = false
    setIsListening(false)
    clearTimeout(debounceRef.current)
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
  }, [setIsListening])

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert('Web Speech API is not supported in this browser. Try Chrome or Edge.')
      return
    }
    if (isListeningRef.current) return

    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'

    rec.onresult = (event) => {
      let interim = ''
      let finalChunk = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) finalChunk += chunk + ' '
        else interim += chunk
      }

      if (interim) setInterimTranscript(interim)

      if (finalChunk.trim()) {
        appendTranscript(finalChunk.trim())
        setInterimTranscript('')
        // Debounce: after a pause, fire the callback with the full accumulated transcript
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
          const current = useStore.getState().transcript
          if (current.length > 8) onFinalTranscript(current)
        }, SEND_AFTER_MS)
      }
    }

    rec.onerror = (event) => {
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Enable it in browser/OS settings.')
        stopListening()
      }
      // 'no-speech' is harmless — let onend restart
    }

    // Auto-restart when recognition stops (happens ~1 min on Chrome)
    rec.onend = () => {
      if (isListeningRef.current) {
        try { rec.start() } catch {}
      }
    }

    recognitionRef.current = rec
    isListeningRef.current = true
    setIsListening(true)
    rec.start()
  }, [appendTranscript, setInterimTranscript, setIsListening, onFinalTranscript, stopListening])

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) stopListening()
    else startListening()
  }, [startListening, stopListening])

  return { startListening, stopListening, toggleListening }
}
