-- №7 зертханалық. Әр SELECT-ті бөлек белгілеп Execute жасауға болады.
USE CinemaSchoolDB;
GO

-- 1. SELECT: фильм атауы мен рейтингі.
SELECT title, rating FROM Movies;

-- 2. WHERE: рейтингі 8.5-тен жоғары фильмдер.
SELECT title, rating FROM Movies WHERE rating > 8.5;

-- 3. AND, BETWEEN: бағасы 2000 бен 3000 арасында болатын сеанстар.
SELECT session_id, start_at, price FROM Sessions
WHERE price BETWEEN 2000 AND 3000 AND status = N'Жоспарланған';

-- 4. DISTINCT: қайталанбайтын жанр ID-лері.
SELECT DISTINCT genre_id FROM Movies ORDER BY genre_id;

-- 5. ORDER BY: сеанстар уақыты бойынша өсу ретімен.
SELECT session_id, movie_id, start_at, price FROM Sessions ORDER BY start_at ASC;

-- 6. ORDER BY: ең қымбат сеанстар жоғарыда.
SELECT session_id, movie_id, start_at, price FROM Sessions ORDER BY price DESC, start_at ASC;

-- 7. GROUP BY және COUNT: жанр бойынша фильм саны.
SELECT genre_id, COUNT(*) AS movie_count FROM Movies GROUP BY genre_id ORDER BY movie_count DESC;

-- 8. HAVING: екіден көп фильмі бар жанрлар.
SELECT genre_id, COUNT(*) AS movie_count FROM Movies
GROUP BY genre_id HAVING COUNT(*) > 2 ORDER BY movie_count DESC;

-- 9. AVG, MIN, MAX: сеанс бағалары.
SELECT hall_id, AVG(price) AS avg_price, MIN(price) AS min_price,
       MAX(price) AS max_price FROM Sessions GROUP BY hall_id;

-- 10. SUM және COUNT: қанша билет сатылды, түсім қанша?
SELECT COUNT(*) AS tickets_sold, SUM(price) AS total_revenue FROM Tickets;

-- 11. Практикалық сұраныс: әр сеанс қанша билет сатты?
SELECT session_id, COUNT(*) AS tickets_sold, SUM(price) AS revenue
FROM Tickets GROUP BY session_id ORDER BY tickets_sold DESC;

-- 12. Бірнеше шарт: кинотеатрдағы кешкі сеанстар.
SELECT session_id, movie_id, start_at, price FROM Sessions
WHERE price >= 2000 AND status = N'Жоспарланған'
ORDER BY start_at ASC;
GO
