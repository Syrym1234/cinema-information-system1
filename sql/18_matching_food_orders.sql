/* Апайдың шарттарына сай алғашқы 6 топтың нақты тағам тапсырыстары.
   Әр жол — тапсырыстағы бір тағам. Бір тапсырыста бірнеше тағам болуы мүмкін.
   Тек SELECT: деректер өзгермейді.
*/
USE CinemaLabDB;
GO
SELECT
    fo.food_order_id AS [Тапсырыс ID],
    r.group_id AS [Топ ID],
    c.customer_id AS [Клиент ID],
    c.full_name AS [Тапсырыс берген клиент],
    m.title AS [Фильм],
    (SELECT COUNT(DISTINCT r3.customer_id)
     FROM dbo.Reservations AS r3
     JOIN dbo.ReservationSeats AS rs3 ON rs3.reservation_id = r3.reservation_id
     WHERE r3.group_id = gb.group_id AND r3.session_id = gb.session_id
       AND rs3.session_id = gb.session_id
       AND r3.reservation_status IN ('held', 'paid')) AS [Топтағы клиент саны],
    (SELECT COUNT(*)
     FROM dbo.Reservations AS r3
     JOIN dbo.ReservationSeats AS rs3 ON rs3.reservation_id = r3.reservation_id
     WHERE r3.group_id = gb.group_id AND r3.session_id = gb.session_id
       AND rs3.session_id = gb.session_id
       AND r3.reservation_status IN ('held', 'paid')) AS [Брондалған орын саны],
    s.start_at AS [Сеанс],
    mi.item_name AS [Тағам],
    mi.category AS [Санат],
    fi.quantity AS [Саны],
    fi.unit_price AS [Бір данасының бағасы],
    fi.quantity * fi.unit_price AS [Тағам құны],
    fo.order_status AS [Тапсырыс күйі]
FROM dbo.FoodOrders AS fo
JOIN dbo.Reservations AS r ON r.reservation_id = fo.reservation_id
JOIN dbo.GroupBookings AS gb ON gb.group_id = r.group_id AND gb.session_id = r.session_id
JOIN dbo.Customers AS c ON c.customer_id = r.customer_id
JOIN dbo.Sessions AS s ON s.session_id = gb.session_id
JOIN dbo.Movies AS m ON m.movie_id = s.movie_id
JOIN dbo.FoodOrderItems AS fi ON fi.food_order_id = fo.food_order_id
JOIN dbo.MenuItems AS mi ON mi.menu_item_id = fi.menu_item_id
WHERE r.reservation_status IN ('held', 'paid')
  AND fo.order_status <> 'cancelled'
  AND fi.quantity > 0
  AND r.group_id IN (
      SELECT TOP (6) g.group_id
      FROM dbo.GroupBookings AS g
      JOIN dbo.Sessions AS se ON se.session_id = g.session_id
      WHERE CAST(se.start_at AS TIME) >= '18:00:00'
        AND se.base_price > (SELECT AVG(base_price) FROM dbo.Sessions)
        AND EXISTS (
            SELECT 1
            FROM dbo.Reservations AS r2
            JOIN dbo.ReservationSeats AS rs ON rs.reservation_id = r2.reservation_id
            WHERE r2.group_id = g.group_id AND r2.session_id = g.session_id
              AND rs.session_id = g.session_id
              AND r2.reservation_status IN ('held', 'paid')
        )
        AND NOT EXISTS (
            SELECT 1
            FROM dbo.Reservations AS r2
            JOIN dbo.FoodOrders AS f2 ON f2.reservation_id = r2.reservation_id
            JOIN dbo.FoodOrderItems AS i2 ON i2.food_order_id = f2.food_order_id
            JOIN dbo.MenuItems AS m2 ON m2.menu_item_id = i2.menu_item_id
            WHERE r2.group_id = g.group_id AND r2.session_id = g.session_id
              AND r2.reservation_status IN ('held', 'paid')
              AND f2.order_status <> 'cancelled'
              AND i2.quantity > 0
              AND m2.category = N'Попкорн'
        )
      ORDER BY se.start_at, g.group_id
  )
ORDER BY s.start_at, r.group_id, fo.food_order_id, mi.menu_item_id;
GO
