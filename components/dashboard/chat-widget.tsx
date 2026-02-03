"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, X, Send, Loader2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Message {
  id: string
  sender_id: string
  message: string
  created_at: string
  is_mine?: boolean
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && !isMinimized) {
      fetchMessages()
    }
  }, [isOpen, isMinimized])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/admin/chat")
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (err) {
      console.error("Error fetching messages:", err)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, { ...data, is_mine: true }])
        setNewMessage("")

        // Simulate auto-response after 2 seconds
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `auto-${Date.now()}`,
              sender_id: "system",
              message:
                "Gracias por tu mensaje. Un agente de Sigma se pondrá en contacto contigo pronto. Mientras tanto, ¿hay algo más en lo que pueda ayudarte?",
              created_at: new Date().toISOString(),
              is_mine: false,
            },
          ])
        }, 2000)
      }
    } catch (err) {
      console.error("Error sending message:", err)
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    )
  }

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-6 right-6 bg-primary text-primary-foreground rounded-full px-4 py-2 shadow-lg cursor-pointer z-50 flex items-center gap-2"
        onClick={() => setIsMinimized(false)}
      >
        <MessageCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Chat con Sigma</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-primary-foreground/20"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(false)
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-background border rounded-lg shadow-xl z-50 flex flex-col max-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Chat con Sigma</p>
            <p className="text-xs opacity-80">Estamos para ayudarte</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary-foreground/20"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary-foreground/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {/* Welcome message */}
          <div className="flex gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">S</AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg p-3 max-w-[80%]">
              <p className="text-sm">¡Hola! Soy el asistente de Sigma. ¿En qué puedo ayudarte hoy?</p>
            </div>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.is_mine ? "flex-row-reverse" : ""}`}>
              {!msg.is_mine && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">S</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-lg p-3 max-w-[80%] ${msg.is_mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                <p className="text-sm">{msg.message}</p>
                <p className={`text-xs mt-1 ${msg.is_mine ? "opacity-70" : "text-muted-foreground"}`}>
                  {new Date(msg.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}
          className="flex gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribí tu mensaje..."
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
