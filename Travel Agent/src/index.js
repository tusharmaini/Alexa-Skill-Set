'use strict';
var KEY_CURRENT_INDEX = "session.sessionId";
var KEY_LOCATION = 'KEY_LOCATION';
var KEY_CHECKIN = 'KEY_CHECKIN';
var KEY_CHECKOUT = 'KEY_CHECKOUT';
var KEY_LAT = 'KEY_LAT';
var KEY_LONG = 'KEY_LONG';
var KEY_GUESTCOUNT = 'KEY_GUESTCOUNT';
var KEY_SESSIONID = 'KEY_SESSIONID';
var KEY_AMENITIES_PREFERENCE = "Amenities_Preference";
var KEY_PRICE_PREFERENCE = 'Price_Preference';
var KEY_CHAIN_PREFERENCE = 'Chain_Preference';
var KEY_STAR_RATING_PREFERENCE = 'Star_Rating_Preference';
var KEY_HOTELS_SPEACH = 'KEY_HOTELS_SPEACH';
var KEY_HOTELS_OPTION1 = 'KEY_HOTELS_OPTION1';
var KEY_HOTELS_OPTION2 = 'KEY_HOTELS_OPTION2';
var KEY_HOTELS_OPTION3 = 'KEY_HOTELS_OPTION2';
var KEY_HOTELS_SELECTED = 'KEY_HOTELS_SELECTED';

var Promise = require('bluebird');
var moment = require('moment');
var http = require("http");
var https = require("https");
var url = require('url');

var baseUrl = 'https://public-be.stage.oski.io';
var tenantId = 'demo';
var posId = '103';
var currency = 'USD';
var culture = 'en-US';
var AlexaSkill = require('./AlexaSkill');

var aws = require("aws-lib");
var TravelAgent = function () {
    AlexaSkill.call(this, undefined);
};

// Extend AlexaSkill
TravelAgent.prototype = Object.create(AlexaSkill.prototype);
TravelAgent.prototype.constructor = TravelAgent;

TravelAgent.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("TravelAgent onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);    
};

TravelAgent.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("TravelAgent onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    getWelcomeResponse(response);
};

TravelAgent.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("TravelAgent onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session cleanup logic would go here
};

TravelAgent.prototype.intentHandlers = {
    "Location": function (intent, session, response) {
       handleLocation(intent, session, response);
    },

    "Number_Of_Guests": function (intent, session, response) {
        handleNumberOfGuest(intent, session, response);
    },

    "Checkin_Checkout_Dates": function (intent, session, response) {
        handleDates(intent, session, response);
    },

    "Checkin_Duration": function (intent, session, response) {
        saveCheckInDuration(intent, session, response);
    },
   
    "No_Preference": function (intent, session, response) {
        noPreference(intent, session, response);
    },

    "Amenities_Preference": function (intent, session, response) {
        saveAmenitiesPreference(intent, session, response);
    },

    "Price_Preference": function (intent, session, response) {
        savePricePreference(intent, session, response);
    },

    "Chain_Preference": function (intent, session, response) {
        saveChainPreference(intent, session, response);
    },

    "Star_Rating_Preference": function (intent, session, response) {
        saveStarRatingPreference(intent, session, response);
    },
    "Repeat_Result": function (intent, session, response) {
        handleRepeatResult(intent, session, response);
    },
    "More_About_Hotel": function (intent, session, response) {
        handleHotelDetails(intent, session, response);
    },

    "Go_Ahead": function (intent, session, response) {
        handleGoAhead(intent, session, response);
    },


    "AMAZON.HelpIntent": function (intent, session, response) {
        helpTheUser(intent, session, response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

function getWelcomeResponse(response) {
    var speechText = "",
        repromptText = "",
        speechOutput,
        repromptOutput;

    speechText = "<speak>Hi John, How can I help you?" +
        "<break time=\"0.4s\" />" +
        " To get started you can say things like, " +
        "I want to book a hotel in Paris " +
        "</speak>";

    repromptText = "<speak> To get started you can say things like, " +
        "I want to book a hotel in Paris " +
        "</speak>";
    speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.SSML
    };
    repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.SSML
    };
    response.ask(speechOutput, repromptOutput);
    return;
}

function handleLocation(intent, session, response) {
    var speechText = "",
        repromptText = "",
        speechOutput,
        repromptOutput = {
            speech: "<speak> Sorry, I could not get that location, Could you please say repeat !!! </speak>",
            type: AlexaSkill.speechOutputType.SSML
        };
    
    var cityName = intent.slots.City.value;

    if (cityName) {

        session.attributes[KEY_LOCATION] = cityName;
        
        saveLatLong(cityName, session);

        speechText = "<speak> Great. Are you traveling alone or with friends or family ? </speak> ";
    }
    else {
        speechText = "<speak> Sorry, I could not get that location, Could you please say repeat !!! </speak>";

    }
    speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.SSML
    };

    response.ask(speechOutput, repromptOutput);
    return;

}

