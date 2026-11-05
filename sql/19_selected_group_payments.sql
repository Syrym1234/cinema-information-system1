/* Бірінші сұраныстағы алғашқы 6 топтың төлеген клиенттері.
   №1 топпен шектелмейді. Әр жол — бір төленген бронь.
*/
USE CinemaLabDB;
GO
SELECT
    r.group_id AS [Топ ID],
    c.customer_id AS [Клиент ID],
    c.full_name AS [Төлеген клиент],
    m.title AS [Фильм],
    s.start_at AS [Сеанс],
    COUNT(rs.reservation_seat_id) AS [Брондаған орын саны],
    SUM(rs.seat_price) AS [Броньдағы билеттер құны],
    p.amount AS [Төлеген сомасы],
    p.payment_id AS [Төлем ID],
    p.payment_status AS [Төлем мәртебесі],
    p.paid_at AS [Төлем уақыты]
FROM dbo.Reservations AS r
JOIN dbo.GroupBookings AS gb ON gb.group_id = r.group_id AND gb.session_id = r.session_id
JOIN dbo.Customers AS c ON c.customer_id = r.customer_id
JOIN dbo.Sessions AS s ON s.session_id = r.session_id
JOIN dbo.Movies AS m ON m.movie_id = s.movie_id
JOIN dbo.ReservationSeats AS rs
    ON rs.reservation_id = r.reservation_id AND rs.session_id = r.session_id
JOIN dbo.Payments AS p ON p.reservation_id = r.reservation_id
WHERE r.reservation_status = 'paid'
  AND p.payment_status = 'demo_paid'
  AND r.group_id IN (
      SELECT TOP (6) g.group_id
      FROM dbo.GroupBookings AS g
      JOIN dbo.Sessions AS se ON se.session_id = g.session_id
      WHERE CAST(se.start_at AS TIME) >= '18:00:00'
        AND se.base_price > (SELECT AVG(base_price) FROM dbo.Sessions)
        AND EXISTS (
            SELECT 1
            FROM dbo.Reservations AS r2
            JOIN dbo.ReservationSeats AS rs2 ON rs2.reservation_id = r2.reservation_id
            WHERE r2.group_id = g.group_id AND r2.session_id = g.session_id
              AND rs2.session_id = g.session_id
              AND r2.reservation_status IN ('held', 'paid')
        )
        AND NOT EXISTS (
            SELECT 1
            FROM dbo.Reservations AS r2
            JOIN dbo.FoodOrders AS fo ON fo.reservation_id = r2.reservation_id
            JOIN dbo.FoodOrderItems AS fi ON fi.food_order_id = fo.food_order_id
            JOIN dbo.MenuItems AS mi ON mi.menu_item_id = fi.menu_item_id
            WHERE r2.group_id = g.group_id AND r2.session_id = g.session_id
              AND r2.reservation_status IN ('held', 'paid')
              AND fo.order_status <> 'cancelled'
              AND fi.quantity > 0
              AND mi.category = N'Попкорн'
        )
      ORDER BY se.start_at, g.group_id
  )
GROUP BY r.reservation_id, r.group_id, c.customer_id, c.full_name,
         m.title, s.start_at, p.amount, p.payment_id, p.payment_status, p.paid_at
ORDER BY s.start_at, r.group_id, c.customer_id;
GO
