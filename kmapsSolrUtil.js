/*
Kmaps Solr Util to encaspulate solr query assembly logic

Usage:

        var util = new KmapsSolrUtil();
        var url = util.createBasicQuery(state);

    createBasicQuery(state) uses a populated "state" object and returns the appropriate url as a String.

 */
class KmapsSolrUtil {

    constructor(jq) {
        // check to make sure that jQuery is available
        if (typeof jQuery !== "function")
            $ = jQuery;

        if (typeof $ === "undefined") {
            throw("This libraries requires jQuery");
        }

        // this is the default state, state that is passed in overrides these values
        this.defaultState = {
            "solrUrl": "https://ss251856-us-east-1-aws.measuredsearch.com/solr/kmassets_dev/select",
            "mode": "input",
            "view": "Card",
            "sort": "Alpha",
            "type": "All",
            "page": 0,																			// Current page being shown
            "pageSize": 100,																	// Results per page
            "query": { 																		// Current query
                "text": "",																			// Search word
                "places": [],																			// Places
                "collections": [],																		// Collections
                "languages": [],																		// Languages
                "features": [],																			// Feature types
                "subjects": [],																			// Subjects
                "terms": [],																			// Terms
                "relationships": [],																	// Relationships
                "users": [],																			// Users
                "assets": [],																			// Assets
                "dateStart": "",
                "dateEnd": ""															// Beginning and ending dates
            }
        };

        // facet configs.  Not all are being used.
        this.facetJSON = {
            "asset_counts": {
                "limit": 100,
                "type": "terms",
                "field": "asset_type",
                "domain": {"excludeTags": "ast"}
            },
            "places": {
                "limit": 300,
                "type": "terms",
                "field": "kmapid",
                "prefix": "places",
                "facet": {
                    "title": {
                        "limit":1,
                        "type":"terms",
                        "field":"title"
                    }
                }
            },
            "subjects": {
                "limit": 300,
                "type": "terms",
                "field": "kmapid",
                "prefix": "subjects",
                "facet": {
                    "title": {
                        "limit":1,
                        "type":"terms",
                        "field":"title"
                    }
                }
            },
            "collection_nid": {
                "limit": 300,
                "type": "terms",
                "field": "collection_nid",
                "facet": {
                    "collection_title": {
                        "limit":1,
                        "type":"terms",
                        "field":"collection_title"
                    }
                }
            },
            "asset_subtype": {
                "limit": 300,
                "type": "terms",
                "field": "asset_subtype",
                "facet": {
                    "parent_type": {
                        "limit": 1,
                        "type": "terms",
                        "field": "asset_type"
                    }
                }
            },
            "feature_types_ss": {
                "limit": 300,
                "type": "terms",
                "field": "feature_types_ss"
            },
            "node_user": {
                "limit": 300,
                "type": "terms",
                "field": "user_name_full_s"
            },
            "node_lang": {
                "limit": 300,
                "type": "terms",
                "field": "node_lang"
            }
        };


        this.facetAdvancedJSON = {
            related:{
                domain:{blockChildren:"block_type:parent"},
                type:"terms",
                field:"related_subjects_relation_code_s",
                limit:-1,
                facet:{
                    related_subject: {
                        type: "terms",
                        field: "related_subjects_id_s",
                        limit: -1,
                        facet: {
                            related_subject_name: {
                                type: "terms",
                                field: "related_subjects_header_s",
                                limit: 1
                            }
                        }
                    }
                }
            }
        };
    }

    createBasicQuery(state) {
        state = $.extend(true, {}, this.defaultState, state);

        // create request object

        // console.error("State = " + JSON.stringify(state, undefined, 2));


        var searchstring = state.query.text || "";
        var page = state.page || 0;
        var pageSize = state.pageSize || 100;
        // console.log (JSON.stringify(state));
        var starts = searchstring + "*";
        var search = "*" + searchstring + "*";
        var slashy = searchstring + "/";
         if ($.type(searchstring) === "undefined" || searchstring.length === 0 ) {
             searchstring = search = slashy = "*";
         }
         var start = page * pageSize;


         var fq_array = [];

         // places
        if (state.query.places && state.query.places.length) {
            fq_array.push(this.buildFq(state.query.places, "kmapid"));
        }

        // subjects
        if (state.query.subjects && state.query.subjects.length) {
            fq_array.push(this.buildFq(state.query.subjects, "kmapid"));
        }

        // features
        if (state.query.features && state.query.features.length) {
            fq_array.push(this.buildFq(state.query.features, "feature_types_ss", "title"));
        }

        // collections
        if (state.query.collections && state.query.collections.length) {
            fq_array.push(this.buildFq(state.query.collections, "collection_title", "title"));
        }

        // languages
        if (state.query.languages && state.query.languages.length) {
            fq_array.push(this.buildFq(state.query.languages, "node_lang", "title"));
        }

        // console.log(JSON.stringify (fq_array, undefined, 2));

        var req =
            {
                // search: tweak for scoping later
                "q": "(" +
                    " title:${xact}^100" +
                    " title:${slashy}^100" +
                    " names_txt:${xact}^90" +
                    " title:${starts}^80" +
                    " names_txt:${starts}^70" +
                    " title:${search}^10" +
                    " caption:${search}" +
                    " summary:${search}" +
                    " names_txt:${search}" +
                    ")",

                // search strings
                "xact": searchstring,
                "starts": starts,
                "search": search,
                "slashy": slashy,

                // generic settings (maybe tweak for efficiency later)
                "fl": "*",
                "wt": "json",

                // paging
                "start": start,
                "rows": pageSize,

                // facets
                "facet": "on",
                "json.facet": JSON.stringify(this.facetJSON),

                // highlighting
                "hl": "on",
                "hl.method": "unified",
                "hl.fl": "title,caption,summary,names_txt",
                "hl.fragsize": 0,
                "hl.tag.pre": "<mark>",
                "hl.tag.post": "</mark>",
                // debug settings  -- set both to false in production?
                "echoParams": "explicit",
                "indent": "true"
            };

        var baseurl = state.solrUrl;
        var params = new URLSearchParams(req);

        // process the fq's

        for (var i = 0; i < fq_array.length; i++) {
            params.append("fq",fq_array[i]);
        }
        var url = new URL(baseurl + "?" + params.toString());
        return url;
    }


