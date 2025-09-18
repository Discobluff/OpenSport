import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Sports', path: '/sports' },
    { label: 'Trainings', path: '/trainings' },
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <SportsSoccerIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          OpenSport
        </Typography>
        
        {user && (
          <Box sx={{ display: 'flex', gap: 2, mr: 2 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => navigate(item.path)}
                sx={{
                  textDecoration: location.pathname === item.path ? 'underline' : 'none'
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button color="inherit" onClick={handleLogout}>
              Déconnexion
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;