/*
Created by: Julian Evalle

This program preprocesses data and creates updateable and interactable barcharts with
a selection of what to represent

data obtained from crawling a MyAnimeList(MAL) account

Tooltip credit to Alan Dunning for everything that has been done with the V5-usable tooltip:
link to used site: https://bl.ocks.org/alandunning/274bf248fd0f362d64674920e85c1eb7
*/





// preprocesses barchart data
const preBarData = function(data){
    var genreDict = {};
    var studioDict = {};
    // goes through each entry in the dataset
    for (variable of data){
        // goes through all the genres of the entry
        for (genre of variable[8]){
            // filter irrelevant data
            if ((genre.length > 13) || genre[0] == genre[0].toLowerCase() ||
               ((genre.includes("-")) && genre != "Sci-Fi")){
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
          // filter irrelevant data
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
    // assigns the each genre to its respective big or small list
    for (let key of Object.keys(genreDict)){

        if (parseInt(genreDict[key]) < genreMedian){
            smallGenreList.push([key,genreDict[key]]);
        }
        else {
            bigGenreList.push([key,genreDict[key]]);
        };
    };
    // assigns the each studio to its respective big or small list
    for (let key of Object.keys(studioDict)){
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
// sets up the SVG for the bar graph
const makeBarGraph = function(data){
    addBarOptions;
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
        .attr("transform", "translate(" + pad.left * 0.9 + "," + 0 + ")")
        .attr("class", "barYAxis");

    // creates the Title
    svg.append("text")
       .attr("class", "tLabBar")
       .attr("y", height * 0.05)
       .attr("x", width * 0.55)
       .style("text-anchor", "middle")
    // creates the Y-axis label
    svg.append("text")
       .attr("class", "yLabBar")
       .attr("y", height * 0.075)
       .attr("x", pad.left * 0.725 )
       .style("text-anchor", "middle")
    // creates the X-axis label
    svg.append("text")
       .attr("class", "xLabBar")
       .attr("y", height * 0.98)
       .attr("x", width * 0.55 )
       .style("text-anchor", "middle");

    addBarOptions();
    // updates the bars
    updateBars();
    // adds the options box of the bar graph
    function addBarOptions(){

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
                            .attr("value", function(d, i){return i})
                            .property("checked", function(d){
                                                 return d==="Genres"
                                                 })
                            .on("click", function(d){updateBars()});

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
                             .property("checked", function(d) {
                                                  return d==="Big Data";
                                                  })
                             .on("click", function(d){updateBars()});

            d3.select(".barOptions").append("br")
            d3.select(".barOptions").append("br")
            d3.select(".barOptions").append("text")
                                    .text("Show data as Number or" +
                                          "Percentages of list:")
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
                             .property("checked", function(d) {
                                                  return d==="Numbers";
                                                  })
                             .on("click", function(d){updateBars()});
       }
}
// creates and updates the bar graph
const updateBars = function(){
    quant;
    // selects barSVG and defines dimensions
    var svg = d3.select(".barchart");
    var width = parseInt(svg.style("width"));
    var height = parseInt(svg.style("height"));
    var pad = {
                top: height * 0.1,
                bottom: height * 0.1,
                left: width * 0.19,
                right: width * 0.17
              };
    // obtains the selected options from the bar radio buttons
    var dataVar = parseInt(d3.select('input[name="barData"]:checked').node().value);
    var typeVar = parseInt(d3.select('input[name="barType"]:checked').node().value);
    var quantVar = parseInt(d3.select('input[name="barQuant"]:checked').node().value);

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
    // gets the largest datapoint from the bigList of genres or studios for
    // the appropriate colouring
    var bigdataMax = d3.max(dataGlob[0][dataVar][0], function(d){
                                                     return quant(d[1])
                                                     })
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
       .style("font-size",  function(){
                            var size = 300 / data.length
                            // check if font-size is too big
                            if (size > 16){
                                size = 16
                            }
                            return size
                            })
       .transition()
       .call(yAxisCallBar);
    // udpates the title text
    svg.selectAll(".tLabBar")
	 		 .text(function(){
             if (typeVar == 0){
                 var preTLab = "More Prevalent"
             }
             else{
                var preTLab = "Less Prevalent"
             }
             if (dataVar == 0){
                var tLab = "Genres"
             }
             else{
                var tLab = "Studios"
             }
             if (quantVar == 0){
                var prePreTLab = "Amount"
             }
             else{
                var prePreTLab = "Percentage"
             }
             return `The ${prePreTLab} of ${preTLab} ${tLab} within the List`
            })
    // updates the y label
    svg.select(".yLabBar")
       .text(function(){
             if (dataVar == 0){
                 var yLab = "|Genres|"
             }
             else{
               var yLab = "|Studios|"
             }
             return yLab
           })
    svg.select(".xLabBar")
       .text(function(){
             if (quantVar == 0){
                 var yLab = "Amount found in the list"
             }
             else{
                 var yLab = "Percentage of the total amount in the list"
             }
              return yLab
            })

    // selects and creates the bars
    var rects = svg.selectAll("rect")
                   .data(data);
    rects.enter()
         .append("rect")
         .merge(rects)
         .on("mouseover", function(d) {
                          d3.select(this)
                            .style("opacity", 0.5);
                          var svgLeft = parseInt(svg.style("left"));
                          var svgTop = parseInt(svg.style("top"));
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
    // removes excessive bars
    rects.exit().remove();
    // quantifies the data to percentages if the selected in the radio buttons
    function quant(d){
          if (quantVar == 0){
              return d;
          }
          else{
              return d / totEnt * 100;
          };
    };
}
