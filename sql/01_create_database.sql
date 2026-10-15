-- Зертханалық жұмыс №6
-- Кинотеатр деректер қорын құру. Бұл файлды ТЕК БІР РЕТ орындаңыз.
-- Бар деректер қорын автоматты түрде өшірмейді.
CREATE DATABASE CinemaSchoolDB;
GO
USE CinemaSchoolDB;
GO

-- Әр кестеде PRIMARY KEY бар. Қажет жерлерде FOREIGN KEY қолданылады.
CREATE TABLE Genres (
    genre_id INT IDENTITY(1,1) PRIMARY KEY,
    genre_name NVARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Movies (
    movie_id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(150) NOT NULL,
    genre_id INT NOT NULL FOREIGN KEY REFERENCES Genres(genre_id),
    duration_min INT NOT NULL CHECK (duration_min > 0),
    age_rating INT NOT NULL,
    release_year INT NOT NULL,
    rating DECIMAL(3,1) NOT NULL CHECK (rating >= 0 AND rating <= 10),
    description NVARCHAR(400) NOT NULL
);

CREATE TABLE Halls (
    hall_id INT IDENTITY(1,1) PRIMARY KEY,
    hall_name NVARCHAR(60) NOT NULL UNIQUE,
    capacity INT NOT NULL CHECK (capacity > 0)
);

CREATE TABLE Sessions (
    session_id INT IDENTITY(1,1) PRIMARY KEY,
    movie_id INT NOT NULL FOREIGN KEY REFERENCES Movies(movie_id),
    hall_id INT NOT NULL FOREIGN KEY REFERENCES Halls(hall_id),
    start_at DATETIME2(0) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    status NVARCHAR(20) NOT NULL DEFAULT N'Жоспарланған',
    UNIQUE (hall_id, start_at)
);

CREATE TABLE Customers (
    customer_id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE Tickets (
    ticket_id INT IDENTITY(1,1) PRIMARY KEY,
    session_id INT NOT NULL FOREIGN KEY REFERENCES Sessions(session_id),
    customer_id INT NOT NULL FOREIGN KEY REFERENCES Customers(customer_id),
    seat_number INT NOT NULL CHECK (seat_number BETWEEN 1 AND 60),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    purchased_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    UNIQUE (session_id, seat_number)
);

CREATE TABLE MenuItems (
    menu_item_id INT IDENTITY(1,1) PRIMARY KEY,
    item_name NVARCHAR(80) NOT NULL,
    category NVARCHAR(40) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0)
);
GO
-- Қарапайым тексеру: 7 кесте құрылды ма?
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';
