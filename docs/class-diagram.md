# Қарапайым Class Diagram / ER байланысы

Бұл сызбада №6 ЗЖ-дағы кесте және PK/FK байланыстары көрсетіледі.

```mermaid
erDiagram
    GENRES ||--o{ MOVIES : "genre_id"
    MOVIES ||--o{ SESSIONS : "movie_id"
    HALLS ||--o{ SESSIONS : "hall_id"
    SESSIONS ||--o{ TICKETS : "session_id"
    CUSTOMERS ||--o{ TICKETS : "customer_id"
    GENRES {
      int genre_id PK
      text genre_name
    }
    MOVIES {
      int movie_id PK
      int genre_id FK
      text title
      decimal rating
    }
    HALLS {
      int hall_id PK
      text hall_name
      int capacity
    }
    SESSIONS {
      int session_id PK
      int movie_id FK
      int hall_id FK
      datetime start_at
      decimal price
    }
    CUSTOMERS {
      int customer_id PK
      text full_name
      text email
    }
    TICKETS {
      int ticket_id PK
      int session_id FK
      int customer_id FK
      int seat_number
      decimal price
    }
    MENUITEMS {
      int menu_item_id PK
      text item_name
      decimal price
    }
```

`MenuItems` — тәуелсіз мәзір кестесі; қазіргі оқу нұсқасында тағамға тапсырыс функционалы жоқ.
