Prezentare generala
Scopul API
Oblio pune la dispozitie pentru dezvoltatori un API cu ajutorul caruia puteti avea acces la diferite facilitati cum ar fi:

Vizualizare nomenclatoare;
Emitere proforme, avize, facturi, facturi pe baza de proforma sau aviz;
Vizualizare factura, proforma sau aviz;
Anulare factura, proforma sau aviz;
Restaurare factura, proforma sau aviz;
Stergere factura, proforma sau aviz;
Raspunsurile vin in format JSON, daca cererea a fost facuta cu succes se va trimite de catre server un cod de status 200, daca cererea nu este facuta cu succes se va trimite un cod de status 400 sau 401 cu un mesaj de eroare.

Pe pagina noastra de GitHub https://github.com/OblioSoftware veti gasi exemple de implementare ale API-ului.

Autorizare
Generare token de acces
https://www.oblio.eu/api/authorize/token - POST
Oblio REST API foloseste modulul OAuth 2.0 pentru autorizare. Acesta are nevoie de parametrul "client_id" care reprezinta email-ul cu care va autentificati in Oblio si "client_secret" care este un token pe care il gasiti in cont in sectiunea "Setari" > "Date Cont". Pentru securitate, token-ul "client_secret" se regenereaza de fiecare data cand se reseteaza parola. Pentru obtinerea token-ului de acces se trimite o cerere prin metoda "POST" impreuna cu parametrii "client_id" si "client_secret" catre adresa https://www.oblio.eu/api/authorize/token

Exemplu
curl -H "Content-Type: application/x-www-form-urlencoded" -d "client_id=nume@exemplu.com&client_secret=1edd9e4f6..." -X POST https://www.oblio.eu/api/authorize/token
Raspuns
{
"access_token": "67d6f8817c28d698bdae35728c7a30b02a75bd4d",
"expires_in": "3600",
"token_type": "Bearer",
"scope": "",
"request_time": "1540471129"
}
Toate celelalte cereri catre Oblio REST API se fac folosind header-ul "Authorization" cu valoarea "Bearer {access_token}" unde {access_token} se obtine din cererea de mai sus.

Limitarile de utilizare a API-ului sunt urmatoarele:

30 de cereri la 100 de secunde pentru cererile care genereaza documente (facturi, proforme etc.).
30 de cereri la 10 secunde pentru orice tip de cerere care nu presupune generarea unui document prin API.
Nomenclatoare
Nomenclator companii
https://www.oblio.eu/api/nomenclature/companies - GET
Returneaza lista de companii asociate cu contul Oblio

Exemplu
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -X GET https://www.oblio.eu/api/nomenclature/companies
Raspuns
{
"status": 200,
"statusMessage": "Success",
"data": [
{
"cif": "RO37311090",
"company": "OBLIO SOFTWARE SRL",
"userTypeAccess": "admin"
}
]
}
Nomenclator cote TVA
https://www.oblio.eu/api/nomenclature/vat_rates - GET
Returneaza lista de cote TVA pentru o anumita firma

Parametru Explicatie
cif \* CIF-ul firmei
Exemplu
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -X GET "https://www.oblio.eu/api/nomenclature/vat_rates?cif=RO37311090"
Raspuns
{
"status": 200,
"statusMessage": "Success",
"data": [
{
"name": "Normala",
"percent": 19,
"default": true
},
{
"name": "Redusa",
"percent": 9,
"default": false
},
{
"name": "SFDD",
"percent": 0,
"default": false
}
]
}
Nomenclator clienti
https://www.oblio.eu/api/nomenclature/clients - GET
Returneaza lista de clienti pentru o anumita firma

Parametru Explicatie
cif \* CIF-ul firmei
name Numele clientului cautat
clientCif Ciful clientului cautat
offset Vor aparea initial maxim 250 de rezultate, este de preferat sa fie multiplu de 250 (0, 250, 500 etc.), valoarea implicita este 0
Exemplu
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -X GET "https://www.oblio.eu/api/nomenclature/clients?cif=RO37311090"
Raspuns
{
"status": 200,
"statusMessage": "Success",
"data": [
{
"cif": "RO37311090",
"name": "OBLIO SOFTWARE SRL",
"rc": "J13/887/2017",
"code": "",
"address": "",
"state": "Constanta",
"city": "Constanta",
"country": "",
"iban": "",
"bank": "",
"email": "",
"phone": "",
"contact": "",
"vatPayer": true
}
]
}
Nomenclator produse
https://www.oblio.eu/api/nomenclature/products - GET
Returneaza lista de produse pentru o anumita firma. Pentru servicii nu se tine cont de gestiunea unde se afla si deci nu apare rubrica "stock".

