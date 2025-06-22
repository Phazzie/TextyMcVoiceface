import React from 'react';
import { Zap } from 'lucide-react';
import { LiteraryDeviceInstance } from '../../types/contracts';
import LiteraryDeviceReport from '../LiteraryDeviceReport';

interface LiteraryDevicesReportProps {
  devices: LiteraryDeviceInstance[];
  isLoading: boolean;
  error: string | null;
}

export const LiteraryDevicesReport: React.FC<LiteraryDevicesReportProps> = ({ devices, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Zap className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
        <h4 className="text-xl font-semibold text-gray-800 mb-2">Scanning for Literary Devices...</h4>
        <p className="text-gray-600">This may take a moment.</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-4 text-red-600">Error: {error}</div>;
  }

  if (!devices || devices.length === 0) {
    return <div className="text-center p-4">No literary devices found.</div>;
  }

  return <LiteraryDeviceReport devices={devices} />;
};
