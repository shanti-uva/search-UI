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
		this.noSubs=1;
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
		if (o.subcollection_name_ss && o.subcollection_name_ss.length) 	this.noSubs=0;			// If subcollections
		if (o.url_thumb && !o.url_thumb.match(/gradient.jpg/)) str+="<img src='"+o.url_thumb+"' style='width:33%;padding-right:12px;vertical-align:top'>";
		if (o.summary)
			str+=`<div class='sui-sourceText' style='display:inline-block;width:calc(66% - 12px)'>${o.summary}</div><br><br>`;
		if (this.noSubs)	str+=sui.pages.DrawTabMenu(["MEMBERS","DETAILS"])+"</div>";			// Add  tab menu
		else				str+=sui.pages.DrawTabMenu(["SUBCOLLECTIONS","MEMBERS","DETAILS"])+"</div>";// Add tab menu w/ subs
		$(this.div).html(str.replace(/\t|\n|\r/g,""));											// Remove format and add to div	

		$("[id^=sui-tabTab]").on("click", (e)=> {												// ON TAB CLICK
			var id=e.currentTarget.id.substring(10);											// Get index of tab	
			this.ShowTab(id);																	// Draw it
			});
			
		sui.pages.DrawRelatedAssets(o);															// Draw related assets menu if active
		this.AddTabContent(o);																	// Add contents of tabs
		this.ShowTab(2-this.noSubs);															// Show details
		}
	
	AddTabContent(o)																		// GET TAB CONTENTS
	{
		let i,a;
		let n=1-this.noSubs;																	// Point at members tav
		let base=o.asset_subtype.toLowerCase()+"-collection-";									// Collections base id
		if (!this.noSubs) {																		// If subcollections
			for (i=0;i<o.subcollection_name_ss.length;++i) {									// For each sub												
				a=base+o.subcollection_id_is[i];												// Make full id
				this.content[0]+=`<br><a href='#p=${a}' id='sui-spItem-${a}+"'>${o.subcollection_name_ss[i]}</a>`; // Add
				}
			this.content[0]+="<br><br>";
			}	
		
		if (o.members_name_ss && o.members_name_ss.length) {									// If members
			for (i=0;i<o.members_name_ss.length;++i)											// For each member												
				this.content[n]+="<br>"+o.members_name_ss[i]+" &nbsp; ("+o.members_id_ss[i]+")"; // Add
			this.content[n]+="<br><br>";
			}	
		this.content[++n]="<br>";																// Advance to details tab
		if (o.node_user_full_s) this.content[n]+=sui.pages.DrawItem("&#xe600","OWNER",o.node_user_full_s+" &nbsp; ("+o.node_user+")","","sui-pageLab",1);	// Owner
		if (o.collection_visibility_s) this.content[n]+=sui.pages.DrawItem("&#xe622","VISIBILITY",o.collection_visibility_s.substr(0,1).toUpperCase()+o.collection_visibility_s.substr(1),"","sui-pageLab",1);	// Visibility
		if (o.asset_subtype) this.content[n]+=sui.pages.DrawItem(sui.assets[o.asset_subtype.toLowerCase()].g,"TYPE",o.asset_subtype,"","sui-pageLab",1);	// Type
		this.content[n]+="<br>";
	}

	ShowTab(which) 																			// SHOW TAB
	{
		$("[id^=sui-tabTab]").css({"background-color":"#999",color:"#fff" });					// Reset all tabs
		$("#sui-tabContent").css({display:"block","background-color":"#eee"});					// Show content
		$("#sui-tabTab"+which).css({"background-color":"#eee",color:"#000"});					// Active tab
		$("#sui-tabContent").html(this.content[which]);											// Set content
	}


} // Collections class closure
