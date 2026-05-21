// Statistics API Types

export interface GlobalStatistics {
  measurement_type: 'radiation' | 'light_pollution';
  totals: {
    measurements: number;
    tracks: number;
    projects: number;
    contributors: number;
  };
  date_range: {
    first: string;
    last: string;
    days_active: number;
  };
  geographic: {
    bbox: {
      min_lat: number;
      max_lat: number;
      min_lon: number;
      max_lon: number;
    };
  };
  distance: {
    total_km: number;
    longest_track_km: number;
  };
  records: {
    highest_dose_rate: number | null;
    lowest_dose_rate: number | null;
    most_measurements_track: number;
  };
  fun_facts: {
    earth_circumferences: number;
    marathon_equivalents: number;
  };
}

export interface HeatmapCell {
  h3: string;
  count: number;
  center: {
    lat: number;
    lon: number;
  };
  avg_dose_rate: number;
}

export interface HeatmapStatistics {
  resolution: number;
  cell_count: number;
  total_measurements: number;
  cells: HeatmapCell[];
}

// Legacy interfaces - kept for backward compatibility
export interface ActivityStatistics {
  distance: {
    total_km: number;
    avg_per_track: number;
    longest_track_km: number;
    total_tracks: number;
  };
  time: {
    total_hours: number;
    total_days: number;
    avg_duration_per_track_hours: number;
    longest_session_hours: number;
  };
  measurements: {
    total: number;
    measurements_per_km: number;
    avg_per_track: number;
    max_in_single_track: number;
  };
  geographic: {
    unique_locations: number;
    area_covered_km2: number;
  };
}

export interface RecordsStatistics {
  records: {
    longest_track_km: number;
    most_measurements_single_track: number;
    highest_radiation_cpm: number;
    lowest_radiation_cpm: number;
    darkest_sky: number | null;
    brightest_sky: number | null;
    highest_altitude_m: number | null;
  };
  milestones: {
    first_measurement_date: string;
    latest_measurement_date: string;
    total_contributors: number;
    active_last_30_days: number;
  };
  comparisons: {
    earth_circumferences: number;
    marathon_equivalents: number;
    madrid_to_tokyo_trips: number;
  };
}
