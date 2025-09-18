import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, fireEvent, waitFor, act} from '@testing-library/react';
import * as React from 'react';
import Checkout from './page';
import {useRouter} from 'next/navigation';
import {useCart} from '@/contexts/cartContext';
import {useOrder} from '@/contexts/orderContext';
import {useNotification} from '@/contexts/notificationContext';

vi.mock('next/navigation', () => ({useRouter: vi.fn()}));
vi.mock('@/contexts/cartContext', () => ({useCart: vi.fn()}));
vi.mock('@/contexts/orderContext', () => ({useOrder: vi.fn()}));
vi.mock('@/contexts/notificationContext', () => ({useNotification: vi.fn()}));

vi.mock('@/components/customButtton/customButton', () => ({
  default: ({
    buttonText,
    onClick,
    type = 'button',
    disabled,
    backgroundColor,
  }: any) => (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      data-testid={`custom-button-${buttonText?.toLowerCase().replace(/\s+/g, '-') || 'button'}`}
      className={backgroundColor}>
      {buttonText}
    </button>
  ),
}));

vi.mock('@/components/loading/loading', () => ({
  default: () => <div data-testid="loading">Loading...</div>,
}));

const makeItem = (params: {
  id: number;
  name: string;
  price: number;
  qty: number;
}) => ({
  productId: params.id,
  quantity: params.qty,
  product: {id: params.id, name: params.name, price: params.price},
});

const makeOrder = (params: {id: string}) => ({id: params.id});

const nameAttr: Record<string, string> = {
  'Full Name': 'fullName',
  'Address Line 1': 'addressLine1',
  'Address Line 2': 'addressLine2',
  City: 'city',
  State: 'state',
  'Postal Code': 'postalCode',
  Country: 'country',
};

const getInputByField = (fieldLabel: string) => {
  const attr = nameAttr[fieldLabel] ?? fieldLabel;
  const el = document.querySelector(
    `input[name="${attr}"]`,
  ) as HTMLInputElement | null;
  if (!el)
    throw new Error(`Input not found for ${fieldLabel} using name="${attr}"`);
  return el;
};

const fillShipping = (formValues: Record<string, string>) => {
  Object.entries(formValues).forEach(([field, value]) => {
    const input = getInputByField(field);
    fireEvent.change(input, {target: {value}});
  });
  fireEvent.click(screen.getByTestId('custom-button-continue-to-payment'));
};

