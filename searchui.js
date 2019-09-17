/* MANDALA SEARCH UI

	When allocated, attaches a <div> framework containing a search button in the top white bar of the Mandala app.
	When clicked, it will expand to cover the entire screen. 
	An sui=open message is sent to host.
	When a SOLR query is needed, a JSON formatted version of the search object is sent to host uoing a sui=query message.
	The host responds with a SOLR query.
	When an item has been selected, a sui=page message is sent to host and the host navigates there.
	The UI retreats to only the search button.
	A sui=close message is sent to host.

	Requires: 	jQuery 												// Almost any version should work
	Calls:		places.js											// Other JS modules that are dynmically loaded
	CSS:		searchui.css										// All styles are prefixed with 'sui-'
	JS:			ECMA-6												// Uses lambda (arrow) functions
	Images:		loading.gif, gradient.jpg, treebuts.png
	Globals:	sui													// Needs to be declared globally!
	Usage: 		var sui=new SearchUI();								// Allocs SearchUI class (fully encapsulated)							
	Messages: 	sui=page|url ->										// Hides search and send url to direct Drupal to display
				sui=open|searchState ->								// Tells Drupal search page is open w/ current search state (ss object)
				sui=query|searchState ->							// Asks Drupul to turn search state (JSON) into SOLR query string
				sui=close ->										// Tells Drupal search page is closed
				-> sui=open|[searchState] 							// Open search page is to search state
				-> sui=close										// Close search page 	
	
*/

class SearchUI  {																					

	constructor(mode)   																		// CONSTRUCTOR
	{
		sui=this;																					// Save ref to class as global
		this.curResults="";																			// Returns results
		this.numItems=0;																			// Number of items																						
		this.AND="AND";	this.OR="OR";	this.NOT="NOT";												// Boolean display names
		this.ss={};																					// Holds search state
		this.runMode=mode;																			// Current mode

		this.facets={};																				
		this.facets.place=			{ type:"tree",  icon:"&#xe62b", data:[] };						// Places 
		this.facets.collection=		{ type:"list",  icon:"&#xe633", data:[] };						// Collections 
		this.facets.language=		{ type:"list",  icon:"&#xe670", data:[] };						// Languages 
		this.facets.feature=		{ type:"tree",  icon:"&#xe638", data:[] };						// Features 
		this.facets.subject=		{ type:"tree",  icon:"&#xe634", data:[] };						// Subjects 
		this.facets.term=			{ type:"tree",  icon:"&#xe635", data:[] };						// Terms 
		this.facets.user=			{ type:"input", icon:"&#xe600", data:[] };						// Terms 
		this.facets.relationship=	{ type:"list",  icon:"&#xe638", data:[] };						// Relationships
	
		this.assets={};
		this.assets.All=	 		{ c:"#5b66cb", g:"&#xe60b" };									// All assets
		this.assets.Places=	 		{ c:"#6faaf1", g:"&#xe62b" };									// Places
		this.assets["Audio-Video"]=	{ c:"#58aab4", g:"&#xe648" };									// AV
		this.assets.Images=	 		{ c:"#b49c59", g:"&#xe62a" };									// Images
		this.assets.Sources= 		{ c:"#7773ab", g:"&#xe631" };									// Sources
		this.assets.Texts=	 		{ c:"#8b5aa1", g:"&#xe636" };									// Texts
		this.assets.Visuals= 		{ c:"#6e9456", g:"&#xe63b" };									// Visuals
		this.assets.Subjects=		{ c:"#cc4c39", g:"&#xe634" };									// Subjects
		this.assets.Terms=   		{ c:"#a2733f", g:"&#xe635" };									// Terms
	
		for (var key in this.facets) this.GetFacetData(key);										// Get data about SOLR categories for each facet
	
		$("<link/>", { rel:"stylesheet", type:"text/css", href:"searchui.css" }).appendTo("head"); 	// Load CSS
		if (mode == "standalone") {																	// If in standalone
			$.ajax(	{ url:"places.js", dataType:"script" }).done(()=> { this.places=new Places(); }); 	// Dynamically load and alloc places class
			$.ajax(	{ url:"pages.js",  dataType:"script" }).done(()=> { this.pages=new Pages(); }); 	// Dynamically load and alloc pages class
			}
		this.SetSearchState(null);																	// Init search state to default
		this.AddFrame();																			// Add div framework
		this.Query();																				// Get intial data
		this.Draw();																				// Draw
		
		window.onresize=()=> {	this.Draw(); };														// On window resize. redraw
		}

	SetSearchState(state)																		// SET OR INIT SEARCH STATE
	{
		if (!state) {
			this.ss={};																				// Clear search state
			this.ss.solrUrl="https://ss251856-us-east-1-aws.measuredsearch.com/solr/kmassets_dev/select";	// SOLR production url
			this.ss.mode="input";																	// Current mode - can be input, simple, or advanced
			this.ss.view="Card";																	// Dispay mode - can be List, Grid, or Card
			this.ss.sort="Alpha";																	// Sort mode - can be Alpha, Date, or Author
			this.ss.type="All";																		// Current item types
			this.ss.page=0;																			// Current page being shown
			this.ss.pageSize=100;																	// Results per page	
			this.ss.query={ 																		// Current query
				text:"",																			// Search word 
				place:[],																			// Places
				collection:[],																		// Collections
				language:[],																		// Languages
				feature:[],																			// Feature types
				subject:[],																			// Subjects
				term:[],																			// Terms
				relationship:[],																	// Relationships
				user:[],																			// Users
				asset:[],																			// Assets
				dateStart:"", dateEnd:""															// Beginning and ending dates
				};																
			}
		}

