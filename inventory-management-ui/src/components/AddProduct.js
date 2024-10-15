import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Snackbar, Alert, Paper, Grid, Box } from '@mui/material';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const AddProduct = () => {
  const [product, setProduct] = useState({
    productName: '',
    description: '',
    netStock: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/products', product);
      console.log('Product added successfully:', response.data);
      setSnackbar({ open: true, message: 'Product added successfully', severity: 'success' });
      setProduct({ productName: '', description: '', netStock: '' });
    } catch (error) {
      console.error('Error adding product:', error.response?.data || error.message);
      setSnackbar({ open: true, message: `Failed to add product: ${error.response?.data?.message || error.message}`, severity: 'error' });
    }
  };

  return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h4" align="center" gutterBottom>
                <strong>Add New Product</strong>
            </Typography>
            <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid item xs={12}> 
                        <TextField
                            fullWidth
                            name="productName"
                            label="Product Name"
                            value={product.productName}
                            onChange={handleChange}
                            required
                            variant="outlined"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            name="description"
                            label="Description"
                            value={product.description}
                            onChange={handleChange}
                            multiline
                            rows={4}
                            variant="outlined"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            name="netStock"
                            label="Net Stock"
                            type="number"
                            value={product.netStock}
                            onChange={handleChange}
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
                        Add Product
                    </Button>
                </Box>
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
        </Paper>
    </Container>
  );
};

export default AddProduct;