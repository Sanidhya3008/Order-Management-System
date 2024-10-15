import React, { useState, useEffect } from 'react';
import { 
    Container, Typography, TextField, Button, Grid, CircularProgress, 
    Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert,
    InputAdornment, IconButton, Paper } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import api, { signOut } from '../utils/api';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [editedUser, setEditedUser] = useState({});
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api.get('/auth/me');
            setUser(response.data);
            setEditedUser(response.data);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            setError('Failed to fetch user profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditDialogOpen = () => {
        setEditedUser({ ...user });
        setOpenEditDialog(true);
    };

    const handleEditDialogClose = () => {
        setOpenEditDialog(false);
    };

    const handlePasswordDialogOpen = () => {
        setOpenPasswordDialog(true);
    };

    const handlePasswordDialogClose = () => {
        setOpenPasswordDialog(false);
        setNewPassword('');
        setConfirmPassword('');
        setOldPassword('');
    };

    const handleEditChange = (e) => {
        setEditedUser({ ...editedUser, [e.target.name]: e.target.value });
    };

    const handleEditSubmit = async () => {
        try {
            const response = await api.put('/auth/update-profile', { ...editedUser, password });
            setUser(response.data);
            setOpenEditDialog(false);
            setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to update profile', severity: 'error' });
        }
    };

    const handlePasswordSubmit = async () => {
        if (newPassword !== confirmPassword) {
            setSnackbar({ open: true, message: 'Passwords do not match', severity: 'error' });
            return;
        }

        try {
            await api.put('/auth/update-password', { oldPassword, newPassword });
            handlePasswordDialogClose();
            setSnackbar({ open: true, message: 'Password updated successfully', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to update password', severity: 'error' });
        }
    };

    if (isLoading) {
        return (
            <Container>
                <CircularProgress />
                <Typography>Loading user profile...</Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <Typography color="error">{error}</Typography>
                <Button onClick={fetchUserProfile}>Retry</Button>
            </Container>
        );
    }

    if (!user) {
        return (
            <Container>
                <Typography>No user profile found</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            {/* Profile Section */}
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                    My Profile
                </Typography>
                <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography><strong>Name:</strong> {user.name}</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography><strong>Email:</strong> {user.email}</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography><strong>Phone Number:</strong> {user.phoneNumber}</Typography>
                </Grid>
                </Grid>

                {/* Buttons Section */}
                <Grid container spacing={2} sx={{ mt: 3 }}>
                <Grid item xs={12} sm={6}>
                    <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ fontWeight: 'bold', padding: '10px' }}
                    onClick={handleEditDialogOpen}
                    >
                    Update Profile
                    </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    sx={{ fontWeight: 'bold', padding: '10px' }}
                    onClick={handlePasswordDialogOpen}
                    >
                    Update Password
                    </Button>
                </Grid>
                <Grid item xs={12}>
                    <Button
                    variant="contained"
                    color="error"
                    fullWidth
                    sx={{ fontWeight: 'bold', padding: '10px' }}
                    onClick={signOut}
                    >
                    Sign Out
                    </Button>
                </Grid>
                </Grid>
            </Paper>

            {/* Update Profile Dialog */}
            <Dialog open={openEditDialog} onClose={handleEditDialogClose}>
                <DialogTitle>Update Profile</DialogTitle>
                <DialogContent>
                <TextField
                    fullWidth
                    margin="normal"
                    label="Name"
                    name="name"
                    value={editedUser.name}
                    onChange={handleEditChange}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    label="Email"
                    name="email"
                    value={editedUser.email}
                    onChange={handleEditChange}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    label="Phone Number"
                    name="phoneNumber"
                    value={editedUser.phoneNumber}
                    onChange={handleEditChange}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    type={showPassword ? 'text' : 'password'}
                    label="Enter your password to confirm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                />
                </DialogContent>
                <DialogActions>
                <Button onClick={handleEditDialogClose}>Cancel</Button>
                <Button onClick={handleEditSubmit} color="primary">Save Changes</Button>
                </DialogActions>
            </Dialog>

            {/* Update Password Dialog */}
            <Dialog open={openPasswordDialog} onClose={handlePasswordDialogClose}>
                <DialogTitle>Update Password</DialogTitle>
                <DialogContent>
                <TextField
                    fullWidth
                    margin="normal"
                    type={showNewPassword ? 'text' : 'password'}
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                        <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                        >
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                        </InputAdornment>
                    ),
                    }}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    type="password"
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    type={showOldPassword ? 'text' : 'password'}
                    label="Old Password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                        <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            edge="end"
                        >
                            {showOldPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                        </InputAdornment>
                    ),
                    }}
                />
                </DialogContent>
                <DialogActions>
                <Button onClick={handlePasswordDialogClose}>Cancel</Button>
                <Button onClick={handlePasswordSubmit} color="primary">Update Password</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for Alerts */}
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

export default ProfilePage;