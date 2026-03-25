// src/pages/Login.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from './Login';

// 1. Mock the libraries we depend on
// We use vi.mock to intercept calls to 'axios' and React Router's hooks
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('Login Page', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    vi.clearAllMocks();
    localStorage.clear();
    // Default mock for isAxiosError - returns true if there's a response object
    mockedAxios.isAxiosError.mockImplementation((err: any) => !!err.response);
  });

  it('1. should render the login form correctly', () => {
    render(<Login />);
    
    // Check if the username input, password input, and submit button exist
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('2. should show validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    render(<Login />);
    
    // Click the login button without typing anything
    const submitBtn = screen.getByRole('button', { name: /login/i });
    await user.click(submitBtn);

    // Expect validation messages (assuming the component handles UI validation)
    expect(await screen.findByText(/username is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('3. should display an error message when login fails on the backend', async () => {
    const user = userEvent.setup();
    render(<Login />);

    // Setup an intentional API failure
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { detail: 'Invalid credentials' } }
    });

    // Fill in the form
    await user.type(screen.getByPlaceholderText(/username/i), 'wronguser');
    await user.type(screen.getByPlaceholderText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Verify the error message appears
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('4 & 5. should call backend, store JWT and role, and redirect to home on success', async () => {
    const user = userEvent.setup();
    render(<Login />);

    // Setup a successful API response with our mocked JWT and role
    const mockResponse = {
      data: { access_token: 'fake-jwt-token', role: 'admin' }
    };
    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    // Fill in the form
    await user.type(screen.getByPlaceholderText(/username/i), 'admin');
    await user.type(screen.getByPlaceholderText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Wait for the asynchronous actions to complete
    await waitFor(() => {
      // Ensure Axios was called with the right endpoint and payload
      const expectedUrl = `${import.meta.env.VITE_API_URL}/auth/login`;
      expect(mockedAxios.post).toHaveBeenCalledWith(expectedUrl, expect.any(URLSearchParams));
      
      // Verify the content of the URLSearchParams
      const callArgs = mockedAxios.post.mock.calls[0];
      const params = callArgs[1] as URLSearchParams;
      expect(params.get('username')).toBe('admin');
      expect(params.get('password')).toBe('password123');

      // Ensure localStorage was updated correctly
      expect(localStorage.getItem('token')).toBe('fake-jwt-token');
      expect(localStorage.getItem('role')).toBe('admin');

      // Ensure we navigated to the home '/' route
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
