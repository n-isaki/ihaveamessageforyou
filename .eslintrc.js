module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
    worker: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'react',
    'react-hooks',
  ],
  rules: {
    'no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^[A-Z_]',
      'caughtErrorsIgnorePattern': '^_'
    }],
    'no-empty': ['error', { 'allowEmptyCatch': true }],
    'no-useless-escape': 'off',
    'no-undef': 'off',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/exhaustive-deps': 'warn',
  },
  ignorePatterns: [
    '**/shopify-theme/**',
    '**/functions/**',
    '**/karakedimartin/**',
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '*.config.js',
    'tailwind.config.js',
    'vite.config.js',
    'vite.widget.config.js'
  ],
  globals: {
    process: 'readonly',
    Buffer: 'readonly',
    __dirname: 'readonly',
    global: 'readonly',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
