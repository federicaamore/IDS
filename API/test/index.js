var test = require('tape');
var request = require('supertest');
var app = require('../');

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
    let data = {
        "contact": "dummy",
        "address": "dummy"
    }
    request(app)
        .post('/api/scheda')
        .expect('Content-Type', /json/)
        .expect(201)
        .end(function (err, res) {
            
            assert.error(err, 'Nessun errore');
            assert.match(res.body, "Scheda aggiunta con id");
            assert.end();
        });
});

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