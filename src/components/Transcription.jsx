import React from 'react'
import useStore from '../store/useStore'

export default function Transcription() {
  const { transcript, interimTranscript, isListening } = useStore()
  const hasContent = transcript || interimTranscript

  return (
    <div className="card">
      <div className="card-title">Transcription</div>
      <div className="transcript-text">
        {hasContent ? (
          <>
            {transcript && <span>{transcript} </span>}
            {interimTranscript && (
              <span className="interim-text">{interimTranscript}</span>
            )}
          </>
        ) : (
          <span className="placeholder-text">
            {isListening ? 'Listening for speech...' : 'Press Listen to start capturing audio.'}
          </span>
        )}
      </div>
    </div>
  )
}
