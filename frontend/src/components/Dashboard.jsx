import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Tooltip,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'dayjs/locale/fr';
import dayjs from 'dayjs';

const Dashboard = () => {
  const { user } = useAuth();
  const [userSports, setUserSports] = useState([]);
  const [userTrainings, setUserTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

    const getDay = (date) => {
      let res = dayjs(date).locale('fr').format("dddd");
      return res.charAt(0).toUpperCase() + res.slice(1);
    };
  
    const getSportName = (sportId) => {
      let res = "";
      userSports.forEach(sport => {
        if (sport.id === sportId) {
          res = sport.name;
        }
      });
      return res;
    };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sportsResponse, trainingsResponse] = await Promise.all([
          axios.get(`http://localhost:8080/api/users/${user.id}/sports`),
          axios.get(`http://localhost:8080/api/users/${user.id}/trainings`),
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
        <Typography>Chargement...</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Grid container spacing={4}>
        {/* My Sports */}
        <Grid>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Mes sports ({userSports.length})
              </Typography>
              {userSports.length === 0 ? (
                <Typography color="text.secondary">
                  Vous n'avez pas encore rejoint de sports.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {userSports.map((sport) => (
                    <Tooltip title="Aller sur la page du sport" arrow>
                    <Chip
                      key={sport.id}
                      label={sport.name}
                      sx={{cursor:'pointer'}}
                      onClick={()=>navigate(`/sports/${sport.id}`)}
                      variant="outlined"
                      color="primary"
                    />
                    </Tooltip>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

       
          <Grid>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
            Mes entraînements ({userTrainings.filter(training => dayjs(training.date).isAfter(dayjs())).length})
                </Typography>
                {userTrainings.filter(training => dayjs(training.date).isAfter(dayjs())).length === 0 ? (
            <Typography color="text.secondary">
              Vous n'avez rejoint aucun entraînement à venir.
            </Typography>
                ) : (
            <Box>
              {userTrainings
                .filter(training => dayjs(training.date).isAfter(dayjs()))
                .map((training) => (
                  <Box key={training.id} sx={{ mb: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                {getSportName(training.sport_id)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getDay(training.date)} {dayjs(training.date).format("DD/MM/YYYY")} - {training.location}
              </Typography>
                  </Box>
                ))}
              {userTrainings.filter(training => dayjs(training.date).isAfter(dayjs())).length > 3 && (
                <Typography variant="caption" color="text.secondary">
                  +{userTrainings.filter(training => dayjs(training.date).isAfter(dayjs())).length - 3} more...
                </Typography>
              )}
            </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* User Info */}
        <Grid>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Nom :</strong> {user?.username}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Email :</strong> {user?.email}
              </Typography>
              <Typography variant="body2">
                <strong>Statut :</strong> {user?.role}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;