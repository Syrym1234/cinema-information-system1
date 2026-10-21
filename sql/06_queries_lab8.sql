/*
  ЗЖ №8 — Ішкі сұраныстар, JOIN, CASE және күрделі аналитика
  ДҚ: CinemaLabDB
  Алдымен sql/01_schema.sql және sql/02_seed.sql орындалуы керек.

  Тапсырма қауіпсіз түрде әр бөлімге кемінде 3 сұраныстан орындалды:
  1) JOIN — 3
  2) Бір жолды/бір бағанды subquery — 3
  3) Бірнеше жолды subquery — 3
  4) CASE — 3
  5) Күрделі аналитикалық сұраныс — 3
*/

USE CinemaLabDB;
GO

/* =========================================================
   1-БӨЛІМ. JOIN АРҚЫЛЫ БІРНЕШЕ КЕСТЕНІ БІРІКТІРУ — 3 сұраныс
   ========================================================= */

-- 1.1 Болашақ сеанстар: фильм + жанр + зал
SELECT TOP (40)
       s.session_id,
       m.title,
       g.genre_name,
       h.hall_name,
       h.hall_format,
       s.start_at,
       s.base_price
FROM dbo.Sessions AS s
INNER JOIN dbo.Movies AS m ON m.movie_id = s.movie_id
INNER JOIN dbo.Genres AS g ON g.genre_id = m.genre_id
INNER JOIN dbo.Halls AS h ON h.hall_id = s.hall_id
WHERE s.start_at >= SYSDATETIME()
  AND s.session_status = 'scheduled'
ORDER BY s.start_at ASC;
GO

-- 1.2 Сатылған билеттер: клиент + фильм + зал + орын + билет
SELECT TOP (50)
       c.full_name,
       c.email,
       m.title,
       h.hall_name,
       s.start_at,
       CONCAT(seat.row_label, seat.seat_number) AS seat_no,
       rs.seat_price,
       t.ticket_status
FROM dbo.Tickets AS t
INNER JOIN dbo.ReservationSeats AS rs
        ON rs.reservation_seat_id = t.reservation_seat_id
INNER JOIN dbo.Reservations AS r
        ON r.reservation_id = rs.reservation_id
INNER JOIN dbo.Customers AS c
        ON c.customer_id = r.customer_id
INNER JOIN dbo.Sessions AS s
        ON s.session_id = r.session_id
INNER JOIN dbo.Movies AS m
        ON m.movie_id = s.movie_id
INNER JOIN dbo.Halls AS h
        ON h.hall_id = s.hall_id
INNER JOIN dbo.Seats AS seat
        ON seat.seat_id = rs.seat_id
WHERE r.reservation_status = 'paid'
ORDER BY s.start_at DESC, c.full_name;
GO

-- 1.3 Тағам тапсырыстары: клиент + тапсырыс + мәзір позициясы
SELECT TOP (50)
       c.full_name,
       fo.food_order_id,
       fo.order_status,
       mi.category,
       mi.item_name,
       foi.quantity,
       foi.unit_price,
       foi.quantity * foi.unit_price AS line_total
FROM dbo.FoodOrders AS fo
INNER JOIN dbo.Reservations AS r
        ON r.reservation_id = fo.reservation_id
INNER JOIN dbo.Customers AS c
        ON c.customer_id = r.customer_id
INNER JOIN dbo.FoodOrderItems AS foi
        ON foi.food_order_id = fo.food_order_id
INNER JOIN dbo.MenuItems AS mi
        ON mi.menu_item_id = foi.menu_item_id
WHERE fo.order_status <> 'cancelled'
ORDER BY fo.food_order_id DESC, mi.item_name;
GO

/* =========================================================
   2-БӨЛІМ. БІР ЖОЛДЫ ЖӘНЕ БІР БАҒАНДЫ SUBQUERY — 3 сұраныс
   Ішкі сұраныс бір ғана мән қайтарады.
   ========================================================= */

-- 2.1 Орташа бағадан қымбат сеанстар
SELECT
       s.session_id,
       m.title,
       s.start_at,
       s.base_price
FROM dbo.Sessions AS s
INNER JOIN dbo.Movies AS m ON m.movie_id = s.movie_id
WHERE s.base_price > (
    SELECT AVG(base_price)
    FROM dbo.Sessions
)
ORDER BY s.base_price DESC, s.start_at;
GO

-- 2.2 Ең жоғары рейтингке ие фильм(дер)
SELECT
       movie_id,
       title,
       rating,
       release_year
