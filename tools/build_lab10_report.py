"""Create the standalone illustrated Kazakh Lab 10 report from real evidence.
Run capture_report_screenshots.cjs first. Requires reportlab, Pillow and pypdf.
"""
import json
from html import escape
from pathlib import Path
from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, Preformatted

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf/Cinema_Lab10_Report.pdf'
SHOT = ROOT / 'docs/lab10/evidence/screenshots'
OUT.parent.mkdir(parents=True, exist_ok=True)
for name, filename in [('Arial','arial.ttf'),('Arial-Bold','arialbd.ttf'),('Mono','consola.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(Path('C:/Windows/Fonts')/filename)))
pdfmetrics.registerFontFamily('Arial',normal='Arial',bold='Arial-Bold',italic='Arial',boldItalic='Arial-Bold')
NAVY = colors.HexColor('#142c43')
TEAL = colors.HexColor('#166b64')
GOLD = colors.HexColor('#b48232')
MUTED = colors.HexColor('#607285')
PALE = colors.HexColor('#eef4f7')
W = A4[0]-96
styles = {
    'kicker':ParagraphStyle('Kicker',fontName='Arial-Bold',fontSize=9,leading=13,textColor=GOLD,spaceAfter=11),
    'title':ParagraphStyle('Title',fontName='Arial-Bold',fontSize=43,leading=50,textColor=NAVY,spaceAfter=13),
    'h1':ParagraphStyle('Heading',fontName='Arial-Bold',fontSize=23,leading=29,textColor=NAVY,spaceAfter=14),
    'h2':ParagraphStyle('Subheading',fontName='Arial-Bold',fontSize=11.5,leading=16.5,textColor=TEAL,spaceBefore=12,spaceAfter=7),
    'body':ParagraphStyle('Body',fontName='Arial',fontSize=10.1,leading=15,textColor=NAVY,spaceAfter=9),
    'small':ParagraphStyle('Small',fontName='Arial',fontSize=8.6,leading=12.5,textColor=MUTED,spaceAfter=8),
    'caption':ParagraphStyle('Caption',fontName='Arial',fontSize=8.5,leading=12.5,textColor=MUTED,spaceBefore=7,spaceAfter=14),
    'cell':ParagraphStyle('Cell',fontName='Arial',fontSize=8.6,leading=12.2,textColor=NAVY),
    'th':ParagraphStyle('TH',fontName='Arial-Bold',fontSize=8.6,leading=12.2,textColor=colors.white),
    'metric':ParagraphStyle('Metric',fontName='Arial-Bold',fontSize=21,leading=26,textColor=TEAL),
    'code':ParagraphStyle('Code',fontName='Mono',fontSize=8.3,leading=11.6,textColor=NAVY,
       leftIndent=12,rightIndent=10,borderPadding=10,backColor=PALE,spaceBefore=4,spaceAfter=13),
}
story, md = [], []
figure_number=0
def p(text,style='body'):
    story.append(Paragraph(escape(text).replace('\n','<br/>'),styles[style]));md.append(text+'\n')
def h2(text):
    p(text,'h2')
def page(number,title):
    story.append(PageBreak());p(f'ЗЕРТХАНАЛЫҚ ЖҰМЫС №10  /  {number:02d}','kicker');p(title,'h1')
    md.append('---\n')
def code(text):
    story.append(Preformatted(text,styles['code']));md.append('```\n'+text+'\n```\n')
def table(headers,rows,widths=None,compact=False):
    widths=widths or [W/len(headers)]*len(headers)
    data=[[Paragraph(escape(str(x)),styles['th']) for x in headers]]
    data += [[Paragraph(escape(str(x)),styles['cell']) for x in row] for row in rows]
    t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),NAVY),('VALIGN',(0,0),(-1,-1),'TOP'),
       ('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),
       ('TOPPADDING',(0,0),(-1,-1),4 if compact else 6),('BOTTOMPADDING',(0,0),(-1,-1),4 if compact else 6),
       ('ROWBACKGROUNDS',(0,1),(-1,-1),[PALE,colors.white]),('LINEBELOW',(0,1),(-1,-1),.35,colors.HexColor('#dbe4ec'))]))
    story.extend([t,Spacer(1,9)])
    md.append('| '+' | '.join(headers)+' |\n| '+' | '.join(['---']*len(headers))+' |\n'+'\n'.join('| '+' | '.join(map(str,row))+' |' for row in rows)+'\n')
