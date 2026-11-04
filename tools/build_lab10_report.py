"""Build the Kazakh submission report from code and real verification evidence.
Requires reportlab and Pillow. Run from any working directory.
"""
import json
from html import escape
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, Preformatted, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf/Cinema_Lab10_Report.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
FONT = Path('C:/Windows/Fonts')
for name, filename in [('Arial','arial.ttf'),('Arial-Bold','arialbd.ttf'),('Mono','consola.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(FONT/filename)))
pdfmetrics.registerFontFamily('Arial',normal='Arial',bold='Arial-Bold',italic='Arial',boldItalic='Arial-Bold')
INK = colors.HexColor('#182d42')
MUTED = colors.HexColor('#536579')
GOLD = colors.HexColor('#b78021')
styles = {
    'kicker':ParagraphStyle('Kicker',fontName='Arial-Bold',fontSize=10,leading=15,textColor=GOLD,spaceAfter=12),
    'title':ParagraphStyle('Title',fontName='Arial-Bold',fontSize=31,leading=38,textColor=INK,spaceAfter=21),
    'h1':ParagraphStyle('Heading',fontName='Arial-Bold',fontSize=22,leading=28,textColor=INK,spaceAfter=19),
    'h2':ParagraphStyle('Subheading',fontName='Arial-Bold',fontSize=12,leading=17,textColor=INK,spaceBefore=12,spaceAfter=7),
    'body':ParagraphStyle('Body',fontName='Arial',fontSize=10.2,leading=15.2,textColor=INK,spaceAfter=10),
    'small':ParagraphStyle('Small',fontName='Arial',fontSize=8.5,leading=12.3,textColor=MUTED,spaceAfter=7),
    'cell':ParagraphStyle('Cell',fontName='Arial',fontSize=8.7,leading=12.4,textColor=INK),
    'th':ParagraphStyle('TH',fontName='Arial-Bold',fontSize=8.7,leading=12.4,textColor=colors.white),
    'code':ParagraphStyle('Code',fontName='Mono',fontSize=8.4,leading=11.8,textColor=INK,leftIndent=11,rightIndent=8,
                          borderPadding=10,backColor=colors.HexColor('#f0f4f8'),spaceBefore=5,spaceAfter=12),
}
story, md = [], []
def sample(text):
    return (text.replace('/api/movies/25',f'/api/movies/{sample_id}')
            .replace('"movie_id":25',f'"movie_id":{sample_id}')
            .replace('25 - сақталған тесттің ID мысалы',f'{sample_id} - сақталған тесттің ID мысалы'))
def p(text, style='body'):
    text = sample(text)
    story.append(Paragraph(escape(text).replace('\n','<br/>'),styles[style])); md.append(text+'\n')
def h2(text): p(text,'h2')
def page(number,title):
    if story: story.append(PageBreak())
    p(f'CINÉMA LAB  /  {number:02d}','kicker'); p(title,'h1'); md.append('---\n')
def code(text):
    text = sample(text)
    story.append(Preformatted(text,styles['code']));md.append('```\n'+text+'\n```\n')
def table(headers, rows, widths, compact=False):
    data = [[Paragraph(escape(str(x)),styles['th']) for x in headers]]
    data += [[Paragraph(escape(str(x)),styles['cell']) for x in row] for row in rows]
    t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),INK),('VALIGN',(0,0),(-1,-1),'TOP'),
        ('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),
        ('TOPPADDING',(0,0),(-1,-1),3.4 if compact else 6),('BOTTOMPADDING',(0,0),(-1,-1),3.4 if compact else 6),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#f0f4f8'),colors.white]),
        ('LINEBELOW',(0,0),(-1,0),0.7,INK),('LINEBELOW',(0,1),(-1,-1),0.35,colors.HexColor('#dbe3eb'))]))
    story.append(t);story.append(Spacer(1,10))
    md.append('| '+' | '.join(headers)+' |\n| '+' | '.join('---' for _ in headers)+' |\n'+'\n'.join('| '+' | '.join(map(str,row))+' |' for row in rows)+'\n')
