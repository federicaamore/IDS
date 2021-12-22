var test = require('tape');
var request = require('supertest');
var app = require('../');
const fs = require ("fs")

test('Lista schede', function (assert) {
    request(app)
        .get('/api/scheda')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            var expectedValues =  [{id:0,
                                    percorso_immagine: null,
                                    contenuto:"agile è un metodo per sviluppare software",
                                    frequenza_invio_notifica:0,
                                    ultimo_invio: null}];
            assert.error(err, 'Nessun errore');
            assert.same(res.body, expectedValues, '');
            assert.end();
        });
});

test('Aggiunta scheda con parametri corretti', function (assert) {
    request(app)
        .post('/api/scheda')
        .send({
            contenuto: "testo"
        })
        .expect('Content-Type', /json/)
        .expect(201)
        .end(function (err, res) {
            assert.error(err, 'Nessun errore');
            assert.same(res.text.substring(0, res.text.lastIndexOf(" ")), '"Scheda aggiunta con id');
            assert.end();
        });
});

test('Aggiunta scheda senza parametri', function (assert) {
    request(app)
        .post('/api/scheda')
        .expect('Content-Type', /json/)
        .expect(400)
        .end(function (err, res) {
            assert.error(err, 'Nessun errore');
            assert.same(res.text, '"Inserire un\'immagine o il contenuto"');
            assert.end();
        });
});

test('Aggiunta scheda con immagine non esistente', function (assert) {
    let data = {
        "percorso_immagine": "50.jpg",
    }
    request(app)
        .post('/api/scheda')
        .send(data)
        .expect('Content-Type', /json/)
        .expect(404)
        .end(function (err, res) {
            assert.error(err, 'Nessun errore');
            assert.same(res.text, '"Nessuna immagine con il nome indicato"');
            assert.end();
        });
});

test('Rimozione scheda', function (assert) {
    request(app)
        .delete('/api/scheda/1')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            assert.error(err, 'Nessun errore');
            assert.same(res.text, '"Rimosso con successo"');
            assert.end();
        });
});

test('Rimozione scheda non esistente', function (assert) {
    
    request(app)
        .delete('/api/scheda/50')
        .expect('Content-Type', /json/)
        .expect(404)
        .end(function (err, res) {
            assert.error(err, 'Nessun errore');
            assert.same(res.text, '"Nessuna scheda presente con l\'id indicato"');
            assert.end();
        });
});

test('Rimozione scheda con id non numerico', function (assert) {
    
    request(app)
        .delete('/api/scheda/a')
        .expect('Content-Type', /json/)
        .expect(404)
        .end(function (err, res) {
            assert.error(err, 'Nessun errore');
            assert.same(res.text, '"Nessuna scheda presente con l\'id indicato"');
            assert.end();
        });
});