def image_obj(filename,width):
    with PILImage.open(SHOT/filename) as im:iw,ih=im.size
    return Image(str(SHOT/filename),width=width,height=width*ih/iw,hAlign='CENTER')
def figure(filename,caption,width=W):
    global figure_number
    figure_number+=1
    story.append(image_obj(filename,width));p(f'{figure_number}-сурет. {caption}','caption')
    md.append(f'![{caption}](evidence/screenshots/{filename})\n')
def metrics():
    cells=[]
    for number,label in [('25','HTTP сұранысы'),('94','Assertion'),('0','Сәтсіз assertion')]:
        cells.append([Paragraph(number,styles['metric']),Paragraph(label,styles['small'])])
    t=Table([cells],colWidths=[W/3]*3)
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PALE),('BOX',(0,0),(-1,-1),.5,colors.HexColor('#dce5eb')),
       ('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),7),('LEFTPADDING',(0,0),(-1,-1),15)]))
    story.extend([t,Spacer(1,10)])
def link(label,url):
    story.append(Paragraph(f'<link href="{escape(url,quote=True)}" color="#166b64">{escape(label)}</link>',styles['small']))
    md.append(f'[{label}]({url})\n')

newman=json.loads((ROOT/'docs/lab10/evidence/newman-results.json').read_text(encoding='utf-8-sig'))
assert newman['run']['stats']['requests']['total']==25
assert newman['run']['stats']['assertions']['total']==94 and not newman['run']['failures']
manifest=json.loads((SHOT/'capture-manifest.json').read_text(encoding='utf-8'))
assert manifest['fixtureCleanup'] and manifest['initialMovies']==manifest['finalMovies']
assert manifest['browserErrors']==[]
captures=manifest['httpCaptures']
live_id=captures[1]['body']['movie_id']

# 1. Standalone cover, without material from other laboratory reports.
p('ЗЕРТХАНАЛЫҚ ЖҰМЫС №10','kicker')
p('HTTP REST API','title')
p('Кинотеатрдың ақпараттық жүйесі','h1')
p('Ақпараттық жүйе компоненттерінің өзара әрекеттесуі: фильмдер каталогының CRUD операциялары және Postman тестілеуі.')
p('Орындаушы: Syrym / Syrym1234   ·   Күні: 04.11.2026','small')
story.append(Spacer(1,6))
figure('09-catalog.png','Жобаның нақты жұмыс істейтін каталог интерфейсі.',width=438)
metrics()
p('Node.js  +  Express  +  Microsoft SQL Server','small')

# 2. Objective and requirement coverage.
page(1,'Мақсат және орындалған міндеттер')
p('Жұмыстың мақсаты - Node.js және Express арқылы деректер қорымен байланысқан REST API әзірлеу, CRUD операцияларын орындау және HTTP жауаптарын Postman коллекциясымен тексеру.')
p('Нұсқаулықтағы кітапхана/MySQL мысалы кинотеатрдың Movies ресурсына бейімделді. Қолданыстағы CinemaSchoolDB базасы мен mssql драйвері пайдаланылады. API деректері SQL Server-де тұрақты сақталады.')
table(['Талап','Орындалуы'],[
    ['Серверді әзірлеу','Express HTTP сервері, JSON middleware, REST маршруттары'],
    ['Деректер қорымен байланыс','server/db.js: ConnectionPool және параметрленген SQL'],
    ['Барлық жазбаны оқу','GET /api/movies -> 200, фильмдер массиві'],
    ['ID бойынша оқу','GET /api/movies/:id -> 200 немесе 404'],
    ['Жазба қосу','POST /api/movies -> 201 + Location'],
    ['Жазбаны өзгерту','PUT /api/movies/:id -> 200'],
    ['Жазбаны жою','DELETE /api/movies/:id -> 200 немесе 409'],
    ['Тестілеу','25 сұраныстық Postman коллекциясы / 94 assertion'],
    ['Қорытынды материал','Скриншоттар, тест журналдары және 9 бақылау сұрағы']], [160,W-160])
h2('Компоненттер арасындағы дерек алмасу')
code('Web UI / Postman\n       | HTTP request + JSON\n       v\nExpress -> validation -> mssql -> SQL Server\n       ^                           |\n       +---- HTTP status + JSON <--+')
p('Клиент SQL Server-ге тікелей қосылмайды. Сервер сұранысты тексеріп, SQL параметрлерін дайындайды; жауап клиентке HTTP статусы және JSON түрінде қайтарылады.')

# 3. Implementation and validation.
page(2,'Деректер моделі және сервер коды')
p('Негізгі ресурс - Movies. Әр фильм Genres кестесіндегі жанрға тиесілі. Movies -> Sessions байланысы бар фильмді жоюға шектеу қояды. Деректер қоры: CinemaSchoolDB.')
table(['Өріс','SQL түрі','Қабылданатын мән'],[
    ['movie_id','INT IDENTITY / PK','Сервер жасайды; ID: 1..2147483647'],
    ['title','NVARCHAR(150)','Бос емес мәтін; ең көбі 150 таңба'],
    ['genre_id','INT / FK','Базада бар жанрдың ID мәні'],
    ['duration_min','INT','1..600 бүтін саны'],['age_rating','INT','0, 6, 12, 16, 18 немесе 21'],
    ['release_year','INT','1888..2100 бүтін саны'],['rating','DECIMAL(3,1)','0..10; ең көбі бір ондық таңба'],
    ['description','NVARCHAR(400)','Бос емес мәтін; ең көбі 400 таңба']], [103,138,W-241])
h2('Модульдердің міндеті')
table(['Файл','Қызметі'],[
    ['server/index.js','Express, JSON middleware, error handler, серверді іске қосу'],
    ['server/db.js','SQL конфигурациясы, ConnectionPool және қосылымды жабу'],
    ['server/movies.js','Фильмдер ресурсының GET, POST, PUT, DELETE маршруттары'],
    ['server/validation.js','ID, мәтін ұзындығы, JSON типтері және диапазондар'],
    ['public/catalog.*','Форма, каталог, іздеу, өзгерту және жою интерфейсі']], [154,W-154])
p('SQL сұраныстарына кіріс мәндері .input(...) арқылы беріледі. Белгісіз өрістер, қате типтер және SQL INT шегінен асатын ID мәндері қабылданбайды. Клиентке SQL қатесінің ішкі мәліметтері жіберілмейді.')

# 4. Setup + live connectivity screenshot.
page(3,'Іске қосу және SQL байланысы')
code('npm ci\nCopy-Item .env.example .env\nnpm start')
p('Node.js 20+ және SQL Server қажет. Таза базаға sql/01_create_database.sql, кейін sql/02_insert_data.sql файлдарын бір рет орындаңыз. Бар базаға деректерді қайта енгізбеңіз.')
h2('Тексерілген жергілікті баптау')
code('DB_AUTH=windows\nDB_SERVER=.\\SQLEXPRESS\nDB_NAME=CinemaSchoolDB\nHOST=127.0.0.1\nPORT=3000')
p('Windows Authentication үшін msnodesqlv8 және ODBC Driver 17 қолданылады. Атаулы instance кезінде DB_PORT жолын алып тастаңыз. SQL Authentication параметрлері .env.example ішінде берілген.','small')
figure('01-health.png','GET /api/health: CinemaSchoolDB базасымен байланыс және фильм саны расталды.',width=470)

# 5. GET.
page(4,'READ - фильм туралы ақпаратты оқу')
p('GET /api/movies фильмдер массивін қайтарады. GET /api/movies/:id нақты фильмді жанр атауымен бірге қайтарады. Оқу операциялары деректерді өзгертпейді.')
figure('03-read-200.png',f'GET /api/movies/{live_id}: нақты фильмге 200 OK жауабы және JSON объектісі алынды.')
table(['Сұраныс','Нәтиже'],[
    ['GET /api/movies','200 OK: рейтинг, атау және ID бойынша сұрыпталған массив'],
    [f'GET /api/movies/{live_id}','200 OK: movie_id, негізгі өрістер және genre_name'],
    ['GET /api/movies/2147483647','404 Not Found: MOVIE_NOT_FOUND']], [205,W-205])
p('Скриншоттардағы сұраныстар нақты жергілікті API-ге fetch арқылы жіберілді. HTTP клиентінің көрінісі есеп үшін жасалған; сұраныс пен жауап деректері capture-manifest.json файлында сақталған.','small')

# 6. POST.
page(5,'CREATE - жаңа фильмді қосу')
p('POST /api/movies сұранысының JSON body бөлігінде жеті міндетті өріс беріледі. movie_id деректер қорында автоматты жасалады; жанр ID /api/metadata нәтижесінен алынады.')
figure('02-create-201.png',f'Жаңа фильм қосылды: 201 Created, movie_id={live_id}; Location жаңа ресурс адресін көрсетеді.')
h2('Сервердегі сақтау логикасы')
code('INSERT INTO dbo.Movies\n  (title, genre_id, duration_min, age_rating,\n   release_year, rating, description)\nOUTPUT INSERTED.*\nVALUES (@title, @genre_id, @duration_min, @age_rating,\n        @release_year, @rating, @description)')
p('NVARCHAR параметрлері қазақша мәтіннің сақталуын қамтамасыз етеді. Сәтті INSERT нәтижесі OUTPUT INSERTED.* арқылы алынып, клиентке 201 статусымен жіберіледі.')

# 7. PUT.
page(6,'UPDATE - фильм мәліметтерін өзгерту')
p(f'PUT /api/movies/{live_id} сұранысы фильмнің барлық жазылатын өрісін ауыстырады. Мысалда атауы жаңартылып, рейтинг 8.5 мәнінен 9.1 мәніне өзгертілді.')
figure('04-update-200.png','PUT нәтижесі: 200 OK және жаңартылған title, rating өрістері.')
table(['Ереже','Нәтиже'],[
    ['Толық PUT','Барлық жеті жазылатын өріс міндетті'],
    ['Жоқ ID','404 MOVIE_NOT_FOUND'],['Қате JSON мәні','400 VALIDATION_ERROR'],
    ['Тұрақты сақтау','Postman тізбегіндегі кейінгі GET өзгерісті қайта тексереді']], [155,W-155])
code('UPDATE dbo.Movies\nSET title=@title, rating=@rating, ...\nOUTPUT INSERTED.*\nWHERE movie_id=@id')
p('Жауапта SQL Server қайтарған жаңартылған жол пайдаланылады. PUT сұранысын бірдей деректермен қайталау ресурстың соңғы күйін өзгертпейді.','small')

# 8. DELETE + genuine follow-up 404 data.
page(7,'DELETE - фильмді жою')
p('Жою тек сеансы жоқ фильм үшін орындалады. Тексеруде API арқылы жаңа қосылған уақытша фильм қолданылды; бастапқы каталог жазбалары сақталды.')
figure('05-delete-200.png',f'DELETE /api/movies/{live_id}: тест фильмі жойылды, 200 OK жауабы алынды.')
h2('Жойылған ресурсқа қайта сұраныс')
code(f'GET /api/movies/{live_id}\n\n404 Not Found\n'+json.dumps(captures[5]['body'],ensure_ascii=False,indent=2))
p('Кейінгі GET сұранысы 404 қайтаратыны нақты тексерілді. Қайта орындалған DELETE те 404 береді. Бұл жоюдың соңғы күйін өзгертпейді: ресурс деректер қорында жоқ.')
p('Тексеру аяқталғанда уақытша жазбалар тазаланып, каталогтағы фильм саны бастапқы 24 мәніне қайтарылды.','small')

# 9. Errors and FK integrity.
page(8,'Қателерді өңдеу және деректер тұтастығы')
p('HTTP статусы клиентке операцияның нәтижесін нақты түсіндіреді. Мысалы, сеансы бар фильмді жою 409 Conflict жауабымен тоқтатылады.')
figure('08-conflict-409.png','FOREIGN KEY байланысы сақталды: сеансы бар фильм жойылған жоқ.')
table(['HTTP','Қате жағдайы','API коды'],[
    ['400','Қате рейтинг, тип немесе міндетті өріс','VALIDATION_ERROR'],
    ['400','Қате ID / бұзылған JSON','INVALID_ID / INVALID_JSON'],
    ['404','Фильм табылмады','MOVIE_NOT_FOUND'],['409','Фильмге сеанс байланысқан','MOVIE_HAS_SESSIONS'],
    ['413 / 415','Көлемі артық / Content-Type қате','PAYLOAD_TOO_LARGE / UNSUPPORTED_MEDIA_TYPE'],
    ['500 / 503','Сервер немесе база байланысы','INTERNAL_ERROR / DATABASE_UNAVAILABLE']], [54,219,W-273],compact=True)
p('rating=10.5 мәніне жіберілген POST 400 статусымен қайтарылды. Осы және басқа нақты жауаптар толық скриншоттар бумасы мен capture-manifest.json ішінде бар.','small')

# 10. Real catalog screenshot.
page(9,'Каталогты басқару интерфейсі')
p('Веб-интерфейс бір бетте фильм қосуға, іздеуге, өзгертуге және жоюға мүмкіндік береді. Әр әрекет API сұранысын орындайды.')
figure('09-catalog.png','Нақты каталог: сол жақта енгізу формасы, оң жақта іздеу және фильмдер тізімі.')
h2('Пайдаланушыға берілген мүмкіндіктер')
table(['Әрекет','HTTP сұранысы'],[
    ['Каталогты ашу','GET /api/movies'],['Жаңа фильм қосу','POST /api/movies'],
    ['Өзгерту формасын ашу','GET /api/movies/:id'],['Өзгерісті сақтау','PUT /api/movies/:id'],
    ['Растап жою','DELETE /api/movies/:id']], [230,W-230],compact=True)

# 11. UI edit and actual cropped dialog, captured directly from the browser.
page(10,'Формада өзгерту және жоюды растау')
p('Өзгерту батырмасы таңдалған фильм деректерін формаға жүктейді. Жою алдында пайдаланушыға растау терезесі көрсетіледі.')
figure('11-ui-edit.png','Өзгерту формасы: фильм өрістері жүктелді, рейтинг 9.4 мәніне енгізілді.',width=480)
figure('17-delete-dialog-detail.png','Жоюды растау терезесі. Сурет браузердегі dialog элементінен тікелей алынды.',width=300)

# 12. Mobile screenshot with readable explanatory text.
page(11,'Мобильді көрініс және браузер тексеруі')
p('Интерфейс 390 × 844 өлшемінде тексерілді. Форма бір бағанға орналасады, бетте көлденең тасу анықталған жоқ.')
mobile=image_obj('14-mobile.png',215)
right=[]
for title,text in [
    ('Бейімделетін форма','Атау, жанр, ұзақтық, жас шектеуі, жыл және рейтинг өрістері экран еніне сай орналасады.'),
    ('Нақты деректер','Каталог серверден жүктеледі. Жаңа фильм тек SQL Server сақтағаннан кейін тізімде көрсетіледі.'),
    ('Әрекет нәтижесі','Қосу және өзгерту сәтті аяқталғанда хабарлама шығады. Сеансы бар фильмді жою тоқтатылады.'),
    ('Тексеру нәтижесі','Форма арқылы қосу, өзгерту, жою және қорғау сценарийлері орындалды. Браузерде ұстатылмаған JavaScript қатесі тіркелмеді.')]:
    right += [Paragraph(escape(title),styles['h2']),Paragraph(escape(text),styles['body'])]
t=Table([[mobile,right]],colWidths=[235,W-235]);t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),9)]));story.append(t)
figure_number+=1
p(f'{figure_number}-сурет. Нақты мобильді скриншот: 390 × 844. Оң жақтағы мәтін тексерілген әрекеттерді түсіндіреді.','caption')
md.append('![Мобильді көрініс](evidence/screenshots/14-mobile.png)\n')

