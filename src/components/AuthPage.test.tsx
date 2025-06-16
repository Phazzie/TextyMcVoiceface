import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest'; // Or import { jest } from '@jest/globals'; if using Jest
import { AuthPage } from './AuthPage';
import { supabaseService } from '../services/implementations/SupabaseService'; // Adjust path as needed
import { User } from '@supabase/supabase-js';

// Mock the supabaseService
vi.mock('../services/implementations/SupabaseService', () => ({
  supabaseService: {
    signInWithEmail: vi.fn(),
    signUp: vi.fn(),
  },
}));

// Mock user data for onAuthSuccess
const mockUser = { id: '123', email: 'test@example.com' } as unknown as User;

describe('AuthPage', () => {
  let onAuthSuccessMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    onAuthSuccessMock = vi.fn();
  });

  test('renders login form by default', () => {
    render(<AuthPage onAuthSuccess={onAuthSuccessMock} />);
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /need an account\? sign up/i })).toBeInTheDocument();
  });

  test('switches to signup form when toggle button is clicked', () => {
    render(<AuthPage onAuthSuccess={onAuthSuccessMock} />);
    fireEvent.click(screen.getByRole('button', { name: /need an account\? sign up/i }));
    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /have an account\? login/i })).toBeInTheDocument();
  });

  test('calls supabaseService.signInWithEmail on login form submission', async () => {
    (supabaseService.signInWithEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: mockUser });
    render(<AuthPage onAuthSuccess={onAuthSuccessMock} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(supabaseService.signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(onAuthSuccessMock).toHaveBeenCalledWith(mockUser);
    });
  });

  test('calls supabaseService.signUp on signup form submission', async () => {
    (supabaseService.signUp as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: mockUser });
    render(<AuthPage onAuthSuccess={onAuthSuccessMock} />);

    fireEvent.click(screen.getByRole('button', { name: /need an account\? sign up/i })); // Switch to signup
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(supabaseService.signUp).toHaveBeenCalledWith('new@example.com', 'newpassword123');
      expect(onAuthSuccessMock).toHaveBeenCalledWith(mockUser);
    });
  });

  test('displays error message on login failure', async () => {
    (supabaseService.signInWithEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false, error: 'Invalid login credentials' });
    render(<AuthPage onAuthSuccess={onAuthSuccessMock} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
      expect(onAuthSuccessMock).not.toHaveBeenCalled();
    });
  });

  test('displays error message on signup failure', async () => {
    (supabaseService.signUp as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false, error: 'User already exists' });
    render(<AuthPage onAuthSuccess={onAuthSuccessMock} />);

    fireEvent.click(screen.getByRole('button', { name: /need an account\? sign up/i })); // Switch to signup
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/user already exists/i)).toBeInTheDocument();
      expect(onAuthSuccessMock).not.toHaveBeenCalled();
    });
  });

  test('shows loading indicator when submitting', async () => {
    // Make the promise pend to check loading state
    (supabaseService.signInWithEmail as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<AuthPage onAuthSuccess={onAuthSuccessMock} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByRole('button', { name: /loading.../i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /loading.../i })).toBeDisabled();
  });
});

// Helper to ensure Vitest's `toBeInTheDocument` and other DOM matchers are available
// This might be needed if not globally configured. Often setup in a vitest.setup.ts file.
// import '@testing-library/jest-dom'; // No, for Vitest it's usually via config.
// For Vitest, extend expect:
// import * as matchers from '@testing-library/jest-dom/matchers'
// import { expect } from 'vitest'
// expect.extend(matchers)
// This setup is usually in a global test setup file (e.g. src/vitest-setup.ts or similar specified in vite.config.ts)
// For this subtask, assume matchers like .toBeInTheDocument() are available.
