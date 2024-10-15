import React from 'react';
import { Box, Typography, Link } from '@mui/material';

const Footer = () => {
  return (
    <Box 
        sx={{ 
            bgcolor: 'background.paper', 
            py: 2,   // Reduced padding
            borderTop: '1px solid #ddd', 
            mt: 'auto' 
        }}
        >
        <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
            {'© '}{new Date().getFullYear()}{' '}
            <Link 
            color="primary" 
            href="mailto:sanidhyamanglunia@gmail.com" 
            underline="hover"
            >
            Sanidhya Manglunia
            </Link>
        </Typography>

        <Typography variant="body2" color="text.secondary" align="center">
            <Link href="tel:+916375907153" color="primary" underline="hover">
            +91-6375907153
            </Link>{' | '}
            <Link href="mailto:sanidhyamanglunia@gmail.com" color="primary" underline="hover">
            sanidhyamanglunia@gmail.com
            </Link>
        </Typography>
    </Box>
  );
};

export default Footer;