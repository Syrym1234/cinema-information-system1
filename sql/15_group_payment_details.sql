/* Төлемдер тек кино билеттеріне қатысты.
   demo_paid — оқу базасындағы төленген төлем.
   Тағам тапсырысының accepted күйі оның төленгенін білдірмейді.
*/
USE CinemaLabDB;
GO

-- 1. №1 топта кім төлеген және қанша орын үшін төлеген?
SELECT
    r.group_id AS [Топ ID],
    c.customer_id AS [Клиент ID],
    c.full_name AS [Төлеген клиент],
    COUNT(rs.reservation_seat_id) AS [Брондаған орын саны],
    SUM(rs.seat_price) AS [Броньдағы билеттер құны],
    p.amount AS [Төлеген сомасы],
    p.payment_id AS [Төлем ID],
    p.payment_status AS [Төлем мәртебесі],
    p.paid_at AS [Төлем уақыты]
FROM dbo.Reservations AS r
JOIN dbo.Customers AS c ON c.customer_id = r.customer_id
JOIN dbo.ReservationSeats AS rs
    ON rs.reservation_id = r.reservation_id AND rs.session_id = r.session_id
JOIN dbo.Payments AS p ON p.reservation_id = r.reservation_id
WHERE r.group_id = 1
  AND r.reservation_status = 'paid'
  AND p.payment_status = 'demo_paid'
GROUP BY r.reservation_id, r.group_id, c.customer_id, c.full_name,
         p.amount, p.payment_id, p.payment_status, p.paid_at
ORDER BY c.customer_id;
GO

-- 2. Бүкіл базада төлемі тіркелмеген броньдар.
-- Топ ID бос болса, бұл жеке бронь. №1 топтың бәрі төлеген.
SELECT
    r.reservation_id AS [Бронь ID],
    r.group_id AS [Топ ID],
    c.customer_id AS [Клиент ID],
    c.full_name AS [Төлемі тіркелмеген клиент],
    m.title AS [Фильм],
    s.start_at AS [Сеанс],
    COUNT(rs.reservation_seat_id) AS [Орын саны],
    SUM(rs.seat_price) AS [Броньдағы билеттер құны],
    r.reservation_status AS [Бронь мәртебесі],
    r.expires_at AS [Бронь мерзімі]
FROM dbo.Reservations AS r
JOIN dbo.Customers AS c ON c.customer_id = r.customer_id
JOIN dbo.Sessions AS s ON s.session_id = r.session_id
JOIN dbo.Movies AS m ON m.movie_id = s.movie_id
JOIN dbo.ReservationSeats AS rs
    ON rs.reservation_id = r.reservation_id AND rs.session_id = r.session_id
WHERE r.reservation_status IN ('held', 'paid')
  AND NOT EXISTS (
      SELECT 1 FROM dbo.Payments AS p
      WHERE p.reservation_id = r.reservation_id
        AND p.payment_status = 'demo_paid'
  )
GROUP BY r.reservation_id, r.group_id, c.customer_id, c.full_name,
         m.title, s.start_at, r.reservation_status, r.expires_at
ORDER BY s.start_at, c.customer_id, r.reservation_id;
GO