Parametru Explicatie
cif \* CIF-ul firmei
name Numele produsului cautat
code Codul produsului cautat
management Gestiunea in care se face cautarea (La folosirea acestui parametru produsele vor aparea listate ca serviciile)
workStation Punctul de lucru al gestiunii in care se face cautarea
offset Vor aparea initial maxim 250 de rezultate, este de preferat sa fie multiplu de 250 (0, 250, 500 etc.), valoarea implicita este 0
Exemplu
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -X GET "https://www.oblio.eu/api/nomenclature/products?cif=RO37311090"
Raspuns
{
"status": 200,
"statusMessage": "Success",
"data": [
{
"name": "Montare",
"code": "",
"description": "",
"measuringUnit": "buc",
"productType": "Serviciu",
"price": "119.00",
"currency": "RON",
"vatName": "Normala",
"vatPercentage": 19,
"vatIncluded": true
},
{
"name": "Birou",
"code": "",
"description": "",
"measuringUnit": "buc",
"productType": "Marfa",
"stock": [
{
"workStation": "Sediu",
"management": "Magazin",
"quantity": 2,
"price": "200.00",
"currency": "RON",
"vatName": "Normala",
"vatPercentage": 19,
"vatIncluded": false
}
]
}
]
}
Nomenclator serii documente
https://www.oblio.eu/api/nomenclature/series - GET
Returneaza lista de serii documente pentru o anumita firma

Parametru Explicatie
cif \* CIF-ul firmei
Exemplu
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -X GET "https://www.oblio.eu/api/nomenclature/series?cif=RO37311090"
Raspuns
{
"status": 200,
"statusMessage": "Success",
"data": [
{
"type": "Factura",
"name": "FCT",
"start": "0001",
"next": "0051",
"default": true
},
{
"type": "Proforma",
"name": "PR",
"start": "0001",
"next": "0008",
"default": true
}
]
}
Nomenclator limbi
https://www.oblio.eu/api/nomenclature/languages - GET
Returneaza lista de limbi straine pentru o anumita firma

Parametru Explicatie
cif \* CIF-ul firmei
Exemplu
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -X GET "https://www.oblio.eu/api/nomenclature/languages?cif=RO37311090"
Raspuns
{
"status": 200,
"statusMessage": "Success",
"data": [
{
"code": "EN",
"name": "Engleza"
},
{
"code": "FR",
"name": "Franceza"
}
]
}
Nomenclator gestiuni
https://www.oblio.eu/api/nomenclature/management - GET
Returneaza lista de gestiuni pentru o anumita firma, functioneaza doar daca sunt activate stocurile

Parametru Explicatie
cif \* CIF-ul firmei
Exemplu
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -X GET "https://www.oblio.eu/api/nomenclature/management?cif=RO37311090"
Raspuns
{
"status": 200,
"statusMessage": "Success",
"data": [
{
"management": "Magazin",
"workStation": "Sediu",
"managementType": "Cantitativ Valorica"
},
{
"management": "Mobila",
"workStation": "Depozit",
"managementType": "Cantitativ Valorica"
}
]
}
Emitere documente
Emitere proforma
Emiterea de documente folosind Oblio REST API se face prin metoda POST trimitand datele in forma RAW in format JSON.

https://www.oblio.eu/api/docs/proforma - POST
Emiterea proformelor se face cu urmatorii parametrii:

