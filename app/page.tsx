"use client";

import type React from "react";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [currentStreak] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Optimized scroll function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: input }),
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
    [input, isLoading]
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
    setTodoList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
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
    <div className="h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col relative overflow-hidden">
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
          <div className="flex items-center gap-2">
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
        className={`fixed top-0 right-0 h-full w-full sm:w-72 max-w-full z-[999] bg-background shadow-2xl border-l border-border transform transition-transform duration-300 ease-in-out ${
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

        <ScrollArea className="flex-1 px-4 py-3 custom-scrollbar">
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
        </ScrollArea>
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

              {/* Messages Area */}
              <div className="flex-1 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col min-h-0">
                <ScrollArea className="flex-1 custom-scrollbar">
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
                            <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 smooth-transition message-actions">
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

                          <div className="max-h-56 sm:max-h-72 overflow-y-auto overflow-x-hidden custom-scrollbar">
                            <div
                              className="text-pretty leading-relaxed text-sm"
                              style={{
                                wordBreak: "break-word",
                                overflowWrap: "anywhere",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {message.text}
                            </div>
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
                    {isLoading && isTyping && (
                      <div className="flex justify-start animate-fade-in-up">
                        <div className="bg-muted/80 backdrop-blur-sm rounded-2xl px-3 py-2 border border-border/50">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-accent rounded-full typing-dot" />
                            <div className="w-2 h-2 bg-accent rounded-full typing-dot" />
                            <div className="w-2 h-2 bg-accent rounded-full typing-dot" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

        {/* Input Area - Always Visible */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border/50 z-50 animate-fade-in-up flex-shrink-0">
          <div className="px-4 py-2 max-w-3xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Savolingizni yozing..."
                    className="w-full h-9 text-sm bg-background border-2 input-enhanced focus-visible-ring pr-10"
                    disabled={isLoading}
                  />
                  {input && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 smooth-transition hover:scale-110 focus-visible-ring"
                      onClick={() => setInput("")}
                      aria-label="Tozalash"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <Button
                  type="submit"
                  size="default"
                  disabled={!input.trim() || isLoading}
                  className="px-3 smooth-transition hover:scale-105 button-press btn-glow shadow-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 focus-visible-ring"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
