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
		this.content=["TBD","...loading"];														// Content pages
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
		<div class='sui-textSide' id='sui-textSide' style='display:none;max-height:none'></div>
		</div></div>`;
		$(this.div).html(str.replace(/\t|\n|\r/g,""));											// Remove format and add to div	

		$("[id^=sui-textTab]").on("click", (e)=> {												// ON TAB CLICK
			var id=e.currentTarget.id.substring(11);											// Get index of tab	
			showTab(id);																		// Draw it
			});
			
		function showTab(which) {																// SHOW TAB
			$("[id^=sui-subItem-]").off("click");												// Kill handler
			$("[id^=sui-togCat-]").off("click");												// Kill handler
			$("[id^=sui-subCatUL-]").off("click");												// Kill handler
			$("[id^=sui-textTab]").css({"background-color":"#999",color:"#fff" });				// Reset all tabs
			$("#sui-textSide").css({display:"inline-block","background-color":"#eee"});			// Show text
			$("#sui-textTab"+which).css({"background-color":"#eee",color:"#666"});				// Active tab
			$("#sui-textSide").html(_this.content[which]);										// Set content
			if (which == 1)	{																	// If summary, add events
				$("[id^=sui-subCatUL-]").slideDown();											// All down
				$("[id^=sui-subCat-]").on("click", (e)=> {										// ON CATEGORY CLICK
					let id=e.currentTarget.id.substring(10);									// Get id
					if ($("#sui-subCatUL"+id).css("display") == "none")							// If hidden
						$("#sui-subCatUL"+id).slideDown();										// Show
					else																		// If showing
						$("#sui-subCatUL"+id).slideUp();										// Hide
				});
				
				$("[id^=sui-subItem-]").on("click", (e)=> {										// ON ITEM CLICK
					let id=e.currentTarget.id.substring(12);									// Get id
					sui.GetKmapFromID(id,(kmap)=>{ sui.SendMessage("",kmap); });				// Get kmap and show page
					});
				$("#sui-togCatA").on("click", ()=> {											// ON EXPAND ALL
					$("[id^=sui-subCatUL-]").slideDown();										// All down
					});
				$("#sui-togCatN").on("click", ()=> {											// ON COLLAPSE ALL
					$("[id^=sui-subCatUL-]").slideUp();											// All down
					});
				}
			}

		this.GetTabData(o);																		// Get relationship/summary tab content	
		sui.pages.DrawRelatedAssets(o);															// Draw related assets men
	}

	GetTabData(o)																			// GET TAB TATA FOR RELATIONSHIPS / SUMMARY
	{
		sui.GetRelatedFromID(o.uid,(data)=> { 													// Load data
			let c=data._childDocuments_;														// Point at child docs
			this.GetSummary(o,c);																// Get summary html
			this.GetRelationships(o,data);														// Get relatioships html
		});
	}

	GetSummary(o,c)																			// GET SUMMARY TAB CONTENTS 	
	{	
		let f,i,s=[];
		let n=c.length;																		// Get number of subjects
		for (i=0;i<n;++i) {																	// For each subject get data as 's=[category[{title,id}]]' 
			if (c[i].block_child_type != "related_subjects") continue;						// Add only related subjects
			if (!s[c[i].related_subjects_relation_label_s])									// If first one of this category 
				s[c[i].related_subjects_relation_label_s]=[];								// Alloc category array
			s[c[i].related_subjects_relation_label_s].push({								// Add subject to category 
				title:c[i].related_subjects_header_s,										// Add title
				id:c[i].related_uid_s });													// Add id
			}											
		let biggest=Object.keys(s).sort((a,b)=>{return a.length > b.length ? -1 : 1;})[0];	// Find category with most elements	 
		let str=`<b>${o.title[0]}</b> has <b>${n-1}</b> other subject${(n > 1) ? "s": ""} directly related to it, which is presented here. 
		See the relationships tab if you instead prefer to browse all subordinate and superordinate categories for ${o.title[0]}.
		<p><a id='sui-togCatA'>Expand all</a> / <a id='sui-togCatN'>Collapse all</a></p><div style='width:100%'><div style='width:50%;display:inline-block'>`;
		str+=drawCat(biggest)+"</div><div style='display:inline-block;width:50%;vertical-align:top'>";	// Add biggest to 1st column, set up 2nd	 
		for (f in s) if (f != biggest)	str+=drawCat(f);									// For each other category, draw it in 2nd column
		str+="</div></div>";
		this.content[1]=str;																// Set summary tab

		function drawCat(f) {																// DRAW CATEGORY
			s[f]=s[f].sort((a,b)=>{ return a.title < b.title ? -1 : 1;});					// Sort
			let str="<div id='sui-subCat-"+f.replace(/ /g,"_")+"' class='sui-subCat'>"+o.title+" "+f+"</div><ul id='sui-subCatUL-"+f.replace(/ /g,"_")+"' style='display:none'>";// Add category header
			for (i=0;i<s[f].length;++i)														// For each item
				str+="<li><a id='sui-subItem-"+s[f][i].id+"'>"+s[f][i].title+"</a>"+sui.pages.AddPop(s[f][i].id)+"</li>";	// Show it with popover
			return str+"</ul>";																// Close category
			}
	}

	GetRelationships(o,d)																// GET RELATIONSHIPS TAB CONTENTS 	
	{	
		trace(d); 
		let i,n=1,x=0;
		let str=`<b>${o.title[0]}</b> has <b>${n} </b>subordinate subject. 
		You can browse this subordinate subject as well as its superordinate categories with the tree below. 
		See the summary tab if you instead prefer to view only its immediately subordinate subjects grouped together in useful ways, as well as subjects non-hierarchically related to it.<br><br>`;
		for (i=0;i<d.ancestors.length;++i) {													// For each ancestor
			str+=`<div style='margin-left:${x}px'><div class='sui-subRelDot' id='sui-subRelDot-${i}'>-</div>
			<a id=sui-subRelDot-${d.ancestor_uids_gen[i]}'>${d.ancestors[i]}</a></div>`;
			x+=8;
			}
		this.content[0]=str.replace(/\t|\n|\r/g,"");										// Set relationships tab

	}


} // CLASS CLOSURE