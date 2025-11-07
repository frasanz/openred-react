import React from 'react';
import './LoadingProgress.css';

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
    console.log(`🎨 LoadingProgress render: loaded=${loaded}, total=${total}, percentage=${percentage.toFixed(1)}%, isLoading=${isLoading}`);
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
    <div className="loading-progress">
      <div className="progress-header">
        <span className="progress-title">Cargando mediciones en paralelo</span>
        <span className="progress-percentage">{percentage.toFixed(1)}%</span>
      </div>
      
      <div className="progress-bar-container">
        <div 
          className="progress-bar" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="progress-details">
        <div className="progress-text">
          {loaded.toLocaleString()} de {total.toLocaleString()} mediciones
        </div>
        {speed && (
          <div className="progress-speed">
            {speed}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingProgress;
