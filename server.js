// server.js

// set up ======================================================================
// get all the tools we need
var formidable= require('formidable');
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 1551;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var path 	 = require('path');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var fs=require('fs');
var mkdirp= require('mkdirp')

var User            = require('./app/models/user');
var Post            = require('./app/models/post');
var configDB = require('./config/database.js');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({ secret: 'zX,cvkcnadsklcnadivbakuvbadbvasiudbvabvui' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session



// =====================================
// LOGIN ===============================
// =====================================
// show the login form

app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/profile', // redirect to the secure profile section
    failureRedirect : '/loginfail', // redirect back to the signup page if there is an error
    failureFlash : 'Password or Username incorrect' // allow flash messages
}));
// process the login form
// app.post('/login', do all our passport stuff here);

// =====================================
// SIGNUP ==============================
// =====================================
// show the signup form

app.get('/loginfail', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('signup.ejs', { message: req.flash('signupMessage'), message:'The email id or password entered is incorrect.' });
});
app.get('/signupfail', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('signup.ejs', { message: req.flash('signupMessage'), message:'Account registered from this email already exists.' });
});


app.get('/', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('signup.ejs', { message: req.flash('signupMessage') });
});

app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/details', // redirect to the secure profile section
    failureRedirect : '/signupfail', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

// process the signup form
// app.post('/signup', do all our passport stuff here);

// =====================================
// PROFILE SECTION =====================
// =====================================
// we will want this protected so you have to be logged in to visit
// we will use route middleware to verify this (the isLoggedIn function)
app.get('/details', isLoggedIn, function(req,res){
  var path2='./public/uploads/'+req.user.local.email+'/';
  mkdirp(path2);
  res.render('details.ejs');
});

app.get('/profile', isLoggedIn, function(req, res) {
  Post.find({ 'local.user' :  req.user.local.email }, function(err, post) {
    if(post){
    res.render('profile.ejs', {
        user : (req.user.local.fname+" "+req.user.local.lname),
        userid : req.user.local.email,
        bio    : req.user.local.bio,
        post   : post
        //post : post
        /*sourcen: req
        thumbnail:
        desc:
        title: */
        // get the user out of session and pass to template
    });
    console.log(post.length);
  }
});
});


//__________________BROKEN__________________________________________________________________-
app.get('/space/:userid',function(req,res){
  var email=req.params.userid;
    User.findOne({ 'local.email' :  email }, function(err, user) {
      if(user){
        Post.find({ 'local.user' :  user.local.email }, function(err, post) {
          if(post){
            res.render('profile',{
              root:'./',//VVIMP wont host static files unless root is set to ./public
              user:user.local.fname+" "+user.local.lname,
              userid :user.local.email,
              bio:user.local.bio,
              post   : post
            });
            }
        });
      }
      else{
        res.send('not found');
      }
    });
});


app.post('/update',isLoggedIn, function(req,res){
  var email=req.user.local.email;
  var lname,fname,bio;
  var form = new formidable.IncomingForm();
  var path1='./public/uploads/'+req.user.local.email+'/';
  form.uploadDir = path1;
  form.parse(req, function(err, fields, files) {
    fname=fields.fname;
    lname=fields.lname;
    file=files.file1;
    bio=fields.bio;
    User.findOne({ 'local.email' :  email }, function(err, user) {
        if (err)
            console.log(err);
        if (user) {
            user.local.fname=fname;
            user.local.lname=lname;
            user.local.bio=bio;
            user.save();
            console.log('updated');
        } else {
            res.send("login first faggot");
            console.log('faggot');
        }
      });
      fs.rename(file.path, path.join(form.uploadDir, 'profile.png'));
    console.log("received upload");
  });
  form.on('end', function(){
    console.log('redirect');
    res.redirect('/profile');
  });
  process.nextTick(function(){

  });
  //res.redirect('/profile');
});

