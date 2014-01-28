$(document).ready(function () {
	
	// make sure we don't show instructions twice
	var instructionsViewed = [];

	var now = new Date();
	var thisYear = now.getFullYear();

	$( "#vertical-slider" ).slider({
      orientation: "vertical",
      range: true,
      values: [ 0, 100 ], // need to softcode for values over 100
      slide: function ( event, ui ) {
      	$('#indicator-range').text ( ui.values[0] + '%' + ' - ' + ui.values[1] + '%');
      	//toggle year view and instructions
      	$('#step3').fadeOut();
      	if ( instructionsViewed.indexOf('#step4') === -1 ) {
			$('#step4').fadeIn('slow');
			instructionsViewed.push('#step4');
		}
		$('#active-year').fadeIn('slow');
      	$('#time-slider').slider({
			min: 2000,
	      	max: thisYear,
	      	step: 1,
	      	slide: function( event, ui ) {
	        	$( "#active-year" ).text( "Year: " + ui.value );
	        	$('#step4').fadeOut('slow');
	      }
		}).fadeIn('slow');
      }
    });

	var map = new Datamap({element: document.getElementById('mapHolder')});

	//toggle instructions as needed
	$('.datamaps-subunit').on('click', function (e) {
		//hide step 1 & show step 2;
		$('#step1').fadeOut();
		if ( instructionsViewed.indexOf('#step2') === -1 ) {
			$('#step2').fadeIn('slow');
			instructionsViewed.push('#step2');
		}
		$('#indicatorSelect').fadeIn('slow', function () {
			$('#filterIndicator').select2({
				placeholder: 'Select an indicator',
				allowClear: true
			});
		})
		//handle event
	});

	$('#indicatorSelect').on('change', function (e) {
		$('#step2').fadeOut();
		if ( instructionsViewed.indexOf('#step3') === -1 ) {
			$('#step3').fadeIn('slow');
			instructionsViewed.push('#step3');
		}
		$('#rangeSelector').fadeIn('slow');
	})

})

//- Gross enrollment ratios (all) 100% - 120% == overage students, afterwards, 10% intervals down
//to 50%. Below 50% is all red
//- Adjusted net enrollment 97-100 == great, everyone enrolled. 90 - 96 = yellow, 10% intervals doen to 50%
//-literacy for adult and youth. %90-100, 10%increments down, 50 & Below
//-school life expectancy 16 & up (tertiary) ,13-15 (secondary), 8-12 (lwr secondary), 7yrs & less (primary)
//-GPI equality between 0.97 && 1.03. 0.96 & down == inequalities against girls, 1.4 & above = disadvantage against boys
//lateral slider
//-out of school data. 0-9% is great, 10-19, 20-29, up to 39% - 40% and above is red