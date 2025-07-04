import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, AlertCircle, Loader, ExternalLink } from 'lucide-react';

interface ElevenLabsSetupProps {
  onApiKeySet: (apiKey: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const ElevenLabsSetup: React.FC<ElevenLabsSetupProps> = ({
  onApiKeySet,
  isVisible,
  onClose
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: {
          'xi-api-key': apiKey.trim()
        }
      });

      if (!response.ok) {
        throw new Error(`Invalid API key or connection failed: ${response.status}`);
      }

      await response.json(); // Consume the JSON body, but userData is not used
      setSuccess(true);
      
      // Store API key in localStorage for persistence
      localStorage.setItem('elevenlabs_api_key', apiKey.trim());
      
      setTimeout(() => {
        onApiKeySet(apiKey.trim());
        onClose();
      }, 1500);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetApiKey = () => {
    window.open('https://elevenlabs.io/speech-synthesis', '_blank');
  };

  // Check for existing API key on mount
  useEffect(() => {
    const existingKey = localStorage.getItem('elevenlabs_api_key');
    if (existingKey) {
      setApiKey(existingKey);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ElevenLabs Setup</h2>
          <p className="text-gray-600">
            Connect your ElevenLabs account for high-quality AI voice generation
          </p>
        </div>

        {!success ? (
          <>
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="apikey" className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  id="apikey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your ElevenLabs API key"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={handleTestConnection}
                disabled={isLoading || !apiKey.trim()}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                  isLoading || !apiKey.trim()
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Testing Connection...</span>
                  </div>
                ) : (
                  'Connect & Test'
                )}
              </button>

              <button
                onClick={handleGetApiKey}
                className="w-full py-3 px-4 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Get API Key from ElevenLabs</span>
              </button>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl">
              <h3 className="font-semibold text-blue-900 mb-2">Getting Started:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Sign up at ElevenLabs.io</li>
                <li>Go to your Profile → API Keys</li>
                <li>Copy your API key and paste it above</li>
                <li>Free tier includes 10,000 characters/month</li>
              </ol>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Connection Successful!</h3>
            <p className="text-gray-600">
              Your ElevenLabs API is configured and ready to generate high-quality audio.
            </p>
          </div>
        )}

        {!success && (
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};