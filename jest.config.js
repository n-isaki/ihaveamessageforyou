export default {
  // Use Vite's environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // Module file extensions
  moduleFileExtensions: ['jsx', 'js', 'json'],
  
  // Transform files with Babel
  transform: {
    '^.+\\.(jsx|js)$': 'babel-jest',
  },
  
  // Module name mapping for absolute imports and assets
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
  },
  
  // Ignore transformations
  transformIgnorePatterns: [
    'node_modules/(?!(firebase|@firebase)/.*)',
  ],
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.{jsx,js}',
    '!src/main.jsx',
    '!src/embed/main.jsx',
    '!src/**/*.test.{jsx,js}',
    '!src/**/*.stories.{jsx,js}',
  ],
  
  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{jsx,js}',
    '<rootDir>/src/**/*.{test,spec}.{jsx,js}',
  ],
  
  // Coverage thresholds (relaxed for CI until more tests exist)
  coverageThreshold: {},
};
