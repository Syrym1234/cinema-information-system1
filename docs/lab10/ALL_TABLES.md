# Жеті кестені Postman арқылы көрсету

Сервер: `npm start`. Postman-да `CinemaLab10_AllTables.postman_collection.json` файлын **Import** арқылы ашыңыз. Барлық кестені оқу үшін **GET** әдісі қолданылады.

Алдымен `http://127.0.0.1:3000/api/tables` сұранысын жіберіңіз. Ол жеті кестенің атауын, бағандарын, бастапқы кілтін, жолдар санын және адресін шығарады.

| Кесте | Тексерілген жолдар саны | Толық URL |
|---|---:|---|
| Genres | 9 | `http://127.0.0.1:3000/api/tables/Genres` |
| Movies | 24 | `http://127.0.0.1:3000/api/tables/Movies` |
| Halls | 4 | `http://127.0.0.1:3000/api/tables/Halls` |
| Sessions | 560 | `http://127.0.0.1:3000/api/tables/Sessions` |
| Customers | 60 | `http://127.0.0.1:3000/api/tables/Customers` |
| Tickets | 180 | `http://127.0.0.1:3000/api/tables/Tickets` |
| MenuItems | 12 | `http://127.0.0.1:3000/api/tables/MenuItems` |

Бұл адрестер сұранысқа `limit` берілмесе, кестенің **барлық жолдары мен барлық бағандарын** қайтарады. Кесте атауының әріп регистрі маңызды емес. Жолдар бастапқы кілт бойынша өсу ретімен шығады.

Апай «ID=1 жазбасын шығар» десе, соңына `/1` қосыңыз. Мысалы:

```text
GET http://127.0.0.1:3000/api/tables/Customers/1
GET http://127.0.0.1:3000/api/tables/Tickets/1
```

## Апай қосымша шарт сұрағанда

| Тапсырма | GET адресі, сервер адресінен кейінгі бөлігі |
|---|---|
| Рейтингі 8 немесе жоғары фильмдер | `/api/tables/Movies?min_rating=8` |
| Рейтинг бойынша кему реті | `/api/tables/Movies?sort=rating&order=desc` |
| Рейтингі 8–9 аралығындағы фильмдер | `/api/tables/Movies?min_rating=8&max_rating=9` |
| Жанрының ID=3 фильмдері | `/api/tables/Movies?genre_id=3` |
| Атауынан не сипаттамасынан іздеу | `/api/tables/Movies?search=Уақыт` |
| Аты-жөні не email бойынша клиент іздеу | `/api/tables/Customers?search=Ай` |
| ID=1 фильмінің барлық сеанстары | `/api/tables/Sessions?movie_id=1` |
| ID=2 залындағы барлық сеанстар | `/api/tables/Sessions?hall_id=2` |
| ID=1 клиентінің билеттері | `/api/tables/Tickets?customer_id=1` |
| ID=1 сеансының билеттері | `/api/tables/Tickets?session_id=1` |
| Мәзірдегі ең қымбат 3 тауар | `/api/tables/MenuItems?sort=price&order=desc&limit=3` |
| Бағасы 500–2000 арасындағы мәзір | `/api/tables/MenuItems?min_price=500&max_price=2000` |

Шарттарды `&` арқылы біріктіруге болады. Мысалы:

```text
GET http://127.0.0.1:3000/api/tables/Movies?genre_id=3&min_rating=8&sort=rating&order=desc
```

Postman-ның **Params** бөлімінде әр параметрді жеке жолға да енгізуге болады: `genre_id` → `3`, `min_rating` → `8`, `sort` → `rating`, `order` → `desc`.

`search` мәтіндік бағандардан іздейді. `sort` осы кестеде бар бағанды қабылдайды; `order` — `asc` немесе `desc`. `limit` қажет болса 1–1000 аралығында беріледі. Белгісіз параметрлер мен қате мәндер 400 қайтарады. Жоқ кесте немесе жоқ жазба 404 қайтарады.

## Фильмді қосу, жаңарту және жою

Бұл жеті кестелік бөлім деректерді қарауға арналған. Фильмді қосу, өзгерту және жою бұрынғы `/api/movies` CRUD маршруттары арқылы орындалады. [Алты сұраныстық көрсетілім](POSTMAN_DEMO.md) сақталған. `/api/sessions` афишаға арналған, 150 жоспарланған сеанспен шектеледі; **барлық 560 сеанс** үшін `/api/tables/Sessions` қолданылады.

Тексеру: `npm run test:tables` — 26 сұраныс және 85 assertion. `node tools/verify_table_api.cjs` API-дегі әрбір жол мен бағанды SQL Server нәтижесімен салыстырады. Тексерулер деректерді өзгертпейді.
