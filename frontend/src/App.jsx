import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sports from './components/Sports';
import OAuthCallback from './components/OAuthCallback';
import Users from './components/Users'
import Sport from './components/Sport'
import Training from './components/Training'

const theme = createTheme({
  palette: {
    primary: {
      main: '#fe8400',
    },
    secondary: {
      main: '#6c2466',
    },
  },
});

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />
              <Route path="*" element={
                <>
                  <Navbar />
                  <Routes>
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/sports" element={
                      <ProtectedRoute>
                        <Sports />
                      </ProtectedRoute>
                    } />
                    <Route path="/sport/:id" element={
                      <ProtectedRoute>
                        <Sport />
                      </ProtectedRoute>
                    } />
                    <Route path="/users" element={
                      <ProtectedRoute>
                        <Users />
                      </ProtectedRoute>
                    } />
                    <Route path="/training/:id" element={
                      <ProtectedRoute>
                        <Training />
                      </ProtectedRoute>
                    } />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </>
              } />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
