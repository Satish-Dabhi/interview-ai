import { useRef, useCallback } from 'react'
import useStore from '../store/useStore'
import { transcribeAudio } from '../services/geminiService'

const SILENCE_THRESHOLD = 0.01   // RMS below this = silence
const SILENCE_BEFORE_SEND = 1500 // ms of silence before transcribing
const DEBOUNCE_TO_AI = 2000      // ms after last transcription before firing AI

export function useSystemAudio({ onFinalTranscript }) {
  const streamRef    = useRef(null)
  const audioCtxRef  = useRef(null)
  const analyserRef  = useRef(null)
  const recorderRef  = useRef(null)
  const chunksRef    = useRef([])
  const isSpeakingRef  = useRef(false)
  const silenceTimer   = useRef(null)
  const aiDebounce     = useRef(null)
  const rafRef         = useRef(null)
  const isActiveRef    = useRef(false)
  const onTranscriptRef = useRef(onFinalTranscript)
  onTranscriptRef.current = onFinalTranscript

  const flush = useCallback(async () => {
    if (!chunksRef.current.length) return
    const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' })
    chunksRef.current = []
    if (blob.size < 1000) return  // skip noise-only blobs

    const { apiKey, provider } = useStore.getState().getApiConfig()
    if (!apiKey) return

    try {
      const text = await transcribeAudio(blob, apiKey, provider)
      if (!text?.trim()) return
      useStore.getState().appendTranscript(text.trim())
      clearTimeout(aiDebounce.current)
      aiDebounce.current = setTimeout(() => {
        const full = useStore.getState().transcript
        if (full.length > 8) onTranscriptRef.current(full)
      }, DEBOUNCE_TO_AI)
    } catch (e) {
      console.error('System audio transcription error:', e.message)
    }
  }, [])

  const monitorAudio = useCallback(() => {
    if (!isActiveRef.current) return
    if (analyserRef.current) {
      const data = new Float32Array(analyserRef.current.fftSize)
      analyserRef.current.getFloatTimeDomainData(data)
      const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length)

      if (rms > SILENCE_THRESHOLD) {
        clearTimeout(silenceTimer.current)
        if (!isSpeakingRef.current && recorderRef.current?.state === 'inactive') {
          isSpeakingRef.current = true
          chunksRef.current = []
          recorderRef.current.start()
        }
      } else if (isSpeakingRef.current) {
        isSpeakingRef.current = false
        silenceTimer.current = setTimeout(() => {
          if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
        }, SILENCE_BEFORE_SEND)
      }
    }
    rafRef.current = requestAnimationFrame(monitorAudio)
  }, [])

  const start = useCallback(async () => {
    try {
      const sourceId = await window.electronAPI?.getDesktopAudioSourceId()
      const rawStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop',
            ...(sourceId ? { chromeMediaSourceId: sourceId } : {})
          }
        },
        video: {
          mandatory: { chromeMediaSource: 'desktop', maxWidth: 1, maxHeight: 1 }
        }
      })
      rawStream.getVideoTracks().forEach(t => t.stop())
      const audioStream = new MediaStream(rawStream.getAudioTracks())
      streamRef.current = audioStream

      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const src = ctx.createMediaStreamSource(audioStream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      src.connect(analyser)
      analyserRef.current = analyser

      const rec = new MediaRecorder(audioStream)
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = flush
      recorderRef.current = rec

      isActiveRef.current = true
      useStore.getState().setIsListening(true)
      rafRef.current = requestAnimationFrame(monitorAudio)
    } catch (e) {
      alert('Could not capture system audio: ' + (e.message || 'Unknown error'))
    }
  }, [monitorAudio, flush])

  const stop = useCallback(() => {
    isActiveRef.current = false
    cancelAnimationFrame(rafRef.current)
    clearTimeout(silenceTimer.current)
    clearTimeout(aiDebounce.current)
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    audioCtxRef.current?.close().catch(() => {})
    streamRef.current  = null
    recorderRef.current = null
    audioCtxRef.current = null
    analyserRef.current = null
    isSpeakingRef.current = false
    chunksRef.current = []
    useStore.getState().setIsListening(false)
  }, [])

  const toggle = useCallback(() => {
    if (isActiveRef.current) stop()
    else start()
  }, [start, stop])

  return { start, stop, toggle }
}
