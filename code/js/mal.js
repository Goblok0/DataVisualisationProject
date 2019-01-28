
/*
To do(-), done(+)  {
  + fix transition of barcharts
  + update line graph
  - fix genre selection
  - make agenda visually pleasing
  + interactivity line chart
  - slider influence linechart
  + make genre/studio colours constant
  + make the other lists selectable
  ~ make the scraper callable in JS
    - with potential load bar
  + fix heatmap bug
  - titles
  - axis titles
*/

// credit slider: https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518

// defines globally used variables
var dataGlob = [];
var barSelGenre = "Comedy";
var selTime = 2007;
var totEnt = 0;
var tooltip = d3.select("body")
                .append("div")
                .attr("class", "toolTip");
var colourLabels = {};
var username;
// calls upon the preprocessing and initial graphs
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
        console.log(dataGlob);
        makeBarGraph(barData);
        makeLineGraph(lineData);
        makeHeatGraph(heatData);
    }).catch(function(e){
             throw(e);
             });
   d3.selectAll('input[name="listOption"]')
     .on("change", function(d) {
         updateAll("Newlist")
     })

};
const updateAll = function(via){
      fileExists;

      if (via == "viaSubmit"){
         username = d3.select('input[name="username"]').node().value;
      }
      listType = parseInt(d3.select('input[name="listOption"]:checked').node().value);;
      var json = `../scraper/data/${username}_${listType}.json`
      if (!fileExists(json)) {
          return alert("Invalid Username or List Selection");
      }
      var request = [d3.json(json)]

      Promise.all(request).then(function(response) {
          console.log(response)
          // preprocesses the data

          var barSelGenre = "Comedy"
          preProcess(response);
          assignColours()
          updateBars()
          updateLine()
          updateHeat()
      }).catch(function(e){
               throw(e);
               });
     function fileExists(url){
         //credit: Imortenson, https://stackoverflow.com/questions/15054182/javascript-check-if-file-exists
         var http = new XMLHttpRequest();
         http.open('HEAD', url, false);
         http.send();
         return http.status!=404;
     }

}
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
    assignColours()
};

const preBarData = function(data){
    var genreDict = {};
    var studioDict = {};
    // goes through each entry in the dataset
    for (variable of data){
        // goes through all the genres of the entry
        for (genre of variable[8]){
            if (genre.length > 13){
              continue
            }
            // check if the genre has been seen before
            if (!(genreDict[genre])){
               genreDict[genre] = 0;
            }
            // increments the value of the found genre
            genreDict[genre]++;
        };
        // goes through all the studios of the entry
        for (studio of variable[9]){
          if ((studio.includes("None found")) || (studio.includes("add some"))){
              continue
          }
            // check if the studio has comma that was missed in the scraping
            if (studio.includes(",")){
                studio = studio.split(",");
                // goes through each studio of the entry
                for(inStudio of studio){
                  inStudio = inStudio.trim();
                  // check if the studio has been seen before
                  if (!(studioDict[inStudio])){
                     studioDict[inStudio] = 0;
                  };
                  // increments the value of the found studio
                  studioDict[inStudio]++;
                };
            }
            else{
              // check if studio has been seen before
              if (!(studioDict[studio])){
                 studioDict[studio] = 0;
              };
              // increments the values of the found studio
              studioDict[studio]++;
            };
        };
    };

    // defines data lists for the several radio options
    var smallGenreList = [];
    var bigGenreList = [];
    var smallStudioList = [];
    var bigStudioList = [];

    // finds the median of each dict
    var genreMedian = d3.median(Object.values(genreDict));
    var studioMedian = d3.median(Object.values(studioDict));
    // makes the studio data be split more evenly
    if (studioMedian < 3){
        studioMedian = studioMedian + 1;
    };

    // goes through entry in the dict
    for (let key of Object.keys(genreDict)){
        // check if the data is relevant
        if (key == "unknown"){
          continue;
        };
        // check in which sublist the data corresponds to
        if (parseInt(genreDict[key]) < genreMedian){
            smallGenreList.push([key,genreDict[key]]);
        }
        else {
            bigGenreList.push([key,genreDict[key]]);
        };
    };
    for (let key of Object.keys(studioDict)){
        // check if the data is relevant
        if (key == "unknown"){
          continue;
        };
        // check in which sublist the data corresponds to
        if (parseInt(studioDict[key]) < studioMedian){
            smallStudioList.push([key,studioDict[key]]);
        }
        else {
            bigStudioList.push([key,studioDict[key]]);
        };
    };
    return [[bigGenreList, smallGenreList], [bigStudioList, smallStudioList]];
};

