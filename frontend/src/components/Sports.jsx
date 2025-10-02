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
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Group as GroupIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Sports = () => {
  const { user } = useAuth();
  const [sports, setSports] = useState([]);
  const [userSports, setUserSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newSport, setNewSport] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSports();
    fetchUserSports();
  }, []);

  const fetchSports = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/sports');
      setSports(response.data.sports || []);
    } catch (error) {
      console.error('Echec de la récupération des sports', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSports = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/user/sports');
      setUserSports(response.data.sports || []);
    } catch (error) {
      console.error('Echec de la récupération des sports du membre :', error);
    }
  };

  const handleCreateSport = async () => {
    setError('');
    setSuccess('');

    if (!newSport.name.trim()) {
      setError('Un nom est requis');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8080/api/sports', newSport);
      handleJoinSport(response.data.sport.id);
      setSuccess('Le sport a été crée avec succès');
      setNewSport({ name: '', description: '' });
      setOpenDialog(false);
      fetchSports();
      fetchUserSports();
    } catch (error) {
      setError(error.response?.data?.error || 'Création du sport échouée');
    }
  };

  const handleJoinSport = async (sportId) => {
    setError('');
    setSuccess('');

    try {
      await axios.post(`http://localhost:8080/api/sports/${sportId}/join`);
      setSuccess('Vous avez rejoint le sport avec succès !');
      fetchUserSports();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to join sport');
    }
  };

  const isUserInSport = (sportId) => {
    return userSports.some(sport => sport.id === sportId);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Sports
        </Typography>
        {(user.role === 'Admin') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Créer un sport
          </Button>
        )}
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

      <Grid container spacing={3}>
        {sports.map((sport) => (

          <Grid key={sport.id}>
            <Card>
              <Tooltip placement="top" title="Aller sur la page du sport" arrow>
                <CardContent
                  onClick={(user.role !== "Non licencié") ? () => navigate(`/sports/${sport.id}`) : () => setError("Vous devez être licencié pour accéder aux sports. Si vous l'êtes, contactez un membre du bureau")}
                  style={{ cursor: 'pointer' }}
                >
                  <Typography variant="h6" gutterBottom>
                    {sport.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {sport.description || 'Pas de description'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <GroupIcon fontSize="small" />
                    <Typography variant="body2">
                      {sport.members?.length || 0} membre{sport.members.length > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </CardContent>
              </Tooltip>
              <CardActions>
                {isUserInSport(sport.id) && (
                  <Chip label="Rejoint" color="success" variant="outlined" />
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {sports.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Aucun sport actuellement
          </Typography>
        </Box>
      )}

      {/* Create Sport Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Création d'un sport</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom du sport"
            fullWidth
            variant="outlined"
            value={newSport.name}
            onChange={(e) => setNewSport({ ...newSport, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newSport.description}
            onChange={(e) => setNewSport({ ...newSport, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button onClick={handleCreateSport} variant="contained">
            Créer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Sports;