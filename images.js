/* 	IMAGE PAGES ****************************************************************************************************************************

	This module draws the images page based on a kmap from SOLR

	Requires: 	jQuery 												// Almost any version should work
	CSS:		searchui.css										// All styles are prefixed with 'sui-'
	JS:			ECMA-6												// Uses lambda (arrow) functions
	JSON:		From Drupal site
	Globals:	looks for sui and sui.pages
	Dependents:	pages.js, searchui.js								// JS modules called

**********************************************************************************************************************************************/

class Images  {																					

	constructor()   																		// CONSTRUCTOR
	{
		this.div=sui.pages.div;																	// Div to hold page (same as Pages class)
	}

	Draw(o)																					// DRAW IMAGE PAGE FROM KMAP
	{
		var i,mid;
		var asp=o.url_thumb_height/o.url_thumb_width;
		var w=$(this.div).width()/2;
		var h=w*asp;
		for (i=0;i<sui.curResults.length;++i) {	if (o.id == sui.curResults[i].id)	mid=i; }

		var str=`<div class='sui-imagesBox' style='margin:${(sui.ss.mode == "related") ? "-12px 0 0 0" : "-12px -12px 0 -12px"}'>
		<div id='sui-picEnlarge' style='cursor:pointer;font-size:16px' title='Click to enlarge and pan'>&#xe650</div></p>
		<div id='sui-imageDiv' style='overflow:hidden;width:50%;height:${h}px;margin-left:auto; margin-right:auto; user-select:none'>
			<img id='sui-thisPic' src='${o.url_thumb.replace(/200,200/,"2000,2000")}' style='width:100%'> 
		</div><br>
		<div><span style='font-size:14px;vertical-align:-2px;color:#ccc'>&#xe62a</span>&nbsp;&nbsp;${o.title[0]}</div>
		<div style='color:#ccc;margin-bottom:24px'>${o.creator}&nbsp;&nbsp;|&nbsp;&nbsp;${o.img_width_s} x ${o.img_height_s} px</div>
		<div class='sui-imageGal'id='sui-imageGal'>`;
		for (i=0;i<mid;++i) 																	// For each image up mid point
			if (sui.curResults[i].asset_type == "images")
				str+=`<div class='sui-pageThumb'><img id='sui-pageThumb-${i}' src='${sui.curResults[i].url_thumb}' style='height:100%'></div>`;	
		str+=`<div class='sui-pageThumb' style=' border-color:#fff'><img id='sui-pageThumb-${mid}' src='${o.url_thumb}' style='height:100%'></div>`;	
		for (i=mid+1;i<sui.curResults.length;++i) 												// For each after mid point
			if (sui.curResults[i].asset_type == "images")
				str+=`<div class='sui-pageThumb'><img id='sui-pageThumb-${i}' src='${sui.curResults[i].url_thumb}' style='height:100%'></div>`;	
		str+="</div></div>";
		
		sui.GetJSONFromKmap(o, (d)=> { drawDetails(d); });										// Load detaill from JSON
		$(this.div).html(str.replace(/\t|\n|\r/g,""));											// Remove format and add to div	
		sui.pages.DrawRelatedAssets();															// Draw related assets menu if active
		$("#sui-imageGal").scrollLeft($("#sui-pageThumb-"+mid).offset().left-w+25);				// Scroll to center

		var places=[],subjects=[];
		try{
			for (i=0;i<o.kmapid_strict.length;++i) {
				if (o.kmapid_strict[i].match(/places/))		places.push(o.kmapid_strict_ss[i]+sui.pages.AddPop(o.kmapid_strict[i]));
				if (o.kmapid_strict[i].match(/subjects/))	subjects.push(o.kmapid_strict_ss[i]+sui.pages.AddPop(o.kmapid_strict[i]));
				}
		} catch(e) {}
	
		str=`<table class='sui-imageMid'>
			<tr class='sui-pageLab' style='font-size:16px;padding-bottom:4px'><td style='width:50%'>MANDALA COLLECTIONS</td><td>CLASSIFICATION</td></tr>
			<tr class='sui-pageLab' style='padding-bottom:8px'><td>&#xe633&nbsp;&nbsp;`;
			if (o.collection_title)	str+=`<a onclick='javascript: sui.pages.ShowCollection(\"${o.asset_type}-${o.id}\",\"${o.collection_idfacet}\")'>${o.collection_title}</a>${sui.pages.AddPop("collections-"+o.collection_nid)}</td><td>`;
			else					str+="None</td><td>";	
			if (subjects.length) {																// If subjects	
				str+="<span style='color:#cc4c39'>&#xe634</span>&nbsp;&nbsp";					// Add icon
				for (i=0;i<subjects.length;++i) str+=subjects[i]+", ";							// Add item
				str=str.slice(0,-2)+"<br>";														// Remove last comma
				}	
			if (places.length) {																// If places	
				str+="<span style='color:#cc4c39'>&#xe62b</span>&nbsp;&nbsp";					// Add icon
				for (i=0;i<places.length;++i) str+=places[i]+", ";								// Add item
				str=str.slice(0,-2)+"<br>";														// Remove last comma
			}	
			str+="</td></tr></table>";

		var d=sui.pages.DrawItem;																	// Point at item drawer
		function drawDetails(j) {	
			str+="<div class='sui-images'>";
			str+="<div style='width:calc(49% - 24px);display:inline-block;margin-right:16px;vertical-align:top;height:100%;'>";
				try{ str+=d(sui.assets[o.asset_type].g,"CAPTION",o.caption,"Untitled"); } catch(e){}
				str+="<hr>";
				try{ str+=d("&#xe600","CREATOR",o.creator) } catch(e){}
				try{ str+=d("&#xe66d","TYPE",j.field_image_type.und[0].value.charAt(0).toUpperCase()+j.field_image_type.und[0].value.slice(1)); } catch(e){}
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
				$(sui.pages.div).append(str.replace(/\t|\n|\r/g,""));								// Remove format and add to div	
		}
	
		$("[id^=sui-pageThumb-]").on("click",(e)=> {												// ON THUMBNAIL CLICK
			var id=e.currentTarget.id.split("-")[2];												// Get id
			this.Draw(sui.curResults[id]);															// Show image
			});

		$("#sui-picEnlarge").on("click",()=> {														// ON RESIZE PIC
			var sx,sy,px,py;
			var pic=$("#sui-results")[0];															// Point at image
			$("#sui-imageDiv").css("width","100%");													// Go full screen
			if ($("#sui-picEnlarge").html().match(/Zoom/)) {										// If zoomed already
				$("#sui-picEnlarge").html("&#xe650");												// Restore icon
				$("#sui-thisPic").css("width","100%");												// Fit in window
				$("#sui-thisPic").offset($("#sui-imageDiv").offset());								// Restore offset
				$("#sui-imageDiv").css("width","50%");												// Back to half screen
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

} // Images class closure
