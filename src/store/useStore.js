import { create } from 'zustand'
import { getSettings, saveSettings } from '../utils/storage'

const defaultSettings = {
  provider: 'gemini',   // 'gemini' | 'groq'
  geminiApiKey: '',
  groqApiKey: '',
  responseLength: 'medium', // 'short' | 'medium' | 'detailed'
  role: 'React Developer',
  customRole: '',
  temperature: 0.7,
  alwaysOnTop: true
}

const useStore = create((set, get) => ({
  // ── Settings ──────────────────────────────────────
  settings: { ...defaultSettings, ...getSettings() },
  updateSettings: (updates) => {
    const next = { ...get().settings, ...updates }
    set({ settings: next })
    saveSettings(next)
  },
  // Single source of truth — call this anywhere instead of repeating the ternary
  getApiConfig: () => {
    const s = get().settings
    const apiKey =
      s.provider === 'groq'
        ? s.groqApiKey
        : s.geminiApiKey || import.meta.env?.VITE_GEMINI_API_KEY || ''
    return { apiKey, provider: s.provider }
  },

  // ── Navigation mode ───────────────────────────────
  mode: 'assistant', // 'assistant' | 'practice' | 'coaching' | 'settings'
  setMode: (mode) => set({ mode }),

  // ── Compact (titlebar toggle) ─────────────────────
  isCompact: false,
  setIsCompact: (val) => set({ isCompact: val }),

  // ── Audio source ──────────────────────────────────
  audioSource: 'mic', // 'mic' | 'system'
  setAudioSource: (src) => set({ audioSource: src }),

  // ── Microphone / listening ─────────────────────────
  isListening: false,
  setIsListening: (val) => set({ isListening: val }),

  // ── Transcription ──────────────────────────────────
  transcript: '',
  interimTranscript: '',
  setTranscript: (transcript) => set({ transcript }),
  appendTranscript: (text) =>
    set((s) => ({ transcript: s.transcript ? `${s.transcript} ${text}` : text })),
  setInterimTranscript: (t) => set({ interimTranscript: t }),
  clearTranscript: () => set({ transcript: '', interimTranscript: '' }),

  // ── AI Response ────────────────────────────────────
  aiResponse: null,      // { bullets, keywords, questionType, tip, starFormat? }
  isGenerating: false,
  aiError: null,
  setAiResponse: (r) => set({ aiResponse: r, aiError: null }),
  setIsGenerating: (v) => set({ isGenerating: v }),
  setAiError: (e) => set({ aiError: e, isGenerating: false }),
  clearResponse: () => set({ aiResponse: null, aiError: null }),

  // ── Practice session ───────────────────────────────
  practiceSession: {
    isActive: false,
    currentQuestion: null,  // { question, type, hint }
    history: [],            // [{ question, type }]
    topic: ''
  },
  updatePractice: (updates) =>
    set((s) => ({ practiceSession: { ...s.practiceSession, ...updates } })),

  // ── Coaching ───────────────────────────────────────
  coachingQuestion: '',
  coachingAnswer: '',
  coachingFeedback: null,
  isAnalyzing: false,
  setCoachingQuestion: (v) => set({ coachingQuestion: v }),
  setCoachingAnswer: (v) => set({ coachingAnswer: v }),
  setCoachingFeedback: (f) => set({ coachingFeedback: f, isAnalyzing: false }),
  setIsAnalyzing: (v) => set({ isAnalyzing: v })
}))

export default useStore