	AddFrame()																					// ADD DIV FRAMEWORK
	{
		var key;
		var str=`<div id='sui-main' class='sui-main'>
			<div id='sui-top' class='sui-top'>
				<div class='sui-search1'>
				<input type='text' id='sui-search' class='sui-search2' placeholder='Enter Search'>
				<div id='sui-clear' class='sui-search3'>&#xe610</div>
				</div>
				<div id='sui-searchgo' class='sui-search4'>&#xe623</div>
				<div id='sui-mode' class='sui-search5' title='Advanced search'>&#xe669</div>
			</div>
			<div id='sui-header' class='sui-header'>
				<div id='sui-headLeft' class='sui-headLeft'></div>
				<div id='sui-headRight' class='sui-headRight'></div>
			</div>
			<div id='sui-left' class='sui-left'>
				<div id='sui-results' class='sui-results scrollbar'></div>
				<div id='sui-footer' class='sui-footer'></div>
				<div id='sui-adv' class='sui-adv'>
					<div class='sui-advTop'>Advanced search
					<div id='sui-advClose' style='float:right;font-size:12px;cursor:pointer' title='Hide' onclick='$("#sui-mode").trigger("click")'>&#xe684;</div>
					</div><br>
					<div class='sui-search1'>
						<input type='text' id='sui-search2' class='sui-search2' placeholder='Enter Search'>
						<div id='sui-clear' class='sui-search3'>&#xe610</div>
					</div>
					<div id='sui-searchgo2' class='sui-search4'>&#xe623</div><br><br>`
					for (key in this.facets) { 
						str+=`<div class='sui-advHeader' id='sui-advHeader-${key}'>
						${this.facets[key].icon}&nbsp;&nbsp;
						${key.toUpperCase()}S
						<span id='sui-advPlus-${key}' style='float:right'>&#xe669</span>
						</div>
						<div class='sui-advTerm' id='sui-advTerm-${key}'></div>
						<div class='sui-advEdit' id='sui-advEdit-${key}'></div>`;
						}
					str+=`</div>
					<div class='sui-advHeader' id='sui-advOptions-text'>&#xe623&nbsp;&nbsp;SEARCH WORD OPTIONS</div>
				<div class='sui-advTerm' id='sui-advTerm-text'></div>
				<div class='sui-advEdit' id='sui-advEdit-text'></div>`;
				str+=`</div>
			</div>`;
		$("body").append(str.replace(/\t|\n|\r/g,""));												// Remove formatting and add framework to body

		$("#sui-clear, sui-clear2").on("mouseover",function() { $(this).html("&#xe60d"); });		// Highlight						
		$("#sui-clear, sui-clear2").on("mouseout", function() { $(this).html("&#xe610"); });		// Normal						
		$("#sui-clear, sui-clear2").on("click",()=> { 												// ON ERASE
			$("#sui-search, #sui-search2" ).val("");	this.ss.query.text=""; 						// Clear input and query												
			this.Query(); 																			// Load and redraw
			});					
		
		$("#sui-search, #sui-search2").on("change", (e)=> { 										// ON SEARCH CHANGE
			this.ss.query.text=$("#"+e.currentTarget.id).val(); 									// Get query
			$("#sui-search").val(this.ss.query.text);												// Set top search
			$("#sui-search2").val(this.ss.query.text);												// Set adv search
			if (this.ss.mode == "input") this.ss.mode="simple";										// Toggle simple mode
			this.ss.page=0;																			// Start at beginning
			this.Query(); 																			// Load and redraw
			});	

		$("#sui-searchgo, #sui-searchgo2").on("click", (e)=> { 										// ON SEARCH BUTTON CLCK
			if (this.ss.mode == "input") this.ss.mode="simple";										// Toggle simple mode
			this.ss.page=0;																			// Start at beginning
			this.Query(); 																			// Load and redraw
			});	
		
		$("#sui-mode").on("click",()=> { 															// ON CHANGE MODE
			if (this.ss.mode == "advanced") this.ss.mode="simple";									// Go to simple mode
			else							this.ss.mode="advanced";								// Go to advanced mode
			this.Draw(); 																			// Redraw
			});	
			
		$("[id^=sui-advHeader-]").on("click",(e)=> {												// ON FACET HEADER CLICK
			var id=e.currentTarget.id.substring(14);												// Get facet name		
			$(".sui-advEdit").slideUp(400, ()=> {													// Close any open tree or lists
				$("[id^=sui-advPlus-]").html("&#xe669");											// Reset them all to closed
				if ($("#sui-advEdit-"+id).css("display") != "none")									// If open
					$("#sui-advPlus-"+id).html("&#xe66a");											// Show open
				});
			$("#sui-advPlus-"+id).html("&#xe66a");													// Show open

			for (var key in this.facets)															// For each facet
				if (this.facets[key] == "list")														// If a list
					$("#sui-advEdit-"+key).html("");												// Erase contents

			if (this.facets[id].type == "input")		this.DrawInput(id);							// Draw input editor			
			else if (this.facets[id].type == "tree")	this.DrawFacetTree(id);						// Open tree editor				
			else										this.DrawFacetList(id);						// Draw list editor
			});
		}

	Draw(mode)																					// DRAW SEARCH
	{
		$("#sui-typeList").remove();																// Remove type list
		if (mode) this.ss.mode=mode;																// If mode spec'd, use it
		this.DrawResults();																			// Draw results page if active
		this.DrawAdvanced();																		// Draw search UI if active
	}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  QUERY
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	GetFacetData(type, search)																	// GET FACET DATA
	{
		var url="https://ss251856-us-east-1-aws.measuredsearch.com/solr/kmassets_dev/select?q=asset_type%3A(images%20audio-video)&wt=json&rows=0&json.facet=%7Bcollection:%7Blimit:300,type:%22terms%22,field:%22collection_title%22,facet:%7Bcollection_nid:%7Bfield:%22collection_nid%22,type:%22terms%22%7D%7D%7D%7D";
		$.ajax( { url:url, dataType:'jsonp', jsonp:'json.wrf' }).done((data)=> {					// Get facets
			var i;
			if (!data || !data.facets || !data.facets[type] || !data.facets[type].buckets)			// If no buckets
				return;																				// Quit
			this.facets[type].data=[];																// New array
			var buckets=data.facets[type].buckets;													// Point at buckets
			for (i=0;i<buckets.length;++i)  														// For each bucket
				this.facets[type].data.push({ title: buckets[i].val, count:buckets[i].count, id:'', url:"" });		// Add to list								
			});
	}

	Query()																						// QUERY AND UPDATE RESULTS
	{
		this.LoadingIcon(true,64);																	// Show loading icon
		var s=this.ss.page*this.ss.pageSize;														// Starting item number
		var asset="";																				// Assume all assets
		if (this.ss.type != "All")																	// If not all
			asset="asset_type%3A"+this.ss.type.toLowerCase()+" AND ";								// Set asset type						
		var search=this.FormQuery();																// Form SOLR search from query object
		var url="https://ss395824-us-east-1-aws.measuredsearch.com/solr/kmassets/select/?"+"q="+asset+search+"&fl=*&wt=json&json.wrf=?&sort=id asc&start="+s+"&rows="+this.ss.pageSize;
		$.ajax( { url: url,  dataType: 'jsonp', jsonp: 'json.wrf' }).done((data)=> {
			var i,o;
			this.curResults=data.response.docs;														// Save current results
			for (i=0;i<this.curResults.length;++i) {												// For each result, massage data
				o=this.curResults[i];																// Point at item
				o.asset_type=o.asset_type.charAt(0).toUpperCase()+o.asset_type.slice(1);			// UC 1st char
				if (o.asset_subtype) o.asset_subtype=o.asset_subtype.charAt(0).toUpperCase()+o.asset_subtype.slice(1);	
				if (o.ancestors_txt && o.ancestors_txt.length)	o.ancestors_txt.splice(0,1);		// Remove 1st ancestor from trail
				if (o.asset_type == "Audio-video") 	o.asset_type="Audio-Video";						// Handle AV
				if (o.asset_type == "Texts")		o.url_thumb="gradient.jpg";								// Use gradient for texts
				else if (!o.url_thumb)				o.url_thumb="gradient.jpg";						// Use gradient for generic
				if (o.display_label) o.title=o.display_label;										// Get title form display
				}
			this.assets[this.ss.type].n=data.response.numFound;										// Set counts
			this.LoadingIcon(false);																// Hide loading icon
			this.DrawResults();																		// Draw results page if active
			});
		this.GetAssetCounts(search);																// Get asset counts	
	}

