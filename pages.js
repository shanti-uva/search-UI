/* MANDALA PAGE DISPLAY

	Requires: 	jQuery 												// Almost any version should work
	Calls:		seachui.js											// Other JS modules that are dynamically loaded (not ued in plain search)
	CSS:		searchui.css										// All styles are prefixed with 'sui-'
				https://texts-dev.shanti.virginia.edu/sites/all/themes/shanti_sarvaka_texts/css/shanti_texts.css				
	JS:			ECMA-6												// Uses lambda (arrow) functions
	Globals:	sui													// Declared globally
*/

class Pages  {																					

	constructor()   																		// CONSTRUCTOR
	{
	}

	Draw(kmap)																				// DRAW KMAP PAGE
	{
		this.DrawHeader(kmap);																	// Draw header
		if (kmap.asset_type == "Places")			sui.places.Draw(kmap);						// Show place
		else if (kmap.asset_type == "Sources") 		this.DrawSource(kmap);						// Source
		else if (kmap.asset_type == "Terms") 		this.DrawTerm(kmap);						// Term
		else if (kmap.asset_type == "Subjects") 	this.DrawSubject(kmap);						// Subject
		else if (kmap.asset_type == "Images") 		this.DrawImage(kmap);						// Image
		else if (kmap.asset_type == "Audio-Video") 	this.DrawAV(kmap);							// AV
		else if (kmap.asset_type == "Texts") 		this.DrawText(kmap);						// Text
		else if (kmap.asset_type == "Visuals") 		this.DrawVisual(kmap);						// Visual
	}

