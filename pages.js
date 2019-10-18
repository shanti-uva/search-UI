/* 	MANDALA PAGES ****************************************************************************************************************************

	This module has 3 functions:
		1. It routes to code that draws a page based on a kmap
		2. It contains helper functions to  that all pages use to draw (.e. headers, footers, reated assets, popovers)
		2. It contains the funcions to draw the less complex pages (subjects and terms)

	Requires: 	jQuery 												// Almost any version should work
	Calls:		seachui.js, audiovideo.js, places.js				// Other JS modules that are dynamically loaded (not ued in plain search)
	CSS:		searchui.css										// All styles are prefixed with 'sui-'
				https://texts-dev.shanti.virginia.edu/sites/all/themes/shanti_sarvaka_texts/css/shanti_texts.css				
	JS:			ECMA-6												// Uses lambda (arrow) functions
	Images:		popover.png
	Globals:	sui													// Declared globally

8********************************************************************************************************************************************/

class Pages  {																					

	constructor()   																		// CONSTRUCTOR
	{
		this.div="#sui-results";																// Div to hold page
		this.relatedBase=null;																	// Holds based kmap for related
		this.relatedType="Home";																// Holds current related category
		this.relatedId="";																		// Holds current related id
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
		else if (kmap.asset_type == "Sources") 		sui.src.Draw(kmap);							// Source
		else if (kmap.asset_type == "Terms") 		this.DrawTerm(kmap);						// Term
		else if (kmap.asset_type == "Subjects") 	this.DrawSubject(kmap);						// Subject
		else if (kmap.asset_type == "Images") 		sui.img.Draw(kmap);							// Image
		else if (kmap.asset_type == "Audio-Video") 	sui.av.Draw(kmap);							// AV
		else if (kmap.asset_type == "Texts") 		sui.txt.Draw(kmap);							// Text
		else if (kmap.asset_type == "Visuals") 		sui.vis.Draw(kmap);							// Visual
	}

