import React from 'react'
import useStore from '../store/useStore'

export default function TitleBar() {
  const { isCompact, setIsCompact, settings, updateSettings } = useStore()

  const handleCompact = () => {
    const next = !isCompact
    setIsCompact(next)
    window.electronAPI?.setCompact(next)
  }

  const handleAlwaysOnTop = () => {
    const next = !settings.alwaysOnTop
    updateSettings({ alwaysOnTop: next })
    window.electronAPI?.setAlwaysOnTop(next)
  }

  return (
    <div className="title-bar">
      <div className="drag-region">
        <span className="app-icon">🎯</span>
        <span className="app-title">Interview AI</span>
      </div>
      <div className="title-bar-actions">
        <button
          className="title-btn"
          title={settings.alwaysOnTop ? 'Always on top: ON' : 'Always on top: OFF'}
          onClick={handleAlwaysOnTop}
          style={{ color: settings.alwaysOnTop ? 'var(--primary)' : undefined }}
        >
          📌
        </button>
        <button className="title-btn" title="Toggle compact" onClick={handleCompact}>
          {isCompact ? '⬆' : '⬇'}
        </button>
        <button className="title-btn" title="Minimize" onClick={() => window.electronAPI?.minimize()}>
          —
        </button>
        <button className="title-btn close" title="Close" onClick={() => window.electronAPI?.close()}>
          ✕
        </button>
      </div>
    </div>
  )
}
