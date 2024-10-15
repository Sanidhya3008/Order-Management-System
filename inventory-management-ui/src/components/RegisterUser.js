import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, MenuItem, FormControl, InputLabel, Select, IconButton, InputAdornment, Snackbar, Alert } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { handleApiError } from '../utils/errorHandler';

const RegisterUser = () => {
    const [user, setUser] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'employee',
        location: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
        }
    }, [navigate]);

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const validateForm = () => {
        let tempErrors = {};

        if (!user.name.trim()) { tempErrors.name = 'Name is required' };
        
        // Email validation
        if (!/\S+@\S+\.\S+/.test(user.email)) {
            tempErrors.email = 'Invalid email address';
        }

        // Phone number validation
        if (!/^\d{10}$/.test(user.phoneNumber)) {
            tempErrors.phoneNumber = 'Phone number must be 10 digits';
        }

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if(validateForm()) {
            setIsLoading(true);
            try {
                await api.post('/auth/register-by-owner', user);
                setSnackbar({ open: true, message: 'User registered successfully', severity: 'success' });
                //alert('User registered successfully. An email with credentials has been sent to the user.');
                setUser({ name: '', email: '', phoneNumber: '', password: '', role: 'employee', location: '' });
            } catch (error) {
                handleApiError(error, setSnackbar);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4, p: 4, boxShadow: 3, borderRadius: 2 }}>
            <Typography 
                variant="h4" 
                align="center" 
                gutterBottom 
                sx={{ fontWeight: 'bold', mb: 4 }}
            >
                Register New User
            </Typography>

            <form onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    margin="normal"
                    name="name"
                    label="Name"
                    variant="outlined"
                    value={user.name}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    name="email"
                    label="Email"
                    type="email"
                    variant="outlined"
                    value={user.email}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    name="phoneNumber"
                    label="Phone Number"
                    variant="outlined"
                    value={user.phoneNumber}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    name="password"
                    label="Temporary Password"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={user.password}
                    onChange={handleChange}
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
                    sx={{ mb: 2 }}
                />
                <FormControl fullWidth variant="outlined" margin="normal" sx={{ mb: 2 }}>
                    <InputLabel>Role</InputLabel>
                    <Select
                        name="role"
                        value={user.role}
                        onChange={handleChange}
                        label="Role"
                        required
                    >
                        <MenuItem value="owner">Owner</MenuItem>
                        <MenuItem value="employee">Employee</MenuItem>
                        <MenuItem value="delivery_person">Delivery Person</MenuItem>
                    </Select>
                </FormControl>

                {user.role === 'employee' && (
                    <FormControl fullWidth variant="outlined" margin="normal" sx={{ mb: 2 }}>
                        <InputLabel>Location</InputLabel>
                        <Select
                            name="location"
                            value={user.location}
                            onChange={handleChange}
                            label="Location"
                            required
                        >
                            <MenuItem value="Mill">Mill</MenuItem>
                            <MenuItem value="Godown">Godown</MenuItem>
                            <MenuItem value="Universal">Universal</MenuItem>
                        </Select>
                    </FormControl>
                )}

                <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    sx={{ py: 1.5, fontSize: '1rem', mt: 3 }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Registering...' : 'Register User'}
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
    );
};

export default RegisterUser;