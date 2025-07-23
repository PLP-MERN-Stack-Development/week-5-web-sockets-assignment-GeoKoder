// client/src/components/UsernameForm.jsx
import { useState } from 'react';

export default function UsernameForm({ onSetUsername }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) onSetUsername(name.trim());
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
      <input
        type="text"
        placeholder="Enter your username"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <button type="submit">Join Chat</button>
    </form>
  );
}
