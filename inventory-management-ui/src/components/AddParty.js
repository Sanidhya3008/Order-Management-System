import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Snackbar, Alert, Paper, Grid, Box } from '@mui/material';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const AddParty = () => {
  const [party, setParty] = useState({
      firmName: '',
      firmAddress: '',
      firmCityState: '',
      contactPerson: '',
      phoneNumber: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
      }
  }, [navigate]);

  const handleChange = (e) => {
      setParty({ ...party, [e.target.name]: e.target.value });
      setErrors({ ...errors, [e.target.name]: '' });
  };

  const validateForm = () => {
    let tempErrors = {};

    // Phone number validation
    if (!/^\d{10}$/.test(party.phoneNumber)) {
        tempErrors.phoneNumber = 'Phone number must be 10 digits';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(validateForm()){
      try {
          const response = await api.post('/parties', party);
          console.log('Party added successfully:', response.data);
          setSnackbar({ open: true, message: 'Party added successfully', severity: 'success' });
          setParty({ firmName: '', firmAddress: '', firmCityState: '', contactPerson: '', phoneNumber: '' });
      } catch (error) {
          console.error('Error adding party:', error.response?.data || error.message);
          setSnackbar({ open: true, message: `Failed to add Party: ${error.response?.data?.message || error.message}`, severity: 'error' });
      }
    }
    else {
      setSnackbar({ open: true, message: "Phone number must be 10 digits", severity: 'error' });
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
    <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" align="center" gutterBottom>
            <strong>Add New Party</strong>
        </Typography>
        <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        name="firmName"
                        label="Firm Name"
                        value={party.firmName}
                        onChange={handleChange}
                        required
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        name="firmAddress"
                        label="Firm Address"
                        value={party.firmAddress}
                        onChange={handleChange}
                        required
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        name="firmCityState"
                        label="Firm City and State"
                        value={party.firmCityState}
                        onChange={handleChange}
                        required
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        name="contactPerson"
                        label="Contact Person"
                        value={party.contactPerson}
                        onChange={handleChange}
                        required
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        name="phoneNumber"
                        label="Phone Number"
                        value={party.phoneNumber}
                        onChange={handleChange}
                        required
                        variant="outlined"
                    />
                </Grid>
            </Grid>
            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    sx={{ width: '50%', py: 1 }}
                >
                    Add Party
                </Button>
            </Box>
        </form>
    </Paper>
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

export default AddParty;