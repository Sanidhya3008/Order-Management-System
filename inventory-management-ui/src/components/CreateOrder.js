import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Autocomplete, Grid, IconButton, Snackbar, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useLocations } from '../contexts/LocationContext';
import { handleApiError } from '../utils/errorHandler';

const CreateOrder = () => {
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const { locations, addLocation } = useLocations();
  const [order, setOrder] = useState({
    party: null,
    products: [{ productName: '', quantity: '', rate: '', location: 'Godown', assignedTo: null}]
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
        }
        const partiesResponse = await api.get('/parties');
        const productsResponse = await api.get('/products');
        const deliveryPersonsResponse = await api.get('/users/delivery-persons');
        setParties(partiesResponse.data);
        setProducts(productsResponse.data);
        setDeliveryPersons(deliveryPersonsResponse.data);
      } catch (error) {
        console.error('Error fetching data', error);
      }
    };
    fetchData();
  }, [navigate]);

  const handlePartyChange = (event, value) => {
    if (value) {
      setOrder({ ...order, party: value });
      setErrors({ ...errors, party: null });
    } else {
      setOrder({ ...order, party: null });
    }
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...order.products];
    if (field === 'productName' && value) {
        updatedProducts[index] = { ...updatedProducts[index], productName: value.productName };
    } else if (field === 'assignedTo') {
        updatedProducts[index].assignedTo = value ? value._id : null;
    } else if (field !== 'productName' && field !== 'assignedTo') {
        updatedProducts[index][field] = value;
    }
    setOrder({ ...order, products: updatedProducts });
    setErrors(prev => ({ ...prev, [`${field}-${index}`]: '' }));
  };
  
  const handleLocationChange = (index, newValue) => {
    if (newValue && !locations.includes(newValue)) {
      addLocation(newValue);
    }
    handleProductChange(index, 'location', newValue);
  };

  const addProduct = () => {
    setOrder({
      ...order,
      products: [...order.products, { productName: '', quantity: '', rate: '', location: 'Godown', assignedTo: null }]
    });
  };

  const removeProduct = (index) => {
    const updatedProducts = order.products.filter((_, i) => i !== index);
    setOrder({ ...order, products: updatedProducts });
  };

  const validateForm = () => {
    let tempErrors = {};

    if (!order.party) tempErrors.party = 'Please select a party';

    order.products.forEach((product, index) => {
      if (!product.productName) tempErrors[`productName-${index}`] = 'Product name is required';
      if (!product.quantity || product.quantity <= 0) tempErrors[`quantity-${index}`] = 'Quantity must be greater than 0';
      if (!product.rate || product.rate <= 0) tempErrors[`rate-${index}`] = 'Rate must be greater than 0';
      if (!product.location) tempErrors[`location-${index}`] = 'Location is required';
    });

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        const response = await api.post('/orders/create', order);
        console.log('Order created successfully:', response.data);
        setSnackbar({ open: true, message: 'Order Created Successfully', severity: 'success' });
        setOrder({
          party: null,
          products: [{ productName: '', quantity: '', rate: '', assignedTo: null }],
        });
      } catch (error) {
        handleApiError(error, setSnackbar);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom style={{ fontWeight: 'bold', marginTop: '20px' }}>
        Create Order
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Autocomplete
          options={parties}
          getOptionLabel={(option) => option.firmName}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Party Name"
              variant="outlined"
              required
              error={!!errors.party}
              helperText={errors.party}
            />
          )}
          value={order.party}
          onChange={handlePartyChange}
          fullWidth
          margin="normal"
          disableClearable
            filterOptions={(options, state) => {
                return options.filter(option => 
                  option.firmName.toLowerCase().includes(state.inputValue.toLowerCase())
              ).slice(0, 5); // Limit to top 5 results
          }}
        />

        {order.party && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom style={{ fontWeight: 'bold', marginTop: '20px' }}>
                Party Details
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Address"
                value={order.party.firmAddress}
                InputProps={{ readOnly: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City and State"
                value={order.party.firmCityState}
                InputProps={{ readOnly: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Person"
                value={order.party.contactPerson}
                InputProps={{ readOnly: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={order.party.phoneNumber}
                InputProps={{ readOnly: true }}
                variant="outlined"
              />
            </Grid>
          </Grid>
        )}

        <Typography variant="h6" style={{ fontWeight: 'bold', marginTop: '30px' }}>
          Products
        </Typography>

        {order.products.map((product, index) => (
          <Grid container spacing={3} key={index} alignItems="center" style={{ marginBottom: '15px' }}>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                options={products}
                getOptionLabel={(option) => option.productName}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Product Name" 
                    variant="outlined" 
                    required
                    error={!!errors[`productName-${index}`]}
                    helperText={errors[`productName-${index}`]}
                  />
                )}
                value={products.find(p => p.productName === product.productName) || null}
                onChange={(event, value) =>
                  handleProductChange(index, 'productName', value)
                }
                fullWidth
                filterOptions={(options, state) => {
                  return options.filter(option => 
                    option.productName.toLowerCase().includes(state.inputValue.toLowerCase())
                ).slice(0, 5); // Limit to top 5 results
              }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Quantity/Weight"
                value={product.quantity}
                onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                variant="outlined"
                required
                error={!!errors[`quantity-${index}`]}
                helperText={errors[`quantity-${index}`]}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Rate"
                value={product.rate}
                onChange={(e) => handleProductChange(index, 'rate', e.target.value)}
                variant="outlined"
                required
                error={!!errors[`rate-${index}`]}
                helperText={errors[`rate-${index}`]}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                options={locations}
                value={product.location}
                onChange={(event, newValue) => handleLocationChange(index, newValue)}
                freeSolo
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Pickup Location" 
                    variant="outlined" 
                    required
                    error={!!errors[`location-${index}`]}
                    helperText={errors[`location-${index}`]}
                  />
                )}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                options={deliveryPersons}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => <TextField {...params} label="Assigned To" variant="outlined" />}
                value={deliveryPersons.find(dp => dp._id === product.assignedTo) || null}
                onChange={(event, value) => handleProductChange(index, 'assignedTo', value)}
                fullWidth
                filterOptions={(options, state) => {
                  return options.filter(option => 
                    option.name.toLowerCase().includes(state.inputValue.toLowerCase())
                ).slice(0, 5); // Limit to top 5 results
              }}
              />
            </Grid>
            <Grid item xs={1}>
              <IconButton onClick={() => removeProduct(index)} disabled={order.products.length === 1}>
                <DeleteIcon color="secondary" />
              </IconButton>
            </Grid>
          </Grid>
        ))}

        <Button
          onClick={addProduct}
          variant="outlined"
          style={{ marginTop: '10px', fontWeight: 'bold' }}
        >
          Add Product
        </Button>

        {errors.products && <Typography color="error">{errors.products}</Typography>}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading}
            style={{ fontWeight: 'bold', marginTop: '20px' }}
          >
            {isLoading ? 'Creating Order...' : 'Create Order'}
          </Button>
        </div>
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

export default CreateOrder;