import React, { useState, useEffect } from 'react';
import {
  Button,
  Container,
  Typography,
  TextField,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialogDelete, setOpenDialogDelete] = useState({ open: false, name: '', userId: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchRole, setSearchRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [searchName, searchRole]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/users${searchName || searchRole ? `?` : ''}${searchName ? `name=${searchName}` : ''}${searchName && searchRole ? `&` : ''}${searchRole ? `role=${searchRole}` : ''}`);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async () =>{
    try {
      await axios.post(`http://localhost:8080/api/users/${openDialogDelete.userId}/delete`);
      setSuccess('Membre supprimé');
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      setError('Suppression échouée');
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
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          label="Rechercher par nom"
          variant="outlined"
          value={searchName}
          onChange={(e) => {
            setSearchName(e.target.value);
          }}
          fullWidth
        />
        <TextField
          select
          label="Filtrer par rôle"
          value={searchRole}
          onChange={(e) => {
            setSearchRole(e.target.value);
          }}
          slotProps={{
            select: {
              native: true,
            },
          }}
          fullWidth
        >
          <option value=""></option>
          <option value="Non licencié">Non licencié</option>
          <option value="Licencié">Licencié</option>
          <option value="Admin">Admin</option>
        </TextField>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <select
                value={user.role}
                onChange={(e) => {
                  const updatedRole = e.target.value;
                  axios
                    .post('http://localhost:8080/api/role', {
                      user_id: user.id,
                      role: updatedRole,
                    })
                    .then(() => {
                      user.role = updatedRole;
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
              <Tooltip title="Supprimer le membre" arrow>
              <DeleteIcon
                onClick={() => setOpenDialogDelete({open:true, name:user.username, userId:user.id})}
                sx={{ cursor: 'pointer' }}
              /></Tooltip>
            </Box>
          </Box>
        ))}
      </Box>

      {/* User confirmation deletion Dialog */}
      <Dialog
        open={openDialogDelete.open}
        onClose={() => setOpenDialogDelete({ open: false, name: '', userId: '' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer {openDialogDelete.name} de la liste des membres ? Cette action est irréversible.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialogDelete({ open: false, name: '', userId: '' })}>Annuler</Button>
          <Button
            onClick={() => {
              deleteUser(openDialogDelete.userId);
              setOpenDialogDelete({ open: false, name: '', userId: ''});
            }}
            variant="contained"
            color="error"
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>


    </Container>
  );
};

export default Users;