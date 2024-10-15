import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '/api',
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            if (error.response.data.userDeleted) {
                // User has been deleted, clear local storage and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                window.location.href = '/login';
                return Promise.reject(new Error('User has been deleted. Please log in again.'));
            }
            
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            // Instead of redirecting here, we'll let the component handle the redirect
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

// Add this function to check if the user is authenticated
export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};

export const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    delete api.defaults.headers.common['Authorization'];
    window.location.href = '/';
};

export default api;