/* Оқу деректерін толықтыру: 20 топ, әр топта 3–5 брондаушы клиент.
   Бастапқы жолдар өзгермейді. Жаңа бронь, орын, demo_paid төлем және билет қосылады.
   Қайталап орындау жаңа көшірме жасамайды. Нақты ақша операциясы орындалмайды.
   Попкорны бар және орташа бағадан арзан топтар сүзгіні тексеруге арналған.
*/
USE CinemaLabDB;
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;
DECLARE @Groups TABLE (
    ordinal INT PRIMARY KEY, group_code VARCHAR(40) UNIQUE,
    session_id INT, organizer_id INT, food_mode VARCHAR(12)
);
INSERT INTO @Groups VALUES
    (1, 'DEMO-GROUP-1', 49, 34, 'plain'),
    (2, 'DEMO-GROUP-2', 137, 48, 'keep'),
    (3, 'DEMO-GROUP-3', 101, 21, 'keep'),
    (4, 'DEMO-GROUP-4', 131, 43, 'keep'),
    (5, 'DEMO-GROUP-5', 168, 30, 'keep'),
    (6, 'DEMO-GROUP-6', 167, 26, 'keep'),
    (7, 'DEMO-TEAM-20261105-01', 329, 1, 'plain'),
    (8, 'DEMO-TEAM-20261105-02', 334, 3, 'plain'),
    (9, 'DEMO-TEAM-20261105-03', 339, 7, 'plain'),
    (10, 'DEMO-TEAM-20261105-04', 330, 12, 'plain'),
    (11, 'DEMO-TEAM-20261105-05', 335, 15, 'plain'),
    (12, 'DEMO-TEAM-20261105-06', 340, 19, 'plain'),
    (13, 'DEMO-TEAM-20261105-07', 349, 24, 'plain'),
    (14, 'DEMO-TEAM-20261105-08', 354, 27, 'plain'),
    (15, 'DEMO-TEAM-20261105-09', 359, 31, 'plain'),
    (16, 'DEMO-TEAM-20261105-10', 350, 37, 'plain'),
    (17, 'DEMO-TEAM-20261105-11', 355, 40, 'plain'),
    (18, 'DEMO-TEAM-20261105-12', 360, 44, 'plain'),
    (19, 'DEMO-TEAM-20261105-13', 369, 49, 'popcorn'),
    (20, 'DEMO-TEAM-20261105-14', 324, 52, 'plain');
