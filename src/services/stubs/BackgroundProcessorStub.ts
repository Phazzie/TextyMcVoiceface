import {
    IBackgroundProcessor,
    ProcessingOptions,
    ProcessingJob,
    ProcessingStatus,
    ChunkingStrategy,
    WorkerStats,
} from '../../../docs/performance-contracts';
import { ContractResult } from '../../types/contracts';
import { NotImplementedError } from '../../types/errors';

export class BackgroundProcessorStub implements IBackgroundProcessor {
    processLargeDocument(_text: string, _options: ProcessingOptions): Promise<ContractResult<ProcessingJob>> {
        throw new NotImplementedError('processLargeDocument is not implemented in the stub.');
    }

    getProcessingStatus(_jobId: string): Promise<ContractResult<ProcessingStatus>> {
        throw new NotImplementedError('getProcessingStatus is not implemented in the stub.');
    }

    getProcessingQueue(): Promise<ContractResult<ProcessingJob[]>> {
        throw new NotImplementedError('getProcessingQueue is not implemented in the stub.');
    }

    prioritizeJob(_jobId: string, _priority: number): Promise<ContractResult<boolean>> {
        throw new NotImplementedError('prioritizeJob is not implemented in the stub.');
    }

    cancelJob(_jobId: string): Promise<ContractResult<boolean>> {
        throw new NotImplementedError('cancelJob is not implemented in the stub.');
    }

    pauseJob(_jobId: string): Promise<ContractResult<boolean>> {
        throw new NotImplementedError('pauseJob is not implemented in the stub.');
    }

    resumeJob(_jobId: string): Promise<ContractResult<boolean>> {
        throw new NotImplementedError('resumeJob is not implemented in the stub.');
    }

    enableProgressiveLoading(_enabled: boolean): Promise<ContractResult<boolean>> {
        throw new NotImplementedError('enableProgressiveLoading is not implemented in the stub.');
    }

    setChunkSize(_size: number): Promise<ContractResult<boolean>> {
        throw new NotImplementedError('setChunkSize is not implemented in the stub.');
    }

    getChunkingStrategy(): Promise<ContractResult<ChunkingStrategy>> {
        throw new NotImplementedError('getChunkingStrategy is not implemented in the stub.');
    }

    getWorkerStats(): Promise<ContractResult<WorkerStats>> {
        throw new NotImplementedError('getWorkerStats is not implemented in the stub.');
    }

    optimizeWorkerAllocation(): Promise<ContractResult<boolean>> {
        throw new NotImplementedError('optimizeWorkerAllocation is not implemented in the stub.');
    }
}
