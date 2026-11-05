"""Create the six-request Postman Desktop demonstration from the full collection.
Creates only collection JSON; it sends no requests and changes no database rows.
"""
import copy
import json
from pathlib import Path

root=Path(__file__).resolve().parents[1]
source=json.loads((root/'postman/CinemaLab10.postman_collection.json').read_text(encoding='utf8'))
indexes=[2,5,4,6,21,22]
items=[copy.deepcopy(source['item'][i]) for i in indexes]
names=['01 GET барлық фильмдер','02 GET ID бойынша фильм','03 POST жаңа фильм қосу',
       '04 PUT фильмді жаңарту','05 DELETE тест фильмін жою','06 GET жойылған фильм үшін 404']
for item,name in zip(items,names):item['name']=name
# GET one uses a seed ID from GET all. Mutating calls use only their own POST ID.
items[0]['event'][0]['script']['exec'] += [
    'const rows = pm.response.json();',
    'pm.test("Seed movie available", () => pm.expect(rows.length).to.be.above(0));',
    'pm.collectionVariables.set("existingMovieId", rows[0].movie_id);',
    'pm.collectionVariables.set("genreId", rows[0].genre_id);']
items[1]['request']['url']='{{baseUrl}}/api/movies/{{existingMovieId}}'
items[1]['event'][0]['script']['exec']=[
    'pm.test("HTTP 200", () => pm.response.to.have.status(200));',
    'pm.test("Read by ID", () => pm.expect(pm.response.json().movie_id).to.eql(Number(pm.collectionVariables.get("existingMovieId"))));']
collection={
    'info':{'name':'Cinema Lab 10 | Апайға көрсету | 6 сұраныс',
      '_postman_id':'b54af093-7392-4e74-a123-aab1ec1e83b0',
      'schema':'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      'description':'10-Lab талабындағы алты тексеру. Алдымен серверді іске қосыңыз. Сұраныстарды 01–06 ретімен орындаңыз. POST құрған уақытша фильм ғана жаңартылады және жойылады.'},
    'variable':[{'key':key,'value':value} for key,value in [
      ('baseUrl','http://127.0.0.1:3000'),('genreId',''),('existingMovieId',''),('movieId','')]],
    'item':items}
target=root/'postman/CinemaLab10_Demo.postman_collection.json'
target.write_text(json.dumps(collection,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(target)
