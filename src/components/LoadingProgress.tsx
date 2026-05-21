import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

interface LoadingProgressProps {
  loaded: number;
  total: number;
  percentage: number;
  isLoading: boolean;
}

const LoadingProgress: React.FC<LoadingProgressProps> = ({ 
  loaded, 
  total, 
  percentage,
  isLoading 
}) => {
  // Hooks deben estar SIEMPRE al inicio, antes de cualquier return
  const [startTime] = React.useState(Date.now());
  const [speed, setSpeed] = React.useState<string>('');
  const [lastLoaded, setLastLoaded] = React.useState(0);

  // Efecto para debug - log de cambios en props
  React.useEffect(() => {
    console.log(`LoadingProgress render: loaded=${loaded}, total=${total}, percentage=${percentage.toFixed(1)}%, isLoading=${isLoading}`);
  }, [loaded, total, percentage, isLoading]);

  // Calcular velocidad aproximada de carga
  React.useEffect(() => {
    if (loaded > 0 && loaded !== lastLoaded) {
      setLastLoaded(loaded);
      const elapsed = (Date.now() - startTime) / 1000; // segundos
      
      if (elapsed > 1) { // Solo calcular después de al menos 1 segundo
        const itemsPerSecond = loaded / elapsed;
        const remainingItems = total - loaded;
        const estimatedTime = remainingItems / itemsPerSecond;
        
        if (remainingItems > 0 && estimatedTime > 0 && estimatedTime < 3600) { // menos de 1 hora
          const minutes = Math.floor(estimatedTime / 60);
          const seconds = Math.floor(estimatedTime % 60);
          if (minutes > 0) {
            setSpeed(`~${minutes}m ${seconds}s restantes`);
          } else if (seconds > 5) {
            setSpeed(`~${seconds}s restantes`);
          } else {
            setSpeed('Finalizando...');
          }
        } else if (loaded === total) {
          setSpeed('¡Completado!');
        } else {
          setSpeed(`${Math.round(itemsPerSecond).toLocaleString()} mediciones/s`);
        }
      } else {
        setSpeed('Iniciando...');
      }
    }
  }, [loaded, total, startTime, lastLoaded]);

  // Return condicional DESPUÉS de todos los hooks
  if (!isLoading || total === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        p: 3,
        m: '16px auto',
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: 2,
        maxWidth: 400,
        minWidth: 320,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body1" fontWeight={500}>
          Cargando mediciones en paralelo
        </Typography>
        <Typography variant="body2" fontWeight={600} color="primary">
          {percentage.toFixed(1)}%
        </Typography>
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={percentage}
        sx={{ 
          height: 8,
          borderRadius: 1,
          bgcolor: 'action.hover',
        }}
      />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          {loaded.toLocaleString()} de {total.toLocaleString()} mediciones
        </Typography>
        {speed && (
          <Typography variant="caption" color="primary" sx={{ opacity: 0.8 }}>
            {speed}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default LoadingProgress;