    buildFq(facets, facet_field, type) {

        if (!type) { type = "id"; };
        // console.log("Got facet values: " + JSON.stringify(facets));
        var st = "";
        for (var i = 0; i < facets.length; i++) {
            var entry = facets[i];
            // console.log("Got facet: " + JSON.stringify(entry));
            var km = entry[type];
            var op = "";

            if (entry.bool === "AND") {
                op = "+";
            } else if (entry.bool === "NOT") {
                op = "-";
            } else if (entry.bool === "OR") {
                op = "";
            } else {
                console.error("Unknown operator = " + entry.bool + " : " + JSON.stringify(entry));
            }

            st += " " + op + "\"" + km + "\"";
        }

        var fq = facet_field +
            ":(" + st + ")";
        // console.log("FQ: " + fq);
        return fq;
    }

    createAdvancedFacetQuery(state) {
        state = $.extend(true, {}, this.defaultState, state);

        state.solrUrl= "https://ss251856-us-east-1-aws.measuredsearch.com/solr/kmterms_dev/select"

        // create request object

        var searchstring = state.query.text || "";
        var page = state.page || 0;
        var pageSize = state.pageSize || 100;
        // console.log (JSON.stringify(state));
        var starts = searchstring + "*";
        var search = "*" + searchstring + "*";
        var slashy = searchstring + "/";
        if ($.type(searchstring) === "undefined" || searchstring.length === 0 ) {
            searchstring = search = slashy = "*";
        }

        var req =
            {
                // search: tweak for scoping later
                "q": "(" +
                    " header:${xact}^100" +
                    " header:${slashy}^100" +
                    // " names_txt:${xact}^90" +
                    " header:${starts}^80" +
                    // " names_txt:${starts}^70" +
                    " header:${search}^10" +
                    // " caption:${search}" +
                    // " summary:${search}" +
                    // " names_txt:${search}" +
                    ")",

                // search strings
                "xact": searchstring,
                "starts": starts,
                "search": search,
                "slashy": slashy,

                // generic settings (maybe tweak for efficiency later)
                "fl": "*,[child parentFilter=block_type:parent]",
                "wt": "json",

                // paging
                "start": page,
                "rows": pageSize,

                // facets
                "facet": "on",
                "json.facet": JSON.stringify(this.facetAdvancedJSON),

                // highlighting
                // "hl": "on",
                // "hl.method": "unified",
                // "hl.fl": "header,caption,summary,names_txt",
                // "hl.fragsize": 0,
                // "hl.tag.pre": "<mark>",
                // "hl.tag.post": "</mark>",

                // debug settings  -- set both to false in production?
                "echoParams": "explicit",
                "indent": "true"
            };

        var baseurl = state.solrUrl;
        var params = new URLSearchParams(req);
        var url = new URL(baseurl + "?" + params.toString());
        return url;
    }




	
	buildQuery(termIndexRoot, type, path, lvla, lvlb) 
	{
		var SOLR_ROW_LIMIT=2000;
		path = path.replace(/^\//, "").replace(/\s\//, " ");  // remove root slashes
		if (path === "") {
			path = "*";
		}

		var levelField = "level_i";
		var ancestorField = "ancestor_id_path";
		if (type === "terms") {
		  levelField = "level_tib.alpha_i";
		  ancestorField = "ancestor_id_tib.alpha_path";
		}

	  var fieldList = [
			"header",
			"id",
			"ancestor*",
			"caption_eng",
			"position*",
			levelField
		].join(",");

		var result =
			termIndexRoot + "/select?" +
			"df=" + ancestorField+
			"&q=" + path +
			"&wt=json" +
			"&indent=true" +
			"&limit=" + SOLR_ROW_LIMIT +
			"&facet=true" +
			"&fl=" + fieldList +
			"&indent=true" +

			"&fq=tree:" + type +
			"&fq=" + levelField + ":[" + lvla + "+TO+" + (lvlb + 1) + "]" +
			"&fq={!tag=hoot}" + levelField + ":[" + lvla + "+TO+" + lvlb + "]" +

			"&facet.mincount=2" +
			"&facet.limit=-1" +
		  "&sort=" + levelField + "+ASC" +
			"&sort=position_i+asc" +
		   "&sort=header+asc" +

			"&facet.sort=" + ancestorField +"+ASC" +
			"&facet.field={!ex=hoot}" + ancestorField +

			"&wt=json" +
			"&json.wrf=?" +
			"&rows=" + SOLR_ROW_LIMIT;
		return result;
	}

	buildAssetQuery(queryObj)
	{
	   var url = this.createBasicQuery(queryObj);
        // console.log("Returning " + url);
		return url;
	}


}