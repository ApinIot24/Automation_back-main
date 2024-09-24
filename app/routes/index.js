// routes/index.js
//untuk Master
const compresor = require('./table/compresor')
const listrik = require('./table/listrik')
module.exports = function(app, db) {
    //Master
    compresor(app,db);
    listrik(app,db);
};