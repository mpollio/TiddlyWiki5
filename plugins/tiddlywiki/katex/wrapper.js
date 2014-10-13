/*\
title: $:/plugins/tiddlywiki/katex/wrapper.js
type: application/javascript
module-type: widget

Wrapper for `katex.min.js` that provides a `<$latex>` widget. It is also available under the alias `<$katex>`

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var katex = require("$:/plugins/tiddlywiki/katex/katex.min.js"),
	Widget = require("$:/core/modules/widgets/widget.js").widget;

var KaTeXWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
KaTeXWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
KaTeXWidget.prototype.render = function(parent,nextSibling) {
	// Housekeeping
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Get the source text
	var text = this.getAttribute("text",this.parseTreeNode.text || "");
	// Render it into a span
	var span = this.document.createElement("span");
	try {
		if($tw.browser) {
			katex.render(text,span);
		} else {
			span.innerHTML = katex.renderToString(text);
		}
	} catch(ex) {
		span.className = "tc-error";
		span.textContent = ex;
	}
	// Insert it into the DOM
	parent.insertBefore(span,nextSibling);
	this.domNodes.push(span);
};

/*
Compute the internal state of the widget
*/
KaTeXWidget.prototype.execute = function() {
	// Nothing to do for a katex widget
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
KaTeXWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.text) {
		this.refreshSelf();
		return true;
	} else {
		return false;	
	}
};

exports.latex = KaTeXWidget;
exports.katex = KaTeXWidget;

})();

