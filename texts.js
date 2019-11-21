/* 	TEXT PAGES ****************************************************************************************************************************

	This module puts up the text page based on a kmap from SOLR
	The actual marked up text come from an AJAX call to Drupal

	Requires: 	jQuery 												// Almost any version should work
	CSS:		searchui.css										// All styles are prefixed with 'sui-'
	JS:			ECMA-6												// Uses lambda (arrow) functions
	JSON:		From Drupal site
	Globals:	Looks for sui and sui.pages
	Dependents:	pages.js, searchui.js								// JS modules called

******************************************************************************************************************************************/

class Texts  {																					

	constructor()   																		// CONSTRUCTOR
	{
		this.div=sui.pages.div;																	// Div to hold page (same as Pages class)
		this.content=["...loading","...loading","...loading"];									// Content pages
	}

	Draw(o)																					// DRAW TEXTS PAGE FROM KMAP
	{
		let _this=this;
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
				<div class='sui-textTab' id='sui-textTab0'>CONTENTS</div>
				<div class='sui-textTab' id='sui-textTab1'>DESCRIPTION</div>
				<div class='sui-textTab' id='sui-textTab2'>VIEWS</div>
			</div>
			<div class='sui-textContent' id='sui-textContent'></div></div>`;
			$(this.div).html(str.replace(/\t|\n|\r/g,""));										// Remove format and add to div	
			sui.pages.DrawRelatedAssets(o);														// Draw related assets menu if active

			this.content[0]=$("#shanti-texts-toc").html();										// Save toc
			$("#shanti-texts-sidebar").remove();												// Remove original sidebar
			showTab(0);
	
			let s=`<p><b>ALTERNATIVE FORMATS</b></p>
			<p>&nbsp;&nbsp;&nbsp;&nbsp;<a target='_blank' href='https://texts.shanti.virginia.edu/book_pubreader/${o.id}'>&#xe678&nbsp;&nbsp;View in PubReader</a></p>
			<p>&nbsp;&nbsp;&nbsp;&nbsp;<a target='_blank' href='https://texts.shanti.virginia.edu/shanti_texts/voyant/${o.id}'>&#xe678&nbsp;&nbsp;View in Voyant</a></p>
			<p>&nbsp;&nbsp;&nbsp;&nbsp;<a target='_blank' href='https://texts.shanti.virginia.edu/shanti_texts/node_ajax_text/${o.id}'>&#xe678&nbsp;&nbsp;View as raw text</a></p>`;
			this.content[2]=s.replace(/\t|\n|\r/g,"");											// Set view content

			sui.GetJSONFromKmap(o, (d)=> { 														// Get JSON
				let i,str="";
				if (o.summary) str+=o.summary+"<hr>";											// Add summary
				try { s=`<a onclick='javascript:sui.pages.ShowCollection(\"${o.asset_type}-${o.id}\",\"${o.collection_idfacet}\")'>${o.collection_title}</a>`;
					str+=sui.pages.DrawItem("&#xe633","COLLECTION",s+sui.pages.AddPop("collections-"+o.collection_idfacet[0].split("|")[1]),"","sui-pageLab",1); } catch(e) {}
				try { str+=sui.pages.DrawItem("&#xe600","AUTHOR",d.field_book_author.und,"","sui-pageLab",1); } catch(e) {}
				try { str+=sui.pages.DrawItem("&#xe633","YEAR PUBLISHED", d.field_dc_date_publication_year.und[0].value.substr(0,4),"","sui-pageLab",1); }		catch(e) {}
				try { str+=sui.pages.DrawItem("&#xe633","ORIGINAL YEAR PUBLISHED", d.field_dc_date_orginial_year.und[0].value.substr(0,4),"","sui-pageLab",1); }	catch(e) {}
				if (o.kmapid_strict_ss) {														// If subjects and/or places
					str+="<p class='sui-pageLab'>&#xe62b&nbsp;&nbsp<b>SUBJECTS</b>:&nbsp;&nbsp;";// Add subjects header
					for (i=0;i<o.kmapid_strict_ss.length;++i) {									// For each item
						if (!o.kmapid_strict[i].match(/subjects/i)) continue;					// Only looking for subjects
						str+=o.kmapid_strict_ss[i]+sui.pages.AddPop(o.kmapid_strict[i]);		// Add name and drop
						if (i < o.kmapid_strict_ss.length-1)	str+=", ";						// Add separator
						}
					str+="</p>";																// End SUBJECTS
					str+="<p class='sui-pageLab'>&#xe634&nbsp;&nbsp<b>PLACES</b>:&nbsp;&nbsp;";	// Add places header
					for (i=0;i<o.kmapid_strict_ss.length;++i) {									// For each item
						if (!o.kmapid_strict[i].match(/places/i)) continue;						// Only looking for places
						str+=o.kmapid_strict_ss[i]+sui.pages.AddPop(o.kmapid_strict[i]);		// Add name and drop
						if (i < o.kmapid_strict_ss.length-1)	str+=", ";						// Add separator
						}
					str+="</p>";																// End PLACES
					}
				str+="<p class='sui-pageLab'>&#xe635&nbsp;&nbsp<b>TERMS</b>:&nbsp;&nbsp;";		// Add TERMS header
				if (d.field_kmap_terms && d.field_kmap_terms.und) {								// If terms
					for (i=0;i<d.field_kmap_terms.und.length;++i) {								// For each item
						str+=d.field_kmap_terms.und[i].header;									// Add name
						str+=sui.pages.AddPop(d.field_kmap_terms.und[i].domain+"-"+d.field_kmap_terms.und[i].id);	// Add drop
						if (i < d.field_kmap_terms.und.length-1)	str+=", ";					// Add separator
						}
					}
				str+="</p>";																	// End TERMS
				try { str+=sui.pages.DrawItem("&#xe675","EDITOR",d.field_book_editor.und,"","sui-pageLab",1); }				catch(e) {}
				try { str+=sui.pages.DrawItem("&#xe674","TRANSLATOR",d.field_book_translator.und,"","sui-pageLab",1); }		catch(e) {}
				try { str+=sui.pages.DrawItem("&#xe670","LANGUAGE",d.field_dc_language_original.und,"","sui-pageLab",1); }	catch(e) {}
				try { str+=sui.pages.DrawItem("&copy;","RIGHTS", d.field_dc_rights_general.und,"","sui-pageLab",1); }		catch(e) {}
				this.content[1]=str.replace(/\t|\n|\r/g,"");												// Set view content
				try{ content[2]+="<p>&nbsp;&nbsp;&nbsp;&nbsp;<a target='_blank' href='"+d.field_pdf_version.und[0].url+"'>&#xe678&nbsp;&nbsp;View as PDF</a></p>"; } catch(e) {}
			});
			
			$("[id^=sui-textTab]").on("click", (e)=> {											// ON TAB CLICK
				var id=e.currentTarget.id.substring(11);										// Get index of tab	
					showTab(id);																// Draw it
				});
	
			function showTab(which) {
				$("#sui-textContent").html("<div class='sui-sourceText' style='font-size:18px;color:#000'>"+o.title+"<div><hr>");	// Set title
				$("[id^=sui-textTab]").css({"background-color":"#eee"});
				$("#sui-textTab"+which).css({"background-color":"#fff"});
				$("#sui-textContent").append(_this.content[which]);								// Set content
			}
		});							
	}

} // Texts class closure