DECLARE @Members TABLE (
    group_code VARCHAR(40), customer_id INT, new_reservation_id UNIQUEIDENTIFIER,
    PRIMARY KEY (group_code, customer_id)
);
INSERT INTO @Members VALUES
    ('DEMO-GROUP-1', 34, 'a8d17740-23c0-6231-31ef-63bd936fbdfd'),
    ('DEMO-GROUP-1', 1, 'de1518cc-3bdd-ef5e-9176-7f00f3330f10'),
    ('DEMO-GROUP-1', 2, '985a61d1-cef2-6f71-5405-8ee005725e52'),
    ('DEMO-GROUP-1', 3, 'e5879939-c26f-3602-1149-7c259a23aa41'),
    ('DEMO-GROUP-1', 4, '396171c4-de37-05b4-3444-b0958f558114'),
    ('DEMO-GROUP-2', 48, 'd4bfe08f-6cf1-b229-f01b-70a00c8b1871'),
    ('DEMO-GROUP-2', 7, '4e0e679f-dd7c-d321-2b61-7412491b6f86'),
    ('DEMO-GROUP-2', 8, '47cd0e1f-a033-92ff-0446-f23a9c9d5835'),
    ('DEMO-GROUP-3', 21, '5b3fbb0b-4d6f-59d1-8715-03c1732299fb'),
    ('DEMO-GROUP-3', 9, 'af4eec3c-5c88-463a-9a52-695bfea8308c'),
    ('DEMO-GROUP-3', 10, '255988fc-5fdb-1ae2-f36d-14b803839499'),
    ('DEMO-GROUP-4', 43, '5af89f97-1752-1b4e-8cfb-1b79a33250c7'),
    ('DEMO-GROUP-4', 11, '53ec6719-ba6a-a9af-ab15-106b3389ac09'),
    ('DEMO-GROUP-4', 12, 'ea2a01e8-6857-5f7b-66e2-0227bfec8325'),
    ('DEMO-GROUP-5', 30, '90aedd30-fed1-e284-bcb1-ee44193eb1bb'),
    ('DEMO-GROUP-5', 13, 'a028a080-f908-7c58-daaa-b6ebf6e0fced'),
    ('DEMO-GROUP-5', 14, '7c4167e1-a4f1-17eb-83f6-c5d126ac8fad'),
    ('DEMO-GROUP-6', 26, 'e6121ebf-8444-ff47-67cb-a5a1bd37898d'),
    ('DEMO-GROUP-6', 15, '10d18b22-fb1b-36d7-f390-b835668dcd8e'),
    ('DEMO-GROUP-6', 16, '0e14e20c-ef3b-8c49-1b2c-30161e2b3f9e'),
    ('DEMO-TEAM-20261105-01', 34, '63823779-44bb-4099-0c11-13be46a03dc4'),
    ('DEMO-TEAM-20261105-01', 1, '8d3c245d-b7b2-eb87-70df-b3de64a11b9c'),
    ('DEMO-TEAM-20261105-01', 2, '8ea4f659-95de-6466-3019-d23a6e65f97f'),
    ('DEMO-TEAM-20261105-02', 3, '30a06d08-9196-f0fa-8f3a-af3e6cd964c6'),
    ('DEMO-TEAM-20261105-02', 4, '0dd2bbc6-9158-4c83-47d3-d8299cdb3ad1'),
    ('DEMO-TEAM-20261105-02', 5, '6b1061cb-bbc0-de9d-7655-73e9061e0e40'),
    ('DEMO-TEAM-20261105-02', 6, '0521c81a-d954-a4eb-0c91-96b1330c07ae'),
    ('DEMO-TEAM-20261105-03', 7, '3e068e2e-9edb-3158-f0b3-af10ef373cba'),
    ('DEMO-TEAM-20261105-03', 8, 'bfc8cb09-be15-9f60-79ee-244bb7d22abc'),
    ('DEMO-TEAM-20261105-03', 9, 'b73d5268-29d8-1a95-9b74-eb92e14a2b9c'),
    ('DEMO-TEAM-20261105-03', 10, '43db2bea-b0cf-07ad-dff7-c65ee54308c1'),
    ('DEMO-TEAM-20261105-03', 11, 'ea50569a-f4b2-3f03-e749-e0b2f582c913'),
    ('DEMO-TEAM-20261105-04', 12, '11f894da-8524-ea0a-6f2b-cf8c0fd30480'),
    ('DEMO-TEAM-20261105-04', 13, 'a1069a4c-d183-9a03-5236-795878829a02'),
    ('DEMO-TEAM-20261105-04', 14, '68a201c8-b6f4-2c0e-5f94-c9d6b30ce718'),
    ('DEMO-TEAM-20261105-05', 15, 'ceaeee72-00fc-e3c8-4c49-2e495c207eb1'),
    ('DEMO-TEAM-20261105-05', 16, 'f9547dd5-e2d5-d587-6695-f7525ecca71b'),
    ('DEMO-TEAM-20261105-05', 17, '6bd1585f-77d3-b00a-4499-b4d5e7836954'),
    ('DEMO-TEAM-20261105-05', 18, 'c6ab508b-0560-984f-32dc-7826a0f556e4'),
    ('DEMO-TEAM-20261105-06', 19, '14adc5db-5339-2b3a-06bb-d2d105cbf4e6'),
    ('DEMO-TEAM-20261105-06', 20, '9915701b-aa87-735d-67f3-493aaebe0aae'),
    ('DEMO-TEAM-20261105-06', 21, '65785cff-cb00-4f23-c2e8-fd38b3f7e25f'),
    ('DEMO-TEAM-20261105-06', 22, '7a855951-1dfa-4978-3ede-2a92d845148b'),
    ('DEMO-TEAM-20261105-06', 23, 'b4399eb3-a33a-78e7-ff81-c4556a0599ac'),
    ('DEMO-TEAM-20261105-07', 24, '3efe2a1f-30a4-4559-524b-752f9f356a76'),
    ('DEMO-TEAM-20261105-07', 25, '3aa4f58c-d7d0-3ba2-f8ff-ca68fa7ab49d'),
    ('DEMO-TEAM-20261105-07', 26, '0c036d12-3625-c2db-ba34-3655b8d09880'),
    ('DEMO-TEAM-20261105-08', 27, '3349dfd8-3511-61e3-01ce-400bbd205a4a'),
    ('DEMO-TEAM-20261105-08', 28, '74344e93-857c-7a68-1ca4-53c9ee52d5af'),
    ('DEMO-TEAM-20261105-08', 29, '909f5b59-591f-411f-18c6-fb3197ad3ec0'),
    ('DEMO-TEAM-20261105-08', 30, '7019ead5-b073-d6e8-9c3b-2cc01579fd93'),
    ('DEMO-TEAM-20261105-09', 31, '5b3abf9e-a69b-0270-5d40-d3d0ee8493d0'),
    ('DEMO-TEAM-20261105-09', 32, 'c8e01f42-eac2-2e87-4fdc-85581883970e'),
    ('DEMO-TEAM-20261105-09', 33, '2d25a5cc-48f6-49fc-80a6-e7c936020f3e'),
    ('DEMO-TEAM-20261105-09', 35, '0f72df2e-39db-e131-eae2-1850bd1fc43a'),
    ('DEMO-TEAM-20261105-09', 36, 'bafbcd3f-d49a-d593-d129-636ab288ab10'),
    ('DEMO-TEAM-20261105-10', 37, '50f5ec37-5605-e2a2-c732-829c09adc471'),
    ('DEMO-TEAM-20261105-10', 38, 'b17e99cb-9c30-1bda-6988-5aedf160f1cb'),
    ('DEMO-TEAM-20261105-10', 39, 'ff6349a0-8845-1efd-5f6c-90f1f7763cd9'),
    ('DEMO-TEAM-20261105-11', 40, '63bd483f-6400-1eda-fade-74ad6f0cb63c'),
    ('DEMO-TEAM-20261105-11', 41, '1c332d70-9346-b530-9305-a520eab512b7'),
    ('DEMO-TEAM-20261105-11', 42, '20813e0e-62a5-f715-398a-9db257bd5d41'),
    ('DEMO-TEAM-20261105-11', 43, '97ee9ef5-3810-59e3-33cf-a12d985a1f69'),
    ('DEMO-TEAM-20261105-12', 44, '6a5d1c61-479f-e133-c9ca-39798177a151'),
    ('DEMO-TEAM-20261105-12', 45, '60950a8a-b5ae-4d98-0037-272fe6c6fd74'),
    ('DEMO-TEAM-20261105-12', 46, '92d275bf-3dc7-89ff-d1e6-fbe51834f2d2'),
    ('DEMO-TEAM-20261105-12', 47, 'e5da2db2-ac17-d9a7-2fbd-9200c419b701'),
    ('DEMO-TEAM-20261105-12', 48, '950ff077-6ab9-3620-c7ac-a0b2eaafb81f'),
    ('DEMO-TEAM-20261105-13', 49, '8b9b54e2-126a-49e9-9992-1d9191965414'),
    ('DEMO-TEAM-20261105-13', 50, '582ee667-f249-c66b-e7e4-0f699e5520d2'),
    ('DEMO-TEAM-20261105-13', 51, '1796531a-ffc9-15c7-b76d-f4506798fd19'),
    ('DEMO-TEAM-20261105-14', 52, 'c51d3d58-710d-c9da-9231-02581eb52626'),
    ('DEMO-TEAM-20261105-14', 53, '0e8b0141-c527-4d2d-d6c4-6f17cf4a661e'),
    ('DEMO-TEAM-20261105-14', 54, '892145be-bf7c-9915-6815-8d912d59d972'),
    ('DEMO-TEAM-20261105-14', 55, '454f4b5e-9dd0-134b-2a98-9d804f45d79b');

