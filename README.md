# KSolr Mandala Asset Search Tool 
This tool is implelemented in Javascript as a module to search for resources using 
the Solr index. 

### Dependencies 

It needs jQuery and jQueryi to be loaded. If you want to support touch based devices, 
load the jquery.ui.touch-punch.min.js jQuery plugin.

### Implementations

It can be run as a standalone modulesee index.html for implementation) or as a 
plug-in for v4.x of the CKEditor rich text editor (see demo.htm, and the ksolr folder in
ckeditor/plugins for implementation).

As a plugin, it calls a url of the standlone imlementattion online somewhere
(as set in ckeditor/plugins/ksolr/dialogs/ksolr.js line 10) and communicates 
back to the plugin using HTML5 messaging.

The main code returns a solr JSON object of the resource to add. The kSolrHandler()
handler takes that JSON and adds  HTML code to ther rich text to represent it

License
=====

This is released under the MIT License:

Copyright (c) The Rector and Board of Visitors, University of Virginia

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.# kmap