	DrawHeader(o)																			// DRAW HEADER
	{
		var i;
		var str=`${sui.assets[o.asset_type].g}&nbsp;&nbsp`;
		str+=(o.asset_type == "Places") ? o.title[0].toUpperCase() : o.title[0];				// Add title
		if (o.ancestors_txt && o.ancestors_txt.length > 1) {									// If has an ancestors trail
			str+="<div class='sui-breadCrumbs'>";												// Holds bread crumbs
			for (i=0;i<o.ancestors_txt.length-1;++i) {											// For each trail member
				str+=`<span class='sui-crumb' id='sui-crumb-${o.asset_type}-${o.ancestor_ids_is[i+1]}'>				
				${o.ancestors_txt[i]}</span>`;											
				if (i < o.ancestors_txt.length-2)	str+=" > ";									// Add separator
				}
			}
		$("#sui-headLeft").html(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div
		$("#sui-headRight").html("<span id='plc-closeBut' class='sui-resClose'>&#xe60f</span>");
		$("#sui-footer").html(`<div style='float:right;font-size:14px;margin-right:16px'>${o.asset_type.toUpperCase()} ID: ${o.id}</div>`);	// Set footer
		$("#sui-header").css("background-color",sui.assets[o.asset_type].c);					// Color header
		$("#sui-footer").css("background-color",sui.assets[o.asset_type].c);					// Color footer
		$("#plc-closeBut").on("click", ()=> { sui.Draw(); });									// Close handler
	
		$("[id^=sui-crumb-]").on("click",(e)=> {												// ON BREAD CRUMB CLICK
			var id=e.currentTarget.id.substring(10).toLowerCase();								// Get id
			sui.GetKmapFromID(id,(kmap)=>{ sui.SendMessage("",kmap); });						// Get kmap and show page
			});
	}

	DrawItem(icon, label, value, def, style)												// DRAW ITEM
	{
		var s="<p>";
		if (icon)	s+=icon+"&nbsp;&nbsp;";														// Add icon
		if (label)	s+="<span class='sui-pageLab'>"+label+":&nbsp;&nbsp;</span>";				// Add label
		s+="<span class='";																		// Add value span
		s+=(style ? style : "sui-pageVal")+"'>";												// Default, or special style
		s+=value ? value : def;																	// Add def if bad value or show value
		return s+"</span></p>";																	// Return item
	}


	DrawAV(o)
	{
		trace(o)
		let partnerId="381832";
		let playerId='kplay';
		let uiConfId="31832371";
		let entryId="1_2d82cvg5";
		let w=$("#sui-results").width()*0.66;
		$("#sui-results").html("");																// Clear screen
		if (typeof kWidget != "undefined") 	kWidget.destroy(playerId);							// If Kaltura player already initted yet, kill it
		sui.LoadingIcon(true,64);																// Show loading icon
		sui.GetJSONFromKmap(o, (d)=> {															// Get details from JSON
			if (d.field_video.und)		entryId=d.field_video.und[0].entryid;					// If id is in uns
			else if (d.field_video.en)	entryId=d.field_video.en[0].entryid;					// In ens
			var str=`<div style='display:inline-block;width:${w}px'>
				<div class='sui-vPlayer' style='width:100%;height:${w*0.5625}px' id='kplay'>
				<img src="https://cfvod.kaltura.com/p/${partnerId}/sp/${partnerId}00/thumbnail/entry_id/${entryId}/version/100301/width/560/height/0" fill-height"></div>`;
				str+=`<br><br>
					<div style='display:inline-block;width:250px;margin-left:16px'>
						<div title='Duration'>&#xe61c&nbsp;&nbsp;&nbsp;${o.duration_s}</div>`
						try{ str+="<div title='Published'>&#xe60c&nbsp;&nbsp;&nbsp;Published "+d.field_year_published.en[0].value+"</div>"; } catch(e) {}
					str+=`</div>
					<div style='display:inline-block;vertical-align:top;width:${w-270}px'>`;
						try{ str+="<div title='Creators'>&#xe600&nbsp;&nbsp;&nbsp;"+o.creator.join(", ")+"</div>";  } catch(e) {}
						try{ if (o.collection_title)str+="<div title='Collection'>&#xe633&nbsp;&nbsp;&nbsp;"+o.collection_title+"</div>"; } catch(e) {}
				str+=`</div>
				<br><br>
				<div style='display:inline-block;width:100%'>
					<div class='sui-avTop'>
						<div class='sui-textTab' id='sui-textTab0'>
							<div style='display:inline-block;padding-top:10px'>DETAILS</div></div>
						<div class='sui-textTab' id='sui-textTab1' style='border-left:1px solid #ccc; border-right:1px solid #ccc'>
							<div style='display:inline-block;padding-top:10px'>PEOPLE</div></div>
						<div class='sui-textTab' id='sui-textTab2'>
							<div style='display:inline-block;padding-top:10px'>TECHNICAL</div></div>
					</div>
				</div>
				<div class='sui-textSide' id='sui-textSide'></div>
			</div>
			<div id=sui-trans' style='display:inline-block;width:calc(34% - 20px);margin-left:12px;vertical-align:top'>Transcript goes here</div>`;
			$("#sui-results").html(str.replace(/\t|\n|\r/g,""));								// Add player and details

/*			var url=o.url_ajax.replace(/node_ajax/i,"node_embed")+"?callback=pfunc";			// Make url
			url="//audio-video-dev.shanti.virginia.edu/services/node/ajax/18566?callback=pfunc";			// Make url
			$.ajax( { url:url, dataType:'jsonp'}).done((data)=> {
					trace(data)
				});																
*/
			str=`http://cdnapi.kaltura.com/p/${partnerId}/sp/${partnerId}00/embedIframeJs/uiconf_id/${uiConfId}/partner_id/${partnerId}`;
			$.ajax(	{ url:str, dataType:"script" }).done((e)=> { 
				kWidget.embed({
					targetId:playerId,  wid:"_"+partnerId,				uiconf_id:uiConfId,    
					entry_id:entryId,	flashvars:{ autoPlay:false},	params:{ "wmode": "transparent"} });
					});
				trace(d)
				sui.LoadingIcon(false);															// Hide loading icon
				if (typeof kWidget != "undefined") kWidget.embed({ entry_id:entryId });			// If Kaltura player already inittted yet
	
				var content=["","",""];
				str="";
				try{ if (o.collection_title) str+="<p title='Collection'><b>COLLECTION</b>:&nbsp;&nbsp;"+o.collection_title+"</p>"; } catch(e) {}
				try{ str+="<p><b>SUBCOLLECTION</b>:&nbsp;&nbsp;"+d.field_subcollection_new.und[0].header+"</p>"; } catch(e) {}
				try{ str+="<p><b>SUBJECT</b>:&nbsp;&nbsp;"+d.field_subject.und[0].header+"</p>"; } catch(e) {}
				try{ str+="<p><b>RECORDING LOCATION</b>:&nbsp;&nbsp;"+d.field_location.und[0].header+"</p>"; } catch(e) {}
				try{ str+="<p'><b>LANGUAGE</b>:&nbsp;&nbsp;"+d.field_language_kmap.und[0].header+"</p>"; } catch(e) {}
				try{ str+="<p><b>TERMS</b>:&nbsp;&nbsp;"+d.field_terms.und[0].header+"</p>"; } catch(e) {}
				try{ str+="<p><b>COPYRIGHT OWNER</b>:&nbsp;&nbsp;"+d.field_copyright_owner.en[0].value+"</p>"; } catch(e) {}
				try{ str+="<p><b>UPLOADED</b>:&nbsp;&nbsp;"+o.timestamp.substr(0,10)+" by "+o.node_user_full_s+"</p>"; } catch(e) {}
				content[0]=str;
				showTab(0);
			
				$("[id^=sui-textTab]").on("click", (e)=> {											// ON TAB CLICK
					var id=e.currentTarget.id.substring(11);										// Get index of tab	
						showTab(id);																// Draw it
					});
		
				function showTab(which) {
					$("[id^=sui-textTab]").css({"border-bottom":"1px solid #ccc","background-color":"#f8f8f8" });
					$("#sui-textTab"+which).css({"border-bottom":"","background-color":"#fff"});
					$("#sui-textSide").html(content[which]);										// Set content
				}
			});
	}
		
	DrawText(o)																				// DRAW TEXTS PAGE FROM KMAP
	{
		var content=["","",""];
		var str="<div class='sui-texts'>";
		if (!$(".shanti-texts-section-content").length)											// No CSS yet
			$("<link/>", { rel:"stylesheet", type:"text/css", href:"https://texts-dev.shanti.virginia.edu/sites/all/themes/shanti_sarvaka_texts/css/shanti_texts.css" }).appendTo("head"); 	// Load CSS
		var url=o.url_ajax.replace(/node_ajax/i,"node_embed")+"?callback=pfunc";				// Make url
		$("#sui-results").html("");																// Clear page	
		sui.LoadingIcon(true,64);																// Show loading icon

		$.ajax( { url:url, dataType:'jsonp'}).done((data)=> {
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
			$("#sui-results").html(str.replace(/\t|\n|\r/g,""));								// Remove format and add to div	
			content[0]=$("#shanti-texts-toc").html();											// Save toc
			$("#shanti-texts-sidebar").remove();												// Remove original sidebar
			showTab(0);
	
			let s=`<p><b>ALTERNATIVE FORMATS</b></p>
			<p>&nbsp;&nbsp;&nbsp;&nbsp;<a target='_blank' href='https://texts.shanti.virginia.edu/book_pubreader/${o.id}'>&#xe678&nbsp;&nbsp;View in PubReader</a></p>
			<p>&nbsp;&nbsp;&nbsp;&nbsp;<a target='_blank' href='https://texts.shanti.virginia.edu/shanti_texts/voyant/${o.id}'>&#xe678&nbsp;&nbsp;View in Voyant</a></p>
			<p>&nbsp;&nbsp;&nbsp;&nbsp;<a target='_blank' href='https://texts.shanti.virginia.edu/shanti_texts/node_ajax_text/${o.id}'>&#xe678&nbsp;&nbsp;View as raw text</a></p>`;
			content[2]=s.replace(/\t|\n|\r/g,"");												// Set view content
	
			s="<p>&#xe633&nbsp;&nbsp<b>COLLECTION</b>:&nbsp;&nbsp;"+(o.collection_title ? o.collection_title : "None")+"</p>";
			if (o.summary) s+=o.summary+"<hr>";
			if (o.kmapid_strict_ss)
				s+="<p>&#xe634&nbsp;&nbsp<b>SUBJECTS</b>:&nbsp;&nbsp;"+o.kmapid_strict_ss.join(" , ")+"</p>";
			s+="<p>&#xe635&nbsp;&nbsp<b>TERMS</b>:&nbsp;&nbsp;</p>";
			content[1]=s.replace(/\t|\n|\r/g,"");												// Set view content

			$("[id^=sui-textTab]").on("click", (e)=> {											// ON TAB CLICK
				var id=e.currentTarget.id.substring(11);										// Get index of tab	
					showTab(id);																// Draw it
				});
	
			function showTab(which) {
				$("#sui-textSide").html("<div class='sui-sourceText'>"+o.title+"<div><hr>");	// Set title
				$("[id^=sui-textTab]").css({"border-bottom":"1px solid #ccc","background-color":"#f8f8f8" });
				$("#sui-textTab"+which).css({"border-bottom":"","background-color":"#fff"});
				$("#sui-textSide").append(content[which]);										// Set content
			}
		});					

			
	}

	DrawVisual(o)																			// DRAW VISUAL PAGE FROM KMAP
	{
		sui.GetJSONFromKmap(o, (d)=> { drawDetails(d); });
		var url="//visuals.shanti.virginia.edu/sites/all/libraries/SHIVA/go.htm?m=//visuals.shanti.virginia.edu/data/json/";
		url+=o.id;
		var d=this.DrawItem;																	// Point at item drawer
	
		function drawDetails(j) {	
			var shivaNode=$.parseJSON(j.shivanode_json.und[0].value)
			var wid=shivaNode.width ? shivaNode.width+"px" : "100%";							// If width set use it 
			var hgt=shivaNode.height ? shivaNode.height+"px" : "calc(100% - 155px)";			// Height 
			var src=shivaNode.dataSourceUrl ? shivaNode.dataSourceUrl : "";						// Data source
			var str=`<iframe id='sui-iframe' frameborder='0' scrolling='no' src='${url}' 
			style='margin-left:auto;margin-right:auto;height:${hgt};width:${wid};display:block;overflow:hidden'></iframe><br>`;	
	
			str+="<div class='sui-sources' style='padding-top:0'>";
			str+="<div style='text-align:center'>"+d("&#xe633","MANDALA COLLECTIONCOLLECTION",o.collection_title,"None")+"</div>";
			str+="<hr style='border-top: 1px solid #6e9456;margin-top:12px'>";
			try{ str+=d("&#xe63b","TITLE",o.title[0],"Untitled"); } catch(e){}
			try{ str+=d("&#xe62a","TYPE",o.asset_subtype.replace(/:/g," | ")) } catch(e){}
			try{ str+="&#xe600&nbsp;&nbsp;<b>CREATOR</b>:&nbsp;&nbsp;";
				str+=(o.node_user_full) ? o.node_user_full+"&nbsp;&nbsp" : "";
				str+=(o.node_user) ? o.node_user : ""; }	catch(e){}
			try{ str+=d("&#xe60c","DATE",o.node_created.substr(0,10)) } catch(e){}
			if (src) 		str+="<p>&#xe678&nbsp;&nbsp;<a target='_blank' href='"+src+"'>External spreadsheet</a></p>"; 
			if (o.caption)	str+=o.caption;		
			str+="<hr>"+d("&#xe630","LINK",url); 
			str+=d("&#xe630","WORDPRESS",`[iframe src="${url}" width="${wid}" height="${hgt}"]`); 
			str+=d("&#xe630","IFRAME",`&lt;iframe src="${url}" width="${wid}" height="${hgt}"&gt;`); 
			$("#sui-results").html(str.replace(/\t|\n|\r/g,""));								// Remove format and add to div	
			}
	}

	DrawIframe(o)																				// DRAW AV PAGE FROM KMAP
	{
		var str=`<iframe id='sui-iframe' frameborder='0' 
		src='${o.url_html}' style='height:calc(100vh - 155px);width:100%'></iframe>`;	
		$("#sui-results").html(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div	
	}

	DrawTerm(o)																				// DRAW TERM PAGE FROM KMAP
	{
		var latin=(typeof(o.name_latin) == "string" ) ? o.name_latin : o.name_latin.join(", ");
		var str=`<div class='sui-sources'>
		<span style='font-size:24px;color:${sui.assets[o.asset_type].c};vertical-align:-4px'>${sui.assets[o.asset_type].g}</span>
		&nbsp;&nbsp;&nbsp;&nbsp;<span class='sui-sourceText' style='font-size:20px;font-weight:500'>${o.title[0]}</span>
		<hr style='border-top: 1px solid ${sui.assets[o.asset_type].c}'>
		<p>TIBETAN:&nbsp;&nbsp<span class='sui-sourceText'>${o.name_tibt}&nbsp;&nbsp;(Tibetan script, original)</span></p>
		<p>LATIN:&nbsp;&nbsp<span class='sui-sourceText'>${latin}</span></p>
		<p>PHONEME:&nbsp;&nbsp<span class='sui-sourceText'>${o.data_phoneme_ss.join(", ")}</span></p>
		<p><span style='font-size:20px;vertical-align:-4px;color:${sui.assets[o.asset_type].c}'><b>&#xe60a</b></span>&nbsp;&nbsp;&nbsp;
		<select class='sui-termSpeak'><option>AMDO GROUP</option><option>KHAM-HOR GROUP</option></select></p>
		<hr style='border-top: 1px solid ${sui.assets[o.asset_type].c}'>
		<p>OTHER DICTIONARIES:&nbsp;&nbsp;</div>`;
		$("#sui-results").html(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div	
	}

	DrawSubject(o)																			// DRAW SUBJECT PAGE FROM KMAP
	{
		var str=`<div class='sui-sources'>
		<span style='font-size:24px;color:${sui.assets[o.asset_type].c};vertical-align:-4px'>${sui.assets[o.asset_type].g}</span>
		&nbsp;&nbsp;&nbsp;&nbsp;<span class='sui-sourceText' style='font-size:20px;font-weight:500'>${o.title[0]}</span>
		<hr style='border-top: 1px solid ${sui.assets[o.asset_type].c}'>`
		str+="</div>";
		$("#sui-results").html(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div	
	}

	DrawSource(o)																			// DRAW SOURCE PAGE FROM KMAP
	{
		var str=`<div class='sui-sources' id='sui-sources'>
		<span style='font-size:24px;color:${sui.assets[o.asset_type].c};vertical-align:-4px'>${sui.assets[o.asset_type].g}</span>
		&nbsp;&nbsp;<span class='sui-sourceText' style='font-size:20px;font-weight:500'>${o.title[0]}</span>
		<hr style='border-top: 1px solid #aaa'>
		<div id='sui-srcSec' style='font-size:18px;font-weight:400'></div><br>`;
		if (o.creator && o.creator.length) {
			str+=`<span style='color:${sui.assets[o.asset_type].c}'>&#xe600</span>
			&nbsp;&nbsp;${o.creator.join(", ")}<br><br>`;
			}
		if (o.url_thumb && !o.url_thumb.match(/gradient.jpg/)) str+="<img src='"+o.url_thumb+"' style='float:right;width:33%; padding:0 0 12px 12px'>";
		if (o.asset_subtype) str+="<p>FORMAT:&nbsp;&nbsp<span class='sui-sourceText'>"+o.asset_subtype+"</p>";
		str+="<p>PUBLICATION YEAR:&nbsp;&nbsp<span class='sui-sourceText' id='sui-srcYear'></span>";
		str+="<p>PAGES:&nbsp;&nbsp<span class='sui-sourceText' id='sui-srcPages'></span>";
		str+="<p>SOURCE ID:&nbsp;&nbsp<span class='sui-sourceText'>sources-"+o.id+"</span></p>";
		if (o.summary) str+="<p>ABSTRACT:<div class='sui-sourceText'>"+o.summary+"</div></p>";
		str+="</div>";
		$("#sui-results").html(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div	
		
		sui.GetJSONFromKmap(o, (d)=> {															// Get details from JSON
			if (d.biblio_pages) 			$("#sui-srcPages").html(d.biblio_pages);			// Add pages
			if (d.biblio_year) 				$("#sui-srcYear").html(d.biblio_year);				// Year
			if (d.biblio_secondary_title) 	$("#sui-srcSec").html(d.biblio_secondary_title);	// Pub
			if (d.biblio_url) 				$("#sui-sources").append("<p>URL:&nbsp;&nbsp;<a target='_blank' href='"+d.biblio_url+"'>"+d.biblio_url+"</a></p>");	// URL
			});									
	}

	DrawImage(o)																			// DRAW IMAGE PAGE FROM KMAP
	{
		var i,mid;
		var asp=o.url_thumb_height/o.url_thumb_width;
		var w=$("#sui-results").width()/2;
		var h=w*asp;
		for (i=0;i<sui.curResults.length;++i) {	if (o.id == sui.curResults[i].id)	mid=i; }

		var str=`<div class='sui-imagesBox'>
		<div id='sui-imageDiv' style='overflow:hidden;width:50%;height:${h}px;margin-left:auto; margin-right:auto; user-select:none'>
			<img id='sui-thisPic' src='${o.url_thumb.replace(/200,200/,"2000,2000")}' style='width:100%'> 
		</div><br>
		<p>${o.title[0]}<br>
		${o.creator} | ${o.img_width_s} x ${o.img_height_s} px<br>
		<div id='sui-picEnlarge' style='cursor:pointer;margin-top:6px' title='Click to enlarge and pan'>&#xe650</div></p>
		<div class='sui-imageGal'id='sui-imageGal'>`;
				
		for (i=mid-1;i>=0;--i) 
			if (sui.curResults[i].asset_type == "Images")
				str+=`<div class='sui-pageThumb'><img id='sui-pageThumb-${i}' src='${sui.curResults[i].url_thumb}' style='height:100%'></div>`;	
		str+=`<div class='sui-pageThumb' style=' border-color:#fff'><img id='sui-pageThumb-${mid}' src='${o.url_thumb}' style='height:100%'></div>`;	
			for (i=mid+1;i<sui.curResults.length;++i) 
				if (sui.curResults[i].asset_type == "Images")
					str+=`<div class='sui-pageThumb'><img id='sui-pageThumb-${i}' src='${sui.curResults[i].url_thumb}' style='height:100%'></div>`;	
		str+="</div></div><br>";
		
		sui.GetJSONFromKmap(o, (d)=> { drawDetails(d); });										// Load detaill from JSON
		$("#sui-results").html(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div	
		$("#sui-imageGal").scrollLeft($("#sui-pageThumb-"+mid).offset().left-w+25);				// Scroll to center

		var d=this.DrawItem;																	// Point at item drawer
		function drawDetails(j) {	
			str="<div class='sui-sources' style='padding-top:0'>";
			str+="<div style='text-align:center'>"+d("&#xe633","MANDALA COLLECTION",o.collection_title,"None")+"</div>";
			str+="<hr style='border-top: 1px solid #b49c59;margin-top:12px'>";
			str+="<div style='width:calc(49% - 24px);display:inline-block;margin-right:16px;vertical-align:top;height:100%;'>";
				try{ str+=d(sui.assets[o.asset_type].g,"TITLE",o.title[0],"Untitled"); } catch(e){}
				str+="<hr>";
				try{ str+=d("&#xe600","CREATOR",o.creator); } catch(e){}
				try{ str+=d("&#xe62a","TYPE",j.field_image_type.und[0].value); } catch(e){}
				try{ str+=d("&#xe663","SIZE", o.img_width_s+" x "+o.img_height_s+" px"); } catch(e){}
				str+="<hr>";
				try{ str+="<p><b>&#xe67f&nbsp;&nbsp;ONLY DIGITAL</b>:&nbsp;&nbsp;"+(j.field_image_digital.und[0].value ? "Yes" : "No");
					 str+="&nbsp;&nbsp;<b>COLOR</b>:&nbsp;&nbsp;"+(j.field_image_color.und[0].value ? "Yes" : "No")+"</p>"; } catch(e){}
				try{ str+="<p><b>&#xe67f&nbsp;&nbsp;QUALITY</b>:&nbsp;&nbsp;"+j.field_image_quality.und[0].value+"&nbsp;&nbsp;<b>ROTATION</b>:&nbsp;&nbsp;"+j.field_image_rotation.und[0].value+"&deg;</p>"; } catch(e){}
			str+="</div><div style='width:49%;display:inline-block;vertical-align:top;border-left:1px solid #ddd;padding-left:16px'>";
				try{ str+=d("&#xe659","CAPURE DEVICE",j.field_image_capture_device.und[0].value); } catch(e){}
				try{ str+="<p><b>&#xe62B&nbsp;&nbsp;LOCATION</b>:&nbsp;&nbsp;"+j.field_longitude.und[0].value+"&nbsp;&nbsp;&nbsp;";
				  	 str+=j.field_latitude.und[0].value+"</p>"; } catch(e){}
				try{ str+=d("&#xe634","SUBJECT",j.field_keywords.und[0].value); } catch(e){}
				try{ str+=d("&copy;","COPYRIGHT HOLDER",j.field_copyright_holder.und[0].value); } catch(e){}
				try{ str+=d("&#xe614","ORIGINAL&nbsp;FILE",j.field_original_filename.und[0].value); } catch(e){}
				try{ str+=d("&#xe639","UPLOADED&nbsp;BY",o.node_user_full_s); } catch(e){}
				try{ str+=d("&#xe678","LICENSE",j.field_license_url.und[0].value); } catch(e){}
				str+="</div></div>";
			$("#sui-results").append(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div	
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
