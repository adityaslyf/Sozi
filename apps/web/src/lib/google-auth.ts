// Google Identity Services API types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void;
          prompt: () => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonConfiguration) => void;
        };
      };
    };
  }
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: CredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleButtonConfiguration {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  type?: 'standard' | 'icon';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  logo_alignment?: 'left' | 'center';
  width?: string;
  locale?: string;
}

interface CredentialResponse {
  credential: string;
  select_by: string;
}

import AUTH_CONFIG from '@/config/auth';

// Google Client ID from configuration
const GOOGLE_CLIENT_ID = AUTH_CONFIG.GOOGLE_CLIENT_ID;

export class GoogleAuth {
  private static instance: GoogleAuth;
  private isInitialized = false;

  public static getInstance(): GoogleAuth {
    if (!GoogleAuth.instance) {
      GoogleAuth.instance = new GoogleAuth();
    }
    return GoogleAuth.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      // Load Google Identity Services script
      if (!document.querySelector('script[src*="accounts.google.com"]')) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          this.initializeGoogleId();
          this.isInitialized = true;
          resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(script);
      } else {
        this.initializeGoogleId();
        this.isInitialized = true;
        resolve();
      }
    });
  }

  private initializeGoogleId(): void {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: this.handleCredentialResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    }
  }

  private handleCredentialResponse(response: CredentialResponse): void {
    console.log('Google OAuth Response:', response);
    
    // Decode the JWT token to get user info
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      console.log('User Info:', payload);
      
      // Here you would typically send this to your backend
      this.sendTokenToBackend(response.credential, payload);
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }

  private async sendTokenToBackend(token: string, userInfo: any): Promise<void> {
    try {
      console.log('🔄 Sending authentication to backend...');
      
      const response = await fetch(AUTH_CONFIG.API_BASE_URL + AUTH_CONFIG.GOOGLE_AUTH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          token,
          userInfo,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Authentication successful:', data);
        this.handleSuccessfulLogin(data);
      } else {
        console.error('❌ Backend authentication failed:', data);
        alert(`Authentication failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Network error during authentication:', error);
      alert('Network error during authentication. Please check if the backend server is running.');
    }
  }

  private handleSuccessfulLogin(data: any): void {
    console.log('💾 Storing user session data...');
    
    // Store JWT tokens securely
    if (data.tokens) {
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
    }
    
    // Store user profile data
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    // Store full session data for backward compatibility
    localStorage.setItem('userSession', JSON.stringify(data));
    
    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: data }));
    
    // Show success message
    const userName = data.user?.name || data.name || 'User';
    console.log(`🎉 Welcome ${userName}! Login successful.`);
    alert(`Welcome ${userName}! You have been successfully logged in.`);
    
    // Optional: Redirect to dashboard or reload page
    // window.location.href = '/dashboard';
  }

  public async signIn(): Promise<void> {
    // Check if we have a real Google Client ID
    console.log('Current Google Client ID:', GOOGLE_CLIENT_ID);
    console.log('Current origin:', window.location.origin);
    
    if (GOOGLE_CLIENT_ID === 'demo-client-id.googleusercontent.com' || !GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('demo')) {
      console.log('Using demo login because no real Google Client ID is configured');
      alert('Demo Mode: To use real Google login, please:\n\n1. Get Google OAuth Client ID from Google Cloud Console\n2. Add to your .env file in apps/web/:\n   VITE_GOOGLE_CLIENT_ID=your-real-client-id\n3. Add http://localhost:3001 as authorized origin\n4. Restart dev server\n\nFor now, using demo login...');
      this.handleDemoLogin();
      return;
    }

    console.log('🔍 Google OAuth Debug Info:');
    console.log('- Client ID:', GOOGLE_CLIENT_ID);
    console.log('- Origin:', window.location.origin);
    console.log('- Make sure http://localhost:3001 is authorized in Google Cloud Console!');

    try {
      await this.initialize();
      
      if (window.google?.accounts?.id) {
        // Trigger the Google sign-in prompt
        window.google.accounts.id.prompt();
      } else {
        console.error('Google Identity Services not loaded');
        this.handleGoogleError('Google services failed to load');
      }
    } catch (error) {
      console.error('Google OAuth initialization failed:', error);
      this.handleGoogleError('OAuth initialization failed');
    }
  }

  private handleGoogleError(errorMessage: string): void {
    console.error('Google OAuth Error:', errorMessage);
    
    const useDemo = confirm(
      `Google OAuth Error: ${errorMessage}\n\n` +
      'This might be due to:\n' +
      '• Configuration still propagating (wait 10-15 minutes)\n' +
      '• Incorrect authorized origins in Google Cloud Console\n' +
      '• Network/firewall issues\n\n' +
      'Would you like to use demo login instead for now?'
    );
    
    if (useDemo) {
      this.handleDemoLogin();
    }
  }

  private handleDemoLogin(): void {
    // Simulate successful login for demo
    const demoUser = {
      id: 'demo-user-123',
      name: 'Demo User',
      email: 'demo@example.com',
      picture: 'https://via.placeholder.com/150',
      given_name: 'Demo',
      family_name: 'User',
    };

    console.log('Demo login successful:', demoUser);
    
    // Show demo login popup
    const confirmed = confirm(`Demo Login:\n\nName: ${demoUser.name}\nEmail: ${demoUser.email}\n\nClick OK to proceed with demo login.`);
    
    if (confirmed) {
      this.handleSuccessfulLogin({
        user: demoUser,
        userInfo: demoUser,
        name: demoUser.name,
      });
    }
  }

  public async signInWithPopup(): Promise<void> {
    // For popup-style login, we can use the One Tap prompt
    // or create a custom button
    this.signIn();
  }

  public renderButton(container: HTMLElement): void {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.renderButton(container, {
        theme: 'filled_blue',
        size: 'large',
        type: 'standard',
        shape: 'pill',
        text: 'signin_with',
        logo_alignment: 'left',
        width: '300px',
      });
    }
  }

  /**
   * Get current user from localStorage
   */
  public getCurrentUser(): any | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get access token from localStorage
   */
  public getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Check if user is logged in
   */
  public isLoggedIn(): boolean {
    return !!this.getAccessToken() && !!this.getCurrentUser();
  }

  /**
   * Sign out user
   */
  public signOut(): void {
    console.log('🔓 Signing out user...');
    
    // Clear all stored data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userSession');
    
    // Dispatch sign out event
    window.dispatchEvent(new CustomEvent('userSignedOut'));
    
    console.log('✅ User signed out successfully');
    
    // Optional: Reload page or redirect
    // window.location.reload();
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        console.error('No refresh token available');
        return false;
      }

      const response = await fetch(AUTH_CONFIG.API_BASE_URL + '/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update tokens
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        console.log('✅ Token refreshed successfully');
        return true;
      } else {
        console.error('❌ Token refresh failed:', data);
        this.signOut(); // Sign out if refresh fails
        return false;
      }
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      this.signOut(); // Sign out on error
      return false;
    }
  }
}

export const googleAuth = GoogleAuth.getInstance();
