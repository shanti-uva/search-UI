/* 	SUBJECTS PAGES ****************************************************************************************************************************

	This module draws the subjects page based on a kmap from SOLR

	Requires: 	jQuery 												// Almost any version should work
	CSS:		searchui.css										// All styles are prefixed with 'sui-'
	JS:			ECMA-6												// Uses lambda (arrow) functions
	JSON:		From Drupal site
	Globals:	Looks for sui and sui.pages
	Dependents:	pages.js, searchui.js								// JS modules called

*********************************************************************************************************************************************/

class Subjects  {																					

	constructor()   																		// CONSTRUCTOR
	{
		this.div=sui.pages.div;																	// Div to hold page (same as Pages class)
		this.content=["","...loading"];															// Content pages
	}

	Draw(o)																					// DRAW SOURCE PAGE FROM KMAP
	{
		let _this=this;																			// Save context
		let str=`<div class='sui-sources' style='margin:8px 0px 0 192px'>
		<span style='font-size:24px;color:${sui.assets[o.asset_type].c};vertical-align:-4px'>${sui.assets[o.asset_type].g}</span>
		&nbsp;&nbsp;&nbsp;&nbsp;<span class='sui-sourceText' style='font-size:20px;font-weight:500'>${o.title[0]}</span>
		<hr style='border-top: 1px solid ${sui.assets[o.asset_type].c}'>`;
		if (o.caption)	str+="<p>"+o.caption+"</p>";
		str+="<table>";
		if (o.names_txt && o.names_txt.length) {												// If names
			for (var i=0;i<o.names_txt.length;++i) {											// For each name
				if (o.names_txt[i].match(/lang="bo"/i))											// Language id - bo
					str+="<tr><td style='color:#000099;font-size:20px'>"+o.names_txt[i]+"&nbsp;&nbsp;&nbsp;</td><td><i>Dzongkha, Tibetan script, Original</i></td></tr>";	// Add it
				else 
					str+="<tr><td></td><td>> "+o.names_txt[i]+"</td></tr>";						// Add it
					}
				}
		str+="</table>";		
		str+=`<br><div style='display:inline-block;width:100%'>
		<div class='sui-textTop' id='sui-textTop' style='border-top:1px solid #999'>
			<div class='sui-textTab' id='sui-textTab0' style='color:#fff;width:50%'>
				<div style='display:inline-block;padding-top:10px'>RELATIONSHIPS &nbsp;&#xe609</div></div>
			<div class='sui-textTab' id='sui-textTab1' style='border-left:1px solid #ccc;border-right:1px solid #ccc;color:#fff;width:50%'>
				<div style='display:inline-block;padding-top:10px'>SUMMARY &nbsp;&#xe609</div></div>
		</div>
		<div class='sui-textSide' id='sui-textSide' style='display:none;'></div>
		</div></div>`;
		$(this.div).html(str.replace(/\t|\n|\r/g,""));											// Remove format and add to div	

		$("[id^=sui-textTab]").on("click", (e)=> {												// ON TAB CLICK
			var id=e.currentTarget.id.substring(11);											// Get index of tab	
			showTab(id);																		// Draw it
			});
			
		function showTab(which) {																// SHOW TAB
			$("[id^=sui-textTab]").css({"background-color":"#999",color:"#fff" });				// Reset all tabs
			$("#sui-textSide").css({display:"inline-block","background-color":"#eee"});			// Show text
			$("#sui-textTab"+which).css({"background-color":"#eee",color:"#666"});				// Active tab
			$("#sui-textSide").html(_this.content[which]);										// Set content
			if (which == 0)	 sui.pages.DrawTree("#sui-btree-subjects","subjects");				// If relationships, add tree
			}

		this.content[0]="<div class='sui-tree' id='sui-btree-subjects'></div>";					// Add browsing tree div
		this.GetSummary(o);																		// Get summary tab content	
		sui.pages.DrawRelatedAssets(o);															// Draw related assets men
	}

	GetSummary(o)																			// SHOW SUMMARY TAB
	{
		sui.GetRelatedFromID(o.uid,(d)=> { 														// Load data
			trace(d); 
			let n=d._childDocuments_.length-1;													// Get number of subjects
			let str=`<b>${o.title[0]}</b> has ${n} other subject${(n > 1) ? "s": ""} directly related to it, which is presented here. 
			See the relationships tab if you instead prefer to browse all subordinate and superordinate categories for ${o.title[0]}.
			<p><a>Expand all</a> / <a>Collapse all</a></p>
			`;
			this.content[1]=str;	
			});
	}


} // CLASS CLOSURE