/* Барлық топтар. Әр топ бір жолда көрсетіледі.
   Қатысушылар мен тағамдарды 14_group_members_and_food.sql арқылы көруге болады.
*/
USE CinemaLabDB;
GO
SELECT
    gb.group_id AS [Топ ID],
    c.customer_id AS [Ұйымдастырушы ID],
    c.full_name AS [Ұйымдастырушы],
    m.title AS [Фильм],
    s.start_at AS [Сеанс],
    s.base_price AS [Сеанс бағасы],
    COUNT(DISTINCT r.customer_id) AS [Клиент саны],
    COUNT(rs.reservation_seat_id) AS [Брондалған орын саны]
FROM dbo.GroupBookings AS gb
JOIN dbo.Customers AS c ON c.customer_id = gb.organizer_customer_id
JOIN dbo.Sessions AS s ON s.session_id = gb.session_id
JOIN dbo.Movies AS m ON m.movie_id = s.movie_id
JOIN dbo.Reservations AS r
    ON r.group_id = gb.group_id AND r.session_id = gb.session_id
JOIN dbo.ReservationSeats AS rs
    ON rs.reservation_id = r.reservation_id AND rs.session_id = gb.session_id
WHERE r.reservation_status IN ('held', 'paid')
GROUP BY gb.group_id, c.customer_id, c.full_name, m.title, s.start_at, s.base_price
ORDER BY s.start_at, gb.group_id;
GO
