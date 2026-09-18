import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjects, type Project } from '../hooks/useProjects';
import { CircularProgress, FormControl, InputLabel, Select, MenuItem, Box, Chip, Typography } from '@mui/material';
import { useLocale } from '../utils/i18nFormat';
import { darkTokens as T } from '../theme/tokens';
import { MONO } from '../theme/theme';

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
  const { projects, loading, error } = useProjects();
  const { t } = useTranslation('filters');
  const { formatNumber, formatDate } = useLocale();

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
        return t('projectSelector.typeRadiation');
      case 'light_pollution':
        return t('projectSelector.typeLightPollution');
      default:
        return t('projectSelector.typeOther');
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
      return t('projectSelector.today');
    } else if (diffDays === 1) {
      return t('projectSelector.yesterday');
    } else if (diffDays < 30) {
      return t('projectSelector.daysAgo', { count: diffDays });
    } else if (diffDays < 365) {
      const diffMonths = Math.floor(diffDays / 30);
      return diffMonths === 1
        ? t('projectSelector.monthAgo', { count: diffMonths })
        : t('projectSelector.monthsAgo', { count: diffMonths });
    } else {
      return formatDate(date, {
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
          {t('projectSelector.loadingProjects')}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className={className}>
        <Typography variant="body2" color="error">
          {t('projectSelector.error', { message: error })}
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={className}>
      <FormControl fullWidth size="small">
        <InputLabel id="project-selector-label">{t('projectSelector.label')}</InputLabel>
        <Select
          labelId="project-selector-label"
          id="project-selector"
          value={selectedProject?.id || ''}
          label={t('projectSelector.label')}
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
              <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, bgcolor: project.is_active ? T.ok : T.textDim }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                    {project.name}
                  </Typography>
                </Box>
                <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textDim, mt: 0.25 }}>
                  {getProjectTypeLabel(project.project_type)} · {t('projectSelector.measurements', { value: formatNumber(project.measurements_count) })}
                </Typography>
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
                        label={t('projectSelector.public')}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', height: '24px' }}
                      />
                    )}
                  </Box>
                  {/* Línea secundaria: estadísticas */}
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography sx={{ fontFamily: MONO, fontSize: 11, color: T.textMid }}>
                      {t('projectSelector.measurements', { value: formatNumber(project.measurements_count) })}
                    </Typography>
                    {project.last_measurement_date && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {t('projectSelector.lastMeasurement', { date: formatLastMeasurementDate(project.last_measurement_date) })}
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
