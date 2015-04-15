// Set up app.
var express  = require('express');
var app      = express();

// Get the path of the previous directory.
var directoryParts = __dirname.split('/');
directoryParts.pop();
var path = directoryParts.join('/');

// Basic express setup.
app.use(express.static(path));

// Basic routing.
app.get('*', function(req, res) {
	res.sendfile(path + '/index.html');
});

// Startup server.
app.listen(8080);
console.log("App listening on port 8080");