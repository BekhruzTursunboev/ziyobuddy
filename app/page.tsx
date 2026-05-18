"use client";

import type React from "react";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Send,
  Sparkles,
  Brain,
  GraduationCap,
  Menu,
  X,
  Moon,
  Sun,
  Zap,
  Clock,
  RotateCcw,
  MessageSquare,
  Star,
  Heart,
  Flame,
  Copy,
  Volume2,
  VolumeX,
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  liked?: boolean;
  saved?: boolean;
}

interface TodoItem {
  id: number;
  text: string;
  done: boolean;
  subject: string;
  priority: "high" | "medium" | "low";
}

interface QuickTopic {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  color: string;
}

// Quick topics configuration
// (We continue with states)

export default function ZiyoBuddyPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [todoList, setTodoList] = useState<TodoItem[]>([
    {
      id: 1,
      text: "Matematika darsini o'rganish",
      done: false,
      subject: "Matematika",
      priority: "high",
    },
    {
      id: 2,
      text: "Fizika mashqlarini bajarish",
      done: false,
      subject: "Fizika",
      priority: "medium",
    },
    {
      id: 3,
      text: "Ingliz tili so'zlarini yodlash",
      done: false,
      subject: "Ingliz tili",
      priority: "low",
    },
  ]);
  const [newTodo, setNewTodo] = useState("");
  const [clock, setClock] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [xp, setXp] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [currentStreak, setCurrentStreak] = useState<number>(2);
  const [learningMode, setLearningMode] = useState<"explain" | "quiz" | "summary">("explain");
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Gamified Level-Up Sound & Logic
  useEffect(() => {
    const xpNeeded = level * 100;
    if (xp >= xpNeeded) {
      setXp((prev) => prev - xpNeeded);
      setLevel((prev) => prev + 1);
      if (typeof window !== "undefined") {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
          oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
          oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.3); // G5
          oscillator.frequency.setValueAtTime(1046.5, audioCtx.currentTime + 0.45); // C6
          gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.8);
        } catch (e) {
          console.log("Audio not supported or blocked");
        }
      }
    }
  }, [xp, level]);
  const [totalMessages, setTotalMessages] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Optimized scroll function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto-scroll when messages or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Clock with smooth updates - only on client side
  useEffect(() => {
    setMounted(true);
    const updateClock = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("uz-UZ", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Theme management
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Typing indicator effect
  useEffect(() => {
    if (isLoading) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Welcome screen visibility
  useEffect(() => {
    setShowWelcome(messages.length === 0);
  }, [messages.length]);

  // Track total messages for gamification
  useEffect(() => {
    setTotalMessages(messages.length);
  }, [messages.length]);

  // Optimized message submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        text: input,
        isUser: true,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

      // Auto-reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: input,
            history: updatedMessages.map((m) => ({
              isUser: m.isUser,
              text: m.text,
            })),
            config: {
              mode: learningMode,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("API request failed");
        }

        const data = await response.json();

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text:
            data.response ||
            data.error ||
            "Kechirasiz, hozircha javob bera olmayapman. Iltimos, keyinroq urinib ko'ring yoki savolingizni qayta yozing. 🤔",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        setXp((x) => x + 15); // Award +15 XP for a successful question!
      } catch (error) {
        console.error("Error:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Kechirasiz, hozircha javob bera olmayapman. Iltimos, keyinroq urinib ko'ring yoki savolingizni qayta yozing. 🤔",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, isLoading, messages, learningMode]
  );

  // Clear chat function
  const clearChat = useCallback(() => {
    setMessages([]);
    setShowWelcome(true);
    inputRef.current?.focus();
  }, []);

  // Like message function
  const toggleLike = useCallback((id: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, liked: !msg.liked } : msg))
    );
  }, []);

  // Save message function
  const toggleSave = useCallback((id: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, saved: !msg.saved } : msg))
    );
  }, []);

  // Text to Speech Vocalizer
  const toggleSpeech = useCallback((id: string, text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    } else {
      window.speechSynthesis.cancel();
      const cleanText = text
        .replace(/[#*`_~]/g, "")
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      const trVoice = voices.find((v) => v.lang.startsWith("tr"));
      const ruVoice = voices.find((v) => v.lang.startsWith("ru"));
      const enVoice = voices.find((v) => v.lang.startsWith("en"));
      
      if (trVoice) utterance.voice = trVoice;
      else if (ruVoice) utterance.voice = ruVoice;
      else if (enVoice) utterance.voice = enVoice;

      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);
      
      setSpeakingMessageId(id);
      window.speechSynthesis.speak(utterance);
    }
  }, [speakingMessageId]);

  // Copy to clipboard helper
  const copyToClipboard = useCallback((text: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(text);
  }, []);

  // Optimized todo operations
  const handleAddTodo = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTodo.trim()) return;
      setTodoList((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: newTodo,
          done: false,
          subject: "Umumiy",
          priority: "medium",
        },
      ]);
      setNewTodo("");
    },
    [newTodo]
  );

  const toggleTodo = useCallback((id: number) => {
    setTodoList((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      );
      const itemBefore = prev.find((item) => item.id === id);
      if (itemBefore && !itemBefore.done) {
        setXp((x) => x + 25);
      }
      return updated;
    });
  }, []);

  const deleteTodo = useCallback((id: number) => {
    setTodoList((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Memoized quick topics
  const quickTopics: QuickTopic[] = useMemo(
    () => [
      {
        icon: Brain,
        title: "Matematika",
        color: "from-blue-500 to-cyan-500",
      },
      {
        icon: BookOpen,
        title: "Fizika",
        color: "from-purple-500 to-pink-500",
      },
      {
        icon: GraduationCap,
        title: "Kimyo",
        color: "from-green-500 to-emerald-500",
      },
      {
        icon: Sparkles,
        title: "Biologiya",
        color: "from-orange-500 to-red-500",
      },
    ],
    []
  );

  // Calculate progress
  const completedTodos = todoList.filter((t) => t.done).length;
  const progressPercentage =
    todoList.length > 0
      ? Math.round((completedTodos / todoList.length) * 100)
      : 0;

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-background via-background to-muted/30 flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float [animation-delay:1s]" />
      </div>

      {/* Top Control Bar - Minimal */}
      <div className="fixed top-0 left-0 right-0 z-[1000] bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left: Theme & Clock */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="smooth-transition hover:scale-110 btn-glow focus-visible-ring"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label="Mavzuni o'zgartirish"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-primary" />
              ) : (
                <Sun className="w-4 h-4 text-primary" />
              )}
            </Button>
            {mounted && (
              <div className="hidden sm:flex items-center gap-1.5 glass rounded-md px-3 py-1 text-primary font-mono text-xs">
                <Clock className="w-3 h-3" />
                {clock}
              </div>
            )}
          </div>

          {/* Center: Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer group smooth-transition hover:scale-105"
            onClick={clearChat}
            title="Suhbatni qayta boshlash"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg smooth-transition group-hover:scale-110 group-hover:rotate-180 transition-transform duration-500">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-foreground gradient-text">
                ZiyoBuddy
              </h1>
            </div>
          </div>

          {/* Right: Burger & Stats */}
          <div className="flex items-center gap-3">
            {/* Level & XP HUD (Visible on all devices!) */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 px-2.5 py-1 rounded-xl smooth-transition hover:scale-105 select-none shadow-sm">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                {level}
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-primary/95 leading-none">Daraja</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-12 sm:w-16 bg-muted/60 h-1.5 rounded-full overflow-hidden border border-border/30">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                      style={{ width: `${(xp / (level * 100)) * 100}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-mono text-muted-foreground/90 font-semibold">{xp}/{level * 100} XP</span>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <Badge
                variant="secondary"
                className="flex items-center gap-1 px-2 py-1 text-xs"
              >
                <MessageSquare className="w-3 h-3" />
                {totalMessages}
              </Badge>
              <Badge
                variant="secondary"
                className="flex items-center gap-1 px-2 py-1 text-xs"
              >
                <Flame className="w-3 h-3" />
                {currentStreak} kun
              </Badge>
            </div>
            <Button
              variant="secondary"
              size="icon"
              className="smooth-transition hover:scale-110 btn-glow focus-visible-ring"
              onClick={() => setDrawerOpen(true)}
              aria-label="To-do ro'yxatini ochish"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[998] bg-black/50 transition-opacity animate-fade-in"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-72 max-w-full z-[999] bg-background shadow-2xl border-l border-border flex flex-col transform transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ willChange: "transform" }}
        tabIndex={-1}
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary animate-pulse" />
            O'quv To-do ro'yxati
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDrawerOpen(false)}
            aria-label="Yopish"
            className="smooth-transition hover:rotate-90 hover:scale-110 focus-visible-ring"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Section */}
        <div className="px-4 py-3 border-b border-border/50">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">O'quv progress</span>
              <span className="font-bold text-primary">
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-3 overflow-y-auto custom-scrollbar scroll-smooth" style={{ WebkitOverflowScrolling: "touch" }}>
          <ul className="space-y-2">
            {todoList.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 group smooth-transition hover:translate-x-1 hover:bg-muted/50 rounded-lg p-2 -mx-2"
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleTodo(item.id)}
                  className="accent-primary w-4 h-4 rounded border border-border transition-all cursor-pointer"
                  id={`todo-${item.id}`}
                />
                <label
                  htmlFor={`todo-${item.id}`}
                  className={`flex-1 text-sm cursor-pointer smooth-transition ${
                    item.done
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{item.text}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0"
                      >
                        {item.subject}
                      </Badge>
                      {item.priority === "high" && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] px-1 py-0"
                        >
                          Muhim
                        </Badge>
                      )}
                    </div>
                  </div>
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTodo(item.id)}
                  className="opacity-0 group-hover:opacity-100 smooth-transition hover:text-destructive hover:scale-110 focus-visible-ring"
                  aria-label="O'chirish"
                >
                  <X className="w-3 h-3" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <form
          onSubmit={handleAddTodo}
          className="flex gap-2 px-4 py-3 border-t border-border/50"
        >
          <Input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Yangi vazifa qo'shish..."
            className="flex-1 smooth-transition focus:scale-105 text-sm"
            aria-label="Yangi vazifa"
          />
          <Button
            type="submit"
            variant="default"
            className="smooth-transition hover:scale-105 button-press px-3 btn-glow focus-visible-ring"
          >
            <span className="hidden sm:inline">Qo'shish</span>
            <span className="sm:hidden">+</span>
          </Button>
        </form>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10 pt-12 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 w-full max-w-3xl mx-auto px-4 overflow-hidden">
          {showWelcome ? (
            /* Welcome Screen - Minimal */
            <div className="flex-1 flex flex-col justify-center items-center p-4 animate-fade-in-up overflow-hidden">
              <div className="w-full max-w-xl space-y-4">
                <div className="text-center space-y-2">
                  <div
                    className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mx-auto shadow-xl animate-float smooth-transition hover:scale-110 cursor-pointer interactive-hover"
                    onClick={clearChat}
                    title="Suhbatni qayta boshlash"
                  >
                    <GraduationCap className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                      Salom! 👋
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      ZiyoBuddy bilan o'rganishni boshlang. Har qanday akademik
                      savolingizga batafsil javob oling! 📚
                    </p>
                  </div>
                </div>

                {/* Quick Topics - Compact */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {quickTopics.map((topic, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer group topic-card border-2 hover:border-primary/50 overflow-hidden"
                      onClick={() => setInput(`${topic.title} haqida ma'lumot`)}
                    >
                      <CardHeader className="pb-2 p-2">
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className={`w-10 h-10 bg-gradient-to-br ${topic.color} rounded-lg flex items-center justify-center shadow-lg smooth-transition group-hover:scale-110`}
                          >
                            <topic.icon className="w-5 h-5 text-white" />
                          </div>
                          <CardTitle className="text-xs sm:text-sm text-center">
                            {topic.title}
                          </CardTitle>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>

                {/* Stats - Minimal */}
                <div className="grid grid-cols-3 gap-2">
                  <Card className="text-center smooth-transition hover:scale-105 interactive-hover">
                    <CardContent className="p-3">
                      <div className="text-lg font-bold text-foreground">
                        {currentStreak}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Kunlik seriya
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="text-center smooth-transition hover:scale-105 interactive-hover">
                    <CardContent className="p-3">
                      <div className="text-lg font-bold text-foreground">
                        {completedTodos}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Bajarilgan
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="text-center smooth-transition hover:scale-105 interactive-hover">
                    <CardContent className="p-3">
                      <div className="text-lg font-bold text-foreground">
                        {totalMessages}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Savollar
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            /* Chat Interface */
            <div className="flex-1 flex flex-col min-h-0 animate-fade-in-up overflow-hidden">
              {/* Chat Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-semibold text-foreground">
                    Suhbat
                  </h2>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1 smooth-transition hover:scale-105 text-xs"
                  >
                    <Brain className="w-3 h-3" />
                    Akademik rejim
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearChat}
                    className="smooth-transition hover:scale-110 hover:bg-destructive/10 hover:text-destructive focus-visible-ring"
                    aria-label="Suhbatni tozalash"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Tutor Rejimi Selector */}
              <div className="bg-background/40 backdrop-blur-md px-3 py-2 border-b border-border/40 flex items-center justify-between flex-shrink-0 gap-2 overflow-x-auto scrollbar-none select-none">
                <span className="text-[10px] sm:text-xs font-bold text-muted-foreground/85 whitespace-nowrap flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5 text-primary" />
                  REJIM:
                </span>
                <div className="flex bg-muted/70 p-0.5 rounded-lg items-center gap-0.5 shadow-inner">
                  <button
                    onClick={() => setLearningMode("explain")}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-md smooth-transition ${
                      learningMode === "explain"
                        ? "bg-background text-primary shadow-sm scale-102"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Tushuntirish</span>
                  </button>
                  <button
                    onClick={() => setLearningMode("quiz")}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-md smooth-transition ${
                      learningMode === "quiz"
                        ? "bg-background text-primary shadow-sm scale-102"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <GraduationCap className="w-3 h-3" />
                    <span>Kviz-Test</span>
                  </button>
                  <button
                    onClick={() => setLearningMode("summary")}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-md smooth-transition ${
                      learningMode === "summary"
                        ? "bg-background text-primary shadow-sm scale-102"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Konspekt</span>
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth" style={{ WebkitOverflowScrolling: "touch" }}>
                  <div className="p-4 space-y-3">
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.isUser ? "justify-end" : "justify-start"
                        } animate-fade-in-up group`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div
                          className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 message-bubble ${
                            message.isUser
                              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg"
                              : "bg-muted/80 backdrop-blur-sm text-muted-foreground border border-border/50"
                          }`}
                          style={{
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                            hyphens: "auto",
                          }}
                        >
                          {/* Message Actions */}
                          {!message.isUser && (
                            <div className="absolute -top-3 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 smooth-transition message-actions bg-background/95 backdrop-blur-md rounded-lg p-0.5 shadow-md border border-border/40 z-10">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(message.text)}
                                className="h-6 w-6 smooth-transition hover:scale-110 focus-visible-ring text-muted-foreground hover:text-foreground"
                                aria-label="Nusxa olish"
                                title="Nusxalash"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleSpeech(message.id, message.text)}
                                className={`h-6 w-6 smooth-transition hover:scale-110 focus-visible-ring ${
                                  speakingMessageId === message.id
                                    ? "text-primary animate-pulse"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                                aria-label={speakingMessageId === message.id ? "Durdirish" : "Ovozli o'qish"}
                                title={speakingMessageId === message.id ? "Durdirish" : "Tinglash"}
                              >
                                {speakingMessageId === message.id ? (
                                  <VolumeX className="w-3 h-3 text-destructive" />
                                ) : (
                                  <Volume2 className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleLike(message.id)}
                                className={`h-6 w-6 smooth-transition hover:scale-110 focus-visible-ring ${
                                  message.liked
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                                }`}
                                aria-label="Yoqtirish"
                              >
                                <Heart
                                  className={`w-3 h-3 ${
                                    message.liked ? "fill-current" : ""
                                  }`}
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleSave(message.id)}
                                className={`h-6 w-6 smooth-transition hover:scale-110 focus-visible-ring ${
                                  message.saved
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                }`}
                                aria-label="Saqlash"
                              >
                                <Star
                                  className={`w-3 h-3 ${
                                    message.saved ? "fill-current" : ""
                                  }`}
                                />
                              </Button>
                            </div>
                          )}

                          <div className={`text-pretty leading-relaxed text-sm prose dark:prose-invert max-w-none ${
                            message.isUser ? "text-primary-foreground animate-fade-in" : "text-foreground animate-fade-in"
                          }`}>
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-1 text-primary dark:text-primary-foreground/90">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-accent dark:text-accent-foreground/90">{children}</h3>,
                                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                                li: ({ children }) => <li className="text-sm mb-0.5">{children}</li>,
                                strong: ({ children }) => <strong className="font-semibold text-foreground/90 dark:text-white/95">{children}</strong>,
                                code: ({ className, children, ...props }: any) => {
                                  const match = /language-(\w+)/.exec(className || "");
                                  const isInline = !match;
                                  return !isInline ? (
                                    <pre className="bg-muted-foreground/10 dark:bg-black/30 text-foreground dark:text-white p-3 rounded-lg overflow-x-auto my-2 border border-border/40 dark:border-white/10 font-mono text-xs max-w-full">
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  ) : (
                                    <code className="bg-muted-foreground/15 dark:bg-black/25 px-1.5 py-0.5 rounded font-mono text-xs" {...props}>
                                      {children}
                                    </code>
                                  );
                                }
                              }}
                            >
                              {message.text}
                            </ReactMarkdown>
                          </div>
                          <div className="text-[10px] opacity-70 mt-1 flex-shrink-0 flex items-center gap-1">
                            {message.timestamp.toLocaleTimeString("uz-UZ", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {message.liked && (
                              <Heart className="w-3 h-3 text-red-500 fill-current ml-1" />
                            )}
                            {message.saved && (
                              <Star className="w-3 h-3 text-primary fill-current ml-1" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start message-enter">
                        <div className="bg-muted/80 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-border/40 flex items-center gap-2 shadow-sm">
                          <div className="flex gap-1.5 items-center">
                            <div className="w-2 h-2 bg-primary rounded-full typing-dot" />
                            <div className="w-2 h-2 bg-primary rounded-full typing-dot" />
                            <div className="w-2 h-2 bg-primary rounded-full typing-dot" />
                          </div>
                          <span className="text-xs text-muted-foreground/80 ml-1 font-medium animate-pulse">ZiyoBuddy yozmoqda...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area - Always Visible */}
        <div className="sticky bottom-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-6 pb-6 z-50 flex-shrink-0 animate-fade-in-up">
          <div className="px-4 max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative flex items-center border border-border/60 bg-background/85 backdrop-blur-md rounded-2xl shadow-xl hover:shadow-2xl hover:border-primary/30 transition-all duration-300">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (inputRef.current) {
                      inputRef.current.style.height = "auto";
                      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 160)}px`;
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Savolingizni yoki vazifangizni yozing..."
                  className="w-full py-3.5 pl-4 pr-24 text-sm bg-transparent rounded-2xl outline-none border-none resize-none scrollbar-none leading-relaxed text-foreground placeholder:text-muted-foreground/70"
                  disabled={isLoading}
                />
                <div className="absolute right-2.5 flex items-center gap-1.5">
                  {input && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground smooth-transition hover:scale-105 rounded-xl"
                      onClick={() => {
                        setInput("");
                        if (inputRef.current) inputRef.current.style.height = "auto";
                      }}
                      aria-label="Tozalash"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className="h-8 w-8 smooth-transition hover:scale-105 button-press btn-glow shadow-md bg-gradient-to-r from-primary to-accent text-white hover:from-primary/95 hover:to-accent/95 rounded-xl"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-center text-muted-foreground/50 mt-1.5">
                ZiyoBuddy AI ba'zan xato qilishi mumkin. Muhim ma'lumotlarni tekshirib oling.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
