const BEHAVIORAL = [
  /tell me about a time/i,
  /give me an example/i,
  /describe a situation/i,
  /how did you handle/i,
  /what did you do when/i,
  /have you ever/i,
  /share an experience/i,
  /walk me through a time/i,
  /can you recall/i,
  /how have you dealt/i
]

const SYSTEM_DESIGN = [
  /design a(n)? (system|service|platform|app|application)/i,
  /how would you (architect|design|build|scale)/i,
  /system design/i,
  /scalab(le|ility)/i,
  /microservice/i,
  /distributed/i,
  /high.?level architecture/i,
  /components of/i
]

export function detectQuestionType(text) {
  if (!text || text.length < 5) return 'technical'
  for (const p of BEHAVIORAL) if (p.test(text)) return 'behavioral'
  for (const p of SYSTEM_DESIGN) if (p.test(text)) return 'system_design'
  return 'technical'
}

export const TYPE_LABELS = {
  technical: 'Technical',
  behavioral: 'Behavioral (STAR)',
  system_design: 'System Design'
}

export const TYPE_ICONS = {
  technical: '⚙️',
  behavioral: '🌟',
  system_design: '🏗️'
}
