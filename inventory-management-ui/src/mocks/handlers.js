import { rest } from 'msw';

export const handlers = [
    rest.get('http://localhost:5000/api/orders', (req, res, ctx) => {
        return res(
        ctx.json([
            {
            _id: '1',
            party: { firmName: 'Test Firm' },
            products: [{ productName: 'Test Product', quantity: 10, rate: 100 }],
            status: 'pending',
            createdAt: new Date().toISOString(),
            },
        ])
        );
    }),
    // Add more API mocks as needed
];