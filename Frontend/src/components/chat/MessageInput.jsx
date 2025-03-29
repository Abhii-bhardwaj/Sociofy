import { useState } from "react";

const MessageInput = ({ onSend }) => {
  const [content, setContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onSend(content);
      setContent("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-base-300">
      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="input input-bordered flex-1"
        />
        <button type="submit" className="btn btn-primary">
          Send
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
