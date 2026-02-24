import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('./firebase.js', () => ({
  db: {},
  storage: {},
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  },
}));

// Mock crypto.randomUUID for Firebase functions
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
});

// Mock window.location omitted (jsdom does not allow redefining it; tests that need it can mock per-file)

// Mock TextEncoder/TextDecoder for Node.js compatibility
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