Parametri document
Parametru Explicatie
cif _ CIF-ul firmei de unde se emit facturi. Il gasiti la Oblio.eu > Setari > Date firma
client _ Necesita anumiti parametri. Acestia se gasesc in zona "Parametri client"
clientLocation Necesita anumiti parametri. Acestia se gasesc in zona "Punct de Lucru Client"
issueDate Data emiterii in format AAAA-LL-ZZ, valoare implicita este ziua curenta
dueDate Data scadentei in format AAAA-LL-ZZ
seriesName \* Nume serie document (se gaseste in nomenclator serii documente)
disableAutoSeries Dezactivare numerotarea automata, ia valorile 0 sau 1. Valoarea implicita este 0
number Se trece in cazul in care in care parametrul `disableAutoSeries` are valoare 1
language Codul de limba in care se emite factura (se gasesc limbile disponibile in nomenclator), valoarea implicita este "RO"
precision Precizia documentului. Trebuie sa fie un numar intreg cu valoarea intre 2 si 4, valoarea implicita este 2
currency Moneda documentului, valoarea implicita este "RON"
exchangeRate Rata de schimb in cazul documentelor in valuta, valoare implicita este cursul setat in setarile companiei
products Este un tablou cu produse. Parametrii pentru produse se gasesc in zona "Parametri produs"
issuerName Intocmit de
issuerId CNP-ul celui care a intocmit documentul
noticeNumber Nr. aviz insotire (BT-16)
internalNote Nota interna (nu va fi vizibila pentru client)
deputyName Delegat
deputyIdentityCard Carte Identitate delegat
deputyAuto Auto delegat
selesAgent Agent vanzari
mentions Mentiuni
workStation Punct de lucru. Este valabil doar dupa activarea stocurilor, valoarea implicita este "Sediu"
sendEmail Daca are valoarea 1 se va trimite email-ul de la Setari > E-mail-uri alarma > Document prin email
orderNumber Numar comanda (BT-13)
contractNumber Numar contract (BT-12)
receptionNotice Referinta proiectului (BT-11)
projectNumber Identificator cumparator (BT-46)
buyerIdentifier Numar aviz receptie (BT-15)
clientAccountReference Referinta contabila cumparator (BT-19)
idempotencyKey Cheie unica pentru a evita dublarea

Parametri client
Parametru Explicatie
cif CIF-ul firmei sau CNP-ul clientului
name \* Numele (pentru persoanelor fizice) sau a numele firmei (pentru persoane juridice)
rc Numar Registru Comert
code Cod client
address Adresa
state Judet
city Oras
country Tara
iban IBAN
bank Banca
email Email
phone Numar de telefon
contact Persoana de contact
vatPayer Platitor de TVA, ia valorile 0 sau 1
save Sa schimbe sau nu datele clientului, ia valorile 0 sau 1. Valoarea implicita este 0
autocomplete Daca este completat parametrul "cif" cu o firma din Romania, datele se preiau automat, ia valorile 0 sau 1. Valoarea implicita este 0

Punct de Lucru Client
Parametru Explicatie
name Nume Punct Lucru* (apare pe factura)
identity Identificator* (BT-71)
country Tara* (BT-80)
state Judet* (BT-79)
city Localitate* (BT-77)
address Adresa (strada, numar, ..)* (BT-75)
postalCode Cod postal (BT-78)

Parametri produs
Parametru Explicatie
name _ Numele produsului
code Codul produsului (BT-155)
codeClient Codul EAN (BT-156)
codeEAN Codul EAN (BT-157)
description Descrierea
price _ Pretul
measuringUnit Unitatea de masura a produsului, valoarea implicita este "buc"
currency Moneda
exchangeRate Rata de schimb a monezii in cazul in care aceasta este diferita de moneda documentului
vatName Numele cotei de TVA (se gaseste in nomenclator cote TVA)
vatPercentage Procentul cotei de TVA (se gaseste in nomenclator cote TVA)
vatIncluded TVA-ul este inclus in pretul produsului, ia valorile 0 sau 1, valoarea implicita este 1
quantity Cantitatea, valoare implicita este 1
management Numele gestiunii din care face parte produsul. Este valabil doar dupa activarea stocurilor pentru produse stocabile (nu este valabil pentru servicii)
productType Tip produs. Trebuie sa fie unul din "Marfa", "Materii prime", "Materiale consumabile", "Semifabricate", "Produs finit", "Produs rezidual", "Produse agricole", "Animale si pasari", "Ambalaje", "Obiecte de inventar", "Serviciu". Este valabil doar dupa activarea stocurilor
nameTranslation Numele produsului tradus (daca este cazul pentru facturile in alte limbi decat romana)
measuringUnitTranslation Unitatea de masura tradusa (daca este cazul pentru facturile in alte limbi decat romana)
save Salveaza pretul de lista. Poate sa fie 0 sau 1. Valoarea implicita este 1