function handleNumberOfGuest(intent, session, response) {
    var speechText = "",
        repromptText = "",
        speechOutput,
        repromptOutput;

    var adultCount = intent.slots.CountOne.value;
    var childCount = intent.slots.CountTwo.value;
    var alone = intent.slots.Alone.value;
    var adultValue = 0;
    var childValue = 0;
    var aloneValue = 0;

    if (adultCount) {
        adultValue = parseInt(adultCount);
    }

    if (childCount) {
        childValue = parseInt(childCount);
    }

    if (alone) {
        aloneValue = 1;
    }
    var totalCount = adultValue + childValue + aloneValue;

    if (totalCount == 0) {

        speechOutput = "</speak> Hey, Can you please confirm who all are travelling ? </speak>";
    }

    else {

        session.attributes[KEY_GUESTCOUNT] = totalCount;

        speechText = "<speak> Got it. What dates are you looking for ? </speak>";
    }
    speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.SSML
    };
    response.ask(speechOutput);
    return;
}

function handleDates(intent, session, response) {
    var speechText = "",
        repromptText = "",
        speechOutput,
        repromptOutput;

    var checkInDate = intent.slots.DateOne.value;
    var checkOutDate = intent.slots.DateTwo.value;

    if (checkInDate && checkOutDate) {
        session.attributes[KEY_CHECKIN] = getFormattedDate( new Date(checkInDate));
        session.attributes[KEY_CHECKOUT] = getFormattedDate(new Date(checkOutDate));
         fireSearch(session).then(function (sessionId) {

              if(sessionId){  
                session.attributes[KEY_SESSIONID] = sessionId;  
                speechText = "<speak> Do you have any specific preferences for stay ? Like any specific chain  or some ratings </speak>";
                speechOutput = {
                    speech: speechText,
                    type: AlexaSkill.speechOutputType.SSML
                }; 
           
            response.ask(speechOutput);
            return;
        }
            else{
                speechText = "<speak> Not able find hotels for you. Sorry !!! </speak>";
            speechOutput = {
                speech: speechText,
                type: AlexaSkill.speechOutputType.SSML               
            } ;
                response.ask(speechOutput);
                return;
            }

        }, function (reason) {
            speechText = "<speak> Not able find hotels for you. Sorry !!! </speak>";
            speechOutput = {
                speech: speechText,
                type: AlexaSkill.speechOutputType.SSML
            };
            response.ask(speechOutput);
            return;

        });
    }
    else {
        speechText = "<speak> I couldn't pick-up what you said, could you please repeat </speak>";

        speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.SSML
        };
        response.ask(speechOutput);
        return;
    }

}



