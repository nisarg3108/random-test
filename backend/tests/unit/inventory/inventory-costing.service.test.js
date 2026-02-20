/**
 * Inventory Costing Service Tests
 */

import { jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import {
  calculateOutCost,
  resolveCostingMethod,
} from '../../../src/modules/inventory/inventory-costing.service.js';

describe('Inventory Costing Service', () => {
  const mockTenantId = 'tenant-123';
  const mockItemId = 'item-123';
  const mockWarehouseId = 'wh-123';

  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
  });

  describe('resolveCostingMethod', () => {
    it('returns default when no config found', async () => {
      mockPrisma.companyConfig.findUnique.mockResolvedValue(null);

      const method = await resolveCostingMethod(mockTenantId, mockPrisma);

      expect(method).toBe('WEIGHTED_AVG');
    });

    it('returns configured method when valid', async () => {
      mockPrisma.companyConfig.findUnique.mockResolvedValue({
        businessRules: { inventoryCostingMethod: 'FIFO' },
      });

      const method = await resolveCostingMethod(mockTenantId, mockPrisma);

      expect(method).toBe('FIFO');
    });
  });

  describe('calculateOutCost', () => {
    it('uses weighted average when configured', async () => {
      mockPrisma.companyConfig.findUnique.mockResolvedValue({
        businessRules: { inventoryCostingMethod: 'WEIGHTED_AVG' },
      });
      mockPrisma.warehouseStock.findUnique.mockResolvedValue({
        avgCost: 20,
        lastPurchasePrice: 18,
      });

      const result = await calculateOutCost({
        tx: mockPrisma,
        tenantId: mockTenantId,
        itemId: mockItemId,
        warehouseId: mockWarehouseId,
        quantity: 5,
      });

      expect(result.unitCost).toBe(20);
      expect(result.totalCost).toBe(100);
      expect(mockPrisma.stockMovement.findMany).not.toHaveBeenCalled();
    });

    it('calculates FIFO cost from layers', async () => {
      mockPrisma.companyConfig.findUnique.mockResolvedValue({
        businessRules: { inventoryCostingMethod: 'FIFO' },
      });
      mockPrisma.stockMovement.findMany.mockResolvedValue([
        { type: 'IN', quantity: 5, unitCost: 10 },
        { type: 'IN', quantity: 5, unitCost: 20 },
      ]);
      mockPrisma.warehouseStock.findUnique.mockResolvedValue({
        avgCost: 15,
        lastPurchasePrice: 15,
      });

      const result = await calculateOutCost({
        tx: mockPrisma,
        tenantId: mockTenantId,
        itemId: mockItemId,
        warehouseId: mockWarehouseId,
        quantity: 6,
      });

      expect(result.totalCost).toBe(10 * 5 + 20 * 1);
      expect(result.unitCost).toBeCloseTo(result.totalCost / 6, 6);
    });

    it('calculates LIFO cost from layers', async () => {
      mockPrisma.companyConfig.findUnique.mockResolvedValue({
        businessRules: { inventoryCostingMethod: 'LIFO' },
      });
      mockPrisma.stockMovement.findMany.mockResolvedValue([
        { type: 'IN', quantity: 5, unitCost: 10 },
        { type: 'IN', quantity: 5, unitCost: 20 },
      ]);
      mockPrisma.warehouseStock.findUnique.mockResolvedValue({
        avgCost: 15,
        lastPurchasePrice: 15,
      });

      const result = await calculateOutCost({
        tx: mockPrisma,
        tenantId: mockTenantId,
        itemId: mockItemId,
        warehouseId: mockWarehouseId,
        quantity: 6,
      });

      expect(result.totalCost).toBe(20 * 5 + 10 * 1);
      expect(result.unitCost).toBeCloseTo(result.totalCost / 6, 6);
    });

    it('falls back to weighted average when layers are short', async () => {
      mockPrisma.companyConfig.findUnique.mockResolvedValue({
        businessRules: { inventoryCostingMethod: 'FIFO' },
      });
      mockPrisma.stockMovement.findMany.mockResolvedValue([
        { type: 'IN', quantity: 2, unitCost: 10 },
      ]);
      mockPrisma.warehouseStock.findUnique.mockResolvedValue({
        avgCost: 25,
        lastPurchasePrice: 25,
      });

      const result = await calculateOutCost({
        tx: mockPrisma,
        tenantId: mockTenantId,
        itemId: mockItemId,
        warehouseId: mockWarehouseId,
        quantity: 5,
      });

      expect(result.totalCost).toBe(2 * 10 + 3 * 25);
      expect(result.unitCost).toBeCloseTo(result.totalCost / 5, 6);
    });
  });
});
