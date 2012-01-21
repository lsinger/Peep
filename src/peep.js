function SaveHash() { }
SaveHash.prototype = {
	set: function (key, value) {
		this["s_" + key] = value;
	},
	get: function (key) {
		return this["s_" + key];
	}
};
var g_urls = new SaveHash();
var Caret = {
	Find: function (parentClass) {
		var range = window.getSelection().getRangeAt(0), containerElement = range.commonAncestorContainer, parent = containerElement;
		if (containerElement.nodeType == 3) {
			containerElement = containerElement.parentNode;
		}
		
		if ( parentClass )
		{
			if ( !$(parent).hasClass(parentClass) && $(parent).parents('.'+parentClass).length > 0 ) {
				parent = $(parent).parents('.'+parentClass).get(0);
			}
		}
		
		return {
			Offset: this.getPositionWithin(parent), //range.startOffset
			Container: range.startContainer,
			Element: $(containerElement)
		};
	},
	Set: function ( obj, offset ) {
		var range = window.getSelection().getRangeAt(0);
		range.setStart(obj, offset);
		range.setEnd(obj, offset);
	},
	getPositionWithin: function(element) {
		var caretOffset = 0;
		if (typeof window.getSelection != "undefined") {
		var range = window.getSelection().getRangeAt(0);
			var preCaretRange = range.cloneRange();
			preCaretRange.selectNodeContents(element);
			preCaretRange.setEnd(range.endContainer, range.endOffset);
			caretOffset = preCaretRange.toString().length;
		} else if (typeof document.selection != "undefined" && document.selection.type != "Control") {
			var textRange = document.selection.createRange();
			var preCaretTextRange = document.body.createTextRange();
			preCaretTextRange.moveToElementText(element);
			preCaretTextRange.setEndPoint("EndToEnd", textRange);
			caretOffset = preCaretTextRange.text.length;
		}
		return caretOffset;
	}
};