function saveCheckInDuration(intent, session, response) {
    var speechText = "",
        repromptText = "",
        speechOutput,
        repromptOutput;
        var duration = 0;

    console.log(JSON.stringify(intent.slots));
    var duration = parseInt(intent.slots.Number.value) ;
    var checkInDate = intent.slots.Date.value;
     
    session.attributes[KEY_CHECKIN] = getFormattedDate( new Date(checkInDate));
    console.log(session.attributes[KEY_CHECKIN] );
    console.log(duration)
    if(duration == 0)
        duration = 1;
    session.attributes[KEY_CHECKOUT] = getFormattedDate( getForwardDate(new Date(checkInDate),duration));
    console.log(session.attributes[KEY_CHECKOUT] );
     fireSearch(session).then(function (sessionId) {

              if(sessionId){  
                session.attributes[KEY_SESSIONID] = sessionId;  
                speechText = "<speak> Do you have any specific preferences for stay ? Like any specific chain  or some ratings </speak>";
                speechOutput = {
                    speech: speechText,
                    type: AlexaSkill.speechOutputType.SSML
                }; 
           
            response.ask(speechOutput);
            return;
        }
            else{
                speechText = "<speak> Not able find hotels for you. Sorry !!! </speak>";
            speechOutput = {
                speech: speechText,
                type: AlexaSkill.speechOutputType.SSML               
            } ;
                response.ask(speechOutput);
                return;
            }

        }, function (reason) {
            speechText = "<speak> Not able find hotels for you. Sorry !!! </speak>";
            speechOutput = {
                speech: speechText,
                type: AlexaSkill.speechOutputType.SSML
            };
            response.ask(speechOutput);
            return;

        });
}

function getForwardDate(fromDate , days){
    console.log(fromDate,days);
   return new Date(fromDate.setDate(fromDate.getDate() + days)); 
}

function fireSearch(session) {
    var request = { 'stayPeriod': { 'checkIn': '', 'checkOut': '' }, 'circle': { 'center': { 'lat': 0, 'long': 0 } }, 'guestCount': 0 };
    request.stayPeriod.checkIn = session.attributes[KEY_CHECKIN];
    request.stayPeriod.checkOut = session.attributes[KEY_CHECKOUT];
    request.circle.center.lat = session.attributes[KEY_LAT];
    request.circle.center.long = session.attributes[KEY_LONG];
    request.guestCount = session.attributes[KEY_GUESTCOUNT];

    return initAsync(request);
}

function noPreference(intent, session, response) {
    var speechText = "", speechOutput, repromptOutput;
    var hotels = getResults(session.attributes[KEY_SESSIONID],null)
    .then(function(result){

        var option1 = "option 1<break time=\"0.5s\" />" + result.hotels[0].name + "<break time=\"0.5s\" />starting from " +Math.ceil(result.hotels[0].fare.totalFare) + " dollars" ;
        session.attributes[KEY_HOTELS_OPTION1] = result.hotels[0];
        var option2 = "option 2<break time=\"0.5s\" />" + result.hotels[1].name + "<break time=\"0.5s\" />starting from " +Math.ceil(result.hotels[1].fare.totalFare) + " dollars" ;
        session.attributes[KEY_HOTELS_OPTION2] = result.hotels[1];
        var option3 = "option 3<break time=\"0.5s\" />" + result.hotels[2].name + "<break time=\"0.5s\" />starting from " +Math.ceil(result.hotels[2].fare.totalFare )+ " dollars" ;
        session.attributes[KEY_HOTELS_OPTION3] = result.hotels[2];

        speechText = '<speak> My suggestion for you are,' +
                    '<break time=\"0.8s\" />'+
                    option1 +
                     '<break time=\"1.s\" />'+
                     option2 +
                      '<break time=\"1.s\" />'+
                      option3 +     
                      '<break time=\"1.s\" />' +
                      'Which option do you prefer ?' +                                
                      '</speak>';

        session.attributes[KEY_HOTELS_SPEACH]   =  speechText           
        speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.SSML
    };

    repromptOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.SSML
    };
     response.ask(speechOutput, repromptOutput);
     return;


    }, function(error){
        
        speechText = "<speak> Sorry couldn't get hotels right now !!!"+ JSON.stringify(error) +" </speak>";

        speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.SSML
         };
    
    response.ask(speechOutput, repromptOutput);
    return;

    });
    
}

function handleRepeatResult(intent, session, response) {
    var speechText = "",
        repromptText = "",
        speechOutput,
        repromptOutput;

   
    speechOutput = {
        speech: session.attributes[KEY_HOTELS_SPEACH],
        type: AlexaSkill.speechOutputType.SSML
    };
    repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.SSML
    };
    response.ask(speechOutput, repromptOutput);
    return;
}

