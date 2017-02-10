function dragAndVerify(response, interfaceLevelFour, notice){
	
	theObj = {};
	
		// Public Functions
		// Set up variables

			
			if( $(".singleCourse").length > 0 ){
				var singleCourse = $(".singleCourse");
			}
			if( $(".termCourseWrappers").length > 0 ){
				var termCourseWrappers = $(".termCourseWrappers");
			}
			if( $("#RCSDynamicContentWrapper").length > 0 ){
				var termsWrapper = $("#RCSDynamicContentWrapper");
			}
			if( $(".termWrapper").length > 0 ){
				var termWrapper = $(".termWrapper");
				var numTerms = $(".termWrapper").length;
			}
			if( $("#newTermButton").length > 0 ){
				var newTermButton = $("#newTermButton");
			}
			if( $("#allPrograms").length > 0 ){
				var selectedProgram = $("#allPrograms").val();
			}
			var verifyButton = $("#verifyButton") || "";
			var options = {};
			// End setting up variables
			
			// Event Listeners
			newTermButton.click(function(){
				createNewTerm();
			})
			verifyButton.click(function(){
				verifySchedule();
			})	

		
		// Make the table sortable

			termCourseWrappers.sortable({ 
				items: singleCourse,
				connectWith: termCourseWrappers,
				dropOnempty: true
			});
			
			$("*").on("sort", function(event, ui){
				ui.item.css("height", "40px");
			})

		
		///////////////////////////////////Set up private functions
		
		// The following function ads a new table empty table that serves as a new semester
		createNewTerm = function(){
			
			// Add new semesters for every term we add
			interfaceLevelFour.latestSemester == "Spring" ? interfaceLevelFour.latestSemester = "Fall" : interfaceLevelFour.latestSemester = "Spring";
			// If the new term is spring then update the year.
			if( interfaceLevelFour.latestSemester == "Spring" ){
				interfaceLevelFour.latestYear++;
			}
			
			termsWrapper.append("<div class='table-responsive termWrapper'><div class='tableHeader'><div>"+interfaceLevelFour.latestSemester+" "+interfaceLevelFour.latestYear+"</div></div><table class='table'><tr class='termCourseWrappers' id='dynamicCourseWrapper"+theObj.numTerms+"'></tr><td id='semesterUnitTotalWrap'>Semester Unit Total: <span id='semesterUnitTotal'></span></td></tr></table></div>");
			
			// Recalculate number of terms since we have just added one. And recalculate all termCourseWrapper elements since we just added one.
			numTerms = $(".termWrapper").length;
			termCourseWrappers = $(".termCourseWrappers");
			
			// Refresh set of elements that draggable method is exectued on, since we just added new element that needs to be included.
			termCourseWrappers.sortable({
				items: singleCourse,
				connectWith: termCourseWrappers,
				axis: 'y',
				dropOnempty: true
			});
		}
		
		// Set up Javascript Object for schedule request
		verifySchedule = function(){
			
			singleCourse = $(".singleCourse");
			
			options['Terms'] = numTerms;
			options['Course Terms'] = {};
			termCourseWrappers.each(function(termIndex, termElement){
				$(this).find(singleCourse).each(function(courseIndex, courseElement){
					var prop = $(this).find("td:first-child").text();
					options['Course Terms'][prop] = termIndex;
				})
			})
			console.log(options);
			RCSGWAPI.schedule(selectedProgram, function(response){
				if(response === null){
					notice("Your schedule failed verification, please check the scheduler messages, then try again.", true);
				}
				else{
					notice("Your schedule has been verified!", true);
				}	
					$("#warningLogsSection").html("");
					$("#warningLogsSection").append("<h3>Scheduler Messages:</h3>")
					$("#warningLogsSection").append( RCSGWAPI.getMessagesSimpleWarning() );
					$("#warningLogsSection").append( RCSGWAPI.getMessagesSimpleError() );
					$("#warningsLogButton").hide();
					$("#warningLogsSection").show();
					console.log( RCSGWAPI.getMessagesSimpleWarning() );
					console.log( RCSGWAPI.getMessagesSimpleError() );

			}, options);
		}
	
	return theObj;

	
}