/* MANDALA PAGE DISPLAY

	Requires: 	jQuery 												// Almost any version should work
	Calls:		seachui.js, audiovideo.js, places.js				// Other JS modules that are dynamically loaded (not ued in plain search)
	CSS:		searchui.css										// All styles are prefixed with 'sui-'
				https://texts-dev.shanti.virginia.edu/sites/all/themes/shanti_sarvaka_texts/css/shanti_texts.css				
	JS:			ECMA-6												// Uses lambda (arrow) functions
	Images:		popover.png
	Globals:	sui													// Declared globally
*/

class Pages  {																					

	constructor()   																		// CONSTRUCTOR
	{
		this.div="#sui-results";																// Div to hold page
		this.relatedBase=null;																	// Holds based kmap for related
		this.curRelatedType="Home";																// Holds current related category
		this.lastMode=sui.ss.mode;																// Previous search mode
		this.curKmap=null;																		// Currently active page kmap
	}

	Draw(kmap)																				// DRAW KMAP PAGE
	{
		this.curKmap=kmap;																		// Set active page's map
		this.DrawHeader(kmap);																	// Draw header
		$("#sui-results").css({ "padding-left":"12px", width:"calc(100% - 24px"});				// Reset to normal size
		if (sui.ss.mode == "related") {															// If browsing related pages
			if (!kmap.asset_type.match(/Places|Subjects|Terms/))								// Need to add space for these types
				$("#sui-results").css({ "padding-left": "192px", width:"calc(100% - 216px"});	// Shrink page
			}
		if (kmap.asset_type == "Places")			sui.places.Draw(kmap);						// Show place
		else if (kmap.asset_type == "Sources") 		this.DrawSource(kmap);						// Source
		else if (kmap.asset_type == "Terms") 		this.DrawTerm(kmap);						// Term
		else if (kmap.asset_type == "Subjects") 	this.DrawSubject(kmap);						// Subject
		else if (kmap.asset_type == "Images") 		this.DrawImage(kmap);						// Image
		else if (kmap.asset_type == "Audio-Video") 	sui.av.Draw(kmap);							// AV
		else if (kmap.asset_type == "Texts") 		this.DrawText(kmap);						// Text
		else if (kmap.asset_type == "Visuals") 		this.DrawVisual(kmap);						// Visual
	}

