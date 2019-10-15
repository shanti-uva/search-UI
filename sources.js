/* SOURCES

	This module puts up the sources based on a kmap from SOLR

	Requires: 	jQuery 												// Almost any version should work
	CSS:		searchui.css										// All styles are prefixed with 'sui-'
	JS:			ECMA-6												// Uses lambda (arrow) functions
	JSON:		From Drupal site
	Globals:	Looks for sui and sui.pages
*/

class Sources  {																					

	constructor()   																		// CONSTRUCTOR
	{
		this.div="#sui-results";																// Div to hold page
	}

	Draw(o)																					// DRAW SOURCE PAGE FROM KMAP
	{
		var i;
		var str=`<div class='sui-sources' id='sui-sources'>
		<span style='font-size:24px;color:${sui.assets[o.asset_type].c};vertical-align:-4px'>${sui.assets[o.asset_type].g}</span>
		&nbsp;&nbsp;<span class='sui-sourceText' style='font-size:20px;font-weight:500'>${o.title[0]}</span>
		<hr style='border-top: 1px solid #aaa'>
		<div id='sui-srcSec' style='font-size:18px;font-weight:400'></div><br>`;
		if (o.creator && o.creator.length) {
			str+=`<span class='sui-pageLab' style='color:${sui.assets[o.asset_type].c}'>&#xe600</span>
			&nbsp;&nbsp;${o.creator.join(", ")}<br><br>`;
			}
		if (o.url_thumb && !o.url_thumb.match(/gradient.jpg/)) str+="<img src='"+o.url_thumb+"' style='float:right;width:33%; padding:0 0 12px 12px'>";
		if (o.asset_subtype) str+="<p>FORMAT:&nbsp;&nbsp<span class='sui-sourceText'>"+o.asset_subtype+"</p>";
		str+="<p class='sui-pageLab'>PUBLICATION YEAR:&nbsp;&nbsp<span class='sui-sourceText' id='sui-srcYear'></span>";
		if (o.publisher_s) str+="<p>PUBLISHER:&nbsp;&nbsp<span class='sui-sourceText'>"+o.publisher_s+"</p>";
		str+="<p class='sui-pageLab'>PLACE OF PUBLICATION:&nbsp;&nbsp<span class='sui-sourceText' id='sui-srcPlc'></span>";
		str+="<p class='sui-pageLab'>PAGES:&nbsp;&nbsp<span class='sui-sourceText' id='sui-srcPages'></span>";
		str+="<p class='sui-pageLab'>SOURCE ID:&nbsp;&nbsp<span class='sui-sourceText'>sources-"+o.id+"</span></p>";
		if (o.summary) str+="<p>ABSTRACT:<div class='sui-sourceText'>"+o.summary+"</div></p>";
		str+="</div>";
		$(this.div).html(str.replace(/\t|\n|\r/g,""));											// Remove format and add to div	
		sui.pages.DrawRelatedAssets();															// Draw related assets menu if active
		
		sui.GetJSONFromKmap(o, (d)=> {															// Get details from JSON
			let i,str="";
			if (d.biblio_pages) 			$("#sui-srcPages").html(d.biblio_pages);			// Add pages
			if (d.biblio_year) 				$("#sui-srcYear").html(d.biblio_year);				// Year
			if (d.biblio_secondary_title) 	$("#sui-srcSec").html(d.biblio_secondary_title);	// Pub
			if (d.biblio_place_published) 	$("#sui-srcPlc").html(d.biblio_place_published);	// Pub place
			if (d.field_kmaps_subjects && d.field_kmaps_subjects.und) {							// If subjects
				str+="<p class='sui-pageLab'>SUBJECTS:&nbsp;&nbsp;";							// Add header
				for (i=0;i<d.field_kmaps_subjects.und.length;++i) {								// For each item
					str+=d.field_kmaps_subjects.und[i].header;									// Add name
					str+=sui.pages.AddPop(d.field_kmaps_subjects.und[i].domain+"-"+d.field_kmaps_subjects.und[i].id);	// Add drop
					if (i < d.field_kmaps_subjects.und.length-1)	str+=", ";					// Add separator
					}
				str+="</p>";																	// End TERMS
				}
			if (d.field_kmaps_places && d.field_kmaps_places.und) {								// If places
				str+="<p class='sui-pageLab'>TERMS:&nbsp;&nbsp;";								// Add header
				for (i=0;i<d.field_kmaps_places.und.length;++i) {								// For each item
					str+=d.field_kmaps_places.und[i].header;									// Add name
					str+=sui.pages.AddPop(d.field_kmaps_places.und[i].domain+"-"+d.field_kmaps_places.und[i].id);	// Add drop
					if (i < d.field_kmaps_places.und.length-1)	str+=", ";						// Add separator
					}
				str+="</p>";																	// End PLACES
				}
			if (d.field_kmap_terms && d.field_kmap_terms.und) {									// If terms
				str+="<p class='sui-pageLab'>TERMS:&nbsp;&nbsp;";								// Add TERMS header
				for (i=0;i<d.field_kmap_terms.und.length;++i) {									// For each item
					str+=d.field_kmap_terms.und[i].header;										// Add name
					str+=sui.pages.AddPop(d.field_kmap_terms.und[i].domain+"-"+d.field_kmap_terms.und[i].id);	// Add drop
					if (i < d.field_kmap_terms.und.length-1)	str+=", ";						// Add separator
					}
				str+="</p>";																	// End TERMS
				}
			if (d.biblio_url) str+="<p class='sui-pageLab'>URL:&nbsp;&nbsp;<a target='_blank' href='"+d.biblio_url+"'>"+d.biblio_url+"</a></p>";	// URL
			$("#sui-sources").append(str);
			});									
	}

} // Sources class closure
