
// credit slider: https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518


var dataGlob = [];
var svgGlob = []
window.onload = function() {
    // decodes the JSON file
    var username = "goblok"
    var listType = "2"
    var requests = [d3.json(`${username}_${listType}.json`)];
    // ensures that all data is loaded properly before calling any functions
    Promise.all(requests).then(function(response) {
        // preprocesses the data
        preProcess(response)
        // console.log(data)
        // barDataGenres = data[0][0]
        barData = dataGlob[0]
        lineData = dataGlob[1]
        heatData = dataGlob[2]
        // console.log(data[0][1])
        makeBarGraph(barData)
        makeLineGraph(lineData)
        makeHeatGraph(heatData)
        placeOptions()


    }).catch(function(e){
             throw(e);
             });
};
const preProcess = function(data){
    var data = data[0];
    var barData = preBarData(data);
    var lineData = preLineData(data);
    var heatData = preHeatData(data);
    dataGlob.push(barData, lineData, heatData);
};
const preBarData = function(data){
    // console.log(data.length)
    // console.log(data)
    genreDict = {}
    studioDict = {}
    // increments xLabel data
    for (variable of data){
        // console.log(variable[8])
        for (genre of variable[8]){
            if (!(genreDict[genre])){
               genreDict[genre] = 0
            }
            genreDict[genre]++
        }
        for (studio of variable[9]){
            if (studio.includes(",")){
                studio = studio.split(",")
                for(inStudio of studio){
                  inStudio = inStudio.trim()
                  if (!(studioDict[inStudio])){
                     studioDict[inStudio] = 0
                  }
                  studioDict[inStudio]++
                }
            }
            else{
              if (!(studioDict[studio])){
                 studioDict[studio] = 0
              }
              studioDict[studio]++
            }

        }
    };
    // console.log(genreDict)
    // console.log(studioDict)

    // studioMean = d3.mean(selectedData,function(d) { return +d.reading})
    // genreMean = d3.mean(selectedData,function(d) { return +d.reading})

    smallGenreList = []
    bigGenreList = []
    smallStudioList = []
    bigStudioList = []

    genreMedian = d3.median(Object.values(genreDict))
    studioMedian = d3.median(Object.values(studioDict))
    if (studioMedian < 4){
        studioMedian = studioMedian + 2
    }
    // console.log([genreMedian, studioMedian])

    for (let key of Object.keys(genreDict)){
        // entryDict = {}
        // entryDict["genre"] = key
        // entryDict["value"] = genreDict[key]
        if (key == "unknown"){
          continue
        }
        if (parseInt(genreDict[key]) < genreMedian){
            smallGenreList.push([key,genreDict[key]]);
        }
        else {
            bigGenreList.push([key,genreDict[key]]);
        }
        // genreList.push(entryDict)
    };
    for (let key of Object.keys(studioDict)){
        // entryDict = {}
        // entryDict["studio"] = key
        // entryDict[value] = genreDict[key]
        if (key == "unknown"){
          continue
        }
        if (parseInt(studioDict[key]) < studioMedian){
            smallStudioList.push([key,studioDict[key]]);
        }
        else {
            bigStudioList.push([key,studioDict[key]]);
        }
        // genreList.push(entryDict)
    };
    //
    // for (let key of Object)
    // // console.log(genreList)
    // // console.log(studioList)
    return [[bigGenreList, smallGenreList], [bigStudioList, smallStudioList]]
}

