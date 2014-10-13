/*\
title: $:/core/modules/startup.js
type: application/javascript
module-type: startup

Miscellaneous startup logic for both the client and server.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "startup";
exports.after = ["load-modules"];
exports.synchronous = true;

// Set to `true` to enable performance instrumentation
var PERFORMANCE_INSTRUMENTATION = false;

var widget = require("$:/core/modules/widgets/widget.js");

exports.startup = function() {
	var modules,n,m,f;
	if($tw.browser) {
		$tw.browser.isIE = (/msie|trident/i.test(navigator.userAgent));
	}
	$tw.version = $tw.utils.extractVersionInfo();
	// Set up the performance framework
	$tw.perf = new $tw.Performance(PERFORMANCE_INSTRUMENTATION);
	// Kick off the language manager and switcher
	$tw.language = new $tw.Language();
	$tw.languageSwitcher = new $tw.PluginSwitcher({
		wiki: $tw.wiki,
		pluginType: "language",
		controllerTitle: "$:/language",
		defaultPlugins: [
			"$:/languages/en-US"
		]
	});
	// Kick off the theme manager
	$tw.themeManager = new $tw.PluginSwitcher({
		wiki: $tw.wiki,
		pluginType: "theme",
		controllerTitle: "$:/theme",
		defaultPlugins: [
			"$:/themes/tiddlywiki/snowwhite",
			"$:/themes/tiddlywiki/vanilla"
		]
	});
	// Clear outstanding tiddler store change events to avoid an unnecessary refresh cycle at startup
	$tw.wiki.clearTiddlerEventQueue();
	// Create a root widget for attaching event handlers. By using it as the parentWidget for another widget tree, one can reuse the event handlers
	if($tw.browser) {
		$tw.rootWidget = new widget.widget({
			type: "widget",
			children: []
		},{
			wiki: $tw.wiki,
			document: document
		});
	}
	// Find a working syncadaptor
	$tw.syncadaptor = undefined;
	$tw.modules.forEachModuleOfType("syncadaptor",function(title,module) {
		if(!$tw.syncadaptor && module.adaptorClass) {
			$tw.syncadaptor = new module.adaptorClass({wiki: $tw.wiki});
		}
	});
	// Set up the syncer object if we've got a syncadaptor
	if($tw.syncadaptor) {
		$tw.syncer = new $tw.Syncer({wiki: $tw.wiki, syncadaptor: $tw.syncadaptor});
	} 
	// Setup the saver handler
	$tw.saverHandler = new $tw.SaverHandler({wiki: $tw.wiki, dirtyTracking: !$tw.syncadaptor});
	// Host-specific startup
	if($tw.browser) {
		// Install the popup manager
		$tw.popup = new $tw.utils.Popup({
			rootElement: document.body
		});
		// Install the animator
		$tw.anim = new $tw.utils.Animator();
	}
};

})();
