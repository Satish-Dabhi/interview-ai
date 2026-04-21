import React, { useState } from 'react'
import useStore from '../store/useStore'

const PRESET_ROLES = [
  'React Developer',
  'Liferay Developer',
  'Frontend Developer',
  'Full Stack Developer',
  'Node.js Developer',
  'Java Developer',
  'System Design (Senior)',
  'Custom'
]

const PROVIDERS = [
  {
    id: 'gemini',
    label: 'Gemini',
    sublabel: 'Google AI',
    keyField: 'geminiApiKey',
    placeholder: 'AIzaSy...',
    freeInfo: '1,500 req/day free',
    docsUrl: 'aistudio.google.com'
  },
  {
    id: 'groq',
    label: 'Groq',
    sublabel: 'Fastest (Llama 3)',
    keyField: 'groqApiKey',
    placeholder: 'gsk_...',
    freeInfo: '14,400 req/day free',
    docsUrl: 'console.groq.com'
  }
]

function ProviderCard({ provider, isActive, apiKey, onSelect, onKeyChange }) {
  const [show, setShow] = useState(false)

  return (
    <div
      style={{
        border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '10px 12px',
        marginBottom: 8,
        background: isActive ? 'rgba(91,142,255,0.06)' : 'var(--surface2)',
        cursor: 'pointer'
      }}
      onClick={onSelect}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div
          style={{
            width: 14, height: 14, borderRadius: '50%',
            border: `2px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
            background: isActive ? 'var(--primary)' : 'transparent',
            flexShrink: 0
          }}
        />
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{provider.label}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>{provider.sublabel}</span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 600 }}>
          {provider.freeInfo}
        </span>
        {isActive && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'white',
            background: 'var(--primary)', padding: '1px 6px', borderRadius: 10
          }}>
            ACTIVE
          </span>
        )}
      </div>

      {/* API key input — stop click from selecting provider again */}
      <div className="input-row" onClick={(e) => e.stopPropagation()}>
        <input
          className="settings-input"
          type={show ? 'text' : 'password'}
          placeholder={provider.placeholder}
          value={apiKey}
          onChange={(e) => onKeyChange(provider.keyField, e.target.value)}
          style={{ fontSize: 12 }}
        />
        <button className="icon-btn" onClick={() => setShow(!show)} title={show ? 'Hide' : 'Show'}>
          {show ? '🙈' : '👁'}
        </button>
      </div>

      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5 }}>
        Get key at <span style={{ color: 'var(--primary)' }}>{provider.docsUrl}</span>
        {!apiKey && isActive && (
          <span style={{ color: 'var(--warning)', marginLeft: 6 }}>⚠ Key missing</span>
        )}
        {apiKey && (
          <span style={{ color: 'var(--success)', marginLeft: 6 }}>✓ Key saved</span>
        )}
      </div>
    </div>
  )
}

export default function Settings() {
  const { settings, updateSettings } = useStore()
  const [saved, setSaved] = useState(false)

  const update = (key, val) => updateSettings({ [key]: val })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      {/* ── AI Provider & Keys ─────────────────────── */}
      <div className="card">
        <div className="card-title">AI Provider</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
          Click a provider to make it active. All features use the active provider.
        </div>
        {PROVIDERS.map((p) => (
          <ProviderCard
            key={p.id}
            provider={p}
            isActive={settings.provider === p.id}
            apiKey={settings[p.keyField] || ''}
            onSelect={() => update('provider', p.id)}
            onKeyChange={update}
          />
        ))}
      </div>

      {/* ── Role ──────────────────────────────────── */}
      <div className="card">
        <div className="card-title">Interview Role</div>
        <div className="settings-section">
          <label className="settings-label">Preset role</label>
          <select
            className="settings-select"
            value={PRESET_ROLES.includes(settings.role) ? settings.role : 'Custom'}
            onChange={(e) => update('role', e.target.value)}
          >
            {PRESET_ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        {(settings.role === 'Custom' || !PRESET_ROLES.includes(settings.role)) && (
          <div className="settings-section" style={{ marginBottom: 0 }}>
            <label className="settings-label">Custom role</label>
            <input
              className="settings-input"
              placeholder="e.g. DevOps Engineer"
              value={settings.customRole}
              onChange={(e) => update('customRole', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* ── Response Settings ──────────────────────── */}
      <div className="card">
        <div className="card-title">Response Settings</div>
        <div className="settings-section">
          <label className="settings-label">Response length</label>
          <div className="toggle-group">
            {['short', 'medium', 'detailed'].map((v) => (
              <button
                key={v}
                className={`toggle-btn ${settings.responseLength === v ? 'active' : ''}`}
                onClick={() => update('responseLength', v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-section" style={{ marginBottom: 0 }}>
          <label className="settings-label">
            Creativity / Temperature — {settings.temperature.toFixed(1)}
          </label>
          <input
            type="range"
            className="range-slider"
            min="0" max="1" step="0.1"
            value={settings.temperature}
            onChange={(e) => update('temperature', parseFloat(e.target.value))}
          />
          <div className="range-labels">
            <span>Focused</span><span>Balanced</span><span>Creative</span>
          </div>
        </div>
      </div>

      {/* ── Hotkeys ───────────────────────────────── */}
      <div className="card">
        <div className="card-title">Hotkeys</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.9 }}>
          <div>
            <kbd style={{ background: 'var(--surface2)', padding: '1px 5px', borderRadius: 3 }}>Ctrl+Shift+M</kbd>
            {' '} Toggle microphone
          </div>
          <div>
            <kbd style={{ background: 'var(--surface2)', padding: '1px 5px', borderRadius: 3 }}>Ctrl+Shift+H</kbd>
            {' '} Hide / show window
          </div>
        </div>
      </div>

      <button className="save-btn" onClick={handleSave}>
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}
