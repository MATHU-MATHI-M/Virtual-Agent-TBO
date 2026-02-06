import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

interface VoiceAssistantProps {
  conversationId?: string;
  onMessage?: (message: string) => void;
}

export function VoiceAssistant({ conversationId, onMessage }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const sendMessage = useMutation(api.copilot.sendMessage);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;

    if (SpeechRecognition && speechSynthesis) {
      setIsSupported(true);
      synthRef.current = speechSynthesis;

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        toast.info("Listening... Speak now!");
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);

        if (finalTranscript) {
          handleVoiceMessage(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error("Voice recognition error. Please try again.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      toast.error("Voice features not supported in this browser");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleVoiceMessage = async (message: string) => {
    try {
      setTranscript("");
      onMessage?.(message);

      await sendMessage({
        message,
        conversationId: conversationId as any,
        isVoice: true,
      });

      toast.success("Voice message sent!");
    } catch (error) {
      toast.error("Failed to send voice message");
    }
  };

  const startListening = () => {
    if (!isSupported) {
      toast.error("Voice recognition is not supported in this browser.");
      return;
    }
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const speakText = (text: string) => {
    if (!isSupported) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }
    if (synthRef.current && !isSpeaking) {
      // Cancel any ongoing speech
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        toast.error("Speech synthesis error");
      };

      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };



  return (
    <div className="flex items-center gap-2">
      {/* Voice Input */}
      <div className="relative">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`p-2 rounded-full transition-all duration-200 ${isListening
            ? "bg-red-500 text-white animate-pulse"
            : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          title={isListening ? "Stop listening" : "Start voice input"}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {transcript && (
          <div className="absolute bottom-full mb-2 left-0 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {transcript}
          </div>
        )}
      </div>

      {/* Voice Output */}
      <button
        onClick={isSpeaking ? stopSpeaking : () => speakText("Hello! I'm your travel assistant. How can I help you today?")}
        className={`p-2 rounded-full transition-all duration-200 ${isSpeaking
          ? "bg-green-500 text-white animate-pulse"
          : "bg-gray-500 text-white hover:bg-gray-600"
          }`}
        title={isSpeaking ? "Stop speaking" : "Test voice output"}
      >
        {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
