import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Chip,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Group as GroupIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();    
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };


    if (loading) {
      return (
        <Container sx={{ mt: 4 }}>
          <Typography>Chargement...</Typography>
        </Container>
      );
    }
  

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Membres
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box>
        {users.map((user) => (
          <Box
            key={user.id}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderBottom: '1px solid #ccc',
            }}
          >
            <Typography variant="h6">{user.username}</Typography>
            <select
              value={user.role}
              onChange={(e) => {
                const updatedRole = e.target.value;
                user.role = updatedRole;
                axios
                  .post('http://localhost:8080/api/role', {
                    user_id: user.id,
                    role: updatedRole,
                  })
                  .then(() => {
                    setSuccess(`${user.username} est passé ${updatedRole}`);
                  })
                  .catch((error) => {
                    console.error('Erreur pour changer de role :', error);
                    setError(`Echec de changement de rôle pour ${user.username}`);
                  });
              }}
            >
              <option value="Non licencié">Non licencié</option>
              <option value="Licencié">Licencié</option>
              <option value="Admin">Admin</option>
            </select>
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default Users;