Discounturi
Sunt elemente in lista de produse si au urmatorii parametrii:

Parametru Explicatie
name _ Numele care apare in dreptul discountului
discountType Discount procentual sau valoric, ia valorile "procentual" sau "valoric", valoarea implicita este "valoric"
discount _ Valoare discount
discountAllAbove Ia valoarea 1 daca este valabil pentru toate produsele fara discount dinaintea sa sau 0 doar pentru primul produs de deasupra sa, valoarea implicita este 0

Exemplu de fisier JSON
{
"cif": "RO37311090",
"client": {
"cif": "RO37311090",
"name": "OBLIO SOFTWARE SRL",
"rc": "J13/887/2017",
"code": "oblio",
"address": "",
"state": "Constanta",
"city": "Constanta",
"country": "",
"iban": "",
"bank": "",
"email": "",
"phone": "",
"contact": "",
"vatPayer": true
},
"issueDate": "2018-10-15",
"dueDate": "2018-10-30",
"seriesName": "PR",
"language": "RO",
"precision": 2,
"currency": "RON",
"products": [
{
"name": "Test",
"code": "test",
"description": "Descriere de test",
"price": 200,
"measuringUnit": "buc",
"vatName": "Normala",
"vatPercentage": 19,
"vatIncluded": 0,
"quantity": 2,
"productType": "Serviciu",
"management": "Magazin"
},
{
"name": "Discount 10% Test",
"discount": 10,
"discountType": "procentual"
}
],
"issuerName": "Ion Popescu",
"issuerId": 1234567890123,
"noticeNumber": "AVZ 0041",
"internalNote": "Proforma emisa din API",
"deputyName": "George Popescu",
"deputyIdentityCard": "ID 1234",
"deputyAuto": "CT 12345",
"selesAgent": "Marian Popescu",
"mentions": "Proforma de test emisa din API",
"workStation": "Sediu"
}
Exemplu de creare proforma
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -d @proforma.json -X POST https://www.oblio.eu/api/docs/proforma
Raspuns
{
"status": 200,
"statusMessage": "Success",
"data": {
"seriesName": "PR",
"number": "0008",
"link": "https://www.oblio.eu/utils/show_file/?ic=91467&id=261747&it=b8590b71a702ab3788f0dda5d5c77d23"
}
}
Emitere avize
https://www.oblio.eu/api/docs/notice - POST
Emiterea avizelor se face identic cu emiterea proformelor cu diferenta ca avizele nu au parametrul "noticeNumber" si au optiunea (in cazul in care este activat stocul) de a folosi parametrul "useStock" care are valoarea implicita 1

Emitere facturi
https://www.oblio.eu/api/docs/invoice - POST
Emiterea facturilor se face identic cu emiterea proformelor cu diferenta ca facturile mai au si urmatorii parametrii:

Parametri document
Parametru Explicatie
deliveryDate Data livrarii in format AAAA-LL-ZZ
collectDate Data incasarii in format AAAA-LL-ZZ
referenceDocument Document de referinta in cazul generarii de facturi pe baza de proforma sau de aviz. Vezi "Parametri document de referinta"
collect Incasare document. Vezi "Parametri incasare document"
useStock Descarcare pe gestiune (in cazul in care este activat stocul). Poate fi 0 sau 1
spvExtern Daca ai bifat aceasta optiune si ai activat din Setari>Preferinte Trimite automat e-Factura in SPV, factura se va trimite automat in SPV. Daca nu ai activata aceasta optiune, Trimite manual e-Factura in SPV.

Parametri document de referinta
Parametru Explicatie
type _ Tipul documentului de referinta (Factura, Proforma sau Aviz)
seriesName _ Numele seriei documentului de referinta
number \* Numarul seriei documentului de referinta
refund Sterge incasarea asociata cu factura stornata pentru "type" = "Factura". Poate fi 0 sau 1

