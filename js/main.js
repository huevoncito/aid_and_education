$(document).ready(function () {
	
	// make sure we don't show instructions twice
	var instructionsViewed = [];

        // lookup of flow data keyed by year/country
        var flowData = {'in':{},'out':{}}

        // lat/long lookup by country code
        var countryGps = {}

        // 3166-3 to english country name. cross your fingers. Thank Chrome's CORS implementation for this
        var countryIso = {}

        // build lookup table from source data
        $(countryIsoSource['CountriesDefinition']).each( function(i,country) {
            countryIso[country.EngLabel] = country.Abbr;
        });
        
	var now = new Date();
	var thisYear = now.getFullYear();

        circles = $('svg').append('svg:g').attr('id','circles');

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

	var map = new Datamap({
            element: document.getElementById('mapHolder'),
            done: function(datamap) {
                datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
                    console.dir(geography.properties.name);
                    console.log(countryIso[geography.properties.name])
                })
            }
        });
	//toggle instructions as needed
	$('.datamaps-subunit').on('click', function (e) {
		//hide step 1 & show step 2;
		$('#step1').fadeOut();
		if ( instructionsViewed.indexOf('#step2') === -1 ) {
			$('#step2').fadeIn('slow');
			instructionsViewed.push('#step2');
		}
		$('#filterIndicator').select2({
			placeholder: 'Select an indicator',
			allowClear: true
		})
		$('#indicatorSelect').fadeIn('slow');
		//handle event
	});

	$('#indicatorSelect').on('change', function (e) {
                // know enough to display circle data now ...               
                circles.selectAll('circle')
                    .data(flowData.in) // where is in/out selected?
                    .enter().append("svg:circle")
                    .attr("cx", function(d, i) { return countryGps[i][0]; })
                    .attr("cy", function(d, i) { return countryGps[i][1]; })
                    .attr("r", function(d, i) { return Math.sqrt(countByAirport[d.iata]); })
                    .sort(function(a, b) { return countByAirport[b.iata] - countByAirport[a.iata]; });

		$('#step2').fadeOut();
		if ( instructionsViewed.indexOf('#step3') === -1 ) {
			$('#step3').fadeIn('slow');
			instructionsViewed.push('#step3');
		}
		$('#rangeSelector').fadeIn('slow');
	});

        //d3.json('countries.json', function(error,data) {
        //    if (error) return console.warn(error);
        //    $(data.CountriesDefinition).each( function(country) {
        //        countryIso[country.EngLabel] = country.Abbr
        //    });
        //});

        d3.csv('flows.csv', function(flow) {
            flowData.in[flow.year+'|'+flow.country_in] = flow
            flowData.out[flow.year+'|'+flow.country_out] = flow
        });
})

//- Gross enrollment ratios (all) 100% - 120% == overage students, afterwards, 10% intervals down
//to 50%. Below 50% is all red
//- Adjusted net enrollment 97-100 == great, everyone enrolled. 90 - 96 = yellow, 10% intervals doen to 50%
//-literacy for adult and youth. %90-100, 10%increments down, 50 & Below
//-school life expectancy 16 & up (tertiary) ,13-15 (secondary), 8-12 (lwr secondary), 7yrs & less (primary)
//-GPI equality between 0.97 && 1.03. 0.96 & down == inequalities against girls, 1.4 & above = disadvantage against boys
//lateral slider
//-out of school data. 0-9% is great, 10-19, 20-29, up to 39% - 40% and above is red
