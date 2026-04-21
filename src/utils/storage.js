const KEY = 'interview_ai_settings'

export function getSettings() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Could not save settings:', e)
  }
}
