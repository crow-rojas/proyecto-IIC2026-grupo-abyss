
// Initialize the dimensions of the visualization
const totalWidth = 3000;
const margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = totalWidth - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

// Append the svg object to the body of the page
const svg = d3.select("#vis-2")
  .append("svg")
    .attr("width", totalWidth)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// Read the data and draw the visualization
d3.csv("anime.csv").then(function(data) {

    let filteredData = data.filter(d => {
    d.StartYear = +d.StartYear;
    d.EndYear = +d.EndYear;
    d["Rating Score"] = +d["Rating Score"];
    return d.StartYear >= 1900 && d.StartYear <= new Date().getFullYear()
            && d.EndYear >= 1900 && d.EndYear <= new Date().getFullYear()
            && !isNaN(d["Rating Score"]);
    });

    const xDomain = d3.extent(filteredData, d => Math.min(d.StartYear, d.EndYear));
    xDomain[0] -= 1;
    const x = d3.scaleLinear()
    .domain(xDomain)
    .range([0, width]);

    // Define Y axis scale
    const y = d3.scaleLinear()
    .domain([0, d3.max(filteredData, d => d["Rating Score"])])
    .range([height, 0]);

    // Add X axis
    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

    // Add Y axis
    svg.append("g")
    .call(d3.axisLeft(y));

        // BRUSH
        const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("end", brushed);

    svg.append("g")
        .attr("class", "brush")
        .call(brush)

    function brushed(event) {
        const selection = event.selection;
        if (selection) {
            const [x0, x1] = selection.map(x.invert);
    
            svg.selectAll("circle")
                .style("opacity", 0.1)
                .filter(d => d && x0 <= d.StartYear && d.StartYear <= x1)
                .style("opacity", 1);
    
            svg.selectAll("line")
                .style("opacity", 0.1)
                .filter(d => d && x0 <= d.StartYear && d.StartYear <= x1)
                .style("opacity", 1);
        } else {
            svg.selectAll("circle").style("opacity", 1);
            svg.selectAll("line").style("opacity", 1);
        }
    }

    // Right-click event listener to clear brush
    svg.on("contextmenu", function(event) {
    event.preventDefault();
    d3.select(".brush").call(brush.move, null);
    svg.selectAll("circle").style("opacity", 1);
    svg.selectAll("line").style("opacity", 1);
    });


    // Create a tooltip
    const tooltip = d3.select("#vis-2")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("pointer-events", "none")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", "absolute");

    function drawVisualization(numPoints) {
        svg.selectAll("circle").remove();
        svg.selectAll("line").remove();

        let displayData = filteredData;
        if (numPoints !== "all") {
            displayData = filteredData.sort(() => 0.5 - Math.random()).slice(0, numPoints);
        }

        displayData.forEach(d => {
            svg.append("line")
            .attr("x1", x(d.StartYear))
            .attr("y1", y(d["Rating Score"]))
            .attr("x2", x(d.EndYear))
            .attr("y2", y(d["Rating Score"]))
            .attr("stroke", "red")
            .attr("stroke-width", 1);
        });

        svg.selectAll("circle")
            .data(displayData)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.StartYear))
            .attr("cy", d => y(d["Rating Score"]))
            .attr("r", 3)
            .style("fill", "#2727bf")
            .on("click", function(event, d) {
                console.log("reemplazar con un update a la otra vis")
            })
            .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(100)
                .style("opacity", 1);
            tooltip.html("Anime: " + d.Name + "<br/>Year: " + d.StartYear + "<br/>End Year: " + d.EndYear + "<br/>Rating: " + d["Rating Score"])
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
            });
    }


    drawVisualization("all");


    d3.select("#dataCount").on("change", function() {
        console.log("Dropdown changed");
        const selectedValue = d3.select(this).property("value");
        const numPoints = selectedValue === "all" ? "all" : parseInt(selectedValue, 10);
        drawVisualization(numPoints);
    });

    d3.select("#filterButton").on("click", function() {
        const yearInputString = d3.select("#yearInput").property("value");
        let yearRange;
    
        if (yearInputString.includes("-")) {
            yearRange = yearInputString.split("-").map(d => +d.trim());
        } else {
            const year = parseInt(yearInputString.trim(), 10);
            if (!isNaN(year)) {
                yearRange = [year, year];
            }
        }
    

        if (yearRange && yearRange.length === 2 && !isNaN(yearRange[0]) && !isNaN(yearRange[1])) {
            const filteredYearsData = filteredData.filter(d => 
                (d.StartYear >= yearRange[0] && d.StartYear <= yearRange[1]) ||
                (d.EndYear >= yearRange[0] && d.EndYear <= yearRange[1]));
    
            updateVisualization(filteredYearsData);
        } else {
            alert("Porfavor ingresa en alguno de estos formatos: 2020 o 2013-2021).");
        }
    });

    function updateVisualization(data) {
        svg.selectAll("circle").remove();
        svg.selectAll("line").remove();

        data.forEach(d => {
            svg.append("line")
            .attr("x1", x(d.StartYear))
            .attr("y1", y(d["Rating Score"]))
            .attr("x2", x(d.EndYear))
            .attr("y2", y(d["Rating Score"]))
            .attr("stroke", "red")
            .attr("stroke-width", 1);
        });

        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.StartYear))
            .attr("cy", d => y(d["Rating Score"]))
            .attr("r", 3)
            .style("fill", "#2727bf")
            .on("click", function(event, d) {
                console.log("reemplazar con un update a la otra vis")
            })
            .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(100)
                .style("opacity", 1);
            tooltip.html("Anime: " + d.Name + "<br/>Year: " + d.StartYear + "<br/>End Year: " + d.EndYear + "<br/>Rating: " + d["Rating Score"])
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
            });
    }
  
}).catch(function(error){
   console.log(error);
});


