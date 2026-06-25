import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/api';

export default function IdleTimer() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);
  
  const idleTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  
  const IDLE_LIMIT = 14 * 60 * 1000; // 14 minutes in milliseconds before warning
  const WARNING_LIMIT = 60; // 60 seconds countdown
  
  const resetTimer = () => {
    if (showWarning) return; // Don't reset if warning is already showing
    
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    
    idleTimeoutRef.current = setTimeout(() => {
      triggerWarning();
    }, IDLE_LIMIT);
  };
  
  const triggerWarning = () => {
    setShowWarning(true);
    setCountdown(WARNING_LIMIT);
  };
  
  const handleStayLoggedIn = async () => {
    try {
      await authService.heartbeat();
    } catch (err) {
      console.error('Failed to extend session:', err);
    }
    setShowWarning(false);
    resetTimer();
  };
  
  const handleLogout = () => {
    setShowWarning(false);
    logout();
    navigate('/login', { state: { message: 'You have been logged out.' } });
  };
  
  useEffect(() => {
    if (!user) return;
    
    // Add event listeners for user activity
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    
    resetTimer();
    
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [user, showWarning]);
  
  useEffect(() => {
    if (showWarning) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
    
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarning]);
  
  if (!showWarning) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        maxWidth: '420px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(245, 158, 11, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <AlertTriangle size={28} color="var(--warning)" />
        </div>
        
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
          Inactivity Warning
        </h3>
        
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: 24 }}>
          Your session will expire in <strong style={{ color: 'var(--warning)', fontSize: '1rem' }}><Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{countdown} seconds</strong> due to inactivity. Please click below to stay logged in.
        </p>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ flex: 1, gap: 8 }} 
            onClick={handleLogout}
          >
            <LogOut size={16} /> Log Out
          </button>
          
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ flex: 1 }} 
            onClick={handleStayLoggedIn}
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
