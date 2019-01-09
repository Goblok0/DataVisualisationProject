window.onload = function() {
    // decodes the JSON file
    var username = "goblok"
    var listType = "2"
    var requests = [d3.json(`${username}_${listType}.json`)];
    // ensures that all data is loaded properly before calling any functions
    Promise.all(requests).then(function(response) {
        // preprocesses the data
        var data = preProcess(response)
        console.log(data[0][0])
        makeBarGraph(data[0][0])

    }).catch(function(e){
             throw(e);
             });
};
const preProcess = function(data){
    var barData = preBarData(data[0])
    return [barData]
}
const preBarData = function(data){
    console.log(data.length)
    console.log(data)
    barGenreDict = {}
    barStudioDict = {}
    // increments xLabel data
    for (variable of data){
        // console.log(variable[8])
        for (genre of variable[8]){
            if (!(barGenreDict[genre])){
               barGenreDict[genre] = 0
            }
            barGenreDict[genre]++
        }
        for (studio of variable[9]){
            if (!(barStudioDict[studio])){
               barStudioDict[studio] = 0
            }
            barStudioDict[studio]++
        }
    };
    console.log(barGenreDict)
    console.log(barStudioDict)
    return [barGenreDict, barStudioDict]
}
const makeBarGraph = function(data){

    // defines the size of the SVG
    var width = 600;
    var height = 400;

    // defines the padding for the graph
    pad = {
      top: height * 0.1,
      bottom: height * 0.2,
      left: width* 0.15,
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
    d3.select("body")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "linechart");
    d3.select("body")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "heatchart");

    // creates the background of the SVG-element
    svg.append("rect")
       .attr("width", "100%")
       .attr("height", "100%")
       .attr("fill", "grey")
       .attr("opacity", 0.1);


    // isolates the lowest data value of the Y-Variables
    var minY = d3.min(selData, function(d){
                               return d[yVar];
                               });
    // isolates the highest data value of the Y-variables
    var maxY = d3.max(selData, function(d){
                               return d[yVar];
                               });
    // isolates the lowest data values from the X-Variables
    var minX = d3.min(selData, function(d){
                               return d[xVar];
                               });
    // isolates the highest data values from the X-Variables
    var maxX = d3.max(selData, function(d){
                               return d[xVar];
                               });

    // rescales the x-values to the size of the graph
    var xScale = d3.scaleLinear()
                   .domain([minX, maxX])
                   .range([pad.left, wChart - pad.right]);
    // rescales the y-values to the size of the graph
    var yScale = d3.scaleLinear()
                   .domain([0, maxY])
                   .range([height - pad.bottom, pad.top]);

    // obtains all details from each circle made
    var circles = svg.selectAll("circle")
                     .data(selData)
                     .enter()
                     .append("circle");

    // gives attributes to the created circles
    circles.attr("cx", function(d){
                       return xScale(d[xVar]);
                       })
           .attr("cy", function(d){
                       return yScale(d[yVar]);
                       })
           .attr("r", 5)
           .attr("opacity", 1)
           .attr("fill", function(d){
                         var colour = colourPicker(colourVar, d[colourVar])
                         return colour;
                         })
           .attr("data-legend",function(d){
                               return d;
                               });

    // defines the scale for the X-variable
    var xAxis = d3.axisBottom()
                  .scale(xScale)
                  .tickFormat(d3.format("d"));
    // defines the scale for the Y-variable
    var yAxis = d3.axisLeft()
                  .scale(yScale);

    // creates the X-axis
    svg.append("g")
       .attr("transform", "translate("+ 0 + ","
                                      + (height - pad.bottom) + ")")
       .call(xAxis);
    // creates the Y-axis
    svg.append("g")
       .attr("transform", "translate("+ (pad.left * 0.8) + ","
                                      + 0 + ")")
       .call(yAxis);
}
