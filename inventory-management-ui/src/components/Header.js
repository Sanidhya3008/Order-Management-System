import React from 'react';
import { AppBar, Toolbar, Typography, Box, Container, useTheme, useMediaQuery, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Header = ({ showProfileButton = false, isDashboard = false }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <AppBar position="static" sx={{ bgcolor: '#1976d2', boxShadow: 'none' }}>
            <Container maxWidth="lg">
                <Toolbar 
                disableGutters 
                sx={{ 
                    flexDirection: isMobile ? 'column' : 'row', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    py: 1 
                }}
                >
                {/* Brand Logo and Name */}
                <Box
                    component={RouterLink}
                    to="/dashboard"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                        color: 'inherit',
                        '&:hover': {
                            opacity: 0.9,
                        },
                        flexGrow: isDashboard ? 1 : 0,
                    }}
                >
                    <Box
                        component="img"
                        src="/Brand_logo.svg"
                        alt="Brand Logo"
                        sx={{
                            height: 60,
                            mr: 2,
                            p: 1,
                            bgcolor: 'white',
                            borderRadius: '8px',
                            transition: 'all 0.3s ease-in-out',
                        }}
                    />
                    <Typography
                    variant="h5"
                    sx={{
                            fontFamily: 'Roboto Slab, serif', // Professional-looking font
                            fontWeight: 'bold',
                            color: 'white',
                            ml: isMobile ? 0 : 2,
                            mt: isMobile ? 2 : 0,
                            display: isDashboard || isMobile ? 'block' : 'none',
                            fontSize: '1.8rem', // Increased size for emphasis
                            letterSpacing: '0.05rem',
                    }}
                    >
                    Ramdayal Rameshwar Lal
                    </Typography>
                </Box>

                {/* Right-aligned Brand Name for Non-Dashboard Pages */}
                {!isDashboard && !isMobile && (
                    <Typography
                        variant="h5"
                        component={RouterLink}
                        to="/dashboard"
                        sx={{
                            flexGrow: 1,
                            color: 'white',
                            textDecoration: 'none',
                            textAlign: 'right',
                            '&:hover': {
                            opacity: 0.9,
                            },
                            fontFamily: 'Roboto Slab, serif', // Match the brand name font style
                            fontWeight: 'bold',
                            fontSize: '1.8rem',
                            letterSpacing: '0.05rem',
                        }}
                    >
                    Ramdayal Rameshwar Lal
                    </Typography>
                )}

                {/* Profile Button */}
                {showProfileButton && (
                    <Button
                        color="inherit"
                        component={RouterLink}
                        to="/profile"
                        sx={{
                            ml: 2,
                            display: 'block',
                            fontSize: '1.25rem',
                            padding: '12px 24px',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            bgcolor: 'rgba(255, 255, 255, 0.15)',
                            '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.25)',
                            },
                            transition: 'background-color 0.3s ease-in-out',
                        }}
                    >
                    My Profile
                    </Button>
                )}
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Header;