$(document).ready(function () {
	//colours
    successColour = 'green';
    warningColour = 'gold';
    dangerColour = 'red';

    var now = new Date();
    var thisYear = now.getFullYear();
    var countriesShown = [];
    var dataSet;
    var activeCountry;
    var activeIndicator;

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

                    dataSet = flowData.in;
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
        // console.log(countryIso);
        $.each(countryIso, function (i, country) {
            if (countriesShown.indexOf(country) != -1) {
                var hideClass = '.' + country;
                $('.datamaps-subunits').find(hideClass).hide();
                console.log('hidden');
            }
        })  
    }); 
    


	$('#indicatorSelect').on('change', function (e) {
        activeIndicator = e.val;    
		$('#step2').fadeOut();
		if ( instructionsViewed.indexOf('#step3') === -1 ) {
			// $('#step3').fadeIn('slow');
			instructionsViewed.push('#step3');
		}
		//$('#rangeSelector').fadeIn('slow');
        $.each($('.datamaps-bubble'), function (i, bubble) {
            //only trigger click even for countries that have Flow data
            if ( parseFloat( $(bubble).attr('r') ) > 0 ) {
                
                // $(document.getElementsByClassName('datamaps-bubble')[i]).click()
                colourBubble( $(bubble) )
                // $(bubble).click();
            }
        });
    })

    //colour bubbles
    
    function colourBubble (bubble) {
        var trigger = bubble;
        var bubbleInfo = JSON.parse(trigger.attr('data-info'));
        var country = bubbleInfo['name'];
        var indicator = activeIndicator;

        $.getJSON("http://132.204.46.17:83/api/countries/?code=" + country + "&category=EDULIT_DS&indicators=" +  indicator + "&fromyear=" + 2008 + "&toyear=" + 2009 + "&mostrecent=false&callback=? ", function (jsondata) {
            console.log(jsondata);
        });
        return;


        d3.jsonp("http://132.204.46.17:83/api/countries/?code=" + country + "&category=EDULIT_DS&indicators=" +  indicator + "&fromyear=" + 2008 + "&toyear=" + 2009 + "&mostrecent=false&callback=d3.jsonp.dataReturned", function (d) {    
            // console.log(d3.jsonp.data);
            if (!d) {
                console.log('No data for ' + country);
                return;
            }
            var indi = d.Indicators[d.Indicators.length - 1]; // get most recent
            
            if (!indi) {
                console.log('No data for ' + country);
                return;
            }
            //colour code the bubbles
            switch ( indi.Indicator ) {
                case 'GER_0': //- Gross enrollment ratios (all) 100% - 120% == overage students, afterwards, 10% intervals down to 50%. Below 50% is all red
                case 'GER_1':
                case 'GER_12':
                case 'GER_23':
                    if ( indi.Value >= 100 ) {
                        trigger.css('fill', successColour);
                    } else if (indi.Value < 100 && indi.Value >= 50 ) {
                        trigger.css('fill', warningColour);
                    } else {
                        trigger.css('fill', dangerColour);
                    }
                    break;
                case 'NERA_1_CP': //- Adjusted net enrollment 97-100 == great, everyone enrolled. 90 - 96 = yellow, 10% intervals doen to 50%
                    if ( indi.Value >= 97 ) {
                        findCountry(indi.Country).css('fill', successColour);
                    } else if (indi.Value < 97 && indi.Value >= 90 ) {
                        findCountry(indi.Country).css('fill', warningColour);
                    } else {
                        findCountry(indi.Country).css('fill', dangerColour);
                    }
                    break;
                case 'LR_AG15T24':
                case 'LR_AG15T99': ////-literacy for adult and youth. %90-100, 10%increments down, 50 & Below
                    if ( indi.Value >= 90 ) {
                        findCountry(indi.Country).css('fill', successColour);
                    } else if (indi.Value < 90 && indi.Value >= 50 ) {
                        findCountry(indi.Country).css('fill', warningColour);
                    } else {
                        findCountry(indi.Country).css('fill', dangerColour);
                    }
                    break;
                case 'SLE_1T6': //-school life expectancy 16 & up (tertiary) ,13-15 (secondary), 8-12 (lwr secondary), 7yrs & less (primary)
                    if ( indi.Value >= 16 ) {
                        findCountry(indi.Country).css('fill', successColour);
                    } else if (indi.Value < 16 && indi.Value >= 13 ) {
                        findCountry(indi.Country).css('fill', warningColour);
                    } else if (indi.Value < 13 && indi.Value >= 8 ) {
                        findCountry(indi.Country).css('fill', warningColour);
                    } else {
                        findCountry(indi.Country).css('fill', dangerColour);
                    }
                    break;
                case 'GER_1_GPI':
                case 'GER_12_GPI':
                case 'GER_23_GPI':
                    //-GPI equality between 0.97 && 1.03. 0.96 & down == inequalities against girls, 1.4 & above = disadvantage against boys
                    //lateral slider
                    break;
                
                case 'OFST_1_CP':
                case 'ROFST_1_CP':
                case 'OFST_2_CP':
                case 'ROFST_2_CP': //-out of school data. 0-9% is great, 10-19, 20-29, up to 39% - 40% and above is red
                    if ( indi.Value < 10 ) {
                        findCountry(indi.Country).css('fill', successColour);
                    } else if (indi.Value >= 16 && indi.Value < 13 ) {
                        findCountry(indi.Country).css('fill', warningColour);
                    } else if (indi.Value >= 13 && indi.Value < 40 ) {
                        findCountry(indi.Country).css('fill', warningColour);
                    } else {
                        findCountry(indi.Country).css('fill', dangerColour);
                    }
                    break;
                default:
                    alert(indi.Country);
            }
            
            //$('#queryResult').text('Country: ' + indi.Country + ', Indicator: ' + $('#indicatorSelect').find('option[value="'+indi.Indicator+'"]').text()  + ', Value: ' + indi.Value);
        });
    }
       

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

    //helper funcs
    findCountry = function(ISO) {
        var bubbles = $('.datamaps-bubble');
        var foundCountry;
        $.each(bubbles, function (i, bubble) {
            var bubbleInfo = JSON.parse( $(bubble).attr('data-info') );
            if ( bubbleInfo['name'] == ISO ) {
                foundCountry = $(bubble);
            } else {
                return;
            }
        })
        return foundCountry;
    }

})