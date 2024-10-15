import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import Orders from './components/Orders';
import Products from './components/Products';
import CreateOrder from './components/CreateOrder';
import AddProduct from './components/AddProduct';
import AddParty from './components/AddParty';
import RegisterUser from './components/RegisterUser';
import ProfilePage from './components/ProfilePage';
import Footer from './components/Footer';
import AssignedDeliveries from './components/AssignedDeliveries';
import ViewParties from './components/ViewParties';
import RegisteredUsers from './components/RegisteredUsers';
import Statistics from './components/Statistics';
import { setAuthToken, isAuthenticated } from './utils/api';
import { LocationProvider } from './contexts/LocationContext';
import api from './utils/api';

const PrivateRoute = ({ children, roles }) => {
    const location = useLocation();
    const userRole = localStorage.getItem('userRole');
    const authenticated = isAuthenticated();

    useEffect(() => {
        // Check authentication on component mount and when location changes
        const checkAuth = async () => {
            try {
                await api.get('/auth/me'); // This will trigger the interceptor if the user has been deleted
            } catch (error) {
                // Error will be handled by the interceptor
            }
        };
        checkAuth();
    }, [location]);
  
    if (!authenticated) {
      return <Navigate to="/" state={{ from: location }} replace />;
    }
  
    if (roles && !roles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
};

const Layout = ({ children, showHeader = true }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {showHeader && <Header />}
        <Box sx={{ flexGrow: 1 }}>{children}</Box>
        <Footer />
    </Box>
);

function App() {
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setAuthToken(token);
        }
        setChecking(false);
    }, []);

    if (checking) {
        return <div>Loading...</div>;
    }

    return (
        <LocationProvider>
            <Router>
                <Routes>
                    <Route path="/" element={
                        isAuthenticated() ? 
                        <Navigate to="/dashboard" replace /> : 
                        <Layout showHeader={false}><LoginPage /></Layout>
                    } />
                    <Route path="/dashboard" element={<Layout showHeader={false}><PrivateRoute><DashboardPage /></PrivateRoute></Layout>} />
                    <Route path="/orders" element={<Layout><PrivateRoute><Orders roles={['owner', 'employee']}/></PrivateRoute></Layout>} />
                    <Route path="/products" element={<Layout><PrivateRoute roles={['owner', 'employee']}><Products /></PrivateRoute></Layout>} />
                    <Route path="/create-order" element={<Layout><PrivateRoute><CreateOrder roles={['owner', 'employee']}/></PrivateRoute></Layout>} />
                    <Route path="/add-product" element={<Layout><PrivateRoute><AddProduct roles={['owner']}/></PrivateRoute></Layout>} />
                    <Route path="/add-party" element={<Layout><PrivateRoute roles={['owner']}><AddParty /></PrivateRoute></Layout>} />
                    <Route path="/register-user" element={<Layout><PrivateRoute roles={['owner']}><RegisterUser /></PrivateRoute></Layout>} />
                    <Route path="/profile" element={<Layout><PrivateRoute><ProfilePage /></PrivateRoute></Layout>} />
                    <Route path="/assigned-deliveries" element={<Layout><PrivateRoute roles={['delivery_person']}><AssignedDeliveries /></PrivateRoute></Layout>} />
                    <Route path="/view-parties" element={<Layout><PrivateRoute roles={['owner', 'employee']}><ViewParties /></PrivateRoute></Layout>} />
                    <Route path="/registered-users" element={<Layout><PrivateRoute roles={['owner']}><RegisteredUsers /></PrivateRoute></Layout>} />
                    <Route path="/statistics" element={<Layout><PrivateRoute roles={['owner']}><Statistics /></PrivateRoute></Layout>} />
                </Routes>
            </Router>
        </LocationProvider>
    );
}

export default App;