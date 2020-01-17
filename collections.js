/* 	COLLECTIONS PAGES ****************************************************************************************************************************

	This module draws the collections page based on a kmap from SOLR. Some information comes from the kmap
	passed in and some from the a second query from the JSON data coming from Drupal. 	
	
	Requires: 	jQuery 												// Almost any version should work
	CSS:		searchui.css										// All styles are prefixed with 'sui-'
	JS:			ECMA-6												// Uses lambda (arrow) functions
	JSON:		From Drupal site
	Globals:	Looks for sui and sui.pages
	Dependents:	pages.js, searchui.js								// JS modules called

*********************************************************************************************************************************************/

class Collections  {																					

	constructor()   																		// CONSTRUCTOR
	{
		this.div=sui.pages.div;																	// Div to hold page (same as Pages class)
		this.content=["","",""];																// Content pages
	}

	Draw(o)																					// DRAW SOURCE PAGE FROM KMAP
	{
		let i;
		let a=sui.assets[o.asset_subtype.toLowerCase()];
		var str=`<div class='sui-sources' id='sui-collections'>
		<span style='font-size:24px;color:${a.c};vertical-align:-4px'>${a.g}</span>
		&nbsp;&nbsp;<span class='sui-sourceTitle'>${o.title[0]}</span>
		&nbsp;&nbsp;(${o.asset_subtype.toUpperCase()})
		<hr style='border-top: 1px solid ${sui.assets[o.asset_type].c}'>
		<div class='sui-sourceSec' id='sui-srcSec'></div><br>`;
		if (o.url_thumb && !o.url_thumb.match(/gradient.jpg/)) str+="<img src='"+o.url_thumb+"' style='width:33%;padding-right:12px;vertical-align:top'>";
		str+=`<div class='sui-sourceText' style='display:inline-block;width:calc(66% - 12px)'>${o.summary}</div><br><br>`;
		str+=sui.pages.DrawTabMenu(["SUBCOLLECTIONS","MEMBERS","DETAILS"])+"</div>";			// Add tab menu
		$(this.div).html(str.replace(/\t|\n|\r/g,""));											// Remove format and add to div	
//		sui.GetJSONFromKmap(o, (d)=> {															// Get details from JSON
//			trace(d)
//			});

		sui.pages.DrawRelatedAssets();															// Draw related assets menu if active
	}

} // Collections class closure
