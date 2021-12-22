fs = require("fs")
if (fs.existsSync("user_data.db"))
    fs.unlinkSync("user_data.db")
const db = require("better-sqlite3")("user_data.db")

if (!fs.existsSync("./uploads")){
    fs.mkdirSync("uploads")
    fs.writeFileSync("./uploads/0.txt", "Questo è un file di test")
    fs.writeFileSync("./uploads/files.txt","1")
  }
  
sql =  "CREATE TABLE IF NOT EXISTS schede(id int UNIQUE, percorso_immagine text, contenuto text, frequenza_invio_notifica int, ultimo_invio text);\
        CREATE TABLE IF NOT EXISTS materie(name text UNIQUE, R int, G int, B int);\
        CREATE TABLE IF NOT EXISTS cataloghi(name text UNIQUE, materia text);\
        CREATE TABLE IF NOT EXISTS note(id int UNIQUE, nome text, percorso_file text, catalogo text);\
        CREATE TABLE IF NOT EXISTS eventi(id text UNIQUE, materia text)"
db.exec(sql)
sql = "INSERT INTO schede (id, contenuto, frequenza_invio_notifica) VALUES (0, 'agile è un metodo per sviluppare software', 0)"  
db.prepare(sql).run()
sql = "INSERT INTO materie (name, R, G, B) VALUES ('Ingegneria del software', 34, 34, 34)"
db.prepare(sql).run()
sql = "INSERT INTO cataloghi (name, materia) VALUES ('appunti', 'Ingegneria del software')"
db.prepare(sql).run()
sql = "INSERT INTO note (id, nome, percorso_file, catalogo) VALUES (0, '0.txt', '0.txt', 'appunti')"
db.prepare(sql).run()
