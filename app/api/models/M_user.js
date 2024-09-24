const mongoose = require('mongoose');
//Define a schema
const Schema = mongoose.Schema;
const M_userSchema = new Schema({
 name: {
  type: String,
  trim: true,  
  required: true,
 },
 released_on: {
  type: Date,
  trim: true,
  required: true
 }
});
module.exports = mongoose.model('M_user', M_userSchema)