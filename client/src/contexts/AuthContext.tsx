import { createContext, useContext, type ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { LoginUser, PublicUser, RegisterUser } from '@shared/schema';
import { apiRequest, getQueryFn, queryClient } from '@/lib/queryClient';

type AuthContextValue = {
  user: PublicUser | null;
  isLoading: boolean;
  login: (credentials: LoginUser) => Promise<PublicUser>;
  register: (data: RegisterUser) => Promise<PublicUser>;
  logout: () => Promise<void>;
  isAuthenticating: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useQuery<PublicUser | null>({
    queryKey: ['/api/auth/me'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return (await response.json()) as PublicUser;
    },
    onSuccess: (signedInUser) => {
      queryClient.setQueryData(['/api/auth/me'], signedInUser);
      queryClient.invalidateQueries({ queryKey: ['/api/reminders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/labels'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterUser) => {
      const response = await apiRequest('POST', '/api/auth/register', data);
      return (await response.json()) as PublicUser;
    },
    onSuccess: (signedInUser) => {
      queryClient.setQueryData(['/api/auth/me'], signedInUser);
      queryClient.invalidateQueries({ queryKey: ['/api/reminders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/labels'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(['/api/auth/me'], null);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login: loginMutation.mutateAsync,
        register: registerMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        isAuthenticating:
          loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
