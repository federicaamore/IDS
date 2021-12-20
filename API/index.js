var Express = require("express");
var bodyParser = require("body-parser");
const db = require("better-sqlite3")("user_data.db")
var fs = require('fs');
const google_api = require('./api_google.js'); 
const utils = require('./utils.js'); 

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
  fs.writeFileSync("./uploads/files.txt","0")
}

sql =  "CREATE TABLE IF NOT EXISTS schede(id int UNIQUE, percorso_immagine text, contenuto text, frequenza_invio_notifica int, ultimo_invio text);\
        CREATE TABLE IF NOT EXISTS materie(name text UNIQUE, R int, G int, B int);\
        CREATE TABLE IF NOT EXISTS cataloghi(name text UNIQUE, materia text);\
        CREATE TABLE IF NOT EXISTS note(id int UNIQUE, nome text, percorso_file text, catalogo text);\
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

/**
 * @swagger
 * /upload/file:
 *   post:
 *     summary: Salva un file sul server.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: nome del file aggiunto
 *       413:
 *         description: Il file è troppo grande, dimensione massima 10MB
*/
app.post('/upload/file', (request, response) => {
    let file_name = utils.add_file(request)
    if (file_name != "error")
        response.status(201).json(file_name)
    else
        response.status(413).json("Il file è troppo grande, dimensione massima 10MB")
})

