var Express = require("express");
var bodyParser = require("body-parser");
const db = require("better-sqlite3")("user_data.db")

db.prepare('CREATE TABLE IF NOT EXISTS schede(id int UNIQUE, percorso_immagine text, contenuto text, frequenza_invio_notifica int, \
    ultimo_invio text)').run()

var app = Express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const { request, response } = require("express");


app.listen(49146, () => {
});

var fileUpload = require('express-fileupload');
var fs = require('fs');
app.use(fileUpload());
app.use('/Photos', Express.static(__dirname + '/Photos'));


var cors = require('cors')
app.use(cors())

app.get('/', (request, response) => {
    response.json('Hello World');
})


app.get('/api/scheda', (request, response) => {

    sql = "SELECT * FROM schede ORDER BY id ASC"
    rows = db.prepare(sql, function(err){
        if (err){
            return console.log(err.message)
        }
    }).all()
    response.send(rows)

})

app.post('/api/scheda', (request, response) => {
    sql = "SELECT id FROM schede ORDER BY id DESC LIMIT 1;"
    row = db.prepare(sql).get()
    if (row == undefined) 
        id = -1
    else
        id = row.id;
    id = id + 1
    console.log(id)
    sql = "INSERT INTO schede(id, percorso_immagine, contenuto, frequenza_invio_notifica, ultimo_invio) VALUES(?, ?, ?, ?, ?)"
    db.prepare(sql,
         function(err) {
        if (err) {
          return console.log(err.message);
        }
      }).run(id, request.body["percorso_immagine"], request.body["Contenuto"], request.body["frequenza_invio_notifica"], "0");

      response.send("Scheda aggiunta")
})


app.put('/api/scheda', (request, response) => {

    sql = "REPLACE INTO schede(id, percorso_immagine, contenuto, frequenza_invio_notifica, ultimo_invio) VALUES(?, ?, ?, ?, ?)"
    db.prepare(sql,
         function(err) {
        if (err) {
          return console.log(err.message);
        }
      }).run(request.body["id_scheda"], request.body["percorso_immagine"], request.body["Contenuto"], request.body["frequenza_invio_notifica"], request.body["ultimo_invio"]);

      response.send("Scheda aggiornata")
})


app.delete('/api/scheda/{id}', (request, response) => {

    sql = "DELETE FROM schede WHERE id = ?"
    console.log(request.params)
    db.prepare(sql, function(err) {
        if (err) {
          return console.log(err.message);
        }
      }).run(request.params.id)
    response.json("Deleted Successfully");
})