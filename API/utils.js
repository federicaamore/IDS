const fs = require("fs")
function is_subject(db, materia){
    let sql = "SELECT name FROM materie"
    let materie = db.prepare(sql).all()
    let found = false
    for (i = 0; i < Object.keys(materie).length && found == false; i++){
        if (materia == materie[i].name){
            found = true
        }
    }
    console.log(materie, materia)
    return found
}

function event_exists(db, event_id){
    let sql = "SELECT id FROM eventi WHERE id = ?"
    let rows = db.prepare(sql).all(event_id)
    let found = true
    if (rows == undefined || Object.keys(rows).length == 0){
        found = false
    }
    return found
}

function add_file(request){
    let file = request.files.file;
    let data = fs.readFileSync('./uploads/files.txt').toString();
    let file_name = data + "." + file.name.split(".").at(-1)
    if (file.size > 10485760)
        return "error"
    //Con mv sposto l'immagine nella cartella giusta
    file.mv('./uploads/' + file_name);
    fs.writeFileSync("./uploads/files.txt", (parseInt(data)+1).toString())
    return file_name
}
module.exports = {is_subject, add_file, event_exists}