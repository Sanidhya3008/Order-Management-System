import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Snackbar, Alert, IconButton, InputAdornment
} from '@mui/material';
import api from '../utils/api';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editedProduct, setEditedProduct] = useState({});
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const userRole = localStorage.getItem('userRole');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    } else if (userRole !== 'owner' && userRole !== 'employee') {
      navigate('/dashboard');
    } else {
      fetchProducts();
    }
  }, [navigate, userRole]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setSnackbar({ open: true, message: 'Failed to fetch products', severity: 'error' });
    }
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setEditedProduct({ description: product.description, netStock: product.netStock });
    setOpenEdit(true);
  };

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setOpenDelete(true);
  };

  const handleEditChange = (event) => {
    setEditedProduct({ ...editedProduct, [event.target.name]: event.target.value });
  };

  const handleEditSubmit = async () => {
    try {
      await api.put(`/products/${selectedProduct._id}`, editedProduct);
      setSnackbar({ open: true, message: 'Product updated successfully', severity: 'success' });
      fetchProducts();
      setOpenEdit(false);
    } catch (error) {
      console.error('Error updating product:', error);
      setSnackbar({ open: true, message: 'Failed to update product', severity: 'error' });
    }
  };

  const handleDeleteSubmit = async () => {
    try {
      await api.delete(`/products/${selectedProduct._id}`, { data: { password } });
      setSnackbar({ open: true, message: 'Product deleted successfully', severity: 'success' });
      fetchProducts();
      setOpenDelete(false);
    } catch (error) {
      console.error('Error deleting product:', error);
      setSnackbar({ open: true, message: 'Failed to delete product', severity: 'error' });
    }
  };

  return (
    <Container>
      <Typography 
          variant="h4" 
          align="center" 
          gutterBottom
          sx={{ fontWeight: 'bold', mt: 2 }}
      >
          Products
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 3, mb: 3 }}>
          <Table>
              <TableHead>
                  <TableRow>
                      <TableCell><strong>Product Name</strong></TableCell>
                      <TableCell><strong>Description</strong></TableCell>
                      <TableCell><strong>Net Stock</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
              </TableHead>
              <TableBody>
                  {products.map((product) => (
                      <TableRow key={product._id}>
                          <TableCell>{product.productName}</TableCell>
                          <TableCell>{product.description}</TableCell>
                          <TableCell>{product.netStock}</TableCell>
                          <TableCell>
                              <Button 
                                  onClick={() => handleEditClick(product)} 
                                  variant="outlined" 
                                  size="small"
                                  sx={{ textTransform: 'none', mr: 1 }}
                              >
                                  Edit
                              </Button>
                              {userRole === 'owner' && (
                                  <Button 
                                      onClick={() => handleDeleteClick(product)} 
                                      color="error" 
                                      variant="outlined" 
                                      size="small"
                                      sx={{ textTransform: 'none' }}
                                  >
                                      Delete
                                  </Button>
                              )}
                          </TableCell>
                      </TableRow>
                  ))}
              </TableBody>
          </Table>
      </TableContainer>
      
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Product: {selectedProduct?.productName}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={editedProduct.description || ''}
            onChange={handleEditChange}
            margin="normal"
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Net Stock"
            name="netStock"
            type="number"
            value={editedProduct.netStock || ''}
            onChange={handleEditChange}
            margin="normal"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)} variant="outlined">Cancel </Button>
          <Button onClick={handleEditSubmit} variant="outlined" color="primary">Save Changes</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Are you sure you want to delete {selectedProduct?.productName}? This action cannot be undone.</Typography>
          <TextField
            fullWidth
            name="password"
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
          <Button onClick={handleDeleteSubmit} color="error"  variant="contained">Delete</Button>
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

export default Products;