app.post('/upload-image',function(req,res,next){

  form = new formidable.IncomingForm();
  var path1='./public/uploads/'+req.user.local.email+'/';
  form.uploadDir = path1;
  form.on('file', function(field, file) {
    fs.rename(file.path, form.uploadDir + "/" + file.name);
  });
  form.parse(req, function(err, fields, files) {
    var file_photo=files.sourcen;
    var file_thumbnail=files.sourcen;
    console.log(fields);
    var title=fields.titlen;
    var desc=fields.desc;

    /*fs.rename(file_photo.path, path.join(form.uploadDir, file_photo.name));
    fs.rename(file_thumbnail.path, path.join(form.uploadDir, file_thumbnail.name));*/

    var newPost = new Post();
    newPost.local.sourcen= '/uploads/'+req.user.local.email+'/'+file_photo.name;
    newPost.local.thumbnail='/uploads/'+req.user.local.email+'/'+file_thumbnail.name;
    newPost.local.desc = desc;
    console.log(desc);
    newPost.local.titlen= title;
    newPost.local.user=req.user.local.email;
    newPost.local.pvt=false;
    console.log(title);
    newPost.save(function(err) {
        if (err)
            throw err;
    });
    console.log("received upload");
    res.redirect('/profile');
  });
});

app.post('/upload-video',function(req,res,next){

  form = new formidable.IncomingForm();
  var path1='./public/uploads/'+req.user.local.email+'/';
  form.uploadDir = path1;
  form.on('file', function(field, file) {
    fs.rename(file.path, form.uploadDir + "/" + file.name);
  });
  form.parse(req, function(err, fields, files) {
    var file_photo=files.sourcen;
    var file_thumbnail=files.thumbnail;
    console.log(fields);
    var title=fields.video_title;
    var desc=fields.video_desc;

    var newPost = new Post();
    newPost.local.sourcen= '/uploads/'+req.user.local.email+'/'+file_photo.name;
    newPost.local.thumbnail='/uploads/'+req.user.local.email+'/'+file_thumbnail.name;
    newPost.local.desc = desc;
    console.log(desc);
    newPost.local.titlen= title;
    newPost.local.user=req.user.local.email;
    newPost.local.pvt=false;
    console.log(title);
    newPost.save(function(err) {
        if (err)
            throw err;
    });
    console.log("received upload");
    res.redirect('/profile');
  });
});

app.post('/upload-audio',function(req,res,next){

  form = new formidable.IncomingForm();
  var path1='./public/uploads/'+req.user.local.email+'/';
  form.uploadDir = path1;
  form.on('file', function(field, file) {
    fs.rename(file.path, form.uploadDir + "/" + file.name);
  });
  form.parse(req, function(err, fields, files) {
    var file_photo=files.sourcen;
    var file_thumbnail=files.thumbnail;
    console.log(fields);
    var title=fields.audio_title;
    var desc=fields.audio_desc;

    /*fs.rename(file_photo.path, path.join(form.uploadDir, file_photo.name));
    fs.rename(file_thumbnail.path, path.join(form.uploadDir, file_thumbnail.name));*/

    var newPost = new Post();
    newPost.local.sourcen= '/uploads/'+req.user.local.email+'/'+file_photo.name;
    newPost.local.thumbnail='/uploads/'+req.user.local.email+'/'+file_thumbnail.name;
    newPost.local.desc = desc;
    console.log(desc);
    newPost.local.titlen= title;
    newPost.local.user=req.user.local.email;
    newPost.local.pvt=false;
    console.log(title);
    newPost.save(function(err) {
        if (err)
            throw err;
    });
    console.log("received upload");
    res.redirect('/profile');
  });
});

app.post('/upload-writeup',function(req,res,next){

  form = new formidable.IncomingForm();
  var path1='./public/uploads/'+req.user.local.email+'/';
  form.uploadDir = path1;
  form.on('file', function(field, file) {
    fs.rename(file.path, form.uploadDir + "/" + file.name);
  });
  form.parse(req, function(err, fields, files) {
    var file_photo=files.thumbnail;
    var file_thumbnail=files.thumbnail;
    console.log(fields);
    var title=fields.text_title;
    var desc=fields.text_desc;

    /*fs.rename(file_photo.path, path.join(form.uploadDir, file_photo.name));
    fs.rename(file_thumbnail.path, path.join(form.uploadDir, file_thumbnail.name));*/

    var newPost = new Post();
    newPost.local.sourcen= '/uploads/'+req.user.local.email+'/'+file_photo.name;
    newPost.local.thumbnail='/uploads/'+req.user.local.email+'/'+file_thumbnail.name;
    newPost.local.desc = desc;
    console.log(desc);
    newPost.local.titlen= title;
    newPost.local.user=req.user.local.email;
    newPost.local.pvt=false;
    console.log(title);
    newPost.save(function(err) {
        if (err)
            throw err;
    });
    console.log("received upload");
    res.redirect('/profile');
  });
});

// =====================================
// LOGOUT ==============================
// =====================================

app.get('/settings', function(req,res){
  res.render('details.ejs');
});

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