function handleHotelDetails(intent, session, response){
    var speechText = "",
        repromptText = "",
        speechOutput,
        repromptOutput;

      var selectedOption = intent.slots.SelectedHotelOption.value;

      var hotel =  getSelectedHotel(selectedOption,session);     

      if(hotel){

          session.attributes[KEY_HOTELS_SELECTED] = selectedOption;

          var name = selectedOption +" is , <break time=\"0.5s\" />" +hotel.name;
          var room = "<break time=\"0.5s\" /> where your room would be <break time=\"0.5s\" />" + hotel.rooms[0].name;
          var bed = '';
         
          if(hotel.rooms[0].bedDetails && hotel.rooms[0].bedDetails.length > 0 && hotel.rooms[0].bedDetails[0].desc){
            bed = "<break time=\"0.5s\" /> and with <break time=\"0.5s\" />" + hotel.rooms[0].bedDetails[0].desc;
            }
        var price = " <break time=\"0.5s\" /> This booking will cost you approximately " + Math.ceil( hotel.fare.totalFare) + " dollars , inclusive of all government taxes." ;
        var confirmationMessage = "<break time=\"1.0s\" /> Do you like this hotel ? <break time=\"0.5s\" /> To confirm say Go Ahead <break time=\"0.5s\" /> or ask to repeat options."
          speechText = "<speak> " +name + room + bed+ price + confirmationMessage +" </speak>";
      }
      else{
          speechText = + "<speak> " + selectedOption +" is an incorrect option. Please choose between option one , option two and option 3 </speak>";
      }
   
    speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.SSML
    };
    repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.SSML
    };
    response.ask(speechOutput, repromptOutput);
    return;

}

function getSelectedHotel(selectedOption,session){

    if((selectedOption.indexOf('one') > -1 ) || (selectedOption.indexOf('1') > -1))
    return  session.attributes[KEY_HOTELS_OPTION1] ; 
    

    if((selectedOption.indexOf('two') > -1 ) || ( selectedOption.indexOf('2') > -1))
    return session.attributes[KEY_HOTELS_OPTION2] ; 


    if((selectedOption.indexOf('three') > -1 ) || ( selectedOption.indexOf('3') > -1))
    return session.attributes[KEY_HOTELS_OPTION3] ;   

    return null;     
}

function handleGoAhead(intent, session, response){
    var speechText = "", speechOutput, repromptOutput;
    speechText = "<speak> Glad to know that you like the hotel" +
       "<break time=\"0.5s\" /> I have both email and messaged you the hotel details."+
       "<break time=\"0.5s\" /> do book at your own convenience. Bye ! Have a nice day "+
        "</speak>";

    var hotel = getSelectedHotel(session.attributes[KEY_HOTELS_SELECTED],session);
    var textMessage = "To Book " + hotel.name + ", click : HERE";
    
    sendSms("+919960936366",textMessage );
    sendMail("tmaini@tavisca.com","alexatavisca@tavisca.com","Hotel Itinerary : "+ hotel.name,"",textMessage); 
    
    
    var delay=2000; //1 second

setTimeout(function() {
  speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.SSML
    };
    
    response.ask(speechOutput, repromptOutput);
    return;
}, delay);   

}
/**
 *This method will save amenities preference in session
 */
function saveAmenitiesPreference(intent, session, response) {
    var speechText = "", speechOutput, repromptOutput;
    if (!session.attributes[KEY_AMENITIES_PREFERENCE]) {
        session.attributes[KEY_AMENITIES_PREFERENCE] = [];
    }
    if (intent.slots.AmenitiesOne && intent.slots.AmenitiesOne.value)
        session.attributes[KEY_AMENITIES_PREFERENCE].push(intent.slots.AmenitiesOne.value);
    if (intent.slots.AmenitiesTwo && intent.slots.AmenitiesTwo.value)
        session.attributes[KEY_AMENITIES_PREFERENCE].push(intent.slots.AmenitiesTwo.value);

    speechText = "We have triggered a search for you";
    var repromptText = "<speak> Please repeat the amenities preference </speak>";
    speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.SSML
    };
    repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.SSML
    };
    response.ask(speechOutput, repromptOutput);
    return;

}
/**
 * This method will save price preference in session
 */