	FormQuery()																					// FORM SOLR QUERY FROM SEARCH OBJECT
	{
		var i,o,str,search="*";																		// Assume not filtering of words
		if (this.ss.query.text) {																	// If a filter spec'd
			str="*"+this.ss.query.text.toLowerCase()+"*";											// Search term
			search=" (title%3A"+str;																// Look at title
			search+=" OR caption%3A"+str;															// Or caption 
			search+=" OR summary%3A"+str+")";														// Or summary
			}
		o=this.ss.query.place;																		// Point at place
		if (o.length) 																				// If spec'd
			for (i=0;i<o.length;++i) 																// For each term
				search+=" "+o[i].bool+" kmapid%3A"+o[i].id.toLowerCase();							// Place search term 
		o=this.ss.query.collection;																	// Point at collection
		if (o.length) 																				// If spec'd
			for (i=0;i<o.length;++i) {																// For each term
				str="*"+o[i].title.toLowerCase()+"*";												// Search term
				search+=" "+o[i].bool+" collection_title%3A"+str;									// Boolean and title
				}
		o=this.ss.query.user;                                                                   	// Point at user            
		if (o.length)                                                                               // If spec'd
			for (i=0;i<o.length;++i) {                                                              // For each term
				str="*"+o[i].title.toLowerCase()+"*";                                               // Search term
				search+=" "+o[i].bool+" node_user%3A"+str;                                          // Boolean and title
				}		
		return search;																				// Return formatted query
	}

	GetAssetCounts(search) 																		// GET ASSET COUNTS
	{
		var i,val;
		var url=this.ss.solrUrl+"?"+"q=*"+search+"&wt=json&rows=0&json.facet={assetType:{limit:300,type:%22terms%22,field:%22asset_type%22}}";
		$.ajax( { url: url,  dataType: 'jsonp', jsonp: 'json.wrf' }).done((data)=> {				// Get asset counts
			for (i in this.assets) this.assets[i].n=0;												// Zero them out
			if (!data || !data.facets || !data.facets.assetType || !data.facets.assetType.buckets)	// If no buckets
				return;																				// Quit
			var buckets=data.facets.assetType.buckets;												// Point at buckets
			for (i=0;i<buckets.length;++i) {														// For each bucket
				val=buckets[i].val;																	// Get name
				val=val.charAt(0).toUpperCase()+val.slice(1);										// UC
				if (val == "Audio-video") val="Audio-Video";										// Handle AV
				this.assets[val].n=buckets[i].count;												// Set count
				}
			this.assets.All.n=data.response.numFound;												// All count																	
		});
	}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  RESULTS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	DrawResults()																				// DRAW RESULTS SECTION
	{
		$("#sui-results").scrollTop(0);																// Scroll to top
		$("#plc-infoDiv").remove();																	// Remove map buttons
		this.numItems=this.assets[this.ss.type].n;													// Set number of items
		if (this.ss.mode == "input") {																// Just the search box
			$("#sui-header").css({ display:"none"});												// Show header
			$("#sui-left").css({ display:"none" });													// Hide results
			$("#sui-adv").css({ display:"none" });													// Hide search ui
			$("#sui-headLeft").css({ display:"none" });												// Hide left header
			return;																					// Quit
			}
		else if (this.ss.mode == "simple") {														// Simple search
			$("#sui-left").css({ width:"100%" });													// Size and show results area
			$("#sui-adv").css({ display:"none"});													// Hide search ui
			$("#sui-left").slideDown();																// Slide down
			}
		else if (this.ss.mode == "advanced") {														// Advanced search
			$("#sui-left").css({ width:$("body").width()-$("#sui-adv").width()-19+"px",display:"inline-block"});	// Size and show results area
			$("#sui-adv").css({ display:"inline-block" });										// Show search ui
			}
		$("#sui-headLeft").css({ display:"inline-block" });											// Show left header
		$("#sui-mode").prop({"title": this.ss.mode == "advanced" ? "Regular search" : "Advanced search" } );	// Set tooltip
		$("#sui-mode").html(this.ss.mode == "advanced" ? "&#xe66a" : "&#xe669" );					// Set mode icon	
		$("#sui-header").css({display:"inline-block"} );											// Show header
		$("#sui-typeList").remove();																// Remove type list
		this.DrawHeader();																			// Draw header
		this.DrawItems();																			// Draw items
		this.DrawFooter();																			// Draw footer
	}

	DrawHeader()																				// DRAW RESULTS HEADER
	{
		var s=this.ss.page*this.ss.pageSize+1;														// Starting item number
		var e=Math.min(s+this.ss.pageSize,this.numItems);											// Ending number
		var n=this.assets[this.ss.type].n;															// Get number of items in current asset
		if (n >= 1000)	n=Math.floor(n/1000)+"K";													// Shorten if need be
		$("#sui-header").css("background-color","#888");											// Set b/g color
	
		var str=`
			<span id='sui-resClose' class='sui-resClose'>&#xe60f</span>
			Search results: <span style='font-size:12px'> (${s}-${e}) of ${this.numItems}
			`;
		$("#sui-headLeft").html(str.replace(/\t|\n|\r/g,""));										// Remove format and add to div
		str=`
			SHOW&nbsp; 
			<div id='sui-type' class='sui-type' title='Choose asset type'>
			<div id='sui-typeIcon' class='sui-typeIcon' style='background-color:${this.assets[this.ss.type].c}'>
			${this.assets[this.ss.type].g}</div>${this.ss.type} (${n}) 
			<div id='sui-typeSet' class='sui-typeSet'>&#xe609</div>
			</div>
			`;
		$("#sui-headRight").html(str.replace(/\t|\n|\r/g,""));										// Remove format and add to div
		$("#sui-resClose").on("click", ()=> { this.Draw("input"); });								// ON QUIT
		$("#sui-typeSet").on("click", ()=> {														// ON CHANGE ASSET BUTTON
			$("#sui-typeList").remove();															// Remove type list
			str="<div id='sui-typeList' class='sui-typeList'>";										// Enclosing div for list
			for (var k in this.assets) {															// For each asset type														
				n=this.assets[k].n;																	// Get number of items
				if (n > 1000)	n=Math.floor(n/1000)+"K";											// Shorten
				str+="<div class='sui-typeItem' id='sui-tl-"+k+"'><span style='font-size:18px; line-height: 24px; vertical-align:-3px; color:"+this.assets[k].c+"'>"+this.assets[k].g+" </span> "+k+" ("+n+")</div>";
				}
			$("#sui-main").append(str);																// Add to main div
			
			$("[id^=sui-tl-]").on("click", (e)=> {													// ON CLICK ON ASSET 
				this.ss.type=e.currentTarget.id.substring(7);										// Get asset name		
				$("#sui-typeList").remove();														// Remove type list
				this.ss.page=0;																		// Start at beginning
				this.Query(); 																		// Get new results
				});							
			});
	}

