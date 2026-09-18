import React from 'react';
import { Map, Marker, type MapLayerMouseEvent } from 'react-map-gl';
import { Box, Typography } from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import 'mapbox-gl/dist/mapbox-gl.css';
import { darkTokens as T } from '../theme/tokens';
import { MONO } from '../theme/theme';

export const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
export const hasMapboxToken = MAPBOX_TOKEN.startsWith('pk.');

interface StationMapPickerProps {
  latitude?: number;
  longitude?: number;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}

// Picker de ubicación: el usuario hace click en el mapa para fijar lat/lng.
export const StationMapPicker: React.FC<StationMapPickerProps> = ({
  latitude,
  longitude,
  onChange,
  height = 280,
}) => {
  const hasPoint = typeof latitude === 'number' && typeof longitude === 'number';

  const initialViewState = hasPoint
    ? { longitude: longitude as number, latitude: latitude as number, zoom: 13 }
    : { longitude: -3.7, latitude: 40.4, zoom: 5 }; // Centro de España por defecto

  const handleClick = (e: MapLayerMouseEvent) => {
    onChange(Number(e.lngLat.lat.toFixed(6)), Number(e.lngLat.lng.toFixed(6)));
  };

  return (
    <Box
      sx={{
        position: 'relative',
        height,
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${T.border}`,
      }}
    >
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={initialViewState}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        projection={{ name: 'mercator' }}
        onClick={handleClick}
        cursor="crosshair"
        reuseMaps
      >
        {hasPoint && (
          <Marker longitude={longitude as number} latitude={latitude as number} anchor="bottom">
            <LocationOn sx={{ color: T.accent, fontSize: 32, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }} />
          </Marker>
        )}
      </Map>
      {!hasPoint && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            pointerEvents: 'none',
            pb: 1.5,
          }}
        >
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: 11,
              color: T.text,
              bgcolor: 'rgba(0,0,0,0.55)',
              px: 1,
              py: 0.5,
              borderRadius: '4px',
            }}
          >
            click
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StationMapPicker;
