// client/src/components/Chat.jsx
import { useEffect, useState } from "react";
import socket from "../socket/socket";

const AVAILABLE_ROOMS = ["General", "Sports", "Tech", "Music"];
const notifySound = new Audio('/notification.mp3'); // Add notification.mp3 to /public

const showBrowserNotification = (title, body) => {
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
};

export default function Chat({ username }) {
  const [currentRoom, setCurrentRoom] = useState("General");
  const [roomMessages, setRoomMessages] = useState({}); // { roomName: [messages] }
  const [input, setInput] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isTabActive, setIsTabActive] = useState(true);
  const [messages, setMessages] = useState([]);
  const [lastMessage, setLastMessage] = useState(null);

  // Handle browser tab visibility
  useEffect(() => {
    const handleVisibility = () => setIsTabActive(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    socket.emit("join", username);
    socket.emit("joinRoom", currentRoom);

    socket.on("users", (users) => {
      setOnlineUsers(users.filter((u) => u !== username));
    });

    socket.on("roomJoined", (roomName) => {
      // Optionally show a notification
      console.log(`Joined room: ${roomName}`);
      setUnreadCounts((prev) => ({ ...prev, [roomName]: 0 }));
    });

    return () => {
      socket.off("users");
      socket.off("roomJoined");
    };
  }, [username, currentRoom]);

  // Notification and unread logic for room messages
  useEffect(() => {
    socket.on('roomMessage', (msg) => {
      setRoomMessages((prev) => {
        const room = msg.room || 'General';
        const msgs = prev[room] || [];
        return { ...prev, [room]: [...msgs, msg] };
      });

      if (msg.room !== currentRoom && !msg.system) {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.room]: (prev[msg.room] || 0) + 1,
        }));
      }

      if (!msg.system && msg.sender !== username) {
        notifySound.play();
        if (!isTabActive) {
          document.title = `🔔 New message in ${msg.room}`;
          showBrowserNotification(`New message from ${msg.sender}`, msg.text);
        }
      }
    });

    return () => socket.off('roomMessage');
  }, [currentRoom, username, isTabActive]);

  // Reset unread count and tab title when switching rooms
  useEffect(() => {
    setUnreadCounts((prev) => ({ ...prev, [currentRoom]: 0 }));
    document.title = 'Chat App';
  }, [currentRoom]);

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // FIX: Send an object with room, text, and sender
    socket.emit("roomMessage", {
      room: currentRoom,
      text: input.trim(),
      sender: username,
      timestamp: new Date().toISOString(),
    });
    setInput("");
  };

  const onReceiveMessage = (message) => {
    setLastMessage(message);
    setMessages((prev) => [...prev, message]);
  };

  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      {/* Rooms list */}
      <div
        style={{
          width: "150px",
          borderRight: "1px solid #ccc",
          paddingRight: "1rem",
        }}
      >
        <h4>Rooms</h4>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {AVAILABLE_ROOMS.map((room) => (
            <li
              key={room}
              onClick={() => setCurrentRoom(room)}
              style={{
                cursor: "pointer",
                fontWeight: room === currentRoom ? "bold" : "normal",
                marginBottom: "0.5rem",
              }}
            >
              {room}
              {unreadCounts[room] > 0 && (
                <span style={{ color: "red", marginLeft: 6 }}>
                  ({unreadCounts[room]})
                </span>
              )}
            </li>
          ))}
        </ul>

        <h4>Online Users</h4>
        <ul>
          {onlineUsers.map((user) => (
            <li key={user}>{user}</li>
          ))}
        </ul>
      </div>

      {/* Chat window */}
      <div style={{ flex: 1 }}>
        <h3>{currentRoom} Room</h3>
        <div
          style={{
            height: "300px",
            overflowY: "auto",
            border: "1px solid #ccc",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          {(roomMessages[currentRoom] || []).map((msg, idx) => (
            <div key={idx} style={{ marginBottom: "0.5rem" }}>
              <strong>{msg.sender}</strong>: {msg.message || msg.text}{" "}
              <small style={{ color: "#666" }}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </small>
            </div>
          ))}
        </div>

        <form
          onSubmit={sendMessage}
          style={{ display: "flex", gap: "0.5rem" }}
        >
          <input
            type="text"
            placeholder={`Message in ${currentRoom}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ flex: 1 }}
            autoFocus
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