DECLARE @GroupsAdded INT=0, @ReservationsAdded INT=0, @SeatsAdded INT=0, @FoodAdded INT=0;
DECLARE @Code VARCHAR(40), @Session INT, @Organizer INT, @FoodMode VARCHAR(12), @Group INT;
DECLARE @Hall INT, @Price DECIMAL(10,2), @BookedAt DATETIME2(0);
DECLARE @Customer INT, @NewReservation UNIQUEIDENTIFIER, @Reservation UNIQUEIDENTIFIER;
DECLARE @Seat INT, @SeatRow INT, @Order INT, @Count INT, @ItemA INT, @ItemB INT, @QtyB INT;
DECLARE @Amount DECIMAL(12,2), @LockResult INT;
BEGIN TRY
    BEGIN TRANSACTION;
    EXEC @LockResult = sys.sp_getapplock @Resource=N'CinemaLabDB:group-demo-v1',
        @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=5000;
    IF @LockResult < 0 THROW 51001, N'Оқу деректерін толықтыру құлпын алу мүмкін болмады.', 1;

    DECLARE groups_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT group_code,session_id,organizer_id,food_mode FROM @Groups ORDER BY ordinal;
    OPEN groups_cursor;
    FETCH NEXT FROM groups_cursor INTO @Code,@Session,@Organizer,@FoodMode;
    WHILE @@FETCH_STATUS=0
    BEGIN
        SET @Group=NULL;
        SELECT @Group=group_id FROM dbo.GroupBookings WHERE invite_code=@Code;
        SET @Hall=NULL;
        SELECT @Hall=hall_id,@Price=base_price,
            @BookedAt=CASE WHEN start_at<SYSDATETIME() THEN DATEADD(HOUR,-1,start_at) ELSE SYSDATETIME() END
        FROM dbo.Sessions WHERE session_id=@Session AND session_status='scheduled';
        IF @Hall IS NULL THROW 51002, N'Жоспарланған сеанс табылмады.', 1;

        IF @Group IS NULL
        BEGIN
            INSERT INTO dbo.GroupBookings(session_id,organizer_customer_id,invite_code,created_at)
            VALUES(@Session,@Organizer,@Code,@BookedAt);
            SET @Group=CONVERT(INT,SCOPE_IDENTITY());
            SET @GroupsAdded+=1;
        END;
        IF NOT EXISTS (SELECT 1 FROM dbo.GroupBookings WHERE group_id=@Group
                       AND session_id=@Session AND organizer_customer_id=@Organizer)
            THROW 51003, N'Топтың сеансы немесе ұйымдастырушысы жоспарға сәйкес емес.', 1;

        DECLARE members_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT customer_id,new_reservation_id FROM @Members WHERE group_code=@Code ORDER BY customer_id;
        OPEN members_cursor;
        FETCH NEXT FROM members_cursor INTO @Customer,@NewReservation;
        WHILE @@FETCH_STATUS=0
        BEGIN
            SET @Reservation=NULL;
            SELECT TOP (1) @Reservation=r.reservation_id
            FROM dbo.Reservations AS r
            WHERE r.group_id=@Group AND r.session_id=@Session AND r.customer_id=@Customer
              AND r.reservation_status IN ('held','paid')
              AND EXISTS (SELECT 1 FROM dbo.ReservationSeats rs
                          WHERE rs.reservation_id=r.reservation_id AND rs.session_id=@Session)
            ORDER BY r.reservation_id;
            IF @Reservation IS NULL
            BEGIN
                SET @Seat=NULL;
                SELECT TOP (1) @Seat=st.seat_id
                FROM dbo.Seats AS st WITH (UPDLOCK,HOLDLOCK)
                WHERE st.hall_id=@Hall AND st.seat_type='standard'
                  AND NOT EXISTS (
                      SELECT 1 FROM dbo.ReservationSeats AS rs WITH (UPDLOCK,HOLDLOCK)
                      INNER JOIN dbo.Reservations AS r ON r.reservation_id=rs.reservation_id
                      WHERE rs.session_id=@Session AND rs.seat_id=st.seat_id
                        AND r.reservation_status IN ('held','paid')
                  )
                ORDER BY st.row_label,st.seat_number;
                IF @Seat IS NULL THROW 51004, N'Бос стандарт орын табылмады.', 1;
                INSERT INTO dbo.Reservations(reservation_id,customer_id,session_id,group_id,
                    reservation_status,created_at,expires_at,paid_at)
                VALUES(@NewReservation,@Customer,@Session,@Group,'paid',@BookedAt,DATEADD(MINUTE,15,@BookedAt),@BookedAt);
                INSERT INTO dbo.ReservationSeats(reservation_id,session_id,seat_id,seat_price)
                VALUES(@NewReservation,@Session,@Seat,@Price);
                SET @SeatRow=CONVERT(INT,SCOPE_IDENTITY());
                INSERT INTO dbo.Payments(reservation_id,amount,payment_method,payment_status,paid_at)
                VALUES(@NewReservation,@Price,'demo','demo_paid',@BookedAt);
                INSERT INTO dbo.Tickets(reservation_seat_id,ticket_status) VALUES(@SeatRow,'valid');
                SET @ReservationsAdded+=1;
                SET @SeatsAdded+=1;
            END;
            FETCH NEXT FROM members_cursor INTO @Customer,@NewReservation;
        END;
        CLOSE members_cursor;
        DEALLOCATE members_cursor;

        IF @FoodMode<>'keep' AND NOT EXISTS (
            SELECT 1 FROM dbo.FoodOrders AS fo
            INNER JOIN dbo.Reservations AS r ON r.reservation_id=fo.reservation_id
            WHERE r.group_id=@Group AND r.session_id=@Session AND fo.order_status<>'cancelled'
        )
        BEGIN
            SELECT TOP (1) @Reservation=reservation_id FROM dbo.Reservations
            WHERE group_id=@Group AND session_id=@Session AND customer_id=@Organizer
              AND reservation_status IN ('held','paid') ORDER BY reservation_id;
            SELECT @Count=COUNT(*) FROM dbo.ReservationSeats AS rs
            INNER JOIN dbo.Reservations AS r ON r.reservation_id=rs.reservation_id
            WHERE r.group_id=@Group AND r.session_id=@Session AND rs.session_id=@Session
              AND r.reservation_status IN ('held','paid');
            SET @ItemA=CASE WHEN @FoodMode='popcorn' THEN 1 ELSE 5 END;
            SET @ItemB=9;
            SET @QtyB=(@Count+1)/2;
            SET @Amount=NULL;
            SELECT @Amount=a.price*@Count+b.price*@QtyB
            FROM dbo.MenuItems a CROSS JOIN dbo.MenuItems b
            WHERE a.menu_item_id=@ItemA AND b.menu_item_id=@ItemB AND a.is_active=1 AND b.is_active=1;
            IF @Count<1 OR @Count>30 OR @Amount IS NULL
                THROW 51005, N'Тағам тапсырысының деректері жарамсыз.', 1;
            INSERT INTO dbo.FoodOrders(reservation_id,order_status,total_amount,ordered_at)
            VALUES(@Reservation,'accepted',@Amount,@BookedAt);
            SET @Order=CONVERT(INT,SCOPE_IDENTITY());
            INSERT INTO dbo.FoodOrderItems(food_order_id,menu_item_id,quantity,unit_price)
            SELECT @Order,menu_item_id,CASE WHEN menu_item_id=@ItemA THEN @Count ELSE @QtyB END,price
            FROM dbo.MenuItems WHERE menu_item_id IN (@ItemA,@ItemB);
            SET @FoodAdded+=1;
        END;
        FETCH NEXT FROM groups_cursor INTO @Code,@Session,@Organizer,@FoodMode;
    END;
    CLOSE groups_cursor;
    DEALLOCATE groups_cursor;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
SELECT @GroupsAdded AS added_groups,@ReservationsAdded AS added_reservations,
       @SeatsAdded AS added_seats,@FoodAdded AS added_food_orders;
GO
