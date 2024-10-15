import React, { useState, useEffect } from 'react';
import { 
    Container, Typography, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Snackbar, Alert, InputAdornment, IconButton
} from '@mui/material';
import api from '../utils/api';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const RegisteredUsers = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [openDelete, setOpenDelete] = useState(false);
    const [password, setPassword] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/auth/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setSnackbar({ open: true, message: 'Failed to fetch users', severity: 'error' });
        }
    };

    const handleDeleteClick = (user) => {
        setSelectedUser(user);
        setOpenDelete(true);
    };

    const handleDeleteSubmit = async () => {
        try {
            await api.delete(`/auth/users/${selectedUser._id}`, { data: { password } });
            setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
            fetchUsers();
            setOpenDelete(false);
        } catch (error) {
            console.error('Error deleting user:', error);
            setSnackbar({ open: true, message: 'Failed to delete user', severity: 'error' });
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography 
                variant="h4" 
                align="center" 
                gutterBottom 
                sx={{ fontWeight: 'bold', mb: 4 }}
            >
                Registered Users
            </Typography>

            <TableContainer component={Paper} elevation={3} sx={{ mb: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Name</strong></TableCell>
                            <TableCell><strong>Email</strong></TableCell>
                            <TableCell><strong>Phone Number</strong></TableCell>
                            <TableCell><strong>Role</strong></TableCell>
                            <TableCell><strong>Location</strong></TableCell>
                            <TableCell><strong>Last Login</strong></TableCell>
                            <TableCell><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user._id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.phoneNumber}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>{user.location || 'N/A'}</TableCell>
                                <TableCell>{user.lastLogin || 'Never'}</TableCell>
                                <TableCell>
                                    <Button 
                                        onClick={() => handleDeleteClick(user)} 
                                        variant="outlined" 
                                        color="error" 
                                        size="small" 
                                        sx={{ textTransform: 'none' }}
                                    >
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
                <DialogTitle>Delete User</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete this user? This action cannot be undone.</Typography>
                    <TextField
                        fullWidth
                        type={showPassword ? 'text' : 'password'}
                        label="Enter your password to confirm"
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
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
                    <Button onClick={handleDeleteSubmit} color="error">Delete</Button>
                </DialogActions>
            </Dialog>

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

export default RegisteredUsers;