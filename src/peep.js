var Caret = {
	Find: function ( ) {
		var range = window.getSelection().getRangeAt(0);
		var containerElement = range.commonAncestorContainer;
		if (containerElement.nodeType == 3) {
			containerElement = containerElement.parentNode;
		}
		return {
			Offset: range.startOffset,
			Container: range.startContainer,
			Element: $(containerElement)
		};
	},
	Set: function ( obj, offset ) {
		range.setStart(obj, offset);
		range.setEnd(obj, offset);
	}
};

;(function ( $, window, document, undefined ) {

	var pluginName = 'peep',
		defaults = {},
		converter = new Markdown.Converter(),
		specialMap = {8:1,13:1},
		charMap = '#*_ ',
		peepLine = $('<span/>').append(
			$('<span/>').addClass('peepline')
			.append(
				$('<span/>').addClass('gutter')
			).append(
				$('<span/>').addClass('margin').html(' ')
			).append(
				$('<span/>').addClass('body')
			)
		),
		peepEmpty = $('<span/>').append($('<span/>').addClass('empty').append('<br/>')),
		base = this;
	
	
	function Plugin( element, options ) {
		this.element = element;
		this.options = $.extend( {}, defaults, options) ;

		this._defaults = defaults;
		this._name = pluginName;

		this.init();
	}

	Plugin.prototype.init = function () {
		var $el = $(this.element), base = this;
		/*
		$el.blur(function(){
			//localStorage.setItem('peep', $el.html());
			document.designMode = 'off';
		});

		$el.focus(function(){
		  document.designMode = 'on';
		});
		*/
		
		//document.designMode = 'on';
		
		if (localStorage.getItem('peep')) {
			$el.html(localStorage.getItem('peep'));
		}
		
		var md = $el.html();
		console.log(md);
		var html = this.Parse(md);
		$el.html(html);
		/*
		$el.keypress(function(e){
			console.log(e.which);
			var c = String.fromCharCode(e.which);
			if ( charMap.indexOf(c) || specialMap[e.which] !== undefined ) {
				// look for enter, or backspace
				// If enter, newline! And if placed in the middle or start of a line?
				// If backspace into a block element, apply the block to the text!
				
				//console.dir(e);
				var elem = Caret.Find().Element;
				console.log('---current line--- ' + elem.parents('.peepline').text());
				var newline = base.ParseLine(elem.parents('.peepline').text());
				console.log('---new     line--- ' + newline.html());
				elem.parents('.peepline').replaceWith(newline.html());
			}
		});
		
		*/
		/*
		$(this.element).append(
			$('<iframe/>')
		).find('iframe').get(0).contentDocument.designMode='on';
		console.log($(this.element).find('iframe').get(0).contentDocument.designMode);
		*/
	};
	
	Plugin.prototype.ParseLine = function ( text ) {
		
		var pLine = peepLine.clone(),
			block = false,
			blockClass = '',
			gutter = ( gutter = text.indexOf(' ') ) !== -1 && gutter <= 6 ? text.substring(0,gutter) : false;
		
		console.log(text);
		console.log(' ');
		
		// Lists
		text = text.replace(/^(\d+[.]).+?(.*)/gm,
			function (wholeMatch, m1, m2 ) {
				block = m1;
				blockClass = 'ol';
				return m2;
			}
		);
		
		// Code blocks
		
		// Headers
		text = text.replace(/^(\#{1,6})[ \t]*(.+?)[ \t]*\#*\n+?/gm,
			function (wholeMatch, m1, m2) {
				/*console.log('wm: ' + m1);
				blockClass = 'h' + m1.length;
				block = m1;
				return base.ParseInline(m2);*/
				return "food";
			}
		);
		
		console.log(' ');
		console.log('fin: ' + text);
		console.log('------');
		
		if ( block )
		{
			pLine.attr('class','peepline peep-' + blockClass)
				.find('.gutter').html(gutter)
			.end()
				.find('.body').html(text).append('<br/>');
		}
		else if ( text.length > 0 )
		{
			pLine.find('.margin').html('').end().find('.body').html(text).append('<br/>');
		}
		else
		{
			pLine = peepEmpty.clone();
		}
		
		return pLine;
	};
	
	Plugin.prototype.ParseInline = function ( text ) {
		// Images
		// Emphasis & Bold
		// Links
		// Auto links
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