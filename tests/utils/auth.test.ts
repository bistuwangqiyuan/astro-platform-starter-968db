import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signUp, signIn, signOut, updatePassword } from '../../src/utils/auth';
import { supabase } from '../../src/utils/supabase';

// Mock Supabase
vi.mock('../../src/utils/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
      getUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

describe('Auth Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { access_token: 'token123' };
      
      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await signUp('test@example.com', 'password123');

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual({ user: mockUser, session: mockSession });
    });

    it('should throw error when sign up fails', async () => {
      const mockError = { message: 'User already exists' };
      
      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      });

      await expect(signUp('test@example.com', 'password123')).rejects.toThrow();
    });
  });

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { access_token: 'token123' };
      
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await signIn('test@example.com', 'password123');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual({ user: mockUser, session: mockSession });
    });

    it('should throw error when sign in fails', async () => {
      const mockError = { message: 'Invalid credentials' };
      
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      });

      await expect(signIn('test@example.com', 'wrongpassword')).rejects.toThrow();
    });
  });

  describe('signOut', () => {
    it('should successfully sign out a user', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
        error: null,
      });

      const result = await signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should throw error when sign out fails', async () => {
      const mockError = { message: 'Sign out failed' };
      
      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
        error: mockError,
      });

      await expect(signOut()).rejects.toThrow();
    });
  });

  describe('updatePassword', () => {
    it('should successfully update password', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      
      vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const result = await updatePassword('newpassword123');

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
      expect(result).toEqual({ user: mockUser });
    });

    it('should throw error when password update fails', async () => {
      const mockError = { message: 'Password update failed' };
      
      vi.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
        data: { user: null },
        error: mockError,
      });

      await expect(updatePassword('newpassword123')).rejects.toThrow();
    });
  });
});