	DrawFooter()																				// DRAW RESULTS FOOTER
	{
		var lastPage=Math.floor(this.numItems/this.ss.pageSize);									// Calc last page
		$("#sui-footer").css("background-color","#888");											// Set b/g color
		var str=`
		<div style='float:left;font-size:18px'>
			<div id='sui-viewModeList' class='sui-resDisplay' title='List view'>&#xe61f</div>
			<div id='sui-viewModeGrid' class='sui-resDisplay' title='Grid view'>&#xe61b</div>
			<div id='sui-viewModeCard' class='sui-resDisplay' title='Card view'>&#xe673</div>
		</div>	
		<div style='display:inline-block;font-size:11px'>
			<div id='sui-page1' class='sui-resDisplay' title='Go to first page'>&#xe63c</div>
			<div id='sui-pageP' class='sui-resDisplay' title='Go to previous page'>&#xe63f</div>
			<div class='sui-resDisplay'> PAGE <input type='text' id='sui-typePage' 
			style='border:0;border-radius:4px;width:30px;text-align:center;vertical-align:1px;font-size:10px;padding:2px'
			title='Enter page, then press Return'> OF ${lastPage+1}</div>
			<div id='sui-pageN' class='sui-resDisplay' title='Go to next page'>&#xe63e</div>
			<div id='sui-pageL' class='sui-resDisplay' title='Go to last page'>&#xe63d</div>
			</div>	
		<div style='float:right;font-size:16px;'>
			<div id='sui-viewSortAlpha' class='sui-resDisplay' title='Sort alphabetically'>&#xe652</div>
			<div id='sui-viewSortDate'  class='sui-resDisplay' title='Sort by date'>&#xe60c</div>
			<div id='sui-viewSortAuthor' class='sui-resDisplay' title='Sort by author'>&#xe600</div>
			</div>`;
		$("#sui-footer").html(str.replace(/\t|\n|\r/g,""));											// Remove format and add to div
		
		$("#sui-typePage").val(this.ss.page+1);														// Set page number
		$("[id^=sui-viewMode]").css("color","#ddd");												// Reset modes
		$("#sui-viewMode"+this.ss.view).css("color","#fff");										// Highlight current mode
		$("[id^=sui-viewMode]").on("click",(e)=> { 													// ON MODE CLICK
			this.ss.view=e.currentTarget.id.substring(12);											// Get/set mode name		
			this.DrawResults(); 																	// Redraw
			});		

		$("[id^=sui-viewSort]").css("color","#ddd");												// Reset modes
		$("#sui-viewSort"+this.ss.sort).css("color","#fff");										// Highlight current mode
		$("[id^=sui-viewSort]").on("click",(e)=> { 													// ON SORT CLICK
			this.ss.sort=e.currentTarget.id.substring(12);											// Get/set mode name		
			this.DrawResults(); 																	// Redraw
			});		
			
		$("[id^=sui-page]").css("color","#fff");													// Reset pagers
		if (this.ss.page == 0) 		  	  { $("#sui-page1").css("color","#ddd"); $("#sui-pageP").css("color","#ddd"); }	// No back
		if (this.ss.page == lastPage)     { $("#sui-pageN").css("color","#ddd"); $("#sui-pageL").css("color","#ddd"); }	// No forward
		$("#sui-page1").on("click",()=> { this.ss.page=0; this.Query(); });									// ON FIRST CLICK
		$("#sui-pageP").on("click", ()=> { this.ss.page=Math.max(this.ss.page-1,0);  this.Query(); });		// ON PREVIOUS CLICK
		$("#sui-pageN").on("click", ()=> { this.ss.page=Math.min(this.ss.page+1,lastPage); this.Query(); });// ON NEXT CLICK
		$("#sui-pageL").on("click", ()=> { this.ss.page=lastPage; this.Query(); });					// ON LAST CLICK
		$("#sui-typePage").on("change", ()=> {														// ON TYPE PAGE
			var p=$("#sui-typePage").val();															// Get value
			if (!isNaN(p))   this.ss.page=Math.max(Math.min(p-1,lastPage),0);						// If a number, cap 0-last	
			this.Query(); 																			// Get new results
			});							
	}

	DrawItems()																					// DRAW RESULT ITEMS
	{
		var i,str="";
		$("#sui-results").css({ "background-color":(this.ss.view == "List") ? "#fff" : "#ddd" }); 	// White b/g for list only
		for (i=0;i<this.curResults.length;++i) {													// For each result
			if (this.ss.view == "Card")			str+=this.DrawCardItem(i);							// Draw if shoing as cards
			else if (this.ss.view == "Grid")	str+=this.DrawGridItem(i);							// Grid
			else								str+=this.DrawListItem(i);							// List
			}	
		if (!this.curResults.length)																// No results
			str="<br><br><br><div style='text-align:center;color:#666'>Sorry, there were no items found<br>Try broadening your search</div>";
		$("#sui-results").html(str.replace(/\t|\n|\r/g,""));										// Remove format and add to div

		$(".sui-itemIcon").on("click",(e)=> { 														// ON ICON BUTTON CLICK
			var num=e.currentTarget.id.substring(13);												// Get index of result	
			this.SendMessage("page="+this.curResults[num].url_html);								// Send message
			})
		$("[id^=sui-itemPic-]").on("click",(e)=> { 													// ON ITEM CLICK
			var num=e.currentTarget.id.substring(12);												// Get index of result	
			this.SendMessage("page="+this.curResults[num].url_html);								// Send message
			});
		$(".sui-gridInfo").on("mouseover",(e)=> { 													// ON INFO BUTTON HOVER
			var num=e.currentTarget.id.substring(13);												// Get index of result	
			var o=this.curResults[num];																// Point at item
			var str="";
			if (o.title) str+="<b>"+o.title+"</b><br><br>";											// Add title
			str+=this.assets[o.asset_type].g+"&nbsp;&nbsp;"+o.asset_type.toUpperCase();				// Add type
			if (o.asset_subtype) str+=" / "+o.asset_subtype;										// Add subtype
			str+="<br>";
			if (o.creator) str+="<p>&#xe600&nbsp;&nbsp;"+o.creator.join(", ")+"</p>";				// Add creator
			if (o.summary || o.caption) {															// If a summary or caption
				var s1=o.summary || o.caption;														// Use either summary or caption
				if (s1.length > 80)	s1=s1.substr(0,80)+"...";										// Limit size
				str+="<p><div style='display:inline-block;background-color:#ccc;width:4px;height:18px;margin:2px 10px 0 5px;vertical-align:-4px'></div>&nbsp;<i>"+s1+"</i></p>";										// Add summary
				}
			if (o.summary) str+="<p style='font-family:serif;'>"+o.summary+"</p>";					// Add summary
			var p=$("#"+e.currentTarget.id).offset();												// Get position
			this.Popup(str,20,Math.max(8,p.left-220),p.top+24);										// Show popup	
			});
		$(".sui-gridInfo").on("mouseout",(e)=> { $("#sui-popupDiv").remove(); });					// ON INFO BUTTON OUT
		$("[id^=sui-itemTitle-]").on("click",(e)=> { 												// ON TITLE CLICK
			var num=e.currentTarget.id.substring(14);												// Get index of result	
			this.SendMessage("page="+this.curResults[num].url_html);								// Send message
			});
		$(".sui-itemPlus").on("click",(e)=> { 														// ON MORE BUTTON CLICK
			this.ShowItemMore(e.currentTarget.id.substring(13));									// Shoe more info below
			});
	}	
		
