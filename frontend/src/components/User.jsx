import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Alert,
  Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, ArrowBack as ArrowBackIcon, PersonRemove as PersonRemoveIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import 'dayjs/locale/fr';
import dayjs from 'dayjs';

const User = () => {
  const { user } = useAuth();
  const [userReq, setUser] = useState([]);
  const [sports, setSports] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogRemoveSport, setDialogRemoveSport] = useState({ open: false, sportId: '' });
  const [dialogRemoveTraining, setDialogRemoveTraining] = useState({ open: false, trainingId: '' });

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    fetchUser();
    fetchSports();
    fetchTrainings();
  }, []);

  const removeFromTraining = async (trainingId) => {
    try {
      const response = await axios.post(`http://localhost:8080/api/trainings/${trainingId}/remove/${id}`);
      fetchTrainings();
    } catch (error) {
      console.error("Echec du retirement de l'entraînement", error);
    }
  };

  const removeFromSport = async (sportId) => {
    try {
      const response = await axios.post(`http://localhost:8080/api/sports/${sportId}/remove/${id}`);
      fetchSports();
    } catch (error) {
      console.error("Echec du retirement du sport", error);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/users/${id}`);
      setUser(response.data.user || []);
    } catch (error) {
      console.error("Echec de la récupération du membre", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSports = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/users/${id}/sports`);
      setSports(response.data.sports || []);
    } catch (error) {
      console.error("Echec de la récupération des sports du membre", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainings = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/users/${id}/trainings`);
      setTrainings(response.data.trainings || []);
    } catch (error) {
      console.error("Echec de la récupération des entraînements du membre", error);
    } finally {
      setLoading(false);
    }
  };

  const getSportName = (sportId) => {
    let res = "";
    sports.forEach(sport => {
      if (sport.id === sportId) {
        res = sport.name;
      }
    });
    return res;
  };

  const getDay = (date) => {
    let res = dayjs(date).locale('fr').format("dddd");
    return res.charAt(0).toUpperCase() + res.slice(1);
  };

  const isUserAdminOfSport = (sportId) => {
    return sport.admins_id != undefined && id != undefined ? sport.admins_id === id : false;
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
      <Typography variant='h3'>{userReq.username}</Typography>
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
      <Typography variant='h4' sx={{ mt: 2 }}>Sports rejoints</Typography>

      {sports.map((sport) => (
        <Box
          key={sport.id}
          onClick={() => navigate(`/sports/${sport.id}`)}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderBottom: '1px solid #ccc',
            cursor: 'pointer',
          }}
        >
          <Typography variant="h6">{sport.name}</Typography>
          <Tooltip title="Retirer du sport" arrow >
            <PersonRemoveIcon sx={{ cursor: "pointer", ml: 2 }} onClick={(e) => { e.stopPropagation(); setDialogRemoveSport({ open: true, sportId: sport.id, sportName: sport.name }) }} />
          </Tooltip>
        </Box>
      ))}

      <Typography variant='h4' sx={{ mt: 2 }}>Entraînements rejoints</Typography>

      {trainings.map((training) => (
        <Box
          key={training.id}
          onClick={() => navigate(`/trainings/${training.id}`)}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderBottom: '1px solid #ccc',
            cursor: 'pointer',
          }}
        >
          <Typography variant="h6">{getSportName(training.sport_id)}, {getDay(training.date)} {dayjs(training.date).format('DD/MM/YYYY')}</Typography>
          <Tooltip title="Retirer de l'entraînement" arrow >
            <PersonRemoveIcon sx={{ cursor: "pointer", ml: 2 }} onClick={(e) => { e.stopPropagation(); setDialogRemoveTraining({ open: true, trainingId: training.id, date: training.date,sportName:getSportName(training.sport_id)}) }} />
          </Tooltip>
        </Box>
      ))}

      <Dialog
        open={dialogRemoveSport.open}
        onClose={() => setDialogRemoveSport({ open: false, sportId: '', sportName: '' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmer le retirement</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir retirer {userReq.username} du sport {dialogRemoveSport.sportName} ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogRemoveSport({ open: false, sportId: '', sportName: '' })}>Annuler</Button>
          <Button
            onClick={() => {
              removeFromSport(dialogRemoveSport.sportId);
              setDialogRemoveSport({ open: false, sportId: '', sportName: '' });
            }}
            variant="contained"
            color="error"
          >
            Retirer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialogRemoveTraining.open}
        onClose={() => setDialogRemoveTraining({ open: false, trainingId: '', date: '', sportName: '' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmer le retirement</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir retirer {userReq.username} de de l'entraînement de {dialogRemoveTraining.sportName} du {getDay(dialogRemoveTraining.date)} {dayjs(dialogRemoveTraining.date).format("DD/MM/YYYY")} ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogRemoveTraining({ open: false, trainingId: '', date: '', sportName: '' })}>Annuler</Button>
          <Button
            onClick={() => {
              removeFromTraining(dialogRemoveTraining.trainingId);
              setDialogRemoveTraining({ open: false, trainingId: '', date: '', sportName: '' })
            }}
            variant="contained"
            color="error"
          >
            Retirer
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default User;