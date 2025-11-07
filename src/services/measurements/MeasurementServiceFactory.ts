import { AxiosInstance } from 'axios';
import { RadiationMeasurementService } from './RadiationMeasurementService';
import { LightPollutionMeasurementService } from './LightPollutionMeasurementService';

export enum MeasurementType {
  RADIATION = 'radiation',
  LIGHT_POLLUTION = 'light_pollution'
}

export class MeasurementServiceFactory {
  private radiationService: RadiationMeasurementService;
  private lightPollutionService: LightPollutionMeasurementService;

  constructor(api: AxiosInstance) {
    this.radiationService = new RadiationMeasurementService(api);
    this.lightPollutionService = new LightPollutionMeasurementService(api);
  }

  getService(type: MeasurementType) {
    switch (type) {
      case MeasurementType.RADIATION:
        return this.radiationService;
      case MeasurementType.LIGHT_POLLUTION:
        return this.lightPollutionService;
      default:
        throw new Error(`Unknown measurement type: ${type}`);
    }
  }

  // Acceso directo a los servicios
  get radiation() {
    return this.radiationService;
  }

  get lightPollution() {
    return this.lightPollutionService;
  }
}