	DrawListItem(num)																			// DRAW A LIST ITEM
	{
		var i;
		var o=this.curResults[num];																	// Point at list item
		var str="<div class='sui-item'>";
		str+="<div class='sui-itemPlus' id='sui-itemPlus-"+num+"'>&#xe669</div>";
		str+="<div class='sui-itemIcon' id='sui-itemIcon-"+num+"' style='background-color:"+this.assets[o.asset_type].c+"'>";
		str+=this.assets[o.asset_type].g+"</div>";
		str+="<div class='sui-itemTitle' id='sui-itemTitle-"+num+"'>"+o.title+"</div>";
		if (o.feature_types_ss) {																	// If a feature
			str+="<span style='color:"+this.assets[o.asset_type].c+"'>&nbsp;&bull;&nbsp;</span>";	// Add dot
			str+="<div class='sui-itemFeature'>&nbsp;"+o.feature_types_ss.join(", ")+"</div>";		// Add feature(s)
			}
		str+="<div class='sui-itemId'>"+o.uid;
		if (o.collection_title)																		// If a collection
			str+="<div style='text-align:right;margin-top:2px;'>&#xe633&nbsp;"+o.collection_title+"</div>";		// Add title
		str+="</div>";																				// Close title div
		if (o.ancestors_txt && o.ancestors_txt.length > 1) {										// If has an ancestors trail
			str+="<div class='sui-itemTrail'>";														// Holds trail
			for (i=0;i<o.ancestors_txt.length;++i) {												// For each trail member
				str+="<span class='sui-itemAncestor' onclick='sui.SendMessage(\"page=";				// Add ancestor
				str+="https://mandala.shanti.virginia.edu/"+o.asset_type.toLowerCase()+"/";			// URL stem
				str+=o.ancestor_ids_is[i+1]+"/overview/nojs#search\")'>";							// URL end
				str+=o.ancestors_txt[i]+"</span>";													// Finish ancestor link
				if (i < o.ancestors_txt.length-1)	str+=" > ";										// Add separator
				}
			str+="</div>";																			// Close trail div
			}
		str+="<div class='sui-itemMore' id='sui-itemMore-"+num+"'></div>";							// More area
		return str+"</div>";																		// Return items markup
	}

	ShowItemMore(num)																			// SHOW MORE INFO
	{
		var j,o,s1,str="";
		if ($("#sui-itemMore-"+num).html()) {														// If open
			$("#sui-itemMore-"+num).slideUp(400,()=>{ $("#sui-itemMore-"+num).html(""); } );		// Close it and clear
			return;																					// Quit	
			}
		
		o=this.curResults[num];																		// Point at item
		if (!o.url_thumb.match(/gradient.jpg/)) 													// If not a generic
			str+="<img src='"+o.url_thumb+"' class='sui-itemPic' id='sui-itemPic-"+num+"'>";		// Add pic
		str+="<div class='sui-itemInfo'>";															// Info holder
		str+=this.assets[o.asset_type].g+"&nbsp;&nbsp;"+o.asset_type.toUpperCase();					// Add type
		if (o.asset_subtype) str+=" / "+o.asset_subtype;											// Add subtype
		if (o.creator) str+="<br>&#xe600&nbsp;&nbsp;"+o.creator.join(", ");							// Add creator
		if (o.summary || o.caption) {																// If a summary or caption
			s1=o.summary || o.caption;																// Use either summary or caption
			if (s1.length > 137)	s1=s1.substr(0,137)+"...";										// Limit size
			str+="<br><div style='display:inline-block;background-color:#ccc;width:4px;height:18px;margin:2px 10px 0 5px;vertical-align:-4px'></div>&nbsp;<i>"+s1+"</i>";	// Add summary
			}
		str+="</div>";																				// Close info div
		if (o.summary) str+="<br><div style='font-family:serif'>"+o.summary+"</div>";				// Add summary
		if (o.kmapid_strict && o.kmapid_strict.length) {											// Add related places/subjects
			var places=[],subjects=[];
			str+="<div style='margin-bottom:12px'>";												// Related places and subjects container
			for (j=0;j<o.kmapid_strict.length;++j) {												// For each item
				if (o.kmapid_strict[j].match(/subjects/i))		subjects.push(j);					// Add to subjects
				else if (o.kmapid_strict[j].match(/places/i))	places.push(j);						// Add to places
				}
			str+="<div style='float:left;min-width:200px;'><span style='color:"+this.assets.Places.c+"'>";
			str+="<br><b>"+this.assets.Places.g+"</b></span>&nbsp;RELATED PLACES";					// Add header
			if (places.length) {																	// If any places
				for (j=0;j<places.length;++j) {														// For each place
					str+="<br>";
					if (o.kmapid_strict_ss)															// If has names															
						str+="<span class='sui-itemRelated'>"+o.kmapid_strict_ss[places[j]]+"</span>";	// Add place name
					str+="&nbsp;<span style='font-size:10px;margin-right:40px'>("+o.kmapid_strict[places[j]]+")</span>";	// Add place id
					}
				}
			str+="</div>";																			// End places div
			
			str+="<div><span style='display:inline-block;color:"+this.assets.Subjects.c+"'>";
			str+="<br><b>"+this.assets.Subjects.g+"</b></span>&nbsp;RELATED SUBJECTS";				// Add header
			if (subjects.length) {																	// If any subjects
				for (j=0;j<subjects.length;++j) {													// For each subject
					str+="<br>";
					if (o.kmapid_strict_ss)															// If has names															
						str+="<span class='sui-itemRelated'>"+o.kmapid_strict_ss[subjects[j]]+"</span>"; // Add place name
					str+="&nbsp;<span style='font-size:10px'>("+o.kmapid_strict[subjects[j]]+")</span>"; // Add place id
					}
				}
			str+="</div></div>";																	// End subjects and relateds div
			}
		$("#sui-itemMore-"+num).html(str);															// Add to div
		
		$("#sui-itemMore-"+num).slideDown();														// Slide it down
		$("[id^=sui-itemPic]").on("click",(e)=> { 													// ON PIC CLICK
			var num=e.currentTarget.id.substring(12);												// Get index of result	
			this.SendMessage("page="+this.curResults[num].url_html);								// Send message
			});
		}

	DrawGridItem(num)																			// DRAW GRID ITEM
	{
		var str="<div class='sui-grid'>";
		var o=this.curResults[num];																	// Point at item
		str+="<img src='"+o.url_thumb+"' class='sui-gridPic' id='sui-itemPic-"+num+"'>";			// Add pic
		if (o.url_thumb.match(/gradient.jpg/))	{													// If a generic
			 str+=`<div class='sui-gridGlyph' style='color:${this.assets[o.asset_type].c}'>
			 ${this.assets[o.asset_type].g}
			 <p style='font-size:12px;margin-top:0'>${o.title}</p>
			 </div>`;
			  }
		str+="<div id='sui-gridInfo-"+num+"' class='sui-gridInfo'>&#xe67f</div>";					// Add info button
		return str+"</div>";																		// Return grid markup
	}

