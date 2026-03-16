import React from 'react';
import { Card, CardContent, Box, Typography, Avatar, LinearProgress } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  gradient, 
  trend, 
  trendValue, 
  subtitle,
  progress 
}) => {
  const isPositiveTrend = trend === 'up';

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.2)',
        },
      }}
    >
      <CardContent sx={{ position: 'relative', p: 3 }}>
        {/* Icon with gradient background */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 64,
            height: 64,
            borderRadius: 3,
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.2)',
          }}
        >
          <Avatar
            sx={{
              bgcolor: 'transparent',
              width: 36,
              height: 36,
            }}
          >
            {icon}
          </Avatar>
        </Box>

        {/* Title */}
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{
            display: 'block',
            mb: 1,
            fontWeight: 600,
            letterSpacing: '0.1em',
          }}
        >
          {title}
        </Typography>

        {/* Value */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            mb: 0.5,
            color: 'text.primary',
            lineHeight: 1,
          }}
        >
          {value}
        </Typography>

        {/* Subtitle */}
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {subtitle}
          </Typography>
        )}

        {/* Trend indicator */}
        {trendValue && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
            {isPositiveTrend ? (
              <TrendingUpIcon sx={{ fontSize: 20, color: 'success.main' }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 20, color: 'error.main' }} />
            )}
            <Typography
              variant="body2"
              sx={{
                color: isPositiveTrend ? 'success.main' : 'error.main',
                fontWeight: 600,
              }}
            >
              {trendValue}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              vs last period
            </Typography>
          </Box>
        )}

        {/* Progress bar */}
        {progress !== undefined && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: gradient,
                },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
