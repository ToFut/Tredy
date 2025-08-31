import React, { useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react';

const SocialMediaConnector = ({ onConnectionComplete }) => {
  const [connections, setConnections] = useState({
    facebook: false,
    instagram: false,
    linkedin: false,
    google: true, // Already connected
  });

  const [connecting, setConnecting] = useState('');

  const handleConnect = async (platform) => {
    setConnecting(platform);
    
    // Simulate connection process
    setTimeout(() => {
      setConnections(prev => ({ ...prev, [platform]: true }));
      setConnecting('');
      
      // Check if all platforms are connected
      const updatedConnections = { ...connections, [platform]: true };
      if (Object.values(updatedConnections).every(connected => connected)) {
        setTimeout(() => {
          onConnectionComplete && onConnectionComplete();
        }, 1000);
      }
    }, 2000);
  };

  const platformConfig = {
    facebook: {
      name: 'Facebook',
      icon: '📘',
      color: 'bg-blue-600 hover:bg-blue-700',
      connectedColor: 'bg-green-600'
    },
    instagram: {
      name: 'Instagram',
      icon: '📸',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      connectedColor: 'bg-green-600'
    },
    linkedin: {
      name: 'LinkedIn',
      icon: '🔗',
      color: 'bg-blue-700 hover:bg-blue-800',
      connectedColor: 'bg-green-600'
    },
    google: {
      name: 'Google',
      icon: '🔴',
      color: 'bg-red-600 hover:bg-red-700',
      connectedColor: 'bg-green-600'
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-theme-bg-secondary rounded-lg border border-theme-modal-border">
      <h3 className="text-lg font-semibold text-white mb-2">Connect Your Social Media Accounts</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(platformConfig).map(([platform, config]) => (
          <button
            key={platform}
            onClick={() => !connections[platform] && handleConnect(platform)}
            disabled={connections[platform] || connecting === platform}
            className={`
              flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-medium transition-all duration-200
              ${connections[platform] 
                ? config.connectedColor 
                : connecting === platform 
                  ? 'bg-gray-500 cursor-not-allowed'
                  : config.color + ' cursor-pointer'
              }
            `}
          >
            <span className="text-xl">{config.icon}</span>
            <span className="text-sm">
              {connecting === platform ? 'Connecting...' : config.name}
            </span>
            {connections[platform] && (
              <CheckCircle size={16} weight="fill" className="text-white" />
            )}
            {platform === 'google' && connections[platform] && (
              <span className="text-xs ml-1">✨ Welcome back!</span>
            )}
          </button>
        ))}
      </div>

      {Object.values(connections).every(connected => connected) && (
        <div className="mt-4 p-3 bg-green-600/20 border border-green-500/30 rounded-lg">
          <p className="text-green-400 text-sm font-medium">
            🎉 All accounts connected! Starting business analysis...
          </p>
        </div>
      )}
    </div>
  );
};

export default SocialMediaConnector;