	DrawCardItem(num)																			// DRAW CARD ITEM
	{
		var o=this.curResults[num];																	// Point at item
		var g="&#xe633";																			// Collections glyph
		var c="#9e894d";																			// Color
		var label=o.collection_title;																// Set label
		var str="<div class='sui-card'>";															// Overall container
		str+="<div style='width:100%;height:100px;overflow:hidden;display:inline-block;margin:0;padding:0'>";			// Div container
		str+="<img src='"+o.url_thumb+"' class='sui-cardPic' id='sui-itemPic-"+num+"'></div>";		// Add pic
		var gg=this.assets[o.asset_type].g;															// Assume generic icon
		if (o.asset_subtype == "Audio")			gg="&#xe60a";										// Audio
		else if (o.asset_subtype == "Video")	gg="&#xe62d";										// Video
		str+="<div class='sui-cardType'>"+gg+"</div>";												// Show icon
		if (o.url_thumb.match(/gradient.jpg/))														// If a generic
			 str+=`<div class='sui-cardGlyph' style='color:${this.assets[o.asset_type].c}'>${this.assets[o.asset_type].g}</div>`;
		str+="<div class='sui-cardInfo'><div class='sui-cardTitle' id='sui-itemTitle-"+num+"'><b>"+o.title+"</b><br></div>";	// Add title
		str+="<div style='border-top:.5px solid "+c+";height:1px;width:100%;margin:6px 0 6px 0'></div>";	// Dividing line
		if (o.feature_types_ss) str+="&#xe62b&nbsp;&nbsp;"+o.feature_types_ss.join(", ")+"<br>";	// Add feature, if a place
		if (o.data_phoneme_ss)  str+="&#xe635&nbsp;&nbsp;"+o.data_phoneme_ss.join(", ")+"<br>";		// Add phoneme if a term
		if (o.node_user)  		str+="&#xe600&nbsp;&nbsp;"+o.node_user+"<br>";						// Or user 
		if (o.duration_s) 		str+="&#xe61c&nbsp;&nbsp;"+o.duration_s+"<br>";						// Add duration
		if (o.timestamp) 		str+="&#xe60c&nbsp;&nbsp;"+o.timestamp.substr(0,10)+"<br>";			// Add timestamp
		if (o.name_tibt)  		str+="=&nbsp;&nbsp;"+o.name_tibt+"<br>";							// Add Tibettan name
		str+="</div>";																				// End info div
		if (!label)	 { label=o.asset_type; g=this.assets[o.asset_type].g; }							// Generic label if no collection
		str+="<div class='sui-cardFooter' style='background-color:"+c+"'>"+g+"&nbsp;&nbsp;";		// Card footer
		str+="<span style='font-size:11px;vertical-align:2px'>"+label+"<span></div>";				// Add label	
		return str+"</div>";																		// Return items markup
	}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  ADVANCED SEARCH
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	DrawAdvanced()																				// DRAW SEARCH UI SECTION
	{
		var i,j,str;
		for (var key in this.facets) {																// For each facet
			$("#sui-advTerm-"+key).empty();															// Clear list
			for (j=0;j<this.ss.query[key].length;++j) {												// For each term in facet	
				var o=sui.ss.query[key][j];															// Point at facet to add to div
				str=`<div><div class='sui-advTermRem' id='sui-advKill-${key}-${j}'>&#xe60f</div>
					<div class='sui-advEditBool' id='sui-advBool-${key}-${j}' title='Change boolean method'>${this[o.bool]}</div>
					<i> ${o.title}</i></div>`;
				$("#sui-advTerm-"+key).append(str);
				}
			}
	
		$("[id^=sui-advBool-]").on("click",(e)=> {
			var v=e.currentTarget.id.split("-");													// Get ids
			var b=this.ss.query[v[2]][v[3]].bool;													// Get current boolean state
			if (b == "AND")	 		b="OR"; 														// Toggle through options
			else if (b == "OR") 	b="NOT";												
			else 				  	b="AND";															
			$("#"+e.currentTarget.id).html(this[b]);												// Set new value
			this.ss.query[v[2]][v[3]].bool=b;														// Set state
			this.Query();																			// Run query and show results
			});
			
		$("[id^=sui-advKill-]").on("click",(e)=> {
			var v=e.currentTarget.id.split("-");													// Get ids
			this.ss.query[v[2]].splice(v[3],1);														// Remove
			this.DrawAdvanced();																	// Redraw
			this.Query();																			// Run query and show results
			});
		}

	DrawInput(facet)																			// DRAW INPUT FACET PIVKER
	{
		if ($("#sui-advEdit-"+facet).css("display") != "none") {									// If open
			$("#sui-advEdit-"+facet).slideUp();														// Close it 
			return;																			
			}
		var tot=934;
		var str=`<input id='sui-advInput-${facet}' placeholder='Type here'  
		style='width:90px;border:1px solid #999;border-radius:12px;font-size:11px;padding-left:6px'>
		<div class='sui-advEditNums'> <span id='sui-advListNum'>${tot}</span> ${facet}s</div>`;
		$("#sui-advEdit-"+facet).html(str+"</div>".replace(/\t|\n|\r/g,""));						// Add to div
		$("#sui-advEdit-"+facet).slideDown();														// Show it

		$("#sui-advInput-"+facet).on("change",(e)=> {												// ON CHANGE
			var v=e.target.id.split("-");															// Get ids		
			this.AddNewTerm(facet,$("#sui-advInput-"+facet).val(),"","AND");						// Add term to search state
			});
	}

