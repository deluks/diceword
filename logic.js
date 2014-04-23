var wordlistLang = "";

var loadWordlist = function (regioncode) {
    $("#xhrstatus").text("loading "+regioncode);
    $("div.result").hide();
    var path = "";
    var delimiter = "";

    switch (regioncode) {
      case "de" : path = "diceware_german.txt"; delimiter = "\n\n"; break; 
      case "en" : path = "diceware.wordlist.asc"; delimiter = "\n"; break;
      case "es" : path = "DW-Espanol-1.txt"; delimiter = "\n"; break;
    } // which wordlistfile to load and how to compile it

    $.get(path, function(response){
    	if (regioncode == "de") response = response.replace(/[\uFFFD\0]/g, ""); // killing strange characters (NULL and REPLACEMENT CHARACTER) from german wordlist

      list = response.split(delimiter); // put each line of wordlist in an array: ["11111 word", "11112 letter", ...]
      list_l = list.length;
      
      wordlist = {};
      wordlistError = "";
      
      for ( var i=0; i<list_l; i++){
      	var array = list[i].split("\t"); // split each line at the tab character -> ["11111", "word"]
        var position = parseInt(array[0]);
        if( position >= 11111 && position <= 66666) { // check if we got a proper number
          wordlist[position] = array[1]; // -> { 11111: "word" }
        }
      }
      
//        console.log(wordlist);
      
      // does the wordlist object contain all positions? (11111 to 66666)?
      for ( var i=0; i<=7775; i++ ){ // well, we need to count from 11111 to 66666. but the highest digest is 6 and there are no zeros. Hence we count from 0 to 7555 and in the next line ...
      	var position = parseInt(i.toString(6))+11111; // ... we convert the number to base 6 which results in a range from 0 to 55555. By adding 11111 we eliminate everything below 11111 and also every number containing a 0 and push the highest number from 55555 to 66666.
      	if (!wordlist.hasOwnProperty(position)) {
          wordlistError = "ERROR: wordlist is missing position "+position
          $("#xhrstatus").add("span").addClass("error").html("Error while loading "+path);
          throw(wordlistError); // every number should be a property in the wordlist object, if one is not, a error gets thrown.
        }
      }
      

      
    }, "text").complete(function() { 
	
		if(!wordlistError) {
        	 $("#xhrstatus").text(path+" wordlist loaded"); // show which wordlist was loaded
        }else { 
        	$("#xhrstatus").text(wordlistError);
        }
        refreshBoxes(false); // reset the input boxes
    });
}

var convertInput = function ( event ) {
    var $input = $(event.target);
	var value = $input.val();
    var $parent = $input.parent();
    if( /^[1-6]{5}$/.test(value) && !wordlistError ) { // check if input is sane
          $input.nextAll("div.arrow_box").fadeOut(); // error box goeth ...
          $input.nextAll("div.arrow").fadeIn(); // ... and arrow cometh!
          
          $input.nextAll("div.result")
          			.text( wordlist[value] )
                    	.fadeIn(); // found word gets displayed
          
//          wiktionaryCall(wordlist[value], function(data) { $input.nextAll("div.definition").html(data.parse.text);} );
          
          if ($parent.hasClass("last")) {            
            $parent.removeClass("last");
            $parent.next().addClass("last").fadeIn().find("input").focus(); // next input box appears and input element gets focus
          } else {
          	$("div.word.last").find("input").focus();
          }
      }else if (wordlistError){
      	$input.nextAll("div.arrow_box").text("ERROR in wordlist!").fadeIn();
      }else {
          $input.nextAll("div.arrow_box").text("five digits, 1-6").fadeIn(); // error box!
          $input.nextAll("div.arrow").fadeOut(); // arrow be gone
          $input.nextAll("div.result").fadeOut(); // invalid input = no word
      }
}

var wiktionaryCall = function ( word, callback ) {
	console.log("querying wiktionary.org...");
    $.getJSON("http://"+wordlistLang+".wiktionary.org/w/api.php?action=parse&format=json&callback=?", 
    	{page:word, prop:"text", mobileformat:"html"}, 
        function(data) {
        	console.log(data);
			callback(data);
    	}
    );
}

var killBox = function ( $box ) {
    $box.hide();
	$box.find("input").val("");
    $box.find("div.result").text("").hide();
    $box.find("div.arrow").hide();
//    $("input:visible:last").focus();
}
var refreshBoxes = function ( kill ) { // after wordlist was changed, display the new words for the existing numbers
	if(kill == true){
    	$("div.word").each( function(){killBox( $(this) )} );
        $("#word1").addClass("last").fadeIn();
    }else {
      if(!$("div.word").is(":visible")) $("#word1").addClass("last").fadeIn();
      $("div.word").each( function() {
          var value = $(this).find("input").val();
          if (value) $(this).find("input").trigger("keyup"); 
      });
    }
	$("input:visible:last").focus(); // focus the last visible input box
}

$(document).ready(function() {
	redrawThese = $("input, div.result");
    $(window).resize( function(){ redrawThese.css("z-index", "1"); } ); // force a redraw of these elements when the window is resized. -> adjusted fontsize and boxwidth
    
	$("button").click( function(){refreshBoxes(true);} );
    $("select").on("change", function(){
    										wordlistLang = $(this).val();
                                            loadWordlist(wordlistLang); 
    									}
                  ).trigger("change"); // load wordlist when selectbox gets changed. also trigger this event at pageload
    
    $("input").on("keyup", convertInput);
    $("div.word input").blur( function() { 
    	if ( $(this).val() == "" && !$(this).parent().hasClass("last") ) {
        	killBox( $(this).parent() );
        }
    });
});