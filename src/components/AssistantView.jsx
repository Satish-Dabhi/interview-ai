import React, { useCallback } from 'react'
import useStore from '../store/useStore'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
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

  const { toggleListening } = useSpeechRecognition({ onFinalTranscript: sendToAI })

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
      <Controls onToggle={toggleListening} onClear={handleClear} onSend={handleSendNow} />
      <Transcription />
      <AISuggestions isGenerating={isGenerating} error={aiError} response={aiResponse} />
    </>
  )
}
