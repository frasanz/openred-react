import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import apiService from '../services/api';
import { getRadiationColor } from '../utils/radiationColors';
import { HistogramFetchParams } from '../hooks/useMeasurementsByZoom';

interface Props {
  fetchParams?: HistogramFetchParams;
}

// Bins fijos alineados con la leyenda del mapa
const LEGEND_BINS = [
  { label: '0–0.08',    midpoint: 0.04 },
  { label: '0.08–0.12', midpoint: 0.10 },
  { label: '0.12–0.16', midpoint: 0.14 },
  { label: '0.16–0.20', midpoint: 0.18 },
  { label: '0.20–0.30', midpoint: 0.25 },
  { label: '0.30–0.50', midpoint: 0.40 },
  { label: '>0.50',     midpoint: 0.51 },
];

const BIN_COLORS = LEGEND_BINS.map(({ midpoint }) => {
  const [r, g, b] = getRadiationColor(midpoint);
  return `rgb(${r},${g},${b})`;
});

const STATIC_DATA = LEGEND_BINS.map(({ label }) => ({ label, count: 0 }));

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const index = LEGEND_BINS.findIndex(b => b.label === payload[0].payload.label);
    return (
      <Box sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 1, p: 1 }}>
        <Typography variant="caption" sx={{ color: '#CDDCED', display: 'block' }}>
          {payload[0].payload.label} µSv/h
        </Typography>
        <Typography variant="caption" sx={{ color: index >= 0 ? BIN_COLORS[index] : '#fff', fontWeight: 600 }}>
          {payload[0].value.toLocaleString('es-ES')} mediciones
        </Typography>
      </Box>
    );
  }
  return null;
};

const RadiationHistogram: React.FC<Props> = ({ fetchParams }) => {
  const [counts, setCounts] = useState<number[]>(new Array(7).fill(0));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fetchParams?.project) return;

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await apiService.getRadiationHistogram(fetchParams);
        if (!cancelled) {
          setCounts(result.bins.map(b => b.count));
        }
      } catch (err) {
        console.error('Error fetching radiation histogram:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [fetchParams]);

  const data = STATIC_DATA.map((bin, i) => ({ ...bin, count: counts[i] ?? 0 }));

  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ color: '#64748b', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', px: 1 }}
      >
        Distribución de tasa de dosis
      </Typography>

      <Box sx={{ mt: 1, height: 160, position: 'relative' }}>
        {loading && (
          <Box sx={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }}>
            <CircularProgress size={16} sx={{ color: '#64748b' }} />
          </Box>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 45 }}>
            <XAxis
              dataKey="label"
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 9 }}
              angle={-40}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={BIN_COLORS[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default RadiationHistogram;
