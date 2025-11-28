import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { sender: user?.name || 'You', text: input }]);
    setInput('');
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-lg mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Chat System</h2>
      <div className="h-64 overflow-y-auto border rounded mb-4 p-2 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center">No messages yet.</p>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="mb-2">
              <span className="font-semibold text-primary-green">{msg.sender}:</span> {msg.text}
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Type your message..."
        />
        <button type="submit" className="bg-primary-green text-white px-4 py-2 rounded">Send</button>
      </form>
    </div>
  );
};

export default Chat;
