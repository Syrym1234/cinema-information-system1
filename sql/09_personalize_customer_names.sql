/* Пайдаланушы ұсынған бес аты-жөнді оқу базасының клиенттеріне енгізу.
   08_set_demo_customer_names.sql орындалғаннан кейін қолданылады.
   Тек full_name өзгереді; ID-лер және бронь байланыстары сақталады.
*/
USE CinemaLabDB;
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Names TABLE (
    customer_id INT PRIMARY KEY,
    old_name NVARCHAR(120) NOT NULL,
    new_name NVARCHAR(120) NOT NULL
);
INSERT INTO @Names (customer_id, old_name, new_name) VALUES
    (1, N'Әлихан Сәрсенов', N'Дарханбай Қуаныш'),
    (2, N'Аружан Қасымова', N'Данияров Ерасыл'),
    (3, N'Нұрсұлтан Әбілов', N'Меделханов Бағыжан'),
    (4, N'Айдана Төлегенова', N'Заманбек Аманжол'),
    (34, N'Айдос Сейітов', N'Бақтыбек Сырым');

DECLARE @Changed INT;
BEGIN TRY
    BEGIN TRANSACTION;
    UPDATE c
    SET full_name = n.new_name
    FROM dbo.Customers AS c
    INNER JOIN @Names AS n ON n.customer_id = c.customer_id
    WHERE c.full_name = n.old_name;
    SET @Changed = @@ROWCOUNT;

    IF EXISTS (
        SELECT 1 FROM @Names AS n
        LEFT JOIN dbo.Customers AS c ON c.customer_id = n.customer_id
        WHERE c.customer_id IS NULL OR c.full_name <> n.new_name
    )
        THROW 51000, N'Клиенттің аты күтілген мәнге сәйкес емес. Өзгерістер қайтарылды.', 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

SELECT @Changed AS [Өзгертілген клиент саны];
SELECT c.customer_id AS [Клиент ID], c.full_name AS [Аты-жөні]
FROM dbo.Customers AS c
INNER JOIN @Names AS n ON n.customer_id = c.customer_id
ORDER BY c.customer_id;
GO
