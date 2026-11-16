import { Send, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useBooking } from '../../context/useBooking'
import { cn } from '../../utils/cn'
import {
  getAssistantReply,
  getWelcomeReply,
  type AssistantContext,
} from './assistantBrain'
import { ChatMessage } from './ChatMessage'
import type { ChatEntry } from './chatTypes'
import { QuickReplies } from './QuickReplies'
import { RobotFace } from './RobotFace'

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5" role="status" aria-label="Assistant is typing">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-[#79d8cf] shadow-sm">
        <RobotFace className="size-6" talking />
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-canvas px-3.5 py-3">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="assistant-typing-dot size-1.5 rounded-full bg-muted"
            style={{ animationDelay: `${index * 140}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export function AssistantChat() {
  const { pathname } = useLocation()
  const isHotelDetailsPage = /^\/hotels\/[^/]+$/.test(pathname)
  const { search, selectedHotel, selectedRoom, confirmation } = useBooking()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatEntry[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [quickReplies, setQuickReplies] = useState<string[]>([])
  const startedRef = useRef(false)
  const replyTimerRef = useRef<number | null>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const context = useMemo<AssistantContext>(
    () => ({ search, selectedHotel, selectedRoom, confirmation }),
    [search, selectedHotel, selectedRoom, confirmation],
  )

  useEffect(() => {
    if (!open || startedRef.current) return
    startedRef.current = true
    const welcome = getWelcomeReply(context)
    setMessages([{ id: createId(), role: 'assistant', text: welcome.text }])
    setQuickReplies(welcome.quickReplies ?? [])
  }, [open, context])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 180)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  useEffect(() => {
    return () => {
      if (replyTimerRef.current) window.clearTimeout(replyTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const node = messagesRef.current
    if (!node) return
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
  }, [messages, typing, open])

  const send = (raw: string) => {
    const value = raw.trim()
    if (!value || typing) return

    const reply = getAssistantReply(value, context)
    setMessages((current) => [
      ...current,
      { id: createId(), role: 'user', text: value },
    ])
    setInput('')
    setQuickReplies([])
    setTyping(true)

    const delay = 520 + Math.min(value.length * 10, 520)
    replyTimerRef.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          text: reply.text,
          hotels: reply.hotels,
          actions: reply.actions,
        },
      ])
      setQuickReplies(reply.quickReplies ?? [])
      setTyping(false)
    }, delay)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open the Aurelia assistant"
        aria-expanded={open}
        aria-controls="assistant-panel"
        className={cn(
          'no-print fixed right-4 z-[80] flex items-center rounded-full bg-brand p-1.5 text-white shadow-[0_18px_40px_-16px_rgba(14,43,59,0.7)] transition-all duration-300 hover:bg-[#0a2331] hover:shadow-[0_22px_50px_-18px_rgba(14,43,59,0.8)] sm:right-6',
          isHotelDetailsPage
            ? 'bottom-[5.75rem] sm:bottom-[5.75rem] lg:bottom-6'
            : 'bottom-5 sm:bottom-6',
          open && 'pointer-events-none translate-y-3 opacity-0',
        )}
      >
        <span className="assistant-float relative flex size-14 items-center justify-center rounded-full bg-white/10 text-[#79d8cf] ring-1 ring-white/10">
          <RobotFace className="size-10" />
          <span className="absolute right-0.5 top-0.5 size-3 rounded-full border-2 border-brand bg-[#34d399]" />
        </span>
        <span className="hidden sm:block" aria-hidden="true" />
      </button>

      {open ? (
        <div
          id="assistant-panel"
          role="dialog"
          aria-label="Aurelia assistant"
          className="no-print assistant-panel-in fixed inset-x-3 bottom-3 z-[85] flex h-[min(36rem,calc(100dvh-5.5rem))] flex-col overflow-hidden rounded-[1.6rem] border border-line bg-white shadow-[0_30px_80px_-30px_rgba(14,43,59,0.6)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[34rem] sm:w-[25rem]"
        >
          <div className="flex items-center gap-3 bg-brand px-4 py-3.5 text-white">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#79d8cf] ring-1 ring-white/15">
              <RobotFace className="size-7" talking={typing} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Aurelia Assistant</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[0.65rem] text-white/65">
                <span className="size-1.5 rounded-full bg-[#34d399]" aria-hidden="true" />
                Online · replies instantly
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Close assistant"
            >
              <X className="size-4.5" aria-hidden="true" />
            </button>
          </div>

          <div
            ref={messagesRef}
            role="log"
            aria-live="polite"
            aria-label="Conversation"
            className="flex-1 space-y-4 overflow-y-auto bg-white px-4 py-4"
          >
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onNavigate={() => setOpen(false)}
              />
            ))}
            {typing ? <TypingIndicator /> : null}
          </div>

          {!typing && quickReplies.length > 0 ? (
            <QuickReplies options={quickReplies} onSelect={send} />
          ) : null}

          <form
            onSubmit={(event) => {
              event.preventDefault()
              send(input)
            }}
            className="border-t border-line bg-white p-3"
          >
            <div className="flex items-center gap-2">
              <label htmlFor="assistant-message" className="sr-only">
                Ask the assistant
              </label>
              <input
                ref={inputRef}
                id="assistant-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about hotels, bookings…"
                autoComplete="off"
                className="h-11 min-w-0 flex-1 rounded-full border border-line bg-canvas px-4 text-sm text-ink placeholder:text-muted/70 focus:border-accent focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="size-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2 text-center text-[0.6rem] text-muted">
              Answers use Aurelia&apos;s demo data · Concierge +1 (800) 555-0182
            </p>
          </form>
        </div>
      ) : null}
    </>
  )
}