const preLineData = function(data){
    // console.log(data)
    yearDict = {}
    genreDict = {}

    for (variable of data){
        title = variable[0]
        year = variable[2]
        for (genre of variable[8]){
            // check if genre has already been seen before
            if (genre == "unknown"){
                continue
            }
            if (!(genreDict[genre])){
               genreDict[genre] = {}
            }
            inDict = genreDict[genre]
            if (!(inDict[year])){
               inDict[year] = []
            }
            inDict[year].push(title)
        }
    };
    // console.log(genreDict)
    yearRange = Array.from(new Array(33), (x,i) => i + 1986)
    // console.log(yearRange)
    // fill up the empty years
    for (year of yearRange){
        // console.log(year)
        for (genre of Object.keys(genreDict)){
            // console.log(genre)
            if(!genreDict[genre][year]){
                genreDict[genre][year] = []
            }
        }
    }
    // console.log(genreDict)
    // var lineData = {}
    // for (let key of Object.keys(genreDict)){
    //     genre = key
    //     lineData[genre] = []
    //     inGenre = genreDict[key]
    //     for (year of Object.keys(inGenre)){
    //         // console.log(year)
    //         yearData = inGenre[year]
    //         // console.log(yearData)
    //         year = parseInt(year)
    //         lineData[genre].push([year, yearData])
    //     }
    // };

    lineData = []
    var parseDate = d3.timeParse("%Y")
    for (let key of Object.keys(genreDict)){
        lineDataDict = {}
        lineDataDict["genre"] = `${key}`
        lineDataDict["years"] = []
        inGenre = genreDict[key]
        // console.log(inGenre)
        for (year of Object.keys(inGenre)){
            // console.log(year)
            yearDict = {}
            // yearDict["year"] = parseDate(year)
            yearDict["year"] = parseInt(year)
            yearDict["yearData"] = inGenre[year]
            lineDataDict["years"].push(yearDict)
        }
        // lineDataDict[]
        lineData.push(lineDataDict)
    };
    // console.log(lineData)

    return lineData

}

const preHeatData = function(data){
    // console.log(data)
    // console.log(data)
    genreDict = {}

    for (variable of data){
        // console.log(variable)
        title = variable[0]
        year = variable[2]
        season = variable[3]
        for (genre of variable[8]){
            // check if genre has already been seen before
            if ((genre == "unknown") || (season == "unknown")){
                continue
            }
            if (!(genreDict[genre])){
               genreDict[genre] = {}
            }
            inDict = genreDict[genre]
            if (!(inDict[year])){
               inDict[year] = {}
            }
            inYear = inDict[year]
            if (!(inYear[season])){
               inYear[season] = []
            }
            inYear[season].push(title)
        }
    };
    seasons = ["Winter", "Spring", "Summer", "Fall"]
    // console.log(genreDict)
    yearRange = Array.from(new Array(33), (x,i) => i + 1986)
    // console.log(yearRange)
    // fill up the empty years and empty seasons
    for (year of yearRange){
        // console.log(year)
        for (genre of Object.keys(genreDict)){
            // console.log(genre)
            if(!genreDict[genre][year]){
                genreDict[genre][year] = {}
            }
            for (season of seasons){
                if(!genreDict[genre][year][season]){
                    genreDict[genre][year][season] = []
                }
            }
        }
    }
    // console.log(genreDict)
    genreList = []
    for (genre of Object.keys(genreDict)){
        inGenre = genreDict[genre]
        for (year of Object.keys(inGenre)){
            inYear = inGenre[year]
            for (season of Object.keys(inYear)){
                heatEntry = {}
                heatEntry["genre"] = genre
                if (season == "Winter"){
                    heatEntry["season"] = 1
                }
                else if (season == "Spring"){
                   heatEntry["season"] = 2
                }
                else if (season == "Summer"){
                   heatEntry["season"] = 3
                }
                else {
                   heatEntry["season"] = 4
                }
                // else (season == "Fall"){
                //    heatEntry["season"] = 4
                // }
                heatEntry["year"] = year
                // console.log(inYear[season])
                heatEntry["amount"] = inYear[season]
                genreList.push(heatEntry)
              }

            }
        }
    // console.log(genreList)
    return genreList
}

