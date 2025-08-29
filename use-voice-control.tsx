"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useLanguage } from "@/contexts/language-context"

interface VoiceControlOptions {
  onNavigate?: (route: string) => void
  onAction?: (action: string, params?: any) => void
  onFormInput?: (field: string, value: string) => void
}

export function useVoiceControl(options: VoiceControlOptions = {}) {
  const [isListening, setIsListening] = useState(false)
  const [isGlobalListening, setIsGlobalListening] = useState(false)
  const [lastCommand, setLastCommand] = useState("")
  const [voiceEnabled, setVoiceEnabled] = useState(true)

  const { speechLang, t } = useLanguage()
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Global voice commands mapping
  const voiceCommands = {
    en: {
      navigation: {
        "go to dashboard": "/dashboard",
        "go to home": "/",
        "go to login": "/",
        "show balance": "balance",
        "show transactions": "transactions",
        "send money": "send-money",
        "pay bills": "pay-bills",
      },
      actions: {
        "click login": "click-login",
        "click send": "click-send",
        "click cancel": "click-cancel",
        "submit form": "submit-form",
        "clear form": "clear-form",
        help: "help",
        "read page": "read-page",
      },
      forms: {
        "enter user id": "userId",
        "enter password": "password",
        "enter amount": "amount",
        "enter recipient": "recipient",
      },
    },
    hi: {
      navigation: {
        "डैशबोर्ड पर जाएं": "/dashboard",
        "होम पर जाएं": "/",
        "लॉगिन पर जाएं": "/",
        "बैलेंस दिखाएं": "balance",
        "लेन-देन दिखाएं": "transactions",
        "पैसे भेजें": "send-money",
        "बिल भुगतान": "pay-bills",
      },
      actions: {
        "लॉगिन क्लिक करें": "click-login",
        "भेजें क्लिक करें": "click-send",
        "रद्द करें": "click-cancel",
        "फॉर्म जमा करें": "submit-form",
        "फॉर्म साफ करें": "clear-form",
        मदद: "help",
        "पेज पढ़ें": "read-page",
      },
      forms: {
        "यूजर आईडी दर्ज करें": "userId",
        "पासवर्ड दर्ज करें": "password",
        "राशि दर्ज करें": "amount",
        "प्राप्तकर्ता दर्ज करें": "recipient",
      },
    },
    ta: {
      navigation: {
        "டாஷ்போர்டுக்கு செல்லவும்": "/dashboard",
        "முகப்புக்கு செல்லவும்": "/",
        "உள்நுழைவுக்கு செல்லவும்": "/",
        "இருப்பைக் காட்டு": "balance",
        "பரிவர்த்தனைகளைக் காட்டு": "transactions",
        "பணம் அனுப்பு": "send-money",
        "பில் செலுத்தவும்": "pay-bills",
      },
      actions: {
        "உள்நுழைவை கிளிக் செய்யவும்": "click-login",
        "அனுப்பு கிளிக் செய்யவும்": "click-send",
        "ரத்து செய்யவும்": "click-cancel",
        "படிவத்தை சமர்பிக்கவும்": "submit-form",
        "படிவத்தை அழிக்கவும்": "clear-form",
        உதவி: "help",
        "பக்கத்தைப் படிக்கவும்": "read-page",
      },
      forms: {
        "பயனர் ஐடியை உள்ளிடவும்": "userId",
        "கடவுச்சொல்லை உள்ளிடவும்": "password",
        "தொகையை உள்ளிடவும்": "amount",
        "பெறுநரை உள்ளிடவும்": "recipient",
      },
    },
  }

  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabled || !synthRef.current) return

      synthRef.current.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = speechLang
      utterance.rate = 0.9
      utterance.pitch = 1
      synthRef.current.speak(utterance)
    },
    [speechLang, voiceEnabled],
  )

  const processVoiceCommand = useCallback(
    (command: string) => {
      const currentLang = speechLang.split("-")[0] as keyof typeof voiceCommands
      const commands = voiceCommands[currentLang] || voiceCommands.en

      setLastCommand(command)

      // Check navigation commands
      for (const [phrase, route] of Object.entries(commands.navigation)) {
        if (command.includes(phrase.toLowerCase())) {
          if (route.startsWith("/")) {
            options.onNavigate?.(route)
            speak(`Navigating to ${phrase}`)
          } else {
            options.onAction?.(route)
            speak(`Showing ${phrase}`)
          }
          return
        }
      }

      // Check action commands
      for (const [phrase, action] of Object.entries(commands.actions)) {
        if (command.includes(phrase.toLowerCase())) {
          options.onAction?.(action)
          speak(`Executing ${phrase}`)
          return
        }
      }

      // Check form input commands
      for (const [phrase, field] of Object.entries(commands.forms)) {
        if (command.includes(phrase.toLowerCase())) {
          // Extract value after the command phrase
          const value = command.replace(phrase.toLowerCase(), "").trim()
          options.onFormInput?.(field, value)
          speak(`Entering ${value} in ${field}`)
          return
        }
      }

      // Default response
      speak("Command not recognized. Say 'help' for available commands.")
    },
    [speechLang, options, speak],
  )

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return

    setIsListening(true)
    recognitionRef.current.start()
  }, [isListening])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return

    recognitionRef.current.stop()
    setIsListening(false)
  }, [isListening])

  const toggleGlobalListening = useCallback(() => {
    setIsGlobalListening((prev) => !prev)
    if (!isGlobalListening) {
      speak("Global voice control activated. Say commands to navigate.")
    } else {
      speak("Global voice control deactivated.")
    }
  }, [isGlobalListening, speak])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return

    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = isGlobalListening
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = speechLang

      recognitionRef.current.onresult = (event: any) => {
        const command = event.results[0][0].transcript.toLowerCase()
        processVoiceCommand(command)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        // Restart if global listening is enabled
        if (isGlobalListening && voiceEnabled) {
          setTimeout(() => startListening(), 1000)
        }
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }
    }

    synthRef.current = window.speechSynthesis

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [speechLang, isGlobalListening, processVoiceCommand, startListening, voiceEnabled])

  // Auto-start global listening
  useEffect(() => {
    if (isGlobalListening && voiceEnabled && !isListening) {
      startListening()
    }
  }, [isGlobalListening, voiceEnabled, isListening, startListening])

  return {
    isListening,
    isGlobalListening,
    lastCommand,
    voiceEnabled,
    setVoiceEnabled,
    startListening,
    stopListening,
    toggleGlobalListening,
    speak,
    processVoiceCommand,
  }
}