FROM dbo.Movies
WHERE rating = (
    SELECT MAX(rating)
    FROM dbo.Movies
    WHERE rating IS NOT NULL
);
GO

-- 2.3 Орташа ұзақтықтан ұзын фильмдер
SELECT
       title,
       duration_min,
       rating
FROM dbo.Movies
WHERE duration_min > (
    SELECT AVG(CAST(duration_min AS DECIMAL(10,2)))
    FROM dbo.Movies
)
ORDER BY duration_min DESC;
GO

/* =========================================================
   3-БӨЛІМ. БІРНЕШЕ ЖОЛДЫ SUBQUERY — 3 сұраныс
   Ішкі сұраныс бірнеше мән қайтарады, сондықтан IN қолданылады.
   ========================================================= */

-- 3.1 Үш немесе одан көп фильмі бар жанрларға жататын фильмдер
SELECT
       m.title,
       m.genre_id,
       m.rating
FROM dbo.Movies AS m
WHERE m.genre_id IN (
    SELECT genre_id
    FROM dbo.Movies
    GROUP BY genre_id
    HAVING COUNT(*) >= 3
)
ORDER BY m.genre_id, m.title;
GO

-- 3.2 Кемінде бір төленген брондауы бар клиенттер
SELECT
       c.customer_id,
       c.full_name,
       c.email
FROM dbo.Customers AS c
WHERE c.customer_id IN (
    SELECT r.customer_id
    FROM dbo.Reservations AS r
    WHERE r.reservation_status = 'paid'
)
ORDER BY c.full_name;
GO

-- 3.3 Билет сатылған сеанстар
SELECT
       s.session_id,
       m.title,
       s.start_at,
       s.base_price
FROM dbo.Sessions AS s
INNER JOIN dbo.Movies AS m ON m.movie_id = s.movie_id
WHERE s.session_id IN (
    SELECT DISTINCT rs.session_id
    FROM dbo.ReservationSeats AS rs
    INNER JOIN dbo.Tickets AS t
            ON t.reservation_seat_id = rs.reservation_seat_id
)
ORDER BY s.start_at;
GO

/* =========================================================
   4-БӨЛІМ. CASE АРҚЫЛЫ ШАРТТЫ МӘНДЕР — 3 сұраныс
   ========================================================= */

-- 4.1 Сеанс бағасын категорияға бөлу
SELECT TOP (60)
       m.title,
       s.start_at,
       s.base_price,
       CASE
           WHEN s.base_price < 2200 THEN N'Арзан'
           WHEN s.base_price < 3000 THEN N'Орташа'
           ELSE N'Қымбат'
       END AS price_category
FROM dbo.Sessions AS s
INNER JOIN dbo.Movies AS m ON m.movie_id = s.movie_id
WHERE s.start_at >= SYSDATETIME()
ORDER BY s.base_price, s.start_at;
GO

-- 4.2 Фильм рейтингін мәтіндік деңгейге айналдыру
SELECT
       title,
       rating,
       CASE
           WHEN rating IS NULL THEN N'Бағаланбаған'
           WHEN rating >= 8.5 THEN N'Өте жоғары'
           WHEN rating >= 7.5 THEN N'Жақсы'
           WHEN rating >= 6.0 THEN N'Орташа'
           ELSE N'Төмен'
       END AS rating_level
FROM dbo.Movies
ORDER BY rating DESC, title;
GO

-- 4.3 Болашақ сеанстардағы әр орынның күйі: сатылған / бронь / бос
SELECT TOP (120)
       s.session_id,
       m.title,
       h.hall_name,
       s.start_at,
       CONCAT(seat.row_label, seat.seat_number) AS seat_no,
       CASE
           WHEN o.seat_status = 'sold' THEN N'Сатылған'
           WHEN o.seat_status = 'held' THEN N'Броньда'
           ELSE N'Бос'
       END AS seat_state
FROM dbo.Sessions AS s
INNER JOIN dbo.Movies AS m ON m.movie_id = s.movie_id
INNER JOIN dbo.Halls AS h ON h.hall_id = s.hall_id
INNER JOIN dbo.Seats AS seat ON seat.hall_id = s.hall_id
LEFT JOIN dbo.v_SeatOccupancy AS o
       ON o.session_id = s.session_id
      AND o.seat_id = seat.seat_id
WHERE s.start_at >= SYSDATETIME()
ORDER BY s.start_at, seat.row_label, seat.seat_number;
GO

/* =========================================================
   5-БӨЛІМ. КҮРДЕЛІ АНАЛИТИКАЛЫҚ СҰРАНЫСТАР — 3 сұраныс
   ========================================================= */

