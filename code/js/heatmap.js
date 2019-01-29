/*
Created by: Julian Evalle

This program preprocesses data and creates updateable and interactable heatmap with
a selection of what to represent

data obtained from crawling a MyAnimeList(MAL) account

credit on how to sort on two variables:
// https://coderwall.com/p/ebqhca/javascript-sort-by-two-fields
*/


// preprocesses Heatmap data
const preHeatData = function(data){
    var genreDict = {};
    var genreDictDays = {};
    var lowestYear = 1986

    // go through all the data
    for (variable of data){
        var title = variable[0];
        var year = variable[2];
        var season = variable[3];
        // filter data outside the range of the heatmap
        if (year < lowestYear){
            continue
        }
        // go through all the genres of the entry
        for (genre of variable[8]){
            // check if data is relevant
            if ((genre == "unknown") || (season == "unknown")){
                continue
            };
            // check if the genre has been seen before
            if (!(genreDict[genre])){
               genreDict[genre] = {};
            };
            inDict = genreDict[genre];
            // check if the year has been seen before within that genre
            if (!(inDict[year])){
               inDict[year] = {};
            };
            inYear = inDict[year];
            // chech if the season within that year has been seen before
            if (!(inYear[season])){
               inYear[season] = [];
            };
            inYear[season].push(title);
        };
    };
    var seasons = ["Winter", "Spring", "Summer", "Fall"];
    // creates an array with all the possible years will be represented in the heatmap
    var yearRange = Array.from(new Array(33), (x,i) => i + lowestYear);
    // fill up the missing years and missing seasons with an empty array
    for (year of yearRange){
        for (genre of Object.keys(genreDict)){
            if(!genreDict[genre][year]){
                genreDict[genre][year] = {};
            };
            // check if season within the year exists, else insert an ampty array
            for (season of seasons){
                if(!genreDict[genre][year][season]){
                    genreDict[genre][year][season] = [];
                };
            };
        };
    };
    // reorder the data to {genre:,year:,season:,amount:}
    var genreList = [];
    for (genre of Object.keys(genreDict)){
        var inGenre = genreDict[genre];
        for (year of Object.keys(inGenre)){
            var inYear = inGenre[year];
            // check to which season the entry corresponds and replace it with a number
            // usable in the heatmap
            for (season of Object.keys(inYear)){
                var heatEntry = {};
                heatEntry["genre"] = genre;
                if (season == "Winter"){
                    heatEntry["season"] = 0;
                }
                else if (season == "Spring"){
                   heatEntry["season"] = 1;
                }
                else if (season == "Summer"){
                   heatEntry["season"] = 2;
                }
                else {
                   heatEntry["season"] = 3;
                };
                heatEntry["year"] = year;
                heatEntry["amount"] = inYear[season];
                genreList.push(heatEntry);
              };

            };
        };
    return genreList;
}
// creates the SVG for the heatmap
const makeHeatGraph = function(data){
    makeHeatLegend;
    // create svg and define dimensions
    svg = d3.select("body")
          .append("svg")
          .attr("class", "heatchart");
    var width = parseInt(svg.style("width"));
    var height = parseInt(svg.style("height"));
    var pad = {
                top: height * 0.2,
                bottom: height * 0.4,
                left: width* 0.15,
                right: width * 0.1
              };

    // create agenda and agenda header element
    d3.select("body")
       .append("div")
       .attr("width", width)
       .attr("height", height)
       .attr("class", "agenda")
    d3.select("body")
      .append("div")
      .attr("class", "agendaHeader")
          .append("text")
          .text("Try to click on a square")

    // creates the Title
    svg.append("text")
        .attr("class", "tLabHeat")
        .attr("y", height * 0.05)
        .attr("x", width * 0.55)
        .style("text-anchor", "middle")
    // creates the Y-axis label
    svg.append("text")
        .attr("class", "yLabHeat")
        .attr("transform", "rotate(-90)")
        .attr("y", width * 0.04)
        .attr("x", 0 - (height * 0.475))
        .style("text-anchor", "middle")
        .text("Seasons")
    // creates the X-axis label
    svg.append("text")
        .attr("class", "xLabHeat")
        .attr("y", height * 0.125)
        .attr("x", width * 0.55 )
        .style("text-anchor", "middle")
        .text("Years");

    // adds a slider element to the SVG
    addSlider();
    // adds a legend to the heatmap
    makeHeatLegend();

    //creates the x-axis
    xAxisCallHeat = d3.axisTop().ticks(11)
                                .tickFormat(d3.format("d"))
                                .tickSize(0)
    svg.append("g")
        .attr("transform", "translate(" + 25 + "," + (pad.top - 5) + ")")
        .attr("class", "heatXAxis");
  updateHeat();
  function addSlider(){
      // https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518
      var dataTime = d3.range(0, 18).map(function(d) {
        return new Date(1996 + d, 10, 3);
      });

      var sliderTime = d3.sliderBottom()
                         .min(d3.min(dataTime))
                         .max(d3.max(dataTime))
                         .step(1000 * 60 * 60 * 24 * 365)
                         .width(parseInt(svg.style("width")) * 0.91)
                         .tickFormat(d3.timeFormat('%Y'))
                         .tickValues(dataTime)
                         .default(new Date(selTime, 10, 3))
                         .on('onchange', val => {
                            selTime = parseInt(d3.timeFormat("%Y")(val));
                            updateHeat();
                            // updateLine()
                          });
      var gTime = svg.append('svg')
                     .attr('width', 1000)
                     .attr('height', 100)
                     .attr("x", -20)
                     .attr("y", height - 100)
                     .append('g')
                     .attr('transform', 'translate(50,50)');
      gTime.call(sliderTime);
  }
  function makeHeatLegend (){
    // set scaler for alpha colour
    var colScale = d3.scaleLinear()
                     .domain([0, 10])
                     .range([50, 255]);
    // makes legend data for the chloropleth map
    var legData = [[0, "<5 watched"],
                   [5, "~5 watched"],
                   [10, "+10 watched"]];
    // creates legend element
    var legend = svg.selectAll(".legend")
                    .data(legData)
                    .enter()
                    .append("g")
                    .attr("class", "legend")
                    .attr("transform", function(d,i) {
                                       var legX = width * 0.8
                                       var legY = height * 0.8
                                       return "translate(" + legX + ","
                                                           + legY + ")"
                                       })
                    .style("font-size","10px");
    // creates the background for the legend
    legend.append('rect')
          .attr('width', 150)
          .attr('height', legData.length * 20)
          .attr("x", 0)
          .attr("y", -20)
          .style('fill', "white")
          .attr("opacity", 0.1)
          .style('stroke', "black");
    // creates the square-colour symbol in the legend
    legend.append("rect")
          .attr('width', 50)
          .attr('height', 20)
          .attr('x', 10)
          .attr('y', function(d,i){
                     var y = i * 15 - 15;
                     return y;
                     })
          .attr("fill", function(d) {
                        var colValue = colScale(d[0]);
                        var colour = `rgb(0,0,${colValue})`;
                        return colour;
                        });
      // creates the description beloning to each square symbol in the legend
      legend.append('text')
            .attr('x', 70)
            .attr('y', function(d,i){
                       var y = i * 15;
                       return y;
                       })
            .text(function(d){
                  return d[1];
                  });
}
}
// updates the heatboxes
const updateHeat = function(){
    // defines variables and dimensions
    var svg = d3.select(".heatChart")
    var width = parseInt(svg.style("width"));
    var height = parseInt(svg.style("height"));
    var pad = {
              top: height * 0.2,
              bottom: height * 0.4,
              left: width* 0.15,
              right: width * 0.1
              };
    var wChart = width - pad.left - pad.right;
    var lowestYear = 1986
    var lowerBound = selTime - 5;
    var upperBound = selTime + 5;
    var yList = ["Winter", "Spring", "Summer", "Fall"];

    // defines the axis scales
    var xScaleHeat = d3.scaleLinear()
                   .domain([lowerBound, upperBound])
                   .range([pad.left, width - pad.right]);
    var yScaleHeat = d3.scaleLinear()
                   .domain([0, yList.length])
                   .range([pad.top, height-pad.bottom]);
    // defines the colour scaler
    var colScale = d3.scaleLinear()
                     .domain([0, 10])
                     .range([50, 255]);

    // creates the yearRange dependant on the slidervalue
    var yearRange = Array.from(new Array(11), (x,i) => i + lowerBound);
    // calculates the width and height of a square
    var gridWidth = Math.floor(wChart / yearRange.length);

    // places all the Y labels using yScaleHeat
    placeYLabels();
    // creates/updates the title
    svg.selectAll(".tLabHeat")
        .text(function(){

            return `The Distribution of ${barSelGenre} Series between Seasons within ${lowerBound} and ${upperBound}`
        })

    // extracts the selected genre data from the HeatmapData
    var nest = d3.nest()
                  .key(function(d){return d.genre;})
                  .entries(dataGlob[2]);
    var genres = nest.map(function(d){return d.key;});
    var selectedGenre = nest.find(function(d){return d.key == barSelGenre;});
    var data = selectedGenre.values;
    // isolates the data within the yearrange
    var data = data.slice(((lowerBound - lowestYear) * 4),((upperBound - lowestYear + 1)*4));
    // orders the data on year first, season second
    data.sort(function(a, b) {
              return a["year"] - b["year"] || a["season"] - b["season"]
              });

    // creates and updates the squares within the heatmap
    var heatmap = svg.selectAll(".heatYear")
                      .data(data)
                      .enter()
                      .append("rect")
                        .attr("x", function(d) {
                                      var xValue = xScaleHeat(d.year)
                                      return xValue;
                                   })
                        .attr("y", function(d) {
                                      var yValue = yScaleHeat(d.season) * 1.2
                                      return yValue;
                                   })
                        .attr("width", gridWidth)
                        .attr("height", gridWidth)
                        .attr("class", "heatYear")
                        .style("stroke", "white")
                        .on("mouseover", function(d) {
                                           d3.select(this)
                                             .style("opacity", 0.5);
                                         })
                        .on("mouseout", function(d) {
                                          d3.select(this)
                                            .style("opacity", 1.0);
                                        })
                        .on("click", function(d){
                                       updateAgenda(d.amount, d.season, d.year)
                                     });
      // creates the transition of colour within the heatmap
      var heatmap = svg.selectAll(".heatYear")
                       .data(data)
                       .transition()
                       .duration(500)
                       .style("fill", function(d) {
                                        if (d.amount.length == 0){
                                            colour = "darkgrey"
                                        }
                                        else{
                                          var colValue = colScale(d.amount.length)
                                          var colour = `rgb(0,0,${colValue})`
                                        }
                                        return colour;
                                      });
    // updates the xAxis
    xAxisCallHeat.scale(xScaleHeat)
    svg.select(".heatXAxis")
       .transition()
       .call(xAxisCallHeat)
    function placeYLabels(){
           svg.selectAll(".heatYLabel")
              .exit()
              .remove()
           var yLabels = svg.selectAll(".heatYLabel")
                            .data(yList)
                            .enter()
                            .append("text")
                            .attr("class", "heatYLabel")
                            .text(function(d) {
                              return d; })
                            .attr("x", pad.left * 0.9)
                            .attr("y", function(d,i){
                                       var yCoor = yScaleHeat(i * 1.2 + 1.1)
                                       return yCoor
                                       })
                            .style("font-size", "15px")
                            .style("text-anchor", "end");
       };
}
// updates the agenda
const updateAgenda = function(entries, season, year){
    var seasonDict = {
                      0: "Winter",
                      1: "Spring",
                      2: "Summer",
                      3: "Fall"
                    }
    // updates the agenda header text
    d3.select(".agendaHeader")
      .text(function(d){
               var title = `The entries from the list from ${year}'s ${seasonDict[season]} season'`
               return title
           })

    var svg = d3.select(".agenda")
    // removes all agendaentries
    svg.selectAll(".agendaEntry")
					.remove()
					.exit();
    //adjusts the height to an appropriate length
    svg.attr("height", function(d){
                         var agendaHeight = 10 * entries.length
                         return agendaHeight;;
                       });
    // check if there is any entries to show in the agenda, else creates a list of the found entries
    if (entries.length == 0){
        svg.append("g")
            .text("------------------No entries in List-----------------")
            .attr("class", "agendaEntry")
    }
    else{
        for (entry of entries){
            svg.append("li")
                .text(entry)
                .attr("class", "agendaEntry");
            };
        }

}
