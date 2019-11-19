/* 	TEERMS PAGES ****************************************************************************************************************************

	This module draws the terms page based on a kmap from SOLR

	Requires: 	jQuery 												// Almost any version should work
	CSS:		searchui.css										// All styles are prefixed with 'sui-'
	JS:			ECMA-6												// Uses lambda (arrow) functions
	JSON:		From Drupal site
	Globals:	Looks for sui and sui.pages
	Dependents:	pages.js, searchui.js								// JS modules called

*********************************************************************************************************************************************/

class Terms  {																					

	constructor()   																		// CONSTRUCTOR
	{
		sui.trm=this;																			// Save context
		this.div=sui.pages.div;																	// Div to hold page (same as Pages class)
		this.content=["...loading","...loading"];												// Content pages
	}

	Draw(o)																					// DRAW TERM PAGE FROM KMAP
	{
		let audioURL="//viseyes.org/visualeyes/ding.mp3";
		var latin=(typeof(o.name_latin) == "string" ) ? o.name_latin : o.name_latin.join(", ");
		var str=`<div class='sui-sources' id='sui-terms' style='margin:8px 0px 0 192px'>
		<span style='font-size:24px;color:${sui.assets[o.asset_type].c};vertical-align:-4px'>${sui.assets[o.asset_type].g}</span>
		&nbsp;&nbsp;&nbsp;&nbsp;<span class='sui-sourceText' style='font-size:20px;font-weight:500'>${o.title[0]}</span>
		<hr style='border-top: 1px solid ${sui.assets[o.asset_type].c}'>
		<p>TIBETAN:&nbsp;&nbsp<span class='sui-sourceText'>${o.name_tibt}&nbsp;&nbsp;(Tibetan script, original)</span></p>
		<p>LATIN:&nbsp;&nbsp<span class='sui-sourceText'>${latin}</span></p>`;
		try{ str+="<p>PHONEME:&nbsp;&nbsp<span class='sui-sourceText'>";						// Add header
			for (let i=0;i<o.data_phoneme_ss.length;++i) {										// For each item
				str+=o.data_phoneme_ss[i]+sui.pages.AddPop(o.related_uid_ss[i]);				// Add name and drop
				if (i < o.data_phoneme_ss.length-1)	str+=", ";									// Add separator
				}
			str+="</p>"; } catch(e){}
		str+=`<p><span id='sui-termPly' style='font-size:20px;vertical-align:-4px;color:${sui.assets[o.asset_type].c}'><b>&#xe60a</b></span>&nbsp;&nbsp;&nbsp;
		<select class='sui-termSpeak'><option>AMDO GROUP</option><option>KHAM-HOR GROUP</option></select></p></div>`
		$(this.div).html(str.replace(/\t|\n|\r/g,""));											// Remove format and add to div	

		sui.GetChildDataFromID("terms",o.id,(data)=> { 											// Load data
			let i,k=0;
			try { 
				for (i=0;i<data.length;++i) {													// For each doc
					if (data[i].related_definitions_source_s) {									// If 'another dictionary'
						if (!k++) str="<div class='sui-termBar'>OTHER DICTIONARIES</div>";		// Add header once
						str+="<div class='sui-otherTitle'>"+k+". <i>"+data[i].related_definitions_source_s+"</i></div>";	// Add title
						str+="<div style='font-size:14px;padding:0 24px;'>"+data[i].related_definitions_content_s+"</div>";			// Add text
						str+="<div style='font-size:12px;text-align:right;color:#a2733f'>LANGUAGE: "+data[i].related_definitions_language_s;	// Add language
						str+="</div><hr style='border-top: 1px solid #a2733f'>";				// End rule
						}
					}
				} catch(e) {trace(e) }
			
			$("#sui-terms").append(str.replace(/\t|\n|\r/g,""));								// Remove format and add to div	

			trace(data);
			});

		$("#sui-termPly").on("click", (e)=>{													// ON TERM PLAY
			let snd=new Audio();																// Init audio object
			snd=new Audio(audioURL);															// Load it				
			snd.play();																			// Play it
			});

		sui.GetAudioFromID(o.id, (d)=>{ audioURL=d; });											// Get audio info
		sui.pages.DrawRelatedAssets(o);															// Draw related assets menu
	}


} // CLASS CLOSURE
