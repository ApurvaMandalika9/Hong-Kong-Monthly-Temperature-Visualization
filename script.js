// Global variables for aggregated datasets, current level, and temperature mode.
let aggregatedDataLevel1, aggregatedDataLevel2;
let currentLevel = "level1";
let currentTempMode = "max";

// Creating a container with buttons and visualization area.
d3.select("body").append("div").html(
  `<button id='level1' class='selected'>Level 1</button> 
   <button id='level2'>Level 2</button>
   <button id='tempToggle'>Show Min</button>
   <div id='visualization'></div>`
);

// Adding button events for switching levels.
d3.select("#level1").on("click", () => {
    d3.selectAll("button").classed("selected", false);
    d3.select("#level1").classed("selected", true);
    currentLevel = "level1";
    renderMatrix();
});

d3.select("#level2").on("click", () => {
    d3.selectAll("button").classed("selected", false);
    d3.select("#level2").classed("selected", true);
    currentLevel = "level2";
    renderMatrix();
});


// Adding button event for toggling temperature mode.
d3.select("#tempToggle").on("click", () => {
    currentTempMode = currentTempMode === "max" ? "min" : "max";
    d3.select("#tempToggle").text("Show " + (currentTempMode === "max" ? "Min" : "Max"));
    renderMatrix();
});

// Loading the CSV data.
d3.csv("temperature_daily.csv").then(data => {
  // Parsing each CSV row.
  data.forEach(d => {
    d.date = new Date(d.date);
    d.year = d.date.getFullYear();
    d.month = d.date.getMonth() + 1;
    d.max_temperature = +d.max_temperature;
    d.min_temperature = +d.min_temperature;
    d.avg_temperature = (d.max_temperature + d.min_temperature) / 2;
  });

  // Creating two aggregated datasets: 
  // Level 1: filtering years >= 1997; Level 2: filtering years >= 2008.
  const aggregateByYearMonth = (filterYear) => {
    const filtered = data.filter(d => d.year >= filterYear);
    return d3.rollups(filtered, v => ({
      max: d3.max(v, d => d.max_temperature),
      min: d3.min(v, d => d.min_temperature),
      avg: d3.mean(v, d => d.avg_temperature),
      days: v
    }), d => d.year, d => d.month)
      .map(([year, months]) =>
        months.map(([month, stats]) => ({ year, month, ...stats }))
      )
      .flat();
  };

  aggregatedDataLevel1 = aggregateByYearMonth(1997);
  aggregatedDataLevel2 = aggregateByYearMonth(2008);

  // Initially rendering Level 1 by default.
  renderMatrix();
});