Parametri incasare document
Parametru Explicatie
type \* Tipul de document cu care se face incasarea. Poate fi "Chitanta", "Bon fiscal", "Bon fiscal card", "Alta incasare numerar", "Ordin de plata", "Mandat postal", "Card", "CEC", "Bilet ordin", "Alta incasare banca","Ramburs"
seriesName Numele seriei chitantei. Trebuie definita in cazul in care incasarea se face prin chitanta
documentNumber Numarul documentului de incasare. Trebuie definit in cazul in care incasarea nu se face prin chitanta
value Valoarea incasata, valoarea implicita este totalul facturii care urmeaza sa fie incasata
issueDate Data emiterii in format AAAA-LL-ZZ, valoare implicita este ziua curenta (valabil pentru incasare factura)
mentions Mentiuni

Exemplu de fisier JSON pentru factura simpla
{
"cif": "RO37311090",
"client": {
"cif": "RO37311090",
"name": "OBLIO SOFTWARE SRL",
"rc": "J13/887/2017",
"code": "oblio",
"address": "",
"state": "Constanta",
"city": "Constanta",
"country": "",
"iban": "",
"bank": "",
"email": "",
"phone": "",
"contact": "",
"vatPayer": true
},
"issueDate": "2018-10-15",
"dueDate": "2018-10-30",
"deliveryDate":"2018-10-16",
"collectDate":"2018-10-29",
"seriesName": "FCT",
"language": "RO",
"precision": 2,
"currency": "RON",
"products": [
{
"name": "Test",
"code": "test",
"description": "Descriere de test",
"price": 200,
"measuringUnit": "buc",
"vatName": "Normala",
"vatPercentage": 19,
"vatIncluded": 0,
"quantity": 2,
"productType": "Serviciu",
"management": "Magazin"
},
{
"name": "Discount 10% Test",
"discount": 10,
"discountType": "procentual"
}
],
"issuerName": "Ion Popescu",
"issuerId": 1234567890123,
"noticeNumber": "AVZ 0041",
"internalNote": "Factura emisa din API",
"deputyName": "George Popescu",
"deputyIdentityCard": "ID 1234",
"deputyAuto": "CT 12345",
"selesAgent": "Marian Popescu",
"mentions": "Factura de test emisa din API",
"workStation": "Sediu"
}
Exemplu de creare factura
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -d @invoice.json -X POST https://www.oblio.eu/api/docs/invoice
Raspuns
{
"status": 200,
"statusMessage": "Success",
"data": {
"seriesName": "FCT",
"number": "0053",
"link": "https://www.oblio.eu/utils/show_file/?ic=91467&id=261751&it=bde87369631a5340057280037419f7e7"
}
}

Exemplu de fisier JSON pentru factura pe baza de proforma
{
"cif": "RO37311090",
"seriesName": "FCT",
"referenceDocument": {
"type": "Proforma",
"seriesName": "PR",
"number": 8
}
}

Exemplu de fisier JSON pentru stornare totala de factura
{
"cif": "RO37311090",
"seriesName": "FCT",
"referenceDocument": {
"type": "Factura",
"refund": 1,
"seriesName": "FCT",
"number": 568
}
}

Exemplu de fisier JSON pentru factura cu incasare
{
"cif": "RO37311090",
"client": {
"cif": "RO37311090",
"name": "OBLIO SOFTWARE SRL",
"rc": "J13/887/2017",
"code": "oblio",
"address": "",
"state": "Constanta",
"city": "Constanta",
"country": "",
"iban": "",
"bank": "",
"email": "",
"phone": "",
"contact": "",
"vatPayer": true
},
"issueDate": "2018-10-15",
"dueDate": "2018-10-30",
"seriesName": "FCT",
"language": "RO",
"precision": 2,
"currency": "RON",
"collect": {
"type": "Ordin de plata",
"documentNumber": "OP 7001"
},
"products": [
{
"name": "Test",
"code": "test",
"description": "Descriere de test",
"price": 200,
"measuringUnit": "buc",
"vatName": "Normala",
"vatPercentage": 19,
"vatIncluded": 0,
"quantity": 2,
"productType": "Serviciu",
"management": "Magazin"
},
{
"name": "Discount 10% Test",
"discount": 10,
"discountType": "procentual"
}
],
"workStation": "Sediu"
}
Incasare factura
Incasare factura
https://www.oblio.eu/api/docs/invoice/collect - PUT
Incasare facturilor se face cu urmatorii parametrii:

Parametri incasare factura
Parametru Explicatie
cif _ CIF-ul firmei
seriesName _ Numele seriei documentului
number _ Numarul seriei documentului
collect _ Incasare document. Vezi "Parametri incasare document"

