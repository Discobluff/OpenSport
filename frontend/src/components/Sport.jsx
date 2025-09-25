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
import { Add as AddIcon, Delete as DeleteIcon, Group as GroupIcon, Edit as EditIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const Sport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sport, setSport] = useState([])
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogEdit, setDialogEdit] = useState({ open: false, name: '', description: '' });
  const [dialogDelete, setDialogDelete] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { id } = useParams();
  useEffect(() => {
    fetchSport();

  }, []);

  const deleteSport = async () => {
    try {
      await axios.post(`http://localhost:8080/api/sport/${sport.id}/delete`);
      navigate("/sports");
    } catch (error) {
      console.error('Echec de la suppression du sport', error);
    }
  };

  const editSport = async () => {
    try {
      await axios.post(`http://localhost:8080/api/sport/${sport.id}/edit`, { name: dialogEdit.name, description: dialogEdit.description });
      fetchSport();
    } catch (error) {
      console.error("Echec de l'édition du sport", error);
    }
  };

  const fetchSport = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/sport/${id}`);
      setSport(response.data.sport || []);
      setMembers(response.data.members || []);
    } catch (error) {
      console.error('Echec de la récupération des sports', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSport = async () => {
    setError('');
    setSuccess('');

    try {
      await axios.post(`http://localhost:8080/api/sport/${sport.id}/join`);
      setSuccess('Vous avez rejoint le sport avec succès !');
      fetchSport();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to join sport');
    }
  };

  const isUserInSport = () => {
    return sport.members.includes(user.id);
  };

  const isUserAdminOfSport = (sport) => {
    return sport.admin_id === user?.id;
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
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          {sport.name}
        </Typography>
        {(user.role === "Admin") && (
          <EditIcon sx={{ cursor: 'pointer', ml: 2 }} onClick={() => setDialogEdit({ open: true, id: sport.id, name: sport.name, description: sport.description })} />
        )}
        {(user.role === "Admin") && (
          <DeleteIcon sx={{ cursor: 'pointer', ml: 2 }} onClick={() => setDialogDelete(true)} />
        )}
        {!isUserInSport() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleJoinSport()}
            sx={{ ml: 2 }}
          >
            Rejoindre le sport
          </Button>
        )}
      </ Box>

      <Typography component="h2" color="#595959" sx={{ mb: 2 }}>
        {sport.description || "Pas de description"}
      </Typography>

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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
        <Typography variant="h5" component="h1">
          Membres
        </Typography>
      </ Box>
      <Box>
        {members.map((member) => (
          <Box
            key={member.id}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 1,
              borderBottom: '1px solid #ccc',
            }}
          >
            <Typography variant="h6">{member.name}</Typography>
          </Box>
        ))}
      </Box>

      {/* Sport edition dialog*/}
      <Dialog open={dialogEdit.open} onClose={() => setDialogEdit({ open: false, name: dialogEdit.name, description: dialogEdit.description })} maxWidth="sm" fullWidth>
        <DialogTitle>Edition</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom du sport"
            fullWidth
            variant="outlined"
            value={dialogEdit.name}
            onChange={(e) => setDialogEdit({ open: true, name: e.target.value, description: dialogEdit.description })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={dialogEdit.description}
            onChange={(e) => setDialogEdit({ open: true, name: dialogEdit.name, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEdit({ open: false, name: dialogEdit.name, description: dialogEdit.description })}>Annuler</Button>
          <Button onClick={() => { editSport(); setDialogEdit({ open: false, name: dialogEdit.description, description: dialogEdit.description }) }} variant="contained">
            Editer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sport deletion dialog*/}
      <Dialog open={dialogDelete} onClose={() => setDialogDelete(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer le sport ? Cette action est irréversible.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogDelete(false)}>Annuler</Button>
          <Button
            onClick={() => {
              deleteSport();
              setDialogDelete(false);
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

export default Sport;