import React from 'react';
import { Zap } from 'lucide-react';
import { LiteraryDeviceInstance } from '../../types/contracts';
import LiteraryDeviceReport from '../LiteraryDeviceReport';

interface LiteraryDevicesReportProps {
  devices: LiteraryDeviceInstance[] | undefined; // Can be undefined if not present in analysisData
  // isLoading and error props are removed
}

export const LiteraryDevicesReport: React.FC<LiteraryDevicesReportProps> = ({ devices }) => {
  if (!devices || devices.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
          <Zap className="w-6 h-6 mr-2 text-blue-500"/> Literary Devices Analysis
        </h2>
        <p className="text-gray-600 text-center py-4">No literary devices found in the text.</p>
      </div>
    );
  }

  // Assuming LiteraryDeviceReport is the component that knows how to render the list of devices.
  // The original component was also named LiteraryDeviceReport, which might be confusing.
  // Let's assume the imported 'LiteraryDeviceReport' is the actual display component.
  return (
    <div className="p-4 border rounded-lg bg-gray-50">
       <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
          <Zap className="w-6 h-6 mr-2 text-blue-500"/> Literary Devices Analysis
        </h2>
      <LiteraryDeviceReport devices={devices} />
    </div>
  );
};
