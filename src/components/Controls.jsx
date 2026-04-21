import useStore from '../store/useStore'

export default function Controls({ onToggle, onClear, onSend }) {
  const { isListening, isGenerating, transcript, interimTranscript, audioSource, setAudioSource } = useStore()

  const statusText = isListening
    ? audioSource === 'system' ? 'Listening (Speaker)...' : 'Listening...'
    : isGenerating
    ? 'Thinking...'
    : 'Ready'

  const statusClass = isListening ? 'active' : isGenerating ? 'busy' : ''

  return (
    <div className="controls">
      <button
        className={`icon-btn ${audioSource === 'system' ? 'active' : ''}`}
        title={audioSource === 'system'
          ? 'System audio — capturing your speakers (click to use mic)'
          : 'Microphone — click to switch to system audio (capture interviewer)'}
        disabled={isListening}
        onClick={() => setAudioSource(audioSource === 'mic' ? 'system' : 'mic')}
        style={{ fontSize: 16, opacity: isListening ? 0.45 : 1 }}
      >
        {audioSource === 'system' ? '🔊' : '🎙️'}
      </button>

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
