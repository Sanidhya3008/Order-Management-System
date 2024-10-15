import React, { useState, useEffect } from 'react';
import { 
    Container, Typography, TextField, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, IconButton, 
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Menu, MenuItem, Snackbar, Alert, Divider, InputAdornment, Box
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import api from '../utils/api';
import { generatePDF } from '../utils/pdfGenerator';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const ViewParties = () => {
    const [parties, setParties] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedParty, setSelectedParty] = useState(null);
    const [openOrders, setOpenOrders] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [editedParty, setEditedParty] = useState({});
    const [password, setPassword] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const userRole = localStorage.getItem('userRole');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        fetchParties();
    }, []);

    const fetchParties = async () => {
        try {
            const response = await api.get('/parties');
            setParties(response.data);
        } catch (error) {
            console.error('Error fetching parties:', error);
            setSnackbar({ open: true, message: 'Failed to fetch parties', severity: 'error' });
        }
    };

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const filteredParties = parties.filter(party =>
        party.firmName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePartyClick = async (event, party) => {
        event.stopPropagation();
        setSelectedParty(party);
        try {
            const response = await api.get(`/orders/pending-by-party/${party.firmName}`);
            setSelectedParty({ ...party, pendingOrders: response.data });
            setOpenOrders(true);
        } catch (error) {
            console.error('Error fetching pending orders:', error);
            setSnackbar({ open: true, message: 'Failed to fetch pending orders', severity: 'error' });
        }
    };

    const handleMenuOpen = (event, party) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setSelectedParty(party);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleEditClick = () => {
        setEditedParty({ ...selectedParty });
        setOpenEdit(true);
        handleMenuClose();
    };

    const handleDeleteClick = () => {
        setOpenDelete(true);
        handleMenuClose();
    };

    const handleEditChange = (event) => {
        setEditedParty({ ...editedParty, [event.target.name]: event.target.value });
    };

    const handleEditSubmit = async () => {
        try {
            await api.put(`/parties/${selectedParty._id}`, editedParty);
            setSnackbar({ open: true, message: 'Party updated successfully', severity: 'success' });
            fetchParties();
            setOpenEdit(false);
        } catch (error) {
            console.error('Error updating party:', error);
            setSnackbar({ open: true, message: 'Failed to update party', severity: 'error' });
        }
    };

    const handleDownload = async () => {
        try {
            const headers = ['Party Name', 'Address', 'Contact Person', 'Phone Number', 'Pending Orders'];
            const data = await Promise.all(parties.map(async (party) => {
                const pendingOrdersResponse = await api.get(`/orders/pending-by-party/${party.firmName}`);
                const pendingOrders = pendingOrdersResponse.data;
            
            const pendingOrdersString = pendingOrders
              .map(order => 
                order.products
                  .filter(product => product.status === 'ordered')
                  .map(product => `${product.productName} (${product.quantity})`)
                  .join(', ')
              )
              .filter(orderString => orderString !== '') // Remove empty order strings
              .join('; ');
      
            return [
                party.firmName,
                `${party.firmAddress}, ${party.firmCityState}`,
                party.contactPerson,
                party.phoneNumber,
                pendingOrdersString || 'No pending orders'
            ];
          }));
      
            const doc = generatePDF('Parties and Pending Orders', headers, data);
            doc.save('parties_and_pending_orders.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const handleDeleteSubmit = async () => {
        try {
            await api.delete(`/parties/${selectedParty._id}`, { data: { password } });
            setSnackbar({ open: true, message: 'Party deleted successfully', severity: 'success' });
            fetchParties();
            setOpenDelete(false);
        } catch (error) {
            console.error('Error deleting party:', error);
            setSnackbar({ open: true, message: 'Failed to delete party', severity: 'error' });
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, p: 4, boxShadow: 3, borderRadius: 2 }}>
            <Typography 
                variant="h4" 
                align="center" 
                gutterBottom 
                sx={{ fontWeight: 'bold', mb: 4 }}
            >
                View Parties
            </Typography>

            <TextField
                fullWidth
                label="Search Parties"
                variant="outlined"
                value={searchTerm}
                onChange={handleSearch}
                margin="normal"
                sx={{ mb: 4 }}
            />

            <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Firm Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Contact Person</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Phone Number</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredParties.map((party) => (
                            <TableRow 
                                key={party._id} 
                                onClick={(e) => handlePartyClick(e, party)} 
                                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                            >
                                <TableCell>{party.firmName}</TableCell>
                                <TableCell>{`${party.firmAddress}, ${party.firmCityState}`}</TableCell>
                                <TableCell>{party.contactPerson}</TableCell>
                                <TableCell>{party.phoneNumber}</TableCell>
                                <TableCell>
                                    <IconButton onClick={(e) => handleMenuOpen(e, party)}>
                                        <MoreVertIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleEditClick}>Edit</MenuItem>
                {userRole === 'owner' && (
                    <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>
                )}
            </Menu>

            {/* Pending Orders Dialog */}
            <Dialog open={openOrders} onClose={() => setOpenOrders(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Pending Orders for {selectedParty?.firmName}</DialogTitle>
                <DialogContent>
                    {selectedParty?.pendingOrders?.map((order) => (
                        <div key={order._id}>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                Order Date: {new Date(order.createdAt).toLocaleDateString()}
                            </Typography>
                            {order.products.map((product) => (
                                <Box key={product._id} sx={{ backgroundColor: product.status === 'shipped' ? '#e8f5e9' : '#fff', padding: 1, mb: 2 }}>
                                    {product.productName} - Quantity: {product.quantity} - Status: {product.status}
                                </Box>
                            ))}
                            <Divider sx={{ mb: 2 }} />
                        </div>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenOrders(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Party Dialog */}
            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Party</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Firm Name"
                        name="firmName"
                        value={editedParty.firmName || ''}
                        onChange={handleEditChange}
                        margin="normal"
                        variant="outlined"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Firm Address"
                        name="firmAddress"
                        value={editedParty.firmAddress || ''}
                        onChange={handleEditChange}
                        margin="normal"
                        variant="outlined"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Firm City/State"
                        name="firmCityState"
                        value={editedParty.firmCityState || ''}
                        onChange={handleEditChange}
                        margin="normal"
                        variant="outlined"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Contact Person"
                        name="contactPerson"
                        value={editedParty.contactPerson || ''}
                        onChange={handleEditChange}
                        margin="normal"
                        variant="outlined"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Phone Number"
                        name="phoneNumber"
                        value={editedParty.phoneNumber || ''}
                        onChange={handleEditChange}
                        margin="normal"
                        variant="outlined"
                        required
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
                    <Button onClick={handleEditSubmit}>Save Changes</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Party Dialog */}
            <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Delete Party</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete this party? This action cannot be undone.</Typography>
                    <TextField
                        fullWidth
                        type={showPassword ? 'text' : 'password'}
                        label="Enter your password to confirm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        margin="normal"
                        variant="outlined"
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

            <Button 
                onClick={handleDownload} 
                variant="contained" 
                color="primary" 
                sx={{ mt: 4 }}
            >
                Download Parties and Pending Orders
            </Button>
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

export default ViewParties;