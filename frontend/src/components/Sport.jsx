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
import { Add as AddIcon, Delete as DeleteIcon, Group as GroupIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const Sport = () => {
  const { user } = useAuth();
  const [sport, setSport] = useState([])
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDialogDelete, setOpenDialogDelete] = useState({ open: false, sportId: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { id } = useParams();
  useEffect(() => {
    fetchSport();

  }, []);

  const deleteSport = async (sportId) => {
    try {
      await axios.post(`http://localhost:8080/api/sport/${sportId}/delete`);
      fetchSport();
    } catch (error) {
      console.error('Echec de la suppression du sport', error);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          {sport.name}
        </Typography>
        {!isUserInSport() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleJoinSport()}
          >
            Rejoindre le sport
          </Button>
        )}
      </ Box>

      <Typography component="h2" color="#595959" sx={{ pb: 3 }}>
        {sport.description}
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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



    </Container>
  );
};

export default Sport;