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
import { Add as AddIcon, Group as GroupIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const Sports = () => {
  const { user } = useAuth();
  const [training, setTraining] = useState([]);
  const [sport, setSport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialogDelete, setOpenDialogDelete] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    fetchTraining();
  }, []);

  useEffect(() => {
    fetchSport();
  }, [training.sport_id])

  const fetchSport = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/sport/${training.sport_id}`);
      setSport(response.data.sport || []);
    } catch (error) {
      console.error("Echec de la récupération du sport", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTraining = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/training/${id}`);
      setTraining(response.data.training || []);
    } catch (error) {
      console.error("Echec de la récupération de l'entraînement", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTraining = async () => {
    try {
      await axios.post(`http://localhost:8080/api/trainings/${id}/delete`);
      navigate(`/sport/${training.sport_id}`);
    } catch (error) {
      console.error('Echec de la suppression du sport', error);
    }
  };

  const joinTraining = async () => {
    try {
      const response = await axios.post(`http://localhost:8080/api/trainings/${id}/join`);
      fetchTraining();
    } catch (error) {
      console.error("Echec du rejoignement de l'entraînement", error);
    } finally {
      setLoading(false);
    }
  };

  const leaveTraining = async () => {
    try {
      const response = await axios.post(`http://localhost:8080/api/trainings/${id}/leave`);
      fetchTraining();
    } catch (error) {
      console.error("Echec du quittage de l'entraînement", error);
    } finally {
      setLoading(false);
    }
  };

  const isUserPresentInTraining = () => {
    return training.presents.includes(user.id);
  };

  const isUserAbsentInTraining = () => {
    return training.absents.includes(user.id);
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
      <ArrowBackIcon sx={{cursor:'pointer'}} onClick={() => navigate(`/sport/${sport.id}`)}/>
      <Typography variant='h3'>Entraînement de {sport.name}</Typography>
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

      <Typography variant='h4'>{training.date} de {training.time_start} à {training.time_end}</Typography>
      <Typography variant='h5' sx={{ mt: 3 }}>{training.title}</Typography>
      <Typography variant='h6' color="#595959" sx={{ mb: 3 }}>{training.description}</Typography>

      {isUserPresentInTraining() ? (
        <Box>
          <Button sx={{ color: "#FFFFFF", background: "#24bf27", border: 1, m: 2 }} onClick={joinTraining}>Présent</Button>
          <Button sx={{ color: "#ff2121", background: "transparent", border: 1 }} onClick={leaveTraining}>Absent</Button>
        </Box>
      ) : isUserAbsentInTraining() ? (
        <Box>
          <Button sx={{ color: "#24bf27", background: "transparent", border: 1, m: 2 }} onClick={joinTraining}>Présent</Button>
          <Button sx={{ color: "#FFFFFF", background: "#ff2121", border: 1 }} onClick={leaveTraining}>Absent</Button>
        </Box>
      ) : (
        <Box>
          <Button sx={{ color: "#24bf27", background: "transparent", border: 1, m: 2 }} onClick={joinTraining}>Présent</Button>
          <Button sx={{ color: "#ff2121", background: "transparent", border: 1 }} onClick={leaveTraining}>Absent</Button>
        </Box>
      )}
{/*onglet presents absents */}
      {/* Delete Training Dialog */}
      <Dialog
        open={openDialogDelete}
        onClose={() => setOpenDialogDelete(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer l'entraînement ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialogDelete(false)}>Annuler</Button>
          <Button
            onClick={() => {
              deleteTraining();
              setOpenDialogDelete(false);
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

export default Sports;