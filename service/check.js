var request = require('request'),
    express = require('express'),
    app = express();

app.get('/', function(req, res) {
  var out = [];
  request({
    url: (req.query['url'].match(/^https?/)) ? req.query['url'] : 'http://' + req.query['url'],
    headers: {
      'User-Agent': req.query['ua']
    },
    followRedirect: function(response) {
      out.push([response.statusCode, response.statusMessage, response.headers]);
      return true;
    }
  }, function(error, response, html) {
    out.push([response.statusCode, response.statusMessage, response.headers]);
    out = JSON.stringify(out);

    res.send('$.handleResponse(\'' + out + '\');');
  });
});

// Start the server
app.listen('8080');