const makeBarGraph = function(data){

    // data = data[1]
    // // pick bigBardata temporarily
    // data = data[0]


    // defines the size of the SVG
    var width = 600;
    var height = 400;

    // defines the padding for the graph
    pad = {
      top: height * 0.1,
      bottom: height * 0.1,
      left: width * 0.2,
      right: width * 0.05
    };

    // defines the size of the chart
    var wChart = width - pad.left - pad.right;
    var hChart = height - pad.bottom - pad.top;

    // creates the SVG element in the html-body
    var svg = d3.select("body")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("class", "barchart");
    // not needed
    svgGlob.push(svg)

    // creates the background of the SVG-element
    svg.append("rect")
       .attr("width", "100%")
       .attr("height", "100%")
       .attr("fill", "grey")
       .attr("opacity", 0.1);
     //
     // data = dataGlob[0][0][0]
     //
     // data.sort(function(a, b) {
     //           return d3.ascending(a[1], b[1])
     //           })
     // // isolates the lowest data value from the data
     // var min = d3.min(data, function(d){
     //                            return d[1];
     //                            });
     // // isolates the highest data value from the data
     // var max = d3.max(data, function(d){
     //                            return d[1];
     //                            });

     yScale = d3.scaleBand()
                .range([height - pad.bottom, pad.top])
     xScale = d3.scaleLinear()
                .range([pad.left, width - pad.right])
      // yScale.domain(data.map(function(d){
      //                         return d[0]
      //                         }))
      // xScale.domain([min - 1, max])

    // add the x Axis
    var barXAxis = svg.append("g")
                      .attr("transform", "translate(" + 0 + "," + height * 0.9 + ")")
                      .attr("class", "barYAxis")
                      .call(d3.axisBottom(xScale));

    // add the y Axis
    var barYAxis = svg.append("g")
                      .attr("transform", "translate(" + pad.left * 0.9 + "," + 0+ ")")
                      .attr("class", "barXAxis")
                      .call(d3.axisLeft(yScale));

    const addOptions = function(){
      bOptions = d3.select("body")
                  .append("div")
                  .attr("width", width)
                  .attr("height", height)
                  .attr("class", "baroptions");

      barData = bOptions.selectAll("inputBD")
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

       barType = bOptions.selectAll("inputBT")
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
    }

    addOptions()
    updateBars()
}
const updateBars = function(){
    svg = d3.select(".barchart")
    var width = parseInt(svg.style("width"));
    var height = parseInt(svg.style("height"));

    // console.log([width, height])
    pad = {
      top: height * 0.1,
      bottom: height * 0.1,
      left: width * 0.2,
      right: width * 0.05
    };

    try{
      var dataVar = parseInt(d3.select('input[name="barData"]:checked').node().value);
      var typeVar = parseInt(d3.select('input[name="barType"]:checked').node().value);
    }
    catch (err){
        // alert("MEH")
        var dataVar = 0
        var typeVar = 0
    }
    //

    data = dataGlob[0][dataVar][typeVar]

    data.sort(function(a, b) {
              return d3.ascending(a[1], b[1])
              })
    // isolates the lowest data value from the data
    var min = d3.min(data, function(d){
                               return d[1];
                               });
    // isolates the highest data value from the data
    var max = d3.max(data, function(d){
                               return d[1];
                               });

    // console.log([min, max])
    yScale.domain(data.map(function(d){
                            return d[0]
                            }))
    xScale.domain([min - 1, max])

    var rects = svg.selectAll("rect")
          .data(data)
					.remove()
					.exit()
					.data(data)

    var rects = svg.selectAll("rect")
                   .data(data)
                   .enter()
                   .append("rect")
                   .attr("y", function(d) {return yScale(d[0]);})
                   .attr("x", pad.left)
                   .attr("width", function(d) {return xScale(d[1]) - pad.left;})
                   .attr("height", yScale.bandwidth() * 0.9)
                   .on("mouseover", function(d) {
                                    d3.select(this)
                                      .style("opacity", 0.5);
                                    })
                   .on("mouseout", function(d) {
                                   d3.select(this)
                                     .style("opacity", 1.0);
                                   })
                   .on("click", function(d){
                                updateHeat(d[0])
                                });
    // https://bl.ocks.org/d3noob/1ea51d03775b9650e8dfd03474e202fe
    svg.selectAll("rect")
       .data(data)
       .transition().duration(1000)
       .attr("y", function(d) {return yScale(d[0]);})
       .attr("x", pad.left)
       .attr("width", function(d) {return xScale(d[1]) - pad.left;})
       .attr("height", yScale.bandwidth() * 0.9)

    svg.select(".barYAxis")
       .call(yScale)
    svg.select(".barXAxis")
       .call(xScale)
}