	DrawRelatedAssets(o)																	// DRAW RELATED ASSETS MENU
	{
		if (sui.ss.mode == "related")	o=this.relatedBase;										// If related, use base
		else							this.lastMode=sui.ss.mode;								// Save last search mode
		if (!o)							return;													// No related to show
		if (!o.asset_type.match(/Places|Subjects|Terms/) && (sui.ss.mode != "related")) return;	// Quit if not related or a sub/term/place
		var k=o.asset_type;																		// Get thus asset type																	
		var n=sui.assets.All.n;																	// Get number of items in current asset
	
		var str=`<div class='sui-related' style='border-color:${sui.ss.mode == "related" ? sui.assets[k].c : "transparent"}'>`;														
		if (sui.ss.mode != "related")	str+="RELATED RESOURCES<hr style='margin-right:12px'>";
		str+="<div class='sui-relatedList'>";
		if (sui.ss.mode == "related")
			str+="<div class='sui-relatedItem' id='sui-rl-Home'><span style='font-size:18px; vertical-align:-3px; color:"+sui.assets[k].c+"'>"+sui.assets[k].g+" </span> <b style='color:"+sui.assets[k].c+"'>Home</b></div>";
		for (k in sui.assets) {																	// For each asset type														
			n=sui.assets[k].n;																	// Get number of items
			if (n > 1000)	n=Math.floor(n/1000)+"K";											// Shorten
			str+="<div class='sui-relatedItem' id='sui-rl-"+k+"'><span style='font-size:18px; vertical-align:-3px; color:"+sui.assets[k].c+"'>"+sui.assets[k].g+" </span> "+k+" ("+n+")</div>";
			}
		str+="</div></div>";	
		$("#sui-results").append(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div
		$("#sui-rl-"+this.curRelatedType).css({ "background-color":"#f7f7f7"});					// Hilite current

		$("[id^=sui-rl-]").on("click", (e)=> {													// ON CLICK ON ASSET 
			this.curRelatedType=e.currentTarget.id.substring(7);								// Get asset type		
			if (this.curRelatedType == "Home")	{												// Home asset
				if (sui.ss.mode == "related")	sui.ss.mode=this.lastMode;						// Get out of related
				this.baseMap=null;																// No base and set to home
				this.Draw(this.relatedBase);													// Show
				}
			else{
								// Get kmaps in sui.curResults
				sui.ss.mode="related";															// Go to related mode
				if (!this.relatedBase)	 this.relatedBase=o;									// If starting fresh
				str=sui.assets[k].g+"&nbsp;&nbsp;Resources related to <i>"+this.relatedBase.title[0]+"</i>"; 	// New header
				$("#sui-headLeft").html(str);													// Add to div
				sui.DrawItems();																// Draw items																
				sui.DrawFooter();																// Draw footer
				sui.ss.page=0;																	// Start at beginning
				}
			});							
	}

	DrawHeader(o)																			// DRAW HEADER
	{
		var i;
		$("#sui-headRight").html("<span id='plc-closeBut' class='sui-resClose'>&#xe60f</span>");
		$("#plc-closeBut").on("click", ()=> { this.relatedBase=null; sui.Draw(this.lastMode); });	// Close handler, release related base
		if (sui.ss.mode == "related")	return;
		var str=`${sui.assets[o.asset_type].g}&nbsp;&nbsp`;
		str+=o.title[0];																		// Add title
		if (o.ancestors_txt && o.ancestors_txt.length > 1) {									// If has an ancestors trail
			str+="<br><div class='sui-breadCrumbs'>";											// Holds bread crumbs
			for (i=0;i<o.ancestors_txt.length-1;++i) {											// For each trail member
				str+=`<span class='sui-crumb' id='sui-crumb-${o.asset_type}-${o.ancestor_ids_is[i+1]}'>				
				${o.ancestors_txt[i]}</span>`;											
				if (i < o.ancestors_txt.length-2)	str+=" > ";									// Add separator
				}
			}
		$("#sui-headLeft").html(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div
		$("#sui-footer").html(`<div style='float:right;font-size:14px;margin-right:16px'>${o.asset_type.toUpperCase()} ID: ${o.id}</div>`);	// Set footer
		$("#sui-header").css("background-color",sui.assets[o.asset_type].c);					// Color header
		$("#sui-footer").css("background-color",sui.assets[o.asset_type].c);					// Color footer
	
		$("[id^=sui-crumb-]").on("click",(e)=> {												// ON BREAD CRUMB CLICK
			var id=e.currentTarget.id.substring(10).toLowerCase();								// Get id
			sui.GetKmapFromID(id,(kmap)=>{ sui.SendMessage("",kmap); });						// Get kmap and show page
			});
	}

	DrawItem(icon, label, value, def, style, bold)												// DRAW ITEM
	{
		let i,str="<p>";
		if ((value == null) || (value == undefined))	return "";								// Return nothing
		if (icon)	str+=icon+"&nbsp;&nbsp;";													// Add icon
		str+="<span class='sui-pageLab'";														// Label head
		if (bold)	str+=" style='font-weight:600'";											// Bold?
		str+=">"+label+":&nbsp;&nbsp;</span>";													// Add label
		str+="<span class='";																	// Add value span
		str+=(style ? style : "sui-pageVal")+"'>";												// Default, or special style
		if (typeof(value) == "object") {														// If an array
			for (i=0;i<value.length;++i)	{													// For each item
				if (value[i].header)		str+=value[i].header;								// Use .header
				else if (value[i].value)	str+=value[i].value;								// .value
				else if (value[i].val)		str+=value[i].val;									// .val
				else if (value[i].title)	str+=value[i].title;								// .title
				else 						str+=value[i];										// Plain	
				if (i != value.length-1)	str+=", ";											// Add separator
				}
			}
		else str+=value ? value : def;															// Add def if bad value or show value
		return str+"</span></p>";																// Return item
	}

	AddDrop(id)																				// ADD KMAP POPOVER
	{
		return "&nbsp;<img src='popover.png' onmouseenter='sui.pages.ShowPopover(\""+id+"\",event)'>";	// Add image call to show popover
	}

	ShowPopover(id, event)																	// ADD KMAP DROP DOWN
	{
		var i;
		$("#sui-popover").remove();																// Remove old one
		var pos=$(event.target).position();														// Get position of icon
		let str=`<div id='sui-popover' class='sui-popover' 
		style='top:${pos.top+24+$(this.div).scrollTop()}px;left:${pos.left-150}px'>
		<div style='width:0;height:0;border-left:10px solid transparent;
		border-right:10px solid transparent;border-bottom:10px solid #999;
		margin-left:calc(50% - 12px); margin-top:-22px; margin-bottom:12px'</div>
		<div style='width:0;height:0;border-left:8px solid transparent;
		border-right:8px solid transparent;border-bottom:10px solid #fff;
		margin-left:calc(50% - 8px)'</div>
		</div>`;
		$(this.div).append(str.replace(/\t|\n|\r/g,""));										// Remove format and add to div
	
		sui.GetKmapFromID(id,(o)=>{ 
			let str=`<div style='float:right;margin-top:-8px;font-size:10px'>${o.id}</div>
			<b>${o.title[0]}</b><hr style='border-top:1px solid #ccc'>
			<span style='font-size:12px;'>
				For more information about this ${o.asset_type.toLowerCase().slice(0,-1)}, see Full Entry below.<br>
				<b><p>${o.asset_type}: </b>`;
				for (i=0;i<o.ancestors_txt.length-1;++i) {											// For each trail member
					str+=`<span class='sui-crumb' style='color:#000099' id='sui-crumb-${o.asset_type}-${o.ancestor_ids_is[i+1]}'>				
					${o.ancestors_txt[i]}</span>`;											
					if (i < o.ancestors_txt.length-2)	str+=" / ";									// Add separator
					}
				str+=`</p></span><br>
				<div style='width:100%;padding:1px 12px;background-color:#333;font-size:14px;
				border-radius:0 0 6px 6px;color:#ddd;margin:-12px;cursor:pointer'>
				<p class='sui-popItem' id='sui-full-${id}'>&#xe629&nbsp;&nbsp;FULL ENTRY</p>
				<p class='sui-popItem' id='sui-pop-${id}' style='cursor:pointer'>&#xe634&nbsp;&nbsp;Related Subjects (1)</p>
				<p class='sui-popItem'id='sui-pop-${id}'  style='cursor:pointer'>&#xe62a&nbsp;&nbsp;Related Images (32)</p>
				</div>`;
			$("#sui-popover").append(str.replace(/\t|\n|\r/g,""));								// Remove format and add to div

			$("[id^=sui-pop-]").on("click",(e)=> {												// ON ITEM CLICK
				var id=e.currentTarget.id.substring(8).toLowerCase();							// Get id
				sui.ss.mode="related";															// Related mode
				this.relatedBase=this.curKmap;													// Set base
				str=sui.assets[this.curKmap.asset_type].g+"&nbsp;&nbsp;Resources related to <i>"+this.relatedBase.title[0]+"</i>"; 	// New header
				$("#sui-headLeft").html(str);													// Add to div
				// Get real items
				sui.DrawItems();																// Draw items																
				sui.DrawFooter();																// Draw footer															
				sui.ss.page=0;																	// Start at beginning
				});
	
			$("#sui-full-"+id).on("click",(e)=> {												// ON FULL ENTRY CLICK
				var id=e.currentTarget.id.substring(9).toLowerCase();							// Get id
				trace(id)
				sui.ss.mode="related";															// Related mode
				this.relatedBase=this.curKmap;													// Set base
				str=sui.assets[this.curKmap.asset_type].g+"&nbsp;&nbsp;Resources related to <i>"+this.relatedBase.title[0]+"</i>"; 	// New header
				$("#sui-headLeft").html(str);													// Add to div
				sui.GetKmapFromID(id,(kmap)=>{ sui.SendMessage("",kmap); });					// Get kmap and show page
				});
			
			$("[id^=sui-crumb-]").on("click",(e)=> {											// ON BREAD CRUMB CLICK
				var id=e.currentTarget.id.substring(10).toLowerCase();							// Get id
				sui.ss.mode="related";															// Related mode
				this.relatedBase=this.curKmap;													// Set base
				str=sui.assets[this.curKmap.asset_type].g+"&nbsp;&nbsp;Resources related to <i>"+this.relatedBase.title[0]+"</i>"; 	// New header
				$("#sui-headLeft").html(str);													// Add to div
				sui.GetKmapFromID(id,(kmap)=>{ sui.SendMessage("",kmap); });					// Get kmap and show page
				});
			});
	}

	FormatDate(date)																		// FRIENDLY FORMAT OF DATE
	{
		let m=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];		// Array of mos
		let d=new Date(date);																	// Parse date
		if (d)	date=d.getDate()+" "+m[d.getMonth()]+ " "+d.getFullYear();						// Remake it
		return date;
	}		

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// TEXT
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	DrawText(o)																				// DRAW TEXTS PAGE FROM KMAP
	{
		var content=["","",""];
		var str="<div class='sui-texts'>";
		if (!$(".shanti-texts-section-content").length)											// No CSS yet
			$("<link/>", { rel:"stylesheet", type:"text/css", href:"https://texts-dev.shanti.virginia.edu/sites/all/themes/shanti_sarvaka_texts/css/shanti_texts.css" }).appendTo("head"); 	// Load CSS
		var url=o.url_ajax.replace(/node_ajax/i,"node_embed")+"?callback=pfunc";				// Make url
		$(this.div).html("");																	// Clear page	
		sui.LoadingIcon(true,64);																// Show loading icon

		$.ajax( { url:url, dataType:'jsonp'}).done((data)=> {									// Get json
			sui.LoadingIcon(false);																// Hide loading icon
			str+=data+`</div>																
			<div style='display:inline-block;width:calc(34% + 3px);margin-left:-8px;vertical-align:top'>
			<div class='sui-textTop' id='sui-textTop'>
				<div class='sui-textTab' id='sui-textTab0'>
					<div style='display:inline-block;padding-top:10px'>CONTENTS</div></div>
				<div class='sui-textTab' id='sui-textTab1' style='border-left:1px solid #ccc; border-right:1px solid #ccc'>
					<div style='display:inline-block;padding-top:10px'>DESCRIPTION</div></div>
				<div class='sui-textTab' id='sui-textTab2'>
					<div style='display:inline-block;padding-top:10px'>VIEWS</div></div>
			</div>
			<div class='sui-textSide' id='sui-textSide'></div></div>`;
			$(this.div).html(str.replace(/\t|\n|\r/g,""));										// Remove format and add to div	
			this.DrawRelatedAssets(o);															// Draw related assets menu if active

			content[0]=$("#shanti-texts-toc").html();											// Save toc
			$("#shanti-texts-sidebar").remove();												// Remove original sidebar
			showTab(0);
	
			let s=`<p><b>ALTERNATIVE FORMATS</b></p>
			<p>&nbsp;&nbsp;&nbsp;&nbsp;<a target='_blank' href='https://texts.shanti.virginia.edu/book_pubreader/${o.id}'>&#xe678&nbsp;&nbsp;View in PubReader</a></p>
			<p>&nbsp;&nbsp;&nbsp;&nbsp;<a target='_blank' href='https://texts.shanti.virginia.edu/shanti_texts/voyant/${o.id}'>&#xe678&nbsp;&nbsp;View in Voyant</a></p>
			<p>&nbsp;&nbsp;&nbsp;&nbsp;<a target='_blank' href='https://texts.shanti.virginia.edu/shanti_texts/node_ajax_text/${o.id}'>&#xe678&nbsp;&nbsp;View as raw text</a></p>`;
			content[2]=s.replace(/\t|\n|\r/g,"");												// Set view content

			sui.GetJSONFromKmap(o, (d)=> { 														// Get JSON
				let i,str="";
				if (o.summary) str+=o.summary+"<hr>";											// Add summary
				try { str+=this.DrawItem("&#xe633","COLLECTION",o.collection_title,"","sui-pageLab",1); } catch(e) {}
				try { str+=this.DrawItem("&#xe600","AUTHOR",d.field_book_author.und,"","sui-pageLab",1); } catch(e) {}
				try { str+=this.DrawItem("&#xe633","YEAR PUBLISHED", d.field_dc_date_publication_year.und[0].value.substr(0,4),"","sui-pageLab",1); }		catch(e) {}
				try { str+=this.DrawItem("&#xe633","ORIGINAL YEAR PUBLISHED", d.field_dc_date_orginial_year.und[0].value.substr(0,4),"","sui-pageLab",1); }	catch(e) {}
				if (o.kmapid_strict_ss) {														// If subjects and/or places
					str+="<p class='sui-pageLab'>&#xe62b&nbsp;&nbsp<b>SUBJECTS</b>:&nbsp;&nbsp;";// Add subjects header
					for (i=0;i<o.kmapid_strict_ss.length;++i) {									// For each item
						if (!o.kmapid_strict[i].match(/subjects/i)) continue;					// Only looking for subjects
						str+=o.kmapid_strict_ss[i]+this.AddDrop(o.kmapid_strict[i]);;			// Add name and drop
						if (i < o.kmapid_strict_ss.length-1)	str+=", ";						// Add separator
						}
					str+="</p>";																// End SUBJECTS
					str+="<p class='sui-pageLab'>&#xe634&nbsp;&nbsp<b>PLACES</b>:&nbsp;&nbsp;";	// Add places header
					for (i=0;i<o.kmapid_strict_ss.length;++i) {									// For each item
						if (!o.kmapid_strict[i].match(/places/i)) continue;						// Only looking for places
						str+=o.kmapid_strict_ss[i]+this.AddDrop(o.kmapid_strict[i]);;				// Add name and drop
						if (i < o.kmapid_strict_ss.length-1)	str+=", ";						// Add separator
						}
					str+="</p>";																// End PLACES
					}
				str+="<p class='sui-pageLab'>&#xe635&nbsp;&nbsp<b>TERMS</b>:&nbsp;&nbsp;";		// Add TERMS header
				if (d.field_kmap_terms && d.field_kmap_terms.und) {								// If terms
					for (i=0;i<d.field_kmap_terms.und.length;++i) {								// For each item
						str+=d.field_kmap_terms.und[i].header;									// Add name
						str+=this.AddDrop(d.field_kmap_terms.und[i].domain+"-"+d.field_kmap_terms.und[i].id);	// Add drop
						if (i < d.field_kmap_terms.und.length-1)	str+=", ";					// Add separator
						}
					}
				str+="</p>";																	// End TERMS
				try { str+=this.DrawItem("&#xe675","EDITOR",d.field_book_editor.und,"","sui-pageLab",1); }				catch(e) {}
				try { str+=this.DrawItem("&#xe674","TRANSLATOR",d.field_book_translator.und,"","sui-pageLab",1); }		catch(e) {}
				try { str+=this.DrawItem("&#xe670","LANGUAGE",d.field_dc_language_original.und,"","sui-pageLab",1); }	catch(e) {}
				try { str+=this.DrawItem("&copy;","RIGHTS", d.field_dc_rights_general.und,"","sui-pageLab",1); }		catch(e) {}
				content[1]=str.replace(/\t|\n|\r/g,"");												// Set view content
				});
			
			$("[id^=sui-textTab]").on("click", (e)=> {											// ON TAB CLICK
				var id=e.currentTarget.id.substring(11);										// Get index of tab	
					showTab(id);																// Draw it
				});
	
			function showTab(which) {
				$("#sui-textSide").html("<div class='sui-sourceText' style='font-size:18px;color:#000'>"+o.title+"<div><hr>");	// Set title
				$("[id^=sui-textTab]").css({"border-bottom":"1px solid #ccc","background-color":"#f8f8f8" });
				$("#sui-textTab"+which).css({"border-bottom":"","background-color":"#fff"});
				$("#sui-textSide").append(content[which]);										// Set content
			}
		});							
	}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// VISUAL
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	DrawVisual(o)																			// DRAW VISUAL PAGE FROM KMAP
	{
		sui.GetJSONFromKmap(o, (d)=> { drawDetails(d); });										// Gert JSON
		var url="//visuals.shanti.virginia.edu/sites/all/libraries/SHIVA/go.htm?m=//visuals.shanti.virginia.edu/data/json/";
		url+=o.id;																				// Full url
		var d=this.DrawItem;																	// Point at item drawer
	
		function drawDetails(j) {																// Draw details
			var shivaNode=$.parseJSON(j.shivanode_json.und[0].value);							// Get shiva data
			var wid=shivaNode.width ? shivaNode.width+"px" : "100%";							// If width set use it 
			var hgt=shivaNode.height ? shivaNode.height+"px" : "calc(100% - 155px)";			// Height 
			var src=shivaNode.dataSourceUrl ? shivaNode.dataSourceUrl : "";						// Data source
			var str=`<iframe id='sui-iframe' frameborder='0' scrolling='no' src='${url}' 
			style='margin-left:auto;margin-right:auto;height:${hgt};width:${wid};display:block;overflow:hidden'></iframe><br>`;	
	
			str+="<div class='sui-sources' style='padding-top:0'>";
			str+="<div style='text-align:center'>"+d("&#xe633","MANDALA COLLECTION",o.collection_title,"None")+"</div>";
			str+="<hr style='border-top: 1px solid #6e9456;margin-top:12px'>";
			try{ str+=d("&#xe63b","TITLE",o.title[0],"Untitled"); } catch(e){}
			try{ str+=d("&#x65f","TYPE",o.asset_subtype.replace(/:/g," | ")) } catch(e){}
			try{ str+=d("&#xe60c","DATE",o.node_created.substr(0,10)) } catch(e){}
			try{ str+="&#xe600&nbsp;&nbsp;<span class='sui-pageLab'>CREATOR</span>:&nbsp;&nbsp;<span class='sui-pageVal'>";
				str+=(o.node_user_full) ? o.node_user_full+"&nbsp;&nbsp" : "" +"";
				str+=(o.node_user) ? o.node_user : ""; str+="</span>"; } catch(e) {}
				if (j.field_kmaps_subjects && j.field_kmaps_subjects.und) {							// If subjects
					str+="<p class='sui-pageLab'>SUBJECTS:&nbsp;&nbsp;";							// Add header
					for (i=0;i<j.field_kmaps_subjects.und.length;++i) {								// For each item
						str+=j.field_kmaps_subjects.und[i].header;									// Add name
						str+=this.AddDrop(j.field_kmaps_subjects.und[i].domain+"-"+j.field_kmaps_subjects.und[i].id);	// Add drop
						if (i < j.field_kmaps_subjects.und.length-1)	str+=", ";					// Add separator
						}
					str+="</p>";																	// End TERMS
					}
				if (j.field_kmaps_places && j.field_kmaps_places.und) {								// If places
					str+="<p class='sui-pageLab'>TERMS:&nbsp;&nbsp;";								// Add header
					for (i=0;i<j.field_kmaps_places.und.length;++i) {								// For each item
						str+=j.field_kmaps_places.und[i].header;									// Add name
						str+=this.AddDrop(j.field_kmaps_places.und[i].domain+"-"+j.field_kmaps_places.und[i].id);	// Add drop
						if (i < j.field_kmaps_places.und.length-1)	str+=", ";						// Add separator
						}
					str+="</p>";																	// End PLACES
					}
				if (j.field_kmap_terms && j.field_kmap_terms.und) {									// If terms
					str+="<p class='sui-pageLab'>TERMS:&nbsp;&nbsp;";								// Add TERMS header
					for (i=0;i<j.field_kmap_terms.und.length;++i) {									// For each item
						str+=j.field_kmap_terms.und[i].header;										// Add name
						str+=this.AddDrop(j.field_kmap_terms.und[i].domain+"-"+j.field_kmap_terms.und[i].id);	// Add drop
						if (i < j.field_kmap_terms.und.length-1)	str+=", ";						// Add separator
						}
					str+="</p>";																	// End TERMS
					}		
			if (src) 		str+="<p>&#xe678&nbsp;&nbsp;<a target='_blank' href='"+src+"'>External spreadsheet</a></p>"; 
			if (o.caption)	str+=o.caption;		
	
			var urlw=`[iframe src="${url}" width="${wid}" height="${hgt}"]`;					// Wordpress embed code
			var urli=`&lt;iframe src=\"${url}\" width=\"${wid}\" height=\"${hgt}\"&gt;`;		// Iframe
			str+=`<hr>&#xe600&nbsp;&nbsp;<span class='sui-pageLab'>SHARE AS</span>:&nbsp;&nbsp;
				<a id='sui-share-1' style='display:inline-block;cursor:pointer'>Link&nbsp;&nbsp;&nbsp;</a>
				<a id='sui-share-2' style='display:inline-block;cursor:pointer'>WordPress&nbsp;&nbsp;&nbsp;</a>
				<a id='sui-share-3' style='display:inline-block;cursor:pointer'>Iframe&nbsp;&nbsp;&nbsp;</a>
				<p id='sui-resShare' style='border-radius:4px;background-color:#fff;padding:8px;display:none;border:1px solid #ccc'></p>
				</div>`;

			$("#sui-resShare").html("<b>LINK</b>: ${url}"); $("#sui-resShare").toggle();
			$(sui.pages.div).html(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div	
			sui.pages.DrawRelatedAssets(o);														// Draw related assets menu if active
		
			$("[id^=sui-share-]").on("click",(e)=> {											// ON THUMBNAIL CLICK
				var id=e.currentTarget.id.split("-")[2];										// Get id
				if (id == "1")		$("#sui-resShare").html(url);								// Link
				else if (id == "2")	$("#sui-resShare").html(`[iframe src="${url}" width="${wid}" height="${hgt}"]`);		// Wordpress embed code
				else if (id == "3")	$("#sui-resShare").html(`&lt;iframe src="${url}" width="${wid}" height="${hgt}"&gt;`);	// Iframe
				$("#sui-resShare").show();														// Toggle state	
				});
			}
	}

	DrawIframe(o)																			// DRAW AV PAGE FROM KMAP
	{
		var str=`<iframe id='sui-iframe' frameborder='0' 
		src='${o.url_html}' style='height:calc(100vh - 155px);width:100%'></iframe>`;	
		$(this.div).html(str.replace(/\t|\n|\r/g,""));											// Remove format and add to div	
		this.DrawRelatedAssets(o);																// Draw related assets menu if active
	}

	DrawTerm(o)																				// DRAW TERM PAGE FROM KMAP
	{
		var latin=(typeof(o.name_latin) == "string" ) ? o.name_latin : o.name_latin.join(", ");
		var str=`<div class='sui-sources' style='margin:8px 0px 0 192px'>
		<span style='font-size:24px;color:${sui.assets[o.asset_type].c};vertical-align:-4px'>${sui.assets[o.asset_type].g}</span>
		&nbsp;&nbsp;&nbsp;&nbsp;<span class='sui-sourceText' style='font-size:20px;font-weight:500'>${o.title[0]}</span>
		<hr style='border-top: 1px solid ${sui.assets[o.asset_type].c}'>
		<p>TIBETAN:&nbsp;&nbsp<span class='sui-sourceText'>${o.name_tibt}&nbsp;&nbsp;(Tibetan script, original)</span></p>
		<p>LATIN:&nbsp;&nbsp<span class='sui-sourceText'>${latin}</span></p>`;
		try{ str+="<p>PHONEME:&nbsp;&nbsp<span class='sui-sourceText'>";						// Add header
			for (let i=0;i<o.data_phoneme_ss.length;++i) {										// For each item
				str+=o.data_phoneme_ss[i]+this.AddDrop(o.related_uid_ss[i]);					// Add name and drop
				if (i < o.data_phoneme_ss.length-1)	str+=", ";									// Add separator
				}
			str+="</p>"; } catch(e){trace(e)}
		str+=`<p><span style='font-size:20px;vertical-align:-4px;color:${sui.assets[o.asset_type].c}'><b>&#xe60a</b></span>&nbsp;&nbsp;&nbsp;
		<select class='sui-termSpeak'><option>AMDO GROUP</option><option>KHAM-HOR GROUP</option></select></p>
		<hr style='border-top: 1px solid ${sui.assets[o.asset_type].c}'>
		<p>OTHER DICTIONARIES:&nbsp;&nbsp;</div>`;
		$(this.div).html(str.replace(/\t|\n|\r/g,""));											// Remove format and add to div	
		this.DrawRelatedAssets(o);																// Draw related assets menu
	}

	DrawSubject(o)																			// DRAW SUBJECT PAGE FROM KMAP
	{
		var str=`<div class='sui-sources' style='margin:8px 0px 0 192px'>
		<span style='font-size:24px;color:${sui.assets[o.asset_type].c};vertical-align:-4px'>${sui.assets[o.asset_type].g}</span>
		&nbsp;&nbsp;&nbsp;&nbsp;<span class='sui-sourceText' style='font-size:20px;font-weight:500'>${o.title[0]}</span>
		<hr style='border-top: 1px solid ${sui.assets[o.asset_type].c}'>`
		if (o.caption)	str+="<p>"+o.caption+"</p>";
		str+="<p style='width:calc(100% - 16px);background-color:#888;color:#fff;padding:8px'><b>NAMES</b></p><table>";
		if (o.names_txt && o.names_txt.length) {												// If names
			for (var i=0;i<o.names_txt.length;++i) {											// For each name
				if (o.names_txt[i].match(/lang="bo"/i))											// Language id - bo
					str+="<tr><td style='color:#000099;font-size:20px'>"+o.names_txt[i]+"&nbsp;&nbsp;&nbsp;</td><td><i>Dzongkha, Tibetan script, Original</i></td></tr>";	// Add it
				else 
					str+="<tr><td></td><td>> "+o.names_txt[i]+"</td></tr>";						// Add it
				}
			}	
		str+="</table></div>";
		$(this.div).html(str.replace(/\t|\n|\r/g,""));											// Remove format and add to div	
		this.DrawRelatedAssets(o);																// Draw related assets menu
	}

	DrawSource(o)																			// DRAW SOURCE PAGE FROM KMAP
	{
		var i;
		var str=`<div class='sui-sources' id='sui-sources'>
		<span style='font-size:24px;color:${sui.assets[o.asset_type].c};vertical-align:-4px'>${sui.assets[o.asset_type].g}</span>
		&nbsp;&nbsp;<span class='sui-sourceText' style='font-size:20px;font-weight:500'>${o.title[0]}</span>
		<hr style='border-top: 1px solid #aaa'>
		<div id='sui-srcSec' style='font-size:18px;font-weight:400'></div><br>`;
		if (o.creator && o.creator.length) {
			str+=`<span class='sui-pageLab' style='color:${sui.assets[o.asset_type].c}'>&#xe600</span>
			&nbsp;&nbsp;${o.creator.join(", ")}<br><br>`;
			}
		if (o.url_thumb && !o.url_thumb.match(/gradient.jpg/)) str+="<img src='"+o.url_thumb+"' style='float:right;width:33%; padding:0 0 12px 12px'>";
		if (o.asset_subtype) str+="<p>FORMAT:&nbsp;&nbsp<span class='sui-sourceText'>"+o.asset_subtype+"</p>";
		str+="<p class='sui-pageLab'>PUBLICATION YEAR:&nbsp;&nbsp<span class='sui-sourceText' id='sui-srcYear'></span>";
		if (o.publisher_s) str+="<p>PUBLISHER:&nbsp;&nbsp<span class='sui-sourceText'>"+o.publisher_s+"</p>";
		str+="<p class='sui-pageLab'>PLACE OF PUBLICATION:&nbsp;&nbsp<span class='sui-sourceText' id='sui-srcPlc'></span>";
		str+="<p class='sui-pageLab'>PAGES:&nbsp;&nbsp<span class='sui-sourceText' id='sui-srcPages'></span>";
		str+="<p class='sui-pageLab'>SOURCE ID:&nbsp;&nbsp<span class='sui-sourceText'>sources-"+o.id+"</span></p>";
		if (o.summary) str+="<p>ABSTRACT:<div class='sui-sourceText'>"+o.summary+"</div></p>";
		str+="</div>";
		$(this.div).html(str.replace(/\t|\n|\r/g,""));											// Remove format and add to div	
		this.DrawRelatedAssets();																// Draw related assets menu if active
		
		sui.GetJSONFromKmap(o, (d)=> {															// Get details from JSON
			let i,str="";
			if (d.biblio_pages) 			$("#sui-srcPages").html(d.biblio_pages);			// Add pages
			if (d.biblio_year) 				$("#sui-srcYear").html(d.biblio_year);				// Year
			if (d.biblio_secondary_title) 	$("#sui-srcSec").html(d.biblio_secondary_title);	// Pub
			if (d.biblio_place_published) 	$("#sui-srcPlc").html(d.biblio_place_published);	// Pub place
			if (d.field_kmaps_subjects && d.field_kmaps_subjects.und) {							// If subjects
				str+="<p class='sui-pageLab'>SUBJECTS:&nbsp;&nbsp;";							// Add header
				for (i=0;i<d.field_kmaps_subjects.und.length;++i) {								// For each item
					str+=d.field_kmaps_subjects.und[i].header;									// Add name
					str+=this.AddDrop(d.field_kmaps_subjects.und[i].domain+"-"+d.field_kmaps_subjects.und[i].id);	// Add drop
					if (i < d.field_kmaps_subjects.und.length-1)	str+=", ";					// Add separator
					}
				str+="</p>";																	// End TERMS
				}
			if (d.field_kmaps_places && d.field_kmaps_places.und) {								// If places
				str+="<p class='sui-pageLab'>TERMS:&nbsp;&nbsp;";								// Add header
				for (i=0;i<d.field_kmaps_places.und.length;++i) {								// For each item
					str+=d.field_kmaps_places.und[i].header;									// Add name
					str+=this.AddDrop(d.field_kmaps_places.und[i].domain+"-"+d.field_kmaps_places.und[i].id);	// Add drop
					if (i < d.field_kmaps_places.und.length-1)	str+=", ";						// Add separator
					}
				str+="</p>";																	// End PLACES
				}
			if (d.field_kmap_terms && d.field_kmap_terms.und) {									// If terms
				str+="<p class='sui-pageLab'>TERMS:&nbsp;&nbsp;";								// Add TERMS header
				for (i=0;i<d.field_kmap_terms.und.length;++i) {									// For each item
					str+=d.field_kmap_terms.und[i].header;										// Add name
					str+=this.AddDrop(d.field_kmap_terms.und[i].domain+"-"+d.field_kmap_terms.und[i].id);	// Add drop
					if (i < d.field_kmap_terms.und.length-1)	str+=", ";						// Add separator
					}
				str+="</p>";																	// End TERMS
				}
			if (d.biblio_url) str+="<p class='sui-pageLab'>URL:&nbsp;&nbsp;<a target='_blank' href='"+d.biblio_url+"'>"+d.biblio_url+"</a></p>";	// URL
			$("#sui-sources").append(str);
			});									
	}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IMAGE
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	DrawImage(o)																			// DRAW IMAGE PAGE FROM KMAP
	{
		var i,mid;
		var asp=o.url_thumb_height/o.url_thumb_width;
		var w=$(this.div).width()/2;
		var h=w*asp;
		for (i=0;i<sui.curResults.length;++i) {	if (o.id == sui.curResults[i].id)	mid=i; }

		var str=`<div class='sui-imagesBox'>
		<div id='sui-picEnlarge' style='cursor:pointer;font-size:16px' title='Click to enlarge and pan'>&#xe650</div></p>
		<div id='sui-imageDiv' style='overflow:hidden;width:50%;height:${h}px;margin-left:auto; margin-right:auto; user-select:none'>
			<img id='sui-thisPic' src='${o.url_thumb.replace(/200,200/,"2000,2000")}' style='width:100%'> 
		</div><br>
		<div><span style='font-size:14px;vertical-align:-2px;color:#ccc'>&#xe62a</span>&nbsp;&nbsp;${o.title[0]}</div>
		<div style='color:#ccc;margin-bottom:24px'>${o.creator}&nbsp;&nbsp;|&nbsp;&nbsp;${o.img_width_s} x ${o.img_height_s} px</div>
		<div class='sui-imageGal'id='sui-imageGal'>`;
				
		for (i=mid-1;i>=0;--i) 
			if (sui.curResults[i].asset_type == "Images")
				str+=`<div class='sui-pageThumb'><img id='sui-pageThumb-${i}' src='${sui.curResults[i].url_thumb}' style='height:100%'></div>`;	
		str+=`<div class='sui-pageThumb' style=' border-color:#fff'><img id='sui-pageThumb-${mid}' src='${o.url_thumb}' style='height:100%'></div>`;	
			for (i=mid+1;i<sui.curResults.length;++i) 
				if (sui.curResults[i].asset_type == "Images")
					str+=`<div class='sui-pageThumb'><img id='sui-pageThumb-${i}' src='${sui.curResults[i].url_thumb}' style='height:100%'></div>`;	
		str+="</div></div>";
		
		sui.GetJSONFromKmap(o, (d)=> { drawDetails(d); });										// Load detaill from JSON
		$(this.div).html(str.replace(/\t|\n|\r/g,""));											// Remove format and add to div	
		this.DrawRelatedAssets();																// Draw related assets menu if active
		$("#sui-imageGal").scrollLeft($("#sui-pageThumb-"+mid).offset().left-w+25);				// Scroll to center

		var places=[],subjects=[];
		try{
			for (i=0;i<o.kmapid_strict.length;++i) {
				if (o.kmapid_strict[i].match(/places/))		places.push(o.kmapid_strict_ss[i]+this.AddDrop(o.kmapid_strict[i]));
				if (o.kmapid_strict[i].match(/subjects/))	subjects.push(o.kmapid_strict_ss[i]+this.AddDrop(o.kmapid_strict[i]));
				}
		} catch(e) {}
		str=`<table class='sui-imageMid'>
			<tr class='sui-pageLab' style='font-size:16px;padding-bottom:4px'><td style='width:50%'>MANDALA COLLECTIONS</td><td>CLASSIFICATION</td></tr>
			<tr class='sui-pageLab' style='padding-bottom:8px'><td>&#xe633&nbsp;&nbsp;${o.collection_title ? o.collection_title : "None"}</td><td>`;
			if (subjects.length) {																// If subjects	
				str+="&#xe634&nbsp;&nbsp";														// Add icon
				for (i=0;i<subjects.length;++i) str+=subjects[i]+"<br>";						// Add item
				}	
			if (places.length) {																// If places	
				str+="&#xe62b&nbsp;&nbsp";														// Add icon
				for (i=0;i<subjects.length;++i) str+=subjects[i]+"<br>";						// Add item
				}	
			str+="</td></tr></table>";

		var d=this.DrawItem;																	// Point at item drawer
		function drawDetails(j) {	
			str+="<div class='sui-images'>";
			str+="<div style='width:calc(49% - 24px);display:inline-block;margin-right:16px;vertical-align:top;height:100%;'>";
				try{ str+=d(sui.assets[o.asset_type].g,"CAPTION",o.title[0],"Untitled"); } catch(e){}
				str+="<hr>";
				try{ str+=d("&#xe600","CREATOR",o.creator) } catch(e){}
				try{ str+=d("&#xe62a","TYPE",j.field_image_type.und[0].value.charAt(0).toUpperCase()+j.field_image_type.und[0].value.slice(1)); } catch(e){}
				try{ str+=d("&#xe665","SIZE", o.img_width_s+" x "+o.img_height_s+" px"); } catch(e){}
				str+="<hr>";
				try{ str+="<p class='sui-pageLab'>";
					for (i=0;i<j.field_image_descriptions.und.length;++i) 							// For each note
						str+=j.field_image_descriptions.und[i].title+"<br>";						// Add it
					str+="</p>";  } catch(e){}
				try{ str+="<p>&#xe67f&nbsp;&nbsp;<span class='sui-pageLab'>ONLY DIGITAL</span>:&nbsp;&nbsp;"+(j.field_image_digital.und[0].value ? "Yes" : "No");
					 str+="&nbsp;&nbsp;<span class='sui-pageLab'>COLOR</span>:&nbsp;&nbsp;<span class='sui-pageVal'>"+(j.field_image_color.und[0].value ? "Yes" : "No")+"</p>"+"</span>"; } catch(e){}
				try{ str+="<p>&#xe67f&nbsp;&nbsp;<span class='sui-pageLab'>QUALITY</span>:&nbsp;&nbsp;<span class='sui-pageVal'>"+j.field_image_quality.und[0].value+"</span>&nbsp;&nbsp;<span class='sui-pageLab'>ROTATION</span>:&nbsp;&nbsp;<span class='sui-pageVal'>"+j.field_image_rotation.und[0].value+"&deg;</span></p>"; } catch(e){}
				try{ str+=d("&#xe665","PHYSICAL SIZE",j.field_physical_size.und[0].value); } 	catch(e){}
				try{ str+=d("&#xe659","CAPURE DEVICE",j.field_image_capture_device.und[0].value); } 	catch(e){}
				try{ str+=d("&#xe65f","MATERIALS",j.field_image_materials.und[0].value); } 				catch(e){}
				str+="</div><div style='width:49%;display:inline-block;vertical-align:top;border-left:1px solid #ddd;padding-left:16px'>";
				try{ str+=d("&#xe66c","ENHANCEMENT",j.field_image_enhancement.und[0].value); } 			catch(e){}
				try{ str+="<p>&#xe62B&nbsp;&nbsp;<span class='sui-pageLab'>LOCATION</span>:&nbsp;&nbsp;"+j.field_longitude.und[0].value+"&nbsp;&nbsp;&nbsp;";
				  	 str+=j.field_latitude.und[0].value+"</p>"; } catch(e){}
				try{ str+=d("&#xe634","SUBJECT",j.field_keywords.und[0].value); } 						catch(e){}
				try{ str+=d("&copy;","COPYRIGHT HOLDER",j.field_copyright_holder.und[0].value); } 		catch(e){}
				try{ str+=d("&copy;","COPYRIGHT STATEMENT",j.field_copyright_statement.und[0].value); } catch(e){}
				try{ str+=d("&#xe614","ORIGINAL&nbsp;FILE",j.field_original_filename.und[0].value); } 	catch(e){}
				try{ str+=d("&#xe678","IMAGE&nbsp;NOTES",j.field_image_descriptions.und[0].title); } 	catch(e){}
				try{ str+=d("&#xe678","TECHNICAL&nbsp;NOTES",j.field_technical_notes.und[0].value); } 	catch(e){}
				try{ str+=d("&#xe639","UPLOADED&nbsp;BY",o.node_user_full_s); } catch(e){}
				try{ str+="<p>&#xe67f&nbsp;&nbsp;<span class='sui-pageLab'>LICENSE</span>:&nbsp;&nbsp;<span class='sui-pageVal'><a style='font-weight:400' target='_blank' href='"+j.field_license_url.und[0].value+"'>"+j.field_license_url.und[0].value+"</a>" } catch(e){} 
				
				let asp=o.img_height_s/o.img_width_s;
				str+=`<p class='sui-pageLab' style='cursor:pointer' onclick='$("#sui-dlOps").toggle()'>
				&#xe616&nbsp;&nbsp;<a>CLICK TO DOWNLOAD IMAGE</a>
					<div id='sui-dlOps' style='display:none;margin-left:24px;font-size:12px'>			
					<a target='_blank' href='${o.url_thumb.replace(/200,200/,o.img_width_s+","+o.img_width_s)}'
					style='display:inline-block;cursor:pointer'>Original (${o.img_width_s}x${o.img_height_s})</a><br>
					<a target='_blank' href='${o.url_thumb.replace(/200,200/,"1200,1200")}'
					style='display:inline-block;cursor:pointer'>Large (1200x${1200*asp}))</a><br>
					<a target='_blank' href='${o.url_thumb.replace(/200,200/,"800,800")}'
					style='display:inline-block;cursor:pointer'>Medium (800x${800*asp})</a><br>
					<a target='_blank' href='${o.url_thumb.replace(/200,200/,"400,400")}'
					style='display:inline-block;cursor:pointer'>Small (400x${400*asp})</a>
					<p><i>Right-click and select "Download/Save Linked File"</i></p>
					</div>
				</p></div></div></div>`;
				$(sui.pages.div).append(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div	
		}
	
		$("[id^=sui-pageThumb-]").on("click",(e)=> {												// ON THUMBNAIL CLICK
			var id=e.currentTarget.id.split("-")[2];												// Get id
			this.DrawImage(sui.curResults[id]);														// Show image
			});

		$("#sui-picEnlarge").on("click",()=> {														// ON RESIZE PIC
			var sx,sy,px,py;
			var pic=$("#sui-thisPic")[0];															// Point at image
			if ($("#sui-picEnlarge").html().match(/Zoom/)) {										// If zoomed alraady
				$("#sui-picEnlarge").html("&#xe650");												// Restore icon
				$("#sui-thisPic").css("width","100%");												// Fit in window
				$("#sui-thisPic").offset($("#sui-imageDiv").offset());								// Restore offset
				pic.onmousedown=null;																// Remove handler
				return;																				// Quit
				}
			$("#sui-picEnlarge").html("Zoom &nbsp; &#xe651  &nbsp; out ");							// Zoom out icon
			$("#sui-thisPic").css("width","auto");													// True size
			pic.style.cursor="grab";																// Grab cursor
			pic.onmousedown=(e)=> {																	// On click
				e=e||window.event;						e.preventDefault();							// Set event locally									
				sx=e.pageX;    							sy=e.pageY;									// Start of drag
				px=$("#sui-thisPic").offset().left;		py=$("#sui-thisPic").offset().top;			// Start image offset
				pic.onmousemove=(e)=> {																// On drag
					e=e||window.event;		e.preventDefault();										// Set event
					var dx=e.pageX-sx;   	var dy=e.pageY-sy;										// Get delta
					$("#sui-thisPic").offset({left:px+dx,top:py+dy});								// Set image via offset
					};
				pic.onmouseup=(e)=> {	pic.onmouseup=pic.onmousemove=null; }; 						// Remove listeners
				};
			});
		}

} // Pages class closure
