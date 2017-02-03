// app/models/user.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var postSchema = mongoose.Schema({
  local            : {
        sourcen       : String,
        thumbnail     : String,
        desc          :String,
        titlen        :String,
        user          : String,
        pvt      : Boolean
    },
});

module.exports = mongoose.model('Post', postSchema);
