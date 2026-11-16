import type { Hotel } from '../../types'
import type { AssistantAction } from './assistantBrain'

export interface ChatEntry {
  id: string
  role: 'user' | 'assistant'
  text: string
  hotels?: Hotel[]
  actions?: AssistantAction[]
}
