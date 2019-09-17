class Pages  {																					

	constructor()   																		// CONSTRUCTOR
	{
	}

	Draw(url)
	{
		if (!url)	return;																		// Quit if no messge
		trace(url,url.match(/\/source\//i))
//		var id=url.match(/\/(\d+)\//)[1];														// Extract id
		if (url.match(/\places\//i)) 			sui.places.Draw(317);							// Show map
		else if (url.match(/\/source\//i)) 		this.DrawSources(url);							// Show sources
	}

	DrawSources(url)
	{
	var id=url.match(/\/source\/(.*)/i)[1];
	}


} // Pages class closure
