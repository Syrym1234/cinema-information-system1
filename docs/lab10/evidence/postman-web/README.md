# Postman Web арқылы орындалған алты тексеру

Есептің негізгі скриншоттары ресми **Postman Web** интерфейсінен алынды. Әр сұраныс **Send** арқылы орындалды; жергілікті `http://127.0.0.1:3000` серверіне **Postman Desktop Agent 0.5.2** қосылды. Суреттерде нақты HTTP әдісі, endpoint, статус және JSON жауаптары көрсетілген.

| Сурет | Әдіс және endpoint | Жауап |
|---|---|---|
| [01-get-all.jpg](01-get-all.jpg) | GET `/api/movies` | 200, 24 фильм |
| [02-get-one.jpg](02-get-one.jpg) | GET `/api/movies/6` | 200, бір фильм |
| [03-post.jpg](03-post.jpg) | POST `/api/movies` | 201, жаңа ID=39, рейтинг 8.5 |
| [04-put.jpg](04-put.jpg) | PUT `/api/movies/39` | 200, жаңартылған рейтинг 9.1 |
| [05-delete.jpg](05-delete.jpg) | DELETE `/api/movies/39` | 200, уақытша фильм жойылды |
| [06-get-404.jpg](06-get-404.jpg) | GET `/api/movies/39` | 404, MOVIE_NOT_FOUND |

Сәйкес JSON файлдары Postman-ның **Copy response** пәрменінен немесе жауап редакторының оқуға арналған мәтінінен сақталды. `*-dom.txt` файлдары HTTP редакторы мен жауап бөлігінің мәтіндік дәлелін сақтайды. Скриншоттардың мазмұны қайта салынбаған және ауыстырылмаған. Word ішіне енгізгенде JPEG тек PNG форматына түрлендірілді.

Тәуелсіз SQL Server тексерулері:

- [sql-before.json](sql-before.json): ID=39, рейтинг 8.5.
- [sql-after.json](sql-after.json): сол ID, жаңа атау және рейтинг 9.1.
- [sql-cleanup.json](sql-cleanup.json): ID=39 жоқ; бастапқы 24 фильм сақталған.

[capture-manifest.json](capture-manifest.json) клиентті, агентті, endpoint пен статус ретін және алты JPEG файлының SHA-256 хэшін тіркейді. Нақты көрсетілім 2026 жылғы 4–5 қарашада орындалды. Бұл JSON дәлелдері SSMS терезесінің скриншоты ретінде белгіленбейді.

Жұмысты қайталау: [Postman нұсқаулығы](../../POSTMAN_DEMO.md). [Desktop Agent ресми жүктеу беті](https://www.postman.com/downloads/postman-agent/).
