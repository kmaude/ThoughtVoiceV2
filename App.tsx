import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout.tsx';
import { Onboarding } from './pages/Onboarding.tsx';
import { Login } from './pages/Login.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Capture } from './pages/Capture.tsx';
import { Editor } from './pages/Editor.tsx';
import { Library } from './pages/Library.tsx';
import { InternalDashboard } from './pages/InternalDashboard.tsx';
import { Review } from './pages/Review.tsx';
import { Profile } from './pages/Profile.tsx';
import { db } from './services/database.ts';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const profile = await db.getUser();
      setIsAuthenticated(!!(profile && profile.isOnboarded && profile.subscriptionStatus === 'ACTIVE'));
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) return null; 

  if (!isAuthenticated) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Layout>{children}</Layout>;
};

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const profile = await db.getUser();
      setIsOnboarded(!!(profile && profile.isOnboarded && profile.subscriptionStatus === 'ACTIVE'));
    };
    checkUser();
  }, []);

  if (isOnboarded === null) return null; 

  return (
    <Router>
      <Routes>
        <Route path="/onboarding" element={
          isOnboarded ? <Navigate to="/" /> : <Onboarding onComplete={() => setIsOnboarded(true)} />
        } />
        
        <Route path="/login" element={
          isOnboarded ? <Navigate to="/" /> : <Login onLogin={() => setIsOnboarded(true)} />
        } />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/capture" element={
          <ProtectedRoute>
            <Capture />
          </ProtectedRoute>
        } />

        <Route path="/library" element={
          <ProtectedRoute>
             <Library />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
             <Profile />
          </ProtectedRoute>
        } />

        <Route path="/editor/:id" element={
          <ProtectedRoute>
             <Editor />
          </ProtectedRoute>
        } />
        
        <Route path="/review/:id" element={
             <Review />
        } />

        <Route path="/internal" element={
          // Intentionally left unprotected for demo purposes so user can switch roles easily
          <InternalDashboard />
        } />
      </Routes>
    </Router>
  );
}