describe('Checkout Page', () => {
  let routerMock: any;
  let cartCtx: any;
  let orderCtx: any;
  let notifCtx: any;
  let originalLocation: Location;
  let mockLocation: any;

  beforeEach(() => {
    vi.clearAllMocks();

    routerMock = {push: vi.fn()};
    cartCtx = {
      cartItems: [],
      cartIsLoading: false,
      handleSetCartItems: vi.fn(),
    };
    orderCtx = {placeOrder: vi.fn(), orderIsLoading: false};
    notifCtx = {notify: vi.fn()};

    (useRouter as any).mockReturnValue(routerMock);
    (useCart as any).mockReturnValue(cartCtx);
    (useOrder as any).mockReturnValue(orderCtx);
    (useNotification as any).mockReturnValue(notifCtx);

    originalLocation = window.location;
    mockLocation = {
      href: '',
      origin: 'http://localhost:3000',
    };
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });

    global.fetch = vi.fn();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  describe('Initial Loading and Cart Validation', () => {
    it('renders only loader when cartIsLoading is true', () => {
      cartCtx.cartIsLoading = true;
      render(<Checkout />);
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(
        screen.queryByText('Shipping Information'),
      ).not.toBeInTheDocument();
    });

    it('shows empty cart UI and clicking Continue Shopping calls router.push', () => {
      cartCtx.cartItems = [];
      render(<Checkout />);
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('custom-button-continue-shopping'));
      expect(routerMock.push).toHaveBeenCalledWith('/');
    });
  });

  describe('Radio onChange Handler Coverage', () => {
    it('explicitly covers radio onChange by dispatching change events', async () => {
      cartCtx.cartItems = [
        makeItem({id: 1, name: 'Test Item', price: 100, qty: 1}),
      ];
      render(<Checkout />);

      fillShipping({
        'Full Name': 'A',
        'Address Line 1': 'B',
        City: 'C',
        State: 'D',
        'Postal Code': 'E',
      });

      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
      });

      const radio = document.querySelector(
        'input[name="paymentMethod"][value="credit_card"]',
      ) as HTMLInputElement;

      await act(async () =>
        fireEvent.change(radio, {target: {checked: false}}),
      );
      await act(async () => fireEvent.change(radio, {target: {checked: true}}));

      expect(radio.checked).toBe(true);

      fireEvent.click(screen.getByTestId('custom-button-continue-to-review'));

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('custom-button-back-to-payment'));

      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
      });
    });
  });

  describe('Step Navigation', () => {
    it('navigates through steps and covers radio button onChange', async () => {
      cartCtx.cartItems = [
        makeItem({id: 1, name: 'Test Item', price: 100, qty: 1}),
      ];
      render(<Checkout />);

      fillShipping({
        'Full Name': 'John Doe',
        'Address Line 1': '123 Main St',
        City: 'Anytown',
        State: 'CA',
        'Postal Code': '12345',
      });

      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
      });

      const radioButton = document.querySelector(
        'input[name="paymentMethod"][value="credit_card"]',
      ) as HTMLInputElement;
      expect(radioButton).toBeInTheDocument();
      fireEvent.click(radioButton);
      expect(radioButton.checked).toBe(true);

      fireEvent.click(screen.getByTestId('custom-button-continue-to-review'));

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('custom-button-back-to-payment'));

      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('custom-button-back-to-shipping'));

      await waitFor(() => {
        expect(screen.getByText('Shipping Information')).toBeInTheDocument();
      });
    });
  });

  describe('Order Calculations', () => {
    it('calculates subtotal, tax, and total correctly with multiple items', () => {
      cartCtx.cartItems = [
        makeItem({id: 1, name: 'Item 1', price: 50, qty: 2}),
        makeItem({id: 2, name: 'Item 2', price: 30, qty: 1}),
      ];
      render(<Checkout />);

      expect(screen.getByText('$130.00')).toBeInTheDocument();
      expect(screen.getByText('$13.00')).toBeInTheDocument();
      expect(screen.getByText('$143.00')).toBeInTheDocument();
    });
  });

  describe('Order Placement - Happy Path', () => {
    it('places order successfully with address line 2', async () => {
      cartCtx.cartItems = [
        makeItem({id: 1, name: 'Test Item', price: 100, qty: 1}),
      ];
      orderCtx.placeOrder.mockResolvedValue(makeOrder({id: 'order-123'}));
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({url: 'https://checkout.stripe.com/session'}),
      });

      render(<Checkout />);

      fillShipping({
        'Full Name': 'John Doe',
        'Address Line 1': '123 Main St',
        'Address Line 2': 'Apt 4B',
        City: 'Anytown',
        State: 'CA',
        'Postal Code': '12345',
      });

      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('custom-button-continue-to-review'));

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('custom-button-place-order'));
      });

      expect(orderCtx.placeOrder).toHaveBeenCalledWith(
        'John Doe, 123 Main St, Apt 4B, Anytown, CA, 12345, United States',
        'stripe',
        110,
      );

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stripe/create-checkout-session',
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            orderId: 'order-123',
            successUrl:
              'http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}',
            cancelUrl: 'http://localhost:3000/checkout/cancel',
          }),
        },
      );

      expect(cartCtx.handleSetCartItems).toHaveBeenCalledWith([]);
      expect(mockLocation.href).toBe('https://checkout.stripe.com/session');
    });
  });

  describe('Error Handling - placeOrder rejected', () => {
    it('handles placeOrder rejection', async () => {
      cartCtx.cartItems = [
        makeItem({id: 1, name: 'Test Item', price: 100, qty: 1}),
      ];
      orderCtx.placeOrder.mockRejectedValue(new Error('Order failed'));

      render(<Checkout />);

      fillShipping({
        'Full Name': 'John Doe',
        'Address Line 1': '123 Main St',
        City: 'Anytown',
        State: 'CA',
        'Postal Code': '12345',
      });

      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('custom-button-continue-to-review'));

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('custom-button-place-order'));
      });

      expect(notifCtx.notify).toHaveBeenCalledWith({
        type: 'error',
        msg: 'Order failed',
      });
    });
  });

  describe('Error Handling - checkout ok but missing url', () => {
    it('handles missing URL in checkout response', async () => {
      cartCtx.cartItems = [
        makeItem({id: 1, name: 'Test Item', price: 100, qty: 1}),
      ];
      orderCtx.placeOrder.mockResolvedValue(makeOrder({id: 'order-123'}));
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      render(<Checkout />);

      fillShipping({
        'Full Name': 'John Doe',
        'Address Line 1': '123 Main St',
        City: 'Anytown',
        State: 'CA',
        'Postal Code': '12345',
      });

      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('custom-button-continue-to-review'));

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('custom-button-place-order'));
      });

      expect(notifCtx.notify).toHaveBeenCalledWith({
        type: 'error',
        msg: 'Failed to create checkout session',
      });
    });
  });

  describe('Error Handling - non-Error thrown by json()', () => {
    it('handles non-Error thrown by json method', async () => {
      cartCtx.cartItems = [
        makeItem({id: 1, name: 'Test Item', price: 100, qty: 1}),
      ];
      orderCtx.placeOrder.mockResolvedValue(makeOrder({id: 'order-123'}));
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => {
          throw 'oops';
        },
      });

      render(<Checkout />);

      fillShipping({
        'Full Name': 'John Doe',
        'Address Line 1': '123 Main St',
        City: 'Anytown',
        State: 'CA',
        'Postal Code': '12345',
      });

      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('custom-button-continue-to-review'));

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('custom-button-place-order'));
      });

      expect(notifCtx.notify).toHaveBeenCalledWith({
        type: 'error',
        msg: 'Failed to process payment. Please try again.',
      });
    });
  });

  describe('Error Handling - checkout returns error', () => {
    it('handles checkout error response', async () => {
      cartCtx.cartItems = [
        makeItem({id: 1, name: 'Test Item', price: 100, qty: 1}),
      ];
      orderCtx.placeOrder.mockResolvedValue(makeOrder({id: 'order-123'}));
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({error: 'Bad request'}),
      });

      render(<Checkout />);

      fillShipping({
        'Full Name': 'John Doe',
        'Address Line 1': '123 Main St',
        City: 'Anytown',
        State: 'CA',
        'Postal Code': '12345',
      });

      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('custom-button-continue-to-review'));

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('custom-button-place-order'));
      });

      expect(notifCtx.notify).toHaveBeenCalledWith({
        type: 'error',
        msg: 'Bad request',
      });
      expect(mockLocation.href).toBe('');
    });
  });

  describe('Critical coverage of handlePlaceOrder early-return', () => {
    it('handles empty cart during order placement', async () => {
      cartCtx.cartItems = [
        makeItem({id: 1, name: 'Test Item', price: 100, qty: 1}),
      ];

      render(<Checkout />);

      fillShipping({
        'Full Name': 'John Doe',
        'Address Line 1': '123 Main St',
        City: 'Anytown',
        State: 'CA',
        'Postal Code': '12345',
      });

      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('custom-button-continue-to-review'));

      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument();
      });

      cartCtx.cartItems.splice(0);

      await act(async () => {
        fireEvent.click(screen.getByTestId('custom-button-place-order'));
      });

      expect(notifCtx.notify).toHaveBeenCalledWith({
        type: 'error',
        msg: 'Your cart is empty',
      });
      expect(orderCtx.placeOrder).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Payment radio onChange', () => {
    it('fires onChange and calls setPaymentMethod("credit_card")', async () => {
      cartCtx.cartItems = [
        {productId: 1, quantity: 1, product: {id: 1, name: 'X', price: 10}},
      ];

      render(<Checkout />);

      const fill = (name: string, value: string) => {
        const input = document.querySelector(
          `input[name="${name}"]`,
        ) as HTMLInputElement;
        if (input) {
          fireEvent.change(input, {target: {value}});
        }
      };

      fill('fullName', 'A');
      fill('addressLine1', 'B');
      fill('city', 'C');
      fill('state', 'D');
      fill('postalCode', 'E');
      fireEvent.click(screen.getByTestId('custom-button-continue-to-payment'));

      await screen.findByText('Payment Method');

      const radio = document.querySelector(
        'input[name="paymentMethod"][value="credit_card"]',
      ) as HTMLInputElement;

      expect(radio).toBeInTheDocument();
      expect(radio.checked).toBe(true);

      const paypalRadio = document.querySelector(
        'input[name="paymentMethod"][value="paypal"]',
      ) as HTMLInputElement;

      if (paypalRadio) {
        await act(async () => {
          fireEvent.click(paypalRadio);
        });
        expect(paypalRadio.checked).toBe(true);
        expect(radio.checked).toBe(false);

        await act(async () => {
          fireEvent.click(radio);
        });
        expect(radio.checked).toBe(true);
        expect(paypalRadio.checked).toBe(false);
      } else {
        await act(async () => {
          fireEvent.click(radio);
        });
        expect(radio.checked).toBe(true);
      }
    });
  });
});
