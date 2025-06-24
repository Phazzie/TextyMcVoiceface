import {
    ICacheManager,
    CacheMetadata,
    CachedAudioSegment,
    VoiceProfile,
    MemoryOptimizationResult,
    MemoryStats,
    CacheType,
    CachePolicy,
    MaintenanceResult,
    CacheStats,
} from '../../../docs/performance-contracts';
import { ContractResult } from '../../types/contracts';
import { NotImplementedError } from '../../types/errors';

export class CacheManagerStub implements ICacheManager {
    cacheAudioSegment(
        _segmentId: string,
        _audioData: Blob,
        _metadata?: CacheMetadata
    ): Promise<ContractResult<boolean>> {
        throw new NotImplementedError('cacheAudioSegment is not implemented in the stub.');
    }

    getCachedAudioSegment(_segmentId: string): Promise<ContractResult<CachedAudioSegment | null>> {
        throw new NotImplementedError('getCachedAudioSegment is not implemented in the stub.');
    }

    invalidateAudioCache(_pattern?: string): Promise<ContractResult<number>> {
        throw new NotImplementedError('invalidateAudioCache is not implemented in the stub.');
    }

    cacheAnalysisResult(_textHash: string, _result: any, _analysisType: string): Promise<ContractResult<boolean>> {
        throw new NotImplementedError('cacheAnalysisResult is not implemented in the stub.');
    }

    getCachedAnalysisResult(_textHash: string, _analysisType: string): Promise<ContractResult<any>> {
        throw new NotImplementedError('getCachedAnalysisResult is not implemented in the stub.');
    }

    cacheVoiceProfile(_characterId: string, _profile: VoiceProfile): Promise<ContractResult<boolean>> {
        throw new NotImplementedError('cacheVoiceProfile is not implemented in the stub.');
    }

    getCachedVoiceProfile(_characterId: string): Promise<ContractResult<VoiceProfile | null>> {
        throw new NotImplementedError('getCachedVoiceProfile is not implemented in the stub.');
    }

    optimizeMemoryUsage(): Promise<ContractResult<MemoryOptimizationResult>> {
        throw new NotImplementedError('optimizeMemoryUsage is not implemented in the stub.');
    }

    getMemoryStats(): Promise<ContractResult<MemoryStats>> {
        throw new NotImplementedError('getMemoryStats is not implemented in the stub.');
    }

    clearCache(_cacheType?: CacheType): Promise<ContractResult<boolean>> {
        throw new NotImplementedError('clearCache is not implemented in the stub.');
    }

    setCachePolicy(_policy: CachePolicy): Promise<ContractResult<boolean>> {
        throw new NotImplementedError('setCachePolicy is not implemented in the stub.');
    }

    getCachePolicy(): Promise<ContractResult<CachePolicy>> {
        throw new NotImplementedError('getCachePolicy is not implemented in the stub.');
    }

    performMaintenance(): Promise<ContractResult<MaintenanceResult>> {
        throw new NotImplementedError('performMaintenance is not implemented in the stub.');
    }

    exportCacheStats(): Promise<ContractResult<CacheStats>> {
        throw new NotImplementedError('exportCacheStats is not implemented in the stub.');
    }
}
