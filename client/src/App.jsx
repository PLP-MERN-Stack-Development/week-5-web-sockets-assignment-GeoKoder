// client/src/App.jsx
import { useState } from 'react';
import UsernameForm from './components/UsernameForm';
import Chat from './components/Chat';

function App() {
  const [username, setUsername] = useState('');

  return (
    <div style={{ maxWidth: '600px', margin: 'auto', padding: '1rem' }}>
      {!username ? (
        <UsernameForm onSetUsername={setUsername} />
      ) : (
        <Chat username={username} />
      )}
    </div>
  );
}

export default App;
