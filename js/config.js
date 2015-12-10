var config = {

// host to nodejs   $ node app.js
	host : 'vds745.sivit.org',
	port : 443,
	timeout : 5000, //5s
	max_reconnection_attempts: 10,

//when you upload some picture, set here the resizing params.
//(ratio's preserved)
	imageUpload : {
		maxheight:350,
		maxwidth:500
	},
//the resized pictures will be uploaded in this format
	canvas : {
		type:'image/jpeg', // image/jpeg, image/png, image/webp
		quality:0.70 // only for image/jpeg, from 0.0 to 1.0 (highest)
	},
// set to false to prevent from clearing the chat on channel change
	clearOnChannelChange:false
};