# 13. Postman instructions and saved actual Newman results.
page(12,'Postman коллекциясы және тест нәтижелері')
p('Postman ішінде коллекция мен Local environment файлын Import арқылы ашып, Cinema Local ортасын таңдаңыз. Run collection пәрменін бір итерациямен бастапқы ретімен орындаңыз. movieId және genreId айнымалылары автоматты толтырылады.')
figure('16-newman-summary.png','25 сұраныс пен 94 assertion сәтті өтті. Сурет нақты Newman JSON журналының көрнекі шолуын көрсетеді.',width=470)
code('npm test\nnpm run test:postman')
p('Дереккөз: newman-results.json. Бұл шолу Postman қолданбасының терезесі емес. Postman коллекциясы Newman арқылы орындалған. Қосымша 11 unit test және 11 браузер тексеруі өтті.','small')

# 14. Control questions, first half.
page(13,'Бақылау сұрақтары: 1-5')
h2('1. API дегеніміз не және не үшін қолданылады?')
p('API - бағдарламалардың бір-біріне функция немесе дерек ұсыну келісімі. Кинотеатрда браузер /api/movies ресурсына сұраныс жібереді, сервер SQL нәтижесін JSON ретінде қайтарады. Клиентке SQL қосылымының құпиясөзі қажет емес.')
h2('2. REST API архитектурасының негізгі ерекшеліктері қандай?')
p('Ресурстар URI арқылы анықталады, әрекеттер HTTP әдістерімен беріледі, клиент пен сервер бөлінеді. Stateless қағидасы бойынша әр сұраныс өңдеуге қажетті мәліметті өзі қамтиды. Жауапта HTTP статусы және ресурс көрінісі болады. GET қауіпсіз, PUT пен DELETE мағыналық жағынан idempotent: қайталау ресурстың соңғы күйін өзгертпейді, бірақ жауап статусы өзгеруі мүмкін.')
h2('3. HTTP протоколы API жұмысына қалай қатысады?')
p('HTTP әдісті, URL-ді, header мен body құрылымын және жауап статусын анықтайды. POST + Content-Type: application/json фильм деректерін жібереді, сервер 201 Created қайтарады. 400 кіріс қатесін, 404 жоқ ресурсты, 409 деректер байланысының қайшылығын көрсетеді. Осы жергілікті оқу нұсқасы HTTP қолданады.')
h2('4. CRUD операцияларының мағынасы қандай?')
p('Create - жазба құру; Read - оқу; Update - жаңарту; Delete - жою. Бұл жобада сәйкестік: POST -> INSERT, GET -> SELECT, PUT -> UPDATE, DELETE -> DELETE. Операциялар SQL Server кестесінде орындалады.')
h2('5. GET және POST әдістерінің айырмашылығы қандай?')
p('GET ресурсты оқиды және сервердің пәндік күйін өзгертпеуі тиіс. POST жаңа ресурс құрады, оның деректері body ішінде беріледі. POST-ты қайталау бірнеше жаңа жазба құруы мүмкін. Осы API-де GET 200, сәтті POST 201 және жаңа ресурсқа Location header қайтарады.')

