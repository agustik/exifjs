exifjs
=========

javascript wrapper for exiftool.


Filename can be string or array of strings

exif.get(filename, callback);

**Usage**
>Code example

	var exif = require('exifjs');
	exif.setup.exiftool = "path/to/exiftool";

	var file = ["path/to/first/image","path/to/second/image"];

	exif.get(file, function (err, json){
		console.log(json);
	});


Exiftool
http://www.sno.phy.queensu.ca/~phil/exiftool/