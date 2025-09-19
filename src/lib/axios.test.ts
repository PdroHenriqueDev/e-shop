import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import axiosInstance from './axios';

describe('axiosInstance', () => {
  let mock: MockAdapter;
  let dispatchEventSpy: any;

  beforeEach(() => {
    mock = new MockAdapter(axiosInstance);
    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
  });

  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  it('should pass through successful responses', async () => {
    mock.onGet('/ok').reply(200, {ok: true});

    const response = await axiosInstance.get('/ok');

    expect(response.data).toEqual({ok: true});
    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });

  it('should dispatch auth-error event on 401 response', async () => {
    mock.onGet('/protected').reply(401, {message: 'nope'});

    await expect(axiosInstance.get('/protected')).rejects.toThrow();

    expect(dispatchEventSpy).toHaveBeenCalledOnce();
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      new CustomEvent('auth-error', {
        detail: {
          message: 'Please log in to continue',
          type: 'error',
        },
      }),
    );
  });

  it('should not dispatch event on non-401 errors', async () => {
    mock.onGet('/server-error').reply(500, {message: 'Internal Server Error'});

    await expect(axiosInstance.get('/server-error')).rejects.toThrow();

    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });
});
