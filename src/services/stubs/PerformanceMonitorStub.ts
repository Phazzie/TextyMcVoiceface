import {
    IPerformanceMonitor,
    PerformanceMetric,
    TimeRange,
    MonitoringStatus,
    PerformanceAnalysis,
    PerformanceBottleneck,
    PerformanceReport,
    OptimizationSuggestion,
    PerformanceAlert,
} from '../../../docs/performance-contracts';
import { ContractResult } from '../../types/contracts';
import { NotImplementedError } from '../../types/errors';

export class PerformanceMonitorStub implements IPerformanceMonitor {
    recordMetric(_metric: PerformanceMetric): Promise<ContractResult<boolean>> {
        throw new NotImplementedError('recordMetric is not implemented in the stub.');
    }

    getMetrics(_timeRange?: TimeRange): Promise<ContractResult<PerformanceMetric[]>> {
        throw new NotImplementedError('getMetrics is not implemented in the stub.');
    }

    startMonitoring(_interval?: number): Promise<ContractResult<boolean>> {
        throw new NotImplementedError('startMonitoring is not implemented in the stub.');
    }

    stopMonitoring(): Promise<ContractResult<boolean>> {
        throw new NotImplementedError('stopMonitoring is not implemented in the stub.');
    }

    getMonitoringStatus(): Promise<ContractResult<MonitoringStatus>> {
        throw new NotImplementedError('getMonitoringStatus is not implemented in the stub.');
    }

    analyzePerformance(): Promise<ContractResult<PerformanceAnalysis>> {
        throw new NotImplementedError('analyzePerformance is not implemented in the stub.');
    }

    getBottlenecks(): Promise<ContractResult<PerformanceBottleneck[]>> {
        throw new NotImplementedError('getBottlenecks is not implemented in the stub.');
    }

    generatePerformanceReport(): Promise<ContractResult<PerformanceReport>> {
        throw new NotImplementedError('generatePerformanceReport is not implemented in the stub.');
    }

    getOptimizationSuggestions(): Promise<ContractResult<OptimizationSuggestion[]>> {
        throw new NotImplementedError('getOptimizationSuggestions is not implemented in the stub.');
    }

    applyOptimization(_optimizationId: string): Promise<ContractResult<boolean>> {
        throw new NotImplementedError('applyOptimization is not implemented in the stub.');
    }

    setPerformanceThreshold(_metric: string, _threshold: number): Promise<ContractResult<boolean>> {
        throw new NotImplementedError('setPerformanceThreshold is not implemented in the stub.');
    }

    getActiveAlerts(): Promise<ContractResult<PerformanceAlert[]>> {
        throw new NotImplementedError('getActiveAlerts is not implemented in the stub.');
    }
}
