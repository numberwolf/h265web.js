function getMediaURL(mediaFile) {
	let mediaURI = mediaFile;
	if (mediaFile.indexOf("http") >= 0) {
		mediaURI = mediaFile;
	} else {
		if (mediaFile[0] === '/') {
			if (mediaFile[1] === '/') {
				mediaURI = 'http:' + mediaFile;
			} else {
				mediaURI = window.location.origin + mediaFile
			}
		} else if (mediaFile[0] === ':') {
			mediaURI = 'http' + mediaFile;
		} else {
			let split_ret = window.location.href.split('/');
			mediaURI = window.location.href.replace(
				split_ret[split_ret.length - 1], mediaFile);
		}
	}

	return mediaURI;
} // end function getMediaURL