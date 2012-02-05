# Peep, a javascript iA Writer-style Markdown WYSIWYG
Meet *peep*, your new friend. Peep is attached to a `contenteditable`, and then allows you to input live and lovely Markdown, which is automatically formatted, but still preserves your initial markdown syntax. It tries to replicate iA Writer's Markdown behavior to the extent *possible* in javascript.

## Goals
The goal is to replicate the Markdown behavior of iA Writer using web technologies such as HTML5, some heavy javascript and a touch of CSS. That being said, it is not (at least for a start) made to match the Markdown spec, just a small cherry pick of it.

## Dependencies
* jQuery

## Changelog

* v0.2
- **Parses**: footnotes
- **Known bugs**: Editing still doesn't work, selection doesn't work. Ref-style links doesn't work. Basically, What You See Is What You Get, for now, as the previous version.
- **Status**: Not ready for production use.

* v0.1
- **Parses** Italic, bold, lists, images, links, blocks, headers
- **Functionality**: The parser *works*, but interaction and contenteditable part remains to be perfected.

## Notes
### Current status
Basically, it doesn't work. But hopefully it will.

### Thanks
A big thanks to Stack Overflow's excellent [PageDown](http://code.google.com/p/pagedown/) javascript markdown parser, from which I have borrowed heavily from in creating Peep.