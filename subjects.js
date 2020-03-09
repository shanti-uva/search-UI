/* 	SUBJECTS PAGES ****************************************************************************************************************************

	This module draws the subjects page based on a kmap from SOLR. Some information comes from the kmap
	passed in and some from the a second query from the child data in the Terms index. 
	
	The related resources menu is drawn, which pulls data via another SOLR call. If an image is present
	it is drawn there. Below that is a browsable index of subjects. Clicking on one will bring up that page.
	
	A tabbed menu shows the CONTEXT, where the page fits in the tree. Clicking on one will bring up that page.
	You can drill down further in the tree by clicking on a '+' dot or collapse branches with th '-'. The SUMMARY,
	which lists the related subjects to this page, catagorized by their type and alpabetically sorted. 	Clicking 
	on one will bring up that page. Hovering over a blue popover icon will show more information about it.

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
		this.content=["...loading","...loading"];												// Content pages for relateds
		this.content2=["<br>","<br>"];
		this.kmap=null;																			// Holds kmap
		this.subTab=0;
	}

	Draw(o, related)																			// DRAW SOURCE PAGE FROM KMAP
	{
		this.kmap=o;																			// Save kmap
		$("#sui-results").css({ "padding-left":"12px", width:"calc(100% - 24px"});				// Reset to normal size
		this.GetSubjectData(o);																	// Get related subjects content	
		this.DrawContent(o,related);															// Draw content
		sui.pages.DrawRelatedAssets(o);															// Draw related assets men
	}

	DrawContent(o, related)																	// DRAW CONTENT
	{
		let str=`<div class='sui-subjects'>
		<div><span class='sui-subIcon'>${sui.assets[o.asset_type].g}</span>
		<span class='sui-subText'>${o.title[0]}</span>
		<hr style='border-top: 1px solid ${sui.assets[o.asset_type].c}'>`;
		if (o.caption)	str+="<p id='sui-spCap'>"+o.caption+"</p></div>";
		str+="<table>";
		if (o.names_txt && o.names_txt.length) {												// If names
			for (var i=0;i<o.names_txt.length;++i) {											// For each name
				if (o.names_txt[i].match(/lang="bo"/i))											// Language id - bo
					str+="<tr><td style='color:#000099;font-size:20px'>"+o.names_txt[i]+"&nbsp;&nbsp;&nbsp;</td><td><i>Dzongkha, Tibetan script, Original</i></td></tr>";	// Add it
				else 																			// Unknown
					str+="<tr><td></td><td>> "+o.names_txt[i]+"</td></tr>";						// Add it
					}
				}
		str+="</table><br>";		
		if (related == 1) 		str="<div style='margin-left:192px'>"+sui.pages.DrawTabMenu(["SUBJECT CONTEXT","RELATED SUBJECTS"]);  // If subjects, add tab menu
		else if (related == 2)	str="<div id='sui-topCon' style='margin-left:216px'>"+this.GetPlaceData(o);		  // If places, get data
		$(this.div).html(str+"</div>".replace(/\t|\n|\r/g,""));									// Remove format and add to div				
		$("[id^=sui-tabTab]").on("click", (e)=> {												// ON TAB CLICK
			var id=e.currentTarget.id.substring(10);											// Get index of tab	
			this.ShowTab(id);																	// Draw it
			});
	}

	ShowTab(which) 																			// SHOW TAB
	{
		let _this=this;
		$("[id^=sui-spLab-]").off("click");														// Kill handler
		$("[id^=sui-spDot-]").off("click");														// Kill handler
		$("[id^=sui-spItem-]").off("click");													// Kill handler
		$("[id^=sui-togCat-]").off("click");													// Kill handler
		$("[id^=sui-spCatUL-]").off("click");													// Kill handler
		$("[id^=sui-tabTab]").css({"background-color":"#999",color:"#fff" });					// Reset all tabs
		$("#sui-tabContent").css({display:"block","background-color":"#eee"});					// Show content
		$("#sui-tabTab"+which).css({"background-color":"#eee",color:"#000"});					// Active tab
		$("#sui-tabContent").html(this.content[which]);											// Set content
		if (which == 0)	{																		// If summary, add events
			$("[id^=sui-spLab-]").on("click", function(e) {return false;	});					// ON CONEXT LINE CLICK, INHIBIT
			$("[id^=sui-spDot-]").on("click", function(e) {										// ON RELATIONSHIP TREE DOT CLICK
				let firstChild=$(this).parent().find("ul")[0];									// Get first child
				let path=e.currentTarget.id.substring(10);										// Get id
				if (path != "null") _this.AddBranch(_this.kmap.asset_type,path,$(this));		// Lazy load branch
				$(this).html($(firstChild).css("display") == "none" ? "&ndash;" : "+"); 		// Change label
				$(this).parent().find('ul').slideToggle();            							// Slide into place
				});
			$("#sui-spLab-"+this.kmap.uid).css({ "border-bottom":"1px solid #999" });			// Highlight current one	
			}
		else if (which == 1) {																	// If subjects
			$("[id^=sui-spItem-]").on("click", function(e) {return false;	});					// ON CONtEXT LINE CLICK, INHIBIT
			$("[id^=sui-spCatUL-]").slideDown();												// All down
			$("[id^=sui-spCat-]").on("click", (e)=> {											// ON CATEGORY CLICK
				let id=e.currentTarget.id.substring(9);											// Get id
				if ($("#sui-spCatUL"+id).css("display") == "none")								// If hidden
					$("#sui-spCatUL"+id).slideDown();											// Show
				else																			// If showing
					$("#sui-spCatUL"+id).slideUp();												// Hide
				});

			$("#sui-togCatA").on("click", ()=> {												// ON EXPAND ALL
				$("[id^=sui-spCatUL-]").slideDown();											// All down
				});
			$("#sui-togCatN").on("click", ()=> {												// ON COLLAPSE ALL
				$("[id^=sui-spCatUL-]").slideUp();												// All down
				});
			}
	}

	GetPlaceData(o)																			// GET RELATED PLACES
	{
		sui.GetRelatedPlaces(o.uid, (d)=>{														// Get related place data
			let i,j,id,tops=[];
			let str="<ul style='list-style-type:none'>";										// Top-most <ul>
			let n=d.length;																		// Number of places
			for (i=0;i<n;++i) {																	// For each related place	
				id="places-";																	// Start id
				for (j=0;j<d[i].ancestor_ids_is.length;++j) {									// For each level	
					id+=d[i].ancestor_ids_is[j]+"-";											// Add levels
					tops.push({ lab:d[i].ancestors_txt[j], level:j, id:id.slice(0,-1), uid:"places-"+d[i].ancestor_ids_is[j]});		// Add to list
					}
				}
			tops=tops.sort((a,b)=>{ return a.id < b.id ? -1 : 1 })								// Sort by path
			tops=tops.filter((a,ind)=>{ try { return a.id != tops[ind+1].id } catch(e){} })		// Only uniques
			n=tops.length;																		// New n
			for (i=0;i<n;++i) 																	// For place	
				if (tops[i].level == 0) 														// Add top row
					str+=addTreeLine(tops[i].lab,tops[i].id,"&ndash;");							// Add tree line

			$("#sui-topCon").html(str+"</ul></div>");											// Draw it
	
			for (i=0;i<n;++i)																	// For place	
				if (tops[i].level == 0) addChildren(tops[i].id,1);								// Add top row children and recurse

				
			function addChildren(id, level) {													// ADD CHILDREN TO NODE RECURSIVELY
				let i,str="";
				for (i=0;i<n;++i) {																// For each place
					if (tops[i].id.match(id) && (tops[i].level == level)) {						// A child
						str="<ul style='list-style-type:none;display:none;padding:2px 0 0 24px'>";	// Enclosing <ul>
						str+=addTreeLine(tops[i].lab,tops[i].id,"&ndash;");						// Add tree line
						str+="</ul>";															// Close <ul>
						$("#sui-rpDot-"+id).parent().parent().append(str);						// Add it
						addChildren(tops[i].id,level+1);										// Recurse
						}
					}
				}
	
			function addTreeLine(lab, id, marker) 											// ADD LINE TO TREE
			{	
				let s=`<li>`;																	// Header
				let v=id.split("-");
				let uid="places-"+v[v.length-1];												// Solitary id
				if (marker)	s+=`<div class='sui-spDot' id='sui-rpDot-${id}'>${marker}</div>`;	// If a dot, add it
				else		s+="<div class='sui-spDot' style='background:none;color:#5b66cb'><b>&bull;</b></div>";	// If a loner
				s+=`<a class='sui-noA' href='#p=${uid}'>${lab}${sui.pages.AddPop(uid)}</a>`;	// Add line
				return s;																		// Return line
			}
			

			$("[id^=sui-rpDot-]").off("click");													// Kill old handlers
			$("[id^=sui-rpDot-]").on("click", function(e) {										// ON RELATIONSHIP TREE DOT CLICK
				trace(123)
				let container=$(this).parent().parent();										// Point a container
				$(this).html($(container).css("display") == "none" ? "&ndash;" : "+"); 			// Change label
				$(container).find('ul').slideToggle();            								// Slide into place
				});
			
			for (i=0;i<n;++i)																	// For each place	
				if (tops[i].level == 1) {														// If 2nd level
					$("#sui-rpDot-"+tops[i].id).parent().parent().css("display","block");		// Show			
					$("#sui-rpDot-"+tops[i].id).html("+"); 										// Change label
					}
			});	
	
		return "Loading...";																	// Say we're loading...
		}

	GetSubjectData(o)																		// GET TAB DATA FOR CONTEXT / SUMMARY
	{
		sui.GetRelatedFromID(o.uid,(data)=> { 													// Load data
			if (!data)	return;																	// Quit if no data
			if (data.illustration_external_url && data.illustration_external_url[0]) {			// If an image spec'd
				$("#sui-relatedImg").addClass("sui-relatedImg");								// Set style
				$("#sui-relatedImg").prop("src",data.illustration_external_url[0]);				// Show it
				}
			else if (data.illustration_mms_url && data.illustration_mms_url[0]) {				// If an image spec'd
				$("#sui-relatedImg").addClass("sui-relatedImg");								// Set style
				$("#sui-relatedImg").prop("src",data.illustration_mms_url[0]);					// Show it
				}
			if (data.summary_eng && data.summary_eng[0]) 										// If an summary spec'd
				$("#sui-spCap").html(data.summary_eng[0]);										// Replace caption
			this.AddSummary(o,data._childDocuments_);											// Add summary html
			this.AddContext(o,data);															// Add context html
		});
	}

	AddSummary(o,c)																			// ADD SUMMARY TAB CONTENTS 	
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
		let str=`<br><div class='sui-spHead'>Subjects related to ${o.title}</div>
		${o.title[0]}</b> has <b>${n-1}</b> other subject${(n > 1) ? "s": ""} directly related to it, which is presented here. 
		See the CONTEXT tab if you instead prefer to browse all subordinate and superordinate categories for ${o.title[0]}.
		<p><a style='cursor:pointer' id='sui-togCatA'>Expand all</a> / <a style='cursor:pointer' id='sui-togCatN'>Collapse all</a></p><div style='width:100%'><div style='width:50%;display:inline-block'>`;
		str+=drawCat(biggest)+"</div><div style='display:inline-block;width:50%;vertical-align:top'>";	// Add biggest to 1st column, set up 2nd	 
		for (f in s) if (f != biggest)	str+=drawCat(f);										// For each other category, draw it in 2nd column
		str+="</div></div>";
		this.content[1]=str;																	// Set summary tab

		function drawCat(f) {																	// DRAW CATEGORY
			s[f]=s[f].sort((a,b)=>{ return a.title < b.title ? -1 : 1;});						// Sort
			let str="<div id='sui-spCat-"+f.replace(/ /g,"_")+"' class='sui-spCat'>"+o.title+" "+f+"</div><ul id='sui-spCatUL-"+f.replace(/ /g,"_")+"' style='display:none'>";// Add category header
			for (i=0;i<s[f].length;++i)	{														// For each item
				str+="<li><a class='sui-noA' id='sui-spItem-"+s[f][i].id;						// Line
				str+="' href='#p="+s[f][i].id+"'>";												// Href
				str+=s[f][i].title+"</a>"+sui.pages.AddPop(s[f][i].id)+"</li>";					// Add popover
				}
			return str+"</ul>";																	// Close category
			}
	}

	AddContext(o,d)																			// ADD CONTEXT TAB CONTENTS 	
	{	
		let n=0;
		let str=`<br><div class='sui-spHead'>Subjects related to ${o.title}</div>
		<b>${o.title[0]}</b> has <b> ~~ </b>subordinate subjects. 
		You can browse these subordinate subjects as well as its superordinate categories with the tree below. 
		See the SUMMARY tab if you instead prefer to view only its immediately subordinate subjects grouped together in useful ways, as well as subjects non-hierarchically related to it.<br><br>
		<ul class='sui-spLin' id='sui-spRows'>`;
		for (n=0;n<d.ancestors.length;++n) {													// For each ancestor
			str+="<ul style='list-style-type:none'>";											// Add header
			str+=this.AddTreeLine(d.ancestors[n],d.ancestor_uids_gen[n],"&ndash;",null);		// Add it 
			}
		
		sui.GetTreeChildren(o.asset_type,d.ancestor_id_path,(res)=>{							// Get children
			let i,j,re,m,path;
			let counts=[];
			try { counts=res.facets.child_counts.buckets; } catch(e) {}							// Get child counts
			res=res.response.docs;																// Point at docs
			for (i=0;i<res.length;++i) {														// For each child
				path="";	m=null;																// Assume a loner												
				re=new RegExp(res[i].id.split("-")[1]);											// Get id to search on
				for (j=0;j<counts.length;++j) {													// For each count
					if (counts[j].val.match(re)) {												// In this one
						m="+";																	// Got kids
						path=counts[j].val;														// Add path
						}
					}												
				str+="<ul style='list-style-type:none'>";										// Header
				str+=this.AddTreeLine(res[i].header,res[i].id,m,path)+"</li></ul>"; 			// Add it
				}
			
			str=str.replace(/~~/,n+res.length);													// Set total count
			for (i=0;i<d.ancestors.length;++i) str+="</li></ul>";								// Close chain
			this.content[0]=str.replace(/\t|\n|\r/g,"")+"</ul><br>";							// Set context tab
			this.ShowTab(0);																	// Draw it
		});
	}

	AddTreeLine(lab, id, marker, path) 														// ADD LINE TO TREE
	{	
		let s=`<li style='margin:2px 0 2px ${-32}px'>`;											// Header
		if (marker)	s+=`<div class='sui-spDot' id='sui-spDot-${path}'>${marker}</div>`;			// If a dot, add it
		else		s+="<div class='sui-spDot' style='background:none;color:#5b66cb'><b>&bull;</b></div>";	// If a loner
		s+=`<a class='sui-noA' id='sui-spLab-${id}' href='#p=${id}'>${lab}${sui.pages.AddPop(id)}</a>`;		
		return s;																				// Return line
	}

	AddBranch(facet, path, dot)																// LAZY LOAD BRANCH
	{
		let _this=this;
		sui.GetTreeChildren(facet,path,(res)=>{													// Get children
			let str="";
			let i,j,re,m,path;
			let counts=[];
			try { counts=res.facets.child_counts.buckets; } catch(e) {}							// Get child counts
			res=res.response.docs;																// Point at docs
			for (i=0;i<res.length;++i) {														// For each child
				path="";	m=null;																// Assume a loner												
				re=new RegExp(res[i].id.split("-")[1]);											// Get id to search on
				for (j=0;j<counts.length;++j) {													// For each count
					if (counts[j].val.match(re)) {												// In this one
						m="+";																	// Got kids
						path=counts[j].val;														// Add path
						}
					}												
				str+="<ul style='list-style-type:none'>";										// Header
				str+=this.AddTreeLine(res[i].header,res[i].id,m,path)+"</li></ul>"; 			// Add it
				}
			$(dot).prop("id","sui-spDot-null");													// Inhibit reloading
			$(dot).html("&ndash;"); 															// Change label to 'open'
			dot.parent().append(str);															// Append branch

			$("[id^=sui-spDot-]").off("click");													// Kill handler
			$("[id^=sui-spDot-]").on("click", function(e) {										// ON RELATIONSHIP TREE DOT CLICK
				let firstChild=$(this).parent().find("ul")[0];									// Get first child
				let path=e.currentTarget.id.substring(10);										// Get id
				if (path != "null") _this.AddBranch(facet,path,$(this));						// Lazy load branch
				$(this).html($(firstChild).css("display") == "none" ? "&ndash;" : "+"); 		// Change label
				$(this).parent().find('ul').slideToggle();            							// Slide into place
				});
			});
		}

} // CLASS CLOSURE