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
		this.carouselTimer=null;																// Timer to advance carousel
	}

	Draw(kmap, fromHistory)																	// DRAW KMAP PAGE
	{
		clearInterval(this.carouselTimer);														// Kill carousel timer
		if (!kmap)	return;																		// Quit if no kmap
		if (!fromHistory)	sui.SetState(`p=${kmap.uid}`);										// This is the active page
		this.curKmap=kmap;																		// Set active page's map
		this.DrawHeader(kmap);																	// Draw header
		$("#sui-results").css({ "padding-left":"12px", width:"calc(100% - 24px", display:"none"});	// Reset to normal size and hide
		$(this.div).css({ display:"block",color:"#000"});										// Show page
		if (sui.ss.mode == "related") {															// If browsing related pages
			if (!kmap.asset_type.match(/Places|Subjects|Terms/))								// Need to add space for these types
				$(this.div).css({ "padding-left": "192px", width:"calc(100% - 216px"});			// Shrink page
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
		if ((sui.ss.mode == "related") || (sui.ss.mode == "collections")) o=this.relatedBase;	// If special, use base
		else	this.lastMode=sui.ss.mode;														// Save last search mode
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
		str+="</div><p>BROWSE</p>";
		str+="<div class='sui-tree' id='sui-btree-"+o.asset_type+"'></div>";					// Add browsing tree div
		$(this.div).append(str.replace(/\t|\n|\r/g,""));										// Remove format and add to div
		this.DrawTree("#sui-btree-"+o.asset_type,o.asset_type.toLowerCase());					// Add tree
		$("#sui-rl-"+this.relatedType).css({ "background-color":"#f7f7f7"});					// Hilite current
		$("[id^=sui-rl-]").on("click", (e)=> {													// ON CLICK ON ASSET 
			this.relatedType=e.currentTarget.id.substring(7);									// Get asset type		
			if (this.relatedType == "Home")	{													// Home asset
				if (sui.ss.mode == "related")	sui.ss.mode=this.lastMode;						// Get out of related
				this.baseMap=null;																// No base and set to home
				this.Draw(this.relatedBase);													// Show
				}
			else{																				// Related asset browsing
				sui.ss.mode="related";															// Go to related mode
				if (!this.relatedBase)	 this.relatedBase=o;									// If starting fresh
				str=sui.assets[k].g+"&nbsp;&nbsp;Resources related to <i>"+this.relatedBase.title[0]+"</i>"; 	// New header
				$("#sui-headLeft").html(str);													// Add to div
				this.relatedId=this.relatedBase.asset_type+"-"+this.relatedBase.id;				// Set id
				sui.Query();																	// Query and show results
				sui.DrawFooter();																// Draw footer
				sui.ss.page=0;																	// Start at beginning
				}
			});							
	}

	DrawHeader(o)																			// DRAW HEADER
	{
		var i;
		if (!o) return;																			// Return if not kmap defines
		$("#sui-headRight").html("<span id='plc-closeBut' class='sui-resClose' title='Back to results'>&#xe60f</span>");
		$("#plc-closeBut").on("click", ()=> { 													// ON CLOSE BUT CLICK
			this.relatedBase=null;  															// Release related base
			if (!sui.curResults ||!sui.curResults.length)	sui.Draw("input");					// If no results, put up landing page 
			else { sui.Draw(this.lastMode); sui.Query(); }										// Show last search results
			});
		if ((sui.ss.mode == "related") || (sui.ss.mode == "collections"))	return;				// Not in special modes
		var str=`${sui.assets[o.asset_type].g}&nbsp;&nbsp`;
		str+=o.title[0];																		// Add title
		if (o.ancestors_txt && o.ancestors_txt.length > 1) {									// If has an ancestors trail
			str+="<br><div class='sui-breadCrumbs'>";											// Holds bread crumbs
			for (i=0;i<o.ancestors_txt.length-1;++i) {											// For each trail member
				str+=`<span class='sui-crumb' id='sui-crumb-${o.uid.split("-")[0]}-${o.ancestor_ids_is[i+1]}'>				
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

	ShowCollection(kmapId, collectionId)													// SHOW A COLLECTION OF ASSETS
	{
		sui.ss.mode="collections";																// Collections mode
		sui.GetKmapFromID(kmapId.toLowerCase(), (kmap)=> { this.relatedBase=kmap; });			// Get kmap to return to	
		this.relatedId=collectionId.split("|")[1].toLowerCase();								// Get collections id 
		sui.Query();																			// Query and show results
		sui.DrawItems();																		// Draw items																
		sui.DrawFooter();																		// Draw footer															
		let str="&#xe633&nbsp;&nbsp"+collectionId.split("|")[0];								// Icon and title
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
				str+=o.data_phoneme_ss[i]+this.AddPop(o.related_uid_ss[i]);						// Add name and drop
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
		<hr style='border-top: 1px solid ${sui.assets[o.asset_type].c}'>`;
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
		str+="</table></div>";																	// Fisih table
		$(this.div).html(str.replace(/\t|\n|\r/g,""));											// Remove format and add to div	
		this.DrawRelatedAssets(o);																// Draw related assets men
	}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// HELPERS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	DrawLandingPage()																		// DRAW SITE SPECIFIC LANDING PAGE
	{
		$("#sui-headLeft").html("<div style='margin-top:8px'>Bhutan Cultural Library</div>");	// Set left header
		$("#sui-headRight").html("");															// Clear right header
		$("#sui-footer").html("");																// Clear footer
		$("#sui-footer").css("background-color","#ddd");
		$("#sui-pages").html("");
		$("#sui-pages").css({ "background-image": "url('https://cicada.shanti.virginia.edu/images/mandala/shanti-image-517836/full/!2000,/0/default.jpg')"});
		this.DrawCarousel();
		let str=`<div style='text-align:center;width:66%;max-width:800px;margin:24px auto 12px auto'>
		<div style='color:#4d59ca;font-size:20px;margin-bottom:8px;font-weight:700'>
		BHUTAN: A LIVING ARCHIVE</div>
		<div style='font-size:20px;font-family:"EB Garamond",serif,shanticon; font-weight:400'>
			The Kingdom of Bhutan has vibrant oral and embodied cultures across its mountainous landscape, 
			which are now under pressure from globalization. 
			This project aims to carry out an extensive audio-visual documentation to support local communities.<br><br>
		</div><div style='font-size:13px'>	
			<i>The Bhutan Cultural Library is made possible through the contributions and efforts of local individuals 
			and communities in Bhutan in collaboration with Loden Foundation (formerly Shejun Agency) and the University of Virginia. 
			The team gratefully acknowledges the generous support offered by Arcadia throughout the project.</i>
		</div></div>
		</div></div>`;
		$("#sui-pages").append(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div	
	}

	DrawCarousel(content)																	// DRAW RESOURCE CAROUSEL
	{
		let i,curCon=0;
		content=[
			{ title:"The Shinjé Yapyum Cham is performed", 
			text:"One of the most common sacred masked dances performed during religious festivals in Bhutan is the Shinjé Yapyum Cham. The dance is often performed early during a festival’s program as it is believed to subdue negative spirits and harmful influences. Although known as the Shinjé Yapyum Cham, or the Dance of the Male and Female Lords of Death, it represents the male and female Yamāntaka is the Destroyer of Death...",
		  	pic:"https://cicada.shanti.virginia.edu/images/mandala/shanti-image-550401/full/!600,/0/default.jpg", id:"images-stage_shanti_virginia_edu-1187696"},
			{ title:"A Song Called Ja legmo Tsering", 
			text:"Unlike today, meeting a person was extremely difficult in the past. The lyrics of this song say that meeting someone was considered as an act of fate. People would meet even if they had never thought of meeting that person. The composer wishes for two people who have met through fate, to stay together for their entire life...",
			pic:"https://cfvod.kaltura.com/p/381832/sp/38183200/thumbnail/entry_id/1_xvwn4fvx/version/100021/600/600/height/0", id:"audio-video-stage_shanti_virginia_edu-22741"},
			{ title:"Tongue Twister in the Kheng Language", 
			text:"In the past, parents taught their kids tongue twisters as a way to practice pronunciation. Rinchen Drakpa from Sharigang presents two tongue twisters in his local language, Khengkha. Rinchen Drakpa says that in his childhood he witnessed villagers competing to be the one who could say the tongue twisters with the most perfect pronunciation.",
			pic:"https://cfvod.kaltura.com/p/381832/sp/38183200/thumbnail/entry_id/0_ou7n6lp9/version/100021/600/600/height/0", id:"audio-video-stage_shanti_virginia_edu-3806"},
			{ title:"Seven Limbs of Practice: Chöpa", 
			text:"Most Bhutanese Buddhist rituals contain the set of seven practices known as yoen lak duen pa (ཡན་ལག་བདུན་པ་). The seven practices prostration (ཕྱག་), offering (མཆོད་པ་), confession (བཤགས་པ་), rejoicing (རྗེས་སུ་ཡི་རང་བ་), request to live long (བཞུགས་པར་གསོལ་བ་འདེབས་པ་), request to turn the wheel of Dharma (ཆོས་ཀྱི་འཁོར་ལོ་སྐོསྐོར་བར་བསྐུལ་བ་) and to dedicate the merits (བསྔོ་བ་).This piece was initially published in Bhutan’s national newspaper Kuensel..",
			pic:"https://mms.thlib.org/images/0050/8753/63691_large.jpg", id:"texts-stage_shanti_virginia_edu-38836"},
			{ title:"A Story of a Rich and a Poor Girl", 
			text:"Ap Tempo of Karna Gewog, Dagana narrates a story of a poor girl who is straight forward and faithful. Her rich friend was always insecure. The poor girl gets rewarded by a deity for her kind heart and good attitude; she suddenly becomes rich, and her rich friend became insecure about her. She tries to achieve what the poor girl has achieved, but gets punished due to her jealousy and greediness.",
			pic:"https://cfvod.kaltura.com/p/381832/sp/38183200/thumbnail/entry_id/1_607tfowl/version/100031/600/600/height/0", id:"audio-video-stage_shanti_virginia_edu-24651"},
			{ title:"An Exchange of Tsangmo Poems", 
			text:"Tsangmo is a type of song used to express individual's emotions, conveying their inner warmth and affection to another person, through numerious lyrical tunes. Tsangmo can be sung to express love, hatred and any other feelings. While it is sung, the Tsangmo songs are never sung with dance, as it is a poetry song for a singing expression without a dance. It is usually a composition limited to a verse of four lines for an expression.",
			pic:"https://cfvod.kaltura.com/p/381832/sp/38183200/thumbnail/entry_id/1_zk9hsnff/version/100011/609/600/height/0", id:"audio-video-stage_shanti_virginia_edu-22596"},
			];		
				
		let str=`<div class='sui-caroBox'>
		<div class='sui-caroButL' id='sui-caroButL'>&#xe640</div>
		<div class='sui-caroButR' id='sui-caroButR'>&#xe641</div>
		<div class='sui-caroHeader'>Featured Resources</div>
			<div class='sui-caroLeft'>
				<div class='sui-caroTitle' id='sui-caroTitle'></div>
				<div class='sui-caroText' id='sui-caroText'></div>
			</div>
			<img class='sui-caroPic' id='sui-caroPic' src=''><br>
			<a class='sui-caroRes' id='sui-caroRes')'>
			<i>View Resource</i>&nbsp;&nbsp;&#xe683</a>
			<div class='sui-caroDots'>`;
				for (i=0;i<content.length;++i) 													// For each panel
					str+=`<div class='sui-caroDot' id='sui-caroDot-${i}'></div>`;				// Add dot
		str+="</div></div>";
		$("#sui-pages").append(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div	
		clearInterval(this.carouselTimer);														// Kill timer
		this.carouselTimer=setInterval(()=> { $("#sui-caroButR").trigger("click"); },8000);		// Change panel every 8 secs
		setPanel(curCon);																		// Set 1st pane;
			
		function setPanel(num) {																// SET PANEL CONTENTS															
			$("#sui-caroTitle").html("&#xe633&nbsp;&nbsp;"+content[num].title);					// Set title
			$("#sui-caroText").html(content[num].text);											// Set text
			$("#sui-caroPic").prop("src",content[num].pic);										// Set pic
			$("[id^=sui-caroDot-]").css({"background-color":"#fff"});							// Reset dot
			$("#sui-caroDot-"+num).css({"background-color":"#5d68cc"});							// Highlight current
			}
	
		$("#sui-caroRes").on("click", (e)=>{													// ON SEE RESOURCE CLICK
			sui.GetKmapFromID(content[curCon].id,(kmap)=>{ sui.SendMessage("",kmap); });		// Get kmap and show page
			});

		$("#sui-caroButL").on("click", (e)=>{													// ON BACK CLICK
			curCon=curCon ? curCon-1 : content.length-1;										// Go back or wrap
			setPanel(curCon);																	// Draw panel
			});

		$("#sui-caroButR").on("click", (e)=>{													// ON FORWARD CLICK
			curCon=(curCon == content.length-1) ? 0 : curCon+1;									// Go forward or wrap
			setPanel(curCon);																	// Draw panel
			});
		
		$("[id^=sui-caroDot-]").on("click", (e)=>{												// ON DOT CLICK
			curCon=e.target.id.substring(12);													// Get number
			curCon=Math.min(content.length-1,Math.max(curCon,0));								// Cap
			setPanel(curCon);																	// Draw panel
			});
	}

	DrawItem(icon, label, value, def, style, bold)											// DRAW ITEM
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

	DrawTree(div, facet)  																		// DRAW FACET TREE
	{
		if (facet == "places") 		 	sui.LazyLoad(div,null,facet,13735);						// Embedded top layer for places
		else 							sui.GetTopRow(div,facet);								// Constructed top layers
		
		$('.sui-tree li').each( function() {                                					// For each element
			if ($(this).children('ul').length > 0)                       						// If has children 
				$(this).addClass('parent');                              						// Make parent class
			});
	}

	
} // Pages class closure
