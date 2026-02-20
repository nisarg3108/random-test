/**
 * Jest Configuration
 * Unit and integration testing setup
 */

export default {
  displayName: 'ERP System Backend Tests',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.routes.js',
    '!src/**/index.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'src/server.js'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  },
  transform: {},
  transformIgnorePatterns: [
    'node_modules/(?!(chalk)/)'
  ],
  globals: {
    __DEV__: true
  },
  testTimeout: 10000,
  verbose: true
};
