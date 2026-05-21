import React, { useEffect } from 'react';
import { useProjects, type Project } from '../hooks/useProjects';
import { CircularProgress, FormControl, InputLabel, Select, MenuItem, Box, Chip, Typography } from '@mui/material';

interface ProjectSelectorProps {
  selectedProject: Project | null;
  onProjectChange: (project: Project) => void;
  className?: string;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  selectedProject,
  onProjectChange,
  className = '',
}) => {
  const { projects, loading, error, refreshProjectCounts } = useProjects();

  // Debug logs
  useEffect(() => {
    console.log('ProjectSelector Debug:', {
      projects,
      loading,
      error,
      selectedProject,
      projectsLength: projects.length
    });
  }, [projects, loading, error, selectedProject]);

  // Auto-seleccionar proyecto basado en localStorage o por defecto radiación
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      const savedProjectId = localStorage.getItem('selectedProjectId');
      let projectToSelect: Project | null = null;

      if (savedProjectId) {
        projectToSelect = projects.find(p => p.id === parseInt(savedProjectId)) || null;
      }

      // Si no hay proyecto guardado o no se encuentra, seleccionar uno por defecto
      if (!projectToSelect) {
        // Priorizar proyecto de radiación
        const radiationProject = projects.find(p => p.project_type === 'radiation' && p.is_active);
        projectToSelect = radiationProject || projects.find(p => p.is_active) || projects[0];
      }

      if (projectToSelect) {
        onProjectChange(projectToSelect);
      }
    }
  }, [projects, selectedProject, onProjectChange]);

  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'radiation':
        return '';
      case 'light_pollution':
        return '';
      default:
        return '';
    }
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'radiation':
        return 'Radiación';
      case 'light_pollution':
        return 'Cont. Lumínica';
      default:
        return 'Otro';
    }
  };

  const getProjectTypeColor = (type: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (type) {
      case 'radiation':
        return 'warning';
      case 'light_pollution':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatLastMeasurementDate = (dateString: string | null) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 30) {
      return `Hace ${diffDays} días`;
    } else if (diffDays < 365) {
      const diffMonths = Math.floor(diffDays / 30);
      return `Hace ${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'}`;
    } else {
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (loading) {
    console.log('ProjectSelector: Mostrando estado de carga');
    return (
      <Box className={className} display="flex" alignItems="center" gap={1}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          Cargando proyectos...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className={className}>
        <Typography variant="body2" color="error">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={className}>
      <FormControl fullWidth size="small" sx={{ 
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: '#0751A4',
            borderWidth: '1px',
          },
          '&:hover fieldset': {
            borderColor: '#0751A4',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#0751A4',
          },
        }
      }}>
        <InputLabel id="project-selector-label">Proyecto</InputLabel>
        <Select
          labelId="project-selector-label"
          id="project-selector"
          value={selectedProject?.id || ''}
          label="Proyecto"
          onChange={(e) => {
            const projectId = parseInt(e.target.value as string);
            const project = projects.find(p => p.id === projectId);
            if (project) {
              onProjectChange(project);
            }
          }}
          disabled={projects.length === 0}
          renderValue={(value) => {
            const project = projects.find(p => p.id === value);
            if (!project) return '';
            
            return (
              <Box display="flex" alignItems="center" gap={1.5} sx={{ py: 0.5 }}>
                <span style={{ fontSize: '16px' }}>{getProjectIcon(project.project_type)}</span>
                <Typography variant="body2" fontWeight="medium">
                  {project.name}
                </Typography>
                <Chip 
                  label={getProjectTypeLabel(project.project_type)}
                  size="small"
                  color={getProjectTypeColor(project.project_type)}
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: '22px' }}
                />
                <Chip
                  label={`${project.measurements_count.toLocaleString()}`}
                  size="small"
                  variant="filled"
                  color="primary"
                  sx={{ fontSize: '0.7rem', height: '22px', fontWeight: 'medium' }}
                />
                {project.is_public && (
                  <Typography variant="caption" color="success.main" sx={{ fontSize: '0.7rem', fontWeight: 'medium' }}>
                    Público
                  </Typography>
                )}
              </Box>
            );
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: '400px',
                '& .MuiMenuItem-root': {
                  whiteSpace: 'normal',
                  overflow: 'visible',
                }
              }
            }
          }}
        >
          {projects.map((project) => (
            <MenuItem 
              key={project.id} 
              value={project.id}
              sx={{ 
                py: 2, // Más padding vertical para hacer los items más altos
                px: 2,
                minHeight: '80px', // Altura mínima para cada item
              }}
            >
              <Box display="flex" alignItems="flex-start" gap={2} sx={{ width: '100%' }}>
                <Box sx={{ mt: 0.5 }}>
                  <span style={{ fontSize: '20px' }}>{getProjectIcon(project.project_type)}</span>
                </Box>
                <Box sx={{ flex: 1 }}>
                  {/* Línea principal: nombre del proyecto */}
                  <Box display="flex" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {project.name}
                    </Typography>
                    <Chip 
                      label={getProjectTypeLabel(project.project_type)}
                      size="small"
                      color={getProjectTypeColor(project.project_type)}
                      variant="outlined"
                      sx={{ fontSize: '0.75rem', height: '24px' }}
                    />
                    {project.is_public && (
                      <Chip 
                        label="Público"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', height: '24px' }}
                      />
                    )}
                  </Box>
                  {/* Línea secundaria: estadísticas */}
                  <Box display="flex" alignItems="center" gap={2}>
                    <Chip
                      label={`${project.measurements_count.toLocaleString()} mediciones`}
                      size="small"
                      variant="filled"
                      color="primary"
                      sx={{ fontSize: '0.7rem', height: '20px', fontWeight: 'medium' }}
                    />
                    {project.last_measurement_date && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Última: {formatLastMeasurementDate(project.last_measurement_date)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

    </Box>
  );
};