def img(path,width=None,height=None):
    from PIL import Image as PILImage
    full=ROOT/path
    with PILImage.open(full) as im: w,h=im.size
    if width is None: width=height*w/h
    if height is None: height=width*h/w
    story.append(Image(str(full),width=width,height=height,hAlign='CENTER'));story.append(Spacer(1,9))
    md.append(f'![{Path(path).stem}]({Path(path).name})\n')
def link(label,url):
    story.append(Paragraph(f'<link href="{escape(url,quote=True)}" color="#285d91">{escape(label)}</link>',styles['small']))
    md.append(f'[{label}]({url})\n')

newman=json.loads((ROOT/'docs/lab10/evidence/newman-results.json').read_text(encoding='utf-8-sig'))
stats=newman['run']['stats']
assert stats['requests']['total']==25 and stats['assertions']['total']==94
assert stats['assertions']['failed']==0 and not newman['run']['failures']
sample_id = json.loads(bytes(newman['run']['executions'][4]['response']['stream']['data']))['movie_id']
browser=json.loads((ROOT/'docs/lab10/evidence/browser-results.json').read_text())
assert browser['passed']==11 and browser['failed']==0

# 1. Cover
p('ЗЕРТХАНАЛЫҚ ЖҰМЫС №10','kicker')
story.append(Spacer(1,27))
p('Ақпараттық жүйе\nкомпоненттерінің\nHTTP REST API арқылы\nөзара әрекеттесуі','title')
p('Cinema Information System','h2')
p('Фильмдер каталогына арналған толық CRUD API, SQL Server байланысы және Postman тестілеуі. №9 жұмыстың архитектурасы жобаға қосылды.')
story.append(Spacer(1,27))
table(['Жоба','Тапсыру деректері'],[
    ['Орындаушы','Syrym / GitHub: Syrym1234'],['Пәндік сала','Кинотеатрдың ақпараттық жүйесі'],
    ['Технологиялар','Node.js · Express · Microsoft SQL Server'],['Нұсқа / күні','1.1.0 / 04.11.2026'],
    ['Негізгі ресурс','/api/movies'],['Тексеру','25 HTTP сұранысы · 94 assertion · 0 қате']], [160,339])
story.append(Spacer(1,19))
p('Дайын нәтиже','h2')
p('Жұмыс істейтін API және каталогты басқару беті; импортталатын Postman коллекциясы; OpenAPI спецификациясы; нақты тест журналдары; архитектура мен тоғыз бақылау сұрағының жауаптары.')
link('GitHub репозиторийі','https://github.com/Syrym1234/cinema-information-system1')

# 2. Task alignment
page(1,'Мақсат және талаптардың орындалуы')
p('Мақсат: клиент, сервер және деректер қоры арасындағы HTTP REST API алмасуын іске асырып, қосу, оқу, өзгерту және жою операцияларын нақты деректер қорында тексеру.')
p('Негіз: пайдаланушы ұсынған 10-Lab.pdf нұсқаулығы. Ондағы кітапхана және MySQL - түсіндіруші мысал. Осы жұмыста API әдістері кинотеатрдың Movies ресурсына бейімделді. Бұрынғы CinemaSchoolDB, SQL Server және mssql драйвері сақталды; кітапхана жобасы бөлек жасалмайды.')
table(['Нұсқаулық талабы','Жобадағы орындалуы'],[
    ['Node.js + Express сервері','server/index.js: HTTP сервері, JSON middleware, маршруттар'],
    ['Деректер қорымен байланыс','server/db.js: ConnectionPool, SQL/Windows Authentication'],
    ['Барлық жазбаларды алу','GET /api/movies -> 200, массив'],
    ['ID бойынша жазбаны алу','GET /api/movies/:id -> 200 немесе 404'],
    ['Жаңа жазба қосу','POST /api/movies -> 201 + Location'],
    ['Жазбаны өзгерту','PUT /api/movies/:id -> 200, толық жаңарту'],
    ['Жазбаны жою','DELETE /api/movies/:id -> 200; FK байланысына 409'],
    ['Postman тестілеуі','25 сұраныс, 94 assertion; нақты Newman журналы'],
    ['Табылмаған ID','GET /api/movies/2147483647 -> 404'],
    ['Бақылау сұрақтары','Есептің 10-11-беттерінде 9 толық жауап']], [173,326])
