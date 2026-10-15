USE CinemaSchoolDB;
GO
SELECT COUNT(*) AS genre_count FROM Genres;
SELECT COUNT(*) AS movie_count FROM Movies;
SELECT COUNT(*) AS hall_count FROM Halls;
SELECT COUNT(*) AS session_count FROM Sessions;
SELECT COUNT(*) AS customer_count FROM Customers;
SELECT COUNT(*) AS ticket_count FROM Tickets;
SELECT COUNT(*) AS menu_count FROM MenuItems;
SELECT TOP (20) session_id, movie_id, hall_id, start_at, price
FROM Sessions ORDER BY start_at ASC;
GO
