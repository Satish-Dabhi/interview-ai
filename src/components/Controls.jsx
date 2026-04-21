import React from 'react'
import useStore from '../store/useStore'

export default function Controls({ onToggle, onClear, onSend }) {
  const { isListening, isGenerating, transcript, interimTranscript } = useStore()

  const statusText = isListening
    ? 'Listening...'
    : isGenerating
    ? 'Thinking...'
    : 'Ready'

  const statusClass = isListening ? 'active' : isGenerating ? 'busy' : ''

  return (
    <div className="controls">
      <button className={`mic-btn ${isListening ? 'listening' : ''}`} onClick={onToggle}>
        {isListening ? '⏹ Stop' : '🎤 Listen'}
      </button>

      {(transcript || interimTranscript) && (
        <>
          <button className="icon-btn" title="Send now" onClick={onSend} disabled={isGenerating}>
            ↑
          </button>
          <button className="icon-btn" title="Clear" onClick={onClear}>
            ✕
          </button>
        </>
      )}

      <span className={`status-pill ${statusClass}`}>{statusText}</span>
    </div>
  )
}
