"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "lucide-react";
import { generateAcademicResponse } from "@/lib/gemini";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ZiyoBuddyPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [todoList, setTodoList] = useState([
    { id: 1, text: "Matematika darsini o‘rganish", done: false },
    { id: 2, text: "Fizika mashqlarini bajarish", done: false },
    { id: 3, text: "Ingliz tili so‘zlarini yodlash", done: false },
  ]);
  const [newTodo, setNewTodo] = useState("");
  const [clock, setClock] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("uz-UZ", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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
      const response = await generateAcademicResponse(input);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setTodoList((prev) => [
      ...prev,
      { id: Date.now(), text: newTodo, done: false },
    ]);
    setNewTodo("");
  };

  const toggleTodo = (id: number) => {
    setTodoList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  const quickTopics = [
    { icon: Brain, title: "Matematika", description: "Algebra va geometriya" },
    { icon: BookOpen, title: "Fizika", description: "Mexanika va optika" },
    {
      icon: GraduationCap,
      title: "Kimyo",
      description: "Organik va anorganik",
    },
    {
      icon: Sparkles,
      title: "Biologiya",
      description: "Genetika va ekologiya",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Mini Clock - responsive: hide on xs, move below header on sm */}
      <div className="hidden sm:flex fixed top-4 left-4 z-[999] bg-card/80 rounded-lg px-4 py-2 shadow text-primary font-mono text-lg animate-fade-in">
        {clock}
      </div>
      {/* Mini Clock for mobile: show below header */}
      <div className="flex sm:hidden w-full justify-center mt-2 mb-2">
        <div className="bg-card/80 rounded-lg px-4 py-2 shadow text-primary font-mono text-base animate-fade-in">
          {clock}
        </div>
      </div>
      {/* Burger Button - responsive position */}
      <Button
        variant="secondary"
        size="icon"
        className="fixed top-2 right-2 sm:top-4 sm:right-4 z-[999] shadow-lg animate-fade-in"
        onClick={() => setDrawerOpen(true)}
        aria-label="To-do ro‘yxatini ochish"
      >
        <Menu className="w-6 h-6" />
      </Button>
      {/* Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[998] bg-black/30 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      {/* Drawer - responsive width */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-80 max-w-full z-[999] bg-card shadow-lg border-l border-border transform transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ willChange: "transform" }}
        tabIndex={-1}
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-foreground">
            O‘quv To-do ro‘yxati
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDrawerOpen(false)}
            aria-label="Yopish"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
        <ScrollArea className="flex-1 px-6 py-4">
          <ul className="space-y-3">
            {todoList.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleTodo(item.id)}
                  className="accent-primary w-5 h-5 rounded border border-border transition-all"
                  id={`todo-${item.id}`}
                />
                <label
                  htmlFor={`todo-${item.id}`}
                  className={`text-base ${
                    item.done
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {item.text}
                </label>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <form
          onSubmit={handleAddTodo}
          className="flex gap-2 px-6 py-4 border-t"
        >
          <Input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Yangi vazifa qo‘shish..."
            className="flex-1"
            aria-label="Yangi vazifa"
          />
          <Button type="submit" variant="default">
            Qo‘shish
          </Button>
        </form>
      </div>
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">ZiyoBuddy</h1>
              <p className="text-sm text-muted-foreground">
                Sizning akademik yordamchingiz
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <div className="container mx-auto px-2 sm:px-4 py-6 max-w-5xl flex-1 flex flex-col">
          {messages.length === 0 ? (
            /* Welcome Screen */
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                  <GraduationCap className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-balance">
                    ZiyoBuddy bilan o'rganing
                  </h2>
                  <p className="text-muted-foreground text-lg mt-2">
                    Har qanday akademik savolingizga batafsil javob oling
                  </p>
                </div>
              </div>

              {/* Quick Topics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickTopics.map((topic, index) => (
                  <Card
                    key={index}
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                          <topic.icon className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {topic.title}
                          </CardTitle>
                          <CardDescription>{topic.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {/* Sample Questions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Namuna savollar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    "Kvant mexanikasining asosiy printsiplari qanday?",
                    "Fotosintez jarayoni qanday sodir bo'ladi?",
                    "Integral hisobining amaliy qo'llanilishi",
                    "Mendeleev jadvalining tuzilishi",
                  ].map((question, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto p-3"
                      onClick={() => setInput(question)}
                    >
                      <span className="text-pretty">{question}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Redesigned Chat Interface with proper containment */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Chat Header */}
              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-xl font-semibold">Suhbat</h2>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  Akademik rejim
                </Badge>
              </div>

              <div className="flex-1 bg-card rounded-2xl border overflow-hidden flex flex-col min-h-0">
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.isUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                            message.isUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                          style={{
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                            hyphens: "auto",
                          }}
                        >
                          <div
                            className="max-h-80 overflow-y-auto overflow-x-hidden"
                            style={{
                              scrollbarWidth: "thin",
                              scrollbarColor: "rgba(0,0,0,0.3) transparent",
                            }}
                          >
                            <div
                              className="text-pretty leading-relaxed"
                              style={{
                                wordBreak: "break-word",
                                overflowWrap: "anywhere",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {message.text}
                            </div>
                          </div>
                          <div className="text-xs opacity-70 mt-2 flex-shrink-0">
                            {message.timestamp.toLocaleTimeString("uz-UZ", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:0.1s]" />
                            <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:0.2s]" />
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

        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t z-40">
          <div className="container mx-auto px-2 sm:px-4 py-4 max-w-5xl">
            <form onSubmit={handleSubmit}>
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Savolingizni yozing..."
                  className="flex-1 h-12 text-base bg-background"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={!input.trim() || isLoading}
                  className="px-4 sm:px-6"
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
