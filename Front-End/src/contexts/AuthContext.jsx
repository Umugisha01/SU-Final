import { createContext, useContext, useState } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('su-user'));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState({});

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      if (data.success) {
        if (data.mfaRequired) {
          // If MFA is required (e.g. for Admin), return mfaRequired
          setLoading(false);
          return { success: true, mfaRequired: true, accessToken: data.accessToken, user: data.user };
        }
        
        setUser(data.user);
        localStorage.setItem('su-user', JSON.stringify(data.user));
        localStorage.setItem('su-access-token', data.accessToken);
        setLoading(false);
        return { success: true };
      } else {
        throw new Error(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginAttempts(a => ({ ...a, [email]: (a[email] || 0) + 1 }));
      setLoading(false);
      return { 
        success: false, 
        error: err.response?.data?.error || err.response?.data?.detail || err.message || 'Invalid email or password' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('su-user');
    localStorage.removeItem('su-access-token');
    localStorage.removeItem('su-refresh-token');
  };

  const register = async (data) => {
    setLoading(true);
    try {
      // Map fullName to matching serializer fullName field
      const registrationPayload = {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role || 'coordinator',
        region: data.region || 'Kigali City',
        department: data.department || 'Outreach',
        position: data.position || 'Regional Coordinator',
        phone: data.phone || '',
      };
      const res = await authService.register(registrationPayload);
      if (res.success) {
        setUser(res.user);
        localStorage.setItem('su-user', JSON.stringify(res.user));
        localStorage.setItem('su-access-token', res.token);
        setLoading(false);
        return { success: true };
      } else {
        throw new Error(res.error || 'Registration failed');
      }
    } catch (err) {
      setLoading(false);
      // DRF errors might be objects, extract first error string
      let errorMsg = 'Registration failed';
      if (err.response?.data?.error) {
        const errObj = err.response.data.error;
        if (typeof errObj === 'object') {
          errorMsg = Object.entries(errObj)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(' ') : msgs}`)
            .join(' | ');
        } else {
          errorMsg = errObj;
        }
      }
      return { success: false, error: errorMsg };
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, register, loginAttempts }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