	DrawRelatedAssets(o)																	// DRAW RELATED ASSETS MENU
	{
		if (sui.ss.mode == "related")	o=this.relatedBase;										// If related, use base
		else							this.lastMode=sui.ss.mode;								// Save last search mode
		if (!o)							return;													// No related to show
		if (!o.asset_type.match(/Places|Subjects|Terms/) && (sui.ss.mode != "related")) return;	// Quit if not related or a sub/term/place
		var url=sui.solrUtil.createKmapQuery(o.uid);											// Get query url
		$.ajax( { url: url,  dataType: 'jsonp', jsonp: 'json.wrf' }).done((data)=> {			// Get related places
			var i,n,tot=0;
			if (data.facets.asset_counts.buckets && data.facets.asset_counts.buckets.length){	// If valid data
				let d=data.facets.asset_counts.buckets;											// Point at bucket array
				for (i=0;i<d.length;++i) {														// For each bucket
					n=d[i].count;																// Get count													
					tot+=n;																		// Add to total
					if (n > 1000)	n=Math.floor(n/1000)+"K";									// Shorten
					$("#sui-rln-"+d[i].val).html(n);											// Set number
					}
				if (tot > 1000)	tot=Math.floor(tot/1000)+"K";									// Shorten
				$("#sui-rln-all").html(tot);													// Set number
				}
			});

		var k=o.asset_type;																		// Get this asset type																	
		var str=`<div class='sui-related' style='border-color:${sui.ss.mode == "related" ? sui.assets[k].c : "transparent"}'>`;														
		if (sui.ss.mode != "related")	str+="RELATED RESOURCES<hr style='margin-right:12px'>";
		str+="<div class='sui-relatedList'>";
		if (sui.ss.mode == "related")
			str+="<div class='sui-relatedItem' id='sui-rl-Home'><span style='font-size:18px; vertical-align:-3px; color:"+sui.assets[k].c+"'>"+sui.assets[k].g+" </span> <b style='color:"+sui.assets[k].c+"'>Home</b></div>";
		for (k in sui.assets) {																	// For each asset type														
			str+="<div class='sui-relatedItem' id='sui-rl-"+k+"'><span style='font-size:18px; vertical-align:-3px; color:"+sui.assets[k].c+"'>"+sui.assets[k].g+"</span> ";
			str+=k+" (<span id='sui-rln-"+k.toLowerCase()+"'>0</span>)</div>";
			}
		str+="</div></div>";	
		$("#sui-results").append(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div
		$("#sui-rl-"+this.relatedType).css({ "background-color":"#f7f7f7"});					// Hilite current

		$("[id^=sui-rl-]").on("click", (e)=> {													// ON CLICK ON ASSET 
			this.relatedType=e.currentTarget.id.substring(7);								// Get asset type		
			if (this.relatedType == "Home")	{												// Home asset
				if (sui.ss.mode == "related")	sui.ss.mode=this.lastMode;						// Get out of related
				this.baseMap=null;																// No base and set to home
				this.Draw(this.relatedBase);													// Show
				}
			else{
				sui.ss.mode="related";															// Go to related mode
				if (!this.relatedBase)	 this.relatedBase=o;									// If starting fresh
				str=sui.assets[k].g+"&nbsp;&nbsp;Resources related to <i>"+this.relatedBase.title[0]+"</i>"; 	// New header
				$("#sui-headLeft").html(str);													// Add to div
				this.relatedId=this.relatedBase.asset_type+"-"+this.relatedBase.id;				// Set id
				sui.Query();																	// Query and show results
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
		$("#plc-closeBut").on("click", ()=> { this.relatedBase=null; sui.Draw(this.lastMode); sui.Query()});	// Close handler, release related base
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

	ShowCollection(id)
	{
		// GET REAL DATA
//		this.DrawHeader(o)																		// Draw header
//		sui.DrawResults();
//		this.DrawHFooter(o)																		// Draw footer
		let str="Collection "+id;
		$("#sui-headLeft").html(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div
	}
	
	ShowPopover(id, event)																	// ADD KMAP DROP DOWN
	{
		var i;
		if (id && id.match(/collections-/))	return;												// No maps for collections yet
		$("#sui-popover").remove();																// Remove old one
		var pos=$(event.target).position();														// Get position of icon
		let x=Math.max(12,Math.min(pos.left,$("body").width()-162));							// Cap sides
		let str=`<div id='sui-popover' class='sui-popover' 
		style='top:${pos.top+24+$(this.div).scrollTop()}px;left:${x-150}px'>
		<div style='width:0;height:0;border-left:10px solid transparent;
		border-right:10px solid transparent;border-bottom:10px solid #999;
		margin-left:calc(50% - 12px); margin-top:-22px; margin-bottom:12px'</div>
		<div style='width:0;height:0;border-left:8px solid transparent;
		border-right:8px solid transparent;border-bottom:10px solid #fff;
		margin-left:calc(50% - 8px)'</div>
		</div>`;
		$(this.div).append(str.replace(/\t|\n|\r/g,""));										// Remove format and add to div

		var url=sui.solrUtil.createKmapQuery(id);												// Get query url
		$.ajax( { url: url,  dataType: 'jsonp', jsonp: 'json.wrf' }).done((data)=> {			// Get related places
			let i,n,str="";
			if (data.facets.asset_counts.buckets && data.facets.asset_counts.buckets.length){	// If valid data
				let d=data.facets.asset_counts.buckets;											// Point at bucket array
				for (i=0;i<d.length;++i) {														// For each bucket
					n=d[i].count;																// Get count													
					if (n > 1000)	n=Math.floor(n/1000)+"K";									// Shorten
					var f=d[i].val.charAt(0).toUpperCase()+d[i].val.slice(1);					// Match assets list
					if (f == "Audio-video") f="Audio-Video";									// Handle AV
					str+=`<p class='sui-popItem' id='sui-pop-${id}-${f}' style='cursor:pointer'>
					<span style='color:${sui.assets[f].c}'>${sui.assets[f].g}</span>
					&nbsp;&nbsp;Related ${f} (${n})</p>`;
					$("#sui-rln-"+d[i].val).html(n);											// Set number
					}
				$("#sui-popbot").append(str.replace(/\t|\n|\r/g,""));							// Remove format and add to div
				
				$("[id^=sui-pop-]").on("click",(e)=> {											// ON ITEM CLICK
					let v=e.currentTarget.id.toLowerCase().split("-");							// Get id
					sui.ss.mode="related";														// Related mode
					this.relatedBase=this.curKmap;												// Set base
					this.relatedId=v[2]+"-"+v[3];												// Related id
					this.relatedType=(v[4] == "audio") ? "audio-video" : v[4];					// Set type
					str=sui.assets[this.curKmap.asset_type].g+"&nbsp;&nbsp;Resources related to <i>"+this.relatedBase.title[0]+"</i>"; 	// New header
					$("#sui-headLeft").html(str);												// Add to div
					sui.Query();																// Query and show results
					sui.DrawItems();															// Draw items																
					sui.DrawFooter();															// Draw footer															
					sui.ss.page=0;																// Start at beginning
					});
				}
			});

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
				<div id='sui-popbot' style='width:100%;padding:1px 12px;background-color:#333;font-size:14px;
				border-radius:0 0 6px 6px;color:#ddd;margin:-12px;cursor:pointer'>
				<p class='sui-popItem' id='sui-full-${o.uid}'>&#xe629&nbsp;&nbsp;FULL ENTRY</p>
				</div>`;
			$("#sui-popover").append(str.replace(/\t|\n|\r/g,""));								// Remove format and add to div

			$("#sui-full-"+id).on("click",(e)=> {												// ON FULL ENTRY CLICK
				var id=e.currentTarget.id.substring(9).toLowerCase();							// Get id
				sui.ss.mode="related";															// Related mode
				this.relatedBase=this.curKmap;													// Set base
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
	
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SUBJECTS / TERMS PAGES
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
				str+=o.data_phoneme_ss[i]+this.AddPop(o.related_uid_ss[i]);					// Add name and drop
				if (i < o.data_phoneme_ss.length-1)	str+=", ";									// Add separator
				}
			str+="</p>"; } catch(e){}
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

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// HELPERS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
		else str+=(value && (!value.match(/undefined/))) ? value : def;							// Add def if bad value or show value
		return str+"</span></p>";																// Return item
	}

	FormatDate(date)																		// FRIENDLY FORMAT OF DATE
	{
		let m=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];		// Array of mos
		let d=new Date(date);																	// Parse date
		if (d)	date=d.getDate()+" "+m[d.getMonth()]+ " "+d.getFullYear();						// Remake it
		return date;
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
		else str+=(value && (!value.match(/undefined/))) ? value : def;							// Add def if bad value or show value
		return str+"</span></p>";																// Return item
	}

	FormatDate(date)																		// FRIENDLY FORMAT OF DATE
	{
		let m=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];		// Array of mos
		let d=new Date(date);																	// Parse date
		if (d)	date=d.getDate()+" "+m[d.getMonth()]+ " "+d.getFullYear();						// Remake it
		return date;
	}		

	AddPop(id)																				// ADD KMAP POPOVER
	{
		return "&nbsp;<img src='popover.png' onmouseenter='sui.pages.ShowPopover(\""+id+"\",event)'>";	// Add image call to show popover
	}
	
} // Pages class closure
