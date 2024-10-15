module.exports = {
    setupFiles: [
      '<rootDir>/src/test-utils/text-encoder-polyfill.js',
      '<rootDir>/src/test-utils/canvas-mock.js'
    ],
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
    testEnvironment: 'jsdom',
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    },
    transformIgnorePatterns: [
      '/node_modules/(?!(axios)/)'
    ],
};