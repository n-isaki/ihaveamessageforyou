export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleFileExtensions: ['jsx', 'js', 'json'],
  transform: {
    '^.+\\.(jsx|js)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(firebase|@firebase)/.*)',
  ],
  testMatch: ['<rootDir>/src/**/*.ci.test.js'],
  collectCoverageFrom: [],
  coverageThreshold: {},
};