	DrawFacetList(id, open, searchItem)															// DRAW LIST FACET PICKER
	{
		var i;
		var sorted=0;
		if (tot > 300) tot="300+";																	// Too many, cap to 300
		if (!open && ($("#sui-advEdit-"+id).css("display") != "none")) {							// If open
			$("#sui-advEdit-"+id).slideUp();														// Close it 
			return;																			
			}
		
		var items=this.facets[(id == "map") ? "place" : id].data;									// Point at items (use places for map)
		var tot=items.length;																		// Number of items
		var n=Math.min(300,items.length);															// Cap at 300
		if (tot > 300) tot="300+";																	// Too many, cap to 300
		var str=`<input id='sui-advEditFilter-${id}' placeholder='Search this list' value='${searchItem ? searchItem : ""}' 
		style='width:90px;border:1px solid #999;border-radius:12px;font-size:11px;padding-left:6px'>`;
			if (id.match(/place|feature|subject|term|map/))
				str+="<div class='sui-advEditBut' id='sui-advListMap' title='Tree view'>&#xe638</div>";
				str+=`<div class='sui-advEditBut' id='sui-advEditSort-${id}' title='Sort'>&#xe652</div>
				<div class='sui-advEditNums'> <span id='sui-advListNum'>${tot}</span> ${id}s</div>
				<hr style='border: .5px solid #a4baec'>
				<div class='sui-advEditList'>`;
		for (i=0;i<n;++i)																			// For each one
			str+=`<div class='sui-advEditLine' id='sui-advEditLine-${i}'>
			<div class='sui-advViewListPage' id='advViewListPage-${i}' title='View page'>&#xe67c</div>					
			${items[i].title}</div>`;																// Add item to list
		$("#sui-advEdit-"+id).html(str+"</div>".replace(/\t|\n|\r/g,""));							// Add to div
		$("#sui-advEdit-"+id).slideDown();															// Show it
		
		$("[id^=sui-advEditLine-]").on("click",(e)=> {												// ON ITEM CLICK
			var v=e.target.id.split("-");															// Get ids		
			if (v[0].match(/ViewListPage/))	this.SendMessage("page="+items[v[1]].url);				// If viewing, ask for that page
			else	this.AddNewTerm(id,items[v[2]].title,items[v[2]].id,"AND");						// Add term to search state
			});
	
		$("#sui-advEditFilter-"+id).on("keydown",(e)=> {											// ON FILTER CHANGE
			var line,found=0;
			var r=$("#sui-advEditFilter-"+id).val();												// Get filter text
			if ((e.keyCode > 31) && (e.keyCode < 91)) r+=e.key;										// Add current key if a-Z
			var r=RegExp(r,"i");																	// Tuun into regex
			for (i=0;i<n;++i) {																		// For each item
				line=$("#sui-advEditLine-"+i);														// Point at line
				if (line.text().match(r))	line.css("display","block"),found++;					// Show item if it matches
				else						line.css("display","none");								// Hide
				}
			if (found == tot)	$("#sui-advListNum").text(tot);										// All
			else 				$("#sui-advListNum").text(found+"/"+tot);							// Show ones found	
			});

		$("#sui-advEditSort-"+id).on("click",()=> {													// ON SORT BUTTON CLICK
			sorted=1-sorted;																		// Toggle flag	
			str="";
			if (!sorted) {																			// If not sorted
				$(".sui-advEditList").empty();														// Remove items from list
				for (i=0;i<n;++i) 																	// For each one
					str+=`<div class='sui-advEditLine' id='sui-advEditLine-${i}'>
					<div class='sui-advViewListPage' id='advViewListPage-${i}' title='View page'>&#xe67c</div>					
					${items[i].title}</div>`;														// Add item to list
				$(".sui-advEditList").html(str);													// Add back
				$("#sui-advEditSort-"+id).css("color","#666");											// Off
				return;																				// Quit
				}
			var itms=$(".sui-advEditLine");															// Items to sort
			itms.sort(function(a,b) {																// Sort
				var an=$(a).text().substr(2);														// A name past icon and space
				var bn=$(b).text().substr(2);														// B name
				if (an > bn) 		return 1;														// Higher
				else if (an < bn) 	return -1;														// Lower
				else				return 0;														// The same
				});
			itms.detach().appendTo($(".sui-advEditList"));
			$("#sui-advEditSort-"+id).css("color","#668eec");										// On
			});                  
		
		$("#sui-advListMap").on("click", ()=> {														// ON CLICK TREE BUTTON
			this.DrawFacetTree(id,1,$("#sui-advEditFilter-"+id).val());								// Close it and open as tree
			});      
	}

