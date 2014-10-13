/*\
title: $:/plugins/tiddlywiki/filesystem/filesystemadaptor.js
type: application/javascript
module-type: syncadaptor

A sync adaptor module for synchronising with the local filesystem via node.js APIs

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Get a reference to the file system
var fs = !$tw.browser ? require("fs") : null,
	path = !$tw.browser ? require("path") : null;

function FileSystemAdaptor(options) {
	var self = this;
	this.wiki = options.wiki;
	this.logger = new $tw.utils.Logger("FileSystem");
	// Create the <wiki>/tiddlers folder if it doesn't exist
	$tw.utils.createDirectory($tw.boot.wikiTiddlersPath);
}

FileSystemAdaptor.prototype.getTiddlerInfo = function(tiddler) {
	return {};
};

$tw.config.typeInfo = {
	"text/vnd.tiddlywiki": {
		fileType: "application/x-tiddler",
		extension: ".tid"
	},
	"image/jpeg" : {
		hasMetaFile: true
	}
};

$tw.config.typeTemplates = {
	"application/x-tiddler": "$:/core/templates/tid-tiddler"
};

FileSystemAdaptor.prototype.getTiddlerFileInfo = function(tiddler,callback) {
	// See if we've already got information about this file
	var self = this,
		title = tiddler.fields.title,
		fileInfo = $tw.boot.files[title];
	// Get information about how to save tiddlers of this type
	var type = tiddler.fields.type || "text/vnd.tiddlywiki",
		typeInfo = $tw.config.typeInfo[type];
	if(!typeInfo) {
		typeInfo = $tw.config.typeInfo["text/vnd.tiddlywiki"];
	}
	var extension = typeInfo.extension || "";
	if(!fileInfo) {
		// If not, we'll need to generate it
		// Start by getting a list of the existing files in the directory
		fs.readdir($tw.boot.wikiTiddlersPath,function(err,files) {
			if(err) {
				return callback(err);
			}
			// Assemble the new fileInfo
			fileInfo = {};
			fileInfo.filepath = $tw.boot.wikiTiddlersPath + path.sep + self.generateTiddlerFilename(title,extension,files);
			fileInfo.type = typeInfo.fileType || tiddler.fields.type;
			fileInfo.hasMetaFile = typeInfo.hasMetaFile;
			// Save the newly created fileInfo
			$tw.boot.files[title] = fileInfo;
			// Pass it to the callback
			callback(null,fileInfo);
		});
	} else {
		// Otherwise just invoke the callback
		callback(null,fileInfo);
	}
};

/*
Given a tiddler title and an array of existing filenames, generate a new legal filename for the title, case insensitively avoiding the array of existing filenames
*/
FileSystemAdaptor.prototype.generateTiddlerFilename = function(title,extension,existingFilenames) {
	// First remove any of the characters that are illegal in Windows filenames
	var baseFilename = title.replace(/<|>|\:|\"|\/|\\|\||\?|\*|\^/g,"_");
	// Truncate the filename if it is too long
	if(baseFilename.length > 200) {
		baseFilename = baseFilename.substr(0,200) + extension;
	}
	// Start with the base filename plus the extension
	var filename = baseFilename + extension,
		count = 1;
	// Add a discriminator if we're clashing with an existing filename
	while(existingFilenames.indexOf(filename) !== -1) {
		filename = baseFilename + " " + (count++) + extension;
	}
	return filename;
};

/*
Save a tiddler and invoke the callback with (err,adaptorInfo,revision)
*/
FileSystemAdaptor.prototype.saveTiddler = function(tiddler,callback) {
	var self = this;
	this.getTiddlerFileInfo(tiddler,function(err,fileInfo) {
		var template, content, encoding,
			_finish = function() {
				callback(null, {}, 0);
			};
		if(err) {
			return callback(err);
		}
		if(fileInfo.hasMetaFile) {
			// Save the tiddler as a separate body and meta file
			var typeInfo = $tw.config.contentTypeInfo[fileInfo.type];
			fs.writeFile(fileInfo.filepath,tiddler.fields.text,{encoding: typeInfo.encoding},function(err) {
				if(err) {
					return callback(err);
				}
				content = self.wiki.renderTiddler("text/plain","$:/core/templates/tiddler-metadata",{variables: {currentTiddler: tiddler.fields.title}});
				fs.writeFile(fileInfo.filepath + ".meta",content,{encoding: "utf8"},function (err) {
					if(err) {
						return callback(err);
					}
					self.logger.log("Saved file",fileInfo.filepath);
					_finish();
				});
			});
		} else {
			// Save the tiddler as a self contained templated file
			template = $tw.config.typeTemplates[fileInfo.type];
			content = self.wiki.renderTiddler("text/plain",template,{variables: {currentTiddler: tiddler.fields.title}});
			fs.writeFile(fileInfo.filepath,content,{encoding: "utf8"},function (err) {
				if(err) {
					return callback(err);
				}
				self.logger.log("Saved file",fileInfo.filepath);
				_finish();
			});
		}
	});
};

/*
Load a tiddler and invoke the callback with (err,tiddlerFields)

We don't need to implement loading for the file system adaptor, because all the tiddler files will have been loaded during the boot process.
*/
FileSystemAdaptor.prototype.loadTiddler = function(title,callback) {
	callback(null,null);
};

/*
Delete a tiddler and invoke the callback with (err)
*/
FileSystemAdaptor.prototype.deleteTiddler = function(title,callback,options) {
	var self = this,
		fileInfo = $tw.boot.files[title];
	// Only delete the tiddler if we have writable information for the file
	if(fileInfo) {
		// Delete the file
		fs.unlink(fileInfo.filepath,function(err) {
			if(err) {
				return callback(err);
			}
			self.logger.log("Deleted file",fileInfo.filepath);
			// Delete the metafile if present
			if(fileInfo.hasMetaFile) {
				fs.unlink(fileInfo.filepath + ".meta",function(err) {
					if(err) {
						return callback(err);
					}
					callback(null);
				});
			} else {
				callback(null);
			}
		});
	} else {
		callback(null);
	}
};

if(fs) {
	exports.adaptorClass = FileSystemAdaptor;
}

})();
