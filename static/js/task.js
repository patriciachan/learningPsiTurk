/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object
var psiTurk = PsiTurk();

// All pages to be loaded
var pages = [
	"instruct.html",
	"test.html",
	"postquestionnaire.html"
];

psiTurk.preloadPages(pages);

// Task object to keep track of the current phase
var currentview;

/********************
* HTML manipulation
*
* All HTML files in the templates directory are requested 
* from the server when the PsiTurk object is created above. We
* need code to get those pages from the PsiTurk object and 
* insert them into the document.
*
********************/


/*************************
* INSTRUCTIONS         
*************************/

var Instructions = function(pages) {
	var currentscreen = 0,
	    timestamp;
	    instruction_pages = pages; 
	
	var next = function() {
		psiTurk.showPage(instruction_pages[currentscreen]);
		$('.continue').click(function() {
			buttonPress();
		});
		
		currentscreen = currentscreen + 1;

		// Record the time that an instructions page is presented
		timestamp = new Date().getTime();
	};

	var buttonPress = function() {

		// Record the response time
		var rt = (new Date().getTime()) - timestamp;
		psiTurk.recordTrialData(["INSTRUCTIONS", currentscreen, rt]);

		if (currentscreen == instruction_pages.length) {
			finish();
		} else {
			next();
		}

	};

	var finish = function() {
		// Record that the user has finished the instructions and 
		// moved on to the experiment. This changes their status code
		// in the database.
		//psiTurk.finishInstructions();

		// Move on to the experiment 
		currentview = new TestPhase();
	};

	next();
};




/********************
* STROOP TEST       *
********************/

var TestPhase = function() {

	var wordon, // time word is presented
	    listening = false,
	    resp_prompt = '<p id="prompt">Press the 1, 2, 3, 4, 5, 6, or 7 key in order to make your decision. <br>1 = not at all related <br>7 = highly related';
	
	var words_loaded = false;

	var next = function() {
		var show_stims = function(stims){
			if (words_loaded == false){
				//console.log(stims.stim)
				//console.log(typeof stims.stim);
				word_pair = stims.stim;
				word_pair = _.shuffle(word_pair);
				console.log(typeof word_pair);
				//console.log(word_pair);
				words_loaded = true; 
			}

			//console.log(word_pair[0]);

			if (word_pair.length===0) {
				finish();
			}
			else {
				// stims = _.shuffle(stims);
				
				x = Math.round(Math.random());
				if (x == 0){y=1;};
				if (x ==1){y=0;};
				stimJoin = word_pair[0][x] + "  " + word_pair[0][y]
				show_word(stimJoin);
				wordon = new Date().getTime();
				listening = true;
				$('#query').html(resp_prompt).show();
				word_pair.shift();
				console.log(word_pair.length); 
			} 

		}

		//condition = 0; 

		if (condition == 0){var url_stim = "static/stimuli/stimuli1.json";}
		else if(condition == 1) {var url_stim = "static/stimuli/stimuli2.json";}
		else if(condition == 2) {var url_stim = "static/stimuli/stimuli3.json";}
		else {var url_stim = "static/stimuli/stimuli4.json";}

		var url_stim = "static/stimuli/stimuli_filler3.json";
		//console.log(condition);
		//console.log(url_stim);

		$.ajax({
				dataType: "json", 
				url: url_stim,
				async: false,
				success: function(resp) {
					show_stims(resp); 
				},
				error: function(resp){
					console.log("Error");
				}
			}); 
	};
	
	var response_handler = function(e) {
		if (!listening) return;

		var keyCode = e.keyCode,
			response;

		switch (keyCode) {
			//Num row keys
			case 49:
				// "1"
				response="1";
				break;
			case 50:
				// "2"
				response="2";
				break;
			case 51:
				// "3"
				response="3";
				break;
			case 52: 
				//4
				response="4";
				break;
			case 53: 
				//5
				response="5";
				break;
			case 54: 
				//6
				response="6";
				break;
			case 55: 
				//7
				response="7";
				break;	
			//Numpad keys	
			case 97:
				// "1"
				response="1";
				break;
			case 98:
				// "2"
				response="2";
				break;
			case 99:
				// "3"
				response="3";
				break;
			case 100: 
				//4
				response="4";
				break;
			case 101: 
				//5
				response="5";
				break;
			case 102: 
				//6
				response="6";
				break;
			case 103: 
				//7
				response="7";
				break;	

			default:
				response = "";
				break;
		}
		if (response.length>0) {
			listening = false;
			//var hit = response == stim[1];
			var rt = new Date().getTime() - wordon;

			psiTurk.recordTrialData(["TEST", stim[0], stim[1], stim[2], response, rt]);
			
			remove_word();
			next();
		}
	};

	var finish = function() {
		$("body").unbind("keyup", response_handler); // Unbind keys
		currentview = new Questionnaire();
	};
	
	
	// Load the test.html snippet into the body of the page
	psiTurk.showPage('test.html');
	
	// This uses the Raphael library to create the stimulus. Note that when
	// this is created the first argument is the id of an element in the
	// HTML page (a div with id 'stim')
	var R = Raphael("stim", 1000, 200),
		font = "80px Helvetica";
	
	var show_word = function(text) {
		R.text( 500, 100, text ).attr({font: font, fill:"white"});
	};
	var remove_word = function(text) {
		R.clear();
	};

	// Register the response handler that is defined above to handle any
	// key down events.
	$("body").focus().keyup(response_handler); 

	// Start the test
	next();
};


/****************
* Questionnaire *
****************/

var Questionnaire = function() {

	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	record_responses = function() {

		psiTurk.recordTrialData(['postquestionnaire', 'submit']);

		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);		
		});

	};
	
	finish = function() {
		completeHIT();
	};
	
	prompt_resubmit = function() {
		replaceBody(error_message);
		$("#resubmit").click(resubmit);
	};

	resubmit = function() {
		replaceBody("<h1>Trying to resubmit...</h1>");
		reprompt = setTimeout(prompt_resubmit, 10000);
		
		psiTurk.saveData({
			success: function() {
				clearInterval(reprompt); 
				finish();
			}, 
			error: prompt_resubmit}
		);
	};

	// Load the questionnaire snippet 
	psiTurk.showPage('postquestionnaire.html');
	psiTurk.recordTrialData(['postquestionnaire', 'begin']);
	
	$("#continue").click(function () {
		record_responses();
		psiTurk.teardownTask();
    	psiTurk.saveData({success: finish, error: prompt_resubmit});
	});
	
};


var completeHIT = function() {
	// save data one last time here?
	window.location= adServerLoc + "/complete?uniqueId=" + psiTurk.taskdata.id;
}


/*******************
 * Run Task
 ******************/
$(window).load( function(){
    currentview = new Instructions([
		"instruct.html"
	]);
});

// vi: noexpandtab tabstop=4 shiftwidth=4
