import '@testing-library/jest-dom';

let server;

try {
    const { server: setupServer } = require('./mocks/server');
    server = setupServer;
} catch (error) {
    console.warn('MSW server setup failed:', error);
}

beforeAll(() => {
    if (server) {
        server.listen();
    }
});

afterEach(() => {
    if (server) {
        server.resetHandlers();
    }
});

afterAll(() => {
    if (server) {
        server.close();
    }
});