h2('№9 және №10 сабақтастығы')
p('№9 жұмыстағы интерфейс -> қолданбалы логика -> деректер қоры байланысы №10 жұмыста нақты HTTP сұраныстарымен көрсетілді. DAL қолданбалы деңгейдің құрамында орналасады. Жергілікті сервер HTTP қолданады; HTTPS қосылды деген мәлімдеме жасалмайды.')

# 3. Architecture
page(2,'Үш деңгейлі архитектура')
img('docs/lab9/architecture-current.png',height=525)
p('1-сурет. Қазіргі кодқа сәйкес архитектура. Параметрлер серверде тексеріледі; SQL нәтижесі клиентке HTTP статусы және JSON ретінде қайтарылады. DAL бөлек төртінші деңгей емес.','small')
p('Түпнұсқа №9 диаграммасы docs/lab9/ ішінде сақталған. Ондағы CinemaLabDB, төлем, QR және тағам тапсырысы - кеңейтілген мақсатты модель; осы нұсқаның жұмыс істейтін мүмкіндіктеріне қосып есептелмейді.','small')

# 4. Model and code
page(3,'Деректер моделі және іске асыру')
p('Деректер қоры: CinemaSchoolDB. Жеті пәндік кесте: Genres, Movies, Halls, Sessions, Customers, Tickets, MenuItems. Негізгі байланыстар: Genres 1:N Movies; Movies 1:N Sessions; Halls 1:N Sessions; Sessions 1:N Tickets; Customers 1:N Tickets.')
table(['Movies өрісі','SQL түрі','API тексеруі'],[
    ['movie_id','INT IDENTITY / PK','Сервер жасайды; ID: 1..2147483647'],
    ['title','NVARCHAR(150)','Бос емес жол; trim; ең көбі 150 таңба'],
    ['genre_id','INT / FK -> Genres','JSON бүтін саны; базада бар жанр'],
    ['duration_min','INT','1..600 бүтін саны'],['age_rating','INT','0, 6, 12, 16, 18 немесе 21'],
    ['release_year','INT','1888..2100 бүтін саны'],['rating','DECIMAL(3,1)','0..10; ең көбі бір ондық таңба'],
    ['description','NVARCHAR(400)','Бос емес жол; trim; ең көбі 400 таңба']], [110,145,244])
h2('Кодтың жауапкершіліктері')
table(['Файл','Міндеті'],[
    ['server/index.js','Express баптауы, бұрынғы маршруттар, JSON қателері, серверді жабу'],
    ['server/db.js','ConnectionPool, .env конфигурациясы, қосылымды жабу'],
    ['server/movies.js','CRUD маршруттары және SQL параметрлері'],
    ['server/validation.js','ID, өрістер, типтер мен диапазондар'],
    ['public/catalog.*','Каталог интерфейсі және fetch сұраныстары']], [160,339])
p('Жою ережесі: фильмге сеанс байланысқан болса, SQL Server FK шектеуі жоюды тоқтатады. API 409 MOVIE_HAS_SESSIONS қайтарады. Бар сеанстар мен билеттер автоматты өшірілмейді.')

# 5. Read create
page(4,'REST келісімі: оқу және қосу')
table(['Әдіс','Endpoint','Сәтті жауап'],[
    ['GET','/api/movies','200 / JSON массив'],['GET','/api/movies/:id','200 / фильм + genre_name'],
    ['POST','/api/movies','201 / фильм + Location'],['PUT','/api/movies/:id','200 / жаңартылған фильм'],
    ['DELETE','/api/movies/:id','200 / message + movie_id']], [65,230,204])
