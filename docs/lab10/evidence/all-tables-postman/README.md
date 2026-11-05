# Жеті кестелік коллекцияның Postman көрінісі

2026 жылғы 5 қарашада ресми Postman Web интерфейсіне `CinemaLab10_AllTables.postman_collection.json` импортталды. Жергілікті Desktop Agent арқылы екі GET сұранысы Send батырмасымен орындалды:

- [catalog.jpg](catalog.jpg): `/api/tables`, 200; жеті кестенің метадеректері.
- [customers.jpg](customers.jpg): `/api/tables/Customers`, 200; клиенттер тізімі. Сол жақтағы іздеу жеті кестенің «барлық жолдар» сұраныстарын көрсетеді.

[customers-dom.txt](customers-dom.txt) HTTP редакторы мен жауаптың көрінетін бөлігін сақтайды. Бұл скриншоттар қайта салынбаған. Толық 26 сұраныс пен 85 assertion нәтижесі [Newman журналында](../newman-tables-results.json), барлық жолдар мен бағандардың SQL-мен сәйкестігі [салыстыру нәтижесінде](../all-tables-validation.json) сақталған.
