$(document).ready(function () {
	
    var now = new Date();
    var thisYear = now.getFullYear();
    var countriesShown = [];

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
			min: 2008,
	      	max: thisYear,
	      	step: 1,
	      	slide: function( event, ui ) {
	        	$( "#active-year" ).text( "Year: " + ui.value );
	        	$('#step4').fadeOut('slow');
	      }
		}).fadeIn('slow');
      }
    });

   var activeCountry;

	var map = new Datamap({
            element: document.getElementById('mapHolder'),
            done: function(datamap) {
                datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
                    //toggle instructions and show indicator select
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

                    //get country flow information
                    activeCountry = countryIso[geography.properties.name];

                    var dataSet = flowData.in;
                    if (!flowData.in[activeCountry]) {
                        dataSet = flowData.out;
                    }

                    if (!flowData.in[activeCountry] && !flowData.out[activeCountry] ) {
                        $('#queryResult').text('Your query sucks. Pick another country!');
                        return;
                    } else {
                        $('#queryResult').text('');
                    }
                    var circles = d3.select('#mapHolder svg').append('g').attr('id','circles');
                    
                    
                    // know enough to display circle data now ...               
                    var currentYear = '2008';
                    var mapBubbles =[];
                    
                    //hide  all countries then only bring back those that are in play
                    $.each(dataSet[activeCountry], function (ISOCode, dataByYear) {
                        if (!countryGps[ISOCode]) {
                            console.log(ISOCode + ' missing');
                            return true;
                        }
                        countriesShown.push(ISOCode);
                        var flowVal = 0;


                        if ( dataByYear[currentYear] !== '..' ) {
                            flowVal = Math.sqrt(dataByYear[currentYear]) * 1.5;
                        }
                        var bubble = {
                            name: ISOCode,
                            radius: flowVal,
                            country: ISOCode,
                            fillKey: ISOCode,
                            latitude: countryGps[ISOCode].lat, 
                            longitude: countryGps[ISOCode].lng
                        }

                        mapBubbles.push(bubble);
                    })
                    map.bubbles(mapBubbles);
                })
            }
        });

    $('.datamaps-subunit').fadeIn('slow', function () {
        console.log('all shown');
        console.log(countryIso);
        $.each(countryIso, function (i, country) {
            if (countriesShown.indexOf(country) != -1) {
                var hideClass = '.' + country;
                $('.datamaps-subunits').find(hideClass).hide();
                console.log('hidden');
            }
        })  
    }); 
    


	$('#indicatorSelect').on('change', function (e) {
        console.log(e.val);
   
		$('#step2').fadeOut();
		if ( instructionsViewed.indexOf('#step3') === -1 ) {
			// $('#step3').fadeIn('slow');
			instructionsViewed.push('#step3');
		}
		//$('#rangeSelector').fadeIn('slow');
        d3.json("http://132.204.46.17:83/api/countries/?code=" + 'SEN' + "&category=EDULIT_DS&indicators=" +  e.val + "&fromyear=" + 2008 + "&toyear=" + 2009 + "&mostrecent=false", function (jsondata) {
            var indi = jsondata.Indicators[0];
            console.log(indi);
            if (!indi) {
                $('#queryResult').text('No data :-(');
            }
            $('#queryResult').text('Country: ' + indi.Country + ', Indicator: ' + $('#indicatorSelect').find('option[value="'+indi.Indicator+'"]').text()  + ', Value: ' + indi.Value);
        });
	});

        //d3.json('countries.json', function(error,data) {
        //    if (error) return console.warn(error);
        //    $(data.CountriesDefinition).each( function(country) {
        //        countryIso[country.EngLabel] = country.Abbr
        //    });
        //});

        
        d3.csv('data/education_flows_iso3.csv', function(flow) {
            
            $.each(flow, function (i, row) {
                var inCountry = row.recipient_country;
                var outCountry = row.donor_country;
               
                var years = ['2008', '2009', '2010', '2011', '2012'];

                $.each(years, function (i, year) {
                    if ( !flowData.in[inCountry] ) {
                        flowData.in[inCountry] = {};
                    }

                    if ( !flowData.in[inCountry][outCountry] ) {
                        flowData.in[inCountry][outCountry] = {};
                    }

                    if ( !flowData.out[outCountry] ) {
                        flowData.out[outCountry] = {};    
                    }

                    if ( !flowData.out[outCountry][inCountry] ) {
                        flowData.out[outCountry][inCountry] = {};    
                    }

                    flowData.in[inCountry][outCountry][parseInt(year)] = row[year];
                    flowData.out[outCountry][inCountry][parseInt(year)] = row[year];
                })            
            })
        });

        d3.csv('data/country_coords.csv', function (countries) {
            $.each(countries, function (i, country) {
                countryGps[country.Code] = {
                    lat: country.Lat,
                    lng: country.Lon
                }
            })
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
