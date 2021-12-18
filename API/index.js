var Express = require("express");
var bodyParser = require("body-parser");
const db = require("better-sqlite3")("user_data.db")
var fs = require('fs');
const google_api = require('./api_google.js');

sql =  "CREATE TABLE IF NOT EXISTS schede(id int UNIQUE, percorso_immagine text, contenuto text, frequenza_invio_notifica int, ultimo_invio text);\
        CREATE TABLE IF NOT EXISTS materie(name text UNIQUE, R int, G int, B int);\
        CREATE TABLE IF NOT EXISTS cataloghi(name text UNIQUE, materia text);\
        CREATE TABLE IF NOT EXISTS note(id int UNIQUE, percorso_file text, catalogo text);\
        CREATE TABLE IF NOT EXISTS eventi(id text UNIQUE, materia text)"
db.exec(sql)

var app = Express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const { request, response } = require("express");

//SETUP
if (!fs.existsSync("./uploads")){
  fs.mkdirSync("uploads")
  fs.writeFileSync("./uploads/photos.txt","0")
}


app.listen(49146, () => {
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

//API SCHEDA

//Lista schede
app.get('/api/scheda', (request, response) => {

    sql = "SELECT * FROM schede ORDER BY id ASC"
    rows = db.prepare(sql, function(err){
        if (err){
            return console.log(err.message)
        }
    }).all()
    response.send(rows)

})

//Aggiunta scheda
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

//rimozione scheda
app.delete('/api/scheda/:id', (request, response) => {
    sql = "DELETE FROM schede WHERE id = ?"
    console.log(request.params)
    db.prepare(sql, function(err) {
        if (err) {
          return console.log(err.message);
        }
      }).run(request.params.id)
    response.json("Deleted Successfully");
})

//API MATERIA
app.get('/api/materia/', (request, response) => {

    sql = "SELECT * FROM materie"
    row = db.prepare(sql, function(err){
        if (err){
            return console.log(err.message)
        }
    }).all()
    if (row == undefined || Object.keys(row).length == 0){
        response.send("Nessuna materia presente")
    }
    else{
        response.send(row)
    }
})

app.post('/api/materia', (request, response) => {
    sql = "INSERT INTO materie(name, R, G, B) VALUES(?, ?, ?, ?)"
    try{
        db.prepare(sql).run(request.body["name"], request.body["R"], request.body["G"], request.body["B"]);
        response.json("Materia inserita")
    }
    catch (error){
        console.log(error.message)
        response.json(error.message)
    }
});

app.put('/api/materia', (request, response) => {
    let sql = "UPDATE cataloghi SET name = ?, R = ?, G = ?, B = ? WHERE name = ?"
    try{
        let info = db.prepare(sql).run(request.body["name"], request.body["R"], request.body["G"], request.body["B"]. request.body["old_name"],);
        if (info.changes == 0){
            response.json("Materia non presente")
        }
        else{
            response.json("Materia aggiornata")
        }
    }
    catch (error){
        console.log(error.message)
        response.json(error.message)
    }
});

app.delete('/api/materia/:name', (request, response) => {
    sql = "DELETE FROM materie WHERE name = ?"
    db.prepare(sql, function(err) {
        if (err) {
          return console.log(err.message);
        }
      }).run(request.params.name)
    response.json("Deleted Successfully");
})

//API CATALOGHI
app.get('/api/catalogo/', (request, response) => {

    sql = "SELECT * FROM cataloghi"
    row = db.prepare(sql, function(err){
        if (err){
            return console.log(err.message)
        }
    }).all()
    if (row == undefined || Object.keys(row).length == 0){
        response.send("Nessun catalogo presente")
    }
    else{
        response.send(row)
    }
})

app.post('/api/catalogo', (request, response) => {
    let materia = request.body["materia"]
    let sql = "SELECT name FROM materie"
    let materie = db.prepare(sql).all()
    if (materie == undefined || Object.keys(materie).length == 0){
        response.send("Nessuna materia presente")
    }
    let found = false
    for (i = 0; i < Object.keys(materie).length && found == false; i++){
        if (materia == materie[i].name){
            found = true
        }
    }
    if (!found){
        response.send("Nessuna materia presente con quel nome")
        return
    }
    sql = "INSERT INTO cataloghi(name, materia) VALUES(?, ?)"
    try{
        db.prepare(sql).run(request.body["name"], materia);
        response.json("Catalogo creato")
    }
    catch (error){
        console.log(error.message)
        response.json(error.message)
    }
});

app.put('/api/catalogo', (request, response) => {
    let materia = request.body["materia"]
    let sql = "SELECT name FROM materie"
    let materie = db.prepare(sql).all()
    if (materie == undefined || Object.keys(materie).length == 0){
        response.send("Nessuna materia presente")
    }
    let found = false
    for (i = 0; i < Object.keys(materie).length && found == false; i++){
        if (materia == materie[i].name){
            found = true
        }
    }
    if (!found){
        response.send("Nessuna materia presente con quel nome")
        return
    }
    sql = "UPDATE cataloghi SET name = ?, materia = ? WHERE name = ?"
    try{
        let info = db.prepare(sql).run(request.body["name"], materia, request.body["old_name"]);
        if (info.changes == 0){
            response.json("Catalogo non presente")
        }
        else{
            response.json("Catalogo aggiornato")
        }
    }
    catch (error){
        console.log(error.message)
        response.json(error.message)
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