Exemplu
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -H "Content-Type: application/x-www-form-urlencoded" -d "cif=RO37311090&seriesName=FCT&number=55&collect[type]=Ordin+de+plata&collect[documentNumber]=OP+7001" -X PUT https://www.oblio.eu/api/docs/invoice/collect
Raspuns
{
"status": 200,
"statusMessage": "",
"data": {
"documentType": "Factura",
"seriesName": "FCT",
"number": "0055",
"link": "https://www.oblio.eu/utils/show_file/?ic=91467&id=261753&it=8e4beb8abe58552dd702874addd1d518",
"collects": [
{
"issueDate": "2018-10-15",
"type": "Ordin de plata",
"number": "OP 7001",
"value": 428.4
}
]
}
}
Vizualizare documente
Vizualizare factura
https://www.oblio.eu/api/docs/invoice?cif={cif}&seriesName={seriesName}&number={number} - GET
Parametri vizualizare document
Parametru Explicatie
cif _ CIF-ul firmei
seriesName _ Numele seriei documentului
number \* Numarul seriei documentului

Exemplu
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -X GET "https://www.oblio.eu/api/docs/invoice?cif=RO37311090&seriesName=FCT&number=55"
Raspuns
{
"status": 200,
"statusMessage": "Success",
"data": {
"documentType": "Factura",
"seriesName": "FCT",
"number": "0055",
"link": "https://www.oblio.eu/utils/show_file/?ic=91467&id=261753&it=8e4beb8abe58552dd702874addd1d518",
"collects": [
{
"issueDate": "2018-10-15",
"type": "Ordin de plata",
"number": "OP 7001",
"value": 428.4
}
]
}
}
Vizualizare proforma
https://www.oblio.eu/api/docs/proforma?cif={cif}&seriesName={seriesName}&number={number} - GET
Parametrii sunt aceiasi ca la vizualizare factura

Vizualizare aviz
https://www.oblio.eu/api/docs/notice?cif={cif}&seriesName={seriesName}&number={number} - GET
Parametrii sunt aceiasi ca la vizualizare factura

Anulare documente
Anulare factura
https://www.oblio.eu/api/docs/invoice/cancel - PUT

Exemplu
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -H "Content-Type: application/x-www-form-urlencoded" -d "cif=RO37311090&seriesName=FCT&number=55" -X PUT https://www.oblio.eu/api/docs/invoice/cancel
Raspuns
{
"status": 200,
"statusMessage": "Documentul a fost anulat.",
"data": {
"documentType": "Factura",
"seriesName": "FCT",
"number": "0055",
"link": "https://www.oblio.eu/utils/show_file/?ic=91467&id=261753&it=8e4beb8abe58552dd702874addd1d518"
}
}

Parametri anulare document
Parametru Explicatie
cif _ CIF-ul firmei
seriesName _ Numele seriei documentului
number \* Numarul seriei documentului
Anulare proforma
https://www.oblio.eu/api/docs/proforma/cancel - PUT
Parametrii sunt aceiasi ca la anulare factura

Anulare aviz
https://www.oblio.eu/api/docs/notice/cancel - PUT
Parametrii sunt aceiasi ca la anulare factura

Restaurare documente
Restaurare factura
https://www.oblio.eu/api/docs/invoice/restore - PUT

Exemplu
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -H "Content-Type: application/x-www-form-urlencoded" -d "cif=RO37311090&seriesName=FCT&number=55" -X PUT https://www.oblio.eu/api/docs/invoice/restore
Raspuns
{
"status": 200,
"statusMessage": "Documentul a fost restaurat.",
"data": {
"documentType": "Factura",
"seriesName": "FCT",
"number": "0055",
"link": "https://www.oblio.eu/utils/show_file/?ic=91467&id=261753&it=8e4beb8abe58552dd702874addd1d518"
}
}

Parametri restaurare document
Parametru Explicatie
cif _ CIF-ul firmei
seriesName _ Numele seriei documentului
number \* Numarul seriei documentului
Restaurare proforma
https://www.oblio.eu/api/docs/proforma/restore - PUT
Parametrii sunt aceiasi ca la restaurare factura

Restaurare aviz
https://www.oblio.eu/api/docs/notice/restore - PUT
Parametrii sunt aceiasi ca la restaurare factura