# 15. Remaining questions, conclusion and sources.
page(14,'Бақылау сұрақтары: 6-9 және қорытынды')
h2('6. PUT және DELETE қандай мақсатта қолданылады?')
p('PUT көрсетілген URI-дегі ресурстың жазылатын деректерін толық ауыстырады. DELETE ресурсты жояды. Бұл API-де жоқ ID 404, ал сеансқа байланысқан фильм 409 қайтарады. Қайта жоюдың жауабы 404 болғанымен, соңғы күй өзгермейді: ресурс жоқ.')
h2('7. JSON форматының рөлі қандай?')
p('JSON - тілден тәуелсіз мәтіндік дерек форматы. Объект, массив, жол, сан, boolean және null мәндерін қолдайды. Express JSON body-ді объектіге айналдырып, res.json(...) арқылы жауап береді. Сан мен жол бөлек тип: rating: 8.5 қабылданады, rating: "8.5" қабылданбайды.')
h2('8. Node.js және Express қызметі қандай?')
p('Node.js JavaScript-ті серверде орындайды және асинхронды енгізу/шығаруды басқарады. Express маршруттар мен middleware тізбегін ұсынады. mssql деректер қорымен байланысады. Express 4 асинхронды қателері Promise.catch(next) арқылы орталық error handler-ге жіберіледі.')
h2('9. Postman арқылы API қалай тестіленеді?')
p('Әдіс, URL, header және қажет body таңдалып, Send орындалады. pm.test пен pm.expect статус пен JSON-ды тексереді. Runner коллекцияны ретімен орындайды; жаңа ID айнымалыға сақталады. Жұмыста толық CRUD тізбегі және қате сценарийлер тексерілген.')
h2('Қорытынды')
p('Фильмдерге арналған толық CRUD API әзірленді және SQL Server-мен байланыстырылды. Нақты HTTP жауаптары, интерфейс әрекеттері және қате жағдайлар скриншоттармен расталды. Уақытша тест жазбалары тазаланды. Жоба жергілікті оқу ортасына арналған.')
link('Express 4: Error Handling','https://expressjs.com/en/4x/guide/error-handling/')
link('Microsoft Learn: OUTPUT clause','https://learn.microsoft.com/en-us/sql/t-sql/queries/output-clause-transact-sql')
link('Postman: test scripts','https://learning.postman.com/docs/tests-and-scripts/write-scripts/test-scripts/')
link('Жобаның GitHub репозиторийі','https://github.com/Syrym1234/cinema-information-system1')
p('Негіз: 10-Lab.pdf нұсқаулығы, жоба коды, SQL схемасы, нақты HTTP және Newman журналдары.','small')

