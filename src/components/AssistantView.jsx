import { useCallback, useEffect } from 'react'
import useStore from '../store/useStore'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSystemAudio } from '../hooks/useSystemAudio'
import Controls from './Controls'
import Transcription from './Transcription'
import AISuggestions from './AISuggestions'
import { generateAnswer } from '../services/geminiService'
import { detectQuestionType } from '../utils/questionDetector'

export default function AssistantView() {
  const {
    settings,
    getApiConfig,
    clearTranscript,
    aiResponse,
    isGenerating,
    aiError,
    isListening,
    audioSource,
    setAiResponse,
    setIsGenerating,
    setAiError,
    clearResponse
  } = useStore()

  const sendToAI = useCallback(
    async (text) => {
      if (!text?.trim() || isGenerating) return
      const { apiKey, provider } = getApiConfig()
      const questionType = detectQuestionType(text)
      setIsGenerating(true)
      setAiError(null)
      try {
        const result = await generateAnswer({
          question: text,
          questionType,
          role: settings.customRole || settings.role,
          responseLength: settings.responseLength,
          temperature: settings.temperature,
          apiKey,
          provider
        })
        setAiResponse({ ...result, questionType })
      } catch (e) {
        setAiError(e.message)
      }
    },
    [settings, isGenerating, getApiConfig, setIsGenerating, setAiResponse, setAiError]
  )

  const { toggleListening, stopListening } = useSpeechRecognition({ onFinalTranscript: sendToAI })
  const { toggle: toggleSystem, stop: stopSystem } = useSystemAudio({ onFinalTranscript: sendToAI })

  const handleToggle = useCallback(() => {
    if (audioSource === 'system') toggleSystem()
    else toggleListening()
  }, [audioSource, toggleSystem, toggleListening])

  // Global hotkey Ctrl+Shift+M routes to whichever source is active
  useEffect(() => {
    const eAPI = /** @type {any} */ (window).electronAPI
    eAPI?.onToggleMic(handleToggle)
    return () => {
      stopListening()
      stopSystem()
      eAPI?.removeListeners()
    }
  }, [handleToggle, stopListening, stopSystem])

  // Stop the inactive source when switching modes mid-session
  useEffect(() => {
    if (isListening) {
      if (audioSource === 'system') stopListening()
      else stopSystem()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSource])

  const handleClear = () => { clearTranscript(); clearResponse() }
  const handleSendNow = () => sendToAI(useStore.getState().transcript)

  const { apiKey } = getApiConfig()
  if (!apiKey) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔑</div>
        <div>No API key configured.</div>
        <div style={{ marginTop: 6 }}>
          Go to <strong>Settings</strong>, pick a provider, and enter your API key.
        </div>
      </div>
    )
  }

  return (
    <>
      <Controls onToggle={handleToggle} onClear={handleClear} onSend={handleSendNow} />
      <Transcription />
      <AISuggestions isGenerating={isGenerating} error={aiError} response={aiResponse} />
    </>
  )
}
