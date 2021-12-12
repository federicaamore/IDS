var Express = require("express");
var bodyParser = require("body-parser");
const db = require("better-sqlite3")("user_data.db")
var os = require('fs');

db.prepare('CREATE TABLE IF NOT EXISTS schede(id int UNIQUE, percorso_immagine text, contenuto text, frequenza_invio_notifica int, \
    ultimo_invio text)').run()

var app = Express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const { request, response } = require("express");

//SETUP
if (!os.existsSync("./uploads")){
  os.mkdirSync("uploads")
  os.writeFileSync("./uploads/photos.txt","0")
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
    response.json('Hello World');
})

app.post('/upload/img', (request, response) => {
  let image = request.files.image;
  let data = os.readFileSync('./uploads/photos.txt').toString();
  let image_name = data + "." + image.name.split(".").at(-1)
  //Con mv sposto l'immagine nella cartella giusta
  image.mv('./uploads/' + image_name);
  os.writeFileSync("./uploads/photos.txt", (parseInt(data)+1).toString())

  response.send(image_name)
})

//Inizio API SCHEDA

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
    sql = "SELECT percorso_immagine FROM schede WHERE id = ?;"
    row = db.prepare(sql).get(request.params.id)
    if (row == undefined)
        response.json("Scheda non presente")

    sql = "DELETE FROM schede WHERE id = ?"
    console.log(request.params)
    db.prepare(sql, function(err) {
        if (err) {
          return console.log(err.message);
        }
      }).run(request.params.id)
    response.json("Deleted Successfully");
})