import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  Paper,
  Button,
  Popover,
  Chip,
  Divider,
  Stack
} from '@mui/material';
import {
  CalendarToday,
  Clear,
  AccessTime
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../../utils/i18nFormat';
import { darkTokens as T } from '../../theme/tokens';

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
}) => {
  const { t } = useTranslation('filters');
  const { formatDate } = useLocale();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const quickRanges = [
    {
      label: t('dateRange.quick.today'),
      icon: '',
      getValue: (): [Date, Date] => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        return [start, end];
      }
    },
    {
      label: t('dateRange.quick.lastWeek'),
      icon: '',
      getValue: (): [Date, Date] => {
        const end = new Date();
        const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        return [start, end];
      }
    },
    {
      label: t('dateRange.quick.lastMonth'),
      icon: '',
      getValue: (): [Date, Date] => {
        const end = new Date();
        const start = new Date(end.getFullYear(), end.getMonth() - 1, end.getDate());
        return [start, end];
      }
    },
    {
      label: t('dateRange.quick.last3Months'),
      icon: '',
      getValue: (): [Date, Date] => {
        const end = new Date();
        const start = new Date(end.getFullYear(), end.getMonth() - 3, end.getDate());
        return [start, end];
      }
    },
    {
      label: t('dateRange.quick.lastYear'),
      icon: '',
      getValue: (): [Date, Date] => {
        const end = new Date();
        const start = new Date(end.getFullYear() - 1, end.getMonth(), end.getDate());
        return [start, end];
      }
    },
    {
      label: t('dateRange.quick.allTime'),
      icon: '',
      getValue: (): [Date, Date] => [new Date('2020-01-01'), new Date()]
    },
  ];

  const formatDateRange = () => {
    const opts: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    const start = formatDate(startDate, opts);
    const end = formatDate(endDate, opts);
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
          backgroundColor: T.surface2,
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
            backgroundColor: T.surface2,
            '&:hover': {
              backgroundColor: T.surface3,
            },
            textTransform: 'none',
            borderRadius: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <CalendarToday sx={{ mr: 2, color: 'primary.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" fontWeight={500} sx={{ color: T.text }}>
                {formatDateRange()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getDaysDifference() === 1 ? t('dateRange.day') : t('dateRange.daysCount', { value: getDaysDifference() })} • {t('dateRange.clickToChange')}
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
              backgroundColor: T.surface2,
            }
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              mb: 2,
              color: T.text
            }}>
              <CalendarToday color="primary" />
              {t('dateRange.selectDateRange')}
            </Typography>
            
            {/* Información del rango actual */}
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                mb: 3, 
                backgroundColor: T.surface3,
                borderColor: T.border
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccessTime color="primary" fontSize="small" />
                <Typography variant="subtitle2" sx={{ color: T.text }}>
                  {t('dateRange.currentRange', { range: formatDateRange() })}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {getDaysDifference() === 1
                  ? t('dateRange.periodOfDay', { count: getDaysDifference() })
                  : t('dateRange.periodOfDays', { count: getDaysDifference() })}
              </Typography>
            </Paper>
            
            {/* Rangos rápidos */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: T.text }}>
                {t('dateRange.quickRanges')}
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
                          bgcolor: T.surface3,
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
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: T.text }}>
                {t('dateRange.customDates')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    type="date"
                    label={t('dateRange.startDate')}
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
                    label={t('dateRange.endDate')}
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
                {t('dateRange.clear')}
              </Button>
              <Button 
                onClick={handleClose} 
                variant="contained"
                size="small"
                sx={{ borderRadius: 2 }}
              >
                {t('dateRange.apply')}
              </Button>
            </Stack>
          </Box>
        </Popover>
      </Paper>
    </Box>
  );
};

export default DateRangeFilter;
