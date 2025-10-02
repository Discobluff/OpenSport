package auth

type AdminSportChecker interface {
    IsUserAdminOfSport(userID, trainingID string) (bool, error)
}