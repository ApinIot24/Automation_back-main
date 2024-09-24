const mongoose = require('mongoose');
const Schema = mongoose.Schema;


// geo location reference
// "geometry":{
// 	"type":"Point",
// 	"coordinates":[125.6,10.1]
// } 

// Membuat Schema bajak laut"
// const M_penggunaSchema = new Schema({
//  	username:{
// 		type:String
// 	},
//  	email:{
//        	type:String
// 	},
// 	password:{
// 		type:String,
// 		required: true
// 	},
// 	role:{
// 		type:String,
// 		required: true
// 	},
// 	pengguna_role:{
// 		type:String,
// 		required: true
// 	},
// 	pengguna_status:{
// 		type:String,
// 		required: true
// 	},
// 	domain:{
// 		type:String
// 	},
// 	location:{
// 		type:String
// 	}

// });

const M_penggunaSchema = new Schema({
	username:{
	   type:String
   },
   password:{
	   type:String,
	   required: true
   },
   status:{
	   type:String,
	   required: true
   },
   role:{
	type:String,
	request:true
   }

});

 const 	M_pengguna = mongoose.model('M_pengguna',M_penggunaSchema);

 module.exports= M_pengguna;