const makeLineGraph = function(data){
  // console.log(data)
  // console.log(data.Action)
  // data = data.Action
  var width = 600;
  var height = 400;
  pad = {
          top: height * 0.2,
          bottom: height * 0.1,
          left: width* 0.15,
          right: width * 0.05
        };

  var wChart = width - pad.left - pad.right;
  var hChart = height - pad.bottom - pad.top;

  n = 2
  slideValue = 2003
  lowerBound = slideValue - 10
  upperBound = slideValue + 10

  max = findLineMax(data)
  // console.log(max)

  svg = d3.select("body")
          .append("svg")
          .attr("width", width)
          .attr("height", height)
          .attr("class", "linechart");
  svgGlob.push(svg)

 var lineOpacity = "0.25";
 var lineOpacityHover = "0.85";
 var otherLinesOpacityHover = "0.1";
 var lineStroke = "1.5px";
 var lineStrokeHover = "2.5px";

 var xScale = d3.scaleLinear()
                // .domain([lowerBound, upperBound])
                .domain([1986, 2018])
                .range([pad.left, width - pad.right])
 var yScale = d3.scaleLinear()
                .domain([0, max])
                .range([height - pad.bottom, pad.top])

 var color = d3.scaleOrdinal(d3.schemeCategory10);

 var line = d3.line()
              .x(d => xScale(d.year))
              .y(d => yScale(d.yearData.length))

 let lines = svg.append('g')
                .attr("class", "lines");

 lines.selectAll(".line-group")
      .data(data).enter()
      .append("g")
      .attr('class', 'line-group')
      .append('path')
        .attr('class', 'line')
        .attr('d', d => line(d.years))
        .style('stroke', (d, i) => color(i))
        .style('opacity', lineOpacity)
      var xAxis = d3.axisBottom(xScale).ticks(5);
    var yAxis = d3.axisLeft(yScale).ticks(5);

  var xAxis = d3.axisBottom()
                .scale(xScale)
                .tickFormat(d3.format("d"));
  var yAxis = d3.axisLeft()
                .scale(yScale);

  svg.append("g")
     .attr("transform", "translate("+ 0 + ","
                                    + yScale(0) + ")")
     .call(xAxis);
  // creates the Y-axis
  svg.append("g")
     .attr("transform", "translate("+ (pad.left) + ","
                                    + 0 + ")")
     .call(yAxis);
}
const makeHeatGraph = function(data){
  // console.log(data)
  var width = 600;
  var height = 400;

  pad = {
    top: height * 0.2,
    bottom: height * 0.4,
    left: width* 0.15,
    right: width * 0.1
  };

  svg = d3.select("body")
          .append("svg")
          .attr("width", width)
          .attr("height", height)
          .attr("class", "heatchart");
  svgGlob.push(svg)
   addSlider(svg, height)


  const makeHeatLegend = function(){
    // set scaler for alpha colour
    var colScale = d3.scaleLinear()
                     .domain([0, 250])
                     .range([50, 255]);
    // makes legend data for the chloropleth map
    var legData = [[0, "<5 watched"],
                   [100, "5-10 watched"],
                   [250, "+10 watched"]]
    // creates legend element
    var legend = svg.selectAll(".legend")
                    .data(legData)
                    .enter()
                    .append("g")
                    .attr("class", "legend")
                    .attr("transform", function(d,i) {
                                       var legX = 500
                                       var legY = 300
                                       return "translate(" + legX + ","
                                                           + legY + ")"
                                       })
                    .style("font-size","10px");
    // creates the background for the legend
    legend.append('rect')
          .attr('width', 400)
          .attr('height', legData.length * 20)
          .attr("x", 0)
          .attr("y", -20)
          .style('fill', "white")
          .attr("opacity", 0.2)
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
                          console.log(colValue)
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
  makeHeatLegend()
  updateHeat("Comedy")

}
const updateHeat = function(selVar){
    svg = d3.select(".heatChart")
    data = dataGlob[2]

    var width = parseInt(svg.style("width"));
    var height = parseInt(svg.style("height"));
    pad = {
      top: height * 0.2,
      bottom: height * 0.4,
      left: width* 0.15,
      right: width * 0.1
    };
    
    var yList = ["Winter", "Spring", "Summer", "Fall"]

    var max = d3.max(data, function(d){
                              return d.amount.length;
                              });
    var xScale = d3.scaleLinear()
                   .domain([1986, 2018])
                   // .domain([lowerBound, upperBound])
                   .range([pad.left, width - pad.right])
    var yScale = d3.scaleLinear()
                   .domain([0, yList.length])
                   .range([pad.top, height-pad.bottom]);

    var wChart = width - pad.left - pad.right;
    var hChart = height - pad.bottom - pad.top;
    console.log(selVar)
    yearRange = Array.from(new Array(33), (x,i) => i + 1986)
    // console.log(yearRange)

    gridWidth = Math.floor(wChart / yearRange.length)
    gridHeight = gridWidth * (yList.length + 2)
    fontSize = gridWidth * 62.5 / 900

    const placeYLabels = function(){

        var yLabels = svg.selectAll(".heatYLabel")
         .data(yList)
         .enter()
         .append("text")
         .text(function(d) {
           // console.log(d)
           return d; })
         .attr("x", pad.left * 0.9)
         .attr("y", function(d,i){
                    var yCoor = yScale(i) + 7
                    return yCoor
                    })
         .style("font-size", "10px")
         .style("text-anchor", "end")
    }
    placeYLabels()
    var xLabels = svg.selectAll(".heatXLabel")
   	 .data(yearRange)
   	 .enter()
   	 .append("text")
   	 .text(function(d) {
       // console.log(d)
       return d; })
   	 .attr("x", function(d,i){
           var xCoor = xScale(i + 1986) // i + lowerbound
           return xCoor
           })
   	 .attr("y", pad.top * 0.9)
     .style("font-size", "10px")
   	 .style("text-anchor", "center")


    // when studios
    var dataVar = parseInt(d3.select('input[name="barData"]:checked').node().value);


    var nest = d3.nest()
                      .key(function(d) { return d.genre; })
                      .entries(data);

    var genres = nest.map(function(d) { return d.key; });
    // var currentGenreIndex = "Comedy";
    var selectGenre = nest.find(function(d) {
                                              return d.key == selVar;
                                            });

    var colScale = d3.scaleLinear()
                    .domain([0, 10])
                    .range([50, 255]);

    var heatmap = svg.selectAll(".heatYear")
      .data(selectGenre.values)
      .enter()
      .append("rect")
      .attr("x", function(d) {
                                var xValue = xScale(d.year)
                                return xValue
                              })
      .attr("y", function(d) {
                                var yValue = yScale(d.season - 1)
                                return yValue
                              })
      // .attr("class", "hour bordered")
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
      // .style("stroke-opacity", 0.6)
      .style("fill", function(d) {
                                  var colValue = colScale(d.amount.length)
                                  var colour = `rgb(0,0,${colValue})`
                                  if (d.amount.length == 0){
                                      colour = "darkgrey"
                                  }
                                  return colour; })
      .on("click", function(d){
                   updateAgenda(d.amount)
                   });

      var heatmap = svg.selectAll(".heatYear")
                       .data(selectGenre.values)
                       .transition()
                       .duration(500)
                       .style("fill", function(d) {
                                      var colValue = colScale(d.amount.length)
                                      var colour = `rgb(0,0,${colValue})`
                                      if (d.amount.length == 0){
                                          colour = "darkgrey"
                                      }
                                      return colour;
                                      })

}
const updateAgenda = function(entries){
    svg = d3.select(".agenda")
    // svg.attr("height", function(d){
    //                    var agendaHeight = 10 * entries.length
    //                    return agendaHeight
    //                    })
    console.log(entries)
    svg.selectAll(".agendaEntry")
					.remove()
					.exit()

      svg.transition().duration(1000)
         .attr("height", function(d){
                           var agendaHeight = 10 * entries.length
                           return agendaHeight
                           })
    for (entry of entries){
      svg.append("p")
        .text(entry)
        .attr("class", "agendaEntry");
    }


}
const placeOptions = function(){
  var width = 600;
  var height = 400;

  pad = {
    top: height * 0.1,
    bottom: height * 0.2,
    left: width* 0.15,
    right: width * 0.05
  };


  lOptions = d3.select("body")
              .append("div")
              .attr("width", width)
              .attr("height", height)
              .attr("class", "lineoptions");


 var testData = ["genre1","genre2","genre3","genre4"]
 labels = lOptions.selectAll("input")
                  .data(testData)
                  .enter()
                  .append("label")
                  .text(function(d){return d})
                  .append("input")
                  .attr("type", "checkbox")
                  .attr("name", "box1")
                  .attr("value", "MEH")

  lOptions.append("label")
           .text("Show all years")
           .append("input")
           .attr("type", "submit")
           .attr("name", "lineAllYears")
           .attr("value", "MEH")

  hOptions = d3.select("body")
                .append("div")
                .attr("width", width)
                .attr("height", height)
                .attr("class", "agenda");
}
const findLineMax = function(data){
    max = 0
    // console.log(data)
    for (key of Object.keys(data)){
      // console.log(data[key])

      yearData = data[key].years
      // console.log(yearData)
      var genreMax = d3.max(yearData, function(d){
                                 return d.yearData.length;
                                 });
      if (genreMax > max){
          max = genreMax
      }
    }
    // console.log(max)
    return max
}
const addSlider = function(svg, height){
  var valueElement = svg.append("div")
                      .attr("class", "col-sm-2")
                      .append("p")
                      .attr("id", "value-time")
  var slideElement = svg.append("div")
                      .attr("class", "col-sm")
                      .append("p")
                      .attr("id", "slider-time")

  // Time
  var dataTime = d3.range(0, 12).map(function(d) {
    return new Date(1996 + d, 10, 3);
  });

  var sliderTime = d3
    .sliderBottom()
    .min(d3.min(dataTime))
    .max(d3.max(dataTime))
    .step(1000 * 60 * 60 * 24 * 365)
    .width(300)
    .tickFormat(d3.timeFormat('%Y'))
    .tickValues(dataTime)
    .default(new Date(1998, 10, 3))
    .on('onchange', val => {
      valueElement.text(d3.timeFormat('%Y')(val));
      updateHeat()
    });

  var gTime = svg
    .append('svg')
    .attr('width', 500)
    .attr('height', 100)
    .attr("x", pad.left)
    .attr("y", height - 100)
    .append('g')
    .attr('transform', 'translate(50,50)');

  gTime.call(sliderTime);

  valueElement.text(d3.timeFormat('%Y')(sliderTime.value()));
}
