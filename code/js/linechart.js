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
  // reorganize the data
  // go through all the genres in the dict
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
    // defines variables
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
    yAxisCall = d3.axisLeft().ticks(10);
    xAxisCall = d3.axisBottom().ticks(20).tickFormat(d3.format("d"));
    svg.append("g")
       .attr("transform", "translate("+ 0 + ","+ height * 0.9 + ")")
       .attr("class", "lineXAxis");
    // creates the Y-axis
    svg.append("g")
       .attr("transform", "translate("+ (pad.left) + "," + 0 + ")")
       .attr("class", "lineYAxis");
    // creates the options box for the line chart
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
        .text("The Quantity of Genre-Entries over the Years")

     // creates the Y-axis label
     svg.append("text")
        .attr("class", "yLabLine")
        .attr("transform", "rotate(-90)")
        .attr("y", width * 0.07)
        .attr("x", 0 - (height * 0.55))
        .style("text-anchor", "middle")
        .text("Amount present in list")

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
    if (via != "viaCheckBox"){
       updateLOptions();
    }

    //https://www.includehelp.com/code-snippets/javascript-print-value-of-all-checked-selected-checkboxes.aspx
    var svg = d3.select(".linechart");
    var width = parseInt(svg.style("width"));
    var height = parseInt(svg.style("height"));
    var pad = {
                top: height * 0.2,
                bottom: height * 0.1,
                left: width* 0.15,
                right: width * 0.05
              };

    var genres=document.getElementsByName('lineChecks');
		var selectedGenres=[];
		for(var i=0; i<genres.length; i++){
  			if(genres[i].type=='checkbox' && genres[i].checked==true)
          selectedGenres.push(genres[i].value);
		};
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

    const findLineMax = function(){
        var max = 0;
        for (key of Object.keys(data)){
          var yearData = data[key].years;
          var genreMax = d3.max(yearData, function(d){
                                     return d.yearData.length;
                                     });
          if (genreMax > max){
              max = genreMax;
          }
        }
        return max;
    };
    var max = findLineMax();

   yScaleLine.domain([0, max])
             .range([height - pad.bottom, pad.top])

   xScaleLine.domain([1986, 2019])
             .range([pad.left, width - pad.right])
                  // .domain([lowerBound, upperBound])
   // var color = d3.scaleOrdinal(d3.schemeCategory10);

   yAxisCall.scale(yScaleLine);
   xAxisCall.scale(xScaleLine);
   svg.select(".lineXAxis")
      .transition()
      .call(xAxisCall);
   svg.select(".lineYAxis")
      .transition()
      .call(yAxisCall);

   var line = d3.line()
                .x(function(d){
                    return xScaleLine(d.year)
                })
                .y(function(d){
                    return yScaleLine(d.yearData.length)
                })

   svg.select(".lines").remove()
   var lines = svg.append('g')
                  .attr("class", "lines");

   lines.selectAll(".line-group")
        .data(data).enter()
        .append("g")
        .attr('class', 'line-group')
        .on("mouseover", function(d, i) {
              svg.append("text")
                .attr("class", "title-text")
                .style("fill", colourLabels[d.genre])
                .attr("text-anchor", "middle")
                .attr("x", width * 0.9)//
                .attr("y", height * 0.1)
                .text(d.genre)
            })
        .on("mouseout", function(d) {
            svg.select(".title-text").remove();
          })
        .append('path')
          // .transition()
          .attr('class', 'line')
          .on("mouseover", function(d) {
                d3.selectAll('.line')
          					.style('opacity', "0.1");
                d3.select(this)
                  .style('opacity', lineOpacityOn)
                  .style("stroke-width", "2.5px")
                  .style("cursor", "pointer");
                var svgLeft = parseInt(svg.style("left"));
              })
          .on("mouseout", function(d) {
              d3.selectAll(".line")
        					.style('opacity', lineOpacityOff);
              d3.select(this)
                .style("stroke-width", "1.5px")
                .style("cursor", "none");
              })
          .on("click", function(d){
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

   lines.exit().remove();
}
// updates the Line chart checkboxes
const updateLOptions = function(){
   data = dataGlob[1][1]
   // finds all genres and sorts them alphabetically
   var foundGenres = Object.keys(data)
   foundGenres.sort(function(a, b) {
             return d3.ascending(a[0], b[0])
           });

   var genres2 = foundGenres.splice(foundGenres.length/2)
   // have ordered data to go through, [0] is null, due to div.option1 and
   // div.option2 being more comprehensible and less confusing element names
   var foundGenreList = [null, foundGenres, genres2]

   for (i = 1; i < 3; i++){
       foundGenres = foundGenreList[i]
       lOptions = d3.select(`.lineOptions${i}`)

       lOptions.attr("height", function(d){
                         var height = 10 * foundGenres.length
                         return height;;
                         });

       lOptions.selectAll("*").remove()

       var width = parseInt(lOptions.style("width"));
       var height = parseInt(lOptions.style("height"));

       // creates the labels for the checkboxes
       var labels = lOptions.selectAll("input")
                            .data(foundGenres)
                            .enter()
                            .append("div")

       labels.append("input")
             .attr("type", "checkbox")
             .attr("name", "lineChecks")
             .attr("class", "cBox")
             .attr("value", function(d,i){
                            return d
             })
             .property("checked", true)
             .on("change", function(d){
                           updateLine("viaCheckBox");
                         });
       // sets up the genre-labels for the checkboxes
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
                d3.selectAll("input[type=checkbox]").property("checked", true);
                updateLine("viaCheckBox")
             })

   d3.select(`.lineOptions2`)
     .append("label")
           .append("input")
           .attr("type", "submit")
           .attr("class", "unCheckAll")
             .attr("value", "uncheck all")
             .on("click", function(d){
                d3.selectAll("input[type=checkbox]").property("checked", false);
                updateLine("viaCheckBox")
             })

}
