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
		this.content=["...loading","...loadingr","...loading"];									// Content pages
	}

	Draw(o)																					// DRAW TERM PAGE FROM KMAP
	{
		let _this=this;																			// Context
		let audioURL="//viseyes.org/visualeyes/ding.mp3";
		var latin=(typeof(o.name_latin) == "string" ) ? o.name_latin : o.name_latin.join(", ");
		var str=`<div class='sui-sources' id='sui-terms' style='margin:8px 0px 0 192px'>
		<span style='font-size:24px;color:${sui.assets[o.asset_type].c};vertical-align:-4px'>${sui.assets[o.asset_type].g}</span>
		&nbsp;&nbsp;&nbsp;&nbsp;<span class='sui-sourceText' style='font-size:20px;font-weight:500'>${o.title[0]}</span>
		<hr style='border-top: 1px solid ${sui.assets[o.asset_type].c}'>
		<p>TIBETAN:&nbsp;&nbsp<span class='sui-sourceText'>${o.name_tibt}&nbsp;&nbsp;(Tibetan script, original)</span></p>
		<p>LATIN:&nbsp;&nbsp<span class='sui-sourceText'>${latin}</span></p>`;
		str+=`<p><span id='sui-termPly' style='font-size:20px;vertical-align:-4px;color:${sui.assets[o.asset_type].c}'><b>&#xe60a</b></span>&nbsp;&nbsp;&nbsp;
		<select class='sui-termSpeak'><option>AMDO GROUP</option><option>KHAM-HOR GROUP</option></select></p>`;
		str+=sui.pages.DrawTabMenu(["DEFINITIONS","DETAILS","OTHER DICTIONARIES"])+"</div>";	// Add tab menu
		$(this.div).html(str.replace(/\t|\n|\r/g,""));											// Remove format and add to div	

		$("[id^=sui-tabTab]").on("click", (e)=> {												// ON TAB CLICK
			var id=e.currentTarget.id.substring(10);											// Get index of tab	
			showTab(id);																		// Draw it
			});
		
		function showTab(which) {																// SHOW TAB
			$("[id^=sui-spLab-]").off("click");													// Kill handler
			$("[id^=sui-spDot-]").off("click");													// Kill handler
			$("[id^=sui-spItem-]").off("click");												// Kill handler
			$("[id^=sui-togCat-]").off("click");												// Kill handler
			$("[id^=sui-spCatUL-]").off("click");												// Kill handler
			$("[id^=sui-tabTab]").css({"background-color":"#999",color:"#fff" });				// Reset all tabs
			$("#sui-tabContent").css({display:"block","background-color":"#eee"});				// Show content
			$("#sui-tabTab"+which).css({"background-color":"#eee",color:"#000"});				// Active tab
			$("#sui-tabContent").html(_this.content[which]);									// Set content
			}

		sui.GetChildDataFromID("terms",o.id,(data)=> { 										// LOAD CHILD DATA
			let i,k=1,str,str2,str3;
			str2=str3=str="<div style='height:2px'/>";											// Sapcer
			try { 
				for (i=0;i<data.length;++i) {													// For each doc
					if (data[i].id.match(/_definitions-/)) {									// If a definition
						if (data[i].related_definitions_source_s) {								// If 'another dictionary'
							str+="<div class='sui-termOther'>"+(k++)+". <i>"+data[i].related_definitions_source_s+"</i></div>";						// Add title
							str+="<div style='font-size:14px;padding:0 24px;'>"+data[i].related_definitions_content_s+"</div>";						// Add text
							str+="<div style='font-size:12px;text-align:right;color:#a2733f'>LANGUAGE: "+data[i].related_definitions_language_s;	// Add language
							str+="</div><hr style='border-top: 1px solid #a2733f'>";			// End rule
							}
						else{																	// A primary definition
							str2+="<div style='font-size:14px;padding:0 24px;'>"+data[i].related_definitions_content_s+"</div>";	// Add text
							if (data[i]["related_definitions_branch_subjects-185_header_s"]) {
								str2+="<div style='font-size:13px;margin-left:24px'>";
								str2+=data[i]["related_definitions_branch_subjects-185_header_s"].toUpperCase();
								str2+=": <i>"+data[i]["related_definitions_branch_subjects-185_subjects_headers_t"]+"</i>"
								str2+=sui.pages.AddPop(data[i]["related_definitions_branch_subjects-185_subjects_uids_t"][0])+"</div>";
								}
							str2+="<div style='font-size:12px;text-align:right;width:100%;color:#a2733f'>";
							if (data[i].related_definitions_author_s) str2+="AUTHOR: "+data[i].related_definitions_author_s+" | ";						
							if (data[i].related_definitions_tense_s)  str2+="TENSE: "+data[i].related_definitions_tense_s+" | ";						
							str2+=" LANGUAGE: "+data[i].related_definitions_language_s;			// Add language
							str2+="</div><hr style='border-top: 1px solid #a2733f'>";			// End rule
							}
						}
					}
				} catch(e) {}

			function addSubjects(title, val) {													// ADD SUBJECTS
				let i=0;
				if (!val)	return;																// Quit if nothing there
				if (o.kmapid_subjects_idfacet)													// No facet data
					for (i=0;i<o.kmapid_subjects_idfacet.length;++i)							// For each one
						if (o.kmapid_subjects_idfacet[i].split("|")[0] == val)					// Find a match
							break;																// Quit
				str3+=`<p>${title}: <i>${val}</i>`;												// Add title
				if (o.kmapid_subjects_idfacet)													// If data
					str3+=sui.pages.AddPop(o.kmapid_subjects_idfacet[i].split("|")[1])+"</p>";	// Add popover
				else
					str3+=sui.pages.AddPop(o.related_uid_ss[i])+"</p>";							// Add popover
				}	

			addSubjects("LITERARY PERIOD",o.data_literary_period_ss);							// Add subject types
			addSubjects("REGISTER",o.data_register_ss);											
			addSubjects("LANGUAGE CONTEXT",o.data_language_context_ss);											
			addSubjects("GRAMMARS",o.data_grammars_ss);											
			addSubjects("PHONEME",o.data_phoneme_ss);											
			addSubjects("TOPICS",o.data_tibet_and_himalayas_ss);											
				
			this.content[0]=str2.replace(/\t|\n|\r/g,"");										// Remove format and add to div	
			this.content[1]=str3.replace(/\t|\n|\r/g,"");										// Remove format and add to div	
			this.content[2]=str.replace(/\t|\n|\r/g,"");										// Remove format and add to div	
			showTab(0);																			// Open definitions tab
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
