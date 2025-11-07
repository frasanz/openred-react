import { BaseMeasurementService, MeasurementFilter } from './BaseMeasurementService';
import { RadiationMeasurement } from '../../types';

export class RadiationMeasurementService extends BaseMeasurementService<RadiationMeasurement> {
  protected getBaseEndpoint(): string {
    return '/api/radiation-measurements/';
  }

  protected getCountEndpoint(): string {
    return '/api/radiation-measurements/count/';
  }

  protected getPaginatedEndpoint(): string {
    return '/api/radiation-measurements/paginated/';
  }

  // Métodos específicos de radiación
  async getMeasurementsByRadiationLevel(
    minRadiation: number,
    maxRadiation: number,
    additionalParams?: MeasurementFilter
  ): Promise<RadiationMeasurement[]> {
    return this.getMeasurements({
      ...additionalParams,
      min_radiation: minRadiation,
      max_radiation: maxRadiation
    } as any);
  }

  async getMeasurementsByDetectorType(
    detectorType: string,
    additionalParams?: MeasurementFilter
  ): Promise<RadiationMeasurement[]> {
    return this.getMeasurements({
      ...additionalParams,
      detector_type: detectorType
    } as any);
  }

  async getHighRadiationAlerts(
    threshold: number,
    additionalParams?: MeasurementFilter
  ): Promise<RadiationMeasurement[]> {
    return this.getMeasurements({
      ...additionalParams,
      min_radiation: threshold
    } as any);
  }
}
