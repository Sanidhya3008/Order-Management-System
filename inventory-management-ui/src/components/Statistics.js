import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Grid, Paper, CircularProgress, Button, Snackbar, Alert } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, BarChart } from 'recharts';
import api from '../utils/api';

const Statistics = () => {
    const [stats, setStats] = useState(null);
    const [orderTimeSeries, setOrderTimeSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
          const [statsResponse, timeSeriesResponse] = await Promise.all([
            api.get('/statistics/latest'),
            api.get('/statistics/order-time-series')
          ]);
          setStats(statsResponse.data);
          setOrderTimeSeries(timeSeriesResponse.data);
        } catch (error) {
          console.error('Error fetching statistics:', error);
          setError('Failed to fetch statistics. Please try again.');
        } finally {
          setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdateStatistics = async () => {
        setUpdating(true);
        setError(null);
        try {
            await api.post('/statistics/update');
            await fetchData(); // Refresh all data after update
            setSnackbar({ open: true, message: 'Statistics updated successfully', severity: 'success' });
        } catch (error) {
            console.error('Error updating statistics:', error);
            setError('Failed to update statistics. Please try again.');
            setSnackbar({ open: true, message: 'Failed to update statistics', severity: 'error' });
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <Container>
                <CircularProgress />
                <Typography>Loading statistics...</Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <Typography color="error">{error}</Typography>
                <Button onClick={fetchData} variant="contained" color="primary" style={{ marginTop: '20px' }}>
                Retry
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, p: 4, boxShadow: 3, borderRadius: 2 }}>
            <Typography 
                variant="h4" 
                align="center" 
                gutterBottom 
                sx={{ fontWeight: 'bold', mb: 4 }}
            >
                Statistics
            </Typography>

            <Button
                variant="contained"
                color="primary"
                onClick={handleUpdateStatistics}
                disabled={updating}
                sx={{ mb: 4 }}
            >
                {updating ? 'Updating...' : 'Update Statistics'}
            </Button>

            {stats && (
                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Most Ordered Product</Typography>
                            <Typography>{stats.mostOrderedProduct?.productName} ({stats.mostOrderedProduct?.orderCount} orders)</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Least Ordered Product</Typography>
                            <Typography>{stats.leastOrderedProduct?.productName} ({stats.leastOrderedProduct?.orderCount} orders)</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Number of Orders</Typography>
                            <Typography>{stats.numberOfOrders}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Number of Products</Typography>
                            <Typography>{stats.numberOfProducts}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Number of Parties</Typography>
                            <Typography>{stats.numberOfParties}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Party with Most Orders</Typography>
                            <Typography>{stats.partyWithMostOrders?.partyName} ({stats.partyWithMostOrders?.orderCount} orders)</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Party with Least Orders</Typography>
                            <Typography>{stats.partyWithLeastOrders?.partyName} ({stats.partyWithLeastOrders?.orderCount} orders)</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Average Order Value</Typography>
                            <Typography>₹{stats.averageOrderValue.toFixed(2)}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Total Revenue</Typography>
                            <Typography>₹{stats.totalRevenue.toFixed(2)}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Product Order Counts</Typography>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart
                                    data={stats.productOrderCounts}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="productName" type="category" width={150} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="orderCount" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {orderTimeSeries.length > 0 && (
                <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Order Time Series</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={orderTimeSeries}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="_id" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="count" stroke="#8884d8" />
                        </LineChart>
                    </ResponsiveContainer>
                </Paper>
            )}

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

export default Statistics;