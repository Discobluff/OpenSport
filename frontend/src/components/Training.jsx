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
import { Delete as DeleteIcon, Edit as EditIcon, ArrowBack as ArrowBackIcon, PersonRemove as PersonRemoveIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import 'dayjs/locale/fr';
import dayjs from 'dayjs';

const Sports = () => {
  const { user } = useAuth();
  const [training, setTraining] = useState([]);
  const [sport, setSport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogDelete, setDialogDelete] = useState(false);
  const [dialogRemove, setDialogRemove] = useState({ open: false, id: "", name: "" });
  const [dialogEdit, setDialogEdit] = useState({ open: false, title: '', description: '', location: '', date: null, time_start: null, time_end: null, max_participants: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openStartTime, setOpenStartTime] = useState(false);
  const [openEndTime, setOpenEndTime] = useState(false);
  const [activePanel, setActivePanel] = useState('presents');
  const [presents, setPresents] = useState([]);
  const [absents, setAbsents] = useState([]);

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    fetchTraining();
  }, []);

  useEffect(() => {
    fetchSport();
    updateEdit();
  }, [training.sport_id])

  const fetchSport = async () => {
    if (training.sport_id != undefined) {
      try {
        const response = await axios.get(`http://localhost:8080/api/sport/${training.sport_id}`);
        setSport(response.data.sport || []);
      } catch (error) {
        console.error("Echec de la récupération du sport", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const removeFromTraining = async (userId) => {
    try {
      const response = await axios.post(`http://localhost:8080/api/trainings/${id}/remove/${userId}`);
      fetchTraining();
    } catch (error) {
      console.error("Echec du retirement de l'entraînement", error);
    }
  };

  const fetchTraining = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/training/${id}`);
      setTraining(response.data.training || []);
      setPresents(response.data.presents || []);
      setAbsents(response.data.absents || []);
    } catch (error) {
      console.error("Echec de la récupération de l'entraînement", error);
    } finally {
      setLoading(false);
    }
  };

  const editTraining = async () => {
    try {
      await axios.post(`http://localhost:8080/api/trainings/${id}/edit`, { ...dialogEdit, sport_id: sport.id, date: dialogEdit.date.format('DD/MM/YYYY'), time_start: dialogEdit.time_start.format('HH:mm'), time_end: dialogEdit.time_end.format('HH:mm') });
      fetchTraining();
      setSuccess("Entraînement modifié avec succès");
    } catch (error) {
      console.error("Echec de la modification de l'entraînement", error);
      setError("L'entraînement n'a pas pu être modifié")
    }
  };

  const deleteTraining = async () => {
    try {
      await axios.post(`http://localhost:8080/api/trainings/${id}/delete`);
      navigate(`/sport/${training.sport_id}`);
    } catch (error) {
      console.error("Echec de la suppression de l'entraînement", error);
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

  const updateEdit = () => {
    if (training.sport_id != undefined) {
      setDialogEdit({
        open: false,
        title: training.title,
        description: training.description,
        location: training.location,
        date: dayjs(training.date, "DD/MM/YYYY").locale('fr').startOf('day'),
        time_start: dayjs().set('hour', training.time_start.split(':')[0]).set('minute', training.time_start.split(':')[1]).set('second', 0).set('millisecond', 0).locale('fr'),
        time_end: dayjs().set('hour', training.time_end.split(':')[0]).set('minute', training.time_end.split(':')[1]).set('second', 0).set('millisecond', 0).locale('fr'),
        max_participants: training.max_participants ? training.max_participants.toString() : '',
      });
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
      <Tooltip placement="top" title="Retour au sport" arrow>
        <ArrowBackIcon sx={{ cursor: 'pointer' }} onClick={() => navigate(`/sport/${sport.id}`)} />
      </Tooltip>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant='h3'>Entraînement de {sport.name}</Typography>
        <Tooltip title="Modifier l'entraînement" arrow>
          <EditIcon fontSize='large' sx={{ ml: 2, cursor: 'pointer' }} onClick={() => setDialogEdit({ ...dialogEdit, open: true })} />
        </Tooltip>
        <Tooltip title="Supprimer l'entraînement" arrow>
          <DeleteIcon onClick={() => setDialogDelete(true)} fontSize='large' sx={{ cursor: 'pointer' }} />
        </Tooltip>
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
      <div style={{
        display: 'flex',
        background: '#cfcfcf',
        justifyContent: 'flex-start',
      }}>
        {/* Onglet Presents */}
        <button
          onClick={() => setActivePanel('presents')}
          style={{
            background: activePanel === 'presents' ? '#FFFFFF' : 'transparent',
            borderRadius: '0',
            color: activePanel === 'presents' ? '#6c2466' : '#000000',
            cursor: 'pointer',
            position: 'relative',
            fontSize: 'larger',
          }}
        >
          Présents
          {activePanel === 'presents' && (
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              width: '100%',
              height: '3px',
              backgroundColor: '#6c2466',
            }} />
          )}
        </button>

        {/* Onglet Absents */}
        <button
          onClick={() => setActivePanel('absents')}
          style={{
            padding: '12px 24px',
            background: activePanel === 'absents' ? '#FFFFFF' : 'transparent',
            fontSize: 'larger',
            borderRadius: '0',
            color: activePanel === 'absents' ? '#6c2466' : '#000000',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          Absents
          {activePanel === 'absents' && (
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              width: '100%',
              height: '3px',
              backgroundColor: '#6c2466',
            }} />
          )}
        </button>
      </div>

      {/* Panel Presents */}
      {activePanel === "presents" && (
        <Box>
          {presents.map((member) => (
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
              <Typography variant="h6">{member.username}</Typography>
              <Tooltip title="Retirer de l'entraînement" arrow>
                <PersonRemoveIcon sx={{ cursor: "pointer" }} onClick={() => setDialogRemove({ open: true, id: member.id, name: member.username })} />
              </Tooltip>
            </Box>
          ))}
        </Box>
      )}
      {/* Panel Absents */}
      {activePanel === "absents" && (
        <Box>
          {absents.map((member) => (
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
              <Typography variant="h6">{member.username}</Typography>
            </Box>
          ))}
        </Box>
      )}
      {/* Delete Training Dialog */}
      <Dialog
        open={dialogDelete}
        onClose={() => setDialogDelete(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer l'entraînement ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogDelete(false)}>Annuler</Button>
          <Button
            onClick={() => {
              deleteTraining();
              setDialogDelete(false);
            }}
            variant="contained"
            color="error"
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
      {/* Remove from Training Dialog */}
      <Dialog
        open={dialogRemove.open}
        onClose={() => setDialogRemove({ open: false, id: "", name: "" })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmer le retirement</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir retirer {dialogRemove.name} de l'entraînement ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogRemove({ open: false, id: "", name: "" })}>Annuler</Button>
          <Button
            onClick={() => {
              removeFromTraining(dialogRemove.id);
              setDialogRemove({ open: false, id: "", name: "" });
            }}
            variant="contained"
            color="error"
          >
            Retirer
          </Button>
        </DialogActions>
      </Dialog>

      {/*Dialog edit */}
      <Dialog open={dialogEdit.open} onClose={() => setDialogEdit({ ...dialogEdit, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Modification de l'entraînement</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom (optionnel)"
            fullWidth
            variant="outlined"
            value={dialogEdit.title}
            onChange={(e) => setDialogEdit({ ...dialogEdit, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optionnel)"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={dialogEdit.description}
            onChange={(e) => setDialogEdit({ ...dialogEdit, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Lieu"
            fullWidth
            multiline
            rows={1}
            variant="outlined"
            value={dialogEdit.location}
            onChange={(e) => setDialogEdit({ ...dialogEdit, location: e.target.value })}
            sx={{ mb: 2 }}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
            <Grid container >
              <Grid>
                <DatePicker
                  label="Date de l'entraînement"
                  value={dialogEdit.date}
                  onChange={(newValue) => setDialogEdit({ ...dialogEdit, date: newValue })}
                  disablePast
                  sx={{ mb: 2 }}
                  slotProps={{ textField: { margin: 'dense', variant: 'outlined' } }}
                  format="DD/MM/YYYY"
                />
              </Grid>
              <Grid container spacing={2}>
                <Grid>
                  <TextField
                    label="Heure de début"
                    value={dialogEdit.time_start ? dialogEdit.time_start.format('HH:mm') : ''}
                    onClick={() => setOpenStartTime(true)}
                    fullWidth
                    variant="outlined"
                    margin="dense"
                  />
                  <Dialog open={openStartTime} onClose={() => setOpenStartTime(false)}>
                    <StaticTimePicker
                      value={dialogEdit.time_start}
                      onChange={(newValue) => {
                        setDialogEdit({ ...dialogEdit, time_start: newValue });
                      }}
                      onAccept={() => setOpenStartTime(false)}
                      ampm={false}
                      slotProps={{
                        actionBar: {
                          actions: ['accept'],
                        },
                      }}
                      sx={{ p: 2 }}
                    />
                  </Dialog>
                </Grid>
                <Grid>
                  <TextField
                    label="Heure de fin"
                    value={dialogEdit.time_end ? dialogEdit.time_end.format('HH:mm') : ''}
                    onClick={() => setOpenEndTime(true)}
                    fullWidth
                    variant="outlined"
                    margin="dense"
                  />
                  <Dialog open={openEndTime} onClose={() => setOpenEndTime(false)}>
                    <StaticTimePicker
                      value={dialogEdit.endTime}
                      onChange={(newValue) => {
                        setDialogEdit({ ...dialogEdit, time_end: newValue });
                      }}
                      onAccept={() => setOpenEndTime(false)}
                      ampm={false}
                      shouldDisableTime={(timeValue, clockType) => {
                        if (!dialogEdit.startTime) return false;
                        const startTime = dialogEdit.startTime;
                        if (clockType === 'hours') {
                          return timeValue < startTime.hour();
                        }
                        if (clockType === 'minutes') {
                          return timeValue < startTime.minute() && startTime.hour() === timeValue;
                        }
                        return false;
                      }}
                      slotProps={{
                        actionBar: {
                          actions: ['accept'],
                        },
                      }}
                      sx={{ p: 2 }}
                    />
                  </Dialog>
                </Grid>
              </Grid>
            </Grid>
          </LocalizationProvider>
          <TextField
            margin="dense"
            label="Nombre de participants maximum (optionnel)"
            fullWidth
            multiline
            rows={1}
            style={{ marginTop: 20 }}
            type="number"
            variant="outlined"
            value={dialogEdit.max_participants}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) {
                setDialogEdit({ ...dialogEdit, max_participants: value });
              }
            }}
          />

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEdit({ ...dialogEdit, open: false })}>Annuler</Button>
          <Button onClick={() => { editTraining(); setDialogEdit({ ...dialogEdit, open: false }) }} variant="contained">
            Modifier
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default Sports;