function savePricePreference(intent, session, response) {
    var speechText = "", speechOutput, repromptOutput;
    session.attributes[KEY_PRICE_PREFERENCE] = intent.slots.Price.value;

    speechText = "Please give your amenities prefrence";
    var repromptText = "<speak> Please repeat the amenities preference </speak>";
    speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.SSML
    };
    repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.SSML
    };
    response.ask(speechOutput, repromptOutput);
}
/**
 * This method will save hotel chain preference in session
 */
function saveChainPreference(intent, session, response) {
    var speechText = "", speechOutput, repromptOutput;
    session.attributes[KEY_CHAIN_PREFERENCE] = intent.slots.Chain.value;

    speechText = "Please give your Price prefrence";
    var repromptText = "<speak> Please repeat the Price preference </speak>";
    speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.SSML
    };
    repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.SSML
    };
    response.ask(speechOutput, repromptOutput);

}
/**
 * This method will save star rating preference in session
 */
function saveStarRatingPreference(intent, session, response) {
    var speechText = "", speechOutput, repromptOutput;
    session.attributes[KEY_STAR_RATING_PREFERENCE] = intent.slots.Rating.value;

    speechText = "Please give your chain prefrence";
    var repromptText = "<speak> Please repeat the chain preference </speak>";
    speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.SSML
    };
    repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.SSML
    };
    response.ask(speechOutput, repromptOutput);
}

var defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept-Language': culture,
    'oski-tenantId': tenantId
}

function getStayPeriod(searchRequest) {
    return {
        start: moment(searchRequest.stayPeriod.checkIn).format("MM/DD/YYYY"),
        end: moment(searchRequest.stayPeriod.checkOut).format("MM/DD/YYYY")
    };
}

function getBounds(searchRequest) {
    var circle = searchRequest.circle;
    return {
        circle: {
            center: {
                lat: circle.center.lat,
                long: circle.center.long
            },
            radiusKm: Math.round(circle.radiusKm || 25)
        }
    };
}

function getOccupancies(searchRequest) {
    var guestCount = searchRequest.guestCount;
    var occupants = [];
    for (var i = 0; i < guestCount; i++) {
        occupants.push({
            type: 'adult',
            age: '25'
        });
    }

    return [{
        occupants: occupants
    }];
}

function pollToCompletion(sessionId) {
    var requestData = {
        sessionId: sessionId
    };

    var url = baseUrl + '/hotel/v1.0/search/status';
    return new Promise(function (resolve, reject) {
        function poll() {
            postJSON(url, requestData, function (statusCode, response) {
                if (response.status.toLowerCase().includes("complete"))
                    resolve();
                else
                    setTimeout(poll, 200);
            }, function (reason) {
                reject(reason);
            }, {
                    headers: defaultHeaders
                });
        }

        poll();
    });
}

function fetchResults(sessionId) {
    var resultsRequest = {
        sessionId: sessionId,
        currency: currency,
        contentPrefs: ["Basic", "amenities"],
        optionalDataPrefs: ["All"]
    };

    var url = baseUrl + '/hotel/v1.0/search/results/all';

    return new Promise(function (resolve, reject) {
        postJSON(url, resultsRequest, function (statusCode, response) {
            resolve(response);
        }, function (reason) {
            reject(reason);
        }, {
                headers: defaultHeaders
            });
    });
}

function initAsync(searchRequest) {
    return new Promise(function (resolve, reject) {
        var requestData = {
            posId: posId,
            currency: currency,
            stayPeriod: getStayPeriod(searchRequest),
            bounds: getBounds(searchRequest),
            roomOccupancies: getOccupancies(searchRequest)
        };

        var url = baseUrl + '/hotel/v1.0/search/init';
        postJSON(url, requestData, function (statusCode, response) {
            if (statusCode == 200) {
                resolve(response.sessionId);
                return;
            }

            var errorMessage = "";
            var errorInfo = response.info;
            if (errorInfo) {
                for (var i = 0; i < errorInfo.length; i++)
                    errorMessage += errorInfo[i].message + "\n";
            }
            reject(errorMessage || 'Unknown failure');
        }, function (reason) {
            reject(reason);
        }, {
                headers: defaultHeaders
            });
    });
}