	AddNewTerm(facet, title, id, bool)															// ADD NEW TERM TO SEARCH STATE
	{
		if (facet == "map")	{																		// If a map
			this.ss.query.place=[{ id:id, title:title, bool:bool }];								// Sole query term
			return;																
			}
		var num=this.ss.query[facet].length;														// Number to add to												
		this.ss.query[facet].push({});																// Add obj
		this.ss.query[facet][num].title=title;														// Get title
		this.ss.query[facet][num].id=id;															// Id
		this.ss.query[facet][num].bool=bool;														// Bool
		$("#sui-advEdit-"+facet).slideUp();															// Close window
		this.DrawAdvanced();																		// Redraw
		this.Query();																				// Run query and show results
	}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// TREE 
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	DrawFacetTree(facet, open, searchItem)  													// DRAW FACET TREE
	{
		if (!open && ($("#sui-advEdit-"+facet).css("display") != "none")) {							// If open
			$("#sui-advEdit-"+facet).slideUp();														// Close it 
			return;																			
			}
		var div="#sui-tree"+facet;																	// Tree div
		if (!$(div).length) {																		// If doesn't exist
			var str=`<input id='sui-advTreeFilter' placeholder='Search this list' value='${searchItem ? searchItem : ""}' 
			style='width:90px;border:1px solid #999;border-radius:12px;font-size:11px;padding-left:6px'>
			<div class='sui-advEditBut' id='sui-advTreeMap' title='List view'>&#xe61f</div>
			<hr style='border: .5px solid #a4baec'>
			<div id='sui-tree${facet}' class='sui-tree'></div>`;		
			$("#sui-advEdit-"+facet).html(str.replace(/\t|\n|\r/g,""));									// Add tree frame to div
			if (facet == "place") 		 LazyLoad(null,facet,13735);
			else if (facet == "map") 	 LazyLoad(null,facet,13735);
			else if (facet == "feature") LazyLoad(null,facet,20);
			else 						 GetTopRow(facet);
	
			$('.sui-tree li').each( function() {                                						// For each element
				if ($(this).children('ul').length > 0)                       							// If has children 
					$(this).addClass('parent');                              							// Make parent class
				});

			$('.sui-advViewTreePage').on("click", (e)=> {												// ON CLICK VIEW BUTTON
				var v=e.target.id.split("-");															// Get id
				this.SendMessage("page=https://mandala.shanti.virginia.edu/"+v[1]+"/overview/nojs");	// Goto page
				e.stopPropagation();																	// Stop propagation
				});      
			$('.sui-tree li > a').on("click", function(e) {												// ON CLICK OF NODE TEXT
				handleClick($(this),e);  																// Handle
				});      
			$("#sui-advTreeMap").on("click", ()=> {														// ON CLICK LIST BUTTON
				this.DrawFacetList(facet,1,$("#sui-advTreeFilter").val());								// Close it and open as list
				});      
			$("#sui-advTreeFilter").on("keydown", (e)=> {												// ON TYPING IN TEXT BOX
				this.DrawFacetList(facet,1,$("#sui-advTreeFilter").val());								// Close it and open as list
				$("#sui-advEditFilter-"+facet).focus();													// Focus on input in list
				});      
			}
	
		$("#sui-advEdit-"+facet).slideDown();															// Show it
			
		function handleClick(row, e)																// HANDLE NODE CLICK
		{
			if (e.offsetX < 20) {                                         				  				// In icon
				if (row.parent().children().length == 1) 												// If no children
					LazyLoad(row,facet);																// Lazy load from SOLR
				else{																					// Open or close
					row.parent().toggleClass('active');                         						// Toggle active class on or off
					row.parent().children('ul').slideToggle('fast');            						// Slide into place
					}
				}
			else{
				var s=$("#"+e.target.id).text();														// Get term
				s=s.substr(0,s.length-1);																// Remove viewer icon
				sui.AddNewTerm(facet,s,e.target.id,"AND");												// Add term to search state and refresh
				}
		}

		function GetTopRow(facet, sort)																// GET TOP-MOST TREE LEVEL
		{
			var i,o,str="<ul>";
			var base="https://ss395824-us-east-1-aws.measuredsearch.com/solr/kmterms_prod";				// Base url
			var url=buildQuery(base,facet+"s","/",1,1);													// Build query
			$.ajax( { url: url, dataType: 'jsonp' } ).done(function(res) {								// Run query
				trace(res)
				for (i=0;i<res.response.docs.length;++i) {												// For each child
					o=res.response.docs[i];																// Point at child
					str+="<li class='parent'><a id='"+o.id+"'";											// Start row
					str+="' data-path='"+o.ancestor_id_path+"'>"+o.header;								// Add path/header
					str+="<div class='sui-advViewTreePage' id='advViewTreePage"+o.id+"' title='View page'>&#xe67c</div>";					
					str+="</a></li>";																	// Add label
					}
				$("#sui-tree"+facet).html(str+"</ul>");													// If initing 1st level
				$('.sui-tree li > a').off();															// Clear handlers
				$('.sui-tree li > a').on("click",function(e) { handleClick($(this),e); }); 				// Restore handler
				});
		}

		function LazyLoad(row, facet, init) 													// ADD NEW NODES TO TREE
		{
			var path;
			if (init || row.parent().children().length == 1) {										// If no children, lazy load 
				var base="https://ss395824-us-east-1-aws.measuredsearch.com/solr/kmterms_prod";		// Base url
				if (init) 	path=""+init;															// Force path as string
				else 		path=""+row.data().path;												// Get path	as string										
				var lvla=path.split("/").length+1;													// Set level
				var type=facet+"s";																	// Set type
				if (type == "features") type="subjects";											// Feature types are in subjects
				else if (type == "maps") type="places";												// Maps are places
				var url=buildQuery(base,type,path,lvla,lvla);										// Build query
					$.ajax( { url: url, dataType: 'jsonp' } ).done(function(res) {						// Run query
					var o,i,re;
					var str="<ul>";																	// Wrapper, show if not initting
					var f=res.facet_counts.facet_fields.ancestor_id_path.join();					// List of facets
					res.response.docs.sort(function(a,b) { return (a.header > b.header) ? 1 : -1 }); // Sort
					
					for (i=0;i<res.response.docs.length;++i) {										// For each child
						o=res.response.docs[i];														// Point at child
						re=new RegExp("\/"+o.id.split("-")[1]);										// Id
						str+="<li";																	// Start row
						if ((f && f.match(re)) || init)	str+=" class='parent'"						// If has children or is top, add parent class
						str+="><a id='"+o.id;														// Add id
						str+="' data-path='"+o.ancestor_id_path+"'>";								// Add path
						str+=o.header;																// Add label
						str+="<div class='sui-advViewTreePage' id='advViewTreePage"+o.id+"' title='View page'>&#xe67c</div>";					
						str+="</a></li>";															// Add label
						}
					if (res.response.docs.length) {
						if (init)	$("#sui-tree"+facet).html(str+"</ul>");							// If initing 1st level
						else{																		// Adding a level to a branch
							row.after(str+"</ul>");													// Add children to tree
							row.parent().toggleClass('active');                         			// Toggle active class on or off
							row.parent().children('ul').slideToggle('fast');            			// Slide into place
							}
						$('.sui-tree li > a').off();												// Clear handlers
						$('.sui-tree li > a').on("click",function(e) { handleClick($(this),e); }); 	// Restore handler
						}
	
					$('.sui-advViewTreePage').on("click", (e)=> {									// ON CLICK VIEW BUTTON
						var v=e.target.id.split("-");												// Get id
						sui.SendMessage("page=https://mandala.shanti.virginia.edu/"+v[1]+"/overview/nojs"); // Goto page
						e.stopPropagation();														// Stop propagation
						});      
			
					});
				}
			}

	// THIS FUNCTION IS STRAIGHT FROM YUJI 3/15/18 --  sites/all/libraries/shanti_kmaps_tree/js/jquery.kmapstree.js

	function buildQuery(termIndexRoot, type, path, lvla, lvlb) 
	{
		path = path.replace(/^\//, "").replace(/\s\//, " ");  // remove root slashes
		if (path === "") {
			path = "*";
		}

		var fieldList = [
			"header",
			"id",
			"ancestor*",
			"caption_eng",
			"level_i"
		].join(",");

		var result =
			termIndexRoot + "/select?" +
			"df=ancestor_id_path" +
			"&q=" + path +
			"&wt=json" +
			"&indent=true" +
			"&limit=" + 2000 +
			"&facet=true" +
			"&fl=" + fieldList +
			"&indent=true" +

			"&fq=tree:" + type +
			"&fq=level_i:[" + lvla + "+TO+" + (lvlb + 1) + "]" +
			"&fq={!tag=hoot}level_i:[" + lvla + "+TO+" + lvlb + "]" +

			"&facet.mincount=2" +
			"&facet.limit=-1" +
			"&sort=level_i+ASC" +
			"&facet.sort=ancestor_id_path" +
			"&facet.field={!ex=hoot}ancestor_id_path" +

			"&wt=json" +
			"&json.wrf=?" +

			"&rows=" + 2000;

			return result;
		}
	}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// HELPERS
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	LoadingIcon(mode, size)																		// SHOW/HIDE LOADING ICON		
	{
		if (!mode) {																				// If hiding
			$("#sui-loadingIcon").remove();															// Remove it
			return;																					// Quit
			}
		var str="<img src='loading.gif' width='"+size+"' ";											// Img
		str+="id='sui-loadingIcon' style='position:absolute;top:calc(50% - "+size/2+"px);left:calc(50% - "+size/2+"px);z-index:5000'>";	
		$("#sui-results").append(str);																// Add icon to results
	}

	SendMessage(msg, time)																		// SEND MESSAGE TO HOST
	{
		if (this.pages && (this.runMode == "standalone")) {											// If a standalone													
			this.pages.Draw(msg);																	// Route to page
			return;
			}
		trace("sui="+msg);																			// Show message sent on console
		window.postMessage("sui="+msg,"*");															// Send message to drupal app
		this.Draw("input");																			// Return to hidden mode
		}

	Popup(msg, time, x, y)																		// POPUP 
	{
		var str="";
		$("#sui-popupDiv").remove();																// Kill old one, if any
		str+="<div id='sui-popupDiv' class='sui-gridPopup' style='left:"+x+"px;top:"+y+"px'>"; 		// Add div
		str+=msg+"</div>"; 																			// Add content
		$("body").append(str);																		// Add popup to div or body
		$("#sui-popupDiv").fadeIn(500).delay(time ? time*1000 : 3000).fadeOut(500);					// Animate in and out		
	}

} // SearchUI class closure
