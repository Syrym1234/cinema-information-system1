/* Оқытушы талабы: №1 топта бес клиентке бір орыннан, барлығы бес орын.
   CinemaLabDB оқу деректеріндегі артық екінші орын және оның демо билеті алынады.
   №34 клиенттің демо төлемі қалған орынның бағасына сәйкестендіріледі.
   Жеке сақтық көшірме жасалғаннан кейін қолданылған қызметтік түзету.
*/
USE CinemaLabDB;
GO
SET XACT_ABORT ON;
SET NOCOUNT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    IF EXISTS (SELECT 1 FROM dbo.ReservationSeats WHERE reservation_seat_id = 57)
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM dbo.ReservationSeats AS rs
            JOIN dbo.Reservations AS r ON r.reservation_id = rs.reservation_id
            WHERE rs.reservation_seat_id = 57 AND rs.seat_id = 62
              AND rs.session_id = 49 AND rs.seat_price = 2600
              AND r.reservation_id = 'B88394F4-797F-4528-8D54-0369BAA2AAE1'
              AND r.customer_id = 34 AND r.group_id = 1 AND r.reservation_status = 'paid'
        )
            THROW 51008, N'Түзетілетін орын күтілген оқу дерегіне сәйкес емес.', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.Payments WHERE payment_id = 30
                       AND reservation_id = 'B88394F4-797F-4528-8D54-0369BAA2AAE1'
                       AND payment_status = 'demo_paid' AND amount = 5200)
            THROW 51009, N'Демо төлемнің бастапқы сомасы сәйкес емес.', 1;

        DELETE FROM dbo.Tickets
        WHERE reservation_seat_id = 57
          AND ticket_id = 'FE43BFFC-B5A6-4AC1-919F-294AF9F401D6'
          AND ticket_status = 'valid';
        IF @@ROWCOUNT <> 1 THROW 51010, N'Артық орынның демо билеті табылмады.', 1;
        DELETE FROM dbo.ReservationSeats WHERE reservation_seat_id = 57;

        UPDATE dbo.Payments
        SET amount = (SELECT SUM(seat_price) FROM dbo.ReservationSeats
                      WHERE reservation_id = 'B88394F4-797F-4528-8D54-0369BAA2AAE1')
        WHERE payment_id = 30;
    END;

    IF (SELECT COUNT(*) FROM dbo.Reservations r JOIN dbo.ReservationSeats rs
        ON rs.reservation_id = r.reservation_id AND rs.session_id = r.session_id
        WHERE r.group_id = 1 AND r.reservation_status IN ('held', 'paid')) <> 5
        THROW 51011, N'Бірінші топта дәл бес орын болуы керек.', 1;
    IF (SELECT COUNT(DISTINCT r.customer_id) FROM dbo.Reservations r JOIN dbo.ReservationSeats rs
        ON rs.reservation_id = r.reservation_id AND rs.session_id = r.session_id
        WHERE r.group_id = 1 AND r.reservation_status IN ('held', 'paid')) <> 5
        THROW 51012, N'Бірінші топта дәл бес клиент болуы керек.', 1;
    IF EXISTS (SELECT r.customer_id FROM dbo.Reservations r JOIN dbo.ReservationSeats rs
        ON rs.reservation_id = r.reservation_id AND rs.session_id = r.session_id
        WHERE r.group_id = 1 AND r.reservation_status IN ('held', 'paid')
        GROUP BY r.customer_id HAVING COUNT(*) <> 1)
        THROW 51013, N'Әр клиентке бір орыннан болуы керек.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Payments WHERE payment_id = 30 AND amount = 2600)
        THROW 51014, N'Бір орынның демо төлемі 2600 болуы керек.', 1;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
