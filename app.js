var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var async = require('async');
var session = require('express-session');

var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(session({secret: 'hangmansecret'}))

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


var getUniqueUsername = function(cb) {
    var rand = Math.floor((Math.random() * 1000) + 1);
    var newUsername = 'anonim' + rand;

    User.findOne({'username': newUsername}, function(err, data) {
        if (!data)
            cb(newUsername);
        else
            getUniqueUsername(cb);
    });
};


var updateUser = function(req, cb) {
    var session = req.session;
    User.findOne({'username': session.username}, function(err, doc) {
        if (doc && parseInt(doc.score) < parseInt(session.totalPoints)) {
            doc.score = session.totalPoints;
            doc.save(cb);
        }
    })
};


var points = {
    easy: 10,
    normal: 20,
    hard: 30
};


/* Requests */
app.use(function(req, res, next) {
    if (!req.session.username) {
        getUniqueUsername(function(newUsername) {
            var newUser = new User({
                username: newUsername,
                mail: '',
                password: '',
                score: 0
            });

            newUser.save(function(err, data) {
                req.session.username = data.username;
                req.session.totalPoints = 0;
                next();
            });
        });
    } else
        next();
});


app.get('/user/:username', function(req, res) {
    var username = req.params.username;

    User.findOne({ username: username }, "-password -score", function(err, data) {
        res.json(data);
    });
});


app.get('/account', function(req, res) {
    var username;
    if (req.session && req.session.username)
        username = req.session.username;

    res.send({
        username: username
    });
});

app.get('/users', function(req, res) {
    User.find({}).sort({score: -1}).exec(function(err, data) {
        res.json(data);
    });
});


app.get('/startNewGame', function(req, res) {
    req.session.trialCount = 6;
    var words = [];

    var shapeData = function(wordsData) {
        wordsData = wordsData.map(function(wordData) {
            var data = wordData.toObject();
            var word = data.word;
            data.lengths = [];

            var eachWord = word.split(' ');
            for (var i = 0; i < eachWord.length; i++) {
                data.lengths.push(eachWord[i].length);
            }

            delete data.word;
            return data;
        });

        return wordsData;
    };

    var getWords = function(category, limit, callback) {
        if (limit == 100)
            Words.find({category: category}).exec(function (err, data) {
                words = words.concat(shapeData(data));
                callback();
            });
        else
            Words.count({category: category}, function(err, count) {
                var rand = Math.floor(Math.random() * count);
                Words.find({category: category}).skip(rand).limit(limit).exec(function (err, data) {
                    words = words.concat(shapeData(data));
                    callback();
                });
            });
    };

    async.series([
        function(callback) {
            getWords('easy', 3, callback);
        },
        function(callback) {
            getWords('normal', 4, callback);
        },
        function(callback) {
            getWords('hard', 100, callback);
        }
    ], function(err, data) {
        res.json(words);
    });
});


app.post('/check', function(req, res) {
    var id = req.body.id;
    var char = req.body.char.toLowerCase();
    var result = req.body.result;

    if (req.session.questionId != id) {
        req.session.trialCount = 6;
        req.session.questionId = id;
    }

    Words.findOne({_id: id}, function(err, data) {
        var word = data.word.toLowerCase();
        var foundAChar = false;
        for (var i = 0; i < word.length; i++) {
            if (word[i] == char) {
                foundAChar = true;
                result = result.substr(0, i) + char + result.substr(i + 1);
            }
        }

        if (result == word)
            req.session.totalPoints += points[data.category] - (6 - req.session.trialCount);

        if (req.session.questionId == id && !foundAChar)
            req.session.trialCount--;

        if (req.session.trialCount == 0) {
            result = word;
            updateUser(req, function() {
                req.session.totalPoints = 0;
            });
        }

        res.send({
            result: result,
            trialCount: req.session.trialCount
        });
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

function setupDb() {
    var words = [
        { 'word': 'alacakaranlık', 'category': 'easy' },
        { 'word': 'arkadaş', 'category': 'easy' },
        { 'word': 'etiket', 'category': 'easy' },
        { 'word': 'erkek', 'category': 'easy' },
        { 'word': 'harita', 'category': 'easy' },
        { 'word': 'kimya', 'category': 'easy' },
        { 'word': 'kelime', 'category': 'easy' },
        { 'word': 'lahmacun', 'category': 'easy' },
        { 'word': 'şekerpare', 'category': 'easy' },
        { 'word': 'terlik', 'category': 'easy' },
        { 'word': 'alafranga', 'category': 'normal' },
        { 'word': 'bağlama', 'category': 'normal' },
        { 'word': 'final', 'category': 'normal' },
        { 'word': 'kambur', 'category': 'normal' },
        { 'word': 'kanalizasyon', 'category': 'normal' },
        { 'word': 'paratoner', 'category': 'normal' },
        { 'word': 'tabanca', 'category': 'normal' },
        { 'word': 'telefon', 'category': 'normal' },
        { 'word': 'timsah', 'category': 'normal' },
        { 'word': 'üniversite', 'category': 'normal' },
        { 'word': 'yankı', 'category': 'normal' },
        { 'word': 'demeç', 'category': 'hard' },
        { 'word': 'dergah', 'category': 'hard' },
        { 'word': 'distrübütör', 'category': 'hard' },
        { 'word': 'helikopter', 'category': 'hard' },
        { 'word': 'ızdırap', 'category': 'hard' },
        { 'word': 'korniş', 'category': 'hard' },
        { 'word': 'otobüs', 'category': 'hard' },
        { 'word': 'repertuar', 'category': 'hard' },
        { 'word': 'tedavül', 'category': 'hard' },
        { 'word': 'telepati', 'category': 'hard' },
        { 'word': 'tornavida', 'category': 'hard' },
        { 'word': 'zifiri', 'category': 'hard' }
    ];

    words.forEach(function(word) {
        Words.find({word: word.word}, function(err, data) {
            if (!data.length) {
                var dbWord = new Words(word);
                dbWord.save();
            }
        })
    });

    var users = [
        {
            username: 'fatma',
            mail: 'fatma@gmail.com',
            password: '123456',
            score: 15
        },
        {
            username: 'esra',
            mail: 'esra@gmail.com',
            password: '123456',
            score: 18
        },
        {
            'username': 'mehmet',
            'mail': 'mehmet@gmail.com',
            'password': '123456',
            'score': 7
        }
    ];

    users.forEach(function(user) {
        User.find({mail: user.mail}, function(err, data) {
            if (!data.length) {
                var dbUser = new User(user);
                dbUser.save();
            }
        })
    });
}

setupDb();