Stergere documente
Stergere factura
https://www.oblio.eu/api/docs/invoice - DELETE
Functia de stergere se poate folosi doar pentru ultimul document din serie.

Exemplu
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -H "Content-Type: application/x-www-form-urlencoded" -d "cif=RO37311090&seriesName=FCT&number=55" -X DELETE https://www.oblio.eu/api/docs/invoice
Raspuns
{
"status": 200,
"statusMessage": "Documentul a fost sters.",
"data": {
"documentType": "Factura",
"seriesName": "FCT",
"number": "0055"
}
}

Parametri stergere document
Parametru Explicatie
cif _ CIF-ul firmei
seriesName _ Numele seriei documentului
number \* Numarul seriei documentului
deleteCollect Sterge incasarea asociata (in cazul facturilor). Valoarea implicita este `false`
idempotencyKey Cheie unica pentru a evita dublarea
Stergere proforma
https://www.oblio.eu/api/docs/proforma - DELETE
Parametrii sunt aceiasi ca la stergere factura

Stergere aviz
https://www.oblio.eu/api/docs/notice - DELETE
Parametrii sunt aceiasi ca la stergere factura

Raport documente
Listare facturi
https://www.oblio.eu/api/docs/invoice/list - GET
Functia de listare a facturilor emise in Oblio.

Exemplu
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -X GET "https://www.oblio.eu/api/docs/invoice/list?cif=RO37311090&seriesName=FCT&number=55&issuedAfter=2023-08-01&issuedBefore=2023-08-31&client[cif]=1111"
Raspuns
{
"status": 200,
"statusMessage": "Success",
"data": [
{
"id": "105595937",
"draft": "0",
"canceled": "0",
"seriesName": "FCT",
"number": "0126",
"issueDate": "2023-05-30",
"dueDate": "2023-05-30",
"precision": "2",
"currency": "RON",
"exchangeRate": "0.000000",
"total": "51.2700",
"issuerName": "",
"issuerId": "",
"noticeNumber": "",
"deputyName": "",
"deputyIdentityCard": "",
"deputyAuto": "",
"mentions": "",
"useStock": "0",
"indexUpload": null,
"idDownload": null,
"type": "Factura",
"link": "https://www.oblio.eu/utils/show_file/?ic=306625&id=105595937&it=e54c982243d86b513c3942f2f0a4502c&preload=1",
"einvoice": "https://www.oblio.eu/utils/show_file/?ic=306625&id=105595937&it=e54c982243d86b513c3942f2f0a4502c&einvoice=1&api=1",
"einvoiceStatus": {
"text": "Neconfigurat",
"sent": false,
"code": -1
},
"client": {
"clientId": "2960257",
"cif": "1111",
"name": "CONCEPT S.A.",
"rc": "J40/1090/1991",
"code": "",
"address": "SECTOR 2, B-DUL PACHE PROTOPOPESCU, NR.109, ET.3",
"state": "BUCUREŞTI",
"city": "MUNICIPIUL BUCUREŞTI",
"country": "",
"iban": "",
"bank": "",
"contact": "",
"phone": "",
"email": "",
"vatPayer": "0"
}
}
]
}

Parametri listare documente
Parametru Explicatie
cif \* CIF-ul firmei
seriesName Filtru dupa Numele seriei
number Filtru dupa Numarul documentului
id Filtru dupa id
client Filtru dupa Client. Contine un array/map cu "cif", "email", "phone" sau "code"
draft Filtru dupa Document draft. Poate lua valorile -1 - este ignorat, 0 - nu sunt draft, 1 - sunt draft
canceled Filtru dupa Document anulat. Poate lua valorile -1 - este ignorat, 0 - nu sunt anulate, 1 - sunt anulate
collected Filtru dupa Document incasat. Poate lua valorile -1 - este ignorat, 0 - nu sunt incasate, 1 - sunt incasate
issuedAfter Filtru dupa Data de inceput in format AAAA-LL-ZZ
issuedBefore Filtru dupa Data de sfarsit in format AAAA-LL-ZZ
withProducts Include si produsele din factura in rezultat
withCollects Include si incasarile din factura in rezultat
withEinvoiceStatus Include status-ul facturilor din SPV
orderBy Ordonare dupa: id, issueDate, number
orderDir Ordonare ASC/DESC
limitPerPage Rezultate pe pagina. Maxim 100
offset Vor aparea initial maxim 100 de rezultate, este de preferat sa fie multiplu de 100 (0, 100, 100 etc.), valoarea implicita este 0
SPV
Trimite factura in SPV
https://www.oblio.eu/api/docs/einvoice - POST
Functia de Trimite factura in SPV pentru facturile emise in Oblio.

