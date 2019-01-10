var dataGlob = []
window.onload = function() {
    // decodes the JSON file
    var username = "goblok"
    var listType = "2"
    var requests = [d3.json(`${username}_${listType}.json`)];
    // ensures that all data is loaded properly before calling any functions
    Promise.all(requests).then(function(response) {
        // preprocesses the data
        var data = preProcess(response)
        barDataGenres = data[0][0]
        console.log(data[0][0])
        makeBarGraph(barDataGenres)
        makeLineGraph()
        makeHeatGraph()

    }).catch(function(e){
             throw(e);
             });
};
const preProcess = function(data){
    var barData = preBarData(data[0])
    var lineData = preLineData(data[0])
    return [barData]
}
const preBarData = function(data){
    console.log(data.length)
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
            if (!(studioDict[studio])){
               studioDict[studio] = 0
            }
            studioDict[studio]++
        }
    };
    // console.log(genreDict)
    // console.log(studioDict)
    genreList = []
    studioList = []

    for (let key of Object.keys(genreDict)){
        entryDict = {}
        entryDict["genre"] = key
        entryDict["value"] = genreDict[key]
        if (key == "unknown"){
          continue
        }
        // genreList.push([key,genreDict[key]]);
        genreList.push(entryDict)
    };
    for (let key of Object.keys(studioDict)){
        // entryDict = {}
        // entryDict[genre] = key
        // entryDict[value] = genreDict[key]
        if (key == "unknown"){
          continue
        }
        studioList.push([key,studioDict[key]]);
        // genreList.push(entryDict)
    };

    // console.log(genreList)
    // console.log(studioList)
    return [genreList, studioList]
}

const preLineData = function(data){
    console.log(data)
    yearDict = {}
    seasonDict = {}
    genreDict = {}

    for (variable of data){
        title = variable[0]
        year = variable[2]
        for (genre of variable[8]){
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
    console.log(genreDict)
    yearRange = Array.from(new Array(33), (x,i) => i + 1986)
    console.log(yearRange)
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
    console.log(genreDict)
    genreList = []
}

const makeBarGraph = function(data){

    console.log(data)
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
    bOptions = d3.select("body")
                .append("div")
                .attr("width", width)
                .attr("height", height)
                .attr("class", "baroptions");

    // creates the background of the SVG-element
    svg.append("rect")
       .attr("width", "100%")
       .attr("height", "100%")
       .attr("fill", "grey")
       .attr("opacity", 0.1);

     yScale = d3.scaleBand()
                .range([hChart, 0])
                .padding(0.1)
     xScale = d3.scaleLinear()
                .range([pad.left, wChart-pad.right])

      // isolates the lowest data value from the data
      var min = d3.min(data, function(d){
                                 return d.value;
                                 });
      // isolates the highest data value from the data
      var max = d3.max(data, function(d){
                                 return d.value;
                                 });

      yScale.domain([data.map(function(d){
                              return d.genre
                              })])
      xScale.domain([0, max])


    var rects = svg.selectAll("rect")
                   .data(data)
                   .enter()
                   .append("rect")
                   .attr("width", function(d) {return xScale(d.value); } )
                   .attr("y", function(d,i) { return 10 * i; })
                   .attr("x", pad.left)
                   .attr("height", 5);;

      // add the x Axis
    svg.append("g")
        .attr("transform", "translate(" + pad.left+ "," + hChart+ ")")
        .call(d3.axisBottom(xScale));

    // add the y Axis
    svg.append("g")
        .attr("transform", "translate(" + pad.left + "," + pad.bottom+ ")")
        .call(d3.axisLeft(yScale));
}
const makeLineGraph = function(data){
  var width = 600;
  var height = 400;
  testData1 = [{x: 1997, y: 1}, {x: 1998, y: 5}]
  testData2 = [{x: 1997, y: 1}, {x: 1998, y: 5}]
  svg = d3.select("body")
          .append("svg")
          .attr("width", width)
          .attr("height", height)
          .attr("class", "linechart");







  lOptions = d3.select("body")
              .append("div")
              .attr("width", width)
              .attr("height", height)
              .attr("class", "lineoptions");
  // lOptions.append("input")
  //         .attr("type", "checkbox")
  //         .attr("name", "box1")
  //         .attr("value", "MEH")
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


}
const makeHeatGraph = function(data){
  var width = 600;
  var height = 400;
  d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "heatchart");
  hOptions = d3.select("body")
                .append("div")
                .attr("width", width)
                .attr("height", height)
                .attr("class", "heatoptions");
}