// Function to render the entire visualization.
function renderMatrix() {
  // Removing any existing SVG and tooltip.
  d3.select("#visualization").selectAll("svg").remove();
  d3.select("#visualization").selectAll(".tooltip").remove();

  // Determining the aggregated data based on the current level.
  const aggregatedData = currentLevel === "level1" ? aggregatedDataLevel1 : aggregatedDataLevel2;

  // Setting up margins and dimensions.
  const margin = { top: 100, right: 100, bottom: 100, left: 100 },
        width = 800 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

  // Creating the main SVG container.
  const svg = d3.select("#visualization")
    .append("svg")
    .attr("width", width + margin.left + margin.right + 100)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Determining the number of years in the aggregated data.
  const years = Array.from(new Set(aggregatedData.map(d => d.year))).sort();
  // Using months 1 through 12.
  const months = d3.range(1, 13);

  // Defining the scales for the matrix.
  const xScale = d3.scaleBand()
    .domain(years)
    .range([0, width])
    .padding(0.05);

  const yScale = d3.scaleBand()
    .domain(months)
    .range([0, height])
    .padding(0.05);

  // Set the global min and max temperatures (in Celsius) for the color scale.
  const globalMinTemp = 0;
  const globalMaxTemp = 40;
  const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
    .domain([globalMinTemp, globalMaxTemp]);

  // Creating a scale to map temperatures to y positions within each cell.
  const cellTempScale = d3.scaleLinear()
    .domain([globalMinTemp, globalMaxTemp])
    .range([yScale.bandwidth(), 0]);

  // Adding the base matrix.
  const cells = svg.selectAll(".cell")
    .data(aggregatedData)
    .enter().append("g")
    .attr("class", "cell")
    .attr("transform", d => `translate(${xScale(d.year)},${yScale(d.month)})`);

  // Adding a colored rectangle for each cell.
  // Now, the fill is based on the currentTempMode (max or min).
  cells.append("rect")
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("fill", d => d[currentTempMode] !== undefined ? colorScale(d[currentTempMode]) : "#ccc")
    .on("mouseover", function(event, d) {
      tooltip.style("visibility", "visible")
        .html(`Date: ${d.year}-${d.month}<br>Max Temp: ${d.max}°C<br>Min Temp: ${d.min}°C`);
    })
    .on("mousemove", event =>
      tooltip.style("top", (event.pageY - 10) + "px")
             .style("left", (event.pageX + 10) + "px")
    )
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

  // Creating a tooltip div.
  const tooltip = d3.select("#visualization").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "lightgray")
    .style("padding", "5px")
    .style("border-radius", "5px");

  // Adding the x and y axes.
  svg.append("g")
    .attr("transform", `translate(0,0)`)
    .call(d3.axisTop(xScale).tickFormat(d3.format("d")));

  svg.append("g")
    .call(d3.axisLeft(yScale).tickFormat(d => d3.timeFormat("%B")(new Date(0, d - 1))));

  // Creating a legend for the color scale.
  const legendHeight = 150,
        legendWidth = 20;
  const legend = svg.append("g")
    .attr("transform", `translate(${width + 30}, ${height - legendHeight - 50})`);

  const legendScale = d3.scaleLinear()
    .domain([globalMinTemp, globalMaxTemp])
    .range([legendHeight, 0]);

  const legendAxis = d3.axisRight(legendScale)
    .ticks(6)
    .tickFormat(d3.format(".1f"));

  legend.selectAll("rect")
    .data(d3.range(10))
    .enter().append("rect")
    .attr("x", 0)
    .attr("y", d => (d / 10) * legendHeight)
    .attr("width", legendWidth)
    .attr("height", legendHeight / 10)
    .attr("fill", d => colorScale(legendScale.invert((d / 10) * legendHeight)));

  legend.append("g")
    .attr("transform", `translate(${legendWidth}, 0)`)
    .call(legendAxis);

  // If currently in Level 2, add the mini line charts.
  if (currentLevel === "level2") {
    cells.each(function(d) {
      // Only add trends if there are enough daily data points.
      if (d.days && d.days.length > 1) {
        // Creating a scale for the x-axis of the mini chart within the cell.
        const dayScale = d3.scaleLinear()
          .domain([0, d.days.length - 1])
          .range([0, xScale.bandwidth()]);

        // Line for the min temperatures.
        const lineMin = d3.line()
          .x((day, i) => dayScale(i))
          .y(day => cellTempScale(day.min_temperature))
          .curve(d3.curveMonotoneX);

        // Line for the max temperatures.
        const lineMax = d3.line()
          .x((day, i) => dayScale(i))
          .y(day => cellTempScale(day.max_temperature))
          .curve(d3.curveMonotoneX);

        // Append the min temperature trend line.
        d3.select(this).append("path")
          .datum(d.days)
          .attr("class", "trend")
          .attr("fill", "none")
          .attr("stroke", "lightblue")
          .attr("stroke-width", 1.5)
          .attr("d", lineMin);

        // Append the max temperature trend line.
        d3.select(this).append("path")
          .datum(d.days)
          .attr("class", "trend")
          .attr("fill", "none")
          .attr("stroke", "green")
          .attr("stroke-width", 1.5)
          .attr("d", lineMax);

        // Adding a legend for the trend lines.
        const trendLegend = svg.append("g")
          .attr("class", "trend-legend")
          .attr("transform", `translate(${width + 30}, ${height - legendHeight - 50 - 100})`);
      
        // Blue swatch for Min Temperature.
        trendLegend.append("line")
          .attr("x1", 0)
          .attr("x2", 20)
          .attr("y1", 40)
          .attr("y2", 40)
          .attr("stroke", "lightblue")
          .attr("stroke-width", 2);
      
        trendLegend.append("text")
          .attr("x", 25)
          .attr("y", 40)
          .text("Min Temperature")
          .attr("font-size", "12px")
          .attr("alignment-baseline", "middle");
      
        // Green swatch for Max Temperature.
        trendLegend.append("line")
          .attr("x1", 0)
          .attr("x2", 20)
          .attr("y1", 60)
          .attr("y2", 60)
          .attr("stroke", "green")
          .attr("stroke-width", 2);
      
        trendLegend.append("text")
          .attr("x", 25)
          .attr("y", 60)
          .text("Max Temperature")
          .attr("font-size", "12px")
          .attr("alignment-baseline", "middle");
      }
    });
  }
}
