
$( document ).ready(function() {
	
	// These are variables that point to html elements.
	
	var $programsDropdown = $("#allPrograms");
	var $interfaceLevelThree = $("#interfaceLevelThree");
	var $programName = $("#programName");
	var $termDropdown = $("#termDropdown");
	var $termDropdownContainer = $("#termDropdownContainer");
	var $numSemesters = $("#numSemesters");
	var $numSemestersContainer = $("#numSemestersContainer");
	var $coursePriority = $(".coursePriority");
	var $courseName = $(".courseName");
	var $courseTerm = $(".courseTerm");
	var $termName = $(".termName");
	var $termUnits = $(".termUnits");
	var $removeTermOptions = $(".removeTermOptions");
	var $courseOptions = $("#courseOptions");
	var $courseOptionsContainer = $("#courseOptionsContainer");
	var $termOptions = $("#termOptions");
	var $termOptionsContainer = $("#termOptionsContainer");
	var $courseDropdown = $("#courseDropdown");
	var $courseDropdownContainer = $("#courseDropdownContainer");
	var $generateRCS = $("#generateRCS");
	var $interfaceLevelFour = $("#interfaceLevelFour");
	var $courseToRemove = [];
	var $termToRemove = [];
	var programTerms;
	var serverUrl = "redacted";
	var $unitPrgrmRqmnt = $("#unitPrgrmRqmnt");
	var $unitDegRqmnt = $("#unitDegRqmnt");
	var $RCSDynamicContentWrapper = $("#RCSDynamicContentWrapper")
	var $programNameElem = $("#schedule_ProgramName");
	var $coordinatorElem = $("#schedule_Coordinator");
	var $departmentElem = $("#schedule_Department");
	var $effectiveElem = $("#schedule_Effective");
	var timerDiv;
	var $moreOptionsButton = $("#moreOptionsButton");
	var $startSemesterContainer = $("#startSemesterContainer");
	var $courseSpreadContainer = $("#courseSpreadContainer");
	var $courseSpread = $("#courseSpread");
	var $alternateButton = $("#alternateButton");
	var $printButton = $("#printButton");
	var latestResponse; // Equal to the latest response from the server whether it's a token or an actual response
	var token = null; // Equal to the earliest active token recieved from the server
	var token2 = null; // Equal to  the latest active token recieved from the server
	var totalPossibleUnits = 0; // This will be used to check if the program can be completed given the parameters set. Unit/term wise.
	var scheduleNumber = -1; // Reset to negative one everytime Generate RCS button is clicked. Itterated everytime the function to generate a new schedule is exectured.
	var $infoArea = $("#infoArea");
	var initialProgramDetails = false;
	$moreOptionsButton.hide();
	$interfaceLevelFour.hide();
	
	// This function is called directly if circumstances require a real warning to the user.
	// Otherwise it is called by timer which is a function created for timing a server request and presenting a pleast wait screen
	// Parameter one is non-optional text of the div to show. Killable is an optional boolean. If true, will allow user to destroy waiting message. 
	function notice(text, killable){
		timerDiv = $("<div>").attr("id","notice");
		timerDiv.append("<p class='blink'>"+text+"</p>");
		killable == true ? timerDiv.append("<button id='killNotice' class='btn-danger'>OK</button>") : killable = killable;
		$("body").append(timerDiv);
		$("#notice button").click(function(){
			timerDiv.remove();
		})
	}
	
	// General Function for timing the server and giving waiting message
	
			// This function times the request. should be called after request . And I believe we will execute this function upon recieving a token.
		function timer(text){
			
			$("#notice").length == false ? notice(text) : $("#notice").remove() && notice(text);
			var iterator = 0;
			function runEvery1s(){
				setTimeout(function(){
					
					// Setup Json
					var sendToken = {};
					sendToken.Token = token;
					sendToken = JSON.stringify(sendToken);
					var jqxhr = $.post(serverUrl, {argv:sendToken}, function(response){
						latestResponse = JSON.parse(response);
						if( latestResponse.Status == "Pending" ){
							token = latestResponse.Token;
							if(iterator < 60){
								runEvery1s();
							}
						}
						else
						{
							$("#notice").remove(); // Once we are running this part of the function we implicitly know we recieved a response. So it's good to delete the 'waiting' element
							if(latestResponse.Result.Programs){
								setUpProgramsList();
							}
							else if(latestResponse.Result['Configurable Courses'] && initialProgramDetails == true){
								setUpProgramDetails();
							}
						}
					})

					iterator++;
				}, 1000)
			}
			
			runEvery1s();
			

		}
		
		
	// This function exists so that a term item may be delete by passing only that term's number as a parameter
	function deleteTermByNumber(termNumber){
		var termsArray = $termOptions.find(".termName");
		termsArray.each(function(index){
			termNumber == $(this).text().substr(-1) ? $("#term" + termNumber).remove() : termNumber = termNumber;
		})
	}
	
	// General function to escape periods in ids and classes
	// This needs to be used when calling any IDs
	function escapePeriods(string){
		string = string.replace(".","\\.");
		return string;
	}
		
	// Just a general function that can be used for clearing the values of html elements	
	function clearFunc(element){
		element.attr("id") == "courseDropdown" ? $termOrCourse = "course" : $termOrCourse = "term" ;
		element == $("select") ? element.html("<option value='-1'>" + "Select a " + $termOrCourse) : element.html("");
	}
	
	function genClearFunc(element){
		element.html("");
	}
	
	// This specifically deletes a course or a term from interface level three and adds it back to the dropdown in interface level two
	function deleteItem(event){
		var itemToAddBack;
		var $parent = event.currentTarget.getAttribute("parent"); // Custom html attr used to relate button to item it can effect
		// The following two lines convert the parent attr value that has spaces into a non-spaced ID that already exists 
		var $theId = $parent.split(" ");
		var $theId = $theId.join("");
		// Below: remove the item
		$("#" + escapePeriods( $theId ) ).remove();
		//Now add that course back to the drop down
		if( $theId.includes("term") ){
			// Loop through all items that previously were removed from drop down. ( these are items in interface level three now)
			$termToRemove.forEach(function(item){
				// Check if the custom parent attribute value is equal to the current item. If it is, assign it a variable
				 item.val().indexOf($parent) !== -1 ? itemToAddBack = item : itemToAddBack = itemToAddBack;
			})
			// Now append that variable/item back to the drop down.
			$termDropdown.append(itemToAddBack);
			$termDropdown.val('-1');
		}
		// If it is not a term it is a course.
		else{
			$courseToRemove.forEach(function(item){
				 item.val().indexOf($theId) !== -1 ? itemToAddBack = item : itemToAddBack = itemToAddBack;
			})
			$courseDropdown.append(itemToAddBack);
			$courseDropdown.val('-1');
		}
		// You just removed an item. So let's lower the min attribute of the number of semesters input.
		interfaceLevelTwo.setMinTerms();
		// Below I need to remove items from the Term to remove array. Because the updateTermDropdown function
		// does not add terms back to the dropdown that were previously removed from it. But it needs to add
		// those terms back if they have been deleted from the modification zone.
		// This function isn't working but isn't breaking anything either.
		// Fix
		$.each($termToRemove, function(index, value){
			// Does this term in termToRemove function math the X button that was clicked
			if( JSON.stringify(value['selector']).substring(-3, -2) ==  $parent.substr(-1)){
				$termToRemove.remove(index);
			}
		})
	}
	
	// Let's now set up the four interface objects
	// Each interface object creates itself.
	
	// interfaceLevelOne Creates program drop down
	function interfaceLevelOne(){
		
		var creatorObject = {};
		
		creatorObject.$programsObject;
		creatorObject.$allPrograms;
		
		// Hide elements that we don't yet have values for
		$termDropdownContainer.hide();
		$courseDropdownContainer.hide();
		$numSemestersContainer.hide();
		$startSemesterContainer.hide();
		$courseSpreadContainer.hide();
		$interfaceLevelThree.hide();
	
		// If the user just generated level one then they definitely should not have any values set in interface level three.
		creatorObject.clearInterfaceLevelThree = function(){
			clearFunc($courseName);
			clearFunc($coursePriority);
			clearFunc($courseTerm);
			clearFunc($termName);
			clearFunc($termUnits);
		}

		return creatorObject;
		
	}
	
	function interfaceLevelTwo(){
	
		var creatorObject = {};
		
					// need to Clear Everything here
					
		
		
		creatorObject.programDetails;
		creatorObject.getProgramInfoJson;
		creatorObject.programDetailsObject;
		creatorObject.programDetailsResponse;
		creatorObject.programCourses; // Remember this actually becomes an array with id, name, units
		creatorObject.programCoursesNoSpaces;
		
		// The interface was just created. So should be ready to accept new values and forget old ones
		// We clear these HTML nodes instead of deleting because they are created as static HTML in index.html
		creatorObject.clearInterfaceLevelTwo = function(){
			clearFunc($programName);
			clearFunc($courseDropdown);
			clearFunc($termDropdown);
			clearFunc($numSemesters);
			totalPossibleUnits = 0;
		}
		
		creatorObject.clearInterfaceLevelFour = function(){
			genClearFunc($unitPrgrmRqmnt);
			genClearFunc($effectiveElem);
			genClearFunc($departmentElem);
			genClearFunc($programNameElem);
			genClearFunc($coordinatorElem);
			genClearFunc($RCSDynamicContentWrapper);
			$interfaceLevelFour.hide();
			totalPossibleUnits = 0;
		}
		
		// Removes everything from parent; deleting course
		creatorObject.deleteCourse = function(){

			$courseOptionsContainer.hide();
			$courseOptions.empty();
		}
		
		// Removes everything from parent; deleting term
		creatorObject.deleteTerm = function(){
			
			$termOptionsContainer.hide();
			$termOptions.empty();
			
		}
		
		creatorObject.createInterFaceLevelTwo = function(){
	
			// First clear a bunch of stuff so they are ready to get new input. And delete any nodes that will be created dynamically at a later point.
			// This occurs mainly to prevent bugs from a user backtracking.
			creatorObject.clearInterfaceLevelTwo();
			creatorObject.clearInterfaceLevelFour();
			creatorObject.deleteCourse();
			creatorObject.deleteTerm();
			$interfaceLevelThree.hide();
			creatorObject.dontUpdateNumTerms;
			$courseDropdown.prepend("<option value='-1'>Select a course</option>");
			$termDropdown.prepend("<option value='-1'>Select a term</option>");
			$courseDropdown.show();
			$("#courseDropdownDesc").text("(optional) select a course to modify it's priority or scheduled term");
			
			creatorObject.$selectedProgram = $programsDropdown.val();
			
			$programName.html(creatorObject.$selectedProgram);
			
			// Create course dropdown within pre-existing <select> element.
			
			if(creatorObject.programCourses.length == 0){
				$("#courseDropdownDesc").text("There are no non-elective courses in this program");
				$courseDropdown.hide();
			}
			else{
				var courseIterator = 0;
				creatorObject.programCourses.forEach(function(course){
					
					// Remove white space from course ID
					creatorObject.programCoursesNoSpaces = course[0].split(" ");  // Turn into an array with no white space
					creatorObject.programCoursesNoSpaces = creatorObject.programCoursesNoSpaces.join(""); // rejoin that array into a string with no white space
					
					$courseDropdown.append("<option value='"+ creatorObject.programCoursesNoSpaces +"'>" + course[1] + " (" + course[0] + ")</option>");
					courseIterator++;
				})
			}
			// Cool it's populated with <option>s now. Let's show it
			$courseDropdownContainer.show();
			
			// Let's do the same exact thing with term dropdown
			for(i = 0; i < programTerms; i++){
				$termDropdown.append("<option value='term "+(i + 1)+"'>term " + (i + 1)+"</option>");
			}
			// Yep
			$termDropdownContainer.show();
			
			// Set the number input field to default to the suggested number of terms, and show it.
			$numSemesters.val(programTerms);
			$numSemestersContainer.show();
			$startSemesterContainer.show();
			$courseSpreadContainer.show();
			$("#interfaceLevelTwo").show();
		}
		
		// This function is called upon change of the number of semesters changes. It updates the number of terms user may select from
		// Conveniently, it also takes into account if a user has already selected a term to modify, and does not add that term back into the dropdown.
		creatorObject.updateTermDropdown = function(){
			
			var numberOfSemesters = $numSemesters.val();
			clearFunc($termDropdown);
			$termDropdown.prepend("<option value='-1'>Select a term</option>");
			var i = 0;
			while(i < numberOfSemesters){
				// The following subloop checks the current term number that is ABOUT to be added to the drop down against any terms that are intentionally missing from the dropdown.
				// This is because we don't want to add that term back in. We already removed it intentionally to prevent user from adding the same term twice
				// Elegant, yet powerful, the following code will auto-itterate the itterator upon encountering a removed term that matches what is about to be added,
				// until it comes to a term that should be added. The code is called again upon next proposed term addition effectively skipping any terms it should not add.
				$.each($termToRemove, function(index,element){
					element.val().substr(-1) ==  i + 1 ? i++ : i = i;
				});
				if(numberOfSemesters >= i){
					$termDropdown.append("<option value='term "+(i + 1)+"'>term " + (i+1) +"</option>");
				}
				i++;
			}
		}
		creatorObject.setMinTerms = function(){

			creatorObject.highestTermNumber = 0;
			$(".termName").each(function(){
				var currentNum = parseInt($( this ).text().substr(-1));
				if(currentNum > creatorObject.highestTermNumber || creatorObject.highestTermNumber == null || creatorObject.highestTermNumber == 0){
					creatorObject.highestTermNumber = currentNum;
				}
			})
			$numSemesters.attr("min",creatorObject.highestTermNumber);
		}
		
		return creatorObject;
	
	}
		
	function interfaceLevelThree(){
	
		var creatorObject = {};
		
		creatorObject.$removeCourseOption;
		creatorObject.$removeTermOption;
		creatorObject.$selectedCourse;
		creatorObject.$selectedCourseId;
		creatorObject.$selectedTerm;
		creatorObject.$selectedTermId;
		creatorObject.$courseName;
		creatorObject.$courseTerm;
	
		// This function just creates and prepares the course Option container
		creatorObject.createCourseOptionsContainer = function(){
			

			creatorObject.$selectedCourse = $courseDropdown.val();
			creatorObject.$selectedCourseFullName = $courseDropdown.find("option[value='"+creatorObject.$selectedCourse+"']").text();
			// Did the user click on a valid result?
			if(creatorObject.$selectedCourse != -1){
				// The following two lines removes a selected course from the drop down so user may not enter multiple identical courses
				$courseToRemove.push($("#courseDropdown option[value='"+creatorObject.$selectedCourse+"']"));
				$courseToRemove[$courseToRemove.length - 1].remove();
				console.log(creatorObject.$selectedCourseFullName);
				// Let's just create this whole section of html like this. This happens everytime a course is added
				var justHTML = '<div class="row courseItem" id="' + creatorObject.$selectedCourse  + '"><div class="col-sm-3"><span class="courseName" value="'+creatorObject.$selectedCourse+'"></span></div><div class="col-sm-3"><label>Course Priority<input type="number" min="0" class="coursePriority" value="0"></input></label></div><div class="col-sm-3"><label>Course Term<select class="courseTerm"></select></label></div><div class="col-sm-3"><button class="btn-danger removeCourseOption" parent="'+ creatorObject.$selectedCourse  +'">X</button></div></div>';
				
				$courseOptions.append(justHTML);
				
				// Let's now assign variables to these elements we just created
				creatorObject.$removeCourseOption = $(".removeCourseOption");
				creatorObject.$courseName = $("#" + escapePeriods( creatorObject.$selectedCourse ) + " .courseName");
				creatorObject.$courseTerm = $("#" + escapePeriods( creatorObject.$selectedCourse ) + " .courseTerm");
			}
		}
		
		// This function populates course options container with values
		creatorObject.createCourseOptions =	function(){
			
			// Did the user click on a valid result?
			if(creatorObject.$selectedCourse != -1){
				
				// Populate course name holder with course that was selected from drop down
				creatorObject.$courseName.html(creatorObject.$selectedCourseFullName);


				// Append all program terms from server into this drop down
				for(i = 0; i < programTerms; i++){
					creatorObject.$courseTerm.append("<option value='" + i + "'>" + (i + 1) );
				}
				// Now show that section
				$courseOptionsContainer.show();
				// Everything is ready. Let's show the whole section
				$interfaceLevelThree.show();
				
				// Event listener and handler for removing course by clicking X.
				creatorObject.$removeCourseOption.click(function(event){ // Event listener here because the event it's listening for doesn't always exist
					deleteItem(event);
					interfaceLevelThree.interfaceEmptyCheck();
				});
			}	
		}
		
		creatorObject.createTermOptionsContainer = function(){
			
			creatorObject.$selectedTerm = $termDropdown.val();
			
			if(creatorObject.$selectedTerm != -1){
			
				// The following two lines removes a selected term from the drop down so user may not enter multiple terms
				$termToRemove.push($("#termDropdown option[value='"+creatorObject.$selectedTerm+"']"));
				$termToRemove[$termToRemove.length - 1].remove();
				
				// Remove white space from ID
				creatorObject.$selectedTermId = creatorObject.$selectedTerm.split(" ");  // Turn into an array with no white space
				creatorObject.$selectedTermId = creatorObject.$selectedTermId.join(""); // rejoin that array into a string with no white space
				
				//Creat entire section with HTML. This happens everytime I add a term
				var termOptionStringHTML = '<div class="row termItem" id="' + creatorObject.$selectedTermId + '"><div class="col-sm-4"><span class="termName">' + creatorObject.$selectedTerm  +'</span></div><div class="col-sm-3"><label> Units per term<input type="number" min="0" class="termUnits" value="15"></input></label></div><div class="col-sm-4"><button class="btn-danger removeTermOption" parent="' + creatorObject.$selectedTerm + '">X</button></div></div>';
				
				$termOptions.append(termOptionStringHTML);
				
				// Assign variables to elements we just created.
				creatorObject.$removeTermOption = $(".removeTermOption");
			}
		}
		
		// Function to create term options
		creatorObject.createTermOptions = function(){
	
			if(creatorObject.$selectedTerm != -1){
				//$termName.html(creatorObject.$selectedTerm);
				
				$termOptionsContainer.show();
				$interfaceLevelThree.show();
				
				creatorObject.$removeTermOption.click(function(event){ // Event listener here because the event it's listening for doesn't always exist
					deleteItem(event);
					interfaceLevelThree.interfaceEmptyCheck();
				});
			}
		}
		
		// Check if there are no terms or options. If there are no terms or options then hide the prompt.
		creatorObject.interfaceEmptyCheck = function(){
			var courses = $("#courseOptions").find(".courseItem");
			var terms = $("#termOptions").find(".termItem");
			courses.length == 0 ? $courseOptionsContainer.hide() : $courseOptionsContainer.show();
			terms.length == 0 ? $termOptionsContainer.hide() : $termOptionsContainer.show();
		}
		
		return creatorObject;
	
	}
	
	function interfaceLevelFour(){
	
		var creatorObject = {};
		creatorObject.term_unitsArray = [];
		creatorObject.response;
		creatorObject.coordinator;
		creatorObject.department;
		creatorObject.effective;
		creatorObject.unitPrgrmRqmnt = null; // Will be integer showing unit reqs of program
		creatorObject.ElectAndGEUnits;
		creatorObject.cancelRequest = false;
		creatorObject.latestYear;
		
				//Set up some vars
		creatorObject.setUpVars = function(){
			creatorObject.program = $programsDropdown.val(); // All Good
			
			if( $numSemesters ){
				creatorObject.terms = parseInt($numSemesters.val());
			}
			
			
			creatorObject.course_terms = {}; // All good. Contains arrays like this [[course,term][course,term]]
			creatorObject.course_priorities = {}; // All good. Contains arrays like this [[course,pripority][course,pripority]]
			creatorObject.term_units = {}; // All Good
			creatorObject.coordinator = interfaceLevelTwo.programCoordinator;
			creatorObject.department = interfaceLevelTwo.department;
			creatorObject.effective = interfaceLevelTwo.effective;
			totalPossibleUnits = 0;
		}
		
		
		
		// Create array composed of all course IDs to send to server with corresponding term
		creatorObject.setUpJson = function(){
			
			creatorObject.scheduleRequest = {};
			creatorObject.scheduleRequest.Command = "Schedule";
			creatorObject.scheduleRequest.Arguments = {};
			
			if( $(".courseItem").length > 0 ){
			
				$(".courseItem").each(function(index, element){
					var prop = $(this).attr("id");
					creatorObject.course_terms[prop] = parseInt($(this).find(".courseTerm").val());
				})
				
				// Course Ids with corresponding priority level
				$(".courseItem").each(function(index,element){
					var prop = $(this).attr("id");
					creatorObject.course_priorities[prop] = parseInt($(this).find(".coursePriority").val());
				})
				
				creatorObject.scheduleRequest.Arguments['Course Priorities'] = creatorObject.course_priorities;
				creatorObject.scheduleRequest.Arguments['Course Terms'] = creatorObject.course_terms;
			
			}
			

			
			// term Ids with corresponding unit amount
			if( $(".termItem").length > 0 ){
				
				$(".termItem").each(function(index,element){
					
					$validId = $(this).attr("id").substr(-1);
					var prop = parseInt(($validId - 1));
					creatorObject.term_units[prop] = parseInt($(this).find(".termUnits").val());
					// Will use below array for checking total the total number of units students can take based on settings
					creatorObject.term_unitsArray.push(parseInt($(this).find(".termUnits").val()));
				})
				
				creatorObject.scheduleRequest.Arguments['Term Unit Overrides'] = creatorObject.term_units;
			}
			
			/*creatorObject.scheduleRequest = {argv:'{"command":"schedule","arguments":{"program":"'+ creatorObject.program +'", "terms": '+creatorObject.terms+', "course_terms": {'+creatorObject.$course_terms+'}, "course_priorities": {'+creatorObject.$course_priorities+'}, "term_units": {'+creatorObject.$term_units+'}}}'}; */
			

			creatorObject.scheduleRequest.Arguments['Program'] = creatorObject.program;
			if( creatorObject.terms ){
				creatorObject.scheduleRequest.Arguments['Terms'] = creatorObject.terms;
			}
			
			
				creatorObject.scheduleRequest.Arguments['Course Spread'] = $courseSpread.val();
				
				if( $startSemesterContainer.val() ){
					creatorObject.scheduleRequest.Arguments['Start Semester'] = $startSemesterContainer.val();
				}
			
			
			
			
			creatorObject.scheduleRequestJson = JSON.stringify(creatorObject.scheduleRequest);
		}
		// --------------------------------------------------------- The several below functions which begin with 'check' are all used to validate data before scheduling request.
		
		// Discover max possible units based upon user specifications 
		creatorObject.checkMaxUnits = function(){
					var addMoreUnits = 0;
					$numSemesters.val() > creatorObject.term_unitsArray.length ? addMoreUnits = parseInt( ( $numSemesters.val() - creatorObject.term_unitsArray.length ) ) : addMoreUnits = 0; // Are there terms that aren't explicitly set?
					totalPossibleUnits += ( addMoreUnits * 15 ); // If so then multiply those terms by 15. Cuz that's the default.
				// This below loops through all terms that have units explicitly set.
				creatorObject.term_unitsArray.forEach(function(element){
					totalPossibleUnits += element; // Then just take what was explcitly set and add those numbers.
				})
				
				if( interfaceLevelTwo.programType == "Major" && totalPossibleUnits < 60){
					//notice("It is not possible to create a schedule because the minimum number of units to complete the program exceeds the number of units you have defined", true, 0);
					//creatorObject.cancelRequest = true;
				}
				else if( interfaceLevelTwo.programType == "Certificate" && totalPossibleUnits < interfaceLevelTwo.UnitReqs){
					//notice("It is not possible to create a schedule because the minimum number of units to complete the program exceeds the number of units you have defined", true, 0);
					//creatorObject.cancelRequest = true;
				}
		}
		
		// This just makes sure there aren't more terms in the modification zone than there are terms that actuall exist
		creatorObject.checkNumModifiedTerms = function(){
			if( $numSemesters.val() < $(".termItem").length ){
				 notice("You're trying to edit more terms than currently exist. Either remove terms from the modification zone or increase the number of terms.", true, 0);
				 creatorObject.cancelRequest = true;
			}
		}
		
		creatorObject.checkModifiedTermNumbers = function(){
			if( interfaceLevelTwo.highestTermNumber > $numSemesters.val() ){ // Is there a term in the modification zone that is higher than any possible term set?
				notice("You are trying to edit a term that doesn't exist. Please delete that term from the editor area", true, 0);
				creatorObject.cancelRequest = true;
			}
		}
		
		// Checks to see if there are no requirements in this program.
		// If there are no reqs then that means a recommended course sequence will be empty
		// because we only schedule reqs.
		creatorObject.checkNumReqs = function(){
			
		}
		
		creatorObject.allChecks = function(){
			creatorObject.checkNumModifiedTerms();
			creatorObject.checkMaxUnits();
			creatorObject.checkModifiedTermNumbers();
		}
		
		// This should be executed upon click of the show warnings messages button
		creatorObject.showWarningLogs = function(){
			
			$("#warningLogsContainer").html("");
			creatorObject.response["Log"].forEach(function(element){
				if( element['Severity'] == "Warning" ){
					$("#warningLogsContainer").append("<p>"+element.Message+"</p>");
				}
			})

			$("#warningLogsContainer").show();

		}
		
		// This should be executed upon click of the show warnings messages button
		creatorObject.showInfoLogs = function(){
			
			$("#infoLogsContainer").html("");
			creatorObject.response["Log"].forEach(function(element){
				if( element['Severity'] == "Information" ){
					$("#infoLogsContainer").append("<p>"+element.Message+"</p>");
				}
			})

			$("#infoLogsContainer").show();

		}
		
			$("#warningsLogButton").click(function(){
				creatorObject.showWarningLogs();
			})
		
			$("#infoLogsContainer").click(function(){
				creatorObject.showInfoLogs();
			})
	
		
		// This function makes the request and then calls the function to generate the RCS
		creatorObject.sendScheduleRequest_callRCSGen = function(){
			console.log("Request:");
			console.log({argv:creatorObject.scheduleRequestJson} );
			var scheduleRequest = $.post(serverUrl, {argv:creatorObject.scheduleRequestJson}, function(response){
				
				console.log("Total Possible Units: " + totalPossibleUnits);
				response = JSON.parse(response);
				console.log(response);
				latestResponse = response;
				
				if( response.Token ){ // Did the server send back a token instead of a response?
					token = response.Token;
					timer("Generating Recommended Course Sequence Now");
					response = latestResponse;
				}
				if(latestResponse !== null && typeof latestResponse !== 'object'){
					latestResponse = JSON.parse(latestResponse);
				}
				creatorObject.response = latestResponse;
				creatorObject.response.result = latestResponse.Result;
				
				if( interfaceLevelTwo.programDetails == undefined ){
					var getProgramInfoJson = {argv:'{"Command":"Program Details","Arguments":{"Program":"'+$("#allPrograms").val()+'"}}'};
					$.post(serverUrl, getProgramInfoJson, function(response){
						console.log("Sub Request Resonse is: " + response);
						response = JSON.parse(response);
						latestResponse = response;
						if(response.Status == "Pending"){
							token 
							token = response.Token;
							timer("Generating Recommended Course Sequence Now!");
						}
						response = latestResponse;
						// Some of the below objects were previously set before this request was made. But if this request is being made we can infer that there were set to null values because 
						// this request is only made upon a certain condition which if occurs we can infer causes null values.
						
						interfaceLevelTwo.programType =                          response.Result['Type'];
						interfaceLevelTwo.programCourses = response.Result['Configurable Courses'];
						interfaceLevelTwo.UnitReqs =                                response.Result['Units'];
						programTerms = 												  response.Result['Terms'];
						interfaceLevelTwo.programCoordinator = 		   response.Result['Coordinator'];
						interfaceLevelTwo.contactPhone =            response.Result['Contact Phone'];
						interfaceLevelTwo.contactEmail =               response.Result['Contact Email'];
						interfaceLevelTwo.effective =                    response.Result['Effective Date'];
						interfaceLevelTwo.department =                    response.Result['Department'];

						creatorObject.generateRCS();
						dragAndVerify = window.dragAndVerify(response, creatorObject, notice);
					})
				}
				else{
					creatorObject.generateRCS();
					dragAndVerify = window.dragAndVerify(response, creatorObject, notice);
				}
				
			});
			
			scheduleRequest.always(function(){ // Do this whether we got a sucessful response or not.

				creatorObject.response["Log"].forEach(function(element){
					if( element['Severity'] == "Error" ){
						notice(element['Message'], true);
					}
				})
			});
			
		}
		
		//--------------------------------- Actually make the RCS layout and HTML
		creatorObject.generateRCS = function(){
			
			genClearFunc($unitPrgrmRqmnt);
			genClearFunc($effectiveElem);
			genClearFunc($departmentElem);
			genClearFunc($programNameElem);
			genClearFunc($coordinatorElem);
			genClearFunc($RCSDynamicContentWrapper);
			
			$("#infoLogsSection").hide();
			$("#warningLogsSection").hide();
			
			scheduleNumber++; // Started at -1 so if this is the first time user has generated a schedule it will be 0.
			
			// Set up some Vars
			if( creatorObject.response.Result && creatorObject.response.Result.Schedules[scheduleNumber] != false ){
				var schedule = creatorObject.response.result.Schedules[scheduleNumber].Schedule; // is array and length is number of terms
				var UnitTotalAndMax = creatorObject.response.result.Schedules[scheduleNumber].Units // [0] = Semester Untit Total. [1] = Max possible units for semester
						
				
				
				// Set up variables to be used in term loop where we will properly itterate years and semesters.
				var term = interfaceLevelTwo.effective.split(" "); // split this value into an array on space.
				creatorObject.latestSemester = term[0]; // This is now the semester only and not the year.
				creatorObject.latestYear = parseInt(term[1]); // This is now the year only and not the semester
				
				// Do this loop for every term
				$.each(schedule, function(termIndex, termValue){
					
					var T = 0;
					var M = interfaceLevelTwo.UnitReqs || creatorObject.UnitReqs; // Min Units to Meet Program Reqs 
					var U = creatorObject.response.result.Schedules[scheduleNumber].Schedule[termIndex]['Units']; // Units scheduled for this term  
					var X = creatorObject.response.result.Schedules[scheduleNumber].Schedule[termIndex]['Term Units']; // Max Units for this term   
					var R = creatorObject.response.result.Schedules[scheduleNumber].Schedule.length; // Number of terms scheduled
					
					$.each(creatorObject.response.result.Schedules[scheduleNumber].Schedule, function(index, value){
						T += value['Units']; // Total Units Scheduled
					})
					
					function algebra(blah){
						blah == true ? M = 60 : M = M;
						if (  ((M - T) / R)  <=  (X - U) ){
							return ((M - T) / R);
						}
						else{
							return (X - U);
							// Need to send notice to user upon this condition too.
						}
					}
					
					if(termIndex !== 0){ // Don't do this for the first term. Just change semester
						creatorObject.latestSemester == "Spring" ? creatorObject.latestSemester = "Fall" : creatorObject.latestSemester = "Spring";
					}
					
					if( creatorObject.latestSemester == "Spring" ){ // If term is spring update the year.
						creatorObject.latestYear++;
					}
					
					function roundToTenthAndFix(number){
						return (Math.round((number * 10)) / 10).toFixed(2);
					}
					
					// Calculate number of Electives and GE that should be taken this semester
					if( interfaceLevelTwo.programType == "Certificate" || creatorObject.programType == "Certificate" ) {								
						creatorObject.ElectAndGEUnits = roundToTenthAndFix(algebra().toFixed(2)) + " units from electives";
					}
					else if( interfaceLevelTwo.programType == "Major" ||creatorObject.programType == "Major"){
						creatorObject.ElectAndGEUnits = roundToTenthAndFix(algebra(true).toFixed(2)) + " units from electives and G.E.";
					}
					var semUnitTotal = parseInt( parseInt(U) + parseInt(creatorObject.ElectAndGEUnits) );
					
					var termWrapperHtml = "<div class=' table-responsive termWrapper' id='term"+ termIndex + 1+"'><div class='tableHeader'><span class='schedulesTermName'>"+creatorObject.latestSemester+" "+creatorObject.latestYear+"</span></div></div><table class='table'><tr class='termCourseWrappers' id='dynamicCourseWrapper"+(termIndex + 1)+"'></tr><tr><td> Take about<span id='ElectiveAndGE'> "+creatorObject.ElectAndGEUnits+"</span></td></tr><tr><td id='semesterUnitTotalWrap'> Semester Unit Total: <span id='semesterUnitTotal'> "+ semUnitTotal.toFixed(2) +"</span></td></div>";
					
					$("#RCSDynamicContentWrapper").append(termWrapperHtml);
					// Do this loop for every course in that term
					$.each(schedule[termIndex]['Courses'], function(courseIndex, course){
						var coursesHtml = "<tr class='singleCourse'><td>"+course['Identifier']+"</td><td>"+course['Name']+"</td><td>"+course['Units'].toFixed(2)+" units<span class='singleCourseKill'>X</span></td></tr>";
						$("#dynamicCourseWrapper" + (termIndex + 1)).append(coursesHtml);
					})
				})
				
				$programNameElem.append(creatorObject.program);
				$coordinatorElem.append(interfaceLevelTwo.programCoordinator);
				$departmentElem.append(interfaceLevelTwo.department);
				$effectiveElem.append(interfaceLevelTwo.effective);
			
				if( interfaceLevelTwo.programType == "Major" || creatorObject.programType == "Major"){
					$unitPrgrmRqmnt.append(interfaceLevelTwo.UnitReqs.toFixed(2));
				}
				else{
					$unitPrgrmRqmnt.append(interfaceLevelTwo.UnitReqs.toFixed(2));
				}
				
				creatorObject.response.result.Schedules[scheduleNumber + 1] != false ? $("#showAlternateContainer").show() : $("#showAlternateContainer").hide();
				
				$interfaceLevelFour.show();
			}
			if( creatorObject.response.Status == "Failure" ){
				
				$("h2").hide();
				$(".programData").hide();
				$("#interfaceLevelTwo").hide();
				$("#unitPrgrmRqmntWrapper").hide();
				$("#alternateButton").hide();
				$interfaceLevelFour.show();
				
			}
			creatorObject.response["Log"].forEach(function(element){
				if(element.Severity == "Warning"){
					$("#warningLogsSection").show();
				}
				if(element.Severity == "Information"){
					$("#infoLogsSection").show();
				}
			})
		}
		
		
		return creatorObject;
	
	}
	
	var interfaceLevelOne = interfaceLevelOne();
	var interfaceLevelTwo = interfaceLevelTwo();
	var interfaceLevelThree = interfaceLevelThree();
	var interfaceLevelFour = interfaceLevelFour();
	
	//--------------------------------------------------------END SETTING UP OBJECTS----------------------------
	
	//-----------------------------------------------------------List Of Programs Ajax Get Request---------------	
	
	$("#allPrograms").prepend("<option value='-1'>Select a program</option>");
	
	var getProgramListJson = {argv:'{"Command":"Program List", "arguments":{}}'};

	$.post( serverUrl, getProgramListJson, function(response){
		latestResponse = response;
		interfaceLevelOne.$programsObject = JSON.parse( latestResponse );
		if( interfaceLevelOne.$programsObject.Status == "Pending" ){ // Did the server send back a token instead of a response?
			token = interfaceLevelOne.$programsObject.Token;
			timer("Loading page now");
		}else{
			setUpProgramsList();
		}
	

	});
	
	// Set up response values for initial response
	function setUpProgramsList(){
		interfaceLevelOne.$programsObject = latestResponse;
		if(latestResponse !== null && typeof latestResponse !== 'object'){
			latestResponse = JSON.parse(latestResponse);
		}
		interfaceLevelOne.$allPrograms = latestResponse.Result.Programs;
		
		// Load all program names into the drop down as <option> elements
		interfaceLevelOne.$allPrograms.forEach(function(text){
			$("#allPrograms").append("<option>" + text);
		})
	}
	
	
	//----------------------------------------------------------------------------------Program Details Ajax Get Request
		
	// When the select element changes give $selectedProgram the name of the option that has been selected
	$("#allPrograms").change(function(){
		$moreOptionsButton.show();
		interfaceLevelTwo.clearInterfaceLevelTwo();
		interfaceLevelTwo.clearInterfaceLevelFour();
		interfaceLevelTwo.deleteCourse();
		interfaceLevelTwo.deleteTerm();
		$interfaceLevelThree.hide();
		$("#interfaceLevelTwo").hide();
	})
	
	$("#moreOptionsButton").click(function(){
		
		interfaceLevelTwo.$selectedProgram = $programsDropdown.val();
		initialProgramDetails = true;
			// create Json string with single variable selected program pulled from program drop down
		interfaceLevelTwo.getProgramInfoJson = {argv:'{"Command":"Program Details","Arguments":{"Program":"'+ interfaceLevelTwo.$selectedProgram +'"}}'};
		
		console.log("Request: " + JSON.stringify( interfaceLevelTwo.getProgramInfoJson ));
		var detailsRequest = $.post( serverUrl, interfaceLevelTwo.getProgramInfoJson, function(response){
			console.log("response: " + response);
			latestResponse = response;
			interfaceLevelTwo.programDetails = response;
			interfaceLevelTwo.programDetailsObject = JSON.parse(interfaceLevelTwo.programDetails);
			
			if( interfaceLevelTwo.programDetailsObject.Status == "Pending" ){ // Did the server send back a token instead of a response?
				token = interfaceLevelTwo.programDetailsObject.Token;
				timer("Loading program details now");
			}else{
				setUpProgramDetails();
			}
		});
		
	})
	
	function setUpProgramDetails(){
		
		if(latestResponse !== null && typeof latestResponse !== 'object'){
			latestResponse = JSON.parse(latestResponse);
		}
	
		interfaceLevelTwo.programDetailsResult = latestResponse['Result']; // undefined
		interfaceLevelTwo.programType = interfaceLevelTwo.programDetailsResult['Type'];
		interfaceLevelTwo.programCourses = interfaceLevelTwo.programDetailsResult['Configurable Courses'];
		interfaceLevelTwo.UnitReqs = interfaceLevelTwo.programDetailsResult['Units'];
		programTerms = interfaceLevelTwo.programDetailsResult['Terms'];
		interfaceLevelTwo.programCoordinator = interfaceLevelTwo.programDetailsResult['Coordinator'];
		interfaceLevelTwo.contactPhone = interfaceLevelTwo.programDetailsResult['Contact Phone'];
		interfaceLevelTwo.contactEmail = interfaceLevelTwo.programDetailsResult['Contact Email'];
		interfaceLevelTwo.effective = interfaceLevelTwo.programDetailsResult['Effective Date'];
		interfaceLevelTwo.department = interfaceLevelTwo.programDetailsResult['Department'];
		// Function to create program name, Drop down of courses, drowdown of terms and number of semesters field----------------------------
		
		interfaceLevelTwo.createInterFaceLevelTwo();
			
	}
	
	// --------------------------------  EVENTS ---------------
	
	$numSemestersContainer.change(function(){
		interfaceLevelTwo.updateTermDropdown();
	})
	
	
	// When user selects course then enable course options for that course
	$courseDropdown.change(function(){
		
		interfaceLevelThree.createCourseOptionsContainer();
		interfaceLevelThree.createCourseOptions();
				
	})
	
	$termDropdown.change(function(){
		interfaceLevelThree.createTermOptionsContainer();
		interfaceLevelThree.createTermOptions();
		interfaceLevelTwo.setMinTerms();
	
	})
	
	// Send Schedule command to server
	
	$generateRCS.click(function(){
		
			scheduleNumber = -1; // Schedule Number is used to cycle through different schedules that are delivered to client
			interfaceLevelFour.setUpVars();
			interfaceLevelFour.setUpJson();
			interfaceLevelFour.allChecks(); // Check to see if it's even possible to schedule given users parameters
			interfaceLevelFour.cancelRequest == false ? interfaceLevelFour.sendScheduleRequest_callRCSGen() : interfaceLevelFour.cancelRequest = interfaceLevelFour.cancelRequest; // If it passed previous test then execute request.
			
	})
	
	$printButton.click(function(){
		window.print();
	})
	
	$alternateButton.click(function(){
		interfaceLevelFour.generateRCS();
	})
	
	$courseDropdown.mouseover(function(){
		$infoArea.show();
		$infoArea.append("<p>Select a course to show two options for that course. You may set what term you would like to take that course in and how early you would like to take the course. Courses with a higher priority will tend to be scheduled earlier. Note: course term is a hard requirement and the scheduler will fail if it can not comply with the course term you have set, while course priority is a soft requirement and may be ignored if necessary.</p>")
	})
	
	$startSemesterContainer.mouseover(function(){
		$infoArea.show();
		$infoArea.append("<p>Select a term to start the the program in. If the program cannot be started in that term the schedule will not be generated.</p>")
	})
	
	$courseSpreadContainer.mouseover(function(){
		$infoArea.show();
		$infoArea.append("<p>The course spread setting determines how a schedule is balanced. If 'first' is selected, the beginning terms will be filled up as much as possible before scheduling later terms. If 'balanced' is selected, the scheduler will attempt to make all terms have a similar amount of courses. If 'last' is selected ther scheduler will attempt to fill up later terms with courses and move onto earlier courses as necessary. The default is 'first'.</p>")
	})
	
	$numSemestersContainer.mouseover(function(){
		$infoArea.show();
		$infoArea.append("<p>Use this option to change the number of terms you would like to complete a program in. If you choose too few terms the scheduler will not be able to create a Recommended Course Sequence.</p>")
	})
	
	$termDropdownContainer.mouseover(function(){
		$infoArea.show();
		$infoArea.append("<p>Selecting a term will allow you to make a modification for that term. You will be able to set the maximum amount of units that a semester can be scheduled for.</p>")
	})
	
	$termDropdownContainer.mouseout(function(){
		genClearFunc($infoArea);
		$infoArea.hide();
	})
	
	$numSemestersContainer.mouseout(function(){
		genClearFunc($infoArea);
		$infoArea.hide();
	})
	
	$courseSpreadContainer.mouseout(function(){
		genClearFunc($infoArea);
		$infoArea.hide();
	})
	
	$startSemesterContainer.mouseout(function(){
		genClearFunc($infoArea);
		$infoArea.hide();
	})
	
	$courseDropdown.mouseout(function(){
		genClearFunc($infoArea);
		$infoArea.hide();
	})
	

	
});