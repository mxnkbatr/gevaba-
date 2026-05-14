import React from 'react';

export const ClerkProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const ClerkLoaded = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const ClerkLoading = () => null;

export const UserButton = () => null;
export const SignInButton = () => null;
export const SignUpButton = () => null;

export const useAuth = () => ({
  isLoaded: true,
  isSignedIn: false,
  userId: null,
  sessionId: null,
  signOut: async () => {},
});

export const useUser = () => ({
  isLoaded: true,
  isSignedIn: false,
  user: null,
});

export const useClerk = () => ({
  signOut: async () => {},
  session: null,
});

export const useSignIn = () => ({
  isLoaded: true,
  signIn: {
    create: async () => { throw new Error("Please use the website to sign in with Clerk."); },
  },
  setActive: async () => {},
});

export const useSignUp = () => ({
  isLoaded: true,
  signUp: {
    create: async () => { throw new Error("Please use the website to sign up as a Monk."); },
    preparePhoneNumberVerification: async () => {},
    attemptPhoneNumberVerification: async () => ({ status: 'complete', createdSessionId: 'mock' }),
  },
  setActive: async () => {},
});
