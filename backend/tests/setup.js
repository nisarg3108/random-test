/**
 * Test Setup File
 * Initialize testing environment and global utilities
 */

import { jest, expect } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/erp_test';

const createModelMock = () => ({
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  aggregate: jest.fn(),
  upsert: jest.fn(),
});

const createPrismaMock = () => {
  const base = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(async (cb) => cb(createPrismaMock())),
  };

  return new Proxy(base, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      if (!target[prop]) {
        target[prop] = createModelMock();
      }
      return target[prop];
    },
  });
};

const prismaMockInstance = createPrismaMock();

// Mock Prisma client for unit tests
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => prismaMockInstance),
  };
});

// Global test utilities
global.testUtils = {
  /**
   * Create mock tenant ID
   */
  mockTenantId: () => 'test-tenant-' + Math.random().toString(36).substr(2, 9),

  /**
   * Create mock user object
   */
  mockUser: () => ({
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    email: 'test@example.com',
    tenantId: global.testUtils.mockTenantId(),
    role: 'USER',
  }),

  /**
   * Create mock request object
   */
  mockRequest: (overrides = {}) => ({
    user: global.testUtils.mockUser(),
    params: {},
    query: {},
    body: {},
    ...overrides,
  }),

  /**
   * Create mock response object
   */
  mockResponse: () => ({
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    locals: {},
  }),

  /**
   * Wait for promise with timeout
   */
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
};

/**
 * Suppress console output during tests (can be enabled with DEBUG=true)
 */
if (process.env.DEBUG !== 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Add custom matchers if needed
expect.extend({
  /**
   * Custom matcher: toBeValidEmail
   */
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);

    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be a valid email address`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be a valid email address`,
        pass: false,
      };
    }
  },

  /**
   * Custom matcher: toBeValidUUID
   */
  toBeValidUUID(received) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },

  /**
   * Custom matcher: toBeWithinRange
   */
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;

    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

console.log('✅ Test environment initialized');
