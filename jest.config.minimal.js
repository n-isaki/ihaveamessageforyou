export default {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/**/*.basic.test.js'],
  collectCoverageFrom: [],
  coverageThreshold: {},
};
