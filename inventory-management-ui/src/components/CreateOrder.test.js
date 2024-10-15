import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateOrder from './CreateOrder';
import { BrowserRouter } from 'react-router-dom';
import { LocationProvider } from '../contexts/LocationContext';
import api from '../utils/api';

jest.mock('../utils/api');

describe('CreateOrder Component', () => {
    beforeEach(() => {
        api.get.mockResolvedValue({ data: [] });
        api.post.mockResolvedValue({ data: {} });
    });
    
    it('renders form fields', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <LocationProvider>
                        <CreateOrder />
                    </LocationProvider>
                </BrowserRouter>
            );
        });
        
        expect(screen.getByRole('heading', { name: 'Create Order' })).toBeInTheDocument();
        expect(screen.getByLabelText('Party Name')).toBeInTheDocument();
        expect(screen.getByText('Add Product')).toBeInTheDocument();
    });

    it('shows validation errors for empty fields', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <LocationProvider>
                        <CreateOrder />
                    </LocationProvider>
                </BrowserRouter>
            );
        });
    
        const submitButton = screen.getByRole('button', { name: 'Create Order' });
        await act(async () => {
          userEvent.click(submitButton);
        });
    
        await waitFor(() => {
            expect(screen.getByText('Please select a party')).toBeInTheDocument();
            expect(screen.getByText('Product name is required')).toBeInTheDocument();
        });
      });
});