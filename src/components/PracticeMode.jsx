import React, { useState, useCallback } from 'react'
import useStore from '../store/useStore'
import { generatePracticeQuestion } from '../services/geminiService'
import { TYPE_LABELS, TYPE_ICONS } from '../utils/questionDetector'

export default function PracticeMode() {
  const { settings, getApiConfig, practiceSession, updatePractice } = useStore()
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showHint, setShowHint] = useState(false)

  const role = settings.customRole || settings.role

  const fetchQuestion = useCallback(async () => {
    const { apiKey, provider } = getApiConfig()
    if (!apiKey) { setError('Add an API key in Settings first.'); return }
    setLoading(true)
    setError('')
    setShowHint(false)
    try {
      const q = await generatePracticeQuestion({
        role,
        topic,
        history: practiceSession.history,
        apiKey,
        provider
      })
      updatePractice({ isActive: true, currentQuestion: q, topic })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [getApiConfig, role, topic, practiceSession.history, updatePractice])

  const handleNext = () => {
    if (practiceSession.currentQuestion) {
      updatePractice({
        history: [...practiceSession.history, practiceSession.currentQuestion],
        currentQuestion: null
      })
    }
    fetchQuestion()
  }

  const handleReset = () => {
    updatePractice({ isActive: false, currentQuestion: null, history: [] })
    setTopic('')
    setError('')
    setShowHint(false)
  }

  const { currentQuestion, history } = practiceSession

  if (!practiceSession.isActive && !currentQuestion) {
    return (
      <div>
        <div className="card">
          <div className="card-title">Practice Setup</div>
          <div className="settings-section">
            <label className="settings-label">Topic (optional)</label>
            <input
              className="settings-input"
              placeholder="e.g. React hooks, System design, Behavioral"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            Role: <strong style={{ color: 'var(--text)' }}>{role}</strong>
          </div>
          {error && <div className="error-msg mb-2">{error}</div>}
          <button className="primary-btn w-full" onClick={fetchQuestion} disabled={loading}>
            {loading ? 'Generating...' : '▶ Start Practice'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {currentQuestion && (
        <div className="card">
          <div className="question-meta">
            <span>{TYPE_ICONS[currentQuestion.type]} {TYPE_LABELS[currentQuestion.type]}</span>
            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>Q{history.length + 1}</span>
          </div>
          <div className="question-bubble">{currentQuestion.question}</div>

          {showHint ? (
            <div className="tip-text">💡 {currentQuestion.hint}</div>
          ) : (
            <button className="secondary-btn" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => setShowHint(true)}>
              Show hint
            </button>
          )}

          {error && <div className="error-msg mt-2">{error}</div>}

          <div className="btn-row">
            <button className="primary-btn" onClick={handleNext} disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Loading...' : 'Next Question ›'}
            </button>
            <button className="secondary-btn" onClick={handleReset}>Reset</button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="card">
          <div className="card-title">Asked ({history.length})</div>
          <ul className="feedback-list">
            {history.map((h, i) => (
              <li key={i}>
                <span className="feedback-icon-ok">{TYPE_ICONS[h.type]}</span>
                <span style={{ fontSize: 12 }}>{h.question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
