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
		else if (kmap.asset_type == "Audio-Video") 	this.DrawIframe(kmap);						// AV
		else if (kmap.asset_type == "Texts") 		this.DrawIframe(kmap);						// Text
		else if (kmap.asset_type == "Visuals") 		this.DrawVisual(kmap);						// Visual
	}

	DrawHeader(o)																			// DRAW HEADER
	{
		var i,j;
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


	DrawVisual(o)																			// DRAW VISUAL PAGE FROM KMAP
	{
		sui.GetJSONFromKmap(o, (d)=> { drawDetails(d); });
		function drawDetails(j) {	
			trace(j)
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
		var str=`<div class='sui-sources'>
		<span style='font-size:24px;color:${sui.assets[o.asset_type].c};vertical-align:-4px'>${sui.assets[o.asset_type].g}</span>
		&nbsp;&nbsp;<span class='sui-sourceText' style='font-size:20px;font-weight:500'>${o.title[0]}</span>
		<hr style='border-top: 1px solid #aaa'><br>`;
		if (o.creator && o.creator.length) {
			str+=`<span style='color:${sui.assets[o.asset_type].c}'>&#xe600</span>
			&nbsp;&nbsp;${o.creator.join(", ")}<br><br>`;
			}
		if (o.asset_subtype) str+="<p>FORMAT:&nbsp;&nbsp<span class='sui-sourceText'>"+o.asset_subtype+"</p>";
		if (!o.puYear)	o.pubYear="n/a";
		str+="<p>PUBLICATION YEAR:&nbsp;&nbsp<span class='sui-sourceText'>"+o.pubYear+"</span>";
		str+="<p>SOURCE ID:&nbsp;&nbsp<span class='sui-sourceText'>sources-"+o.id+"</span></p>";
		if (o.summary) str+="<p>ABSTRACT:<div class='sui-sourceText'>"+o.summary+"</div></p>";
		str+="</div>";
		$("#sui-results").html(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div	
	}

	DrawImage(o)																			// DRAW IMAGE PAGE FROM KMAP
	{
		var asp=o.url_thumb_height/o.url_thumb_width;
		var h=$("#sui-results").width()/2*asp;
		var str=`<div class='sui-imagesBox'>
		<div id='sui-imageDiv' style='overflow:hidden;width:50%;height:${h}px;margin-left:auto; margin-right:auto; user-select:none'>
			<img id='sui-thisPic' src='${o.url_thumb.replace(/200,200/,"2000,2000")}' style='width:100%'> 
		</div><br>
		<p>${o.title[0]}<br>
		${o.creator} | ${o.img_width_s} x ${o.img_height_s} px</p>
		<p id='sui-picEnlarge' style='cursor:pointer' title='Click to enlarge and pan'>&#xe650</div>`;
		sui.GetJSONFromKmap(o, (d)=> { drawDetails(d); });
		$("#sui-results").html(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div	

		function drawDetails(j) {	
			str=`<div class='sui-sources'>
				<div style='text-align:center'><b>&#xe633&nbsp;&nbsp;MANDALA COLLECTION</b>:&nbsp;&nbsp;${o.collection_title}</div>
				<hr style='border-top: 1px solid #b49c59;margin-top:12px'>
				<div style='width:calc(49% - 24px);border-right:1px solid #eee;display:inline-block;margin-right:24px;vertical-align:top;height:100%'>`;
				str+=`<p><b>${sui.assets[o.asset_type].g}&nbsp;&nbsp;TITLE</b>:&nbsp;&nbsp;${o.title[0]}</p>`;
				str+=`<p><b>&#xe600&nbsp;&nbsp;CREATOR</b>:&nbsp;&nbsp;${o.creator}</p>`;
				str+=`<p><b>&#xe659&nbsp;&nbsp;TYPE</b>:&nbsp;&nbsp;${j.field_image_type.und[0].value}</p>`;
				str+=`<p><b>&#xe663&nbsp;&nbsp;SIZE</b>:&nbsp;&nbsp; ${o.img_width_s} x ${o.img_height_s} px</p>`;
				str+=`<p><b>PHOTOGRAPHER</b>:&nbsp;&nbsp;${o.creator}</p>`;
				str+=`<p><b>ONLY DIGITAL</b>:&nbsp;&nbsp;${j.field_image_digital.und[0].value ? "Yes" : "No"}
				&nbsp;&nbsp;<b>COLOR</b>:&nbsp;&nbsp;${j.field_image_color.und[0].value ? "Yes" : "No"}</p>`;
				str+=`<p><b>QUALITY</b>:&nbsp;&nbsp;${j.field_image_quality.und[0].value}&nbsp;&nbsp;<b>ROTATION</b>:&nbsp;&nbsp;${j.field_image_rotation.und[0].value}&deg;</p>`;
			str+=`</div><div style='width:49%;display:inline-block;vertical-align:top'>`;
				str+=`<p><b>&#xe62B&nbsp;&nbsp;LOCATION</b>:&nbsp;&nbsp;${o.kmapid_strict_ss ? o.kmapid_strict_ss[0] : ""}&nbsp;&nbsp; 
			${(j.field_latitude && j.field_latitude.und) ? "("+j.field_latitude.und[0].value+")" : ""}</p>`;
				if (j.field_keywords && j.field_keywords.und)
					str+=`<p><b>&#xe634&nbsp;&nbsp;SUBJECT</b>:&nbsp;&nbsp;${j.field_keywords.und[0].value}</p>`;
				if (j.field_image_capture_device && j.field_image_capture_device.und)
					str+=`<p><b>&#xe634&nbsp;&nbsp;CAPURE DEVICE</b>:&nbsp;&nbsp;${j.field_image_capture_device.und[0].value}</p>`;
				if (j.field_copyright_holder && j.field_copyright_holder.und)
					str+=`<p><b>&copy;&nbsp;&nbsp;COPYRIGHT HOLDER</b>:&nbsp;&nbsp;${j.field_copyright_holder.und[0].value}</p>`;
				str+=`<p><b>ORIGINAL&nbsp;FILE</b>:&nbsp;&nbsp;${j.field_original_filename.und[0].value}</p>`;
				str+=`<p><b>UPLOADED&nbsp;BY</b>:&nbsp;&nbsp;${o.node_user_full_s}</p>`;
				if (j.field_license_url && j.field_license_url.und)
					str+=`<p><b>LICENSE</b>:&nbsp;&nbsp;${j.field_license_url.und[0].value}</p>`;
			str+=`</div></div>`;
			$("#sui-results").append(str.replace(/\t|\n|\r/g,""));									// Remove format and add to div	
		}

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
