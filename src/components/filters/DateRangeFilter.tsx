import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  Paper,
  Button,
  Popover,
  IconButton,
  Chip,
  Divider,
  Stack
} from '@mui/material';
import {
  CalendarToday,
  DateRange as DateRangeIcon,
  Clear,
  Today,
  AccessTime
} from '@mui/icons-material';

interface DateRangeFilterProps {
  startDate: Date;
  endDate: Date;
  onChange: (startDate: Date, endDate: Date) => void;
  label?: string;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onChange,
  label = "Rango Temporal"
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const quickRanges = [
    { 
      label: 'Hoy', 
      icon: '',
      getValue: (): [Date, Date] => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        return [start, end];
      }
    },
    { 
      label: 'Última semana', 
      icon: '',
      getValue: (): [Date, Date] => {
        const end = new Date();
        const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        return [start, end];
      }
    },
    { 
      label: 'Último mes', 
      icon: '',
      getValue: (): [Date, Date] => {
        const end = new Date();
        const start = new Date(end.getFullYear(), end.getMonth() - 1, end.getDate());
        return [start, end];
      }
    },
    { 
      label: 'Últimos 3 meses', 
      icon: '',
      getValue: (): [Date, Date] => {
        const end = new Date();
        const start = new Date(end.getFullYear(), end.getMonth() - 3, end.getDate());
        return [start, end];
      }
    },
    { 
      label: 'Último año', 
      icon: '',
      getValue: (): [Date, Date] => {
        const end = new Date();
        const start = new Date(end.getFullYear() - 1, end.getMonth(), end.getDate());
        return [start, end];
      }
    },
    { 
      label: 'Todo el período', 
      icon: '',
      getValue: (): [Date, Date] => [new Date('2020-01-01'), new Date()]
    },
  ];

  const formatDateRange = () => {
    const start = startDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    const end = endDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return `${start} - ${end}`;
  };

  const getDaysDifference = () => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleQuickRange = (getValue: () => [Date, Date]) => {
    const [start, end] = getValue();
    onChange(start, end);
    handleClose();
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const newDate = new Date(value);
    
    if (field === 'start') {
      // Establecer hora al inicio del día
      newDate.setHours(0, 0, 0, 0);
      if (newDate <= endDate) {
        onChange(newDate, endDate);
      }
    } else {
      // Establecer hora al final del día
      newDate.setHours(23, 59, 59, 999);
      if (newDate >= startDate) {
        onChange(startDate, newDate);
      }
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Box>
      <Paper 
        elevation={2} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: '#E4EEFA',
        }}
      >
        <Button
          onClick={handleClick}
          variant="text"
          fullWidth
          size="large"
          sx={{
            justifyContent: 'flex-start',
            py: 2,
            px: 3,
            textAlign: 'left',
            backgroundColor: '#E4EEFA',
            '&:hover': {
              backgroundColor: '#d5e3f7',
            },
            textTransform: 'none',
            borderRadius: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <CalendarToday sx={{ mr: 2, color: 'primary.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" fontWeight={500} sx={{ color: '#0751A4' }}>
                {formatDateRange()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getDaysDifference() === 1 ? '1 día' : `${getDaysDifference()} días`} • Click para cambiar
              </Typography>
            </Box>
          </Box>
        </Button>

        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: { 
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid',
              borderColor: 'divider',
              minWidth: 420,
              backgroundColor: '#E4EEFA',
            }
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              mb: 2,
              color: '#0751A4'
            }}>
              <CalendarToday color="primary" />
              Seleccionar Rango de Fechas
            </Typography>
            
            {/* Información del rango actual */}
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                mb: 3, 
                backgroundColor: '#d5e3f7',
                borderColor: 'primary.200'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccessTime color="primary" fontSize="small" />
                <Typography variant="subtitle2" sx={{ color: '#0751A4' }}>
                  Rango actual: {formatDateRange()}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Período de {getDaysDifference()} {getDaysDifference() === 1 ? 'día' : 'días'}
              </Typography>
            </Paper>
            
            {/* Rangos rápidos */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#0751A4' }}>
                Rangos rápidos
              </Typography>
              <Grid container spacing={1}>
                {quickRanges.map((range, index) => (
                  <Grid item xs={6} key={index}>
                    <Chip
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <span>{range.icon}</span>
                          <span>{range.label}</span>
                        </Box>
                      }
                      onClick={() => handleQuickRange(range.getValue)}
                      variant="outlined"
                      size="medium"
                      sx={{
                        width: '100%',
                        py: 1,
                        '&:hover': {
                          bgcolor: 'primary.50',
                          borderColor: 'primary.main',
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Campos de fecha personalizados */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#0751A4' }}>
                Fechas personalizadas
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    type="date"
                    label="Fecha inicio"
                    value={formatDateForInput(startDate)}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ 
                      max: formatDateForInput(endDate),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    type="date"
                    label="Fecha fin"
                    value={formatDateForInput(endDate)}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ 
                      min: formatDateForInput(startDate),
                      max: formatDateForInput(new Date()),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Botones de acción */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button 
                onClick={() => {
                  onChange(new Date('2020-01-01'), new Date());
                }}
                variant="outlined"
                size="small"
                startIcon={<Clear />}
                sx={{ borderRadius: 2 }}
              >
                Limpiar
              </Button>
              <Button 
                onClick={handleClose} 
                variant="contained"
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Aplicar
              </Button>
            </Stack>
          </Box>
        </Popover>
      </Paper>
    </Box>
  );
};

export default DateRangeFilter;
