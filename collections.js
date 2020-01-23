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
		this.content=["",""," "];																// Content pages
	}

	Draw(o)																					// DRAW SOURCE PAGE FROM KMAP
	{
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

		$("[id^=sui-tabTab]").on("click", (e)=> {												// ON TAB CLICK
			var id=e.currentTarget.id.substring(10);											// Get index of tab	
			this.ShowTab(id);																	// Draw it
			});
			
		sui.pages.DrawRelatedAssets();															// Draw related assets menu if active
		this.AddTabContent(o);																	// Add contents of tabs
		}
	
	AddTabContent(o)																		// GET TAB CONTENTS
	{
		let i,a;
		this.content=["",""," "];
		
		let base=o.asset_subtype.toLowerCase()+"-collection-";									// Collections base id
		if (o.subcollection_name_ss && o.subcollection_name_ss.length) {						// If subcollections
			for (i=0;i<o.subcollection_name_ss.length;++i) {									// For each sub												
				a=base+o.subcollection_id_is[i];												// Make full id
				this.content[0]+=`<br><a href='#p=${a}' id='sui-spItem-${a}+"'>${o.subcollection_name_ss[i]}</a>`; // Add
				}
			this.content[0]+="<br><br>";
			}	

		if (o.members_name_ss && o.members_name_ss.length) {									// If members
			for (i=0;i<o.members_name_ss.length;++i)											// For each member												
				this.content[1]+="<br>"+o.members_name_ss[i]+" &nbsp; ("+o.members_id_ss[i]+")"; // Add
			this.content[1]+="<br><br>";
			}	

		this.content[2]="<br>";
		if (o.node_user_full_s) this.content[2]+=sui.pages.DrawItem("&#xe600","OWNER",o.node_user_full_s+" &nbsp; ("+o.node_user+")","","sui-pageLab",1);	// Owner
		if (o.collection_visibility_s) this.content[2]+=sui.pages.DrawItem("&#xe622","VISIBILITY",o.collection_visibility_s.substr(0,1).toUpperCase()+o.collection_visibility_s.substr(1),"","sui-pageLab",1);	// Visibility
		if (o.asset_subtype) this.content[2]+=sui.pages.DrawItem(sui.assets[o.asset_subtype.toLowerCase()].g,"TYPE",o.asset_subtype,"","sui-pageLab",1);	// Type
		if (o.mogrified_ss && o.mogrified_ss[0]) this.content[2]+=sui.pages.DrawItem("&#xe603","MOGRIFIED?",o.mogrified_ss[0].substr(0,1).toUpperCase()+o.mogrified_ss[0].substr(1),"","sui-pageLab",1);	// Mogrified
		this.content[2]+="<br>";
	}

	ShowTab(which) 																			// SHOW TAB
	{
		$("[id^=sui-tabTab]").css({"background-color":"#999",color:"#fff" });					// Reset all tabs
		$("#sui-tabContent").css({display:"block","background-color":"#eee"});					// Show content
		$("#sui-tabTab"+which).css({"background-color":"#eee",color:"#000"});					// Active tab
		$("#sui-tabContent").html(this.content[which]);											// Set content
	}







} // Collections class closure
