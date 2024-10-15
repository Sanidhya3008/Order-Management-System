import React, { useState, useEffect, useCallback } from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    Typography, 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableRow,
    TextField,
    IconButton,
    Grid,
    Box,
    TableContainer,
    Paper,
    useMediaQuery,
    useTheme,
    Autocomplete,
    Snackbar,
    Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import api from '../utils/api';
import { useLocations } from '../contexts/LocationContext';

const OrderDetails = ({ open, handleClose, orderId, userRole, userLocation, onOrderUpdate }) => {
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });
    const [parties, setParties] = useState([]);
    const [products, setProducts] = useState([]);
    const [deliveryPersons, setDeliveryPersons] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const { locations, addLocation } = useLocations();
    const [errors, setErrors] = useState({});
    const [loadingProductId, setLoadingProductId] = useState(null);

    const theme = useTheme();
    const isSmScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const canEditOrder = userRole === 'owner' || (userRole === 'employee' && userLocation === 'Universal');
    const canCompleteOrder = canEditOrder;

    const fetchOrderDetails = useCallback(async () => {
        if (orderId) {
            setIsLoading(true);
            setError(null);
            try {
                const [orderResponse, partiesResponse, productsResponse, deliveryPersonsResponse] = await Promise.all([
                    api.get(`/orders/${orderId}`),
                    api.get('/parties'),
                    api.get('/products'),
                    api.get('/users/delivery-persons')
                ]);
                setOrder(orderResponse.data);
                setParties(partiesResponse.data);
                setProducts(productsResponse.data);
                setDeliveryPersons(deliveryPersonsResponse.data);
            } catch (error) {
                console.error('Error fetching order details:', error);
                setError('Failed to fetch order details. Please try again.');
            } finally {
                setIsLoading(false);
            }
        }
    }, [orderId]);

    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

    const handlePartyChange = (event, newValue) => {
        if (newValue) {
            setOrder({ ...order, party: newValue });
            setErrors({ ...errors, party: null });
        } else {
            setOrder({ ...order, party: null });
        }
    };

    const handleProductChange = (index, field, value) => {
        const updatedProducts = [...order.products];
        if (updatedProducts[index].status === 'shipped') {
            return;
        }
        if (field === 'product' && value) {
            updatedProducts[index] = { 
                ...value, 
                quantity: updatedProducts[index].quantity, 
                status: updatedProducts[index].status, 
                assignedTo: updatedProducts[index].assignedTo 
            };
        } else if (field === 'assignedTo') {
            updatedProducts[index].assignedTo = value ? value._id : null;
        } else if (field !== 'product' && field !== 'assignedTo') {
            updatedProducts[index][field] = value;
        }
        setOrder({ ...order, products: updatedProducts });
        setErrors(prev => ({ ...prev, [`${field}-${index}`]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        order.products.forEach((product, index) => {
            if (!product.productName) newErrors[`productName-${index}`] = 'Product name is required';
            if (!product.quantity) newErrors[`quantity-${index}`] = 'Quantity is required';
            if (!product.rate) newErrors[`rate-${index}`] = 'Rate is required';
            if (!product.location) newErrors[`location-${index}`] = 'Location is required';
            //if (!product.assignedTo) newErrors[`assignedTo-${index}`] = 'Assigned To is required';
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLocationChange = (index, newValue) => {
        if (newValue && !locations.includes(newValue)) {
          addLocation(newValue);
        }
        handleProductChange(index, 'location', newValue);
      };

    const handleAddProduct = () => {
        const newProduct = { productName: '', quantity: 0, rate: 0, status: 'ordered', assignedTo: null };
        setOrder({ ...order, products: [...order.products, newProduct] });
    };

    const handleRemoveProduct = (index) => {
        if (order.products[index].status === 'shipped') {
            setSnackbar({ open: true, message: 'Cannot remove shipped products', severity: 'warning' });
            return;
        }
        setConfirmDialog({ 
            open: true, 
            action: () => {
                const updatedProducts = order.products.filter((_, i) => i !== index);
                setOrder({ ...order, products: updatedProducts });
                setConfirmDialog({ open: false, action: null });
                
                // Check if this was the last product
                if (updatedProducts.length === 0) {
                    setSnackbar({ open: true, message: 'All products removed. Order will be deleted upon saving.', severity: 'warning' });
                }
            }
        });
    };

    const handleProductShip = useCallback(async (product, index) => {
        setLoadingProductId(product._id);
        try {
            await api.put(`/orders/${orderId}/ship-product/${product._id}`, {
                productName: product.productName,
                quantity: product.quantity,
                rate: product.rate,
                location: product.location
            });
            
            setOrder(prevOrder => {
                const newProducts = [...prevOrder.products];
                newProducts[index] = { ...newProducts[index], status: 'shipped' };
                return { ...prevOrder, products: newProducts };
            });

            onOrderUpdate();
        } catch (error) {
            console.error('Error updating product status:', error);
            setSnackbar({ open: true, message: 'Failed to update product status. Please try again.', severity: 'error' });
        } finally {
            setLoadingProductId(null);
        }
    }, [orderId, onOrderUpdate]);


    const handleSaveChanges = async () => {
        if (!validateForm()) {
            setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
            return;
        }

        try {
            if (order.products.length === 0) {
                await handleDeleteOrder();
                return;
            }
    
            const updatedOrder = { 
                ...order, 
                party: order.party._id, // Send only the party ID
                products: order.products.map(p => ({
                    _id: p._id, // Include the product ID if it exists
                    productName: p.productName,
                    quantity: Number(p.quantity), // Ensure quantity is a number
                    rate: Number(p.rate), // Ensure rate is a number
                    status: p.status,
                    location: p.location || 'Godown',
                    assignedTo: p.assignedTo || null
                }))
            };

            const response = await api.put(`/orders/${orderId}`, updatedOrder);
            //console.log('Server response:', JSON.stringify(response.data, null, 2));
    
            setOrder(response.data);
            setIsEditing(false);
            onOrderUpdate();
            setSnackbar({ open: true, message: 'Order updated successfully', severity: 'success' });
        } catch (error) {
            console.error('Error updating order:', error);
            let errorMessage = 'Failed to update order. Please try again.';
            if (error.response) {
                console.error('Response data:', JSON.stringify(error.response.data, null, 2));
                console.error('Response status:', error.response.status);
                console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
                
                if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error.request) {
                console.error('No response received:', error.request);
                errorMessage = 'No response received from server. Please check your connection.';
            } else {
                console.error('Error setting up request:', error.message);
                errorMessage = 'Error setting up request. Please try again.';
            }
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        }
    };

    const handleDeleteOrder = async () => {
        try {
            await api.delete(`/orders/${orderId}`);
            setSnackbar({ open: true, message: 'Order deleted successfully', severity: 'success' });
            onOrderUpdate();
            handleClose();
        } catch (error) {
            console.error('Error deleting order:', error);
            setSnackbar({ open: true, message: 'Failed to delete order. Please try again.', severity: 'error' });
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            let endpoint;
            if (newStatus === 'pending') {
                endpoint = `/orders/pending/${orderId}`;
            } else if (newStatus === 'complete') {
                endpoint = `/orders/complete/${orderId}`;
            } else {
                throw new Error('Invalid status');
            }
    
            const response = await api.put(endpoint);
            setOrder(response.data);
            onOrderUpdate();
            setSnackbar({ open: true, message: `Order set to ${newStatus} successfully`, severity: 'success' });
        } catch (error) {
            console.error(`Error setting order to ${newStatus}:`, error);
            setSnackbar({ open: true, message: `Failed to set order to ${newStatus}. Please try again.`, severity: 'error' });
        }
    };

    if (isLoading) return <Typography>Loading...</Typography>;
    if (error) {
        return (
            <Dialog open={open} onClose={handleClose}>
                <DialogContent>
                    <Typography color="error">{error}</Typography>
                    <Button onClick={fetchOrderDetails}>Retry</Button>
                </DialogContent>
            </Dialog>
        );
    }
    if (!order) {
        return (
            <Dialog open={open} onClose={handleClose}>
                <DialogContent>
                    <Typography>No order found</Typography>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { padding: 2 } }} >
                <DialogTitle sx={{ pb: 1 }}>Order Details</DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Party Details</Typography>
                        {isEditing ? (
                            <Autocomplete
                                options={parties}
                                getOptionLabel={(option) => option.firmName}
                                value={order.party}
                                onChange={handlePartyChange}
                                renderInput={(params) => (
                                    <TextField 
                                        {...params} 
                                        label="Party Name" 
                                        required
                                        error={!!errors.party}
                                        helperText={errors.party}
                                    />
                                )}
                                fullWidth
                                sx={{ mb: 2 }}
                                filterOptions={(options, state) => {
                                    return options.filter(option => 
                                        option.firmName.toLowerCase().includes(state.inputValue.toLowerCase())
                                    ).slice(0, 5); // Limit to top 5 results
                                }}
                            />
                        ) : (
                            <>
                                <Typography>Firm Name: {order.party.firmName}</Typography>
                                <Typography>Address: {order.party.firmAddress}, {order.party.firmCityState}</Typography>
                                <Typography>Contact Person: {order.party.contactPerson}</Typography>
                                <Typography>Phone Number: {order.party.phoneNumber}</Typography>
                            </>
                        )}
                    </Box>

                    <Typography variant="h6" sx={{ mb: 2 }}>Products</Typography>
                    <TableContainer component={Paper} sx={{ maxHeight: '400px', overflowY: 'auto', borderRadius: 2 }}>
                        <Table sx={{ minWidth: 650 }} stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Product Name</TableCell>
                                    <TableCell>Quantity</TableCell>
                                    <TableCell>Rate</TableCell>
                                    <TableCell>Location</TableCell>
                                    {userRole !== 'delivery_person' &&  <TableCell>Assigned To</TableCell>}
                                    {!isSmScreen && <TableCell>Status</TableCell>}
                                    {userRole !== 'delivery_person' && order.status === 'pending' && <TableCell>Action</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {order.products.map((product, index) => (
                                    <TableRow key={index} style={{ backgroundColor: product.status === 'shipped' ? '#f0fdf4' : 'inherit' }}>
                                        <TableCell>
                                            {isEditing && product.status !== 'shipped' ? (
                                                <Autocomplete
                                                    options={products}
                                                    getOptionLabel={(option) => option.productName}
                                                    value={products.find(p => p.productName === product.productName) || null}
                                                    onChange={(event, newValue) => handleProductChange(index, 'product', newValue)}
                                                    renderInput={(params) => (
                                                        <TextField 
                                                            {...params} 
                                                            label="Product Name" 
                                                            required
                                                            error={!!errors[`productName-${index}`]}
                                                            helperText={errors[`productName-${index}`]}
                                                        />
                                                    )}
                                                    fullWidth
                                                    disabled={order.status === 'completed' || product.status === 'shipped'}
                                                    disableClearable
                                                    filterOptions={(options, state) => {
                                                        return options.filter(option => 
                                                            option.productName.toLowerCase().includes(state.inputValue.toLowerCase())
                                                        ).slice(0, 5); // Limit to top 5 results
                                                    }}
                                                />
                                            ) : (
                                                product.productName
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                type="number"
                                                value={product.quantity}
                                                onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                                                disabled={!isEditing || order.status === 'completed' || product.status === 'shipped'}
                                                required
                                                error={!!errors[`quantity-${index}`]}
                                                helperText={errors[`quantity-${index}`]}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                type="number"
                                                value={product.rate}
                                                onChange={(e) => handleProductChange(index, 'rate', e.target.value)}
                                                disabled={!isEditing || order.status === 'completed' || product.status === 'shipped'}
                                                required
                                                error={!!errors[`rate-${index}`]}
                                                helperText={errors[`rate-${index}`]}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <Autocomplete
                                                options={locations}
                                                value={product.location}
                                                onChange={(event, newValue) => handleLocationChange(index, newValue)}
                                                freeSolo
                                                renderInput={(params) => (
                                                    <TextField
                                                            {...params}
                                                            label="Pickup Location"
                                                            required
                                                            error={!!errors[`location-${index}`]}
                                                            helperText={errors[`location-${index}`]}
                                                        />
                                                    )}
                                                    disabled={product.status === 'shipped'}
                                                />
                                            ) : (
                                                product.location
                                            )}
                                        </TableCell>
                                        {userRole !== 'delivery_person' && (
                                            <TableCell>
                                                {isEditing ? (
                                                    <Autocomplete
                                                        options={deliveryPersons}
                                                        getOptionLabel={(option) => option.name}
                                                        value={deliveryPersons.find(dp => dp._id === (product.assignedTo?._id || product.assignedTo)) || null}
                                                        onChange={(event, newValue) => handleProductChange(index, 'assignedTo', newValue)}
                                                        renderInput={(params) => (
                                                            <TextField 
                                                                {...params} 
                                                                label="Assigned To" 
                                                            />
                                                        )}
                                                        fullWidth
                                                        disabled={product.status === 'shipped'}
                                                        filterOptions={(options, state) => {
                                                            return options.filter(option => 
                                                                option.name.toLowerCase().includes(state.inputValue.toLowerCase())
                                                            ).slice(0, 5); // Limit to top 5 results
                                                        }}
                                                    />
                                                ) : (
                                                    product.assignedTo ? 
                                                    (typeof product.assignedTo === 'object' ? product.assignedTo.name : 
                                                    deliveryPersons.find(dp => dp._id === product.assignedTo)?.name || 'Unknown') : 
                                                    'Not Assigned'
                                                )}
                                            </TableCell>
                                        )}
                                        {!isSmScreen && <TableCell>{product.status}</TableCell>}
                                        {userRole !== 'delivery_person' && order.status === 'pending' && (
                                            <TableCell>
                                                {!isEditing && product.status === 'ordered' && (
                                                    <Button 
                                                        variant="contained" 
                                                        color="primary" 
                                                        onClick={() => handleProductShip(product, index)}
                                                        sx={{ mr: 1 }}
                                                        disabled={(!canEditOrder && product.location !== userLocation) || loadingProductId === product._id}
                                                    >
                                                        {loadingProductId === product._id ? 'Updating...' : 'Mark as Shipped'}
                                                    </Button>
                                                )}
                                                {product.status === 'shipped' && (
                                                    <Typography color="primary">Shipped</Typography>
                                                )}
                                                {isEditing && product.status !== 'shipped' && canEditOrder && (
                                                    <IconButton onClick={() => handleRemoveProduct(index)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    
                    {isEditing && order.status === 'pending' && canEditOrder && (
                        <Button
                            startIcon={<AddIcon />}
                            onClick={handleAddProduct}
                            sx={{ mt: 2 }}
                        >
                            Add Product
                        </Button>
                    )}

                    <Grid container spacing={2} sx={{ mt: 3 }}>
                        {!isSmScreen && (
                            <Grid item xs={12} sm={4}>
                                <Typography>Order Status: {order.status}</Typography>
                            </Grid>
                        )}
                        <Grid item xs={12} sm={isSmScreen ? 6 : 4}>
                            <Typography>Created Date: {new Date(order.createdAt).toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={isSmScreen ? 6 : 4}>
                            <Typography>Created By: {order.createdBy?.name || 'Unknown'}</Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    {userRole !== 'delivery_person' && (
                        <>
                            {!isEditing && order.status === 'pending' && canEditOrder ? (
                                <Button onClick={() => setIsEditing(true)} color="primary">
                                    Make Changes
                                </Button>
                            ) : null}
                            {isEditing && order.status === 'pending' && canEditOrder ? (
                                order.products.length === 0 ? (
                                    <Button 
                                        onClick={handleDeleteOrder}  
                                        color="error"
                                    >
                                        Delete Order
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={handleSaveChanges} 
                                        color="primary"
                                    >
                                        Save Changes
                                    </Button>
                                )
                            ) : null}
                            {order.status === 'pending' && order.products.length > 0 && canCompleteOrder ? (
                                <Button 
                                    onClick={() => handleStatusChange('complete')} 
                                    color="primary"
                                >
                                    Complete Order
                                </Button>
                            ) : null}
                            {order.status === 'completed' || ( order.status === 'pending' && !canEditOrder ) ? (
                                <Button onClick={() => handleStatusChange('pending')} color="secondary">
                                    Set to Pending
                                </Button>
                            ) : null}
                        </>
                    )}
                    <Button onClick={handleClose} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, action: null })}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to remove this product?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ open: false, action: null })}>Cancel</Button>
                    <Button onClick={confirmDialog.action} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default OrderDetails;