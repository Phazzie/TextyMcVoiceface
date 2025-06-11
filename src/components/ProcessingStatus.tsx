import React from 'react';
import { CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import { ProcessingStatus as ProcessingStatusType } from '../types/contracts';

interface ProcessingStatusProps {
  status: ProcessingStatusType;
  onCancel?: () => void;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ status, onCancel }) => {
  const getStageInfo = (stage: ProcessingStatusType['stage']) => {
    switch (stage) {
      case 'analyzing':
        return {
          title: 'Analyzing Text',
          description: 'Breaking down the narrative structure and identifying dialogue',
          icon: <Loader className="w-6 h-6 animate-spin text-blue-500" />,
          color: 'blue'
        };
      case 'detecting':
        return {
          title: 'Detecting Characters',
          description: 'Identifying speakers and analyzing character traits',
          icon: <Loader className="w-6 h-6 animate-spin text-purple-500" />,
          color: 'purple'
        };
      case 'assigning':
        return {
          title: 'Assigning Voices',
          description: 'Matching unique voices to each character',
          icon: <Loader className="w-6 h-6 animate-spin text-indigo-500" />,
          color: 'indigo'
        };
      case 'generating':
        return {
          title: 'Generating Audio',
          description: 'Creating speech synthesis for each segment',
          icon: <Loader className="w-6 h-6 animate-spin text-green-500" />,
          color: 'green'
        };
      case 'complete':
        return {
          title: 'Complete',
          description: 'Your audiobook is ready!',
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          color: 'green'
        };
      case 'error':
        return {
          title: 'Error',
          description: 'Something went wrong during processing',
          icon: <AlertCircle className="w-6 h-6 text-red-500" />,
          color: 'red'
        };
      default:
        return {
          title: 'Processing',
          description: 'Working on your audiobook...',
          icon: <Clock className="w-6 h-6 text-gray-500" />,
          color: 'gray'
        };
    }
  };

  const stageInfo = getStageInfo(status.stage);
  const isActive = status.stage !== 'complete' && status.stage !== 'error';

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {stageInfo.icon}
          <div>
            <h3 className="text-xl font-bold text-gray-800">{stageInfo.title}</h3>
            <p className="text-gray-600">{stageInfo.description}</p>
          </div>
        </div>
        {isActive && onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">{status.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r ${
              stageInfo.color === 'blue' ? 'from-blue-400 to-blue-600' :
              stageInfo.color === 'purple' ? 'from-purple-400 to-purple-600' :
              stageInfo.color === 'indigo' ? 'from-indigo-400 to-indigo-600' :
              stageInfo.color === 'green' ? 'from-green-400 to-green-600' :
              stageInfo.color === 'red' ? 'from-red-400 to-red-600' :
              'from-gray-400 to-gray-600'
            }`}
            style={{ width: `${status.progress}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">{status.message}</p>
        {status.currentItem && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {status.currentItem}
          </span>
        )}
      </div>

      {/* Processing Stages Indicator */}
      <div className="mt-6 flex items-center justify-between">
        {['analyzing', 'detecting', 'assigning', 'generating', 'complete'].map((stage, index) => {
          const isCurrentStage = status.stage === stage;
          const isCompletedStage = ['analyzing', 'detecting', 'assigning', 'generating'].indexOf(status.stage) > index ||
                                  status.stage === 'complete';
          const isErrorStage = status.stage === 'error';

          return (
            <div key={stage} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isErrorStage ? 'bg-red-100 text-red-600' :
                  isCurrentStage ? 'bg-blue-500 text-white shadow-lg scale-110' :
                  isCompletedStage ? 'bg-green-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompletedStage && !isCurrentStage && !isErrorStage ? '✓' : index + 1}
              </div>
              {index < 4 && (
                <div
                  className={`w-12 h-1 mx-2 transition-all duration-300 ${
                    isCompletedStage && !isCurrentStage ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};