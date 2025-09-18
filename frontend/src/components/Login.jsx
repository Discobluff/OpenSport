import React, { useState } from 'react';
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
  
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

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
  <Button
    variant="contained"
    onClick={handleGoogleLogin}
    sx={{
      fontWeight:'bold',
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