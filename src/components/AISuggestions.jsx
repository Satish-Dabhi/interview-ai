import React from 'react'
import { TYPE_LABELS, TYPE_ICONS } from '../utils/questionDetector'

function LoadingDots() {
  return (
    <div className="loading-dots">
      <span /><span /><span />
    </div>
  )
}

function StarFormat({ star }) {
  if (!star) return null
  const entries = [
    ['S', 'Situation', star.situation],
    ['T', 'Task', star.task],
    ['A', 'Action', star.action],
    ['R', 'Result', star.result]
  ]
  return (
    <div style={{ marginTop: 10 }}>
      <div className="card-title">STAR Framework</div>
      <div className="star-grid">
        {entries.map(([letter, label, value]) => (
          <div key={letter} className="star-item">
            <div className="star-label">{letter} — {label}</div>
            <div className="star-value">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AISuggestions({ isGenerating, error, response }) {
  if (!isGenerating && !error && !response) return null

  return (
    <div className="card">
      <div className="card-title">AI Suggestions</div>

      {isGenerating && <LoadingDots />}

      {error && <div className="error-msg">⚠ {error}</div>}

      {response && !isGenerating && (
        <>
          <div
            className={`type-badge ${response.questionType || 'technical'}`}
          >
            {TYPE_ICONS[response.questionType]} {TYPE_LABELS[response.questionType] || 'Technical'}
          </div>

          {response.bullets?.length > 0 && (
            <ul className="bullets-list">
              {response.bullets.map((b, i) => (
                <li key={i}>
                  <span className="bullet-dot">›</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {response.keywords?.length > 0 && (
            <div className="keywords-section">
              <div className="keywords-label">Key terms to mention</div>
              <div className="keyword-tags">
                {response.keywords.map((k, i) => (
                  <span key={i} className="keyword-tag">{k}</span>
                ))}
              </div>
            </div>
          )}

          {response.tip && (
            <div className="tip-text">💡 {response.tip}</div>
          )}

          {response.starFormat && <StarFormat star={response.starFormat} />}
        </>
      )}
    </div>
  )
}
