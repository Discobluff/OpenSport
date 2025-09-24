import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { googleLogin, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    const result = await googleLogin();

    if (!result.success) {
      setError(result.message);
      setLoading(false);
    }
    // If successful, the user will be redirected to Google OAuth
  };

  // Show loading indicator while auth state is being determined
  if (authLoading) {
    return (
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
        }}
      >
        <Typography variant="h6">
          Chargement...
        </Typography>
      </Container>
    );
  }

  return (
    <Container
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <img
        src="/bdsRecadre.png"
        alt="Logo du BDS"
        style={{
          marginTop: '10%',
          maxWidth: '40%',
          height: 'auto',
        }}
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2, mt: 2, width: '100%', maxWidth: '400px' }}>
          {error}
        </Alert>
      )}
      <Button
        variant="contained"
        onClick={handleGoogleLogin}
        sx={{
          fontWeight: 'bold',
          py: 1.5,
          backgroundColor: '#fe8400',
          '&:hover': {
            backgroundColor: '#c76f0f',
          },
        }}
        disabled={loading}
      >
        {loading ? 'Chargement...' : 'Se connecter avec Google'}
      </Button>
    </Container>
  );
};

export default Login;