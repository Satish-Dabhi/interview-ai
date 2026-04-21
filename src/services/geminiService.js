// ── Audio transcription ────────────────────────────────────────────────────────

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function transcribeWithGroq(blob, apiKey) {
  const formData = new FormData()
  formData.append('file', new File([blob], 'audio.webm', { type: blob.type || 'audio/webm' }))
  formData.append('model', 'whisper-large-v3-turbo')
  formData.append('language', 'en')

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Whisper error ${res.status}`)
  }
  const data = await res.json()
  return data.text || ''
}

async function transcribeWithGemini(blob, apiKey) {
  const base64 = await blobToBase64(blob)
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: blob.type || 'audio/webm', data: base64 } },
            { text: 'Transcribe this audio. Return only the spoken words, nothing else.' }
          ]
        }]
      })
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Gemini transcription error ${res.status}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
}

export async function transcribeAudio(audioBlob, apiKey, provider = 'groq') {
  if (!apiKey) throw new Error('No API key for transcription')
  return provider === 'groq'
    ? transcribeWithGroq(audioBlob, apiKey)
    : transcribeWithGemini(audioBlob, apiKey)
}

// ── Provider configuration ─────────────────────────────────────────────────────

const PROVIDERS = {
  gemini: {
    // Free tier: 1,500 req/day with gemini-1.5-flash — set project to "free" in AI Studio
    model: 'gemini-1.5-flash',
    call: callGemini
  },
  groq: {
    // Free tier: 14,400 req/day — fastest inference available — console.groq.com
    model: 'llama-3.3-70b-versatile',
    call: callGroq
  }
}

// ── Gemini (Google AI) ─────────────────────────────────────────────────────────

async function callGemini({ apiKey, prompt, temperature = 0.7, maxTokens = 1024 }) {
  const model = 'gemini-1.5-flash' // free tier model
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json'
        }
      })
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Gemini error ${res.status}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini')
  return parseJSON(text)
}

// ── Groq (OpenAI-compatible, ultra-fast, free) ─────────────────────────────────

async function callGroq({ apiKey, prompt, temperature = 0.7, maxTokens = 1024 }) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' }
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Groq error ${res.status}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Empty response from Groq')
  return parseJSON(text)
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function parseJSON(text) {
  try {
    return JSON.parse(text)
  } catch {
    // Try to extract JSON block if model wrapped it in markdown
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) return JSON.parse(match[1])
    return { raw: text }
  }
}

function getCallFn(provider) {
  return PROVIDERS[provider]?.call || callGemini
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function generateAnswer({
  question, questionType, role, responseLength, apiKey, temperature, provider = 'gemini'
}) {
  if (!apiKey) throw new Error('No API key. Please add it in Settings.')

  const lengthGuide = {
    short: '3-4 concise bullet points, 1 sentence each.',
    medium: '4-6 bullet points with brief context.',
    detailed: '6-8 bullet points with examples or code hints where relevant.'
  }

  const starField = questionType === 'behavioral'
    ? `,"starFormat":{"situation":"brief situation template","task":"what was expected","action":"key actions to highlight","result":"outcome to emphasize"}`
    : ''

  const prompt = `You are an expert interview coach for a ${role} candidate.
The candidate was just asked: "${question}"
Detected question type: ${questionType}

Reply ONLY with valid JSON in this exact shape:
{
  "bullets": ["talking point 1", "talking point 2"],
  "keywords": ["term1", "term2"],
  "questionType": "${questionType}",
  "tip": "One delivery tip"${starField}
}

Rules:
- ${lengthGuide[responseLength] || lengthGuide.medium}
- Bullets are concise talking POINTS, not a full script.
- Keywords = must-mention technical terms or concepts.
- Tip = short coaching note on delivery or structure.
${questionType === 'behavioral' ? '- starFormat = fill in STAR framework guidance for this specific question.' : ''}
- Return ONLY the JSON object, no extra text.`

  return getCallFn(provider)({ apiKey, prompt, temperature, maxTokens: 900 })
}

export async function generatePracticeQuestion({ role, topic, history = [], apiKey, provider = 'gemini' }) {
  if (!apiKey) throw new Error('No API key. Please add it in Settings.')

  const asked = history.slice(-4).map(h => `"${h.question}"`).join(', ') || 'none'

  const prompt = `Generate ONE interview question for a ${role} candidate${topic ? ` focused on ${topic}` : ''}.
Previously asked: ${asked}. Do not repeat those.

Reply ONLY with valid JSON:
{
  "question": "the full interview question",
  "type": "technical|behavioral|system_design",
  "hint": "What a strong answer should cover (1-2 sentences)"
}`

  return getCallFn(provider)({ apiKey, prompt, temperature: 0.85, maxTokens: 256 })
}

export async function analyzeAnswer({ question, answer, role, apiKey, provider = 'gemini' }) {
  if (!apiKey) throw new Error('No API key. Please add it in Settings.')

  const prompt = `You are an interview coach. Evaluate this answer for a ${role} candidate.

Question: "${question}"
Candidate's answer: "${answer}"

Reply ONLY with valid JSON:
{
  "clarityScore": 7,
  "structureScore": 7,
  "confidenceScore": 7,
  "overallScore": 7,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "betterPhrasing": "A better opening sentence or key rephrasing",
  "missedPoints": ["important concept or point not mentioned"]
}

Score 1-10. Be honest but encouraging. overallScore = average of the three.`

  return getCallFn(provider)({ apiKey, prompt, temperature: 0.4, maxTokens: 600 })
}
