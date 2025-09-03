import React, { useState } from "react";
import { 
  Link, 
  CheckCircle, 
  Warning, 
  ArrowSquareOut, 
  Spinner,
  GoogleLogo,
  MicrosoftLogo,
  SlackLogo,
  DropboxLogo,
  GithubLogo,
  LinkedinLogo
} from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";

const providerIcons = {
  google: GoogleLogo,
  gmail: GoogleLogo,
  'google-calendar': GoogleLogo,
  'google-drive': GoogleLogo,
  microsoft: MicrosoftLogo,
  outlook: MicrosoftLogo,
  slack: SlackLogo,
  dropbox: DropboxLogo,
  github: GithubLogo,
  linkedin: LinkedinLogo,
};

const providerColors = {
  google: 'from-red-500 to-orange-500',
  gmail: 'from-red-500 to-orange-500',
  'google-calendar': 'from-blue-500 to-cyan-500',
  'google-drive': 'from-green-500 to-blue-500',
  microsoft: 'from-blue-600 to-blue-800',
  outlook: 'from-blue-600 to-blue-800',
  slack: 'from-purple-500 to-pink-500',
  dropbox: 'from-blue-500 to-blue-700',
  github: 'from-gray-700 to-gray-900',
  linkedin: 'from-blue-700 to-blue-900',
};

export default function InteractiveConnectionButton({ 
  provider = 'google', 
  workspaceSlug = null, 
  onConnectionStart = () => {}, 
  onConnectionComplete = () => {},
  onConnectionError = () => {},
  className = ""
}) {
  const [status, setStatus] = useState('idle'); // idle, connecting, connected, error
  const [error, setError] = useState(null);

  const ProviderIcon = providerIcons[provider] || Link;
  const providerColor = providerColors[provider] || 'from-blue-500 to-purple-500';
  const providerName = provider.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

  const handleConnect = async () => {
    setStatus('connecting');
    setError(null);
    onConnectionStart();

    try {
      // Create OAuth flow URL
      const baseUrl = window.location.origin;
      const authUrl = `/api/nango/auth/${provider}?workspace=${workspaceSlug || 'default'}`;
      
      // Open OAuth popup
      const popup = window.open(
        authUrl,
        'oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for popup completion
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          
          // Check if connection was successful by making a test API call
          fetch(`/api/nango/connections/${provider}?workspace=${workspaceSlug || 'default'}`)
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                setStatus('connected');
                onConnectionComplete(data);
              } else {
                setStatus('error');
                setError('Connection failed. Please try again.');
                onConnectionError(new Error('Connection failed'));
              }
            })
            .catch(err => {
              setStatus('error');
              setError('Failed to verify connection.');
              onConnectionError(err);
            });
        }
      }, 1000);

    } catch (err) {
      setStatus('error');
      setError(err.message);
      onConnectionError(err);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connecting':
        return <Spinner className="w-4 h-4 animate-spin" />;
      case 'connected':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <Warning className="w-4 h-4" />;
      default:
        return <ArrowSquareOut className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Connected!';
      case 'error':
        return 'Try Again';
      default:
        return `Connect ${providerName}`;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connecting':
        return 'from-yellow-500 to-orange-500';
      case 'connected':
        return 'from-green-500 to-emerald-500';
      case 'error':
        return 'from-red-500 to-red-700';
      default:
        return providerColor;
    }
  };

  return (
    <div className={`inline-block ${className}`}>
      <button
        onClick={handleConnect}
        disabled={status === 'connecting' || status === 'connected'}
        data-tooltip-id={`connection-btn-${provider}`}
        data-tooltip-content={error || `Connect your ${providerName} account to enable integration`}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white
          bg-gradient-to-r ${getStatusColor()}
          hover:shadow-lg hover:scale-105 
          disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100
          transition-all duration-200 ease-in-out
          border border-white/20 hover:border-white/30
        `}
      >
        <div className="flex items-center gap-2">
          <ProviderIcon className="w-5 h-5" weight="fill" />
          <span>{getStatusText()}</span>
          {getStatusIcon()}
        </div>
      </button>

      <Tooltip
        id={`connection-btn-${provider}`}
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99 max-w-xs"
      />

      {error && status === 'error' && (
        <div className="mt-2 text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded border border-red-500/30">
          {error}
        </div>
      )}
    </div>
  );
}