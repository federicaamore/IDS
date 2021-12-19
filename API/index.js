var Express = require("express");
var bodyParser = require("body-parser");
const db = require("better-sqlite3")("user_data.db")
var fs = require('fs');
const google_api = require('./api_google.js');

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

var app = Express();

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Express API for My Project',
            version: '1.0.0',
            description:
                'This is a REST API application made with Express.',
            license: {
                name: 'Licensed Under MIT',
                url: 'https://spdx.org/licenses/MIT.html',
            },
            contact: {
                name: 'Group40',
                url: 'http://localhost:49146/',
            },
        },
        servers: [
            {
                url: 'http://localhost:49146/',
                description: 'Development server',
            },
        ],
    },
    apis: ["index.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const { request, response } = require("express");

//SETUP
if (!fs.existsSync("./uploads")){
  fs.mkdirSync("uploads")
  fs.writeFileSync("./uploads/photos.txt","0")
}

sql =  "CREATE TABLE IF NOT EXISTS schede(id int UNIQUE, percorso_immagine text, contenuto text, frequenza_invio_notifica int, ultimo_invio text);\
        CREATE TABLE IF NOT EXISTS materie(name text UNIQUE, R int, G int, B int);\
        CREATE TABLE IF NOT EXISTS cataloghi(name text UNIQUE, materia text);\
        CREATE TABLE IF NOT EXISTS note(id int UNIQUE, percorso_file text, catalogo text);\
        CREATE TABLE IF NOT EXISTS eventi(id text UNIQUE, materia text)"
db.exec(sql)

app.listen(49146, () => {
    console.log("API started...")
});

var fileUpload = require('express-fileupload');

app.use(fileUpload({
  createParentPath: true
}));
//app.use('/upload/img', Express.static(__dirname + '/uploads'));


var cors = require('cors');
const { json } = require("body-parser");
app.use(cors())

//API GENERALI

app.get('/', (request, response) => {
    console.log(request)
    response.json('Hello World');
})

app.post('/upload/img', (request, response) => {
  let image = request.files.image;
  let data = fs.readFileSync('./uploads/photos.txt').toString();
  let image_name = data + "." + image.name.split(".").at(-1)
  //Con mv sposto l'immagine nella cartella giusta
  image.mv('./uploads/' + image_name);
  fs.writeFileSync("./uploads/photos.txt", (parseInt(data)+1).toString())

  response.send(image_name)
})

/**
 * @swagger
 * /api/scheda:
 *   get:
 *     summary: Restituisce la lista delle schede di memoria.
 *     description: Restituisce una lista contente tutte le schede di memoria salvate dall'utente all'interno dell'applicazione.
 *     responses:
 *       200:
 *         description: Una lista di schede.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Id della scheda di memoria.
 *                         example: 2
 *                       percorso_immagine:
 *                         type: string
 *                         nullable: true
 *                         description: Il percorso dove è salvata l'immagine collegata a questa scheda, null se non viene scelta nessuna immagine.
 *                         example: /uploads/1.jpg
 *                       contenuto :
 *                          type: string
 *                          nullable: true 
 *                          description: Il testo da mostrare nella scheda, null se si vuole utilizzare solo un'immagine.
 *                          example: Il "+" indica l'operazione di addizione.
 *                       frequenza_invio_notifica :
 *                          type: integer
 *                          description: La frequenza (in ore) con cui la scheda di memoria va ricordata all'utente tramite una notifica.
 *                          example: 5.
 *                       ultimo_invio :
 *                          type: string
 *                          nullable: true 
 *                          description: La data e l'ora dell'ultimo invio della notifica con i dati della scheda.
 *                          example: 2019-09-26T07:58:30.996+0200
 *       404:
 *         description: Nessuna scheda presente.
 */
app.get('/api/scheda', (request, response) => {

    sql = "SELECT * FROM schede ORDER BY id ASC"
    rows = db.prepare(sql, function(err){
        if (err){
            return console.log(err.message)
        }
    }).all()
    if (row == undefined || Object.keys(row).length == 0){
        response.status(404).json("Nessuna scheda presente")
    }
    else{
        response.send(row)
    }
})

/**
 * @swagger
 * /api/scheda:
 *   post:
 *     summary: Crea una scheda di memoria.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               percorso_immagine:
 *                  type: string
 *                  nullable: true
 *                  description: Il percorso dove è salvata l'immagine collegata a questa scheda, null se non viene scelta nessuna immagine.
 *                  example: /uploads/1.jpg
 *               contenuto :
 *                  type: string
 *                  nullable: true 
 *                  description: Il testo da mostrare nella scheda, null se si vuole utilizzare solo un'immagine.
 *                  example: Il "+" indica l'operazione di addizione.
 *               frequenza_invio_notifica :
 *                  type: integer
 *                  description: La frequenza (in ore) con cui la scheda di memoria va ricordata all'utente tramite una notifica.
 *                  example: 5.
 *               ultimo_invio :
 *                  type: string
 *                  nullable: true 
 *                  description: La data e l'ora dell'ultimo invio della notifica con i dati della scheda.
 *                  example: 2019-09-26T07:58:30.996+0200
 *     responses:
 *       201:
 *         description: Scheda aggiunta con id x
*/
app.post('/api/scheda', (request, response) => {
    sql = "SELECT id FROM schede ORDER BY id DESC LIMIT 1;"
    row = db.prepare(sql).get()
    if (row == undefined) 
        id = -1
    else
        id = row.id;
    id = id + 1
    console.log(id)
    sql = "INSERT INTO schede(id, percorso_immagine, contenuto, frequenza_invio_notifica) VALUES(?, ?, ?, ?)"
    db.prepare(sql,
         function(err) {
        if (err) {
          return console.log(err.message);
        }
      }).run(id, request.body["percorso_immagine"], request.body["Contenuto"], request.body["frequenza_invio_notifica"]);

    response.status(201).json("Scheda aggiunta con id "+id)
})

/**
 * @swagger
 * /api/scheda/{id}:
 *   delete:
 *     summary: Rimuove una scheda di memoria.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *             type: integer
 *         required: true
 *         description: id della scheda da rimuovere
 *     responses:
 *       200:
 *         description: Rimosso con successo
 *       404:
 *         description: Nessuna scheda presente con l'id indicato
*/
app.delete('/api/scheda/:id', (request, response) => {
    sql = "SELECT percorso_immagine FROM schede WHERE id = ?;"
    row = db.prepare(sql).get(request.params.id)
    if (row == undefined)
        response.status(404).send("Nessuna scheda presente con l'id indicato")
    sql = "DELETE FROM schede WHERE id = ?"
    db.prepare(sql, function(err) {
        if (err) {
          console.log(err.message);
        }
      }).run(request.params.id)
    response.json("Rimosso con successo");
})

/**
 * @swagger
 * /api/materia:
 *   get:
 *     summary: Restituisce la lista delle materie.
 *     description: Restituisce una lista contente tutte le materie.
 *     responses:
 *       200:
 *         description: Una lista di materie.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       materia:
 *                         type: string
 *                         description: Nome della materia.
 *                         example: Ingegneria del software
 *                       R:
 *                         type: int
 *                         description: Il valore Red per definire un colore secondo il modello RGB
 *                         example: 34
 *                       G:
 *                         type: int
 *                         description: Il valore Green per definire un colore secondo il modello RGB
 *                         example: 34
 *                       B:
 *                         type: int
 *                         description: Il valore Blue per definire un colore secondo il modello RGB
 *                         example: 34
 *       404:
 *         description: Nessuna materia presente.
 */
app.get('/api/materia/', (request, response) => {

    sql = "SELECT * FROM materie"
    row = db.prepare(sql, function(err){
        if (err){
            return console.log(err.message)
        }
    }).all()
    if (row == undefined || Object.keys(row).length == 0){
        response.status(404).json("Nessuna materia presente")
    }
    else{
        response.send(row)
    }
})

/**
 * @swagger
 * /api/materia:
 *   post:
 *     summary: Crea una materia.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                  type: string
 *                  description: Nome della materia da salvare.
 *                  example: Ingegneria del software
 *               R:
 *                  type: int
 *                  description: Il valore Red per definire un colore secondo il modello RGB
 *                  example: 34
 *               G:
 *                  type: int
 *                  description: Il valore Green per definire un colore secondo il modello RGB
 *                  example: 34
 *               B:
 *                  type: int
 *                  description: Il valore Blue per definire un colore secondo il modello RGB
 *                  example: 34
 *     responses:
 *       201:
 *         description: Materia inserita
 *       409:
 *         description: Esiste già una materia con questo nome
 *       500:
 *         description: Eccezione non gestita
*/
app.post('/api/materia', (request, response) => {
    sql = "INSERT INTO materie(name, R, G, B) VALUES(?, ?, ?, ?)"
    try{
        db.prepare(sql).run(request.body["nome"], request.body["R"], request.body["G"], request.body["B"]);
        response.status(201).json("Materia inserita")
    }
    catch (error){
        if (error.message.startsWith("UNIQUE constraint failed: ")){
            response.status(409).json("Esiste già una materia con questo nome")
        }
        else{
            response.status(500).json(error.name)
        }
    }
});

/**
 * @swagger
 * /api/materia:
 *   put:
 *     summary: Aggiorna una materia.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                  type: string
 *                  description: Nuovo nome della materia da aggiornare.
 *                  example: Ingegneria del software 2
 *               R:
 *                  type: int
 *                  description: Nuovo valore Red per definire un colore secondo il modello RGB
 *                  example: 34
 *               G:
 *                  type: int
 *                  description: Nuovo valore Green per definire un colore secondo il modello RGB
 *                  example: 36
 *               B:
 *                  type: int
 *                  description: Nuovo valore Blue per definire un colore secondo il modello RGB
 *                  example: 34
 *               nome_attuale:
 *                  type: string
 *                  description: Nome attuale della materia da modificare.
 *                  example: Ingegneria del software
 *     responses:
 *       201:
 *         description: Materia inserita
 *       404:
 *         description: Materia non presente
 *       409:
 *         description: Esista già una materia con questo nome
 *       500:
 *         description: Eccezione non gestita
*/
app.put('/api/materia', (request, response) => {
    let sql = "UPDATE materie SET name = ?, R = ?, G = ?, B = ? WHERE name = ?"
    try{
        try{
            let info = db.prepare(sql).run(request.body["nome"], request.body["R"], request.body["G"], request.body["B"]. request.body["nome_attuale"],);
            if (info.changes == 0){
                response.status(404).json("Materia non presente")
            }
            else{
                response.json("Materia aggiornata")
            }
        }
        catch (error){
            if (error.message.startsWith("UNIQUE constraint failed: ")){
                response.status(409).json("Esiste già una materia con questo nome")
            }
            else{
                console.log(error.message)
                response.status(500).json("Eccezione non gestita")
            }
        }
    }
    catch (error){
        console.log(error.message)
        response.status(500).json(error.message)
    }
});

/**
 * @swagger
 * /api/materia/{nome}:
 *   delete:
 *     summary: Rimuove una materia.
 *     parameters:
 *       - in: path
 *         name: nome
 *         schema:
 *             type: string
 *         required: true
 *         description: nome della materia da rimuovere
 *     responses:
 *       200:
 *         description: Rimosso con successo
 *       404:
 *         description: Nessuna materia presente con il nome indicato
*/
app.delete('/api/materia/:nome', (request, response) => {
    sql = "SELECT name FROM materie WHERE name = ?;"
    row = db.prepare(sql).get(request.params.nome)
    if (row == undefined)
        response.status(404).send("Nessuna materia presente con il nome indicato")
    sql = "DELETE FROM materie WHERE name = ?"
    db.prepare(sql).run(request.params.name)
    response.json("Rimosso con successo");
})

/**
 * @swagger
 * /api/catalogo:
 *   get:
 *     summary: Restituisce la lista dei cataloghi.
 *     description: Restituisce una lista contente tutti i cataloghi.
 *     responses:
 *       200:
 *         description: Una lista di cataloghi con la rispettiva materia.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Nome del catalogo.
 *                         example: Appunti di novembre
 *                       materia:
 *                         type: string
 *                         description: Nome della materia associata.
 *                         example: Ingegneria del software
 *       404:
 *         description: Nessun catalogo presente.
 */
app.get('/api/catalogo/', (request, response) => {

    sql = "SELECT * FROM cataloghi"
    row = db.prepare(sql).all()
    if (row == undefined || Object.keys(row).length == 0){
        response.status(404).json("Nessun catalogo presente")
    }
    else{
        response.json(row)
    }
})

/**
 * @swagger
 * /api/catalogo:
 *   post:
 *     summary: Crea un catalogo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                  type: string
 *                  description: Nome del catalogo da salvare.
 *                  example: Appunti di novembre
 *               materia:
 *                  type: string
 *                  description: Materia da associare al catalogo.
 *                  example: Ingegneria del software
 *     responses:
 *       201:
 *         description: Catalogo inserito
 *       404:
 *         description: Nessuna materia presente con quel nome
 *       409:
 *         description: Esiste già un catalogo con questo nome
 *       500:
 *         description: Eccezione non gestita
*/
app.post('/api/catalogo', (request, response) => {
    let materia = request.body["materia"]
    let sql = "SELECT name FROM materie"
    let materie = db.prepare(sql).all()
    let found = false
    for (i = 0; i < Object.keys(materie).length && found == false; i++){
        if (materia == materie[i].name){
            found = true
        }
    }
    if (!found){
        response.status(404).json("Nessuna materia presente con quel nome")
        return
    }
    sql = "INSERT INTO cataloghi(name, materia) VALUES(?, ?)"
    try{
        db.prepare(sql).run(request.body["nome"], materia);
        response.status(201).json("Catalogo creato")
    }
    catch (error){
        if (error.message.startsWith("UNIQUE constraint failed: ")){
            response.status(409).json("Esiste già un catalogo con questo nome")
        }
        else{
            console.log(error.message)
            response.status(500).json("Eccezione non gestita")
        }
    }
});

/**
 * @swagger
 * /api/catalogo:
 *   put:
 *     summary: Crea un catalogo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                  type: string
 *                  description: Nuovo nome del catalogo.
 *                  example: Appunti di dicembre
 *               materia:
 *                  type: string
 *                  description: Materia da associare al catalogo.
 *                  example: Ingegneria del software
 *               nome_attuale:
 *                  type: string
 *                  description: Nome attuale del catalogo.
 *                  example: Appunti di novembre
 *     responses:
 *       201:
 *         description: Catalogo inserito
 *       404:
 *         description: Nessuna materia presente con quel nome<br />
 *                      Nessuna catalogo presente con quel nome
 *       409:
 *         description: Esiste già un catalogo con questo nome
 *       500:
 *         description: Eccezione non gestita
*/
app.put('/api/catalogo', (request, response) => {
    let materia = request.body["materia"]
    let sql = "SELECT name FROM materie"
    let materie = db.prepare(sql).all()
    let found = false
    for (i = 0; i < Object.keys(materie).length && found == false; i++){
        if (materia == materie[i].name){
            found = true
        }
    }
    if (!found){
        response.status(404).send("Nessuna materia presente con quel nome")
        return
    }
    sql = "UPDATE cataloghi SET name = ?, materia = ? WHERE name = ?"
    try{
        let info = db.prepare(sql).run(request.body["nome"], materia, request.body["nome_attuale"]);
        if (info.changes == 0){
            response.status(404).json("Nessun catalogo presente con quel nome")
        }
        else{
            response.json("Catalogo aggiornato")
        }
    }
    catch (error){
        console.log(error.message)
        response.status(500).json("Eccezione non gestita")
    }
});


//API EVENTI
app.post('/api/evento', (request, response) => {
    timezone = request.body["timezone"]
    materia = request.body["materia"]
    var event = {
        summary: request.body["title"],
        description: request.body["description"],
        start: {
          dateTime: request.body["start"],
          timeZone: timezone
        },
        end: {
          dateTime: request.body["end"],
          timeZone: timezone
        },
        recurrence: ['RRULE:FREQ=DAILY;COUNT='+request.body["frequency"]],
      };
    var data = [event, db, materia, response]
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        google_api.authorize(JSON.parse(content), data, google_api.insertEvent);
        });
});

app.put("/api/evento", (request, response) => {
    id = request.body["id"]
    timezone = request.body["timezone"]
    materia = request.body["materia"]
    var event = {
        summary: request.body["title"],
        description: request.body["description"],
        start: {
          dateTime: request.body["start"],
          timeZone: timezone
        },
        end: {
          dateTime: request.body["end"],
          timeZone: timezone
        },
        recurrence: ['RRULE:FREQ=DAILY;COUNT='+request.body["frequency"]],
      };
    var data = [id, event, db, materia, response]
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        google_api.authorize(JSON.parse(content), data, google_api.updateEvent);
        });
});

app.delete("/api/evento/:id", (request, response) => {
    id = request.params.id
    data = [id, db, response]
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        google_api.authorize(JSON.parse(content), data, google_api.deleteEvent);
        });
});