h2('GET - барлық фильм және ID бойынша фильм')
code('GET http://127.0.0.1:3000/api/movies\nGET http://127.0.0.1:3000/api/movies/25')
p('Тізім рейтинг кемуі, атау және movie_id бойынша сұрыпталады. ID нәтижеде болмаса, 404 MOVIE_NOT_FOUND қайтарылады. 25 - сақталған тесттің ID мысалы; басқа іске қосуда ID өзгереді.')
h2('POST - жаңа фильм')
code('POST /api/movies\nContent-Type: application/json\n\n{\n  "title": "Lab10 | Қазақша фильм",\n  "genre_id": 6,\n  "duration_min": 110,\n  "age_rating": 12,\n  "release_year": 2026,\n  "rating": 8.5,\n  "description": "REST API арқылы қосылған оқу фильмі."\n}')
p('Жауап: 201 Created; Location: /api/movies/25. JSON ішінде movie_id және сақталған жеті өріс бар. Жанр ID /api/metadata нәтижесінен алынады; мысалдағы 6 мәнін өз базаңыздың мәнімен ауыстырыңыз.')
p('Қазақша мәтін NVARCHAR параметрімен беріледі. movie_id клиенттен қабылданбайды. POST және PUT белгісіз өрістерді қабылдамайды; мәтіндік санның орнына JSON санын жіберу қажет.','small')

# 6. Update/delete/errors
page(5,'REST келісімі: өзгерту, жою және қателер')
h2('PUT - барлық жазылатын өрісті ауыстыру')
code('PUT /api/movies/{{movieId}}\nContent-Type: application/json\n\n{\n  "title": "Lab10 | Жаңартылған фильм",\n  "genre_id": 6,\n  "duration_min": 110,\n  "age_rating": 12,\n  "release_year": 2026,\n  "rating": 9.1,\n  "description": "REST API арқылы қосылған оқу фильмі."\n}')
p('Жауап: 200 OK және жаңартылған объект. Кейінгі GET сұранысы title және rating мәндерінің деректер қорында сақталғанын дәлелдейді. PUT барлық жеті өрісті талап етеді; бұл API-де PATCH іске асырылмаған.')
h2('DELETE - байланысы жоқ фильмді жою')
code('DELETE /api/movies/{{movieId}}\n\n200 OK\n{"message":"Фильм сәтті жойылды","movie_id":25}\n\nGET /api/movies/25\n404 Not Found\n{"error":"Фильм табылмады","code":"MOVIE_NOT_FOUND"}')
table(['Статус','Қай жағдайда'],[
    ['400','Қате ID / JSON / өрістер / базада жоқ жанр'],['404','Фильм немесе API маршруты табылмады'],
    ['405','Қолдау жоқ әдіс; Allow header беріледі'],['409','Фильмге сеанстар байланысқан'],
    ['413 / 415','JSON 16 KB шегінен үлкен / Content-Type қате'],['500 / 503','Ішкі сервер қатесі / деректер қорына қосылу мүмкін емес']], [85,414])
p('SQL мәндері .input(...) арқылы параметрленеді. INSERT пен UPDATE нәтижесі OUTPUT INSERTED.* арқылы, DELETE нәтижесі OUTPUT DELETED.movie_id арқылы алынады. Бұл бөлек кейінгі SELECT сұранысына тәуелділікті жояды.','small')

