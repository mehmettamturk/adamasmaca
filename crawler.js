var http = require("http");
var cheerio = require("cheerio");
var charArr = { 'a': 1, 'b': 3, 'c': 4, 'ç': 4, 'd': 3, 'e': 1, 'f': 7, 'g': 5, 'ğ': 8, 'h': 5, 'ı': 2, 'i': 1, 'j': 10, 'k': 1, 'l': 1, 'm': 2, 'n': 1, 'o': 2, 'ö': 7, 'p': 5, 'r': 1, 's': 2, 'ş': 4, 't': 1, 'u': 2, 'ü': 3, 'v': 7, 'y': 3, 'z': 4};

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/adamasmaca');
mongoose.connection.once('open', function callback () {
    console.log('Mongo Connection OK.');
});

var wordsSchema = new mongoose.Schema({
    word: String,
    category: String
});

var Words = mongoose.model('Words', wordsSchema);

function download(url, callback) {
    http.get(url, function(res) {
        res.setEncoding("binary");
        var data = "";
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on("end", function() {
            callback(data);
        });
    }).on("error", function() {
        callback(null);
    });
}

function getTextPoint(text) {
    var total = 0,
        max = 0,
        min = 10;

    for (var i = 0; i < text.length; i++) {
        var point = charArr[text.charAt(i)];

        total = total + point;
        if (max < point) {
            max = point;
        }

        if (min > point) {
            min = point;
        }
    }

    var cat = Math.round((total - max - min) / (text.length - 2));
    if (text.length < 4)
        cat = cat + 2;
    else if (text.length < 5)
        cat++;

    var category = 'easy';
    if (cat > 4)
        category = 'hard';
    else if (cat > 2)
        category = 'normal';

    return category;
}

var urls = [];
for (var key in charArr) {
    if (key == 'ç') key = '%E7';
    if (key == 'ğ') key = '%F0';
    if (key == 'ı') key = '%FD';
    if (key == 'ö') key = '%F6';
    if (key == 'ş') key = '%FE';
    if (key == 'ü') key = '%FC';

    urls.push('http://turkisaretdili.ku.edu.tr/tr/kelimelistesi/sozluk.aspx?Char=' + key)
}

urls.forEach(function(url) {
    download(url, function(data) {
        if (data) {
            var $ = cheerio.load(data);
            $("#dlWords td a").each(function(i, e) {
                var text = $(e).text();
                text = text.replace(/ý/g, "ı").replace(/þ/g, "ş").replace(/ð/g, "ğ").replace(/\(/g, "").replace(/\)/g, "");

                if (text.length > 3 && text.split(' ').length < 3) {
                    Words.find({word: text}, function(err, data) {
                        if (!data.length) {
                            var dbWord = new Words({
                                'word': text,
                                'category': getTextPoint(text)
                            });
                            dbWord.save();
                        }
                    })
                }

            });

        }
        else console.log("error");
    });
});
