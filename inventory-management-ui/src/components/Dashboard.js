import React, { useEffect, useState } from 'react';
import { Container, Typography, Button, Grid, Paper, Box} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Header from './Header';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: '', role: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
        }
        const response = await api.get('/auth/me');
        if (response.data) {
          setUser({ name: response.data.name, role: response.data.role });
        } else {
          setError('User role not found in response');
        } 
      } catch (error) {
        setError(error.response?.data?.message || error.message);
      }
    };

    fetchUserRole();
  }, [navigate]);

  const renderButton = (label, path, color, roles) => {
    if (roles.includes(user.role)) {
      return (
        <Grid item xs={12} sm={6} md={4}>
          <Paper elevation={3} sx={{ height: '100%' }}>
            <Button
              variant="contained"
              color={color}
              onClick={() => navigate(path)}
              fullWidth
              sx={{ height: '100%', padding: '20px', fontSize: '1.2rem', fontWeight: 'bold' }}
            >
              {label}
            </Button>
          </Paper>
        </Grid>
      );
    }
    return null;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header showProfileButton={true} isDashboard={true} />
      <Container sx={{ flexGrow: 1, py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Hi, {user.name}!
        </Typography>
        {error && <Typography color="error">Error: {error}</Typography>}
        <Typography variant="subtitle1" gutterBottom>
          Current User Role: <strong>{user.role || 'Not set'}</strong>
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {user.role === 'delivery_person' ? (
              renderButton("Assigned Deliveries", "/assigned-deliveries", "primary", ["delivery_person"])
            ) : (
              <>
                {renderButton("View Orders", "/orders", "primary", ["owner", "employee"])}
                {renderButton("Products", "/products", "secondary", ["owner", "employee"])}
                {renderButton("Create Order", "/create-order", "success", ["owner", "employee"])}
                {renderButton("Add New Product", "/add-product", "info", ["owner"])}
                {renderButton("Add New Party", "/add-party", "warning", ["owner"])}
                {renderButton("View Parties", "/view-parties", "default", ["owner", "employee"])}
                {renderButton("Register New User", "/register-user", "error", ["owner"])}
                {renderButton("Registered Users", "/registered-users", "error", ["owner"])}
                {renderButton("Statistics", "/statistics", "error", ["owner"])}
              </>
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;