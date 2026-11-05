# №10 жұмыстың қосымша HTTP және интерфейс дәлелдері

Бұл бумада бұрын түсірілген 19 қосымша сурет сақталған. Соңғы 10 беттік PDF және DOCX есебіндегі алты негізгі сурет ресми Postman Web-тен алынды және [postman-web](../postman-web/README.md) бумасында орналасқан.

| Файл | Мазмұны |
|---|---|
| 01-health.png | Нақты SQL Server байланысы, GET /api/health |
| 02-create-201.png | POST /api/movies, 201 Created |
| 03-read-200.png | GET /api/movies/:id, 200 OK |
| 04-update-200.png | PUT /api/movies/:id, 200 OK |
| 05-delete-200.png | DELETE /api/movies/:id, 200 OK |
| 06-not-found-404.png | Жойылған фильмді оқу, 404 |
| 07-validation-400.png | rating=10.5 валидациясы, 400 |
| 08-conflict-409.png | Сеансы бар фильмді жоюдан қорғау, 409 |
| 09-catalog.png | Нақты каталог интерфейсі |
| 10-ui-created.png | Форма арқылы қосылған фильм |
| 11-ui-edit.png | Өзгерту формасы |
| 12-ui-delete-dialog.png | Жоюды растау терезесінің толық көрінісі |
| 13-ui-protected.png | Интерфейстегі FK қате хабарламасы |
| 14-mobile.png | 390 × 844 мобильді көрініс |
| 15-statistics.png | Қолданбаның нақты статистика бөлімі |
| 16-newman-summary.png | Сақталған Newman JSON нәтижелерінің көрнекі шолуы |
| 17-delete-dialog-detail.png | Браузердегі жою терезесінің жеке скриншоты |
| 18-sql-before.png | Тікелей SQL SELECT бастапқы рейтинг 8.5 мәнін растады |
| 19-sql-after.png | Тікелей SQL SELECT жаңартылған рейтинг 9.1 мәнін растады |

01-08 суреттері - нақты API-ге fetch жіберетін, есепке арналған HTTP тест клиентінің скриншоттары. Бұл Postman қолданбасының терезесі емес. 09-15 және 17 - нақты веб-қолданбадан алынған. 16 - өзгертілмеген Newman орындалу журналындағы мәндердің көрнекі көрсетілімі; ол да Postman терезесі деп белгіленбейді.

18 және 19 - mssql драйверінің ConnectionPool қосылымы арқылы деректер қорына тікелей орындалған SELECT нәтижесінің көрінісі; бұл SSMS қолданбасының терезесі емес. `capture-manifest.json` нақты сұраныстарды, body, статус, жауап, SQL query/параметр/жол мәндерін, түсіру уақытын және уақытша фильмдердің тазаланғанын сақтайды. Postman коллекциясының толық нәтижесі бір деңгей жоғарыдағы `newman-results.json` файлында бар.

Қайта түсіру: сервер іске қосылғанда `node tools/capture_report_screenshots.cjs`. Playwright пакеті қажет (`PLAYWRIGHT_MODULE` арқылы орнын көрсетуге болады). Word қайта құру: `python tools/build_lab10_report.py --reference <сақталған үлгінің жолы>` (lxml және Pillow қажет). PDF экспорттау: Microsoft Word бар Windows-та `powershell -File tools/export_lab10_pdf.ps1`. Бастапқы үлгі өзгертілмейді және жеке деректері бар түпнұсқа GitHub-қа қосылмайды.
