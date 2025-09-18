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
    <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
      <img 
        src={`/bds.png`} 
        alt="Logo du bds" 
        style={{ maxWidth: '100%', height: 'auto', marginBottom: '20px' }} 
      />
      <Button
        variant="contained"
        onClick={handleGoogleLogin}
        sx={{ 
          py: 1.5,
          backgroundColor: '#4285f4',
          '&:hover': {
            backgroundColor: '#357ae8'
          }
        }}
        disabled={loading}
      >
        {loading ? 'Redirection vers Google...' : 'Connexion avec Google'}
      </Button>
    </Container>
  );
};

export default Login;