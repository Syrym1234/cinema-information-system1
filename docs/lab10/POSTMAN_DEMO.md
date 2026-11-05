# Апайға Postman арқылы көрсету реті

## Қандай бағдарламалар қолданылады

- **Visual Studio Code**: `server/index.js`, `server/movies.js`, `server/db.js` кодын ашу.
- **Node.js және Express**: HTTP API серверін іске қосу.
- **Microsoft SQL Server**: `CinemaSchoolDB` деректерін сақтау.
- **Postman Web және Desktop Agent 0.5.2**: осы есептегі нақты GET, POST, PUT, DELETE сұраныстары орындалған орта. Postman Desktop-та да осы коллекцияны ашуға болады; Desktop қолданбасына бөлек Agent қажет емес.
- **SQL Server Management Studio**: SQL SELECT нәтижесін көрсету.

## Postman-да алты негізгі сұраныс

Алдымен жобаның түбіріндегі терминалда `npm start` орындаңыз. Postman ішіндегі Import арқылы `postman/CinemaLab10_Demo.postman_collection.json` файлын ашыңыз. `baseUrl` айнымалысы `http://127.0.0.1:3000` болуы тиіс.

Postman Web қолдансаңыз, төменгі панельде **Desktop Agent** таңдалып, ресми агент іске қосылған болуы керек. Cloud Agent жергілікті `127.0.0.1` адресіне қосыла алмайды. Desktop-та коллекцияны импорттау жеткілікті.

| Реті | Әдіс және адрес | Күтілетін нәтиже |
|---|---|---|
| 01 | GET `/api/movies` | 200 OK, барлық фильмдер |
| 02 | GET `/api/movies/{{existingMovieId}}` | 200 OK, нақты фильм |
| 03 | POST `/api/movies` | 201 Created, жаңа фильм және Location |
| 04 | PUT `/api/movies/{{movieId}}` | 200 OK, жаңартылған рейтинг 9.1 |
| 05 | DELETE `/api/movies/{{movieId}}` | 200 OK, тест фильмі жойылды |
| 06 | GET `/api/movies/{{movieId}}` | 404 Not Found, фильм табылмады |

Сұраныстарды 01–06 ретімен **Send** батырмасы арқылы орындаңыз. Бірінші GET жанрды және бастапқы фильм ID мәнін алады. POST жаңа `movieId` мәнін сақтайды. PUT және DELETE бастапқы фильмдерді емес, осы уақытша фильмді қолданады.

POST және PUT бөлімдерінде Body → raw → JSON таңдалады. Дайын JSON коллекцияда бар. Мысалы, рейтинг сан ретінде `8.5`, кейін `9.1` болып жіберіледі. Оны `"8.5"` мәтінімен алмастырмаңыз.

## SQL Server-де сақтау нәтижесін көрсету

Postman-дағы POST жауабынан `movie_id` мәнін алып, SSMS-та төмендегі `@MovieId` мәніне қойыңыз. Жаңартуға дейін және PUT-тен кейін сол SELECT сұранысын орындаңыз:

```sql
USE CinemaSchoolDB;
DECLARE @MovieId INT = 1; -- POST қайтарған ID мәнімен ауыстырыңыз
SELECT movie_id, title, genre_id, duration_min,
       age_rating, release_year, rating
FROM dbo.Movies
WHERE movie_id = @MovieId;
```

DELETE орындалғаннан кейін осы SELECT нөл жол қайтаруы керек.

Дайын есептегі тексеруде `existingMovieId=6`, `movieId=39` болды. ID=39 қазір жойылған; көрсетілімді қайталағанда POST жаңа ID береді. Ескі 39 мәнін қолмен енгізбеңіз. Тесттен кейін каталогта бастапқы 24 фильм сақталды.

## Апай сұрағанда түсіндіру

«Мен кинотеатрдың Movies ресурсына REST API жасадым. Node.js серверді жүргізеді, Express маршруттарды өңдейді, mssql SQL Server-ге қосылады. GET оқиды, POST қосады, PUT жаңартады, DELETE жояды. Postman клиент ретінде HTTP сұранысын жібереді. Дерек JSON форматында беріледі. Нәтиже SQL Server-де сақталады.»

«Код Visual Studio Code-та жазылды. Есептегі алты сұраныс ресми Postman Web-те, Desktop Agent арқылы орындалды. SQL Server деректерді сақтайды. SSMS деректер қорын қарауға арналған. Postman — API тексеру құралы, кинотеатрдың веб-интерфейсі бөлек.»

«201 жаңа ресурс құрылғанын, 200 сұраныс сәтті орындалғанын, 404 ресурс табылмағанын көрсетеді. SQL мәндері `.input(...)` арқылы параметрленген. Сеансы бар фильмді жою 409 Conflict жауабымен тоқтатылады.»
