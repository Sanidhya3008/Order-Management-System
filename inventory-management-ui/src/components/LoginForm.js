import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box, Snackbar, Alert, InputAdornment, IconButton } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { setAuthToken } from '../utils/api';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { username, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('userRole', res.data.user.role);
            if(res.data.user.role === 'employee') {
                localStorage.setItem('userLocation', res.data.user.location);
            }
            setAuthToken(res.data.token);
            setSnackbar({ open: true, message: 'Login successful', severity: 'success' });
            //console.log('Token stored:', localStorage.getItem('token'));
            const intendedDestination = location.state?.from?.pathname || '/dashboard';
            navigate(intendedDestination, { replace: true });       
        } catch (error) {
            console.error('Login failed', error);
            setSnackbar({ open: true, message: 'Login failed. Please check your credentials.', severity: 'error' });
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                bgcolor: 'background.default',
                padding: { xs: '20px', sm: '0' },
            }}
        >
            <Box
                component="img"
                src="/Brand_logo.svg"
                alt="Brand Logo"
                sx={{
                    width: { xs: '80%', sm: '500px' },
                    height: 'auto',
                    mb: 2,
                }}
            />
            <Container 
                maxWidth="xs" 
                sx={{ 
                    mt: -6, 
                    p: 3, 
                    boxShadow: 3, 
                    borderRadius: 2, 
                    bgcolor: 'background.paper',
                    width: { xs: '100%', sm: 'auto' },
                }}
                >
                <Typography 
                    variant="h5" 
                    align="center" 
                    gutterBottom
                    sx={{ fontWeight: 'bold' }}
                >
                    Login
                </Typography>

                <form onSubmit={handleSubmit}>
                    <TextField
                    label="Email or Phone Number"
                    variant="outlined"
                    fullWidth
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    margin="normal"
                    required
                    InputLabelProps={{ style: { fontSize: '1rem' } }}
                    sx={{ mb: 2 }}
                    />

                    <TextField
                    label="Password"
                    variant="outlined"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    margin="normal"
                    required
                    InputProps={{
                        endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                        ),
                    }}
                    InputLabelProps={{ style: { fontSize: '1rem' } }}
                    sx={{ mb: 2 }}
                    />

                    <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    type="submit" 
                    sx={{ py: 1.5, fontSize: '1rem', fontWeight: 'bold' }}
                    >
                    Login
                    </Button>
                </form>

                <Snackbar 
                    open={snackbar.open} 
                    autoHideDuration={6000} 
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </Box>
    );
};

export default LoginForm;