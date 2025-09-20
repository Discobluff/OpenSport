import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { setAuthState } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setError(`OAuth error: ${error}`);
        setLoading(false);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        setLoading(false);
        return;
      }

      try {
        // Send the code to our backend for processing
        const response = await axios.get(`http://localhost:8080/api/auth/google/callback?code=${code}&state=${state}`, {
          withCredentials: true
        });

        const { token, user } = response.data;
        
        // Update AuthContext state immediately with the user data
        setAuthState(user, token);

        // Redirect to dashboard - the AuthContext now has the user state updated
        navigate('/dashboard');
      } catch (error) {
        console.error('OAuth callback error:', error);
        setError(error.response?.data?.error || 'Authentication failed');
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuthState]);

  if (loading) {
    return (
      <Container>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">
            Authentification en cours...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body1" align="center">
            <a href="/login">Try logging in again</a>
          </Typography>
        </Paper>
      </Container>
    );
  }

  return null;
};

export default OAuthCallback;