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
    { label: 'Menu', path: '/dashboard', admin: false },
    { label: 'Sports', path: '/sports', admin: false },
    { label: 'Membres', path: '/users', admin: true }
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <SportsSoccerIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          BDS TELECOM Nancy
        </Typography>

        {user && (
          <Box sx={{ display: 'flex', gap: 2, mr: 2 }}>
            {navItems.map((item) => (
              (!item.admin || user.role === 'Admin') && (
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
              )
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