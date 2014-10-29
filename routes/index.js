var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Adam Asmaca' });
});

/* GET home page. */
router.get('/privacy', function(req, res) {
    res.render('privacy', { title: 'Adam Asmaca Gizlilik Sözleşmesi' });
});

module.exports = router;
