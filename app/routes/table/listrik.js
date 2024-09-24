var ObjectID = require('mongodb').ObjectID;
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
var corsOptions = {
    origin: "*"
};
module.exports = function(app, db) {
    const collection =

        app.use(cors(corsOptions));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT ,DELETE");
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept"
        );
        next();
    });
    app.get('/listrik/domain/:domain', (req, res) => {
        const domain = req.params.domain;

        db.collection('listriks').find({ listrik_domain : domain }).toArray(function(err, data) {
            if (err) {
                res.send({ 'err': 'Error Masque' })
            } else {
                res.send(data);
            }
        });
    });
    app.use(bodyParser.json());
    app.post('/listrik', function(request, response) {
        console.log(request.body); // your JSON
        db.collection('listriks').insert(request.body); // echo the result back
        response.send("sukses!!");
    });
    app.post('/packing', function(request, response) {
        console.log(request.body); // your JSON
        db.collection('packing').insert(request.body); // echo the result back
        response.send("sukses!!");
    });
    app.delete('/listrik/:id', (req, res) => {
        const id = req.params.id;
        const details = { '_id': new ObjectID(id) };
        var myquery = { listrik_deleted: "N" };
        var newvalues = { $set: { listrik_deleted: "Y" } };
        db.collection("listriks").updateOne(myquery, newvalues, details, function(err, item) {
            if (err) {
                res.send({ 'error': 'An error has occurred' });
            } else {
                res.send('Soft Deleted');
            }
            // if (err) throw err;
            // console.log("1 document updated");
            // db.close();
        });
    });
    app.use(bodyParser.json());
    app.put('/listrik/:id', (request, response) => {
        const id = request.params.id;
        const details = { '_id': new ObjectID(id) };
        var newvalues = { $set: request.body };
        // const detil = { '_id': new ObjectID(id) };
        db.collection('listriks').findOneAndReplace(details, newvalues, function(err, item) {
            if (err) {
                response.send(err);
            } else {
                response.send(item);
            }
        });
    });
};