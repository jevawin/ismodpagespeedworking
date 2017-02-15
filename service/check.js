var
  request = require('request'),
  express = require('express'),
  app = express();

// Helper function to neaten headers so we can return them
function formatHeaders(sts, msg, hds) {
  var obj = Object.assign({
    [sts]: msg
  }, hds);

  return obj;
}

app.get('/', function(req, res) {
  if (req.query['url'] === undefined || req.query['ua'] === undefined) {
    res.send('$.handleResponse(\'[-1]\');');
  } else {
    var
      mps = -1, // -1 = error connecting, 0 = connected no mod_pagespeed, 1 = connected with mod_pagespeed
      out = [],
      url = decodeURI(req.query['url']),
      loc = (/^https?/i.test(url)) ? url : 'http://' + url,
      ua = decodeURI(req.query['ua']),
      options = {
        // Add http if it wasn't included
        url: loc,
        headers: {
          'User-Agent': ua
        },
        followRedirect: function(response) {
          // Pushes each connection's headers so the user can inspect
          out.push(formatHeaders(response.statusCode, response.statusMessage, response.headers));

          // Update loc with new location to return
          loc = response.headers.location;

          return true;
        }
      };

    request(options, function(error, response, html) {
      if (!error && response.statusCode == 200) {
        // We connected so set mps to 0
        mps = 0;

        // Look for x-mod-pagespeed or x-page-speed in the headers
        var props = Object.getOwnPropertyNames(response.headers);
        props.forEach(function(key) {
          if (/x(\-mod)?-page-?speed/i.test(key)) {
            mps = 1;
          }
        });

        // Push final headers
        out.push(formatHeaders(response.statusCode, response.statusMessage, response.headers));
      }

      // Add final location to output
      out.unshift(loc);

      // Add mps/error state to output
      out.unshift(mps);

      // Convert to JSON
      out = encodeURIComponent(JSON.stringify(out));

      // Return response inside handleResponse function so it's invoked on load
      res.send('$.handleResponse(\'' + out + '\');');
    });
  }
});

// Start the server
app.listen('8080');
