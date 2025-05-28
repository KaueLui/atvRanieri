"use client";

import { useState, useEffect, useRef } from "react";

export default function ChatApp() {
  const [ws, setWs] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [username, setUsername] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    try {
      const websocket = new WebSocket("ws://localhost:8765");
      
      websocket.onopen = () => {
        console.log("Conectado ao servidor WebSocket");
        setIsConnected(true);
        setWs(websocket);
      };
      
      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setMessages(prev => [...prev, message]);
        } catch (error) {
          console.error("Erro ao processar mensagem:", error);
        }
      };
      
      websocket.onclose = () => {
        console.log("Conexão WebSocket fechada");
        setIsConnected(false);
        setWs(null);
      };
      
      websocket.onerror = (error) => {
        console.error("Erro WebSocket:", error);
        setIsConnected(false);
      };
      
    } catch (error) {
      console.error("Erro ao conectar:", error);
    }
  };

  const disconnectWebSocket = () => {
    if (ws) {
      ws.close();
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !ws || !isConnected) return;
    
    const message = {
      type: "message",
      username: username,
      text: inputMessage.trim()
    };
    
    try {
      ws.send(JSON.stringify(message));
      setInputMessage("");
      inputRef.current?.focus();
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsUsernameSet(true);
      connectWebSocket();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (!isUsernameSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-white mb-6">
            Chat Web
          </h1>
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Seu nome de usuário:
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu nome..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                maxLength={20}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Entrar no Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <h1 className="text-xl font-semibold text-white">Chat Web</h1>
            <span className="text-sm text-gray-400">como {username}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
            <button
              onClick={disconnectWebSocket}
              className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((message, index) => (
              <div key={index} className="animate-fadeIn">
                {message.type === 'message' ? (
                  <div className={`flex ${message.username === username ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.username === username 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-100 border border-gray-600'
                    }`}>
                      {message.username !== username && (
                        <div className="text-xs font-medium text-gray-300 mb-1">
                          {message.username}
                        </div>
                      )}
                      <div className="break-words">{message.text}</div>
                      <div className={`text-xs mt-1 ${
                        message.username === username ? 'text-blue-200' : 'text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-xs text-gray-400 bg-gray-800 border border-gray-700 px-3 py-1 rounded-full">
                      {message.text}
                    </span>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border-t border-gray-700 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={sendMessage} className="flex space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              disabled={!isConnected}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!isConnected || !inputMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}