function getResults(sessionId, filters) {
    return pollToCompletion(sessionId).then(function () {
        return sessionId;
    })
        .then(function (sessionId) {
            return fetchResults(sessionId);
        })
        .then(function (results) {
            results.hotels = getFilteredResults(results.hotels, filters);
            return results;
        });

}

var send = function (uri, method, onSuccess, onError, options) {
    if (process.env.NODE_ENV !== 'production') {
        if (uri === '' || uri === undefined || uri === '') throw new Error('Invalid parameter, `Uri`');

        if (typeof (onSuccess) !== 'function') throw new Error('Invalid parameter, `onSuccess` should be a function');
        if (typeof (onError) !== 'function') throw new Error('Invalid parameter, `onError` should be a function');
    }

    var payLoad;
    switch (method) {
        case 'POST':
        case 'PUT':
            if (!options.data) throw Error('Invalid parameter, `options.data` for POST action');
            if (typeof (options.data) !== 'string')
                payLoad = JSON.stringify(options.data);
            else
                payLoad = options.data;
            break;
        case 'DELETE':
            if (options.data) {
                if (typeof (options.data) === 'string')
                    payLoad = JSON.stringify(options.data);
                else
                    payLoad = options.data;
            }
    }

    var isHttps = uri.indexOf('https') === 0;
    var web = isHttps ? https : http;
    options = options || {};
    options.context = options.context || this;

    // Parse the URL
    var urlObj = url.parse(uri);
    var opts = {
        protocol: urlObj.protocol,
        host: urlObj.hostname,
        path: urlObj.path,
        port: urlObj.port || (isHttps ? 443 : 80),
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    }

    // method specific handling
    switch (method) {
        case 'POST':
        case 'PUT':
            opts.headers['Content-Length'] = Buffer.byteLength(payLoad, 'utf8');
        case 'DELETE':
            if (payLoad)
                opts.headers['Content-Length'] = Buffer.byteLength(payLoad, 'utf8');
            break;
    }

    if (options.headers) {
        for (var header in options.headers) {
            opts.headers[header] = options.headers[header];
        }
    }

    var request = web.request(opts, function (res) {
        var output = '';
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function () {
            var obj = null;
            if (output !== '')
                obj = JSON.parse(output);
            onSuccess.call(options.context, res.statusCode, obj);
        });
    });

    request.on('error', function (e) {
        var error = {};
        if (e && e.code === 'ENOENT') {
            error.message = 'Can not connect to the host';
            error.innerException = e;
        } else error = e;
        onError.call(options.context, 500, error);
    });

    // method specific handling
    switch (method) {
        case 'POST':
        case 'PUT':
            request.write(payLoad);
            break;
        case 'DELETE':
            if (payLoad)
                request.write(payLoad);
            break;
    }

    request.end();
};

function getJSON(uri, onSuccess, onError, options) {
    send(uri, 'GET', onSuccess, onError, options);
}

function postJSON(uri, data, onSuccess, onError, options) {
    options = options || {};
    options.data = data;
    send(uri, 'POST', onSuccess, onError, options);
}

function putJSON(uri, data, onSuccess, onError, options) {
    options = options || {};
    options.data = data;
    send(uri, 'PUT', onSuccess, onError, options);
}

function deleteJSON(uri, data, onSuccess, onError, options) {
    options = options || {};
    options.data = data;
    send(uri, 'DELETE', onSuccess, onError, options);
}

function matchesPriceFilter(hotel, minFare, maxFare) {
    return (hotel.fare.totalFare >= minFare) && (hotel.fare.totalFare <= maxFare);
}

function matchesChainPreference(hotel, chainName) {
    if (!hotel.hotelChain || !hotel.hotelChain.name)
        return false;

    return hotel.hotelChain.name.toLowerCase().indexOf(chainName.toLowerCase()) > -1;
}

function matchesRatingFilter(hotel, minRating) {
    return hotel.rating && hotel.rating >= minRating;
}

