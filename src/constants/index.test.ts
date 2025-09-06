import {ORDER_STATUS, CHECKOUT_STEP, OrderStatus, CheckoutStep} from './index';

describe('Constants', () => {
  describe('ORDER_STATUS', () => {
    it('should have correct order status values', () => {
      expect(ORDER_STATUS.PENDING).toBe('pending');
      expect(ORDER_STATUS.PROCESSING).toBe('processing');
      expect(ORDER_STATUS.SHIPPED).toBe('shipped');
      expect(ORDER_STATUS.DELIVERED).toBe('delivered');
      expect(ORDER_STATUS.CANCELLED).toBe('cancelled');
      expect(ORDER_STATUS.CONFIRMED).toBe('confirmed');
      expect(ORDER_STATUS.PAID).toBe('paid');
      expect(ORDER_STATUS.COMPLETED).toBe('completed');
    });

    it('should have all expected order status keys', () => {
      const expectedKeys = [
        'PENDING',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'CONFIRMED',
        'PAID',
        'COMPLETED',
      ];
      expect(Object.keys(ORDER_STATUS)).toEqual(expectedKeys);
    });

    it('should be readonly object', () => {
      expect(typeof ORDER_STATUS).toBe('object');
      expect(ORDER_STATUS).toBeDefined();
    });
  });

  describe('CHECKOUT_STEP', () => {
    it('should have correct checkout step values', () => {
      expect(CHECKOUT_STEP.SHIPPING).toBe('shipping');
      expect(CHECKOUT_STEP.PAYMENT).toBe('payment');
      expect(CHECKOUT_STEP.REVIEW).toBe('review');
    });

    it('should have all expected checkout step keys', () => {
      const expectedKeys = ['SHIPPING', 'PAYMENT', 'REVIEW'];
      expect(Object.keys(CHECKOUT_STEP)).toEqual(expectedKeys);
    });

    it('should be readonly object', () => {
      expect(typeof CHECKOUT_STEP).toBe('object');
      expect(CHECKOUT_STEP).toBeDefined();
    });
  });

  describe('Type exports', () => {
    it('should export OrderStatus type correctly', () => {
      const validOrderStatus: OrderStatus = 'pending';
      expect(typeof validOrderStatus).toBe('string');
      expect(Object.values(ORDER_STATUS)).toContain(validOrderStatus);
    });

    it('should export CheckoutStep type correctly', () => {
      const validCheckoutStep: CheckoutStep = 'shipping';
      expect(typeof validCheckoutStep).toBe('string');
      expect(Object.values(CHECKOUT_STEP)).toContain(validCheckoutStep);
    });
  });

  describe('Constants integrity', () => {
    it('should have unique order status values', () => {
      const values = Object.values(ORDER_STATUS);
      const uniqueValues = [...new Set(values)];
      expect(values).toHaveLength(uniqueValues.length);
    });

    it('should have unique checkout step values', () => {
      const values = Object.values(CHECKOUT_STEP);
      const uniqueValues = [...new Set(values)];
      expect(values).toHaveLength(uniqueValues.length);
    });
  });
});