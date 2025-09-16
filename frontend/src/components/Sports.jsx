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
import { Add as AddIcon, Group as GroupIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Sports = () => {
  const { user } = useAuth();
  const [sports, setSports] = useState([]);
  const [userSports, setUserSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newSport, setNewSport] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSports();
    fetchUserSports();
  }, []);

  const fetchSports = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/sports');
      setSports(response.data.sports || []);
    } catch (error) {
      console.error('Failed to fetch sports:', error);
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

  const handleCreateSport = async () => {
    setError('');
    setSuccess('');

    if (!newSport.name.trim()) {
      setError('Sport name is required');
      return;
    }

    try {
      await axios.post('http://localhost:8080/api/sports', newSport);
      setSuccess('Sport created successfully!');
      setNewSport({ name: '', description: '' });
      setOpenDialog(false);
      fetchSports();
      fetchUserSports();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create sport');
    }
  };

  const handleJoinSport = async (sportId) => {
    setError('');
    setSuccess('');

    try {
      await axios.post(`http://localhost:8080/api/sports/${sportId}/join`);
      setSuccess('Successfully joined the sport!');
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
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Sports
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Create Sport
        </Button>
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
          <Grid item xs={12} sm={6} md={4} key={sport.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {sport.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {sport.description || 'No description provided'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <GroupIcon fontSize="small" />
                  <Typography variant="body2">
                    {sport.members?.length || 0} members
                  </Typography>
                </Box>
                {isUserAdminOfSport(sport) && (
                  <Chip label="Admin" color="secondary" size="small" />
                )}
              </CardContent>
              <CardActions>
                {isUserInSport(sport.id) ? (
                  <Chip label="Joined" color="success" variant="outlined" />
                ) : (
                  <Button size="small" onClick={() => handleJoinSport(sport.id)}>
                    Join Sport
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {sports.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No sports available yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Be the first to create a sport!
          </Typography>
        </Box>
      )}

      {/* Create Sport Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Sport</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Sport Name"
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
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateSport} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Sports;