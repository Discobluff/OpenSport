import React, { useState, useEffect } from 'react';
import {
  Chip,
  Container,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Check as CheckIcon, Close as CloseIcon, PersonRemove as PersonRemoveIcon, AddModerator as AddModeratorIcon, RemoveModerator as RemoveModeratorIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker';
import { useNavigate, useParams } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import 'dayjs/locale/fr';

const Sport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sport, setSport] = useState([])
  const [members, setMembers] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogEdit, setDialogEdit] = useState({ open: false, name: '', description: '' });
  const [dialogDelete, setDialogDelete] = useState(false);
  const [dialogCreateTraining, setDialogCreateTraining] = useState(false);
  const [newTraining, setNewTraining] = useState({ title: "", description: "", date: null, time_start: null, time_end: null, location: "", max_participants: "" });
  const [activePanel, setActivePanel] = useState('trainings');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openStartTime, setOpenStartTime] = useState(false);
  const [openEndTime, setOpenEndTime] = useState(false);
  const [dialogRemove, setDialogRemove] = useState({ open: false, id: "", name: "" });
  const { id } = useParams();
  useEffect(() => {
    fetchSport();
    fetchTrainings();
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

  const createNewTraining = async () => {
    try {
      await axios.post(`http://localhost:8080/api/trainings`, { ...newTraining, sport_id: sport.id, date: newTraining.date.format('DD/MM/YYYY'), time_start: newTraining.time_start.format('HH:mm'), time_end: newTraining.time_end.format('HH:mm') });
      setNewTraining({ title: "", description: "", date: null, time_start: null, time_end: null, location: "", max_participants: "" });
      setSuccess("Nouvel entraînement créé");
      fetchTrainings();
      setError('');
    } catch (error) {
      setError("Echec de la création de l'entraînement");
      setSuccess("");
      console.error("Echec de la création de l'entraînement", error);
    }
  };

  const changeRoleToAdmin = async (userId) => {
    try {
      const response = await axios.post(`http://localhost:8080/api/sports/${id}/admin/${userId}`);
      fetchSport();
    } catch (error) {
      console.error("Echec du passage à admin", error);
    }
  };

  const changeRoleToMember = async (userId) => {
    try {
      const response = await axios.post(`http://localhost:8080/api/sports/${id}/member/${userId}`);
      fetchSport();
    } catch (error) {
      console.error("Echec du passage à membre", error);
    }
  };

  const removeFromSport = async (userId) => {
    try {
      const response = await axios.post(`http://localhost:8080/api/sports/${id}/remove/${userId}`);
      fetchSport();
      fetchTrainings();
      setSuccess('Membre retiré avec succès');
    } catch (error) {
      console.error("Echec du retirement du sport", error);
      setSuccess("Le membre n'a pas pu être retiré");
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

  const joinTraining = async (trainingId) => {
    try {
      const response = await axios.post(`http://localhost:8080/api/trainings/${trainingId}/join`);
      fetchTrainings();
    } catch (error) {
      console.error("Echec du rejoignement de l'entraînement", error);
    } finally {
      setLoading(false);
    }
  };

  const leaveTraining = async (trainingId) => {
    try {
      const response = await axios.post(`http://localhost:8080/api/trainings/${trainingId}/leave`);
      fetchTrainings();
    } catch (error) {
      console.error("Echec du quittage de l'entraînement", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainings = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/trainings/${id}`);
      setTrainings(response.data.trainings || []);
    } catch (error) {
      console.error('Echec de la récupération des entraînements', error);
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
    return sport.members != undefined ? sport.members.includes(user.id) : false;
  };

  const isUserPresentInTraining = (trainingId) => {
    let res = false;
    trainings.forEach(training => {
      if (training.id === trainingId && training.presents.includes(user.id)) { res = true };
    });
    return res;
  };

  const isUserAbsentInTraining = (trainingId) => {
    let res = false;
    trainings.forEach(training => {
      if (training.id === trainingId && training.absents.includes(user.id)) { res = true };
    });
    return res;
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
          <Tooltip title="Modifier le sport" arrow>
            <EditIcon sx={{ cursor: 'pointer', ml: 2 }} onClick={() => setDialogEdit({ open: true, id: sport.id, name: sport.name, description: sport.description })} />
          </Tooltip>
        )}
        {(user.role === "Admin") && (
          <Tooltip title="Supprimer le sport" arrow>
            <DeleteIcon sx={{ cursor: 'pointer', ml: 2 }} onClick={() => setDialogDelete(true)} />
          </Tooltip>
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
            color: activePanel === 'trainings' ? '#6c2466' : '#000000',
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
              backgroundColor: '#6c2466',
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
            color: activePanel === 'members' ? '#6c2466' : '#000000',
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
              backgroundColor: '#6c2466',
            }} />
          )}
        </button>
      </div>

      {/* Panel trainings */}
      {activePanel === 'trainings' && (
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogCreateTraining(true)}
            sx={{ m: 2 }}
          >
            Créer un entraînement
          </Button>
          {trainings.map((training) => (
            <Tooltip title="Accéder à l'entraînement" arrow>
              <Box
                key={training.id}
                onClick={() => navigate(`/training/${training.id}`)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  p: 1,
                  borderBottom: '1px solid #ccc',
                  cursor: 'pointer',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Typography variant="h6">{training.date} de {training.time_start} à {training.time_end}, {training.location}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
                    {isUserPresentInTraining(training.id) && (
                      <Chip label="Présent" sx={{ mr: 1, color: "#24bf27" }} variant="outlined" />
                    )}
                    {isUserAbsentInTraining(training.id) && (
                      <Chip label="Absent" sx={{ mr: 1, color: "#ff2121" }} variant="outlined" />
                    )}
                    <Typography variant="h6">{training.presents.length}</Typography>
                    <Tooltip title="Présent" arrow>
                      <CheckIcon sx={{ ml: 1, mr: 1, color: "#24bf27", cursor: "pointer" }} onClick={() => joinTraining(training.id)}></CheckIcon>
                    </Tooltip>
                    <Typography variant="h6">|</Typography>
                    <Tooltip title="Absent" arrow>
                      <CloseIcon sx={{ ml: 1, mr: 1, color: "#ff2121", cursor: "pointer" }} onClick={() => leaveTraining(training.id)}></CloseIcon>
                    </Tooltip>
                    <Typography variant="h6">{training.absents.length}</Typography>
                  </Box>
                </Box>
                <Typography variant="h7">{training.title}</Typography>
                <Typography variant="h8" color="#575757">{training.description}</Typography>
              </Box>
            </Tooltip>
          ))}
        </Box>
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
              <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'default' }}>
              {sport.admins_id.includes(member.id) && (
              <Chip label="Admin" />
              )}
                {sport.admins_id.includes(member.id) ? (
                    <Tooltip title="Passer à membre" arrow>
                  <RemoveModeratorIcon sx={{cursor:'pointer', ml:2}} onClick={()=> changeRoleToMember(member.id)}/>
                    </Tooltip>
                ) : (
                  <Tooltip title="Passer à admin" arrow>
                  <AddModeratorIcon sx={{cursor:'pointer', ml:2}} onClick={()=> changeRoleToAdmin(member.id)}/>
                  </Tooltip>
                )}
                <Tooltip title="Retirer du sport" arrow>
                  <PersonRemoveIcon sx={{ cursor: "pointer", ml: 2 }} onClick={() => setDialogRemove({ open: true, id: member.id, name: member.name })} />
                </Tooltip>
              </Box>
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
            value={newTraining.title}
            onChange={(e) => setNewTraining({ ...newTraining, title: e.target.value })}
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
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
            <Grid container >
              <Grid>
                <DatePicker
                  label="Date de l'entraînement"
                  value={newTraining.date}
                  onChange={(newValue) => setNewTraining({ ...newTraining, date: newValue })}
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
                    value={newTraining.time_start ? newTraining.time_start.format('HH:mm') : ''}
                    onClick={() => setOpenStartTime(true)}
                    fullWidth
                    variant="outlined"
                    margin="dense"
                  />
                  <Dialog open={openStartTime} onClose={() => setOpenStartTime(false)}>
                    <StaticTimePicker
                      value={newTraining.time_start}
                      onChange={(newValue) => {
                        setNewTraining({ ...newTraining, time_start: newValue });
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
                    value={newTraining.time_end ? newTraining.time_end.format('HH:mm') : ''}
                    onClick={() => setOpenEndTime(true)}
                    fullWidth
                    variant="outlined"
                    margin="dense"
                  />
                  <Dialog open={openEndTime} onClose={() => setOpenEndTime(false)}>
                    <StaticTimePicker
                      value={newTraining.endTime}
                      onChange={(newValue) => {
                        setNewTraining({ ...newTraining, time_end: newValue });
                      }}
                      onAccept={() => setOpenEndTime(false)}
                      ampm={false}
                      shouldDisableTime={(timeValue, clockType) => {
                        if (!newTraining.startTime) return false;
                        const startTime = newTraining.startTime;
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
            value={newTraining.max_participants}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) {
                setNewTraining({ ...newTraining, max_participants: value });
              }
            }}
          />

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogCreateTraining(false)}>Annuler</Button>
          <Button onClick={() => { createNewTraining(); setDialogCreateTraining(false) }} variant="contained">
            Créer
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
          <Typography>Êtes-vous sûr de vouloir retirer {dialogRemove.name} du sport ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogRemove({ open: false, id: "", name: "" })}>Annuler</Button>
          <Button
            onClick={() => {
              removeFromSport(dialogRemove.id);
              setDialogRemove({ open: false, id: "", name: "" });
            }}
            variant="contained"
            color="error"
          >
            Retirer
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