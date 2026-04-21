import React, { useState } from 'react'
import useStore from '../store/useStore'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { analyzeAnswer } from '../services/geminiService'

function ScoreBar({ value }) {
  const color = value >= 8 ? 'var(--success)' : value >= 6 ? 'var(--warning)' : 'var(--danger)'
  return (
    <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 2, marginTop: 4 }}>
      <div style={{ width: `${value * 10}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s' }} />
    </div>
  )
}

export default function CoachingMode() {
  const {
    settings, getApiConfig,
    coachingQuestion, setCoachingQuestion,
    coachingAnswer, setCoachingAnswer,
    coachingFeedback, setCoachingFeedback,
    isAnalyzing, setIsAnalyzing,
    isListening
  } = useStore()

  const [error, setError] = useState('')
  const role = settings.customRole || settings.role

  const { toggleListening } = useSpeechRecognition({
    onFinalTranscript: (text) => setCoachingAnswer(text)
  })

  const handleAnalyze = async () => {
    if (!coachingQuestion.trim() || !coachingAnswer.trim()) {
      setError('Please fill in both the question and your answer.')
      return
    }
    const { apiKey, provider } = getApiConfig()
    if (!apiKey) { setError('Add an API key in Settings first.'); return }
    setIsAnalyzing(true)
    setError('')
    setCoachingFeedback(null)
    try {
      const feedback = await analyzeAnswer({ question: coachingQuestion, answer: coachingAnswer, role, apiKey, provider })
      setCoachingFeedback(feedback)
    } catch (e) {
      setError(e.message)
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    setCoachingQuestion('')
    setCoachingAnswer('')
    setCoachingFeedback(null)
    setError('')
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">Interview Question</div>
        <textarea
          className="textarea"
          placeholder="Paste or type the interview question..."
          value={coachingQuestion}
          onChange={(e) => setCoachingQuestion(e.target.value)}
          rows={3}
        />
      </div>

      <div className="card">
        <div className="card-title">Your Answer</div>
        <textarea
          className="textarea mb-2"
          placeholder="Type your answer or use the mic to record..."
          value={coachingAnswer}
          onChange={(e) => setCoachingAnswer(e.target.value)}
          rows={4}
        />
        <button
          className={`mic-btn ${isListening ? 'listening' : ''}`}
          style={{ fontSize: 12, padding: '6px 12px' }}
          onClick={toggleListening}
        >
          {isListening ? '⏹ Stop recording' : '🎤 Record answer'}
        </button>
      </div>

      {error && <div className="error-msg mb-2">{error}</div>}

      <div className="btn-row">
        <button className="primary-btn" style={{ flex: 1 }} onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? 'Analyzing...' : '🔍 Get Coaching'}
        </button>
        {coachingFeedback && <button className="secondary-btn" onClick={handleReset}>Reset</button>}
      </div>

      {coachingFeedback && (
        <>
          <div className="card" style={{ marginTop: 10 }}>
            <div className="card-title">Scores</div>
            <div className="score-grid">
              {[
                { label: 'Clarity',    key: 'clarityScore'    },
                { label: 'Structure',  key: 'structureScore'  },
                { label: 'Confidence', key: 'confidenceScore' }
              ].map(({ label, key }) => (
                <div key={key} className="score-card">
                  <div className="score-value">{coachingFeedback[key]}</div>
                  <div className="score-label">{label}</div>
                  <ScoreBar value={coachingFeedback[key]} />
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              Overall: <strong style={{ color: 'var(--primary)', fontSize: 14 }}>{coachingFeedback.overallScore}/10</strong>
            </div>
          </div>

          {coachingFeedback.strengths?.length > 0 && (
            <div className="card">
              <div className="card-title">Strengths</div>
              <ul className="feedback-list">
                {coachingFeedback.strengths.map((s, i) => (
                  <li key={i}><span className="feedback-icon-ok">✓</span>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {coachingFeedback.improvements?.length > 0 && (
            <div className="card">
              <div className="card-title">Improvements</div>
              <ul className="feedback-list">
                {coachingFeedback.improvements.map((s, i) => (
                  <li key={i}><span className="feedback-icon-warn">△</span>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {coachingFeedback.betterPhrasing && (
            <div className="card">
              <div className="card-title">Better Phrasing</div>
              <div className="tip-text">{coachingFeedback.betterPhrasing}</div>
            </div>
          )}

          {coachingFeedback.missedPoints?.length > 0 && (
            <div className="card">
              <div className="card-title">Missed Points</div>
              <ul className="feedback-list">
                {coachingFeedback.missedPoints.map((p, i) => (
                  <li key={i}><span className="feedback-icon-warn">◦</span>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
