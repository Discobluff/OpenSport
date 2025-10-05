import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer, List, ListItem, ListItemText } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Menu', path: '/dashboard', admin: false },
    { label: 'Sports', path: '/sports', admin: false },
    { label: 'Membres', path: '/users', admin: true }
  ];

  const renderNavItems = () =>
    navItems.map((item) => (
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
    ));

  return (
    <AppBar position="sticky">
      <Toolbar>
        <SportsSoccerIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          BDS TELECOM Nancy
        </Typography>

        {isMobile ? (
          <>
            <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
              <Box sx={{ width: 250 }} role="presentation" onClick={() => setDrawerOpen(false)}>
                <List>
                  {user && renderNavItems().map((item, index) => (
                    <ListItem button key={index} onClick={item.props.onClick} sx={{cursor:"pointer"}}>
                      <ListItemText primary={item.props.children} />
                    </ListItem>
                  ))}
                  {user && (
                    <ListItem button onClick={handleLogout}>
                      <ListItemText primary="Déconnexion" />
                    </ListItem>
                  )}
                </List>
              </Box>
            </Drawer>
          </>
        ) : (
          <>
            {user && <Box sx={{ display: 'flex', gap: 2, mr: 2 }}>{renderNavItems()}</Box>}
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button color="inherit" onClick={handleLogout}>
                  Déconnexion
                </Button>
              </Box>
            )}
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;