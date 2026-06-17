'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User, LogOut, Compass, Sliders, ClipboardList, Shield } from 'lucide-react';
import { authService } from '../lib/api';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('student');

  // Load user information from local storage or check session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
        try {
          const res = await authService.getMe();
          setUserName(res.user.name);
          setUserRole(res.user.role);
        } catch (error) {
          authService.logout();
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
    
    const handleLoginChange = () => {
      checkAuth();
    };
    window.addEventListener('auth-change', handleLoginChange);
    return () => window.removeEventListener('auth-change', handleLoginChange);
  }, [pathname]);

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setUserName('');
    setUserRole('student');
    router.push('/');
    window.dispatchEvent(new Event('auth-change'));
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      {/* Navbar Container */}
      <div className="max-w-7xl mx-auto flex items-center justify-between premium-card px-6 py-3 rounded-full">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold bg-gradient-to-r from-[#FF6B35] via-[#E04F16] to-[#FF6B35] bg-clip-text text-transparent">
            NextCareers
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#FF6B35] border border-[#FF6B35]/35 px-2 py-0.5 rounded-full bg-[#FF6B35]/5">
            EAPCET OS
          </span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Link 
            href="/predict" 
            className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-[#FF6B35] ${
              isActive('/predict') ? 'text-[#FF6B35]' : 'text-zinc-400'
            }`}
          >
            <Sliders size={15} />
            <span>Predictor</span>
          </Link>
          <Link 
            href="/explorer" 
            className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-[#FF6B35] ${
              isActive('/explorer') ? 'text-[#FF6B35]' : 'text-zinc-400'
            }`}
          >
            <Compass size={15} />
            <span>Explorer</span>
          </Link>
          <Link 
            href="/counselling" 
            className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-[#FF6B35] ${
              isActive('/counselling') ? 'text-[#FF6B35]' : 'text-zinc-400'
            }`}
          >
            <ClipboardList size={15} />
            <span>Counselling Board</span>
          </Link>
          {userRole === 'admin' && (
            <Link 
              href="/admin" 
              className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-[#FF6B35] ${
                isActive('/admin') ? 'text-[#FF6B35]' : 'text-zinc-400'
              }`}
            >
              <Shield size={15} />
              <span>Admin</span>
            </Link>
          )}
        </div>

        {/* Buttons / User Menu */}
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <div className="flex items-center space-x-4">
              <Link 
                href="/profile" 
                className="flex items-center space-x-1 text-sm font-medium text-zinc-300 hover:text-[#FF6B35] transition-colors"
              >
                <User size={15} />
                <span className="hidden sm:inline">{userName || 'Profile'}</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-1 text-sm font-medium text-[#FF6B35] hover:text-white transition-colors bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 px-3.5 py-1.5 rounded-full border border-[#FF6B35]/25"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link 
                href="/login" 
                className="text-sm font-medium text-zinc-450 hover:text-white transition-colors px-3 py-1.5"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="premium-btn-primary px-5 py-2 text-xs"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