# 7. Setup/Postman
page(6,'Іске қосу және Postman нұсқаулығы')
h2('1. Тәуелділіктер және база')
code('npm ci\nCopy-Item .env.example .env')
p('Node.js 20+ қажет. Таза база үшін sql/01_create_database.sql, кейін sql/02_insert_data.sql файлдарын SSMS-та бір рет орындаңыз. Бар деректерге қайта seed жасамаңыз. №10 үшін жаңа кесте немесе миграция қажет емес.')
h2('2. Осы компьютерде тексерілген Windows Authentication')
code('DB_AUTH=windows\nDB_SERVER=.\\SQLEXPRESS\nDB_NAME=CinemaSchoolDB\nDB_ENCRYPT=false\nDB_TRUST_CERT=true\nHOST=127.0.0.1\nPORT=3000')
p('Атаулы instance қолданғанда DB_PORT жолын алып тастаңыз. msnodesqlv8 және ODBC Driver 17 қолданылады. SQL Authentication үшін DB_AUTH=sql, DB_USER, DB_PASSWORD, DB_SERVER және DB_PORT баптаңыз. .env құпия файл ретінде Git-ке қосылмайды.')
code('npm start\n# Басқа терминалда:\nnpm test\nnpm run test:postman')
h2('3. Postman desktop-та тексеру')
p('Import арқылы postman/CinemaLab10.postman_collection.json және Local.postman_environment.json файлдарын импорттаңыз. Cinema Local ортасын таңдаңыз. baseUrl = http://127.0.0.1:3000. Run collection пәрменімен бір итерацияны берілген ретпен орындаңыз.')
p('Коллекция жанр ID, қорғалған фильм ID және жаңа movieId мәндерін өзі алады. Соңғы қадамдар өз уақытша фильмін жойып, бастапқы фильм санын тексереді. Каталогты қатар өзгертпей тестілеңіз. Тест үзіліп қалса, тек өзінің Lab10 атаулы тест фильмін тазалаңыз.')
p('CLI дәлелі Newman 6.2.3 арқылы алынды. Ол npx арқылы бөлек іске қосылатын тест құралы; upstream тәуелділік ескертулері болуы мүмкін. Қосымшаның орнатылатын тәуелділіктерінде npm audit нәтижесі - 0 осалдық.','small')

# 8. Actual results
page(7,'Нақты API тест нәтижелері')
p('04.11.2026: SQL Express / CinemaSchoolDB; Postman коллекциясы Newman арқылы орындалды. 25 сұраныс, 94 assertion, 0 failure. HTTP қате статустары - әдейі тексерілген күтілетін нәтижелер.')
rows=[]
labels=['SQL байланысы','Жанрлар','Барлық фильм','Сеанс / FK тесті','Фильм қосу','ID бойынша оқу','Фильмді өзгерту','Сақталған өзгерісті оқу','Бос міндетті өрістер','Қате рейтинг','Жоқ жанр','SQL injection ID','SQL INT overflow','Жоқ фильм','Жоқ фильмді өзгерту','Байланысқан фильмді жою','Бұзылған JSON','Қате Content-Type','16 KB шегінен артық','Қолдау жоқ PATCH','Жоқ маршрут','Өз тест фильмін жою','Жойылған фильмді оқу','Қайталап жою','Бастапқы сан қалпына келді']
for i,(execution,label) in enumerate(zip(newman['run']['executions'],labels),1):
    rows.append([str(i),execution['request']['method'],label,str(execution['response']['code']),'PASS'])
table(['№','Әдіс','Сценарий','HTTP','Нәтиже'],rows,[29,55,295,54,66],compact=True)
p('Қосымша дәлел: 11 unit test және 11 браузер тексеруі өтті. Журналдар: docs/lab10/evidence/newman-results.json, newman-console.txt, unit-tests.txt, browser-results.json. Тест фильмдері тазаланды; бастапқы каталогта 24 фильм қалды.','small')

# 9. Browser evidence
page(8,'Браузердегі жұмыс нәтижесі')
img('docs/lab10/evidence/catalog-desktop.png',width=499)
p('2-сурет. Каталогты басқару: desktop 1440 × 1080. Скриншот нақты жергілікті қолданбадан алынды. Форма деректерді API арқылы SQL Server-ге жібереді.','small')
h2('Тексерілген пайдаланушы әрекеттері')
p('Жаңа фильмді формада қосу -> нақты SQL жолын оқу -> рейтингті 9.4 мәніне өзгерту -> өзгерісті қайта оқу -> растау терезесімен жою -> жойылған ID үшін 404 алу. Сеансы бар фильмді жою әрекеті тиісті хабарламамен тоқтатылды.')
p('Мобильді 390 × 844 өлшемінде көлденең тасу жоқ. Бұрынғы фильмдер беті мен сатылым есебі жүктелді. Тексеру кезінде ұстатылмаған JavaScript қатесі тіркелмеді.')
p('catalog-mobile.png және report-desktop.png қосымша скриншоттары evidence/ бумасында бар. Бұл суреттер Postman терезесінің скриншоты деп көрсетілмейді: олар браузер интерфейсінің нақты дәлелі.','small')

