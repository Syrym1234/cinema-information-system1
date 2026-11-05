/* Кешкі, орташа бағадан қымбат, попкорнсыз топтық броньдар.
   Бір жол — бір топ. Алғашқы 6 топ көрсетіледі.
   Орын саны мен клиент саны бөлек есептеледі.
   Тек SELECT: деректер өзгермейді.
*/
USE CinemaLabDB;
GO

SELECT TOP (6)
    gb.group_id AS [Топ ID],
    c.customer_id AS [Ұйымдастырушы ID],
    c.full_name AS [Топ ұйымдастырушысы],
    m.title AS [Фильм],
    s.start_at AS [Сеанс уақыты],
    s.base_price AS [Сеанс бағасы],
    (SELECT AVG(base_price) FROM dbo.Sessions) AS [Орташа баға],
    COUNT(rs.reservation_seat_id) AS [Брондалған орын саны],
    COUNT(DISTINCT r.customer_id) AS [Брондаған клиент саны],
    COUNT(DISTINCT p.reservation_id) AS [Төленген бронь саны],
    COUNT(DISTINCT r.reservation_id) - COUNT(DISTINCT p.reservation_id) AS [Төленбеген бронь саны],
    (SELECT COUNT(DISTINCT fo.food_order_id)
     FROM dbo.Reservations AS r2
     JOIN dbo.FoodOrders AS fo ON fo.reservation_id = r2.reservation_id
     JOIN dbo.FoodOrderItems AS fi ON fi.food_order_id = fo.food_order_id
     JOIN dbo.MenuItems AS mi ON mi.menu_item_id = fi.menu_item_id
     WHERE r2.group_id = gb.group_id
       AND r2.session_id = gb.session_id
       AND r2.reservation_status IN ('held', 'paid')
       AND fo.order_status <> 'cancelled'
       AND fi.quantity > 0
       AND mi.category = N'Попкорн') AS [Попкорны бар тапсырыс саны]
FROM dbo.GroupBookings AS gb
JOIN dbo.Customers AS c ON c.customer_id = gb.organizer_customer_id
JOIN dbo.Sessions AS s ON s.session_id = gb.session_id
JOIN dbo.Movies AS m ON m.movie_id = s.movie_id
JOIN dbo.Reservations AS r
    ON r.group_id = gb.group_id AND r.session_id = gb.session_id
JOIN dbo.ReservationSeats AS rs
    ON rs.reservation_id = r.reservation_id AND rs.session_id = gb.session_id
LEFT JOIN dbo.Payments AS p
    ON p.reservation_id = r.reservation_id AND p.payment_status = 'demo_paid'
WHERE r.reservation_status IN ('held', 'paid')
  AND CAST(s.start_at AS TIME) >= '18:00:00'
  AND s.base_price > (SELECT AVG(base_price) FROM dbo.Sessions)
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.Reservations AS r2
      JOIN dbo.FoodOrders AS fo ON fo.reservation_id = r2.reservation_id
      JOIN dbo.FoodOrderItems AS fi ON fi.food_order_id = fo.food_order_id
      JOIN dbo.MenuItems AS mi ON mi.menu_item_id = fi.menu_item_id
      WHERE r2.group_id = gb.group_id
        AND r2.session_id = gb.session_id
        AND r2.reservation_status IN ('held', 'paid')
        AND fo.order_status <> 'cancelled'
        AND fi.quantity > 0
        AND mi.category = N'Попкорн'
  )
GROUP BY gb.group_id, gb.session_id, c.customer_id, c.full_name,
         m.title, s.start_at, s.base_price
ORDER BY s.start_at, gb.group_id;
GO
