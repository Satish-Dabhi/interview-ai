import React from 'react'
import useStore from './store/useStore'
import TitleBar from './components/TitleBar'
import AssistantView from './components/AssistantView'
import PracticeMode from './components/PracticeMode'
import CoachingMode from './components/CoachingMode'
import Settings from './components/Settings'

const TABS = [
  { id: 'assistant', label: 'Assistant' },
  { id: 'practice',  label: 'Practice'  },
  { id: 'coaching',  label: 'Coaching'  },
  { id: 'settings',  label: 'Settings'  }
]

export default function App() {
  const { mode, setMode, isCompact } = useStore()

  return (
    <div className="app">
      <TitleBar />

      {!isCompact && (
        <>
          <nav className="tab-nav">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab-btn ${mode === t.id ? 'active' : ''}`}
                onClick={() => setMode(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="content">
            {mode === 'assistant' && <AssistantView />}
            {mode === 'practice'  && <PracticeMode />}
            {mode === 'coaching'  && <CoachingMode />}
            {mode === 'settings'  && <Settings />}
          </div>
        </>
      )}

      {isCompact && (
        <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
          Compact mode — click ⬆ to expand
        </div>
      )}
    </div>
  )
}
