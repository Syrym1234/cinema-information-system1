/*
  Тапсырма: кешкі сеансқа жасалған, бағасы барлық сеанстардың
  орташа бағасынан жоғары және тағам тапсырыстарында попкорн жоқ
  топтық броньдарды, фильмді және адам санын шығару.

  Нақты база: CinemaLabDB (CinemaSchoolDB емес).
  Кешкі уақыт: 18:00 және одан кейін.
  held / paid броньдары ескеріледі; cancelled / expired ескерілмейді.
  Бір брондалған орын бір көрермен деп есептеледі.
  Тағам тапсырысы мүлде жоқ топтар да попкорнсыз деп есептеледі.
  Тек SELECT орындалады; деректер өзгертілмейді.
*/
USE CinemaLabDB;
GO

SELECT
    gb.group_id AS [Топтық тапсырыс ID],
    m.title AS [Фильм],
    s.start_at AS [Сеанс уақыты],
    s.base_price AS [Сеанс бағасы],
    CAST((SELECT AVG(s2.base_price)
          FROM dbo.Sessions AS s2) AS DECIMAL(10, 2)) AS [Барлық сеанстың орташа бағасы],

    -- Адам саны: осы топқа тиесілі брондалған орындар саны.
    (SELECT COUNT(*)
     FROM dbo.ReservationSeats AS rs
     INNER JOIN dbo.Reservations AS r
         ON r.reservation_id = rs.reservation_id
     WHERE r.group_id = gb.group_id
       AND r.session_id = gb.session_id
       AND rs.session_id = gb.session_id
       AND r.reservation_status IN ('held', 'paid')) AS [Адам саны],

    -- Бір клиент бірнеше адамға орын брондауы мүмкін.
    (SELECT COUNT(DISTINCT r.customer_id)
     FROM dbo.Reservations AS r
     WHERE r.group_id = gb.group_id
       AND r.session_id = gb.session_id
       AND r.reservation_status IN ('held', 'paid')) AS [Тапсырыс берген клиент саны]

FROM dbo.GroupBookings AS gb
INNER JOIN dbo.Sessions AS s ON s.session_id = gb.session_id
INNER JOIN dbo.Movies AS m ON m.movie_id = s.movie_id

WHERE CAST(s.start_at AS TIME) >= CAST('18:00:00' AS TIME)

  -- Бір мән қайтаратын ішкі сұраныс: барлық сеанстың орташа бағасы.
  AND s.base_price > (
      SELECT AVG(s2.base_price)
      FROM dbo.Sessions AS s2
  )

  -- Топта кемінде бір нақты брондалған орын болуы керек.
  AND EXISTS (
      SELECT 1
      FROM dbo.Reservations AS r
      INNER JOIN dbo.ReservationSeats AS rs
          ON rs.reservation_id = r.reservation_id
      WHERE r.group_id = gb.group_id
        AND r.session_id = gb.session_id
        AND rs.session_id = gb.session_id
        AND r.reservation_status IN ('held', 'paid')
  )

  -- Топтағы кез келген броньның тағам тапсырысында попкорн болса,
  -- бұл топ нәтижеден толық алынып тасталады.
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.Reservations AS r
      INNER JOIN dbo.FoodOrders AS fo
          ON fo.reservation_id = r.reservation_id
      INNER JOIN dbo.FoodOrderItems AS foi
          ON foi.food_order_id = fo.food_order_id
      INNER JOIN dbo.MenuItems AS mi
          ON mi.menu_item_id = foi.menu_item_id
      WHERE r.group_id = gb.group_id
        AND r.session_id = gb.session_id
        AND r.reservation_status IN ('held', 'paid')
        AND fo.order_status <> 'cancelled'
        AND foi.quantity > 0
        AND (mi.category = N'Попкорн'
             OR LOWER(mi.item_name) LIKE N'%попкорн%'
             OR LOWER(mi.item_name) LIKE N'%popcorn%')
  )

ORDER BY s.start_at, gb.group_id;
GO

/*
  Егер міндетті түрде тағам тапсырысы бар топтар ғана керек болса,
  ORDER BY алдындағы WHERE шарттарына төмендегі AND EXISTS қосылады.
  Қазіргі тексерілген CinemaLabDB деректерінде бұл қатаң нұсқа 0 жол береді:
  жалғыз кешкі, орташа бағадан қымбат топта тағам тапсырысы жоқ.

  AND EXISTS (
      SELECT 1
      FROM dbo.Reservations AS r
      INNER JOIN dbo.FoodOrders AS fo
          ON fo.reservation_id = r.reservation_id
      INNER JOIN dbo.FoodOrderItems AS foi
          ON foi.food_order_id = fo.food_order_id
      WHERE r.group_id = gb.group_id
        AND r.session_id = gb.session_id
        AND r.reservation_status IN ('held', 'paid')
        AND fo.order_status <> 'cancelled'
        AND foi.quantity > 0
  )
*/
