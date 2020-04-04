/* 	TEERMS PAGES ****************************************************************************************************************************

	This module draws the terms page based on a kmap from SOLR. Some information comes from the kmap
	passed in and some from the a second query from the child data in the Terms index. 	The terms icon
	and the term are shown, followed by a list of names associated with that term.

	The related resources menu is drawn, which pulls data via another SOLR call. If an image is present
	it is drawn there. Below that is a browsable index of terms. Clicking on one will bring up that page.

	An button will appear if there is a recording associated with the term,found by a third query to SOLR.
	Clicking on it will play the various mp3 versions as available  and chosen by the pulldown menu.

	A tabbed menu shows the DEFINITIONS, whih lists the definition for that term, along with its language.
	The DETAILS tab lists the subjects to this page Hovering over a blue popover icon will show more information 
	about it. The OTHER DICTIONARIES tab shows definitions from other dictionaries.

	The tab will open to the DEFINATIONS tab is there are any, otehr wise it will open the OTHER DICTIONARIES
	tab, and fianlly the DETAILS tab

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
		this.content=["...loading","...loading","...loading"];									// Content pages
		this.recordingGroup=0;																	// Which group
	}

	Draw(o)																					// DRAW TERM PAGE FROM KMAP
	{
		let audioURLs=[""];
		var latin=(typeof(o.name_latin) == "string" ) ? o.name_latin : o.name_latin.join(", ");
		var str=`<div class='sui-terms' id='sui-terms' style=''>
		<span class='sui-termIcon'>${sui.assets[o.asset_type].g}</span>
		<span class='sui-termTitle'>${o.title[0]}</span>
		<hr style='border-top: 1px solid ${sui.assets[o.asset_type].c}'>
		<p>TIBETAN:&nbsp;&nbsp<span class='sui-sourceText'>${o.name_tibt}&nbsp;&nbsp;(Tibetan script, original)</span></p>
		<p>LATIN:&nbsp;&nbsp<span class='sui-sourceText'>${latin}</span></p>`;
		str+=`<div id='sui-player' style='display:none'>
		<p><span class='sui-termPlay' id='sui-termPlay'>&#xe60a</span>
		<select class='sui-termSpeak' id='sui-termGroup'><option>AMDO GROUP</option></select></p></div>`;
		str+=sui.pages.DrawTabMenu(["DEFINITIONS","DETAILS","OTHER DICTIONARIES"])+"</div>";	// Add tab menu
		$(this.div).html(str.replace(/\t|\n|\r/g,""));											// Remove format and add to div	
		this.SetTabContent(o);																	// Fill tab contents

		$("[id^=sui-tabTab]").on("click", (e)=> {												// ON TAB CLICK
			var id=e.currentTarget.id.substring(10);											// Get index of tab	
			this.ShowTab(id);																	// Draw it
			});
		$("#sui-termPlay").on("click", (e)=>{													// ON TERM PLAY
			let snd=new Audio();																// Init audio object
			snd=new Audio(audioURLs[this.recordingGroup]);										// Load it				
			snd.play();																			// Play it
			});

		$("#sui-termGroup").on("change", (e)=>{													// ON GROUP SET
			this.recordingGroup=$("#sui-termGroup").prop('selectedIndex');						// Get group
			});

		sui.GetAudioFromID(o.id, (d)=>{ 														// Get audio info
			trace(123,d)
			audioURLs=d; 																		// Get urls
			if (d.length)	$("#sui-player").slideDown();										// If any recording,show structure
			if (d.length == 2)	$("#sui-termGroup").append("<option>KHAM-HOR GROUP</option>");	// Add 2nd group if there
			});											
		sui.pages.DrawRelatedAssets(o);															// Draw related assets menu
	}

	ShowTab(which) 																			// SHOW TAB
	{
		$("[id^=sui-spLab-]").off("click");														// Kill handler
		$("[id^=sui-spDot-]").off("click");														// Kill handler
		$("[id^=sui-spItem-]").off("click");													// Kill handler
		$("[id^=sui-togCat-]").off("click");													// Kill handler
		$("[id^=sui-spCatUL-]").off("click");													// Kill handler
		$("[id^=sui-tabTab]").css({"background-color":"#999",color:"#fff" });					// Reset all tabs
		$("#sui-tabContent").css({display:"block","background-color":"#eee"});					// Show content
		$("#sui-tabTab"+which).css({"background-color":"#eee",color:"#000"});					// Active tab
		$("#sui-tabContent").html(this.content[which]);											// Set content
	}

	SetTabContent(o)																		// FILL TABS																
	{
		sui.GetChildDataFromID("terms",o.id,(data)=> { 											// LOAD CHILD DATA
			let i,k=1,str,str2,str3;
			str2=str3=str="<div style='height:2px'/>";											// Spacer
			try { 
				for (i=0;i<data.length;++i) {													// For each doc
					if (data[i].id.match(/_definitions-/)) {									// If a definition
						if (data[i].related_definitions_source_s) {								// If 'another dictionary'
							str+="<div class='sui-termOther'>"+(k++)+". <i>"+data[i].related_definitions_source_s+"</i></div>";	// Add title
							str+="<div class='sui-tesrmData'>"+data[i].related_definitions_content_s+"</div>";					// Add text
							str+="<div class='sui-termData'>LANGUAGE: "+data[i].related_definitions_language_s;					// Add language
							str+="</div><hr style='border-top: 1px solid #a2733f'>";											// End rule
							}
						else{																									// A primary definition
							str2+="<div style='font-size:14px;padding:0 24px;'>"+data[i].related_definitions_content_s+"";		// Add text
							if (data[i]["related_definitions_branch_subjects-185_header_s"]) {									// If a header
								str2+=data[i]["related_definitions_branch_subjects-185_header_s"].toUpperCase();				// Add label
								str2+=": <i>"+data[i]["related_definitions_branch_subjects-185_subjects_headers_t"]+"</i>";		// Add value
								str2+=sui.pages.AddPop(data[i]["related_definitions_branch_subjects-185_subjects_uids_t"][0]);	// Add popover
								}
							str2+="<div class='sui-termData'>";
							if (data[i].related_definitions_author_s) str2+="AUTHOR: "+data[i].related_definitions_author_s+" | ";						
							if (data[i].related_definitions_tense_s)  str2+="TENSE: "+data[i].related_definitions_tense_s+" | ";						
							str2+=" LANGUAGE: "+data[i].related_definitions_language_s;			// Add language
							str2+="</div><hr style='border-top: 1px solid #a2733f'></div>";		// End rule
							}
						}
					}
				if (str.length > 30)  str+="<br>";												// Space
				if (str2.length > 30) str2+="<br>";												// Space
				} catch(e) {}

			addSubjects("PHONEME",o.data_phoneme_ss);											
			addSubjects("GRAMMARS",o.data_grammars_ss);											
			addSubjects("TOPICS",o.data_tibet_and_himalayas_ss);											
			addSubjects("LITERARY PERIOD",o.data_literary_period_ss);							// Add subject types
			addSubjects("REGISTER",o.data_register_ss);											
			addSubjects("LANGUAGE CONTEXT",o.data_language_context_ss);											
			if (str3.length > 30) str3+="<br>";													// Space
				
			this.content[0]=str2.replace(/\t|\n|\r/g,"");										// Remove format and add to div	
			this.content[1]=str3.replace(/\t|\n|\r/g,"");										// Remove format and add to div	
			this.content[2]=str.replace(/\t|\n|\r/g,"");										// Remove format and add to div	
			if (this.content[0].length > 30) 	  this.ShowTab(0);								// Open definitions tab if something there
			else if (this.content[2].length > 30) this.ShowTab(2);								// Try others
			else if (this.content[1].length > 30) this.ShowTab(1);								// Try details
			
			function addSubjects(title, val) {													// ADD SUBJECTS
				let i=0;
				if (!val)	return;																// Quit if nothing there
				if (o.kmapid_subjects_idfacet) {												// No facet data
					for (i=0;i<o.kmapid_subjects_idfacet.length;++i)							// For each one
						if (o.kmapid_subjects_idfacet[i].split("|")[0] == val)					// Find a match
							break;																// Quit
					i=Math.min(o.kmapid_subjects_idfacet.length-1,i);							// Cap
					}
				str3+=`<p>${title}: <i>${val}</i>`;												// Add title
				if (o.kmapid_subjects_idfacet)													// If data
					str3+=sui.pages.AddPop(o.kmapid_subjects_idfacet[i].split("|")[1])+"</p>";	// Add popover
				else
					str3+=sui.pages.AddPop(o.related_uid_ss[i])+"</p>";							// Add popover
				}	
		});
	}


} // CLASS CLOSURE