const preLineData = function(data){
    // var yearDict = {};
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
            if ((genre == "unknown") || (genre.length > 13)){
                continue;
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

const preHeatData = function(data){

    var genreDict = {};
    var genreDictDays = {}
    // go through all the data
    for (variable of data){
        var title = variable[0];
        var year = variable[2];
        var season = variable[3];
        if (year < 1986){
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
            // check of the year has been seen before
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
    // creates an array with all the possible years that can be found
    var yearRange = Array.from(new Array(33), (x,i) => i + 1986);
    // fill up the empty years and empty seasons
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
    // reorder the data
    var genreList = [];
    for (genre of Object.keys(genreDict)){
        var inGenre = genreDict[genre];
        for (year of Object.keys(inGenre)){
            var inYear = inGenre[year];
            // check in which season corresponds and replace it with a Number
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
// sets up the SVG for the bar graph
const makeBarGraph = function(data){
  // creates the SVG element in the html-body
  var svg = d3.select("body")
              .append("svg")
              .attr("class", "barchart");

  // defines the size of the SVG
  var width = parseInt(svg.style("width"));
  var height = parseInt(svg.style("height"));

  // defines the padding for the graph
  var pad = {
              top: height * 0.1,
              bottom: height * 0.1,
              left: width * 0.2,
              right: width * 0.1
            };

  // creates the background of the SVG-element
  // svg.append("rect")
  //    .attr("width", "100%")
  //    .attr("height", "100%")
  //    .attr("fill", "grey")
  //    .attr("opacity", 0.1);

   // creates the scale and axis for the bar chart
   yScaleBar = d3.scaleBand();
   xScaleBar = d3.scaleLinear();
   yAxisCallBar = d3.axisLeft();
   xAxisCallBar = d3.axisBottom();

  // add the x Axis
  svg.append("g")
      .attr("transform", "translate(" + 0 + "," + height * 0.905 + ")")
      .attr("class", "barXAxis");

  // add the y Axis
  svg.append("g")
      .attr("transform", "translate(" + pad.left * 0.85 + "," + 0 + ")")
      .attr("class", "barYAxis");

  // adds the options box of the bar graph
  const addOptions = function(){

      var bOptions = d3.select("body")
                  .append("div")
                  .attr("width", width)
                  .attr("height", height)
                  .attr("class", "barOptions");
      d3.select(".barOptions").append("text")
                              .text("Select Dataset:")
      d3.select(".barOptions").append("br")
      bOptions.selectAll("inputBD")
                       .data(["Genres","Studio"])
                       .enter()
                       .append("label")
                       .text(function(d){return d})
                       .append("input")
                       .attr("type", "radio")
                       .attr("name", "barData")
                       .attr("value", function(d, i){
                                      return i
                       })
                       .property("checked", function(d) {return d==="Genres";})
                       .on("click", function(d){
                                    updateBars()
                                    });
       d3.select(".barOptions").append("br")
       d3.select(".barOptions").append("br")
       d3.select(".barOptions").append("text")
                               .text("Select more/less frequent genres/studios:")
       d3.select(".barOptions").append("br")


       bOptions.selectAll("inputBT")
                        .data(["Big Data", "Small Data"])
                        .enter()
                        .append("label")
                        .text(function(d){return d})
                        .append("input")
                        .attr("type", "radio")
                        .attr("name", "barType")
                        .attr("value", function(d,i){return i})
                        .property("checked", function(d) {return d==="Big Data";})
                        .on("click", function(d){
                                     updateBars()
                                     });
       d3.select(".barOptions").append("br")
       d3.select(".barOptions").append("br")
       d3.select(".barOptions").append("text")
                               .text("Show data as Number or Percentages of list:")
       d3.select(".barOptions").append("br")
       bOptions.selectAll("inputBT")
                        .data(["Numbers", "Percentile"])
                        .enter()
                        .append("label")
                        .text(function(d){return d})
                        .append("input")
                        .attr("type", "radio")
                        .attr("name", "barQuant")
                        .attr("value", function(d,i){return i})
                        .property("checked", function(d) {return d==="Numbers";})
                        .on("click", function(d){
                                     updateBars()
                                     });
  }
  addOptions();
  updateBars();
}

// creates and updates the bar graph
const updateBars = function(){
    var svg = d3.select(".barchart");
    var width = parseInt(svg.style("width"));
    var height = parseInt(svg.style("height"));
    var svgLeft = parseInt(svg.style("left"));
    var svgTop = parseInt(svg.style("top"));
    var pad = {
                top: height * 0.1,
                bottom: height * 0.1,
                left: width * 0.175,
                right: width * 0.15
              };
    // obtains the selection options from the bar radio buttons
    var dataVar = parseInt(d3.select('input[name="barData"]:checked').node().value);
    var typeVar = parseInt(d3.select('input[name="barType"]:checked').node().value);
    var quantVar = parseInt(d3.select('input[name="barQuant"]:checked').node().value);
    // quantifies the data to percentages if the selected in the radio buttons
    const quant = function(d){
          if (quantVar == 0){
              return d;
          }
          else{
            return d / totEnt * 100;
          };
    };
    // obtains the selected data
    var data = dataGlob[0][dataVar][typeVar];
    // sorts the data from large to small
    data.sort(function(a, b) {
              return d3.ascending(a[1], b[1])
              });

    // isolates the lowest data value from the data
    var min = d3.min(data, function(d){
                               return quant(d[1]);
                               });
    // isolates the highest data value from the data
    var max = d3.max(data, function(d){
                               return quant(d[1]);
                               });
    // gets the largest datapoint from the bigList of genres or studios
    var bigdataMax = d3.max(dataGlob[0][dataVar][0], function(d){
                                                  return quant(d[1])
    })
    // defines the domain and ranges of the barscales
    yScaleBar.domain(data.map(function(d){
                              return d[0];
                             }))
             .range([height - pad.bottom, pad.top]);
    xScaleBar.domain([min - 1, max])
          .range([pad.left, width - pad.right]);
    // check if the values need to be quantified and gives a domain, more
    // suitable for percentile data
    if (quantVar == 1){
       xScaleBar.domain([min - 0.2, max]);
    };
    // makes the colourscale for bar colours
    var colScale = d3.scaleLinear()
                     .domain([0, bigdataMax])
                     .range([d3.rgb("#6e63b1"), d3.rgb('#3058ff')]);
    // calls the axisses of the barchart
    yAxisCallBar.scale(yScaleBar);
    xAxisCallBar.scale(xScaleBar);
    svg.select(".barXAxis")
       .transition()
       .call(xAxisCallBar);


     svg.select(".barYAxis")
        .style("font-size",  function(d){
          var size = 400 / data.length
          if (size > 16){
             size = 16
          }
          return size
          })
        .transition()
        .call(yAxisCallBar);


    // selects and creates the bars
    var rects = svg.selectAll("rect")
                   .data(data);
    rects.enter()
             .append("rect")
             .merge(rects)
             .on("mouseover", function(d) {
                              d3.select(this)
                                .style("opacity", 0.5);
                              // makes the string that represents the value
                              var amount = Math.round(quant(d[1]) * 100)/100
                              if (quantVar == 0){
                               var strValue = `${amount} in list`
                              }
                              else{
                               var strValue = `${amount}% of list`
                             };
                             strValue = d[0] + ":\n" + strValue
                             // creates the tooltip for the bar
                              tooltip.style("left", width - pad.right * 0.9 + svgLeft)
                                     .style("top", yScaleBar(d[0]) + svgTop + 5)
                                     .style("display", "inline-block")
                                     .html(strValue)
                            })
             .on("mouseout", function(d){
                             d3.select(this)
                               .style("opacity", 1.0);
                             tooltip.style("display", "none");
                             })
             .on("click", function(d){
                              if (dataVar == 0){
                                  barSelGenre = d[0]
                                  updateHeat()
                              }
                          })

             .attr("y", function(d) {return yScaleBar(d[0]);})
             .attr("x", pad.left)
             .transition().duration(1000)
             .attr("height", yScaleBar.bandwidth() * 0.9)
             .attr("width", function(d) {return xScaleBar(quant(d[1])) - pad.left;})
             .style("fill", function(d){
                            var colour = colScale(d[1])
                            return colour
                            })

    // https://bl.ocks.org/d3noob/1ea51d03775b9650e8dfd03474e202fe

    rects.exit().remove();
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

  var lines = svg.append('g')
                 .attr("class", "lines");
  updateLine();
};


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
    // console.log(selectedGenres)
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

    // n = 2
    // slideValue = 2003
    // lowerBound = slideValue - 5
    // upperBound = slideValue + 5
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
                .text(d.genre)
                .attr("text-anchor", "middle")
                .attr("x", width * 0.5)
                .attr("y", height * 0.1)
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
                // console.log(d.years)
                // tooltip.style("left", Math.round(xScaleLine(d.years.year) + svgLeft))
                //        .style("top", d3.event.pageY - 70 + "px")
                //        .style("display", "inline-block")
                //        .html(d.yearData);
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
                               console.log("meh");
                               barSelGenre = d.genre
                               updateHeat()
                           }
                       })
          .attr('d', function(d){
                      // console.log(d);
                      return line(d.years)
                    })
          .style('stroke', function(d){
                           var colour = colourLabels[d.genre];
                           return colour;
                 })
          .style('opacity', lineOpacityOff)

   lines.exit().remove();
}
const updateLOptions = function(){

   data = dataGlob[1][1]
   // finds all genres and sorts them alphabetically
   var foundGenres = Object.keys(data)
   foundGenres.sort(function(a, b) {
             return d3.ascending(a[0], b[0])
           });

   var genres2 = foundGenres.splice(foundGenres.length/2)
   var foundGenreList = [null, foundGenres, genres2]
   // var dataLength1 = Array.from(new Array(), (x,i) => i)
   // var dataLength2 = Array.from(new Array(11), (x,i) => i)
   // var dataLength = [null, dataLength1, dataLength2]
   for (i = 1; i < 3; i++){
       foundGenres = foundGenreList[i]
       lOptions = d3.select(`.lineOptions${i}`)

       lOptions.attr("height", function(d){
                         var height = 10 * foundGenres.length
                         return height;;
                         });
       // d3.select(".lineOptions").selectAll("input").remove()
       // d3.select(".lineOptions").selectAll("label").remove()
       lOptions.selectAll("*").remove()
       // d3.select(".lineOptions").selectAll("lineAllYears").remove()

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
             .on("click", function(d){6666
                d3.selectAll("input[type=checkbox]").property("checked", false);
                updateLine("viaCheckBox")
             })

}
const makeHeatGraph = function(data){
  svg = d3.select("body")
          .append("svg")
          .attr("class", "heatchart");


  var width = parseInt(svg.style("width"));
  var height = parseInt(svg.style("height"));

  d3.select("body")
     .append("div")
     .attr("width", width)
     .attr("height", height)
     .attr("class", "agenda")

  d3.select("body")
    .append("div")
    .attr("class", "agendaHeader")
        .append("text")

  var pad = {
              top: height * 0.2,
              bottom: height * 0.4,
              left: width* 0.15,
              right: width * 0.1
            };

  const addSlider = function(){
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

  addSlider();

  const makeHeatLegend = function(){
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
  makeHeatLegend();
  xAxisCallHeat = d3.axisTop().ticks(11)
                              .tickFormat(d3.format("d"))
                              .tickSize(0)
  // add the x Axis
  svg.append("g")
      .attr("transform", "translate(" + 25 + "," + (pad.top - 5) + ")")
      .attr("class", "heatXAxis");
  updateHeat();
}
const updateHeat = function(){
    svg = d3.select(".heatChart")
    // data = dataGlob[2]

    var selVar = barSelGenre;
    var width = parseInt(svg.style("width"));
    var height = parseInt(svg.style("height"));
    var pad = {
              top: height * 0.2,
              bottom: height * 0.4,
              left: width* 0.15,
              right: width * 0.1
              };

    var lowerBound = selTime - 5;
    var upperBound = selTime + 5;

    var yList = ["Winter", "Spring", "Summer", "Fall"];

    var xScaleHeat = d3.scaleLinear()
                   .domain([lowerBound, upperBound])
                   .range([pad.left, width - pad.right]);
    var yScaleHeat = d3.scaleLinear()
                   .domain([0, yList.length])
                   .range([pad.top, height-pad.bottom]);

    var wChart = width - pad.left - pad.right;
    // var hChart = height - pad.bottom - pad.top;

    var yearRange = Array.from(new Array(11), (x,i) => i + lowerBound);

    var gridWidth = Math.floor(wChart / yearRange.length);

    const placeYLabels = function(){
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
    placeYLabels();

    // when studios
    // var dataVar = parseInt(d3.select('input[name="barData"]:checked').node().value);

    var nest = d3.nest()
                      .key(function(d) { return d.genre; })
                      .entries(dataGlob[2]);

    var genres = nest.map(function(d) { return d.key; });
    // var currentGenreIndex = "Comedy";
    var selectedGenre = nest.find(function(d) {
                                              return d.key == selVar;
                                            });

    var data = selectedGenre.values;
    var data = data.slice(((lowerBound - 1986) * 4),((upperBound - 1985)*4));
    // https://coderwall.com/p/ebqhca/javascript-sort-by-two-fields
    data.sort(function(a, b) {
              return a["year"] - b["year"] || a["season"] - b["season"]
              });
    var colScale = d3.scaleLinear()
                    .domain([0, 10])
                    .range([50, 255]);

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
      .style("fill", function(d) {
                                  if (d.amount.length == 0){
                                      var colour = "darkgrey";
                                      return colour
                                  }
                                  var colValue = colScale(d.amount.length)
                                  var colour = `rgb(0,0,${colValue})`

                                  return colour;
                                  })
      .on("click", function(d){
                   updateAgenda(d.amount, d.season, d.year)
                   });

      var heatmap = svg.selectAll(".heatYear")
                       .data(data)
                       .transition()
                       .duration(500)
                       .style("fill", function(d) {
                                      var colValue = colScale(d.amount.length)
                                      var colour = `rgb(0,0,${colValue})`
                                      if (d.amount.length == 0){
                                          colour = "darkgrey"
                                      }
                                      return colour;
                                    });
    xAxisCallHeat.scale(xScaleHeat)

    svg.select(".heatXAxis")
       .transition()
       .call(xAxisCallHeat)
}
const updateAgenda = function(entries, season, year){
      var seasonDict = {
                        0: "Winter",
                        1: "Spring",
                        2: "Summer",
                        3: "Fall"
                      }

      d3.select(".agendaHeader")
        .text(function(d){
               var title = `The entries from the list from ${year}'s ${seasonDict[season]} season'`
               return title

       })
       .attr("text-anchor", "center")

    var svg = d3.select(".agenda")


    svg.selectAll(".agendaEntry")
					.remove()
					.exit();

    svg.attr("height", function(d){
                         var agendaHeight = 10 * entries.length
                         return agendaHeight;;
                       });
    for (entry of entries){
        svg.append("li")
          .text(entry)
          .attr("class", "agendaEntry");
    };
}
const assignColours = function(){
    colourLabels = {}
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    var index = 0
    for (genre of Object.keys(dataGlob[1][1])){
        colourLabels[genre] = color(index);
        index++
    }

}