# 10. Questions first half
page(9,'Бақылау сұрақтары: 1-5')
h2('1. API дегеніміз не және не үшін қолданылады?')
p('API (Application Programming Interface) - бағдарламалардың бір-біріне функция немесе дерек ұсыну келісімі. Кинотеатрда браузер /api/movies ресурсына сұраныс жібереді, сервер SQL деректерін JSON ретінде қайтарады. Клиентке SQL қосылымының құпиясөзі қажет емес.')
h2('2. REST API архитектурасының негізгі ерекшеліктері қандай?')
p('Ресурстар URI арқылы анықталады, әрекеттер HTTP әдістерімен беріледі, клиент пен сервер бөлінеді. Stateless қағидасы бойынша әр сұраныс оны өңдеуге қажетті мәліметті өзі қамтиды. Жауапта HTTP статусы және ресурс көрінісі болады. REST үшін GET қауіпсіз, PUT пен DELETE мағыналық жағынан idempotent: қайталау ресурстың соңғы күйін өзгертпейді; жауап статусы өзгеруі мүмкін.')
h2('3. HTTP протоколы API жұмысына қалай қатысады?')
p('HTTP сұраныс әдісін, URL-ін, header мен body құрылымын және жауап статусын анықтайды. Мысалы, POST + Content-Type: application/json фильм деректерін жібереді, сервер 201 Created қайтарады. 400 кіріс қатесін, 404 жоқ ресурсты, 409 деректер байланысының қайшылығын көрсетеді. HTTPS HTTP хабарларын TLS арқылы шифрлайды; осы жергілікті оқу нұсқасы HTTP қолданады.')
h2('4. CRUD операцияларының мағынасы қандай?')
p('Create - жаңа жазба құру; Read - жазбаларды оқу; Update - жазбаны жаңарту; Delete - жазбаны жою. Бұл жобада сәйкестік: POST -> INSERT, GET -> SELECT, PUT -> UPDATE, DELETE -> DELETE. Операциялар браузердегі массивпен ғана шектелмей, SQL Server кестесінде орындалады.')
h2('5. GET және POST әдістерінің айырмашылығы қандай?')
p('GET ресурсты оқиды және сервердің пәндік күйін өзгертпеуі тиіс; фильтрлер query параметрлерімен берілуі мүмкін. POST жаңа ресурс құрады, оның деректері body ішінде жіберіледі. POST-ты қайталау бірнеше жаңа жазба құруы мүмкін. Осы API-де GET 200, сәтті POST 201 және жаңа ресурсқа Location header қайтарады.')

