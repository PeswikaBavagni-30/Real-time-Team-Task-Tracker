import React, { useState } from 'react';
import { socket } from '../socket';
import { Activity } from 'lucide-react';

const Header = ({ title }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);

  React.useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  return (
    <header className="app-header">
      <div className="logo">
        <Activity className="icon" size={28} />
        <h1>{title}</h1>
      </div>
      <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
        <span className="dot"></span>
        {isConnected ? 'Live Sync Active' : 'Disconnected'}
      </div>
    </header>
  );
};

export default Header;
