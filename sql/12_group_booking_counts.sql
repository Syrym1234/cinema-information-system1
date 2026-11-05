USE CinemaLabDB;
GO
SELECT
    COUNT(*) AS [Жалпы брондалған орын саны],
    SUM(CASE WHEN r.group_id IS NOT NULL THEN 1 ELSE 0 END) AS [Топтық брондалған орын саны],
    COUNT(DISTINCT r.group_id) AS [Брондалған орындары бар топ саны]
FROM dbo.ReservationSeats AS rs
INNER JOIN dbo.Reservations AS r
    ON r.reservation_id = rs.reservation_id AND r.session_id = rs.session_id
WHERE r.reservation_status IN ('held', 'paid');
GO
