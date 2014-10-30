var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var async = require('async');
var session = require('express-session');

var routes = require('./routes/index');

var passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(session({secret: 'hangmansecret'}))
app.use(express.static(__dirname + '/public'));
app.use(passport.initialize());
app.use(passport.session());
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
    score: Number,
    facebookId: String,
    avatar: String
});

var User = mongoose.model('User', userSchema);

var wordsSchema = new mongoose.Schema({
    word: String,
    category: String
});

var Words = mongoose.model('Words', wordsSchema);

var noMoreTurkish = function(text) {
    text = text.replace(/ı/g,"i");
    text = text.replace(/ö/g,"o");
    text = text.replace(/ü/g,"u");
    text = text.replace(/ğ/g,"g");
    text = text.replace(/ş/g,"s");
    text = text.replace(/ç/g,"c");
    return text;
};


passport.use(new FacebookStrategy({
        clientID: '306165839577311',
        clientSecret: '7a899843d1e892e9dee2bf9fdd72d191',
        callbackURL: "http://dev.adamasmaca.com/auth/facebook/callback",
        profileFields: [ "id", "name", "link", "gender", "locale", "age_range", "displayName", "photos", "email" ],
        passReqToCallback: true
    },
    function(req, accessToken, refreshToken, profile, done) {
        console.log(profile)

        var usernameData = profile.displayName.split(' ');
        var username = usernameData[0].toLowerCase() + (usernameData[1] ? usernameData[1].toLowerCase() : '');
        username = noMoreTurkish(username);

        var query = { $or: [ { 'username': req.session.username }, { 'facebookId': profile.id } ] };
        User.find(query, function(err, users) {
            if (err) return done(err, null);

            if (users.length > 1) {
                var combinedUser = users[0].facebookId ? users[0] : users[1];
                var deletedUser = users[0].facebookId ? users[1] : users[0];
                combinedUser.score = users[0].score > users[1].score ? users[0].score : users[1].score;

                combinedUser.save(function(err, savedUser) {
                    User.findOneAndRemove({'_id': deletedUser._id}, function(err, res) {
                        console.log('User deleted: ' + deletedUser._id);
                        req.session.user = combinedUser;
                        req.session.username = combinedUser.username;
                        done(err, savedUser);
                    });
                })

            } else {
                var user = users[0];
                user.username = username;
                user.displayName = profile.displayName;
                user.mail = profile.emails && profile.emails[0].value;
                user.facebookId = profile.id;
                user.avatar = '//graph.facebook.com/' + profile.id + '/picture';

                user.save(function(err, doc) {
                    req.session.user = doc;
                    req.session.username = username;
                    done(err, doc);
                });
            }
        });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

app.get('/auth/facebook', passport.authenticate('facebook', { scope: [ 'email' ] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/' }));



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
            req.session.totalPoints = 0;
            doc.save();
        }
    })
};


app.post('/login', function(req, res) {
    res.send('login')
});


app.post('/register', function(req, res) {
    res.send('register')
});

app.get('/logout', function(req, res) {
    delete req.session.user;
    delete req.session.username;
    req.logout();
    res.redirect('/');
});


var points = {
    easy: 10,
    normal: 20,
    hard: 30
};


/* Requests */
app.get('/user/:username', function(req, res) {
    var username = req.params.username;

    User.findOne({ username: username }, "-password -score", function(err, data) {
        res.json(data);
    });
});


app.get('/account', function(req, res) {
    if (!req.session.username)
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
                res.send({
                    username: req.session.username
                });
            });
        });
    else {
        var userData = req.session.user || {
            username: req.session.username
        };
        res.send(userData);
    }
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
            updateUser(req);
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
}

setupDb();
