import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [userSports, setUserSports] = useState([]);
  const [userTrainings, setUserTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sportsResponse, trainingsResponse] = await Promise.all([
          axios.get('http://localhost:8080/api/user/sports'),
          axios.get('http://localhost:8080/api/user/trainings'),
        ]);
        
        setUserSports(sportsResponse.data.sports || []);
        setUserTrainings(trainingsResponse.data.trainings || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome, {user?.username}!
      </Typography>
      
      <Grid container spacing={4}>
        {/* My Sports */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                My Sports ({userSports.length})
              </Typography>
              {userSports.length === 0 ? (
                <Typography color="text.secondary">
                  You haven't joined any sports yet.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {userSports.map((sport) => (
                    <Chip
                      key={sport.id}
                      label={sport.name}
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* My Trainings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                My Trainings ({userTrainings.length})
              </Typography>
              {userTrainings.length === 0 ? (
                <Typography color="text.secondary">
                  You haven't joined any trainings yet.
                </Typography>
              ) : (
                <Box>
                  {userTrainings.slice(0, 3).map((training) => (
                    <Box key={training.id} sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {training.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(training.date_time).toLocaleDateString()} - {training.location}
                      </Typography>
                    </Box>
                  ))}
                  {userTrainings.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{userTrainings.length - 3} more...
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* User Info */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Username:</strong> {user?.username}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Email:</strong> {user?.email}
              </Typography>
              <Typography variant="body2">
                <strong>Role:</strong>{' '}
                <Chip
                  label={user?.role}
                  size="small"
                  color={user?.role === 'Admin' ? 'secondary' : 'default'}
                />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;