package auth

type AdminSportChecker = func(string, string) (bool, error)
