import { AxiosInstance } from 'axios';
import { BaseMeasurement } from '../../types';

export interface MeasurementFilter {
  start_date?: string;
  end_date?: string;
  campaign?: number;
  project?: number;
  track?: number;
  mission?: number;
  min_accuracy?: number;
  max_accuracy?: number;
  data_quality?: string;
  min_altitude?: number;
  max_altitude?: number;
  min_speed?: number;
  max_speed?: number;
  min_dose_rate?: number;
  max_dose_rate?: number;
}

export interface LoadOptions {
  pageSize?: number;
  maxConcurrent?: number;
  useParallel?: boolean;
  autoOptimize?: boolean;
  projectId?: number;
  knownTotal?: number;
}

export abstract class BaseMeasurementService<T extends BaseMeasurement> {
  protected loadingPromise: Promise<T[]> | null = null;

  constructor(protected api: AxiosInstance) {}

  // Métodos abstractos que cada servicio debe implementar
  protected abstract getBaseEndpoint(): string;
  protected abstract getCountEndpoint(): string;
  protected abstract getPaginatedEndpoint(): string;

  async getMeasurements(params?: MeasurementFilter): Promise<T[]> {
    try {
      const response = await this.api.get(this.getBaseEndpoint(), { params });
      console.log(`API Response from ${this.getBaseEndpoint()}:`, response.data);
      
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      } else {
        console.warn('Unexpected API response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching measurements from ${this.getBaseEndpoint()}:`, error);
      throw error;
    }
  }

  async getMeasurementsCount(projectId?: number): Promise<number> {
    try {
      let url = this.getCountEndpoint();
      if (projectId) {
        url += `?project=${projectId}`;
      }
      const response = await this.api.get(url);
      return response.data.total;
    } catch (error) {
      console.error('Error getting measurements count:', error);
      return 0;
    }
  }

  async getMeasurementsWithProgress(
    onProgress: (loaded: number, total: number) => void,
    options: LoadOptions = {}
  ): Promise<T[]> {
    // Evitar múltiples cargas simultáneas (útil en StrictMode)
    if (this.loadingPromise) {
      console.log('Already loading measurements, returning existing promise');
      return this.loadingPromise;
    }

    const loadMeasurements = async (): Promise<T[]> => {
      try {
        const { 
          pageSize = 1000,
          maxConcurrent = 8,
          useParallel = true,
          autoOptimize = true,
          projectId,
          knownTotal
        } = options;

        console.log(`Starting getMeasurementsWithProgress with options:`, options);

        // 1. Obtener conteo total
        let total: number;
        if (knownTotal !== undefined) {
          total = knownTotal;
          console.log(`Using known total count: ${total}`);
        } else {
          console.log(`Getting total count for project ${projectId || 'all'}...`);
          total = await this.getMeasurementsCount(projectId);
          console.log(`Total count received: ${total}`);
        }
        
        onProgress(0, total);

        if (total === 0) {
          console.log(`No measurements found, returning empty array`);
          return [];
        }

        // 2. Auto-optimizar configuración basada en el tamaño del dataset
        let optimizedPageSize = pageSize;
        let optimizedMaxConcurrent = maxConcurrent;
        let shouldUseParallel = useParallel;

        if (autoOptimize) {
          if (total < 2000) {
            optimizedPageSize = total;
            shouldUseParallel = false;
          } else if (total < 10000) {
            optimizedPageSize = 500;
            shouldUseParallel = false;
          } else if (total < 30000) {
            optimizedPageSize = 1000;
            optimizedMaxConcurrent = 6;
          } else {
            optimizedPageSize = 2000;
            optimizedMaxConcurrent = 10;
          }
        }

        const totalPages = Math.ceil(total / optimizedPageSize);

        console.log(`Loading strategy: ${total} measurements, ${totalPages} pages of ${optimizedPageSize} items each, ${shouldUseParallel ? `${optimizedMaxConcurrent} concurrent` : 'sequential'}`);

        let result: T[];
        if (!shouldUseParallel || totalPages === 1) {
          console.log(`Using sequential loading...`);
          result = await this.loadSequential(totalPages, optimizedPageSize, total, onProgress, projectId);
        } else {
          console.log(`Using parallel loading...`);
          result = await this.loadParallel(totalPages, optimizedPageSize, total, optimizedMaxConcurrent, onProgress, projectId);
        }

        return result;
      } catch (error) {
        console.error('Error loading measurements with progress:', error);
        throw error;
      } finally {
        this.loadingPromise = null;
      }
    };

    this.loadingPromise = loadMeasurements();
    return this.loadingPromise;
  }

  protected buildPaginatedUrl(page: number, pageSize: number, projectId?: number): string {
    let url = `${this.getPaginatedEndpoint()}?page=${page}&page_size=${pageSize}`;
    if (projectId) {
      url += `&project=${projectId}`;
    }
    return url;
  }

  private async loadSequential(
    totalPages: number,
    pageSize: number,
    total: number,
    onProgress: (loaded: number, total: number) => void,
    projectId?: number
  ): Promise<T[]> {
    let allMeasurements: T[] = [];
    
    console.log(`Starting sequential load: ${totalPages} pages, ${total} total items expected`);
    onProgress(0, total);
    
    for (let page = 1; page <= totalPages; page++) {
      console.log(`Loading page ${page}/${totalPages}`);
      
      const url = this.buildPaginatedUrl(page, pageSize, projectId);
      const response = await this.api.get(url);
      
      const pageResults = response.data.results || [];
      allMeasurements = [...allMeasurements, ...pageResults];
      
      const loadedItems = allMeasurements.length;
      console.log(`Page ${page} loaded: +${pageResults.length} items (total: ${loadedItems}/${total})`);
      
      onProgress(loadedItems, total);
      
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    
    console.log(`Sequential load completed: ${allMeasurements.length}/${total} items`);
    onProgress(total, total);
    
    return allMeasurements;
  }

  private async loadParallel(
    totalPages: number,
    pageSize: number,
    total: number,
    maxConcurrent: number,
    onProgress: (loaded: number, total: number) => void,
    projectId?: number
  ): Promise<T[]> {
    const pageChunks: number[][] = [];
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    for (let i = 0; i < totalPages; i += maxConcurrent) {
      pageChunks.push(pageNumbers.slice(i, i + maxConcurrent));
    }

    let allMeasurements: T[] = [];
    let totalLoadedItems = 0;

    console.log(`Starting parallel load: ${totalPages} pages in ${pageChunks.length} chunks, ${total} total items expected`);
    onProgress(0, total);

    for (const chunk of pageChunks) {
      const chunkPromises = chunk.map(page => {
        const url = this.buildPaginatedUrl(page, pageSize, projectId);
        return this.api.get(url);
      });

      const responses = await Promise.all(chunkPromises);

      let itemsInThisChunk = 0;
      const chunkMeasurements: T[] = [];

      for (const response of responses) {
        const pageResults = response.data.results || [];
        chunkMeasurements.push(...pageResults);
        itemsInThisChunk += pageResults.length;
      }
      
      allMeasurements.push(...chunkMeasurements);
      totalLoadedItems += itemsInThisChunk;

      console.log(`Chunk completed: +${itemsInThisChunk} items (total loaded: ${totalLoadedItems}/${total})`);

      onProgress(totalLoadedItems, total);

      await new Promise(resolve => setTimeout(resolve, 0));
    }

    console.log(`Finished loading: ${totalLoadedItems} items out of ${total} expected`);

    onProgress(total, total);

    return allMeasurements;
  }

  async createMeasurement(measurementData: Omit<T, 'id' | 'measurement_id'>): Promise<T> {
    const response = await this.api.post(this.getBaseEndpoint(), measurementData);
    return response.data;
  }

  // Método para obtener agregaciones H3
  async getH3Aggregation(params?: {
    resolution?: number;
    project?: number;
    start_date?: string;
    end_date?: string;
    mission?: number;
    campaign?: number;
    [key: string]: any;
  }): Promise<{ 
    hexagons: any[], 
    resolution?: number, 
    totalMeasurements?: number,
    statistics?: {
      global_avg: number;
      global_min: number;
      global_max: number;
      global_std?: number;
    }
  }> {
    try {
      const endpoint = this.getBaseEndpoint().replace(/\/$/, '') + '/h3-aggregation/';
      const response = await this.api.get(endpoint, { params });
      console.log(`H3 Aggregation Vertex response from ${endpoint}:`, response.data);
      
      if (Array.isArray(response.data)) {
        return { hexagons: response.data };
      } else if (response.data.hexagons && Array.isArray(response.data.hexagons)) {
        // El backend devuelve { hexagons: [...], resolution: 5, total_hexagons: N, total_measurements: M, statistics: {...} }
        return { 
          hexagons: response.data.hexagons,
          resolution: response.data.resolution,
          totalMeasurements: response.data.total_measurements,
          statistics: response.data.statistics
        };
      } else if (response.data.results && Array.isArray(response.data.results)) {
        return { hexagons: response.data.results };
      }
      return { hexagons: [] };
    } catch (error) {
      console.error(`Error fetching H3 aggregation from ${this.getBaseEndpoint()}:`, error);
      throw error;
    }
  }
}
