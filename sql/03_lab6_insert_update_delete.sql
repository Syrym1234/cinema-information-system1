-- №6 зертханалық: INSERT, UPDATE, DELETE.
-- Осы файлды 01 және 02 файлдарынан кейін орындаңыз.
USE CinemaSchoolDB;
GO

-- 1. INSERT: тек сынақ үшін жаңа фильм енгіземіз.
INSERT INTO Movies (title, genre_id, duration_min, age_rating, release_year, rating, description)
VALUES (N'Менің бірінші фильмім', 1, 105, 12, 2026, 7.5, N'Зертханалық тәжірибеге арналған фильм');

-- 2. SELECT: жаңа фильм шынымен қосылды ма?
SELECT * FROM Movies WHERE title = N'Менің бірінші фильмім';

-- 3. UPDATE: тек осы фильмнің рейтингін өзгерту.
UPDATE Movies SET rating = 8.5 WHERE title = N'Менің бірінші фильмім';
SELECT title, rating FROM Movies WHERE title = N'Менің бірінші фильмім';

-- 4. DELETE: тек зертханалық сынақтағы фильмді жою.
DELETE FROM Movies WHERE title = N'Менің бірінші фильмім';
SELECT * FROM Movies WHERE title = N'Менің бірінші фильмім';
-- Назар аударыңыз: WHERE жоқ DELETE барлық жолдарды өшіруі мүмкін.
