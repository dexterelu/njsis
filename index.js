const express	= require('express'),
	fs 					= require('fs'),
	jimp 				= require('jimp'),
	multer 			= require('multer'),
	pug					= require('pug'),
	os 					= require('os'),
	app 				= express(),
	port 				= process.env.PORT || 3000,
	connections = process.env.MAX_CONNECTIONS || 1000,
	maxfilesize = 1e7,
	upload 			= multer({
		dest: './public/images/',
		limits: {fileSize: maxfilesize, files: 1}
	}).single('file'),
	started 		= Date.now();

app.set('view engine', 'pug');

// Serve images
app.get('/image/:filename', function (req, res) {
	var filename = req.params['filename'].split('.');
	var original = 'images/' + req.params['filename'];

	// Check if size was specified
	// *TO DO: add support for X only or Y only
	if(req.query['size'] !== undefined) {
		var size = req.query['size'].split('x');
		var cached = 'cache/' + filename[0] + '_' + size[0] + 'x' + size[1] + '.' + filename[1];
		// Send cached file if available
		// *TO DO: Add scaling functionality (ie. 50%), Add original and resized image sizes to database
		if(fs.existsSync('./public/' + cached)) {
			res.sendFile(cached, {root: './public'})
		} else {
			// Load original file if it is not
			if(fs.existsSync('./public/' + original)) {
				jimp.read('./public/' + original, function(err, img) {
					if(err) throw err;
					// Do the math
					var oldX = img.bitmap.width, 						oldY = img.bitmap.height, ratio = oldX / oldY,
							newX = size[0] * 1,									newY = size[1] * 1,
							scaledY = Math.round(newX / ratio),	scaledX = Math.round(newY * ratio);

					// Do the logic
					if((scaledX > newX ) && (scaledY <= newY)) { scaledX = newX } // 				Bound X, Scaled Y
					else if((scaledY > newY) && (scaledX <= newX)) { scaledY = newY } // 		Scaled X, Bound Y

					// Set the paths
					var resized  = 'cache/' + filename[0] + '_' + scaledX + 'x' + scaledY + '.' + filename[1],
							redirect = '/image/' + filename[0] + '.' + filename[1] + '?size=' + scaledX + 'x' + scaledY;

					// Check if scaled image exists, then redirect to it
					if(fs.existsSync('./public/' + resized)) {
						res.redirect(302, redirect)
					} else {
						// When all else fails, actually resize the image
						img.resize(scaledX, scaledY)
							.write('./public/' + resized, function() {
								// And then redirect to it
								res.redirect(302, redirect)
							});
					}
				});				
			} else {
				res.send('File not found! You can try <a href="/upload">uploading</a> it.')
			}
		}
	} else {
		// Send original if no size was provided
		// *TO DO: Send a smaller, cached, image if too many connections are open
		res.sendFile(original, {root: './public'})
	}
});

app.get('/upload', function (req, res) { // Show upload form
	res.render('upload_form', { maxfilesize: maxfilesize })
})

app.post('/upload', function (req, res) { // Upload posted file
	upload(req, res, function(err) {
		if(err) {
			res.send(err + '.');
			return
		} 
		fs.rename(req.file.destination + req.file.filename, req.file.destination + req.file.originalname, function(err) {
			if(err) {
				res.send('Uploaded file could not be renamed. Error ' + err + '.')
			} else {
				res.send('File <a href="/image/' + req.file.originalname + '">' + req.file.originalname + '</a> uploaded successfully.')
			}
		});
	})
})

app.all('/', function (req, res) { // Show index
	// *TO DO: Add support for file count
	//	const shell	= require('shelljs'),
	// 	originals: shell.exec('ls -1 public/images | wc -l', { silent:true }).output
	//	cached: shell.exec('ls -1 public/cache | wc -l', { silent:true }).output
	res.render('index', {
		arch: os.arch(),
		freemem: Math.round(os.freemem()/1.05e6) + 'MB',
		platform: os.platform(),
		server_uptime: os.uptime(),
		njsis_uptime: Math.round((Date.now() - started) / 1000)
	})
})

// Start listening
app.listen(port, function () {
	console.log('NJSIS running on port ' + port)
})