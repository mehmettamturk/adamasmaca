var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);


/* Database Schemas */
mongoose.connect('mongodb://localhost/adamasmaca');
mongoose.connection.once('open', function callback () {
    console.log('Mongo Connection OK.');
});

var userSchema = new mongoose.Schema({
    username: String,
    mail: String,
    password: String,
    score: Number
});

var User = mongoose.model('User', userSchema);

var wordsSchema = new mongoose.Schema({
    word: String,
    category: String
});

var Words = mongoose.model('Words', wordsSchema);

/* Requests */
app.get('/user/:username', function(req, res) {
    var username = req.params.username;

    // Todo: 1 tane sonuç geliceği kesin olduğu için find yerine findAll kullanabiliriz.
    User.find({ username:username }, "-password -score", function(err, data) {
        res.json(data);
    });
});

app.get('/users', function(req, res) {
    User.find({}).sort({score: -1}).exec(function(err, data) {
        res.json(data);
    });
});

app.get('/words/:category', function(req, res) {
    // Random Word
    Words.count({category: req.params.category}, function(err, count) {
        var rand = Math.floor(Math.random() * count);
        Words.findOne({category: req.params.category}).skip(rand).exec(function(err, data) {
            res.json(data);
        });
    });

});

module.exports = app;

/*
 // Sample Words
var data1 = { 'word': 'lahmacun', 'category': 'easy' };
var data2 = { 'word': 'alacakaranlık', 'category': 'easy' };
var data3 = { 'word': 'kelime', 'category': 'easy' };
var data4 = { 'word': 'etiket', 'category': 'easy' };
var data5 = { 'word': 'tabanca', 'category': 'normal' };
var data6 = { 'word': 'yankı', 'category': 'normal' };
var data7 = { 'word': 'kambur', 'category': 'normal' };
var data8 = { 'word': 'zifiri', 'category': 'hard' };
var data9 = { 'word': 'tornavida', 'category': 'hard' };

var word1 = new Words(data1);
var word2 = new Words(data2);
var word3 = new Words(data3);
var word4 = new Words(data4);
var word5 = new Words(data5);
var word6 = new Words(data6);
var word7 = new Words(data7);
var word8 = new Words(data8);
var word9 = new Words(data9);

word1.save();
word2.save();
word3.save();
word4.save();
word5.save();
word6.save();
word7.save();
word8.save();
word9.save();

 


 // Sample User
 var data = {
 'username': 'fatma',
 'mail': 'ali@veli.com',
 'password': '123456',
 'score': 4
 };

 var user = new User(data);
 user.save();
 
*/