(function ( $, window, document, undefined ) {

	var pluginName = 'peep',
		defaults = {},
		specialMap = {8:1,13:1},
		charMap = '#*_',
		peepBody = $('<table/>', { cellspacing:0, cellpadding:0, border:0}).css('border',0),
		peepLine = $('<table/>').append(
			$('<tr/>').addClass('peepline')
			.append(
				$('<td/>').addClass('gutter')
			).append(
				$('<td/>').addClass('margin').html(' ')
			).append(
				$('<td/>').addClass('body')
			)
		),
		peepEmpty = $('<table/>').append($('<tr/>').addClass('empty peepline')),
		changes,
		base;
	
	function Plugin( element, options ) {
		base = this;
		this.changes = 0;
		this.element = element;
		this.options = $.extend( {}, defaults, options);
		

		this._defaults = defaults;
		this._name = pluginName;

		this.init();
	}

	Plugin.prototype.init = function () {
		var start = new Date();
		var $el = $(this.element).attr('contenteditable', true), base = this;
		document.execCommand("enableInlineTableEditing", null, false);
		document.execCommand("enableObjectResizing", false, false);
		
		//document.designMode = 'on';
		
		var md = $el.text();
		console.log(md);
		var html = this.Parse(md);
		$el.html($(peepBody.clone().wrap('<div>').parent().html()).append(html));
		console.log(' ');
		console.log('-- BENCHMARK');
		console.log(' ', 'msecs', new Date()-start);
		console.log(' ', 'count', this.changes);
		console.log(' ', 'match', md==$(this.element).text());
		//$el.html($(html).wrap(peepBody.clone()));
		
		$el.keypress(function(e){
			var c = String.fromCharCode(e.which),
				interrupt = false,
				car = Caret.Find('body'),
				elem = car.Element,
				$line = elem.parents('.peepline'),
				text = $line.text(),
				beforeCar = text.substring(0,car.Offset),
				afterCar = text.substring(car.Offset);
			
			console.log('e.which', e.which);
			console.log('fromChar', '"'+c+'"');
			console.log('e.keyCode', e.keyCode);
			console.log('offset', car.Offset);
			
			
			if ( charMap.indexOf(c) !== -1 || specialMap[e.which] !== undefined ) {
				// look for enter, or backspace
				// If enter, newline! And if placed in the middle or start of a line?
				// If backspace into a block element, apply the block to the text!
				
				console.log(charMap.indexOf(c), specialMap[e.which]);
				if ( e.which === 101 )
				{
					console.log(car);
					//console.log($line);
					//console.log(line);
					//console.log(car.Offset);
					//console.log(beforeCar);
					//console.log(afterCar);
				}
				
				if ( e.which === 13 ) { // return key
					var lineParent = $line.parent('tbody').length > 0 ? $line.parent('tbody') : $line;
					$line.replaceWith(base.ParseLine(beforeCar).find('.peepline'));
					var newLine = (lineParent.after(base.ParseLine(afterCar).find('.peepline'))).next();
					Caret.Set(newLine.find('.body').get(0), 0);
					interrupt = true;
				}
			}
			else
			{
				console.log('redoing line');
				var nLine = base.ParseLine(text).find('.peepline');
				console.log(nLine);
				$line.replaceWith(nLine);
			}
			
			if ( interrupt ) {
				console.log('interrupting stuff');
				return false;
			}
		});
	};
	
	Plugin.prototype.ParseLine = function ( text ) {
		
		var pLine = peepLine.clone(),
			block = false,
			blockClass = '',
			gutter = ( gutter = text.indexOf(' ') ) !== -1 && gutter <= 6 ? text.substring(0,gutter) : false;
		
		
		// Lists
		text = text.replace(/^(\d+[.]).+?(.*)/gm,
			function (wholeMatch, m1, m2 ) {
				block = m1;
				blockClass = 'ol';
				base.changes++;
				return m2;
			}
		);
		
		// Code blocks
		
		text += "~0";

		text = text.replace(/(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=~0))/g,
			function (wholeMatch, m1, m2) {
				var codeblock = m1;
				var nextChar = m2;

				codeblock = _EncodeCode(_Outdent(codeblock));
				codeblock = _Detab(codeblock);
				codeblock = codeblock.replace(/^\n+/g, ""); // trim leading newlines
				codeblock = codeblock.replace(/\n+$/g, ""); // trim trailing whitespace

				codeblock = "<pre><code>" + codeblock + "\n</code></pre>";

				return "\n\n" + codeblock + "\n\n" + nextChar;
			}
		);

		// attacklab: strip sentinel
		text = text.replace(/~0/, "");
		
		// Headers
		text = text.replace(/^(\#{1,6})[ \t]*(.+?)[ \t]*\#*\n*$/gm,
			function (wholeMatch, m1, m2) {
				base.changes++;
				blockClass = 'h' + m1.length;
				block = m1;
				return base.ParseInline(m2);
			}
		);
		
		if ( block )
		{
			pLine.attr('class','peepline peep-' + blockClass)
				.find('.gutter').html(gutter)
			.end()
				.find('.body').html(this.ParseInline(text));
		}
		else if ( text.length > 0 )
		{
			pLine.find('.margin').html('').end().find('.body').html(this.ParseInline(text));
		}
		else
		{
			pLine = peepEmpty.clone();
		}
		
		return pLine;
	};
	
	Plugin.prototype.ParseInline = function ( text ) {
		// Images
		text = text.replace(/(!\[(.*?)\][ ]?(?:\n[ ]*)?\[(.*?)\])()()()()/g,
			function(wholeMatch, m1, m2, m3, m4, m5, m6, m7){
				base.changes++;
				return base.writeImageTag(wholeMatch, m1, m2, m3, m4, m5, m6, m7);
			}
		).replace(/(!\[(.*?)\]\s?\([ \t]*()<?(\S+?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g,
			function(wholeMatch, m1, m2, m3, m4, m5, m6, m7){
				base.changes++;
				return base.writeImageTag(wholeMatch, m1, m2, m3, m4, m5, m6, m7);
			}
		);
		
		// Bold & Emphasis
		text = text.replace(/([\W_]|^)(\*\*?|__?)(?=\S)([^\r]*?\S[\*_]*)\2([\W_]|$)/g,
			function(wholeMatch, m1, m2, m3, m4){
				base.changes++;
				if ( m2.length == 2 ) { // bold
					return m1 + "<strong>" + m2 + m3 + m2 + "</strong>" + m4;
				}
				
				if ( m2.length == 1) { // emphasis
					return m1 + "<em>" + m2 + m3 + m2 + "</em>" + m4;
				}
				
				return wholeMatch;
			}
		);
		
		// Code ticks `code`
		text = text.replace(/([\W_]|^)(\`{1,2})(?=\S)([^\r]*?\S[\`]*)\2([\W_]|$)/g,
			function(wholeMatch, m1, m2, m3, m4){
				base.changes++;
				return m1 + "<code>" + m2 + m3 + m2 + "</code>" + m4;
			}
		);
		
		// Links
		text = text.replace(/[^\!](\[((?:\[[^\]]*\]|[^\[\]])*)\][ ]?(?:\n[ ]*)?\[(.*?)\])()()()()/g,
			function(wholeMatch, m1, m2, m3, m4, m5, m6, m7){
				base.changes++;
				return base.writeAnchorTag(wholeMatch, m1, m2, m3, m4, m5, m6, m7);
			}
		).replace(/[^\!](\[((?:\[[^\]]*\]|[^\[\]])*)\]\([ \t]*()<?((?:\([^)]*\)|[^()])*?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g,
			function(wholeMatch, m1, m2, m3, m4, m5, m6, m7){
				base.changes++;
				console.log(wholeMatch);
				return base.writeAnchorTag(wholeMatch, m1, m2, m3, m4, m5, m6, m7);
			}
		).replace(/[^\!](\[([^\[\]]+)\])()()()()()/g,
			function(wholeMatch, m1, m2, m3, m4, m5, m6, m7){
				base.changes++;
				return base.writeAnchorTag(wholeMatch, m1, m2, m3, m4, m5, m6, m7);
			}
		).replace(/(^|\s)(https?|ftp)(:\/\/[\-A-Z0-9+&@#\/%?=~_|\[\]\(\)!:,\.;]*[\-A-Z0-9+&@#\/%=~_|\[\]])($|\W)/gi, // Auto links
			function(wholeMatch, m1, m2, m3, m4){
				base.changes++;
				return m1 + "<" + m2 + m3 + ">" + m4;
			}
		).replace(/<((https?|ftp):[^'">\s]+)>/gi, //  autolink anything like <http://example.com>
			function (wholematch, m1) {
				return "<a href=\"" + m1 + "\">" + m1 + "</a>";
			}
		);
		return text;
	};
	
	Plugin.prototype.Parse = function ( text ) {
		
		/* clean up */
		text = text.replace(/\r\n/g, "\n"); // DOS to Unix
		text = text.replace(/\r/g, "\n"); // Mac to Unix
		text.replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); // htmlspecialchars
		
		var lines = text.split("\n"), linelength = lines.length, i;
		for (i=0; i<linelength; i++) {
			lines[i] = this.ParseLine(lines[i]).html();
		}
		
		return lines.join("\n");
	};
	
	Plugin.prototype.writeImageTag = function(wholeMatch, m1, m2, m3, m4, m5, m6, m7) {
		var whole_match = m1;
		var alt_text = m2;
		var link_id = m3.toLowerCase();
		var url = m4;
		var title = m7;
		
		if (!title){
			title = "";
		}
		
		if (url === "") {
			if (link_id === "") {
				// lower-case and turn embedded newlines into spaces
				link_id = alt_text.toLowerCase().replace(/ ?\n/g, " ");
			}
			url = "#" + link_id;

			if (g_urls.get(link_id) !== undefined) {
				url = g_urls.get(link_id);
				if (g_titles.get(link_id) !== undefined) {
					title = g_titles.get(link_id);
				}
			}
			else {
				return whole_match;
			}
		}
		
		alt_text = base.escapeCharacters(base.attributeEncode(alt_text), "*_[]()");
		url = base.escapeCharacters(url, "*_");
		var result = "<img src=\"" + url + "\"";
		result += " style=\"width: auto; height:1em;\"";
		result += " />";
		
		
		return wholeMatch.replace(m4, m4+result);// + result;
	};
	
	Plugin.prototype.writeAnchorTag = function(wholeMatch, m1, m2, m3, m4, m5, m6, m7) {
		if (m7 === undefined) {
			m7 = "";
		}
		var whole_match = m1;
		var link_text = m2.replace(/:\/\//g, "~P"); // to prevent auto-linking withing the link. will be converted back after the auto-linker runs
		var link_id = m3.toLowerCase();
		var url = m4;
		var title = m7;

		if (url === "") {
			if (link_id === "") {
				// lower-case and turn embedded newlines into spaces
				link_id = link_text.toLowerCase().replace(/ ?\n/g, " ");
			}
			url = "#" + link_id;
			
			if (g_urls.get(link_id) !== undefined) {
				url = g_urls.get(link_id);
				if (g_titles.get(link_id) !== undefined) {
					title = g_titles.get(link_id);
				}
			}
			else {
				if (whole_match.search(/\(\s*\)$/m) > -1) {
					// Special case for explicit empty url
					url = "";
				} else {
					return whole_match;
				}
			}
		}
		
		url = base.encodeProblemUrlChars(url);
		url = base.escapeCharacters(url, "*_");
		var result = "<a href=\"" + url + "\"";
		console.log(title);
		if (title !== "") {
			title = base.attributeEncode(title);
			title = base.escapeCharacters(title, "*_");
			result += " title=\"" + title + "\"";
		}
		
		result += ">" + wholeMatch + "</a>";
		
		return result;
    };
	
	Plugin.prototype.attributeEncode = function (text) {
		// unconditionally replace angle brackets here -- what ends up in an attribute (e.g. alt or title)
		// never makes sense to have verbatim HTML in it (and the sanitizer would totally break it)
		return text.replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
	};
	
	Plugin.prototype.escapeCharacters = function (text, charsToEscape, afterBackslash) {
		// First we have to escape the escape characters so that
		// we can build a character class out of them
		var regexString = "([" + charsToEscape.replace(/([\[\]\\])/g, "\\$1") + "])";
		
		if (afterBackslash) {
			regexString = "\\\\" + regexString;
		}
		
		var regex = new RegExp(regexString, "g");
		text = text.replace(regex, this.escapeCharacters_callback);
		return text;
	};
	
	Plugin.prototype.escapeCharacters_callback = function (wholeMatch, m1) {
		var charCodeToEscape = m1.charCodeAt(0);
		return "~E" + charCodeToEscape + "E";
	};
	
	Plugin.prototype.encodeProblemUrlChars = function (url) {
		if (!url) {
			return "";
		}
		
		var len = url.length;
		
		return url.replace(/(?:["'*()\[\]:]|~D)/g, function (match, offset) {
			if (match == "~D") { // escape for dollar
				return "%24";
			}
			if (match == ":") {
				if (offset == len - 1 || /[0-9\/]/.test(url.charAt(offset + 1))) {
					return ":";
				}
			}
			return "%" + match.charCodeAt(0).toString(16);
		});
	};
	
	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[pluginName] = function ( options ) {
		return this.each(function () {
			if (!$.data(this, 'plugin_' + pluginName)) {
				$.data(this, 'plugin_' + pluginName,
				new Plugin( this, options ));
			}
		});
	};
	
})( jQuery, window, document );