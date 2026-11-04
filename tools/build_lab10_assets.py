"""Regenerate the portable OpenAPI document and Postman collection (no database writes)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def write(path, value):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

movie = dict(title='Lab10 | Қазақша фильм', genre_id='{{genreId}}', duration_min=110,
             age_rating=12, release_year=2026, rating=8.5, description='REST API арқылы қосылған уақытша оқу фильмі.')
def raw_movie(**changes):
    return json.dumps({**movie, **changes}, ensure_ascii=False, indent=2).replace('"{{genreId}}"', '{{genreId}}')

items = []
def request(name, method, path, status, body=None, checks=(), code=None, content='application/json'):
    script = [f'pm.test("HTTP {status}", () => pm.response.to.have.status({status}));',
              'pm.test("JSON response", () => pm.response.to.be.json);']
    if code:
        script += [f'pm.test("Error code", () => pm.expect(pm.response.json().code).to.eql("{code}"));',
                   'pm.test("Readable error", () => pm.expect(pm.response.json().error).to.be.a("string").and.not.empty);']
    script += list(checks)
    value = {'name': name, 'request': {'method': method, 'header': [], 'url': '{{baseUrl}}' + path},
             'event': [{'listen': 'test', 'script': {'type': 'text/javascript', 'exec': script}}]}
    if body is not None:
        value['request'].update(header=[{'key':'Content-Type','value':content}], body={'mode':'raw','raw':body,'options':{'raw':{'language':'json'}}})
    items.append(value)

request('01 | SQL Server health', 'GET', '/api/health', 200, checks=[
    'pm.test("Real database", () => pm.expect(pm.response.json().db_name).to.eql("CinemaSchoolDB"));'])
request('02 | Genres for the test movie', 'GET', '/api/metadata', 200, checks=[
    'pm.test("Genres available", () => pm.expect(pm.response.json().genres.length).to.be.above(0));',
    'pm.collectionVariables.set("genreId", pm.response.json().genres[0].genre_id);'])
request('03 | READ all movies', 'GET', '/api/movies', 200, checks=[
    'pm.test("Movie array", () => pm.expect(pm.response.json()).to.be.an("array"));',
    'pm.collectionVariables.set("initialCount", pm.response.json().length);'])
request('04 | Existing session for FK protection', 'GET', '/api/sessions', 200, checks=[
    'pm.test("Seed sessions available", () => pm.expect(pm.response.json().length).to.be.above(0));',
    'pm.collectionVariables.set("protectedMovieId", pm.response.json()[0].movie_id);'])
request('05 | CREATE movie', 'POST', '/api/movies', 201, raw_movie(), checks=[
    'const movie = pm.response.json(); pm.collectionVariables.set("movieId", movie.movie_id);',
    'pm.test("Generated ID", () => pm.expect(movie.movie_id).to.be.a("number").above(0));',
    'pm.test("Location", () => pm.expect(pm.response.headers.get("Location")).to.eql("/api/movies/" + movie.movie_id));',
    'pm.test("Kazakh text round trip", () => pm.expect(movie.title).to.eql("Lab10 | Қазақша фильм"));'])
request('06 | READ created movie by ID', 'GET', '/api/movies/{{movieId}}', 200, checks=[
    'pm.test("Saved in database", () => pm.expect(pm.response.json().movie_id).to.eql(Number(pm.collectionVariables.get("movieId"))));',
    'pm.test("Genre joined", () => pm.expect(pm.response.json().genre_name).to.be.a("string"));'])
request('07 | UPDATE full movie', 'PUT', '/api/movies/{{movieId}}', 200,
        raw_movie(title='Lab10 | Жаңартылған фильм', rating=9.1), checks=[
    'pm.test("Updated rating", () => pm.expect(pm.response.json().rating).to.eql(9.1));'])
request('08 | READ verifies persistence', 'GET', '/api/movies/{{movieId}}', 200, checks=[
    'pm.test("Persisted title", () => pm.expect(pm.response.json().title).to.eql("Lab10 | Жаңартылған фильм"));',
    'pm.test("Persisted rating", () => pm.expect(pm.response.json().rating).to.eql(9.1));'])
request('09 | Reject missing fields', 'POST', '/api/movies', 400, '{}', code='VALIDATION_ERROR')
request('10 | Reject invalid rating', 'PUT', '/api/movies/{{movieId}}', 400, raw_movie(rating=10.5), code='VALIDATION_ERROR')
request('11 | Reject nonexistent genre', 'POST', '/api/movies', 400, raw_movie(genre_id=2147483647), code='GENRE_NOT_FOUND')
request('12 | Reject SQL injection in ID', 'GET', '/api/movies/1%20OR%201=1', 400, code='INVALID_ID')
request('13 | Reject SQL INT overflow', 'GET', '/api/movies/2147483648', 400, code='INVALID_ID')
request('14 | Missing movie returns 404', 'GET', '/api/movies/2147483647', 404, code='MOVIE_NOT_FOUND')
request('15 | Update missing movie returns 404', 'PUT', '/api/movies/2147483647', 404, raw_movie(), code='MOVIE_NOT_FOUND')
request('16 | Protect movie with sessions', 'DELETE', '/api/movies/{{protectedMovieId}}', 409, code='MOVIE_HAS_SESSIONS')
request('17 | Reject malformed JSON', 'POST', '/api/movies', 400, '{"title":', code='INVALID_JSON')
request('18 | Reject wrong Content-Type', 'POST', '/api/movies', 415, '{}', content='text/plain', code='UNSUPPORTED_MEDIA_TYPE')
request('19 | Reject oversized JSON', 'POST', '/api/movies', 413, json.dumps({'title':'x'*17000}), code='PAYLOAD_TOO_LARGE')
request('20 | Unsupported method', 'PATCH', '/api/movies/{{movieId}}', 405, code='METHOD_NOT_ALLOWED')
request('21 | Unknown API route', 'GET', '/api/no-such-route', 404, code='ROUTE_NOT_FOUND')
request('22 | DELETE created test movie', 'DELETE', '/api/movies/{{movieId}}', 200, checks=[
    'pm.test("Deleted own fixture", () => pm.expect(pm.response.json().movie_id).to.eql(Number(pm.collectionVariables.get("movieId"))));'])
request('23 | READ after delete', 'GET', '/api/movies/{{movieId}}', 404, code='MOVIE_NOT_FOUND')
request('24 | DELETE again returns 404', 'DELETE', '/api/movies/{{movieId}}', 404, code='MOVIE_NOT_FOUND')
request('25 | Original catalog count restored', 'GET', '/api/movies', 200, checks=[
    'pm.test("No leftover test movie", () => pm.expect(pm.response.json().length).to.eql(Number(pm.collectionVariables.get("initialCount"))));'])

write('postman/CinemaLab10.postman_collection.json', {
    'info': {'name':'Cinema | Lab 10 | REST API + SQL Server', '_postman_id':'1f08c022-58dc-478a-bd91-c18dbdb15c12',
             'schema':'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
             'description':'Run in order, one iteration, against the local educational CinemaSchoolDB. Creates and deletes only its own temporary movie; verifies FK protection on an existing movie. No credentials included.'},
    'variable':[{'key':key,'value':value} for key,value in [('baseUrl','http://127.0.0.1:3000'),('genreId',''),('movieId',''),('protectedMovieId',''),('initialCount','')]],
    'item': items})
write('postman/Local.postman_environment.json', {'id':'86b9f019-630b-4e80-ab7b-15f02ff14555', 'name':'Cinema Local',
      'values':[{'key':'baseUrl','value':'http://127.0.0.1:3000','enabled':True,'type':'default'}], '_postman_variable_scope':'environment'})

properties = {
    'title': {'type':'string','minLength':1,'maxLength':150,'pattern':r'\S'},
    'genre_id': {'type':'integer','minimum':1,'maximum':2147483647},
    'duration_min': {'type':'integer','minimum':1,'maximum':600},
    'age_rating': {'type':'integer','enum':[0,6,12,16,18,21]},
    'release_year': {'type':'integer','minimum':1888,'maximum':2100},
    'rating': {'type':'number','minimum':0,'maximum':10,'multipleOf':0.1},
    'description': {'type':'string','minLength':1,'maxLength':400,'pattern':r'\S'}}
ref = lambda name: {'$ref':f'#/components/schemas/{name}'}
def response(description, schema):
    return {'description':description,'content':{'application/json':{'schema':schema}}}
def errors(*statuses):
    return {str(s):response({400:'Validation error / invalid ID or JSON / genre missing',404:'Movie not found',409:'Movie has sessions',413:'Payload exceeds 16 KB',415:'Content-Type must be application/json',500:'Internal server error',503:'Database unavailable'}[s],ref('Error')) for s in statuses}
id_param = {'name':'id','in':'path','required':True,'schema':{'type':'integer','minimum':1,'maximum':2147483647}}
write_body = {'required':True,'content':{'application/json':{'schema':ref('MovieInput'),'example':{**movie,'genre_id':1}}}}
paths = {
    '/api/movies': {
        'get': {'summary':'List movies ordered by rating, title, ID','operationId':'listMovies','responses':{'200':response('Movies',{'type':'array','items':ref('MovieRead')}),**errors(500,503)}},
        'post': {'summary':'Create a movie','operationId':'createMovie','requestBody':write_body,'responses':{'201':{**response('Created movie',ref('Movie')), 'headers':{'Location':{'schema':{'type':'string'},'description':'Relative URL of the created movie'}}},**errors(400,413,415,500,503)}}},
    '/api/movies/{id}': {
        'parameters':[id_param],
        'get':{'summary':'Read one movie','operationId':'getMovie','responses':{'200':response('Movie with genre',ref('MovieRead')),**errors(400,404,500,503)}},
        'put':{'summary':'Replace every writable field (full PUT)','operationId':'updateMovie','requestBody':write_body,'responses':{'200':response('Updated movie',ref('Movie')),**errors(400,404,413,415,500,503)}},
        'delete':{'summary':'Delete a movie with no sessions','operationId':'deleteMovie','responses':{'200':response('Deleted',{'type':'object','required':['message','movie_id'],'properties':{'message':{'type':'string'},'movie_id':{'type':'integer'}}}),**errors(400,404,409,500,503)}}},
    '/api/metadata':{'get':{'summary':'Genre and hall choices','operationId':'getMetadata','responses':{'200':response('Metadata',{'type':'object','required':['genres','halls'],'properties':{'genres':{'type':'array','items':{'type':'object','required':['genre_id','genre_name'],'properties':{'genre_id':{'type':'integer'},'genre_name':{'type':'string'}}}},'halls':{'type':'array','items':{'type':'object','required':['hall_id','hall_name'],'properties':{'hall_id':{'type':'integer'},'hall_name':{'type':'string'}}}}}}),**errors(500,503)}}},
    '/api/health':{'get':{'summary':'Database connectivity check','operationId':'getHealth','responses':{'200':response('Database is reachable',{'type':'object','required':['db_name','movies'],'properties':{'db_name':{'type':'string'},'movies':{'type':'integer'}}}),**errors(500,503)}}}}
for endpoint in ['/api/movies','/api/movies/{id}']:
    paths[endpoint]['options']={'summary':'Allowed methods','responses':{'204':{'description':'No content; Allow header lists supported methods'}}}
    for method in ['get','post','put','delete']:
        if method in paths[endpoint]: paths[endpoint][method]['responses']['405']=response('Method not allowed (Allow header)',ref('Error'))
write('docs/lab10/openapi.json', {'openapi':'3.0.3','info':{'title':'Cinema Lab 10 REST API','version':'1.1.0',
    'description':'Educational local CRUD API using Node.js, Express and Microsoft SQL Server. Existing cinema domain retained from Labs 6–9. No authentication: bind to loopback for this lab. Request body limit: 16 KB.'},
    'servers':[{'url':'http://127.0.0.1:3000'}],'paths':paths,'components':{'schemas':{
    'MovieInput':{'type':'object','additionalProperties':False,'required':list(properties),'properties':properties},
    'Movie':{'type':'object','required':['movie_id',*properties],'properties':{'movie_id':{'type':'integer','readOnly':True},**properties}},
    'MovieRead':{'allOf':[ref('Movie'),{'type':'object','required':['genre_name'],'properties':{'genre_name':{'type':'string'}}}]},
    'Error':{'type':'object','required':['error','code'],'properties':{'error':{'type':'string'},'code':{'type':'string'},'details':{'type':'array','items':{'type':'string'}}}}}}})
print(f'Generated OpenAPI 3.0.3 and {len(items)} Postman requests.')
