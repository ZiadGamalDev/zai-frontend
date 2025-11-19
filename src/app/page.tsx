"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [userId, setUserId] = useState<string>("");

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  // Debug logging
  console.log("Frontend Environment:", {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    baseUrl: baseUrl,
    NODE_ENV: process.env.NODE_ENV
  });

  useEffect(() => {
    // Get userId from localStorage or create a new one
    const storedUserId = localStorage.getItem('chatUserId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = uuidv4();
      localStorage.setItem('chatUserId', newUserId);
      setUserId(newUserId);
    }
  }, []);

  useEffect(() => {
    axios
      .get(`${baseUrl}/chat-history?userId=${userId}`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Error fetching chat history:", err));
  }, [userId, baseUrl]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await axios.post(`${baseUrl}/chat`, { userId, message: input });
      const botMessage = { role: "bot", text: res.data.response };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Failed to get response:", error);
      setMessages((prev) => [...prev, { role: "bot", text: "Error fetching AI response." }]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100); // Auto-focus after response
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white items-center">
      <h1 className="text-2xl font-bold my-4">ZAI</h1>

      <div className="flex-1 w-full max-w-2xl overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-fit px-4 py-2 rounded-lg ${msg.role === "user"
                ? "bg-blue-500 text-white ml-auto"
                : "bg-gray-700 text-gray-200 mr-auto"
              }`}
          >
            {msg.text}
          </div>
        ))}
        {isTyping && (
          <div className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg mr-auto">
            <span className="typing-dots">...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="w-full max-w-2xl p-4 bg-gray-800 flex items-center gap-2 border-t border-gray-700">
        <input
          ref={inputRef}
          type="text"
          className="flex-1 p-2 border rounded-lg bg-gray-700 text-white focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={isTyping}
        />
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          onClick={sendMessage}
          disabled={isTyping}
        >
          {isTyping ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
