import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {NextRequest} from 'next/server';

const mockGetHandler = vi.fn();
const mockPostHandler = vi.fn();

vi.mock('../../../../../auth', () => ({
  handlers: {
    GET: mockGetHandler,
    POST: mockPostHandler,
  },
}));

const createMockNextRequest = (url: string, options?: RequestInit) => {
  return new NextRequest(url, options);
};

describe('NextAuth Route Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET Handler', () => {
    it('should export GET handler from NextAuth', async () => {
      const {GET} = await import('./route');
      expect(GET).toBeDefined();
      expect(typeof GET).toBe('function');
    });

    it('should call the NextAuth GET handler', async () => {
      const mockRequest = createMockNextRequest(
        'http://localhost:3000/api/auth/signin',
      );
      const mockResponse = new Response('OK');
      mockGetHandler.mockResolvedValue(mockResponse);

      const {GET} = await import('./route');
      const result = await GET(mockRequest);

      expect(mockGetHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBe(mockResponse);
    });

    it('should handle GET requests for different auth endpoints', async () => {
      const endpoints = [
        'http://localhost:3000/api/auth/signin',
        'http://localhost:3000/api/auth/signout',
        'http://localhost:3000/api/auth/session',
        'http://localhost:3000/api/auth/providers',
        'http://localhost:3000/api/auth/csrf',
      ];

      mockGetHandler.mockResolvedValue(new Response('OK'));
      const {GET} = await import('./route');

      for (const endpoint of endpoints) {
        const mockRequest = createMockNextRequest(endpoint);
        await GET(mockRequest);
        expect(mockGetHandler).toHaveBeenCalledWith(mockRequest);
      }

      expect(mockGetHandler).toHaveBeenCalledTimes(endpoints.length);
    });

    it('should handle GET requests with query parameters', async () => {
      const mockRequest = createMockNextRequest(
        'http://localhost:3000/api/auth/signin?callbackUrl=/dashboard',
      );
      const mockResponse = new Response('OK');
      mockGetHandler.mockResolvedValue(mockResponse);

      const {GET} = await import('./route');
      const result = await GET(mockRequest);

      expect(mockGetHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBe(mockResponse);
    });

    it('should handle GET requests with headers', async () => {
      const mockRequest = createMockNextRequest(
        'http://localhost:3000/api/auth/session',
        {
          headers: {
            Authorization: 'Bearer token',
            'Content-Type': 'application/json',
          },
        },
      );
      const mockResponse = new Response(JSON.stringify({user: null}));
      mockGetHandler.mockResolvedValue(mockResponse);

      const {GET} = await import('./route');
      const result = await GET(mockRequest);

      expect(mockGetHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBe(mockResponse);
    });

    it('should handle GET handler errors', async () => {
      const mockRequest = createMockNextRequest(
        'http://localhost:3000/api/auth/signin',
      );
      const mockError = new Error('NextAuth GET error');
      mockGetHandler.mockRejectedValue(mockError);

      const {GET} = await import('./route');

      await expect(GET(mockRequest)).rejects.toThrow('NextAuth GET error');
      expect(mockGetHandler).toHaveBeenCalledWith(mockRequest);
    });
  });

  describe('POST Handler', () => {
    it('should export POST handler from NextAuth', async () => {
      const {POST} = await import('./route');
      expect(POST).toBeDefined();
      expect(typeof POST).toBe('function');
    });

    it('should call the NextAuth POST handler', async () => {
      const mockRequest = createMockNextRequest(
        'http://localhost:3000/api/auth/signin',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password',
          }),
        },
      );
      const mockResponse = new Response('OK');
      mockPostHandler.mockResolvedValue(mockResponse);

      const {POST} = await import('./route');
      const result = await POST(mockRequest);

      expect(mockPostHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBe(mockResponse);
    });

    it('should handle POST requests for signin', async () => {
      const mockRequest = createMockNextRequest(
        'http://localhost:3000/api/auth/signin',
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            email: 'user@example.com',
            password: 'password123',
          }),
        },
      );
      const mockResponse = new Response(JSON.stringify({url: '/dashboard'}));
      mockPostHandler.mockResolvedValue(mockResponse);

      const {POST} = await import('./route');
      const result = await POST(mockRequest);

      expect(mockPostHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBe(mockResponse);
    });

    it('should handle POST requests for signout', async () => {
      const mockRequest = createMockNextRequest(
        'http://localhost:3000/api/auth/signout',
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
        },
      );
      const mockResponse = new Response(JSON.stringify({url: '/login'}));
      mockPostHandler.mockResolvedValue(mockResponse);

      const {POST} = await import('./route');
      const result = await POST(mockRequest);

      expect(mockPostHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBe(mockResponse);
    });

    it('should handle POST requests with form data', async () => {
      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password');

      const mockRequest = createMockNextRequest(
        'http://localhost:3000/api/auth/signin',
        {
          method: 'POST',
          body: formData,
        },
      );
      const mockResponse = new Response('OK');
      mockPostHandler.mockResolvedValue(mockResponse);

      const {POST} = await import('./route');
      const result = await POST(mockRequest);

      expect(mockPostHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBe(mockResponse);
    });

    it('should handle POST requests with empty body', async () => {
      const mockRequest = createMockNextRequest(
        'http://localhost:3000/api/auth/signin',
        {
          method: 'POST',
        },
      );
      const mockResponse = new Response('Bad Request', {status: 400});
      mockPostHandler.mockResolvedValue(mockResponse);

      const {POST} = await import('./route');
      const result = await POST(mockRequest);

      expect(mockPostHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBe(mockResponse);
    });

    it('should handle POST handler errors', async () => {
      const mockRequest = createMockNextRequest(
        'http://localhost:3000/api/auth/signin',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password',
          }),
        },
      );
      const mockError = new Error('NextAuth POST error');
      mockPostHandler.mockRejectedValue(mockError);

      const {POST} = await import('./route');

      await expect(POST(mockRequest)).rejects.toThrow('NextAuth POST error');
      expect(mockPostHandler).toHaveBeenCalledWith(mockRequest);
    });

    it('should handle POST requests with different content types', async () => {
      const contentTypes = [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
        'text/plain',
      ];

      mockPostHandler.mockResolvedValue(new Response('OK'));
      const {POST} = await import('./route');

      for (const contentType of contentTypes) {
        const mockRequest = createMockNextRequest(
          'http://localhost:3000/api/auth/signin',
          {
            method: 'POST',
            headers: {'Content-Type': contentType},
            body: 'test data',
          },
        );

        await POST(mockRequest);
        expect(mockPostHandler).toHaveBeenCalledWith(mockRequest);
      }

      expect(mockPostHandler).toHaveBeenCalledTimes(contentTypes.length);
    });
  });

  describe('Handler Integration', () => {
    it('should export both GET and POST handlers', async () => {
      const {GET, POST} = await import('./route');
      expect(GET).toBeDefined();
      expect(POST).toBeDefined();
      expect(typeof GET).toBe('function');
      expect(typeof POST).toBe('function');
    });

    it('should handle concurrent requests', async () => {
      mockGetHandler.mockResolvedValue(new Response('GET OK'));
      mockPostHandler.mockResolvedValue(new Response('POST OK'));

      const {GET, POST} = await import('./route');

      const getRequest = createMockNextRequest(
        'http://localhost:3000/api/auth/session',
      );
      const postRequest = createMockNextRequest(
        'http://localhost:3000/api/auth/signin',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password',
          }),
        },
      );

      const [getResult, postResult] = await Promise.all([
        GET(getRequest),
        POST(postRequest),
      ]);

      expect(mockGetHandler).toHaveBeenCalledWith(getRequest);
      expect(mockPostHandler).toHaveBeenCalledWith(postRequest);
      expect(getResult).toBeInstanceOf(Response);
      expect(postResult).toBeInstanceOf(Response);
    });

    it('should maintain handler independence', async () => {
      mockGetHandler.mockResolvedValue(new Response('GET OK'));
      mockPostHandler.mockRejectedValue(new Error('POST Error'));

      const {GET, POST} = await import('./route');

      const getRequest = createMockNextRequest(
        'http://localhost:3000/api/auth/session',
      );
      const postRequest = createMockNextRequest(
        'http://localhost:3000/api/auth/signin',
        {
          method: 'POST',
        },
      );

      const getResult = await GET(getRequest);

      expect(getResult).toBeInstanceOf(Response);
      expect(mockGetHandler).toHaveBeenCalledWith(getRequest);

      await expect(POST(postRequest)).rejects.toThrow('POST Error');
      expect(mockPostHandler).toHaveBeenCalledWith(postRequest);
    });
  });
});
