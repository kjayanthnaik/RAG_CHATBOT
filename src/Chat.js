import { useState } from "react";

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🎤 Voice Input (Speech-to-Text)
  const startListening = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    //   sendMessage(transcript); // auto-send after speaking
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.start();
  };

  // 🔊 Voice Output (Text-to-Speech)
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (overrideInput) => {
    const msg = overrideInput || input;
    if (!msg.trim()) return;

    const userMessage = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMessage]);
    // setInput("");
    setLoading(true);
 
    try {
      // const response = await fetch("http://localhost:5000/chat", {
      const response = await fetch("https://rag-chatbot-backend-laax.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      const data = await response.json();
      const botMessage = { role: "assistant", content: data.reply};

      setMessages((prev) => [...prev, botMessage]);
      // speak(botMessage.content); // 🗣️ Bot speaks out reply
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error: could not connect to server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat">
      <div className="messages">
        {messages.map((m, i) => (
          <p key={i}>
            <b>{m.role}:</b> {m.content} 
          </p>
        ))}
        {loading && <p><b>assistant:</b>🤖 Bot is typing...</p>}
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message..."
        />
        <button onClick={() => sendMessage()} disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
        <button onClick={startListening}>🎙️ listen</button>
        <button onClick={speak}>🎙️ speak</button>

      </div>
    </div>
  );
}
