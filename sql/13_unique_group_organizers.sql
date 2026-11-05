/* Оқу мысалдарындағы қайталанған ұйымдастырушыны түзету.
   DEMO-TEAM-20261105-01 тобында №1 клиент бұрыннан қатысушы.
   Топ құрамы, орындар, төлемдер және билеттер өзгермейді.
*/
USE CinemaLabDB;
GO
SET XACT_ABORT ON;
SET NOCOUNT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    UPDATE gb
    SET organizer_customer_id = 1
    FROM dbo.GroupBookings AS gb
    WHERE gb.invite_code = 'DEMO-TEAM-20261105-01'
      AND gb.organizer_customer_id = 34
      AND EXISTS (
          SELECT 1 FROM dbo.Reservations r
          INNER JOIN dbo.ReservationSeats rs ON rs.reservation_id = r.reservation_id
              AND rs.session_id = r.session_id
          WHERE r.group_id = gb.group_id AND r.session_id = gb.session_id
            AND r.customer_id = 1 AND r.reservation_status IN ('held', 'paid')
      );
    IF NOT EXISTS (SELECT 1 FROM dbo.GroupBookings
                   WHERE invite_code = 'DEMO-TEAM-20261105-01' AND organizer_customer_id = 1)
        THROW 51006, N'Топты ұйымдастырушыға тағайындау шарты орындалмады.', 1;
    IF EXISTS (
        SELECT organizer_customer_id FROM dbo.GroupBookings
        WHERE invite_code LIKE 'DEMO-GROUP-%' OR invite_code LIKE 'DEMO-TEAM-20261105-%'
        GROUP BY organizer_customer_id HAVING COUNT(*) > 1
    )
        THROW 51007, N'Оқу топтарында ұйымдастырушы қайталанып тұр.', 1;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
SELECT group_id, organizer_customer_id FROM dbo.GroupBookings
WHERE invite_code = 'DEMO-TEAM-20261105-01';
GO
