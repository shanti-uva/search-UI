/* AUDIOVIDEO

	Requires: 	jQuery 												// Almost any version should work
	Kaltura 	https://cfvod.kaltura.com,	//cdnapi.kaltura.com,	// Kaltura API
*/

class AudioVideo  {																					

	constructor()   																		// CONSTRUCTOR
	{
		this.div="#sui-results";																// Div to hold page
		this.inPlay=false;																		// If AV is in play
		this.curTransSeg=-1;																	// Currently active transceipt segment
		this.transRes=null;																		// Holds transcript resources	
	}

	Draw(o)																					// DRAW AUDIO/VIDEO PAGE
	{
		var partnerId="381832";																	// Kaltura partner id
		var uiConfId="31832371";																// Kaltura confidential code
		var entryId="";																			// Media id
		this.inPlay=false;																		// Not playying yet
		let w=$(this.div).width();																// Widtg of area
		$(this.div).html("");																	// Clear screen
		if (typeof kWidget != "undefined") 	kWidget.destroy("sui-kplayer");						// If Kaltura player already initted yet, kill it
		
		sui.LoadingIcon(true,64);																// Show loading icon
		sui.GetJSONFromKmap(o, (d)=> {															// Get details from JSON
			var str=`<div id='sui-viewerSide' style='display:inline-block;width:${w}px'>`;		// Left side
			if (d.field_video) {																// If a video field spec'd
				if (d.field_video.und)			entryId=d.field_video.und[0].entryid;			// If id is in uns
				else if (d.field_video.en)		entryId=d.field_video.en[0].entryid;			// In ens
				str+=`<div class='sui-vPlayer' style='width:100%;height:${w*0.5625}px' id='sui-kplayer'>
				<img src="https://cfvod.kaltura.com/p/${partnerId}/sp/${partnerId}00/thumbnail/entry_id/${entryId}/version/100301/width/560/height/0" fill-height"></div>`;
				}
			else str+="<img style='width:100%' src='"+o.url_thumb+"'>";
			str+=`<br><br><div style='display:inline-block;width:250px;margin-left:16px'>
			<div title='Duration'>&#xe61c&nbsp;&nbsp;&nbsp;${o.duration_s}</div>`
			try{ str+="<div title='Published'>&#xe60c&nbsp;&nbsp;&nbsp;Published "+d.field_year_published.en[0].value+"</div>"; } catch(e) {}
			str+=`</div>
			<div style='display:inline-block;vertical-align:top;width:calc(100% - 270}px'>`;
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
			</div>`;
			$(this.div).html(str.replace(/\t|\n|\r/g,""));										// Add player and details
			this.DrawTranscript(o,"#sui-trans");												// Draw transcript in div
	
			str=`//cdnapi.kaltura.com/p/${partnerId}/sp/${partnerId}00/embedIframeJs/uiconf_id/${uiConfId}/partner_id/${partnerId}`;
			$.ajax(	{ url:str, dataType:"script" }).done((e)=> { 
				kWidget.embed({
					targetId:"sui-kplayer",  wid:"_"+partnerId,				uiconf_id:uiConfId,    
					entry_id:entryId,		flashvars:{ autoPlay:false},	params:{ "wmode": "transparent"} 
					});
				kWidget.addReadyCallback(()=> {													// When ready, add icon callback
					var kdp=document.getElementById("sui-kplayer");								// Get div
					kdp.kBind("doPlay.test", ()=> {	$("#sui-transTab1").html("&#xe681"); this.inPlay=true; /*this.PlayAV();*/ });	// Pause icon
					kdp.kBind("doPause.test",()=> { $("#sui-transTab1").html("&#xe641"); this.inPlay=false; clearInterval(this.transTimer); });	// Play
					});
				});
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
				sui.pages.DrawRelatedAssets(o);														// Draw related assets menu if active
				
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

// TRANSCRIPT //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	DrawTranscript(kmap, div)																// DRAW TRANSCRIPT FROM SOLR 
	{
		var i,o,seg;
		var l={};																				// Holds filed:language pairs
		if (!kmap.trid_i)	return;																// Quit if no transcript
		this.curTransSeg=-1;																	// Start at top

		l.ts_content_rus="Russian";		l.content_bod="Tibetan";		l.dzo_bod="Dzongkha";				l.ts_content_sgt="Brokpake";	
		l.ts_content_kjz="Bumthangkha";	l.ts_content_tgf="Chalikha";	l.ts_content_cgk="Chocangacakha";	l.ts_content_dka="Dakpakha";	
		l.ts_content_dzl="Dzalakha";	l.ts_content_goe="Gongduk";		l.ts_content_xkz="Kurtop";			l.ts_content_kru="Kuruz";		
		l.ts_content_lkh="Lakha";		l.ts_content_lya="Layakha";		l.ts_content_lep="Lepcha";			l.ts_content_lhp="Lhokpu";		
		l.ts_content_luk="Lunanakha";	l.ts_content_npb="Nupbikha";	l.ts_content_neh="Mangdekha";		l.ts_content_ole="Olekha";		
		l.ts_content_tsj="Tshangla";	l.ts_content_xkf="Khengkha";	l.ts_content_wylie="Wylie";			l.ts_content_gyal="Gyalsumdo";
		l.ts_content_gvr="Gurung";		l.ts_content_npa="Nar Phu";		l.ts_content_nmm="Manange";			l.ts_content_kte="Nubri";	
		l.ts_content_tsum="Tsum";		l.ts_content_nep="Nepali";		l.ts_content_eng="English";			l.ts_content_zho="Chinese"; 
		l.ts_content_und="Unknown";		l.ts_content_gloss="Morpheme glossing";
		
		var res={ languages:{}, speakers:{}, segs:[], layout:"Minimal" };						// Final data								
		var url="https://ss251856-us-east-1-aws.measuredsearch.com/solr/av_dev/select?indent=on&q=is_trid:"+kmap.trid_i+"&wt=json&start=0&rows=1000";
		$.ajax( { url:url, dataType:'jsonp', jsonp:'json.wrf' }).done((data)=> {				// Get transcript data
			data.response.docs.sort(function(a,b) { return (a.fts_start > b.fts_start) ? 1 : -1; }); // Sort
			for (i=0;i<data.response.docs.length;++i) {											// For each seg in doc
				o=data.response.docs[i];														// Point at it
				seg={ start: o.fts_start, end: o.fts_end, dur:o.fts_duration };					// Make seg with timings
				if (o.ss_speaker_bod) { res.speakers[o.ss_speaker_bod]=1; seg.speaker=o.ss_speaker_bod; }	// Set speaker?
				seg.lang=o.ss_language ? o.ss_language : "";									// Set seg language
					for (var lang in l) {														// For each seg
						if (o[lang]) {															// If a language match	
							seg[l[lang]]=o[lang];												// Add to transcript under language
							res.languages[l[lang]]=1;											// Add to languages list
							}
						}
					res.segs.push(seg);															// Add seg to list														
				}
			if (!res.segs.length)	return;														// Quit if no segs
			this.transRes=res;																	// Set segs
			$("#sui-viewerSide").width($(this.div).width()*0.5);								// Halve viewer width
			$("#sui-kplayer").height($(this.div).width()*0.5*.5625);							// Set height based on aspect ratio
			this.DrawTranscriptMenu();															// Draw transcripts header	
			this.DrawTransContent();															// Draw the transcipt content
			trace(res,data);
		});																						// AJAX closure
	}

	DrawTranscriptMenu()																	// DRAW TRANSCRIPT MENU 
	{
		var res=this.transRes;																	// Point at res
		var str=`<div style='display:inline-block;width:calc(50% - 24px);margin-left:12px;vertical-align:top;'>
			<div id='sui-transTab0' class='sui-transTab' title='Options'>&#xe66f</div>
			<div id='sui-transTab1' class='sui-transTab' title='Play/Pause'>&#xe641</div>
			<div id='sui-transTab2' class='sui-transTab' title='Previous line'>&#xe602</div>
			<div id='sui-transTab3' class='sui-transTab' title='Same line'>&#xe632</div>
			<div id='sui-transTab4' class='sui-transTab' title='Next line'>&#xe604</div>
			<div id='sui-transTab5' class='sui-transTab' style='border:none' title='Search transcript'>&#xe623</div>
			<div id='sui-transOps' class='sui-transOps'></div>
			<div id='sui-trans' class='sui-trans'></div>
		</div>`;
		$(this.div).append(str.replace(/\t|\n|\r/g,""))

		str=`<div class='sui-transRow'>Transcript options<span class='sui-transCheck'
		onclick='$("#sui-transOps").slideToggle()'>&#xe60f</span></div>
		<div class='sui-transLab'>LANGUAGES</div>`;
		for (var lang in res.languages)															// Add each language found in transcript
			str+="<div class='sui-transRow'>- "+lang+"<span id='sui-transL1' class='sui-transCheck'>&#xe60e</span></div>";	
		str+=`<div class='sui-transLab'>SPEAKERS</div>
		<div class='sui-transRow'>- Tibetan<span id='sui-transS1' class='sui-transCheck'>&#xe60e</span></div>	
		<div class='sui-transLab'>LAYOUTS</div>
		<div class='sui-transRow'>- Minimal<span id='sui-transY1' class='sui-transCheck'>&#xe60e</span></div>
		<div class='sui-transRow'>- Reversed<span id='sui-transY2' class='sui-transCheck'>&#xe60e</span></div>
		<div class='sui-transLab'>DOWNLOADS</div>
		<div class='sui-transRow'>- SRT file<span id='sui-transDL' class='sui-transCheck' style='color:#58aab4'>&#xe616</span></div>`;
		$("#sui-transOps").html(str.replace(/\t|\n|\r/g,""))
		
		$("#sui-transTab0").on("click",()=>{ $("#sui-transOps").slideToggle(); });			// ON OPTIONS MENU CLICK
	
		$("#sui-transTab1").on("click", ()=> {												// ON PLAY CLICK
			clearInterval(this.transTimer);													// Kill timer
			if (this.inPlay) $("#sui-kplayer")[0].sendNotification("doPause");				// Pause
			else			 this.PlayAV(),$("#sui-kplayer")[0].sendNotification("doPlay"); // Play
			});						

		$("#sui-transTab2").on("click", ()=> {												// ON PLAY PREVIOUS SEG CLICK
			this.curTransSeg=Math.max(this.curTransSeg-1,0);								// Go back one
			this.PlayAV(res.segs[this.curTransSeg].start, res.segs[this.curTransSeg].end);	// Play it
			$("#sui-kplayer")[0].sendNotification("doPlay");								// Start playing
			});							
	
		$("#sui-transTab3").on("click", ()=> {												// ON PLAY THIS SEG CLICK
			this.PlayAV(res.segs[this.curTransSeg].start, res.segs[this.curTransSeg].end);	// Play it
			$("#sui-kplayer")[0].sendNotification("doPlay");								// Start playing
			});
	
		$("#sui-transTab4").on("click", ()=> {												// ON PLAY NEXT SEG CLICK
			this.curTransSeg=Math.min(this.curTransSeg+1,res.segs.length-1);				// Go to next one
			this.PlayAV(res.segs[this.curTransSeg].start,res.segs[this.curTransSeg].end);	// Play it
			$("#sui-kplayer")[0].sendNotification("doPlay");								// Start playing
			});
	}			

	DrawTransContent()																		// DRAW TRANSCRIPT CONTENNT IN WINDOW
	{
		var i,o,lang,str="";
		var res=this.transRes;																	// Point at res
		if (res.layout == "Minimal") {															// Drawing minimal layput
			for (i=0;i<res.segs.length;++i) {													// For each seg
				str+=`<div class='sui-transMinSeg' id='sui-transMinSeg-${i}'>										
				<div class='sui-transPlay' id='sui-transPlay-${i}' title='Play line'>&#xe680</div> 
				<div class='sui-transMinBox' id='sui-transMinBox-${i}'>`;
				for (lang in res.languages)  													// For each language
					if (res.segs[i][lang])														// If something there
						str+="<div>"+res.segs[i][lang]+"</div>";								// Add transcription	
				str+="</div></div>";															// Close box and seg
				}
			}
		$("#sui-trans").html(str.replace(/\t|\n|\r/g,""));										// Add transcript to div

		$("[id^=sui-transPlay-]").on("click", (e)=> {											// ON PLAY CLICK
			this.curTransSeg=e.currentTarget.id.substring(14);									// Get index of seg	
			this.PlayAV(res.segs[this.curTransSeg].start,res.segs[this.curTransSeg].end);		// Play seg
			$("#sui-kplayer")[0].sendNotification("doPlay");									// Start playing
		});
	}																

	PlayAV(start, end)																	// PLAY TRANSCRIPT SEGMENT
	{
		var i;
		var res=this.transRes;																	// Point at res
		clearInterval(this.transTimer);															// Kill timer
		if (start != undefined)	 $("#sui-kplayer")[0].sendNotification("doSeek",start);			// Seek to start 
		this.transTimer=setInterval((e)=> {														// Set interval and handler
			var now=$("#sui-kplayer")[0].evaluate("{video.player.currentTime}");				// Get current player time
			trace(now,start,end)
			if ((end != undefined) && (now >= end)) {											// An end set and past it
				clearInterval(this.transTimer);													// Kill timer
				$("#sui-kplayer")[0].sendNotification("doPause");								// Pause video	
				return;	
				}
			for (i=0;i<res.segs.length;++i) {													// For each seg
				if ((now >= res.segs[i].start) && (now < res.segs[i].end)) {					// In this one
					this.curTransSeg=i;															// Set as current
					break;																		// Quit looking
					}
				}
			$("[id^=sui-transMinSeg-]").css("border-color","#fff");								// All borders off
			$("[id^=sui-transMinBox-]").css("background-color","#fff");							// All backgrounds off
			$("#sui-transMinSeg-"+this.curTransSeg).css("border-color","#999");					// Hilite active one				
			$("#sui-transMinBox-"+this.curTransSeg).css("background-color","#eee");				// Hilite active one				
			},100);
		}		

	
} // AudioVideo class closure
	
