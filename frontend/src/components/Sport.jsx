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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { fr } from 'date-fns/locale';

const Sport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sport, setSport] = useState([])
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogEdit, setDialogEdit] = useState({ open: false, name: '', description: '' });
  const [dialogDelete, setDialogDelete] = useState(false);
  const [dialogCreateTraining, setDialogCreateTraining] = useState(false);
  const [newTraining, setNewTraining] = useState({ title: "", description: "", date: "", timeStart: "", timeEnd: "", location: "", maxParticipants: "" });
  const [activePanel, setActivePanel] = useState('trainings');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { id } = useParams();
  useEffect(() => {
    fetchSport();

  }, []);

  const createNewSport = async () => {

  };

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

      <div style={{
        display: 'flex',
        background: '#cfcfcf',
        justifyContent: 'flex-start',
      }}>
        {/* Onglet "Entraînements" */}
        <button
          onClick={() => setActivePanel('trainings')}
          style={{
            background: activePanel === 'trainings' ? '#FFFFFF' : 'transparent',
            borderRadius: '0',
            color: activePanel === 'trainings' ? '#1976d2' : '#000000',
            cursor: 'pointer',
            position: 'relative',
            fontSize: 'larger',
          }}
        >
          Entraînements
          {activePanel === 'trainings' && (
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              width: '100%',
              height: '3px',
              backgroundColor: '#1976d2',
            }} />
          )}
        </button>

        {/* Onglet "Membres" */}
        <button
          onClick={() => setActivePanel('members')}
          style={{
            padding: '12px 24px',
            background: activePanel === 'members' ? '#FFFFFF' : 'transparent',
            fontSize: 'larger',
            borderRadius: '0',
            color: activePanel === 'members' ? '#1976d2' : '#000000',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          Membres
          {activePanel === 'members' && (
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              width: '100%',
              height: '3px',
              backgroundColor: '#1976d2',
            }} />
          )}
        </button>
      </div>

      {/* Panel trainings */}
      {activePanel === 'trainings' && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogCreateTraining(true)}
          sx={{ m: 2 }}
        >
          Créer un entraînement
        </Button>
      )}

      {/* Panel members */}
      {activePanel === 'members' && (
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
      )}

      {/* Traning creation dialog*/}
      <Dialog open={dialogCreateTraining} onClose={() => setDialogCreateTraining(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Création d'un entraînement</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom (optionnel)"
            fullWidth
            variant="outlined"
            value={newTraining.name}
            onChange={(e) => setNewTraining({ ...newTraining, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optionnel)"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={newTraining.description}
            onChange={(e) => setNewTraining({ ...newTraining, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Lieu"
            fullWidth
            multiline
            rows={1}
            variant="outlined"
            value={newTraining.location}
            onChange={(e) => setNewTraining({ ...newTraining, location: e.target.value })}
            sx={{ mb: 2 }}
          />
          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={fr}>
            <Grid container alignItems="center">
              <Grid>
                <DatePicker
                  label="Date de l'entraînement"
                  value={newTraining.date}
                  onChange={(newValue) => setNewTraining({ ...newTraining, date: newValue })}
                  disablePast
                  sx={{ mb: 2 }}
                  slotProps={{ textField: { margin: 'dense', variant: 'outlined' } }}
                />
              </Grid>
              <Grid container >
                <Grid>
                  <TimePicker
                    label="Heure de début"
                    value={newTraining.timeStart}
                    sx={{ mb: 2, mr:2}}
                    onChange={(newValue) => {
                      setNewTraining({ ...newTraining, timeStart: newValue });
                    }}
                    // slotProps={{ textField: { margin: 'dense', variant: 'outlined' } }}
                    views={['hours', 'minutes']}  // Affiche d'abord les heures, puis les minutes
                    openTo="hours"
                    inputFormat="HH:mm"
                    ampm={false}
                    components={{
                      OpenPickerIcon: () => null, // Masque l'icône d'horloge (optionnel)
                    }}
                    viewRenderers={{
                      hours: renderTimeViewClock,
                      minutes: renderTimeViewClock,
                    }}
                    slotProps={{
                      textField: { margin: 'dense', variant: 'outlined' } ,
                      clock: {
                        renderDigitalClockTimeView: false, // Désactive l'affichage digital (optionnel)
                      },
                      dialog: {
                        sx: {
                          '& .MuiClockPicker-toolbars': {
                            display: 'none', // Masque les boutons de navigation (optionnel)
                          },
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid>
                  <TimePicker
                    label="Heure de fin"
                    sx={{ mb: 2 }}
                    value={newTraining.timeEnd}
                    onChange={(newValue) => {
                      setNewTraining({ ...newTraining, timeEnd: newValue });
                    }}
                    slotProps={{ textField: { margin: 'dense', variant: 'outlined' } }}
                    inputFormat="HH:mm"
                    ampm={false}
                  />
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
            type="number"
            variant="outlined"
            value={newTraining.maxParticipants}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) {
                setNewTraining({ ...newTraining, maxParticipants: value });
              }
            }}
          />

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogCreateTraining(false)}>Annuler</Button>
          <Button onClick={() => { createNewSport(); setDialogCreateTraining(false) }} variant="contained">
            Créer
          </Button>
        </DialogActions>
      </Dialog>

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