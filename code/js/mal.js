/*
To do(-), done(+)  {
- comments
- clean code
+ seperate code
- give porper credt
- bugfix, capitalletter

Repository
- In (bijna) elke map een README.md toevoegen.
+ JavaScripts in stukjes hakken is fijn voor het overzicht.
- Binnen data folder sws een README.md, om uit te leggen hoe scripts gebruikt zijn om de data te verzamelen/processen. Aparte folders binnen de Data folder voor code/data zijn mooi. Dan moet je wel os/paths (Python) gebruiken om de data files te kunnen bereiken vanuit de code.
+ Een license toevoegen.

 credit slider:
 - https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518
 credit JS check if a file exists: Imortenson
 - https://stackoverflow.com/questions/15054182/javascript-check-if-file-exists
*/


// defines globally used variables
var dataGlob = [];
var barSelGenre;
var selTime = 2007;
var totEnt = 0;
var tooltip = d3.select("body")
                .append("div")
                .attr("class", "toolTip");
var colourLabels = {};
var username;

/*
 * Calls upon the preprocessing, makes each graph
 * and subsequently updates each graph
 */
window.onload = function() {
    username = d3.select('input[name="username"]').node().value;
    var listType = parseInt(d3.select('input[name="listOption"]:checked').node().value);;
    // decodes the JSON file
    var request = [d3.json(`../scraper/data/${username}_${listType}.json`)];
    // ensures that all data is loaded properly before calling any functions
    Promise.all(request).then(function(response) {
        // preprocesses the data
        preProcess(response);
        var barData = dataGlob[0];
        var lineData = dataGlob[1][0];
        var heatData = dataGlob[2];
        makeBarGraph(barData);
        makeLineGraph(lineData);
        makeHeatGraph(heatData);
    }).catch(function(e){
             throw(e);
             });
    d3.selectAll('input[name="listOption"]')
      .on("change", function(d) {
                    updateAll();
                    });
};

/*
 * check if the called upon file exists and calls upon all update functions
 */
const updateAll = function(via){
    fileExists;
    // check if the username needs to be updated
    if (via == "viaSubmit"){
       username = d3.select('input[name="username"]').node().value;
    };
    // check which listdata to obtain
    var listOption = d3.select('input[name="listOption"]:checked')
    var listType = parseInt(listOption.node().value);

    // obtain data location
    var json = `../scraper/data/${username}_${listType}.json`;
    // check if file exists, else return an alert
    if (!fileExists(json)) {
        return alert("Invalid Username or List Selection");
    };

    var request = [d3.json(json)];
    // extract data, preprocess and update all charts
    Promise.all(request).then(function(response) {
        // prevents a non-existent genre (error) to
        // be represented in the heatchart
        barSelGenre = undefined;
        // preprocesses and updates all charts
        preProcess(response);
        // updates all genre-colour combination
        assignColours();
        updateBars();
        updateLine();
        updateHeat();
    }).catch(function(e){
             throw(e);
             });

   // checks if the file to be used exists
   function fileExists(url){
       //credit: Imortenson, https://stackoverflow.com/questions/15054182/javascript-check-if-file-exists
       var http = new XMLHttpRequest();
       http.open('HEAD', url, false);
       http.send();
       return http.status!=404;
   }
}
/*
calls the the preprocess functions and updates all the data
*/
const preProcess = function(data){
    //resets dataGlob if a new list type is selected
    dataGlob = [];
    // calls upon the preprocessing functions of each chart
    var data = data[0];
    totEnt = data.length;
    var barData = preBarData(data);
    var lineData = preLineData(data);
    var heatData = preHeatData(data);
    dataGlob.push(barData, lineData, heatData);
    assignColours();
};

// assigns colours to each genre
const assignColours = function(){
    colourLabels = {};
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    var index = 0;
    // gives each genre a colour depending on the current index
    for (genre of Object.keys(dataGlob[1][1])){
        colourLabels[genre] = color(index);
        index++;
    };
};
