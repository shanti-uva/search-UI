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
		<img id='sui-spImg'>
		<div><span style='font-size:24px;color:${sui.assets[o.asset_type].c};vertical-align:-4px'>${sui.assets[o.asset_type].g}</span>
		&nbsp;&nbsp;&nbsp;&nbsp;<span class='sui-sourceText' style='font-size:20px;font-weight:500'>${o.title[0]}</span>
		<hr style='border-top: 1px solid ${sui.assets[o.asset_type].c}'>`;
		if (o.caption)	str+="<p id='sui-spCap'>"+o.caption+"</p></div>";
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
			$("[id^=sui-spLab-]").off("click");													// Kill handler
			$("[id^=sui-spDot-]").off("click");													// Kill handler
			$("[id^=sui-spItem-]").off("click");												// Kill handler
			$("[id^=sui-togCat-]").off("click");												// Kill handler
			$("[id^=sui-spCatUL-]").off("click");												// Kill handler
			$("[id^=sui-textTab]").css({"background-color":"#999",color:"#fff" });				// Reset all tabs
			$("#sui-textSide").css({display:"inline-block","background-color":"#eee"});			// Show text
			$("#sui-textTab"+which).css({"background-color":"#eee",color:"#666"});				// Active tab
			$("#sui-textSide").html(_this.content[which]);										// Set content
			if (which == 0)	{																	// If summary, add events
				$("[id^=sui-spLab-]").on("click", (e)=> {										// ON RELATIONSHIP TREE ITEM CLICK
					let id=e.currentTarget.id.substring(10);									// Get id
					sui.GetKmapFromID(id,(kmap)=>{ sui.SendMessage("",kmap); });				// Get kmap and show page
					});
				$("[id^=sui-spDot-]").on("click", function(e) {									// ON RELATIONSHIP TREE DOT CLICK
					let id=e.currentTarget.id.substring(10);									// Get index of this one
					let firstChild=$(this).parent().find("li")[0];								// Get first child
					$(this).html($(firstChild).css("display") == "none" ? "&ndash;" : "+"); 	// Change label
					$(this).parent().find('ul').slideToggle();            						// Slide into place
					});
				}
			else if (which == 1) {																// If summary, add events
				$("[id^=sui-spCatUL-]").slideDown();											// All down
				$("[id^=sui-spCat-]").on("click", (e)=> {										// ON CATEGORY CLICK
					let id=e.currentTarget.id.substring(9);										// Get id
					if ($("#sui-spCatUL"+id).css("display") == "none")							// If hidden
						$("#sui-spCatUL"+id).slideDown();										// Show
					else																		// If showing
						$("#sui-spCatUL"+id).slideUp();											// Hide
					});

				$("[id^=sui-spItem-]").on("click", (e)=> {										// ON SUMMARY ITEM CLICK
					let id=e.currentTarget.id.substring(11);									// Get id
					sui.GetKmapFromID(id,(kmap)=>{ sui.SendMessage("",kmap); });				// Get kmap and show page
					});
				$("#sui-togCatA").on("click", ()=> {											// ON EXPAND ALL
					$("[id^=sui-spCatUL-]").slideDown();										// All down
					});
				$("#sui-togCatN").on("click", ()=> {											// ON COLLAPSE ALL
					$("[id^=sui-spCatUL-]").slideUp();											// All down
					});
				}
			}

		this.GetTabData(o);																		// Get relationship/summary tab content	
		sui.pages.DrawRelatedAssets(o);															// Draw related assets men
	}

	GetTabData(o)																			// GET TAB TATA FOR RELATIONSHIPS / SUMMARY
	{
		sui.GetRelatedFromID(o.uid,(data)=> { 													// Load data
			if (data.illustration_mms_url && data.illustration_mms_url[0]) {					// If an image spec'd
				$("#sui-spImg").addClass("sui-spImg");											// Set style
				$("#sui-spImg").prop("src",data.illustration_mms_url[0]);						// Show it
				}
			if (data.summary_eng && data.summary_eng[0]) 										// If an summary spec'd
				$("#sui-spCap").html(data.summary_eng[0]);										// Replace caption
			this.ShowSummary(o,data._childDocuments_);											// Show summary html
			this.ShowRelationships(o,data);														// Show relatioships html
		});
	}

	ShowSummary(o,c)																		// SHOW SUMMARY TAB CONTENTS 	
	{	
		let f,i,s=[];
		let n=c.length;																			// Get number of subjects
		for (i=0;i<n;++i) {																		// For each subject get data as 's=[category[{title,id}]]' 
			if (c[i].block_child_type != "related_subjects") continue;							// Add only related subjects
			if (!s[c[i].related_subjects_relation_label_s])										// If first one of this category 
				s[c[i].related_subjects_relation_label_s]=[];									// Alloc category array
			s[c[i].related_subjects_relation_label_s].push({									// Add subject to category 
				title:c[i].related_subjects_header_s,											// Add title
				id:c[i].related_uid_s });														// Add id
			}											
		let biggest=Object.keys(s).sort((a,b)=>{return a.length > b.length ? -1 : 1;})[0];		// Find category with most elements	 
		let str=`<b>${o.title[0]}</b> has <b>${n-1}</b> other subject${(n > 1) ? "s": ""} directly related to it, which is presented here. 
		See the RELATIONSHIPS tab if you instead prefer to browse all subordinate and superordinate categories for ${o.title[0]}.
		<p><a id='sui-togCatA'>Expand all</a> / <a id='sui-togCatN'>Collapse all</a></p><div style='width:100%'><div style='width:50%;display:inline-block'>`;
		str+=drawCat(biggest)+"</div><div style='display:inline-block;width:50%;vertical-align:top'>";	// Add biggest to 1st column, set up 2nd	 
		for (f in s) if (f != biggest)	str+=drawCat(f);										// For each other category, draw it in 2nd column
		str+="</div></div>";
		this.content[1]=str;																	// Set summary tab

		function drawCat(f) {																	// DRAW CATEGORY
			s[f]=s[f].sort((a,b)=>{ return a.title < b.title ? -1 : 1;});						// Sort
			let str="<div id='sui-spCat-"+f.replace(/ /g,"_")+"' class='sui-spCat'>"+o.title+" "+f+"</div><ul id='sui-spCatUL-"+f.replace(/ /g,"_")+"' style='display:none'>";// Add category header
			for (i=0;i<s[f].length;++i)															// For each item
				str+="<li><a id='sui-spItem-"+s[f][i].id+"'>"+s[f][i].title+"</a>"+sui.pages.AddPop(s[f][i].id)+"</li>";	// Show it with popover
			return str+"</ul>";																	// Close category
			}
	}

	ShowRelationships(o,d)																	// SHOW RELATIONSHIPS TAB CONTENTS 	
	{	
		let i,n=0;
		let str=`<b>${o.title[0]}</b> has <b> ~~ </b>subordinate subjects. 
		You can browse this subordinate subject as well as its superordinate categories with the tree below. 
		See the SUMMARY tab if you instead prefer to view only its immediately subordinate subjects grouped together in useful ways, as well as subjects non-hierarchically related to it.<br><br>
		<ul class='sui-spLin' id='sui-spRows'>`;

		for (n=0;n<d.ancestors.length-1;++n) {													// For each ancestor
			str+="<ul style='list-style-type:none' id='sui-spUL-"+n+"'>";						// Add header
			str+=addLine(d.ancestors[n],d.ancestor_uids_gen[n],"&ndash;",n);					// Add it
			}
		sui.GetTreeChildren(o.asset_type,d.ancestor_id_path,(res)=>{							// Get children
			let re,m,ids="";
			let counts=[];
			try { counts=res.facets.child_counts.buckets; } catch(e){}							// Get child counts
			for (i=0;i<counts.length;i++)  if (counts[i].val) ids+="~"+counts[i].val;			// Make id hash to search on
			res=res.response.docs;																// Point at docs
			str+="<ul style='list-style-type:none' id='sui-spUL-"+n+"'>";						// Add header
			str+=addLine(d.ancestors[n],d.ancestor_uids_gen[n],res.length ? "&ndash;" : null,n); // Add it
			for (i=0;i<res.length;++i) {														// For each child
				m=null;																			// Assume a loner												
				re=new RegExp(res[i].id.split("-")[1]);											// Get id to fearch on
				if ((ids && ids.match(re))) m="+";												// Has children
				str+="<ul style='list-style-type:none'>";										// Header
				str+=addLine(res[i].header,res[i].id,m,n+i+1)+"</li></ul>"; 					// Add it
				}
			str=str.replace(/~~/,n+res.length);													// Set total count
			for (i=0;i<d.ancestors.length;++i) str+="</li></ul>";								// Close chain
			this.content[0]=str.replace(/\t|\n|\r/g,"")+"</ul>";								// Set relationships tab
			});
	
		function addLine(lab, id, mode, num) {												// ADD LINE TO TREE
			let s=`<li id='sui-spLine-${num}' style='margin-left:${-32}px'>`;	// Header
			if (mode)	s+=`<div class='sui-spDot' id='sui-spDot-${num}'>${mode}</div>`;		// If a dot, add it
			else		s+="<b>&ndash;&nbsp;</b> ";												// Add -
			s+=`<a id='sui-spLab-${id}'>${lab}</a>`;											// Add name
			return s;																			// Return line
			}
	}
	

} // CLASS CLOSURE