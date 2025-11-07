import { BaseMeasurementService, MeasurementFilter } from './BaseMeasurementService';
import { LightPollutionMeasurement } from '../../types';

export class LightPollutionMeasurementService extends BaseMeasurementService<LightPollutionMeasurement> {
  protected getBaseEndpoint(): string {
    return '/api/light-pollution-measurements/';
  }

  protected getCountEndpoint(): string {
    return '/api/light-pollution-measurements/count/';
  }

  protected getPaginatedEndpoint(): string {
    return '/api/light-pollution-measurements/paginated/';
  }

  // Métodos específicos de contaminación lumínica
  async getMeasurementsByBrightness(
    minBrightness: number,
    maxBrightness: number,
    additionalParams?: MeasurementFilter
  ): Promise<LightPollutionMeasurement[]> {
    return this.getMeasurements({
      ...additionalParams,
      min_brightness: minBrightness,
      max_brightness: maxBrightness
    } as any);
  }

  async getMeasurementsByBortleClass(
    bortleClass: number,
    additionalParams?: MeasurementFilter
  ): Promise<LightPollutionMeasurement[]> {
    return this.getMeasurements({
      ...additionalParams,
      bortle_class: bortleClass
    } as any);
  }

  async getMeasurementsBySQM(
    minSQM: number,
    maxSQM: number,
    additionalParams?: MeasurementFilter
  ): Promise<LightPollutionMeasurement[]> {
    return this.getMeasurements({
      ...additionalParams,
      min_sqm: minSQM,
      max_sqm: maxSQM
    } as any);
  }

  async getDarkSkyLocations(
    sqmThreshold: number = 21.0,
    additionalParams?: MeasurementFilter
  ): Promise<LightPollutionMeasurement[]> {
    return this.getMeasurements({
      ...additionalParams,
      min_sqm: sqmThreshold
    } as any);
  }

  async getMeasurementsByMoonPhase(
    minPhase: number,
    maxPhase: number,
    additionalParams?: MeasurementFilter
  ): Promise<LightPollutionMeasurement[]> {
    return this.getMeasurements({
      ...additionalParams,
      min_moon_phase: minPhase,
      max_moon_phase: maxPhase
    } as any);
  }
}
