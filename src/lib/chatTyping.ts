// Best-effort, in-memory "is typing" signal for the popup chat. Keyed by
// client + role; a ping is considered active for 5s. Lives in the server
// process (fine for a single self-hosted instance; not shared across replicas).
const typing = new Map<string, number>()

export function setTyping(clientId: string, role: 'admin' | 'client') {
  typing.set(`${clientId}:${role}`, Date.now())
}

export function isTyping(clientId: string, role: 'admin' | 'client'): boolean {
  const t = typing.get(`${clientId}:${role}`)
  return !!t && Date.now() - t < 5000
}
