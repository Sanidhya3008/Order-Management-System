import React, { useState, useEffect } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tabs, Tab, Box, Button } from '@mui/material';
import api from '../utils/api';
import { generatePDF } from '../utils/pdfGenerator';

const AssignedDeliveries = () => {
    const [deliveries, setDeliveries] = useState({ pending: [], completed: [] });
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        const fetchDeliveries = async () => {
            try {
                const res = await api.get('/orders/assigned-deliveries');
                setDeliveries(res.data);
            } catch (error) {
                console.error('Error fetching assigned deliveries', error);
                setError('Failed to fetch assigned deliveries');
            }
        };

        fetchDeliveries();
    }, []);

    const handleDownload = () => {
        const headers = ['Party Name', 'Products', 'Location', 'Order Date'];
        const data = deliveries.pending.map(order => [
          order.party.firmName,
          order.products
            .filter(product => product.status === 'ordered')
            .map(product => `${product.productName} (${product.quantity})`)
            .join(', '),
          order.products
            .filter(product => product.status === 'ordered')
            .map(product => product.location)
            .join(', '),
          new Date(order.createdAt).toLocaleDateString()
        ]);
      
        const doc = generatePDF('Assigned Pending Deliveries', headers, data);
        doc.save('assigned_pending_deliveries.pdf');
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const renderOrdersTable = (orders) => (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Party Name</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell>Phone Number</TableCell>
                        <TableCell>Product</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Status</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {orders.map((order) => (
                        order.products.map((product, index) => (
                            <TableRow key={`${order._id}-${index}`}>
                                {index === 0 && (
                                    <>
                                        <TableCell rowSpan={order.products.length}>{order.party.firmName}</TableCell>
                                        <TableCell rowSpan={order.products.length}>{`${order.party.firmAddress}, ${order.party.firmCityState}`}</TableCell>
                                        <TableCell rowSpan={order.products.length}>{order.party.phoneNumber}</TableCell>
                                    </>
                                )}
                                <TableCell>{product.productName}</TableCell>
                                <TableCell>{product.quantity}</TableCell>
                                <TableCell>{product.location}</TableCell>
                                <TableCell>{product.status}</TableCell>
                            </TableRow>
                        ))
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    if (error) {
        return <Container><Typography color="error">{error}</Typography></Container>;
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Assigned Deliveries
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        indicatorColor="primary"
                        textColor="primary"
                    >
                        <Tab label="Pending Orders" />
                        <Tab label="Completed Orders" />
                    </Tabs>
                </Box>

                {tabValue === 0 && (
                    <>
                        <Typography variant="h6" gutterBottom>
                            Pending Orders
                        </Typography>
                        {deliveries.pending.length > 0 ? (
                            renderOrdersTable(deliveries.pending)
                        ) : (
                            <Typography align="center" color="textSecondary">
                                No pending orders
                            </Typography>
                        )}
                    </>
                )}

                {tabValue === 1 && (
                    <>
                        <Typography variant="h6" gutterBottom>
                            Completed Orders
                        </Typography>
                        {deliveries.completed.length > 0 ? (
                            renderOrdersTable(deliveries.completed)
                        ) : (
                            <Typography align="center" color="textSecondary">
                                No completed orders
                            </Typography>
                        )}
                    </>
                )}

                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Button
                        onClick={handleDownload}
                        variant="contained"
                        color="primary"
                        sx={{ width: '50%', py: 1 }}
                    >
                        Download Assigned Deliveries
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default AssignedDeliveries;