import { signOut } from './api';

export const handleApiError = (error, setSnackbar) => {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 401) {
            signOut();
            setSnackbar({ open: true, message: 'Session expired. Please log in again.', severity: 'error' });
        } else {
            setSnackbar({ open: true, message: error.response.data.message || 'An error occurred', severity: 'error' });
        }
    } else if (error.request) {
        // The request was made but no response was received
        setSnackbar({ open: true, message: 'No response from server. Please try again.', severity: 'error' });
    } else {
        // Something happened in setting up the request that triggered an Error
        setSnackbar({ open: true, message: 'An unexpected error occurred', severity: 'error' });
    }
    console.error('API Error:', error);
};