# 11. Questions and limits
page(10,'Бақылау сұрақтары: 6-9')
h2('6. PUT және DELETE не үшін қолданылады?')
p('PUT көрсетілген URI-дегі ресурстың жазылатын деректерін толық ауыстырады; осы жобада жеті өріс міндетті. DELETE ресурсты жояды. Біздің API-де жоқ ID 404, ал сеансқа байланысқан фильм 409 қайтарады. Бір фильмді қайталап жою бастапқы жоюдан кейін 404 береді, бірақ соңғы күйі өзгермейді: ресурс жоқ.')
h2('7. JSON қандай рөл атқарады?')
p('JSON - тілден тәуелсіз мәтіндік дерек форматы. Объект, массив, жол, сан, boolean және null мәндерін қолдайды. Express JSON body-ді JavaScript объектісіне айналдырады; res.json(...) жауап сериализациясын орындайды. JSON санын жолға алмастыру дұрыс емес: мысалы rating: 8.5 қабылданады, ал rating: "8.5" қабылданбайды.')
h2('8. Node.js пен Express қызметі қандай?')
p('Node.js JavaScript-ті серверде орындайды және асинхронды енгізу/шығаруды басқарады. Express HTTP маршруттарды, middleware тізбегін, сұраныс пен жауап объектілерін ұсынады. mssql SQL Server қосылымын басқарады. Express 4 асинхронды қателері Promise.catch(next) арқылы орталық error middleware-ге жіберіледі.')
h2('9. Postman арқылы API қалай тестіленеді?')
p('HTTP әдісін, URL, header және қажет body мәнін таңдап Send орындалады. Post-response script ішінде pm.test және pm.expect арқылы статус пен JSON тексеріледі. Коллекция Runner арқылы ретімен орындалып, жаңа ID айнымалыға сақталады. Осы жұмыста GET -> POST -> GET -> PUT -> GET -> DELETE -> GET 404 тізбегі және қате сценарийлер тексерілген.')
h2('Қолданылу шекарасы және дереккөздер')
p('Бұл жергілікті оқу жүйесі. Аккаунттар, рөлдер, нақты төлем, QR және HTTPS конфигурациясы ауқымға кірмейді. №8 SQL файлы кеңейтілген CinemaLabDB схемасына арналған; осы CinemaSchoolDB орнату тізіміне кірмейді.','small')
link('Express 4: Error Handling','https://expressjs.com/en/4x/guide/error-handling/')
link('Microsoft Learn: OUTPUT clause','https://learn.microsoft.com/en-us/sql/t-sql/queries/output-clause-transact-sql')
link('Postman: test scripts','https://learning.postman.com/docs/tests-and-scripts/write-scripts/test-scripts/')
link('Postman: Collection Runner','https://learning.postman.com/docs/tests-and-scripts/running-collections/intro-to-collection-runs')
p('Бастапқы материалдар: пайдаланушы берген 10-Lab.pdf (6 бет) және CinemaLab9_ExampleStyle_FINAL.png; жобаның SQL схемасы мен сервер коды.','small')

# 12. User's original Lab 9 diagram
page(11,'Қосымша: №9 жұмыстың түпнұсқасы')
img('docs/lab9/CinemaLab9_ExampleStyle_FINAL.png',height=593)
p('3-сурет. Пайдаланушы ұсынған сурет өзгертілмеген. Суреттегі кеңейтілген модульдер мен CinemaLabDB - мақсатты архитектура. Нақты жеті кестелік CinemaSchoolDB нұсқасы есептің 3-бетіндегі диаграммада көрсетілді. Толық өлшемді PNG docs/lab9/ ішінде берілген.','small')

def decorate(c, doc):
    width,height=A4
    c.saveState()
    c.setFillColor(INK); c.rect(0,height-11,width,11,fill=1,stroke=0)
    c.setStrokeColor(colors.HexColor('#dbe3eb'));c.line(48,43,width-48,43)
    c.setFont('Arial',8);c.setFillColor(MUTED)
    c.drawString(48,28,'CINÉMA LAB · №9-10 · 04.11.2026')
    c.drawRightString(width-48,28,f'{doc.page} / 12')
    c.restoreState()

doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=48,leftMargin=48,topMargin=45,bottomMargin=57,
    title='Cinema Lab 10 - HTTP REST API',author='Syrym / Syrym1234',subject='Кинотеатр REST API зертханалық жұмысы')
doc.build(story,onFirstPage=decorate,onLaterPages=decorate)
# Report source has stable relative image links from its own directory.
markdown='\n'.join(md)
for filename, rel in [('architecture-current.png','../lab9/architecture-current.png'),
    ('catalog-desktop.png','evidence/catalog-desktop.png'),('CinemaLab9_ExampleStyle_FINAL.png','../lab9/CinemaLab9_ExampleStyle_FINAL.png')]:
    markdown=markdown.replace(f']({filename})',f']({rel})')
(ROOT/'docs/lab10/REPORT.md').write_text(markdown,encoding='utf-8')
print(OUT)
