import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Orders from './Orders';
import { BrowserRouter } from 'react-router-dom';
import { LocationProvider } from '../contexts/LocationContext';
import api from '../utils/api';

jest.mock('../utils/api');

describe('Orders Component', () => {
    it('renders without crashing', async () => {
        api.get.mockResolvedValue({ data: [] });

        await act(async () => {
        render(
            <BrowserRouter>
                <LocationProvider>
                    <Orders />
                </LocationProvider>
            </BrowserRouter>
        );
        });
        
        await waitFor(() => {
            expect(screen.getByText('Orders')).toBeInTheDocument();
        });
    });

    it('displays loading state initially', () => {
        render(
        <BrowserRouter>
            <LocationProvider>
            <Orders />
            </LocationProvider>
        </BrowserRouter>
        );
        
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    // Add more tests for Orders component functionality
});