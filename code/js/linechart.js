/*
Created by: Julian Evalle

This program preprocesses data and creates updateable and interactable linecharts with
a selection of what to represent

data obtained from crawling a MyAnimeList(MAL) account

Credit to find value of all checkboxes
//https://www.includehelp.com/code-snippets/javascript-print-value-of-all-checked-selected-checkboxes.aspx

Credit to multi line chart code:
https://codepen.io/zakariachowdhury/pen/JEmjwq
*/


// preprocesses linechart data
const preLineData = function(data){
    var genreDict = {};

    // goes through each data entry
    for (variable of data){
        var title = variable[0];
        var year = variable[2];
        if ((year < 1986) || (year == "unknown") || ("NaN" == String(parseInt(year)))){
           continue
        }
        // goes through each genre in the entry
        for (genre of variable[8]){
            // check if the data is relevant
            if ((genre.length > 13) || genre[0] == genre[0].toLowerCase()
                 || ((genre.includes("-")) && genre != "Sci-Fi")){
                continue
            };
            // check if genre has been seen before
            if (!(genreDict[genre])){
               genreDict[genre] = {};
            };
            var inDict = genreDict[genre];
            // check if year within the genre has been seen before
            if (!(inDict[year])){
               inDict[year] = [];
            };
            inDict[year].push(title);
        };
     };
    // makes an array with possible years in the data
    var yearRange = Array.from(new Array(34), (x,i) => i + 1986);
    // insert empty arrays for the missing years
    for (year of yearRange){
        for (genre of Object.keys(genreDict)){
            // check if the year is missing and insert an empty array
            if(!genreDict[genre][year]){
                genreDict[genre][year] = [];
            };
        };
    };

    var lineData = [];
    var specLineData = {};
    var parseDate = d3.timeParse("%Y");
    // reorganize the data into lineData and specLineData
    for (let key of Object.keys(genreDict)){
        var lineDataDict = {};
        lineDataDict["genre"] = `${key}`;
        lineDataDict["years"] = [];
        var inGenre = genreDict[key];
        // create the object that stores the year data of the genre
        for (year of Object.keys(inGenre)){
            var yearDict = {};
            yearDict["year"] = parseInt(year);
            yearDict["yearData"] = inGenre[year];
            lineDataDict["years"].push(yearDict);
        };
        lineData.push(lineDataDict);
        specLineData[key] = lineDataDict;
    };
    return [lineData, specLineData];
}
// creates the SVG used for the linegraph
const makeLineGraph = function(data){
    // creates SVG and defines dimensions
    var svg = d3.select("body")
                .append("svg")
                  .attr("class", "linechart");
    var width = parseInt(svg.style("width"));
    var height = parseInt(svg.style("height"));
    var pad = {
                top: height * 0.2,
                bottom: height * 0.1,
                left: width* 0.15,
                right: width * 0.05
              };

    // creates scales and axis
    yScaleLine = d3.scaleLinear();
    xScaleLine = d3.scaleLinear();
    yAxisCallLine = d3.axisLeft()
    xAxisCallLine = d3.axisBottom()
                      .ticks(20).tickFormat(d3.format("d"));
    // creates x-axis
    svg.append("g")
        .attr("transform", "translate("+ 0 + ","+ height * 0.9 + ")")
        .attr("class", "lineXAxis");
    // creates the Y-axis
    svg.append("g")
        .attr("transform", "translate("+ (pad.left) + "," + 0 + ")")
        .attr("class", "lineYAxis");
    // creates the option boxes for the line chart
    d3.select("body")
       .append("div")
        .attr("class", "lineOptions1")
    d3.select("body")
       .append("div")
        .attr("class", "lineOptions2");

    // creates the Title
    svg.append("text")
        .attr("class", "tLabLine")
        .attr("y", height * 0.1)
        .attr("x", width * 0.55)
        .style("text-anchor", "middle")
        .text("The Quantity of Genre-Entries over the Years");
    // creates the Y-axis label
    svg.append("text")
        .attr("class", "yLabLine")
        .attr("transform", "rotate(-90)")
        .attr("y", width * 0.07)
        .attr("x", 0 - (height * 0.55))
        .style("text-anchor", "middle")
        .text("Amount present in list");
    // creates the X-axis label
    svg.append("text")
       .attr("class", "xLabLine")
       .attr("y", height * 0.98)
       .attr("x", width * 0.55 )
       .style("text-anchor", "middle")
       .text("Years");

    var lines = svg.append('g')
                   .attr("class", "lines");
    updateLine();
};
// updates the line and axislabels
const updateLine = function(via){
    findLineMax;
    // check if the checkboxes need to be updated
    if (via != "viaCheckBox"){
       updateLOptions();
    }
    // selects linechartSVG and defines dimensions
    var svg = d3.select(".linechart");
    var width = parseInt(svg.style("width"));
    var height = parseInt(svg.style("height"));
    var pad = {
                top: height * 0.2,
                bottom: height * 0.1,
                left: width* 0.15,
                right: width * 0.05
              };

    // finds all checkboxes
    var genres=document.getElementsByName('lineChecks');
    // finds all checked checkboxes
    var selectedGenres=[];
		for (var i=0; i<genres.length; i++){
        // check if element is checkbox and if checked
        if(genres[i].type=='checkbox' && genres[i].checked==true)
          selectedGenres.push(genres[i].value);
		};
    // extracts all genre data selected in the checkboxes
    var data = []
    for (genre of selectedGenres){
        data.push(dataGlob[1][1][genre])
    }

    // alter lineopacity depending on the number of selected genres
    if (data.length < 6){
        var lineOpacityOn = 0.9
        var lineOpacityOff = 0.8
    }
    else{
        var lineOpacityOn = 0.85
        var lineOpacityOff = 0.25
    }
    // get the value of the selected genre with the highest maximum value
    var max = findLineMax();
    // defines the scalers for the axis
    yScaleLine.domain([0, max])
              .range([height - pad.bottom, pad.top])
    xScaleLine.domain([1986, 2019])
              .range([pad.left, width - pad.right])
    yAxisCallLine.ticks(yTickSize())
                 .scale(yScaleLine);
    xAxisCallLine.scale(xScaleLine);

    // update axislabels
    svg.select(".lineXAxis")
        .transition()
        .call(xAxisCallLine);
    svg.select(".lineYAxis")
        .transition()
        .call(yAxisCallLine);

   // define the data for each line
   var line = d3.line()
                .x(function(d){
                    return xScaleLine(d.year)
                })
                .y(function(d){
                    return yScaleLine(d.yearData.length)
                })
   // remove alle lines
   svg.select(".lines").remove()
   var lines = svg.append('g')
                  .attr("class", "lines");
   // create new lines and attribute interactivity
   lines.selectAll(".line-group")
        .data(data).enter()
        .append("g")
        .attr('class', 'line-group')
        .on("mouseover", function(d, i) {
              // create text box which shows what genre the lien represents
              svg.append("text")
                .attr("class", "title-text")
                .style("fill", colourLabels[d.genre])
                .attr("text-anchor", "middle")
                .attr("x", width * 0.9)
                .attr("y", height * 0.1)
                .text(d.genre)
            })
        .on("mouseout", function(d) {
            // removes created text box
            svg.select(".title-text").remove();
          })
        .append('path')
          .attr('class', 'line')
          .on("mouseover", function(d) {
                // lowers opacity of all lines which are not under the mouse
                d3.selectAll('.line')
          					.style('opacity', "0.1");
                d3.select(this)
                  .style('opacity', lineOpacityOn)
                  .style("stroke-width", "2.5px")
                  .style("cursor", "pointer");
                var svgLeft = parseInt(svg.style("left"));
              })
          .on("mouseout", function(d) {
              // returns the opacity of all lines to normal
              d3.selectAll(".line")
        					.style('opacity', lineOpacityOff);
              d3.select(this)
                .style("stroke-width", "1.5px")
                .style("cursor", "none");
              })
          .on("click", function(d){
                           // updates the heatchart to clicked genre
                           var dataVar = parseInt(d3.select('input[name="barData"]:checked').node().value);
                           if (dataVar == 0){
                               barSelGenre = d.genre
                               updateHeat()
                           }
                       })
          .attr('d', function(d){
                      return line(d.years)
                    })
          .style('stroke', function(d){
                           var colour = colourLabels[d.genre];
                           return colour;
                 })
          .style('opacity', lineOpacityOff)

   // finds the max values of all checked genres together
   function findLineMax(){
       var max = 0;
       // goes through all data values and finds the max
       for (key of Object.keys(data)){
          var yearData = data[key].years;
          var genreMax = d3.max(yearData, function(d){
                                          return d.yearData.length;
                                          });
          // checks if found max is higher than the previously highest found max
          if (genreMax > max){
              max = genreMax;
          }
        }
        return max;
   };
   // creates a custom ticksize depending on how large or small the data is
   function yTickSize(){
                   var ticks = max%10
                   // check if there's not enough ticks
                   if ((max>10) && (ticks<5)){
                       ticks = 5
                   }
                   // prevents non integers to appear as axis-label
                   else if((ticks == max) || (ticks == 0)){
                       ticks = max
                   }
                   return ticks
   }
}
// updates the Line chart checkboxes
const updateLOptions = function(){

    data = dataGlob[1][1]
    // sorts the genres alphabetically
    var foundGenres = Object.keys(data)
    foundGenres.sort(function(a, b) {
                     return d3.ascending(a[0], b[0])
                     });
    // split the list in two
    var genres2 = foundGenres.splice(foundGenres.length/2)
    // the data to go through, [0] is null, due to div.option1 and
    // div.option2 being more comprehensible and less confusing element names
    var foundGenreList = [null, foundGenres, genres2]
    // go through the foundGenrelist with data and update the checkboxes
    for (i = 1; i < 3; i++){
        foundGenres = foundGenreList[i]
        //select specific element with linechart checkboxes
        lOptions = d3.select(`.lineOptions${i}`)
        // alter height of the box
        lOptions.attr("height", function(d){
                           var height = 10 * foundGenres.length
                           return height;;
                           });
        // remove all elements within the element
        lOptions.selectAll("*").remove()

        // creates the divs to pair the checkboxes and labels
        var labels = lOptions.selectAll("input")
                              .data(foundGenres)
                              .enter()
                              .append("div")
        // creates the checkbox within the its resective div
        labels.append("input")
               .attr("type", "checkbox")
               .attr("name", "lineChecks")
               .attr("class", "cBox")
               .attr("value", function(d){return d})
               .property("checked", true)
               .on("change", function(d){updateLine("viaCheckBox");});
        // creates the label of the checkbox within its respective div
        labels.append("label")
               .attr("name", "lineLabels")
               .attr("class", "cBoxLabel")
               .text(function(d,i){
                     return d});
     }
  // creates the buttons for check/uncheck all
  // has to be redone at every call of this function due to checkbox bugs
   d3.select(`.lineOptions1`)
      .append("label")
      .append("input")
       .attr("type", "submit")
       .attr("class", "checkAll")
       .attr("value", "check all")
       .on("click", function(d){
                    d3.selectAll("input[type=checkbox]")
                       .property("checked", true);
                    updateLine("viaCheckBox")
                    })
   d3.select(`.lineOptions2`)
     .append("label")
     .append("input")
      .attr("type", "submit")
      .attr("class", "unCheckAll")
      .attr("value", "uncheck all")
      .on("click", function(d){
                   d3.selectAll("input[type=checkbox]")
                      .property("checked", false);
                   updateLine("viaCheckBox")
       })
}