def decorate(c,doc):
    width,height=A4
    c.saveState();c.setFillColor(NAVY);c.rect(0,height-9,width,9,fill=1,stroke=0)
    c.setFillColor(GOLD);c.rect(48,height-9,92,9,fill=1,stroke=0)
    if doc.page>1:
        c.setFont('Arial-Bold',7.4);c.setFillColor(MUTED)
        c.drawRightString(width-48,height-28,'CINÉMA / HTTP REST API')
    c.setStrokeColor(colors.HexColor('#dbe4ec'));c.line(48,43,width-48,43)
    c.setFont('Arial',8);c.setFillColor(MUTED);c.drawString(48,28,'CINÉMA LAB · Зертханалық жұмыс №10 · 04.11.2026')
    c.restoreState()
class NumberedCanvas(canvas.Canvas):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs);self.states=[]
    def showPage(self):
        self.states.append(dict(self.__dict__));self._startPage()
    def save(self):
        total=len(self.states)
        for state in self.states:
            self.__dict__.update(state)
            self.setFont('Arial-Bold',8);self.setFillColor(TEAL)
            self.drawRightString(A4[0]-48,28,f'{self._pageNumber:02d} / {total:02d}')
            super().showPage()
        super().save()

doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=48,leftMargin=48,topMargin=45,bottomMargin=57,
    title='Cinema Lab 10 - HTTP REST API - Illustrated Report',author='Syrym / Syrym1234',
    subject='Кинотеатр REST API: скриншоттармен толықтырылған зертханалық есеп')
doc.build(story,onFirstPage=decorate,onLaterPages=decorate,canvasmaker=NumberedCanvas)
(ROOT/'docs/lab10/REPORT.md').write_text('\n'.join(md),encoding='utf-8')
from pypdf import PdfReader
pages=PdfReader(OUT).pages
assert len(pages)==15, f'Unexpected overflow: {len(pages)} pages'
text='\n'.join(page.extract_text() for page in pages)
assert all(value not in text for value in ['№9','№ 9','Lab 9','lab9','CinemaLab9'])
print(f'{OUT}\n15 pages; standalone Lab 10; illustrated evidence verified.')
