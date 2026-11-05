/* №1 топтың барлық брондаушы клиенттері мен тағамдары.
   Басқа топты көру үшін екі WHERE шартындағы топ ID-ін өзгертіңіз.
*/
USE CinemaLabDB;
GO

-- 1. Ұйымдастырушыны қоса алғанда, кім қанша орын брондаған?
SELECT
    gb.group_id AS [Топ ID],
    c.customer_id AS [Клиент ID],
    c.full_name AS [Брондаған клиент],
    COUNT(rs.reservation_seat_id) AS [Брондаған орын саны]
FROM dbo.GroupBookings AS gb
JOIN dbo.Reservations AS r
    ON r.group_id = gb.group_id AND r.session_id = gb.session_id
JOIN dbo.Customers AS c ON c.customer_id = r.customer_id
JOIN dbo.ReservationSeats AS rs
    ON rs.reservation_id = r.reservation_id AND rs.session_id = gb.session_id
WHERE gb.group_id = 1
  AND r.reservation_status IN ('held', 'paid')
GROUP BY gb.group_id, c.customer_id, c.full_name
ORDER BY c.customer_id;
GO

-- 2. Осы топтың тағам тапсырыстары. Тағам атауы, санаты және саны көрінеді.
SELECT
    fo.food_order_id AS [Тағам тапсырыс ID],
    mi.menu_item_id AS [Мәзір ID],
    mi.item_name AS [Тағам],
    mi.category AS [Санат],
    fi.quantity AS [Саны]
FROM dbo.Reservations AS r
JOIN dbo.FoodOrders AS fo ON fo.reservation_id = r.reservation_id
JOIN dbo.FoodOrderItems AS fi ON fi.food_order_id = fo.food_order_id
JOIN dbo.MenuItems AS mi ON mi.menu_item_id = fi.menu_item_id
WHERE r.group_id = 1
  AND r.reservation_status IN ('held', 'paid')
  AND fo.order_status <> 'cancelled'
  AND fi.quantity > 0
ORDER BY fo.food_order_id, mi.menu_item_id;
GO
