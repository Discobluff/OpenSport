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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, Schedule as ScheduleIcon, LocationOn as LocationIcon, Group as GroupIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Trainings = () => {
  const { user } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [userSports, setUserSports] = useState([]);
  const [userTrainings, setUserTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newTraining, setNewTraining] = useState({
    sport_id: '',
    title: '',
    description: '',
    date_time: '',
    duration: 60,
    location: '',
    max_participants: 0,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTrainings();
    fetchUserSports();
    fetchUserTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/trainings');
      setTrainings(response.data.trainings || []);
    } catch (error) {
      console.error('Failed to fetch trainings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSports = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/user/sports');
      setUserSports(response.data.sports || []);
    } catch (error) {
      console.error('Failed to fetch user sports:', error);
    }
  };

  const fetchUserTrainings = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/user/trainings');
      setUserTrainings(response.data.trainings || []);
    } catch (error) {
      console.error('Failed to fetch user trainings:', error);
    }
  };

  const handleCreateTraining = async () => {
    setError('');
    setSuccess('');

    if (!newTraining.sport_id || !newTraining.title || !newTraining.date_time || !newTraining.location) {
      setError('Please fill all required fields');
      return;
    }

    try {
      await axios.post('http://localhost:8080/api/trainings', newTraining);
      setSuccess('Training created successfully!');
      setNewTraining({
        sport_id: '',
        title: '',
        description: '',
        date_time: '',
        duration: 60,
        location: '',
        max_participants: 0,
      });
      setOpenDialog(false);
      fetchTrainings();
      fetchUserTrainings();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create training');
    }
  };

  const handleJoinTraining = async (trainingId) => {
    setError('');
    setSuccess('');

    try {
      await axios.post(`http://localhost:8080/api/trainings/${trainingId}/join`);
      setSuccess('Successfully joined the training!');
      fetchTrainings();
      fetchUserTrainings();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to join training');
    }
  };

  const isUserInTraining = (trainingId) => {
    return userTrainings.some(training => training.id === trainingId);
  };

  const canUserCreateTraining = () => {
    return userSports.some(sport => sport.admin_id === user?.id);
  };

  const getUserAdminSports = () => {
    return userSports.filter(sport => sport.admin_id === user?.id);
  };

  const getSportName = (sportId) => {
    const sport = userSports.find(s => s.id === sportId);
    return sport ? sport.name : 'Unknown Sport';
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Trainings
        </Typography>
        {canUserCreateTraining() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Create Training
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
        {trainings.map((training) => (
          <Grid item xs={12} sm={6} md={4} key={training.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {training.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {training.description || 'No description provided'}
                </Typography>
                
                <Box sx={{ mb: 1 }}>
                  <Chip label={getSportName(training.sport_id)} size="small" color="primary" />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ScheduleIcon fontSize="small" />
                  <Typography variant="body2">
                    {new Date(training.date_time).toLocaleString()}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LocationIcon fontSize="small" />
                  <Typography variant="body2">
                    {training.location}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <GroupIcon fontSize="small" />
                  <Typography variant="body2">
                    {training.participants?.length || 0}
                    {training.max_participants > 0 && `/${training.max_participants}`} participants
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Duration: {training.duration} minutes
                </Typography>
              </CardContent>
              <CardActions>
                {isUserInTraining(training.id) ? (
                  <Chip label="Joined" color="success" variant="outlined" />
                ) : (
                  <Button size="small" onClick={() => handleJoinTraining(training.id)}>
                    Join Training
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {trainings.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No trainings available yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {canUserCreateTraining() ? 'Create the first training!' : 'Check back later for new trainings.'}
          </Typography>
        </Box>
      )}

      {/* Create Training Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Training</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Sport</InputLabel>
            <Select
              value={newTraining.sport_id}
              label="Sport"
              onChange={(e) => setNewTraining({ ...newTraining, sport_id: e.target.value })}
            >
              {getUserAdminSports().map((sport) => (
                <MenuItem key={sport.id} value={sport.id}>
                  {sport.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            label="Training Title"
            fullWidth
            variant="outlined"
            value={newTraining.title}
            onChange={(e) => setNewTraining({ ...newTraining, title: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Description"
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
            label="Date and Time"
            type="datetime-local"
            fullWidth
            variant="outlined"
            value={newTraining.date_time}
            onChange={(e) => setNewTraining({ ...newTraining, date_time: e.target.value })}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            margin="dense"
            label="Duration (minutes)"
            type="number"
            fullWidth
            variant="outlined"
            value={newTraining.duration}
            onChange={(e) => setNewTraining({ ...newTraining, duration: parseInt(e.target.value) })}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Location"
            fullWidth
            variant="outlined"
            value={newTraining.location}
            onChange={(e) => setNewTraining({ ...newTraining, location: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Max Participants (0 for unlimited)"
            type="number"
            fullWidth
            variant="outlined"
            value={newTraining.max_participants}
            onChange={(e) => setNewTraining({ ...newTraining, max_participants: parseInt(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateTraining} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Trainings;