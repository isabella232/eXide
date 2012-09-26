/*
 *  eXide - web-based XQuery IDE
 *  
 *  Copyright (C) 2011 Wolfgang Meier
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

eXide.namespace("eXide.edit.Outline");

/**
 * XQuery function outline view. Available functions and variables are
 * kept in the document instance. Templates are loaded once and kept in
 * this class.
 * 
 */
eXide.edit.Outline = (function () {
	
	Constr = function() {
		this.currentDoc = null;
		this.templates = [];
		
		this.$loadTemplates();
	};
	
	Constr.prototype = {
		
		getTemplates: function (prefix) {
			var re = new RegExp("^" + prefix);
			var matches = [];
			for (var i = 0; i < this.templates.length; i++) {
				if (this.templates[i].name.match(re)) {
					matches.push(this.templates[i]);
				}
			}
			return matches;
		},
		
		gotoDefinition: function(doc, name) {
			$.each(doc.functions, function (i, func) {
				if (name == func.name) {
					eXide.app.locate(func.type, func.source == '' ? null : func.source, name);
					return;
				}
			});
		},
		
		updateOutline: function(doc) {
            var self = this;
			self.currentDoc = doc;
			doc.functions = [];
			$("#outline").empty();
            var helper = doc.getModeHelper();
            if (helper != null) {
                helper.createOutline(doc, function() {
                    self.$outlineUpdate(doc);
                });
            }
		},
		
		clearOutline: function() {
			$("#outline").empty();
		},
		
		$outlineUpdate: function(doc) {
			if (this.currentDoc != doc)
				return;
			
            $.log("Updating outline");
			var layout = $("body").layout();
			// layout.open("west");
			eXide.app.resize();
			
			var ul = $("#outline");
			ul.empty();
			for (var i = 0; i < doc.functions.length; i++) {
				var func = doc.functions[i];
				var li = document.createElement("li");
				var a = document.createElement("a");
				if (func.signature)
					a.title = func.signature;
                var _a = $(a);
				if (func.type == eXide.edit.Document.TYPE_FUNCTION)
					_a.addClass("t_function");
				else
					_a.addClass("t_variable");
				if (func.source)
					a.href = "#" + func.source;
				else
					a.href = "#";
                if (func.visibility === "private") {
                    _a.addClass("private");
                } else {
                    _a.addClass("public");
                }
                if (func.row) {
                    a.dataset.row = func.row;
                }
				a.appendChild(document.createTextNode(func.name));
				li.appendChild(a);
				ul.append(li);
                
				_a.click(function (ev) {
                    ev.preventDefault();
					var path = this.hash.substring(1);
                    if (this.dataset.row) {
                        eXide.app.locate("function", path == '' ? null : path, parseInt(this.dataset.row));
                    } else	if ($(this).hasClass("t_function")) {
						eXide.app.locate("function", path == '' ? null : path, $(this).text());
					} else {
						eXide.app.locate("variable", path == '' ? null : path, $(this).text());
					}
				});
			}
		},
		
		$loadTemplates: function() {
			var $this = this;
			$.ajax({
				url: "templates/snippets.xml",
				dataType: "xml",
				type: "GET",
				success: function (xml) {
					$(xml).find("snippet").each(function () {
						var snippet = $(this);
						var abbrev = snippet.attr("abbrev");
						var description = snippet.find("description").text();
						var code = snippet.find("code").text();
						$this.templates.push({
							TYPE: eXide.edit.Document.TYPE_TEMPLATE,
							name: abbrev,
							help: description,
							template: code
						});
					});
				}
			});
		}
	};
	
	return Constr;
}());