/**
 * @swagger
 * /api/scheda:
 *   get:
 *     summary: Restituisce la lista delle schede di memoria.
 *     description: Restituisce una lista contenente tutte le schede di memoria salvate dall'utente all'interno dell'applicazione.
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
 *     description: Restituisce una lista contenente tutte le materie.
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
    row = db.prepare(sql).all()
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
 *       400:
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
            response.status(400).json("Esiste già una materia con questo nome")
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
 *               old_name:
 *                  type: string
 *                  description: Nome attuale della materia da modificare.
 *                  example: Ingegneria del software
 *     responses:
 *       201:
 *         description: Materia inserita
 *       404:
 *         description: Nessuna modifica ai parametri oppure la materia non esiste
 *       400:
 *         description: Esista già una materia con questo nome
 *       500:
 *         description: Eccezione non gestita
*/
app.put('/api/materia', (request, response) => {
    let sql = "UPDATE materie SET name = ?, R = ?, G = ?, B = ? WHERE name = ?"
    try{
        let info = db.prepare(sql).run(request.body["nome"], request.body["R"], request.body["G"], request.body["B"], request.body["old_name"]);
        if (info.changes == 0){
            response.status(404).json("Nessuna modifica ai parametri oppure la materia non esiste")
        }
        else{
            response.json("Materia aggiornata")
        }
    }
    catch (error){
        if (error.message.startsWith("UNIQUE constraint failed: ")){
            response.status(400).json("Esiste già una materia con questo nome")
        }
        else{
            console.log(error.message, error)
            response.status(500).json("Eccezione non gestita")
        }
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
    else{
        sql = "DELETE FROM materie WHERE name = ?"
        db.prepare(sql).run(request.params.name)
        response.json("Rimosso con successo");
    }
})

/**
 * @swagger
 * /api/catalogo:
 *   get:
 *     summary: Restituisce la lista dei cataloghi.
 *     description: Restituisce una lista contenente tutti i cataloghi.
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
 *       400:
 *         description: Esiste già un catalogo con questo nome
 *       500:
 *         description: Eccezione non gestita
*/
app.post('/api/catalogo', (request, response) => {
    let materia = request.body["materia"]
    let found = utils.is_subject(db, materia)
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
            response.status(400).json("Esiste già un catalogo con questo nome")
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
 *       200:
 *         description: Catalogo aggiornato
 *       404:
 *         description: Nessuna materia presente con quel nome<br />
 *                      Nessuna modifica ai parametri oppure il catalogo non esiste
 *       400:
 *         description: Esiste già un catalogo con questo nome
 *       500:
 *         description: Eccezione non gestita
*/
app.put('/api/catalogo', (request, response) => {
    let materia = request.body["materia"]
    let found = utils.is_subject(db, materia)
    if (!found){
        response.status(404).send("Nessuna materia presente con quel nome")
        return
    }
    sql = "UPDATE cataloghi SET name = ?, materia = ? WHERE name = ?"
    try{
        let info = db.prepare(sql).run(request.body["nome"], materia, request.body["nome_attuale"]);
        if (info.changes == 0){
            response.status(404).json("Nessuna modifica ai parametri oppure il catalogo non esiste")
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

/**
 * @swagger
 * /api/catalogo/{nome}:
 *   delete:
 *     summary: Elimina un catalogo.
 *     parameters:
 *       - in: path
 *         name: nome
 *         schema:
 *             type: string
 *         required: true
 *         description: nome del catalogo da rimuovere
 *     responses:
 *       200:
 *         description: Rimosso con successo
 *       404:
 *         description: Nessun catalogo presente con il nome indicato
*/
app.delete('/api/catalogo/:nome', (request, response) => {
    sql = "SELECT name FROM cataloghi WHERE name = ?;"
    row = db.prepare(sql).get(request.params.nome)
    if (row == undefined)
        response.status(404).send("Nessun catalogo presente con il nome indicato")
    else{
        sql = "DELETE FROM cataloghi WHERE name = ?"
        db.prepare(sql).run(request.params.name)
        response.json("Rimosso con successo");
    }
})

/**
 * @swagger
 * /api/nota/{catalogo}:
 *   get:
 *     summary: Restituisce la lista delle note in un catalogo.
 *     description: Restituisce una lista contenente tutte le note che l'utente ha inserito in un catalogo.
 *     parameters:
 *       - in: path
 *         name: catalogo
 *         schema:
 *             type: string
 *         required: true
 *         description: nome del catalogo del quale elencare le note
 *     responses:
 *       200:
 *         description: Una lista di note.
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
 *                       nome:
 *                         type: string
 *                         description: Il nome della nota. Di default è il percorso del file
 *                         example: /uploads/1.txt
 *                       percorso_file:
 *                         type: string
 *                         description: Il percorso dove è salvato il file collegato a questa nota
 *                         example: /uploads/1.txt
 *                       catalogo:
 *                          type: string
 *                          description: Il catalogo alla quale la scheda appartiene.
 *                          example: Appunti di novembre.
 *       404:
 *         description: Nessuna scheda presente nel catalogo.<br />
 *                      Nessun catalogo presente con il nome indicato
 */
 app.get('/api/nota/:catalogo', (request, response) => {

    sql = "SELECT name FROM cataloghi WHERE name = ?;"
    row = db.prepare(sql).get(request.params.catalogo)
    if (row == undefined){
        response.status(404).send("Nessun catalogo presente con il nome indicato")
        return
    }
    sql = "SELECT * FROM note WHERE catalogo = ? ORDER BY id ASC"
    rows = db.prepare(sql).all(request.params.catalogo)
    console.log(rows)
    if (rows == undefined || Object.keys(rows).length == 0){
        response.status(404).json("Nessuna scheda presente nel catalogo")
    }
    else{
        response.send(rows)
    }
})
/**
 * @swagger
 * /api/nota:
 *   post:
 *     summary: Aggiunge una nota ad un catalogo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               percorso_file:
 *                  type: string
 *                  nullable: true
 *                  description: Il percorso dove è salvato il file collegato a questa nota.
 *                  example: /uploads/1.txt
 *               catalogo:
 *                  type: string
 *                  description: Il catalogo nel quale va inserita la nota
 *                  example: Appunti di novembre
 *     responses:
 *       201:
 *         description: Nota aggiunta con id x
 *       404:
 *         description: Nessun catalogo presente con il nome indicato
*/
app.post('/api/nota', (request, response) => {
    sql = "SELECT name FROM cataloghi WHERE name = ?;"
    row = db.prepare(sql).get(request.body["catalogo"])
    if (row == undefined){
        response.status(404).send("Nessun catalogo presente con il nome indicato")
        return
    }
    sql = "SELECT id FROM note ORDER BY id DESC LIMIT 1;"
    row = db.prepare(sql).get()
    if (row == undefined) 
        id = -1
    else
        id = row.id;
    id = id + 1
    console.log(id)
    sql = "INSERT INTO note(id, nome, percorso_file, catalogo) VALUES(?, ?, ?, ?)"
    db.prepare(sql).run(id, request.body["percorso_file"], request.body["percorso_file"], request.body["catalogo"]);

    response.status(201).json("Nota aggiunta con id "+id)
})

/**
 * @swagger
 * /api/nota:
 *   put:
 *     summary: Aggiorna una una nota.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                  type: string
 *                  description: Nuovo nome della nota.
 *                  example: definizione addizione
 *               id:
 *                  type: integer
 *                  description: id della nota da aggiornare
 *                  example: 0
 *               catalogo:
 *                  type: string
 *                  description: Il catalogo nel quale si trova la nota da modificare.
 *                  example: Appunti di novembre
 *     responses:
 *       201:
 *         description: Nota aggiornata
 *       404:
 *         description: Nessuna modifica apportata oppure nessuna nota presente con quell'id nel catalogo indicato
 *       400:
 *         description: Esiste già una nota con il nuovo nome
 *       500:
 *         description: Eccezione non gestita
*/
app.put('/api/nota', (request, response) => {
    sql = "UPDATE note SET name = ? WHERE name = ? AND catalogo = ?"
    try{
        let info = db.prepare(sql).run(request.body["nome"], request.body["id"], request.body["catalogo"]);
        if (info.changes == 0){
            response.status(404).json("Nessuna modifica apportata oppure nessuna nota presente con quell'id nel catalogo indicato")
        }
        else{
            response.json("Nota aggiornata")
        }
    }
    catch (error){
        console.log(error.message)
        response.status(500).json("Eccezione non gestita")
    }
});

/**
 * @swagger
 * /api/nota/{id}&{catalogo}:
 *   delete:
 *     summary: Rimuove una nota dal catalogo.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *             type: integer
 *         required: true
 *         description: id della nota da rimuovere
 *       - in: path
 *         name: catalogo
 *         schema:
 *             type: string
 *         required: true
 *         description: catalogo dal quale va rimossa la nota
 *     responses:
 *       200:
 *         description: Rimosso con successo
 *       404:
 *         description: Nel catalogo non è presente nessuna nota con l'id indicato
*/
app.delete('/api/nota/:id&:catalogo', (request, response) => {
    sql = "SELECT id FROM note WHERE id = ? AND catalogo = ?"
    row = db.prepare(sql).get(request.params.id, request.params.catalogo)
    if (row == undefined)
        response.status(404).send("Nel catalogo non è presente nessuna nota con l'id indicato")
    else{
        sql = "DELETE FROM note WHERE id = ?"
        db.prepare(sql).run(request.params.id)
        response.json("Rimosso con successo");
    }
})

/**
 * @swagger
 * /api/evento:
 *   get:
 *     summary: Restituisce la lista degli eventi.
 *     description: Restituisce una lista contenente tutti gli id degli eventi aggiunti tramite queste api, 
 *                  mostrando solo il primo in caso di eventi con ripetizione.
 *     responses:
 *       200:
 *         description: Una lista degli id degli eventi con la rispettiva materia.
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
 *                         type: string
 *                         description: Id dell'evento fornito dalle API di google.
 *                         example: 5jqsnoaviltelt64lm5ptppsms
 *                       materia:
 *                         type: string
 *                         description: Nome della materia associata.
 *                         example: Ingegneria del software
 *       404:
 *         description: Nessun evento presente.
 */
app.get('/api/evento', (request, response) => {
    sql = "SELECT * FROM eventi"
    rows = db.prepare(sql).all()
    if (rows == undefined || Object.keys(rows).length == 0){
        response.status(404).json("Nessun evento presente")
    }
    else{
        response.json(rows)
    }
});

/**
 * @swagger
 * /api/evento:
 *   post:
 *     summary: Aggiunge una evento al calendario di google.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timezone:
 *                  type: string
 *                  description: La timezone da utilizzare per questo evento
 *                  example: Europe/Rome
 *               materia:
 *                  type: string
 *                  description: La materia da associare a questo evento
 *                  example: Ingegneria del software
 *               title:
 *                  type: string
 *                  description: Il titolo da utilizzare per questo evento
 *                  example: Tutorato
 *               description:
 *                  type: string
 *                  description: La descrizione dell'evento.
 *                  example: Tutorato sugli argomenti della lezione
 *               start:
 *                  type: string
 *                  description: L'orario di inizio dell'evento
 *                  example: 2021-12-21T15:00:00Z
 *               end:
 *                  type: string
 *                  description: L'orario di fine dell'evento
 *                  example: 2021-12-21T16:30:00Z
 *               frequency:
 *                  type: string
 *                  description: La frequenza con cui si deve ripetere l'evento in giorni
 *                  example: 2
 *     responses:
 *       201:
 *         description: Evento aggiunto con id x
 *       404:
 *         description: Nessun calendario presente<br />
 *                      Nessuna materia presente con quel nome
 *       500:
 *         description: Credenziali non valide
*/
app.post('/api/evento', (request, response) => {
    timezone = request.body["timezone"]
    materia = request.body["materia"]
    let found = utils.is_subject(db, materia)
    if (!found && materia != undefined){
        response.status(404).send("Nessuna materia presente con quel nome")
        return
    }
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
        if (err){
            response.status(500).json("Credenziali non valide")
            return console.log('Error loading client secret file:', err);
        }
        google_api.authorize(JSON.parse(content), data, google_api.insertEvent);
        });
});

/**
 * @swagger
 * /api/evento:
 *   put:
 *     summary: Aggiunge una evento al calendario di google.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                  type: string
 *                  description: L'id dell'evento da modificare
 *                  example: 5jqsnoaviltelt64lm5ptppsms
 *               timezone:
 *                  type: string
 *                  description: La timezone da utilizzare per questo evento
 *                  example: Europe/Rome
 *               materia:
 *                  type: string
 *                  description: La materia da associare a questo evento
 *                  example: Ingegneria del software
 *               title:
 *                  type: string
 *                  description: Il titolo da utilizzare per questo evento
 *                  example: Tutorato
 *               description:
 *                  type: string
 *                  description: La descrizione dell'evento.
 *                  example: Tutorato sugli argomenti della lezione
 *               start:
 *                  type: string
 *                  description: L'orario di inizio dell'evento
 *                  example: 2021-12-21T15:00:00Z
 *               end:
 *                  type: string
 *                  description: L'orario di fine dell'evento
 *                  example: 2021-12-21T16:30:00Z
 *               frequency:
 *                  type: string
 *                  description: La frequenza con cui si deve ripetere l'evento in giorni
 *                  example: 2
 *     responses:
 *       201:
 *         description: Evento aggiunto con id x
 *       404:
 *         description: Nessun calendario presente<br />
 *                      Nessuna materia presente con quel nome.
 *       500:
 *         description: Credenziali non valide
*/
app.put("/api/evento", (request, response) => {
    id = request.body["id"]
    timezone = request.body["timezone"]
    materia = request.body["materia"]
    let found = utils.is_subject(db, materia)
    if (!found && materia != undefined){
        response.status(404).json("Nessuna materia presente con quel nome")
        return
    }
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
        if (err){
            response.status(500).json("Credenziali non valide")
            return console.log('Error loading client secret file:', err);
        }
        google_api.authorize(JSON.parse(content), data, google_api.updateEvent);
        });
});

/**
 * @swagger
 * /api/evento/{id}:
 *   delete:
 *     summary: Rimuove un evento dal calendario.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *             type: integer
 *         required: true
 *         description: id della nota da rimuovere
 *     responses:
 *       200:
 *         description: Rimosso con successo
 *       404:
 *         description: Non è presente nessun calendario
 *       500:
 *         description: Credenziali non valide
*/
app.delete("/api/evento/:id", (request, response) => {
    id = request.params.id
    data = [id, db, response]
    fs.readFile('credentials.json', (err, content) => {
        if (err){
            response.status(500).json("Credenziali non valide")
            return console.log('Error loading client secret file:', err);
        }
        google_api.authorize(JSON.parse(content), data, google_api.deleteEvent);
        });
});

