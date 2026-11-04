"""Adapt the supplied Word report by preserving its OOXML package and styles.
Usage: python build_lab10_from_reference.py --reference <reference.docx>
The reference stays unchanged. All movie facts come from captured live evidence.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile
from lxml import etree
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--reference',required=True,type=Path)
args=parser.parse_args()
reference=args.reference.resolve()
expected_hash='fc4b4d66aabcb24b9d60731340c64923a510de7acd7177c8baf4f7278ff5cd08'
assert hashlib.sha256(reference.read_bytes()).hexdigest()==expected_hash,'Reference changed; redistill it first.'
out=ROOT/'output/docx/Cinema_Lab10_Report.docx'
out.parent.mkdir(parents=True,exist_ok=True)
shots=ROOT/'docs/lab10/evidence/screenshots'
live=json.loads((shots/'capture-manifest.json').read_text(encoding='utf8'))
assert live['fixtureCleanup'] and live['initialMovies']==live['finalMovies']==24
assert len(live['sqlChecks'])==2
before,after=live['sqlChecks']
assert before['row']['rating']==8.5 and after['row']['rating']==9.1
mid=before['row']['movie_id']
assert after['row']['movie_id']==mid
z=ZipFile(reference)
parts={i.filename:z.read(i.filename) for i in z.infolist()}
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'wp':'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
    'a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
def tag(name):
    prefix,local=name.split(':');return '{'+ns[prefix]+'}'+local
doc=etree.fromstring(parts['word/document.xml'])
body=doc.find('w:body',ns)
paras=body.findall('w:p',ns)
assert len(paras)==57
def text(p,value):
    source_run=next((r for r in p.findall('w:r',ns) if ''.join(r.itertext()).strip()),None)
    rpr=copy.deepcopy(source_run.find('w:rPr',ns)) if source_run is not None and source_run.find('w:rPr',ns) is not None else None
    for child in list(p):
        if child.tag!=tag('w:pPr'):p.remove(child)
    r=etree.SubElement(p,tag('w:r'))
    if rpr is not None:r.append(rpr)
    t=etree.SubElement(r,tag('w:t'));t.text=value
    if value.startswith(' ') or value.endswith(' '):t.set('{http://www.w3.org/XML/1998/namespace}space','preserve')
def prop(p,name,value=None):
    pr=p.find('w:pPr',ns)
    if pr is None:pr=etree.Element(tag('w:pPr'));p.insert(0,pr)
    item=pr.find('w:'+name,ns)
    if item is None:item=etree.SubElement(pr,tag('w:'+name))
    if value is not None:item.set(tag('w:val'),str(value))

replacements={
0:'№10 ЗЕРТХАНАЛЫҚ ЖҰМЫС',
1:'Тақырыбы: REST API құру және Postman арқылы тестілеу',
2:'Жоба: Cinema Information System кинотеатрдың ақпараттық жүйесі',
3:'Орындаған: Бақтыбек Сырым Абайұлы',
4:'Тобы: ИС 24-02',
5:'2026 жыл',
6:'1. Жұмыстың мақсаты',
7:'Node.js және Express арқылы REST API құру, оны Microsoft SQL Server деректер қорымен байланыстыру және GET, POST, PUT, DELETE әдістерін тексеру. Нұсқаулықтағы кітаптар мысалы кинотеатр жобасының Movies кестесіне бейімделді.',
8:'2. Қолданылған құралдар',
9:'Visual Studio Code бағдарламалық кодты жазу үшін қолданылды. Node.js v24.20.0 және Express серверді іске қосады; mssql, msnodesqlv8 және ODBC Driver 17 Windows Authentication арқылы SQL Server-ге қосылады. Postman коллекциясы Newman 6.2.3 арқылы орындалды. Скриншоттар браузерлік HTTP клиентінен және SQL Server SELECT нәтижелерінен алынды.',
10:'3. Жүйе және дерекқор құрылымы',
11:'SQL Server instance: .\\SQLEXPRESS. Деректер қоры: CinemaSchoolDB. Movies кестесінің өрістері: movie_id (INT, PK), title (NVARCHAR), genre_id (INT, FK), duration_min, age_rating, release_year (INT), rating (DECIMAL) және description (NVARCHAR). Movies кестесі Genres және Sessions кестелерімен байланысқан.',
12:'Жоба құрылымы: server/db.js деректер қорына қосылуды басқарады; server/movies.js CRUD маршруттарын өңдейді; server/validation.js кіріс деректерін тексереді; server/index.js Express серверін іске қосады; public/catalog.html және public/catalog.js каталог интерфейсін ұсынады.',
13:'4. Орындалу барысы',
14:'4.1. Node.js ортасын дайындау',
15:'Жобаның түбірінде npm ci командасымен тәуелділіктер орнатылды. .env.example негізінде .env файлы бапталды. Сервер npm start арқылы http://127.0.0.1:3000 мекенжайында іске қосылды.',
16:'4.2. SQL Server деректер қорына қосылу',
17:'server/db.js Windows Authentication арқылы .\\SQLEXPRESS instance-іне қосылды. DB_NAME=CinemaSchoolDB параметрі қолданылды. GET /api/health сұранысы 200 OK қайтарып, database атауы CinemaSchoolDB және movies саны 24 екенін растады.',
18:'4.3. REST API құру',
19:'GET /api/movies, GET /api/movies/:id, POST /api/movies, PUT /api/movies/:id және DELETE /api/movies/:id маршруттары әзірленді. SQL мәндері .input() арқылы параметрленді. POST және PUT жеті жазылатын өрісті талап етеді. Жоқ фильмге 404, қате өріске 400, сеансы бар фильмді жоюға 409 қайтарылады.',
20:'4.4. Postman коллекциясы арқылы тексеру',
21:f'POST арқылы «Жаңа көкжиек | Lab 10» фильмі қосылды: ID={mid}, рейтинг 8.5. PUT арқылы атауы «Жаңа көкжиек | Жаңартылды», рейтингі 9.1 болып өзгертілді. SQL Server-ге тікелей SELECT сұранысы екі күйді де растады. DELETE кейінгі GET сұранысы 404 Not Found қайтарды. Postman коллекциясындағы 25 сұраныс пен 94 assertion Newman арқылы сәтті орындалды.',
22:'5. Практикалық нәтижелердің скриншоттары',
24:f'1-сурет. POST 201 Created жаңа фильм қосылды ID={mid}.',
26:'2-сурет. SQL Server бастапқы рейтинг 8.5 мәнін растады.',
28:'3-сурет. PUT 200 OK атауы мен рейтингі жаңартылды.',
30:'4-сурет. SQL Server жаңартылған рейтинг 9.1 мәнін растады.',
32:'5-сурет. DELETE 200 OK тест фильмі жойылды.',
34:f'6-сурет. GET жойылған ID={mid} үшін 404 Not Found қайтарды.',
35:'6. Бақылау сұрақтарына жауаптар',
37:'API (Application Programming Interface) бағдарламалардың бір-бірімен әрекеттесуін қамтамасыз ететін келісім. Ол клиент сұранысын қабылдап, сервер қызметтері мен деректерін ұсынады. Біздің жобада API фильмдерді оқу, қосу, жаңарту және жою үшін қолданылады.',
39:'REST ресурстарға бағытталады: әр ресурс URI арқылы анықталады, әрекеттер стандартты HTTP әдістерімен орындалады. Клиент пен сервер бөлінеді. Stateless қағидасы бойынша әр сұраныс өңдеуге жеткілікті ақпарат қамтиды. Жауапта HTTP статусы мен ресурс көрінісі беріледі.',
41:'HTTP клиент пен сервер арасында сұраныс және жауап тасымалдайды. Клиент әдісті, URL, header және қажет болса JSON body жібереді. Сервер статус кодын және жауап деректерін қайтарады. Мысалы, POST /api/movies сұранысына 201 Created қайтарылды.',
43:'CRUD: Create жаңа жазба құру, Read деректі оқу, Update жаңарту, Delete жою. Жобада олар POST, GET, PUT және DELETE әдістеріне сәйкес келеді. SQL Server-де INSERT, SELECT, UPDATE және DELETE орындалады.',
45:'GET серверден дерек алады және ресурстың күйін өзгертпеуі тиіс. POST жаңа ресурс құру үшін body ішіндегі деректерді жібереді. Біздің жобада GET фильмдер тізімін қайтарды, POST жаңа фильм қосты. POST-ты қайталау бірнеше жазба құруы мүмкін.',
47:f'PUT көрсетілген фильмнің барлық жазылатын өрісін ауыстырады. DELETE берілген ID бойынша фильмді жояды. Тексеруде ID={mid} фильмі жаңартылып, кейін жойылды. Сеансы бар фильмді жою 409 Conflict жауабымен тоқтатылады.',
49:'JSON құрылымды деректерді мәтін түрінде жеткізеді. Объект, массив, жол, сан, boolean және null мәндерін қолдайды. Фильмнің title, genre_id, rating және басқа өрістері JSON арқылы берілді. Мысалы, rating: 8.5 сан болып жіберіледі, ал «8.5» жолы қабылданбайды.',
51:'Node.js JavaScript кодын серверде орындайды. Express маршруттарды, middleware және JSON жауаптарын өңдеуді жеңілдетеді. mssql деректер қорымен байланысады. Жобада Express /api/movies ресурсындағы сұраныстарды өңдеп, нәтиже SQL Server-де сақталды.',
53:'Postman-да әдіс пен URL таңдалады. POST және PUT үшін Body raw JSON бөліміне деректер енгізіледі. Send орындалғаннан кейін статус пен JSON тексеріледі. Коллекция Runner немесе Newman арқылы ретімен орындалады. Бұл жұмыста 201, 200, 400, 404, 409 және басқа күтілетін статустар тексерілді.',
54:'7. Қорытынды',
55:'Cinema Information System жобасында фильмдерге арналған толық REST API әзірленіп, CinemaSchoolDB деректер қорымен байланыстырылды. Қосу, оқу, жаңарту, жою және жойылған фильмді іздеу орындалды. SQL SELECT нәтижелері деректердің сақталуын растады. Postman коллекциясының 25 сұранысы мен 94 assertion сәтті өтті. Осылайша клиент, API сервері және SQL Server арасындағы әрекеттесу тәжірибеде көрсетілді.',
56:'Жұмыс жергілікті оқу ортасында тексерілді. Уақытша тест фильмдері тазаланып, бастапқы каталогтағы 24 фильм сақталды.'}
for i,value in replacements.items():text(paras[i],value)

# Keep heading/answer and image/caption pairs together. Preserve the source rhythm.
for i in range(36,54,2):prop(paras[i],'keepNext');prop(paras[i],'keepLines')
for i in [23,25,27,29,31,33]:prop(paras[i],'keepNext');prop(paras[i],'keepLines')
for i in [24,26,28,30,32,34]:
    prop(paras[i],'keepNext','0');prop(paras[i],'keepLines')
    for r in paras[i].findall('w:r',ns):
        pr=r.find('w:rPr',ns)
        if pr is None:pr=etree.Element(tag('w:rPr'));r.insert(0,pr)
        etree.SubElement(pr,tag('w:i'))
for i in [22,27,31,35,46]:prop(paras[i],'pageBreakBefore')

# Preserve the same six-record table while updating every resource and result.
rows=[['Әдіс','Endpoint','Нәтиже'],['GET','/api/movies','200 OK фильмдер тізімі'],
      ['GET',f'/api/movies/{mid}','200 OK ID бойынша фильм'],
      ['POST','/api/movies',f'201 Created ID={mid}'],
      ['PUT',f'/api/movies/{mid}','200 OK рейтинг 9.1'],
      ['DELETE',f'/api/movies/{mid}','200 OK фильм жойылды'],
      ['GET',f'/api/movies/{mid}','404 Not Found']]
table=body.find('w:tbl',ns)
for tr,values in zip(table.findall('w:tr',ns),rows):
    for tc,value in zip(tr.findall('w:tc',ns),values):text(tc.find('w:p',ns),value)

# Replace original images, maintaining the real relationship IDs.
image_files=['02-create-201.png','18-sql-before.png','04-update-200.png','19-sql-after.png','05-delete-200.png','06-not-found-404.png']
rels=etree.fromstring(parts['word/_rels/document.xml.rels'])
relmap={r.get('Id'):r.get('Target') for r in rels}
drawings=doc.findall('.//wp:inline',ns)
assert len(drawings)==len(image_files)==6
changed_media=[]
for drawing,filename in zip(drawings,image_files):
    blip=drawing.find('.//a:blip',ns)
    target='word/'+relmap[blip.get(tag('r:embed'))]
    parts[target]=(shots/filename).read_bytes();changed_media.append(target)
    with Image.open(shots/filename) as image:w,h=image.size
    cx=5486400;cy=round(cx*h/w)
    for ext in drawing.findall('wp:extent',ns)+drawing.findall('.//a:xfrm/a:ext',ns):
        ext.set('cx',str(cx));ext.set('cy',str(cy))
    for pr in drawing.findall('wp:docPr',ns):pr.set('descr',filename);pr.set('title',filename)

# The template's title rule is removed, retaining its actual Title paragraph style.
styles=etree.fromstring(parts['word/styles.xml'])
title=next(n for n in styles if n.get(tag('w:styleId'))=='Title')
for border in title.findall('w:pPr/w:pBdr',ns):border.getparent().remove(border)
color=title.find('w:rPr/w:color',ns)
for key in list(color.attrib):del color.attrib[key]
color.set(tag('w:val'),'000000')
parts['word/styles.xml']=etree.tostring(styles,xml_declaration=True,encoding='UTF-8',standalone=True)
parts['word/document.xml']=etree.tostring(doc,xml_declaration=True,encoding='UTF-8',standalone=True)
core=etree.fromstring(parts['docProps/core.xml'])
core_ns={'dc':'http://purl.org/dc/elements/1.1/','cp':'http://schemas.openxmlformats.org/package/2006/metadata/core-properties'}
for name,value in [('dc:title','Кинотеатрдың REST API зертханалық жұмысы 10'),('dc:creator','Бақтыбек Сырым Абайұлы'),('cp:lastModifiedBy','Бақтыбек Сырым Абайұлы'),('dc:subject','Cinema Information System HTTP REST API')]:
    prefix,key=name.split(':');qualified='{'+core_ns[prefix]+'}'+key
    item=core.find(qualified)
    if item is None:item=etree.SubElement(core,qualified)
    item.text=value
parts['docProps/core.xml']=etree.tostring(core,xml_declaration=True,encoding='UTF-8',standalone=True)

# Copy all source entries with their metadata; only the documented slots may change.
with ZipFile(out,'w') as dest:
    for info in z.infolist():dest.writestr(copy.copy(info),parts[info.filename])
allowed={'word/document.xml','word/styles.xml','docProps/core.xml',*changed_media}
with ZipFile(out) as final:
    assert final.testzip() is None
    changed={name for name in parts if z.read(name)!=final.read(name)}
    assert changed<=allowed,changed-allowed
    assert final.read('word/_rels/document.xml.rels')==z.read('word/_rels/document.xml.rels')
    final_xml=final.read('word/document.xml').decode('utf8')
    for token in ['Prescription','medicines','medicine_id','Ділдабек','Іңкәр','№9','CinemaLab9']:
        assert token not in final_xml,token
    assert doc.find('w:body/w:sectPr',ns) is not None
assert hashlib.sha256(reference.read_bytes()).hexdigest()==expected_hash
markdown=[]
for element in body:
    if element.tag==tag('w:p'):
        value=''.join(element.findall('.//w:t',ns)[i].text or '' for i in range(len(element.findall('.//w:t',ns))))
        style=element.find('w:pPr/w:pStyle',ns)
        style_id=style.get(tag('w:val')) if style is not None else ''
        prefix={'Title':'# ','Heading1':'## ','Heading2':'### '}.get(style_id,'')
        if value:markdown.append(prefix+value+'\n')
        for drawing in element.findall('.//wp:inline',ns):
            filename=drawing.find('wp:docPr',ns).get('descr')
            markdown.append(f'![Практикалық нәтиже](evidence/screenshots/{filename})\n')
    elif element.tag==tag('w:tbl'):
        values=[[''.join(tc.itertext()) for tc in row.findall('w:tc',ns)] for row in element.findall('w:tr',ns)]
        markdown.append('| '+' | '.join(values[0])+' |\n| --- | --- | --- |\n'+'\n'.join('| '+' | '.join(row)+' |' for row in values[1:])+'\n')
(ROOT/'docs/lab10/REPORT.md').write_text('\n'.join(markdown),encoding='utf8')
print(out)
print('Reference preserved; package parts:',len(parts),'changed:',len(changed),'movie ID:',mid)
