/* Барлық топтық броньдар: ұйымдастырушы, бірге брондағандар және орындар.
   Бір жол = бір топ. Фильм, уақыт, баға, клиенттер мен орын саны көрсетіледі.
   Кешкі / қымбат / попкорнсыз сүзгілері бұл жалпы тізімге қолданылмайды.
*/
USE CinemaLabDB;
GO
SELECT
    gb.group_id AS [Топ ID],
    organizer.customer_id AS [Ұйымдастырушы ID],
    organizer.full_name AS [Ұйымдастырушы],
    m.title AS [Фильм],
    s.start_at AS [Сеанс],
    s.base_price AS [Сеанс бағасы],
    COALESCE((
        SELECT STRING_AGG(CAST(CONCAT(p.customer_id, N' — ', p.full_name) AS NVARCHAR(MAX)), N'; ')
            WITHIN GROUP (ORDER BY p.customer_id)
        FROM (
            SELECT DISTINCT c.customer_id, c.full_name
            FROM dbo.Reservations AS r
            INNER JOIN dbo.Customers AS c ON c.customer_id = r.customer_id
            WHERE r.group_id = gb.group_id AND r.session_id = gb.session_id
              AND r.reservation_status IN ('held', 'paid')
              AND EXISTS (SELECT 1 FROM dbo.ReservationSeats AS rs
                          WHERE rs.reservation_id = r.reservation_id AND rs.session_id = gb.session_id)
        ) AS p
    ), N'Қатысушы тіркелмеген') AS [Топтағы барлық клиенттер],
    COALESCE((
        SELECT STRING_AGG(CAST(CONCAT(p.customer_id, N' — ', p.full_name) AS NVARCHAR(MAX)), N'; ')
            WITHIN GROUP (ORDER BY p.customer_id)
        FROM (
            SELECT DISTINCT c.customer_id, c.full_name
            FROM dbo.Reservations AS r
            INNER JOIN dbo.Customers AS c ON c.customer_id = r.customer_id
            WHERE r.group_id = gb.group_id AND r.session_id = gb.session_id
              AND r.reservation_status IN ('held', 'paid')
              AND c.customer_id <> gb.organizer_customer_id
              AND EXISTS (SELECT 1 FROM dbo.ReservationSeats AS rs
                          WHERE rs.reservation_id = r.reservation_id AND rs.session_id = gb.session_id)
        ) AS p
    ), N'Басқа клиент тіркелмеген') AS [Ұйымдастырушымен бірге брондағандар],
    (SELECT COUNT(DISTINCT r.customer_id)
     FROM dbo.Reservations AS r INNER JOIN dbo.ReservationSeats AS rs
       ON rs.reservation_id = r.reservation_id AND rs.session_id = r.session_id
     WHERE r.group_id = gb.group_id AND r.session_id = gb.session_id
       AND r.reservation_status IN ('held', 'paid')) AS [Клиент саны],
    (SELECT COUNT(*) FROM dbo.Reservations AS r
     INNER JOIN dbo.ReservationSeats AS rs
       ON rs.reservation_id = r.reservation_id AND rs.session_id = r.session_id
     WHERE r.group_id = gb.group_id AND r.session_id = gb.session_id
       AND r.reservation_status IN ('held', 'paid')) AS [Брондалған орын саны]
FROM dbo.GroupBookings AS gb
INNER JOIN dbo.Customers AS organizer ON organizer.customer_id = gb.organizer_customer_id
INNER JOIN dbo.Sessions AS s ON s.session_id = gb.session_id
INNER JOIN dbo.Movies AS m ON m.movie_id = s.movie_id
ORDER BY s.start_at, gb.group_id;
GO