Exemplu
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -X POST "https://www.oblio.eu/api/docs/einvoice" -d "cif=RO37311090&seriesName=FCT&number=55"
Raspuns
{
"status": 200,
"statusMessage": "Success",
"data": {
"text": "e-Factura trimisa cu succes in SPV.",
"sent": true,
"code": 0
}
}

Parametri pentru Trimite factura in SPV
Parametru Explicatie
cif _ CIF-ul firmei
seriesName _ Filtru dupa Numele seriei
number \* Filtru dupa Numarul documentului

Raspuns
Parametru Explicatie
text Tip text. Explicatie.
sent Tip bool. Status trimisa/netrimisa.
code Tip int. Poate lua valorile:
-1 = e-Factura netrimisa in SPV.
2 = e-Factura are erori si nu a fost trimisa in SPV.
0 = e-Factura a ajuns in SPV si este in prelucrare.
1 = e-Factura trimisa cu succes in SPV.
Descarca arhiva SPV
https://www.oblio.eu/api/docs/einvoice - GET
Functia de descarcare arhiva SPV pentru facturile emise in Oblio.

Exemplu
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -X GET "https://www.oblio.eu/api/docs/einvoice?cif=RO37311090&seriesName=FCT&number=55"

Parametri descarcare arhiva SPV
Parametru Explicatie
cif _ CIF-ul firmei
seriesName _ Filtru dupa Numele seriei
number \* Filtru dupa Numarul documentului
Webhooks
Permite aplicatiei dvs. sa fie notificata atunci cand se produce o actiune in Oblio.

Acestea functioneaza pe modelul pub/sub in care aplicatia externa se aboneaza la un topic si primeste update-uri atunci cand este cazul.

Creare webhook
https://www.oblio.eu/api/webhooks - POST
Exemplu
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -H "Content-Type: application/json" -d "{\"cif\": 37311090, \"topic\": \"stock\", \"endpoint\": \"https://exemplu.com/update-stock/\"}" -X POST https://www.oblio.eu/api/webhooks
Raspuns
{
"status": 200,
"statusMessage": "Success",
"data": {
"cif": "37311090",
"topic": "stock",
"endpoint": "https://exemplu.com/update-stock/",
"id": "123"
}
}
Parametru Explicatie
cif _ CIF-ul firmei
topic _ Evenimentul la care doriti sa va abonati. Poate fi: "stock", "Invoice/SaveDraft", "Proforma/SaveDraft", "Notice/SaveDraft", "TaxReceipt/SaveDraft", "Invoice/Update", "Proforma/Update", "Notice/Update", "Invoice/Cancel", "Proforma/Cancel", "Notice/Cancel", "TaxReceipt/Cancel", "Collect/Inserted"
endpoint \* Adresa la care se trimit notificari. Aceasta trebuie sa raspunda cu status code 200 si sa afiseze valoarea encodata base64 a header-ului "X-Oblio-Request-Id" trimis in request
Listare webhooks
https://www.oblio.eu/api/webhooks - GET
Exemplu
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -H "Content-Type: application/json" -X GET https://www.oblio.eu/api/webhooks
Raspuns
{
"status": 200,
"statusMessage": "Success",
"data": [
{
"cif": "37311090",
"topic": "stock",
"endpoint": "https://exemplu.com/update-stock/",
"id": "123"
}
]
}
Stergere webhook
https://www.oblio.eu/api/webhooks/{id} - DELETE
Exemplu
curl -H "Authorization: Bearer 67d6f8817c28d698bdae35728c7a30b02a75bd4d" -H "Content-Type: application/json" -X DELETE https://www.oblio.eu/api/webhooks/123
Raspuns
{
"status": 200,
"statusMessage": "Success",
"data": {
"cif": "37311090",
"topic": "stock",
"endpoint": "https://exemplu.com/update-stock/",
"id": "123"
}
}