-- 5.1 Фильмдер бойынша сатылған билет, түсім және табыс рейтингі
WITH MovieSales AS (
    SELECT
           m.movie_id,
           m.title,
           COUNT(t.ticket_id) AS tickets_sold,
           COALESCE(SUM(rs.seat_price), 0) AS ticket_revenue
    FROM dbo.Movies AS m
    LEFT JOIN dbo.Sessions AS s
           ON s.movie_id = m.movie_id
    LEFT JOIN dbo.Reservations AS r
           ON r.session_id = s.session_id
          AND r.reservation_status = 'paid'
    LEFT JOIN dbo.ReservationSeats AS rs
           ON rs.reservation_id = r.reservation_id
    LEFT JOIN dbo.Tickets AS t
           ON t.reservation_seat_id = rs.reservation_seat_id
    GROUP BY m.movie_id, m.title
)
SELECT
       movie_id,
       title,
       tickets_sold,
       ticket_revenue,
       DENSE_RANK() OVER (ORDER BY ticket_revenue DESC) AS revenue_rank
FROM MovieSales
ORDER BY revenue_rank, title;
GO

-- 5.2 Әр болашақ сеанстың орын толу пайызы
SELECT TOP (80)
       s.session_id,
       m.title,
       h.hall_name,
       s.start_at,
       COUNT(DISTINCT seat.seat_id) AS total_seats,
       COUNT(DISTINCT CASE WHEN o.seat_status = 'sold' THEN seat.seat_id END) AS sold_seats,
       COUNT(DISTINCT CASE WHEN o.seat_status = 'held' THEN seat.seat_id END) AS held_seats,
       COUNT(DISTINCT seat.seat_id) - COUNT(DISTINCT o.seat_id) AS available_seats,
       CAST(
           100.0 * COUNT(DISTINCT CASE WHEN o.seat_status = 'sold' THEN seat.seat_id END)
           / NULLIF(COUNT(DISTINCT seat.seat_id), 0)
           AS DECIMAL(5,2)
       ) AS sold_percent
FROM dbo.Sessions AS s
INNER JOIN dbo.Movies AS m ON m.movie_id = s.movie_id
INNER JOIN dbo.Halls AS h ON h.hall_id = s.hall_id
INNER JOIN dbo.Seats AS seat ON seat.hall_id = s.hall_id
LEFT JOIN dbo.v_SeatOccupancy AS o
       ON o.session_id = s.session_id
      AND o.seat_id = seat.seat_id
WHERE s.start_at >= SYSDATETIME()
GROUP BY s.session_id, m.title, h.hall_name, s.start_at
ORDER BY sold_percent DESC, s.start_at;
GO

-- 5.3 Клиенттердің билет + тағам бойынша жалпы шығыны
WITH TicketSpend AS (
    SELECT
           r.reservation_id,
           r.customer_id,
           SUM(rs.seat_price) AS ticket_total
    FROM dbo.Reservations AS r
    INNER JOIN dbo.ReservationSeats AS rs
            ON rs.reservation_id = r.reservation_id
    INNER JOIN dbo.Tickets AS t
            ON t.reservation_seat_id = rs.reservation_seat_id
    WHERE r.reservation_status = 'paid'
    GROUP BY r.reservation_id, r.customer_id
),
FoodSpend AS (
    SELECT
           fo.reservation_id,
           SUM(foi.quantity * foi.unit_price) AS food_total
    FROM dbo.FoodOrders AS fo
    INNER JOIN dbo.FoodOrderItems AS foi
            ON foi.food_order_id = fo.food_order_id
    WHERE fo.order_status <> 'cancelled'
    GROUP BY fo.reservation_id
),
CustomerSpend AS (
    SELECT
           ts.customer_id,
           COUNT(*) AS paid_reservations,
           SUM(ts.ticket_total) AS ticket_total,
           SUM(COALESCE(fs.food_total, 0)) AS food_total
    FROM TicketSpend AS ts
    LEFT JOIN FoodSpend AS fs
           ON fs.reservation_id = ts.reservation_id
    GROUP BY ts.customer_id
)
SELECT TOP (15)
       c.customer_id,
       c.full_name,
       cs.paid_reservations,
       cs.ticket_total,
       cs.food_total,
       cs.ticket_total + cs.food_total AS total_spent,
       DENSE_RANK() OVER (
           ORDER BY cs.ticket_total + cs.food_total DESC
       ) AS customer_rank
FROM CustomerSpend AS cs
INNER JOIN dbo.Customers AS c
        ON c.customer_id = cs.customer_id
ORDER BY customer_rank, c.full_name;
GO
