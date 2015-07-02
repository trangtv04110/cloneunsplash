var fs = require('fs'),
	request = require('request'),
	Progress = require('progress'),
	gm = require('gm').subClass({imageMagick: true}),
	https = require('https');

function changeToGrayscale(img) {
	gm(img)
	.resize(480, 480)
	.noProfile()
	.type("Grayscale")
	.write(img, function (err) {
		//if (!err) console.log('Change Grayscale mode done: ' + img);
		//else console.log("Error change Grayscale mode: " + err);
	});
}

function downloadFile(urlFile, fileName) {
	var folderName = './imgs/';
	if (fs.existsSync(folderName) === false) {
		fs.mkdirSync(folderName, 0777);
	}
	var fileName = folderName + fileName + '.jpg';
	var bar, totalBytes;
	request.get(urlFile)
	.on('response', function(res) {
		totalBytes = parseInt(res.headers['content-length'], 10);
		bar = new Progress(fileName + ' [:bar] :percent :etas :total', {
			complete: '=',
			incomplete: ' ',
			width: 40,
			total: totalBytes
		});
	})
	.on('data', function(chunk) {
		bar.tick(chunk.length);
	})

	.on('error', function(err) {
		console.log('Download error ', err);
	})
	.pipe(fs.createWriteStream(fileName)
		.on('finish', function() {
			//console.log('Done write to file: ' + fileName);
			changeToGrayscale(fileName);
		})
		.on('error', function(err) {
			console.log('Error write to file ', err);
		}));
}

var options = {
	host: 'unsplash.com',
	path: '/'
}
var httpsRequest = https.request(options, function (res) {
	var data = '';
	res.on('data', function (chunk) {
		data += chunk;
	});
	res.on('end', function () {
		var results = data.match(/<img[^>]+src="([^">]+)/g);
		if(results)
		for (var i = 0; i < results.length; i++) {
			//console.log(results[i]);
			//console.log(results[i].split('"').pop());
			if(results[i].split('.').pop().toLowerCase() == 'svg') continue;
			downloadFile(results[i].split('"').pop(), i);
		};
	});
});
httpsRequest.on('error', function (e) {
	console.log(e.message);
});
httpsRequest.end();