# CINÉMA LAB — Кинотеатрдың ақпараттық жүйесі

## №9 және №10 зертханалық жұмыстар

- [№9: архитектура және берілген түпнұсқа диаграмма](docs/lab9/README.md).
- [№10: REST API, іске қосу, Postman және қорғау нұсқаулығы](docs/lab10/README.md).
- [Дайын PDF есеп](output/pdf/Cinema_Lab10_Report.pdf).
- [Word есебі](output/docx/Cinema_Lab10_Report.docx) · [алты нақты Postman скриншоты](docs/lab10/evidence/postman-web/README.md) · [қорғауда көрсету реті](docs/lab10/POSTMAN_DEMO.md).
- [Жеті кестені толық шығару және сүзу](docs/lab10/ALL_TABLES.md) · [барлық кестелердің Postman коллекциясы](postman/CinemaLab10_AllTables.postman_collection.json).
- [Postman коллекциясы](postman/CinemaLab10.postman_collection.json) · [OpenAPI](docs/lab10/openapi.json).

№10 жұмыста **Movies** ресурсына GET / POST / PUT / DELETE толық CRUD қосылды.
`npm ci` -> `.env.example` файлын `.env` ретінде баптау -> `npm start`.
Каталогты басқару беті: <http://127.0.0.1:3000/catalog.html>.
Тексеру: `npm test`, сервер іске қосылғанда `npm run test:postman`.
Windows Authentication және SQL Authentication баптаулары №10 нұсқаулығында көрсетілген.

## Деректер

- 9 жанр, 24 фильм, 4 зал (әрқайсысы 60 орын)
- 560 сеанс: 2026-10-16 — 2026-11-12 аралығында, күн сайын `10:00`, `12:40`, `15:20`, `18:00`, `20:40`
- 60 клиент, 180 тест билет, 12 мәзір тауары
- Ойдан құрастырылған **оқу деректері**, нақты кинотеатр немесе ақша төлемі емес

## 1. SQL Server / SSMS

1. `sql/01_create_database.sql` — деректер қорын және кестелерді құру (бір рет қана).
2. `sql/02_insert_data.sql` — бастапқы деректерді енгізу (бір рет қана).
3. `sql/05_check.sql` — нәтижені тексеру (қайта орындауға болады).
4. `sql/03_lab6_insert_update_delete.sql` — №6 практикалық жұмыс (қайта орындауға болады; алдымен деректен тексеріңіз).
5. `sql/04_lab7_select_sort_group.sql` — №7 сұраныстар (көп рет орындауға болады).



## 2. Жоба қалай жұмыс істейді?

`public/app.js` -> `GET /api/sessions` -> `server/index.js` -> SQL Server-ге `SELECT ... WHERE ... ORDER BY ...` -> нәтиже браузерде көрінеді. SQL-дағы сорт `server/filters.js` ішіндегі рұқсат етілген нұсқалармен таңдалады. Брондау демосы `Tickets` кестесіне жаңа жол жазады; `UNIQUE(session_id,seat_number)` екі адамға бір орынды сатуға мүмкіндік бермейді.

## 3. GitHub зертханасы

`docs/github_lab5.md` ішіндегі **қадамдарды бір-бірлеп** орындаңыз: 3 commit, branch, Pull Request, merge және 3 Issue. Бос repository ретінде `Syrym1234/cinema-information-system1` алынған.
