exifjs
=========

javascript wrapper for exiftool.

Installation
============

Simplest way to install `exifjs` is to use [npm](http://npmjs.org), just `npm
install exifjs` which will download exifjs and all dependencies.

Filename can be string or array of strings

exif.get(filename, callback);

**Usage with Callback**
>

	var exifjs = require('exifjs');

	var params = { exiftool : 'Path/to/exiftool/'}; // default is path

	params.epoch = 's'; // default is ms (milliseconds)

	var exif = exifjs(params);


	var file = ["path/to/first/image","path/to/second/image"];

	/*Using Callback*/
	exif.get(file, function (err, json){
		console.log(json);
	});

**Usage with promises**
>>

	/*Using Promise*/
	var exifdata = exif.get('/path/to/image');

	exifdata.done(function (err, resp){
		console.log(err, response);
	});



### Exiftool
http://www.sno.phy.queensu.ca/~phil/exiftool/
---


#### LICENSE
GPL-V2
