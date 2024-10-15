import React, { useState, useEffect, useCallback } from 'react';
import { 
    Container, 
    Typography, 
    Table, CircularProgress,
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper,
    Tabs, Select,
    Tab, InputLabel,
    Button,
    TextField,
    MenuItem,
    FormControl,
    Grid, Box,
    useMediaQuery,
    useTheme
} from '@mui/material';
import api from '../utils/api';
import OrderDetails from './OrderDetails';
import { generatePDF } from '../utils/pdfGenerator';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [userRole, setUserRole] = useState('');
    const [userLocation, setUserLocation] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [productLocation, setProductLocation] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [locations] = useState(['Mill', 'Godown']);

    const theme = useTheme();
    const isSmScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const isMdScreen = useMediaQuery(theme.breakpoints.down('md'));

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/orders');
            setOrders(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            setUserRole(localStorage.getItem('userRole'));
            if(localStorage.getItem('userRole') === 'employee') {
                setUserLocation(localStorage.getItem('userLocation'));
            }
        } catch (error) {
            console.log(`Error in fetching the orders ${error}`);
        } finally {
            setIsLoading(false);
        }
    }, []);
   
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const filterOrders = useCallback(() => {
        let result = orders.filter(order => {
            // Filter by status (pending/completed)
            const statusMatch = (tabValue === 0 && order.status === 'pending') || 
                                (tabValue === 1 && order.status === 'completed');

            // Filter by search term (party name or product name)
            const searchMatch = !searchTerm || 
                order.party.firmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.products.some(product => product.productName.toLowerCase().includes(searchTerm.toLowerCase()));

            // Filter by date range
            const orderDate = new Date(order.createdAt);
            orderDate.setHours(0, 0, 0, 0); // Reset time to start of day
            
            let startDateObj = null;
            let endDateObj = null;
            
            if (startDate) {
                startDateObj = new Date(startDate);
                startDateObj.setHours(0, 0, 0, 0);
            }
            
            if (endDate) {
                endDateObj = new Date(endDate);
                endDateObj.setHours(23, 59, 59, 999); // Set to end of the day
            }

            let dateMatch = true;
            if (startDateObj && endDateObj) {
                if (startDateObj.getTime() === endDateObj.getTime()) {
                    // If start and end dates are the same, match orders on that exact date
                    dateMatch = orderDate.getTime() >= startDateObj.getTime() && 
                                orderDate.getTime() <= endDateObj.getTime();
                } else {
                    dateMatch = orderDate.getTime() >= startDateObj.getTime() && 
                                orderDate.getTime() <= endDateObj.getTime();
                }
            } else if (startDateObj) {
                dateMatch = orderDate.getTime() >= startDateObj.getTime();
            } else if (endDateObj) {
                dateMatch = orderDate.getTime() <= endDateObj.getTime();
            }


            // Filter by product location
            const locationMatch = !productLocation || 
                order.products.some(product => product.location === productLocation);

            // All filters must match
            return statusMatch && searchMatch && dateMatch && locationMatch;
        });

        setFilteredOrders(result);
        setCurrentPage(1);
    }, [orders, tabValue, searchTerm, startDate, endDate, productLocation]);

    useEffect(() => {
        filterOrders();
    }, [filterOrders]);

    useEffect(() => {
        if (userRole === 'employee' && userLocation !== 'Universal') {
            setProductLocation(userLocation);
        }
    }, [userRole, userLocation]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleOrderClick = (order) => {
        setSelectedOrder(order);
        setOrderDetailsOpen(true);
    };

    const handleCloseOrderDetails = () => {
        setOrderDetailsOpen(false);
        setSelectedOrder(null);
        fetchOrders();
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleEntriesPerPageChange = (event) => {
        setEntriesPerPage(event.target.value);
        setCurrentPage(1);
    };

    const handleDownload = () => {
        const headers = ['Party Name', 'Products (Quantity)', 'Assigned To', 'Order Date'];
        const data = filteredOrders
          .filter(order => order.products.some(product => product.status === 'ordered'))
          .map(order => [
            order.party.firmName,
            order.products
              .filter(product => product.status === 'ordered')
              .map(product => `${product.productName} (${product.quantity})`)
              .join(', '),
            order.products
              .filter(product => product.status === 'ordered')
              .map(product => product.assignedTo?.name || 'Unassigned')
              .join(', '),
            new Date(order.createdAt).toLocaleDateString()
          ]);
      
        const doc = generatePDF('Pending Orders', headers, data);
        doc.save('pending_orders.pdf');
    };

    const pageCount = Math.ceil(filteredOrders.length / entriesPerPage);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    return (
        <Container>
            <Typography 
                variant="h4" 
                align="center" 
                gutterBottom 
                sx={{ my: 4 }}  // `my` sets both top and bottom margin equally
                >
                <strong>Orders</strong>
            </Typography>
            
            <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        fullWidth
                        label="Search by Party or Product"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        variant="outlined"
                        InputLabelProps={{ style: { fontSize: '1rem' } }}
                        sx={{ mb: { xs: 2, sm: 0 } }}
                    />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                    <TextField
                        fullWidth
                        label="Start Date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{
                            shrink: true,
                            style: { fontSize: '1rem' },
                        }}
                        variant="outlined"
                        sx={{ mb: { xs: 2, sm: 0 } }}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                    <TextField
                        fullWidth
                        label="End Date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{
                            shrink: true,
                            style: { fontSize: '1rem' },
                        }}
                        variant="outlined"
                        sx={{ mb: { xs: 2, sm: 0 } }}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth variant="outlined">
                        <InputLabel>Product Location</InputLabel>
                        <Select
                            value={productLocation}
                            onChange={(e) => setProductLocation(e.target.value)}
                            label="Product Location"
                            disabled={userRole === 'employee' && userLocation !== 'Universal'}
                        >
                            <MenuItem value="">All</MenuItem>
                            {locations.map((location) => (
                                <MenuItem key={location} value={location}>{location}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth variant="outlined">
                        <TextField
                            select
                            label="Entries per page"
                            value={entriesPerPage}
                            onChange={handleEntriesPerPageChange}
                            variant="outlined"
                        >
                            <MenuItem value={10}>10</MenuItem>
                            <MenuItem value={25}>25</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                        </TextField>
                    </FormControl>
                </Grid>
            </Grid>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} centered>
                    <Tab label="Pending Orders" />
                    <Tab label="Completed Orders" />
                </Tabs>
            </Box>
            
            {isLoading ? (
                <CircularProgress />
            ) : (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Party Name</TableCell>
                                <TableCell>Products</TableCell>
                                {!isSmScreen && <TableCell>Status</TableCell>}
                                {!isMdScreen && <TableCell>Created By</TableCell>}
                                <TableCell>Created At</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedOrders.map((order) => (
                                <TableRow key={order._id}>
                                    <TableCell>{order.party.firmName}</TableCell>
                                    <TableCell>{order.products.map(p => p.productName).join(", ")}</TableCell>
                                    {!isSmScreen && <TableCell>{order.status}</TableCell>}
                                    {!isMdScreen && <TableCell>{order.createdBy?.name || 'Unknown'}</TableCell>}
                                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button 
                                            onClick={() => handleOrderClick(order)} 
                                            variant="outlined"
                                            size="small"
                                            sx={{ textTransform: 'none' }}
                                        >
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>
                Showing {((currentPage - 1) * entriesPerPage) + 1} to {Math.min(currentPage * entriesPerPage, filteredOrders.length)} of {filteredOrders.length} entries
                </Typography>
                <Box>
                <Button 
                    onClick={() => setCurrentPage(prev => prev - 1)} 
                    disabled={currentPage === 1} 
                    sx={{ mr: 1 }}
                >
                    Previous
                </Button>
                <Button 
                    onClick={() => setCurrentPage(prev => prev + 1)} 
                    disabled={currentPage === pageCount}
                >
                    Next
                </Button>
                </Box>
            </Box>

            {selectedOrder && (
                <OrderDetails
                    open={orderDetailsOpen}
                    handleClose={handleCloseOrderDetails}
                    orderId={selectedOrder._id}
                    userRole={userRole}
                    userLocation={userLocation}
                    onOrderUpdate={fetchOrders}
                />
            )}

            <Button 
                onClick={handleDownload} 
                variant="contained" 
                color="primary" 
                sx={{ mt: 3 }}
            >
                Download Pending Orders
            </Button>
        </Container>
    );
};

export default Orders;