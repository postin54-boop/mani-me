import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Fade,
  Slide,
  Avatar,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import StorefrontIcon from '@mui/icons-material/Storefront';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const slides = [
  {
    title: 'Welcome to Mani Me Admin',
    description: 'Your central hub for managing the UK to Ghana parcel delivery platform. Let\'s take a quick tour of the key features.',
    icon: <DashboardIcon sx={{ fontSize: 80 }} />,
    color: '#83C5FA',
  },
  {
    title: 'Order Management',
    description: 'Track all shipments in real-time. View pending pickups, in-transit parcels, and completed deliveries. Assign drivers and update statuses with ease.',
    icon: <LocalShippingIcon sx={{ fontSize: 80 }} />,
    color: '#10B981',
  },
  {
    title: 'Driver Network',
    description: 'Manage your UK pickup drivers and Ghana delivery drivers. View their active jobs, cash collections, and performance metrics.',
    icon: <PeopleIcon sx={{ fontSize: 80 }} />,
    color: '#F59E0B',
  },
  {
    title: 'Shop & Inventory',
    description: 'Manage the grocery shop and packaging supplies. Add products, update prices, and track inventory levels for both stores.',
    icon: <StorefrontIcon sx={{ fontSize: 80 }} />,
    color: '#EC4899',
  },
  {
    title: 'Push Notifications',
    description: 'Send targeted notifications to customers and drivers. Create promo codes and marketing campaigns to grow your business.',
    icon: <NotificationsActiveIcon sx={{ fontSize: 80 }} />,
    color: '#6366F1',
  },
];

function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [slideDirection, setSlideDirection] = useState('left');

  const handleNext = () => {
    if (currentStep < slides.length - 1) {
      setSlideDirection('left');
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setSlideDirection('right');
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('adminHasSeenOnboarding', 'true');
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const currentSlide = slides[currentStep];
  const isLastSlide = currentStep === slides.length - 1;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0B1A33 0%, #071A2C 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -150,
          right: -150,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(131, 197, 250, 0.12) 0%, transparent 70%)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -200,
          left: -200,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(131, 197, 250, 0.08) 0%, transparent 70%)',
        },
      }}
    >
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Skip Button */}
        <Button
          onClick={handleSkip}
          sx={{
            position: 'absolute',
            top: -60,
            right: 0,
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 600,
            '&:hover': {
              color: '#83C5FA',
              bgcolor: 'transparent',
            },
          }}
        >
          Skip Tour
        </Button>

        <Fade in timeout={800}>
          <Paper
            elevation={24}
            sx={{
              p: { xs: 4, md: 6 },
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Progress Stepper */}
            <Stepper 
              activeStep={currentStep} 
              alternativeLabel
              sx={{ 
                mb: 5,
                '& .MuiStepLabel-iconContainer': {
                  '& .MuiSvgIcon-root': {
                    fontSize: 28,
                  },
                },
                '& .MuiStepConnector-line': {
                  borderColor: '#E5E7EB',
                },
                '& .Mui-active .MuiStepConnector-line': {
                  borderColor: '#83C5FA',
                },
                '& .Mui-completed .MuiStepConnector-line': {
                  borderColor: '#10B981',
                },
              }}
            >
              {slides.map((slide, index) => (
                <Step key={index}>
                  <StepLabel
                    StepIconProps={{
                      sx: {
                        color: index <= currentStep ? slide.color : '#E5E7EB',
                        '&.Mui-active': { color: slide.color },
                        '&.Mui-completed': { color: '#10B981' },
                      },
                    }}
                  />
                </Step>
              ))}
            </Stepper>

            {/* Slide Content */}
            <Slide direction={slideDirection} in key={currentStep} timeout={400}>
              <Box>
                {/* Icon */}
                <Avatar
                  sx={{
                    width: 140,
                    height: 140,
                    mx: 'auto',
                    mb: 4,
                    bgcolor: `${currentSlide.color}15`,
                    color: currentSlide.color,
                    boxShadow: `0 8px 32px ${currentSlide.color}30`,
                  }}
                >
                  {currentSlide.icon}
                </Avatar>

                {/* Title */}
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: '#0B1A33',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {currentSlide.title}
                </Typography>

                {/* Description */}
                <Typography
                  variant="body1"
                  sx={{
                    color: '#6B7280',
                    maxWidth: 500,
                    mx: 'auto',
                    mb: 5,
                    lineHeight: 1.7,
                    fontSize: '1.1rem',
                  }}
                >
                  {currentSlide.description}
                </Typography>
              </Box>
            </Slide>

            {/* Navigation Buttons */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 4,
              }}
            >
              <IconButton
                onClick={handleBack}
                disabled={currentStep === 0}
                sx={{
                  bgcolor: currentStep === 0 ? 'grey.100' : 'grey.200',
                  color: currentStep === 0 ? 'grey.400' : 'grey.700',
                  '&:hover': {
                    bgcolor: 'grey.300',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'grey.100',
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>

              {/* Dots Indicator */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {slides.map((slide, index) => (
                  <Box
                    key={index}
                    onClick={() => {
                      setSlideDirection(index > currentStep ? 'left' : 'right');
                      setCurrentStep(index);
                    }}
                    sx={{
                      width: index === currentStep ? 28 : 10,
                      height: 10,
                      borderRadius: 5,
                      bgcolor: index === currentStep ? slide.color : 'grey.300',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: index === currentStep ? slide.color : 'grey.400',
                      },
                    }}
                  />
                ))}
              </Box>

              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={isLastSlide ? <CheckCircleIcon /> : <ArrowForwardIcon />}
                sx={{
                  bgcolor: isLastSlide ? '#10B981' : '#0B1A33',
                  px: 3,
                  py: 1.2,
                  borderRadius: 2,
                  fontWeight: 600,
                  boxShadow: isLastSlide
                    ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                    : '0 4px 12px rgba(11, 26, 51, 0.3)',
                  '&:hover': {
                    bgcolor: isLastSlide ? '#059669' : '#1a2d4a',
                    boxShadow: isLastSlide
                      ? '0 6px 16px rgba(16, 185, 129, 0.5)'
                      : '0 6px 16px rgba(11, 26, 51, 0.4)',
                  },
                }}
              >
                {isLastSlide ? 'Get Started' : 'Next'}
              </Button>
            </Box>
          </Paper>
        </Fade>

        {/* Footer */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 4,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          © 2026 Mani Me. UK to Ghana Parcel Delivery
        </Typography>
      </Container>
    </Box>
  );
}

export default Onboarding;
