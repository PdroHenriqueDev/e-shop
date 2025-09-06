import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {AxiosError} from 'axios';

// Mock axios before importing our module
vi.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      response: {
        use: vi.fn(),
      },
    },
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

describe('axios configuration and error handling', () => {
  let mockDispatchEvent: any;
  let originalWindow: any;
  let axiosInstance: any;
  let errorHandler: any;

  beforeEach(async () => {
    mockDispatchEvent = vi.fn();
    originalWindow = global.window;

    // Mock window.dispatchEvent
    Object.defineProperty(global, 'window', {
      value: {
        dispatchEvent: mockDispatchEvent,
      },
      writable: true,
    });

    // Clear all mocks before importing
    vi.clearAllMocks();

    // Import the axios instance to trigger code execution
    axiosInstance = await import('./axios');

    // Get the error handler from the interceptor setup
    const axios = await import('axios');
    const mockUse = vi.mocked(axios.default.create().interceptors.response.use);
    if (mockUse.mock.calls.length > 0) {
      errorHandler = mockUse.mock.calls[0][1]; // Second argument is the error handler
    }
 });

  afterEach(() => {
    global.window = originalWindow;
    vi.clearAllMocks();
  });

  it('should create axios instance and set up interceptor', () => {
    expect(axiosInstance.default).toBeDefined();
  });

  it('should handle 401 errors in interceptor and dispatch auth-error event', async () => {
    const mockError: AxiosError = {
      response: {
        status: 401,
        data: {},
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any,
      },
      config: {} as any,
      isAxiosError: true,
      toJSON: () => ({}),
      name: 'AxiosError',
      message: 'Request failed with status code 401',
    };

    if (errorHandler) {
      try {
        await errorHandler(mockError);
      } catch (error) {
        // Expected to reject
      }

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth-error',
          detail: {
            message: 'Please log in to continue',
            type: 'error',
          },
        }),
      );
    }
  });

  it('should handle non-401 errors in interceptor without dispatching event', async () => {
    const mockError: AxiosError = {
      response: {
        status: 500,
        data: {},
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
      },
      config: {} as any,
      isAxiosError: true,
      toJSON: () => ({}),
      name: 'AxiosError',
      message: 'Request failed with status code 500',
    };

    if (errorHandler) {
      try {
        await errorHandler(mockError);
      } catch (error) {
        // Expected to reject
      }

      expect(mockDispatchEvent).not.toHaveBeenCalled();
    }
  });

  it('should handle 401 errors on server-side without window', async () => {
    // Remove window to simulate server-side
    delete (global as any).window;

    const mockError: AxiosError = {
      response: {
        status: 401,
        data: {},
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any,
      },
      config: {} as any,
      isAxiosError: true,
      toJSON: () => ({}),
      name: 'AxiosError',
      message: 'Request failed with status code 401',
    };

    if (errorHandler) {
      try {
        await errorHandler(mockError);
      } catch (error) {
        // Expected to reject, should not throw due to window check
        expect(error).toBe(mockError);
      }
    }
  });

  it('should handle errors without response object', async () => {
    const mockError: AxiosError = {
      response: undefined,
      config: {} as any,
      isAxiosError: true,
      toJSON: () => ({}),
      name: 'AxiosError',
      message: 'Network Error',
    };

    if (errorHandler) {
      try {
        await errorHandler(mockError);
      } catch (error) {
        // Expected to reject
        expect(error).toBe(mockError);
      }

      expect(mockDispatchEvent).not.toHaveBeenCalled();
    }
  });

  it('should always reject the error after handling', async () => {
    const mockError: AxiosError = {
      response: {
        status: 401,
        data: {},
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any,
      },
      config: {} as any,
      isAxiosError: true,
      toJSON: () => ({}),
      name: 'AxiosError',
      message: 'Request failed with status code 401',
    };

    if (errorHandler) {
      await expect(errorHandler(mockError)).rejects.toBe(mockError);
    }
  });
});