function hasRequestedAmenities(hotel, requestedAmenities) {
    if (!hotel.amenities || hotel.amenities.length === 0)
        return false;

    for (var i = 0; i < requestedAmenities.length; i++) {
        var requestedAmenity = requestedAmenities[i];
        var match = hotel.amenities.find(function (amenity) {
            return amenity.name.toLowerCase().indexOf(requestedAmenity.toLowerCase()) > -1;
        });
        if (match === null)
            return false;
    }
    return true;
}

function getFilteredResults(hotels, filters) {
    if (!hotels || hotels.length === 0 || !filters)
        return hotels;

    var filteredResults = [];
    var minFare = filters.minFare || 0;
    var maxFare = filters.maxFare || Number.MAX_VALUE;
    var chainName = filters.chainName;
    var amenities = filters.amenities || [];
    var minRating = filters.minRating || 0;
    for (var i = 0; i < hotels.length; i++) {
        var hotel = hotels[i];
        if (!matchesRatingFilter(hotel, minRating))
            continue;
        if (!matchesPriceFilter(hotel, minFare, maxFare))
            continue;
        if (chainName && !matchesChainPreference(hotel, chainName))
            continue;
        if (amenities.length > 0 && !hasRequestedAmenities(hotel, amenities))
            continue;

        filteredResults.push(hotel);
    }

    return filteredResults;
}


function saveLatLong(cityname, session) {
    switch (cityname) {
        case "Paris":
            session.attributes[KEY_LAT] = 48.8566;
            session.attributes[KEY_LONG] = 2.3522;
            break;
        case "London":
            session.attributes[KEY_LAT] = 51.5074;
            session.attributes[KEY_LONG] = 0.1278;
            break;
        case "New York":
            session.attributes[KEY_LAT] = 25.7617;
            session.attributes[KEY_LONG] = 80.1918;
            break;
    }
}

function getFormattedDate(pdate) {   
    var year = pdate.getFullYear();
    var month = (1 + pdate.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;
    var day = pdate.getDate().toString();
    day = day.length > 1 ? day : '0' + day;
    return year + '/' + month + '/' + day;
}
/**
 * This method will create and return filter object for oski api from session
 */
function getFilterObject(request, session) {
    var filters = {};
    filters.filters.amenities = session.attributes[KEY_AMENITIES_PREFERENCE];
    filters.filters.maxFare = session[KEY_PRICE_PREFERENCE];
    filters.filters.chainName = session[KEY_CHAIN_PREFERENCE];
    filters.filters.minRating = session[KEY_STAR_RATING_PREFERENCE];
    return filters;
}

function helpTheUser(intent, session, response) {
    var speechText = "You can ask for the hotel bookings . " +
        "For example, get best sellers for books, or you can say exit. " +
        "Now, what can I help you with?";
    var repromptText = "<speak> I'm sorry I didn't understand that. You can say things like, " +
        "books <break time=\"0.2s\" /> " +
        "movies <break time=\"0.2s\" /> " +
        "music. Or you can say exit. " +
        "Now, what can I help you with? </speak>";

    var speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.SSML
    };
    response.ask(speechOutput, repromptOutput);
}

  function sendSms(to, message) {
    var twilio = require('twilio');

    var client = twilio('*******', '********');
    client.sendMessage({
        to: to,
        from: '+********* ',
        body: message
    },function (error, info) {
       if (error) {
            console.log(JSON.stringify(error));
       }
            console.log('Message sent: ' + info.response);
   });
};

 function sendMail(to, from, subject, htmlInput, textInput) {
    var nodemailer = require("nodemailer");
    var smtpConfig = {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'alexatavisca@gmail.com',
            pass: '*********!'
        }
    };

    var transporter = nodemailer.createTransport(smtpConfig);
    var mailOptions = {
        from: from,
        to: to,
        subject: subject,
        text: textInput,
        html: htmlInput
    };

    transporter.sendMail(mailOptions,function (error, info) {
       if (error) {
            console.log(JSON.stringify(error));
       }
       console.log('Message sent: ' + info.response);
   });
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var travelAgent = new TravelAgent();
    travelAgent.execute(event, context);
};