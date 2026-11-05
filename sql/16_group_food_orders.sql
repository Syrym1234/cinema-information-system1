/* №1 топтың тағамдары: кім тапсырыс бергені, саны және бағасы.
   Мұндағы күй — тағам тапсырысының күйі, төлем күйі емес.
*/
USE CinemaLabDB;
GO
SELECT
    r.group_id AS [Топ ID],
    c.customer_id AS [Клиент ID],
    c.full_name AS [Тағамға тапсырыс берген клиент],
    fo.food_order_id AS [Тағам тапсырыс ID],
    mi.item_name AS [Тағам],
    mi.category AS [Санат],
    fi.quantity AS [Саны],
    fi.unit_price AS [Бір данасының бағасы],
    fi.quantity * fi.unit_price AS [Тағам құны],
    fo.order_status AS [Тапсырыс күйі]
FROM dbo.Reservations AS r
JOIN dbo.Customers AS c ON c.customer_id = r.customer_id
JOIN dbo.FoodOrders AS fo ON fo.reservation_id = r.reservation_id
JOIN dbo.FoodOrderItems AS fi ON fi.food_order_id = fo.food_order_id
JOIN dbo.MenuItems AS mi ON mi.menu_item_id = fi.menu_item_id
WHERE r.group_id = 1
  AND r.reservation_status IN ('held', 'paid')
  AND fo.order_status <> 'cancelled'
  AND fi.quantity > 0
ORDER BY fo.food_order_id, mi.menu_item_id;
GO
