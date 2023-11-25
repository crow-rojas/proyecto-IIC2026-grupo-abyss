const marginVis3 = {top: 10, right: 60, bottom: 30, left: 60},
    widthVis3 = 800 - marginVis3.left - marginVis3.right,
    heightVis3 = 800 - marginVis3.top - marginVis3.bottom;

const svgVis3 = d3.select("#vis-3")
    .append("svg")
    .attr("width", widthVis3)
    .attr("height", heightVis3 + marginVis3.top + marginVis3.bottom)
    .append("g")
    .attr("transform", "translate(" + marginVis3.left + "," + marginVis3.top + ")");

const tooltipVis3 = d3.select("#vis-3")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("position", "absolute");

function updateVisualizationXD(voteThreshold, ratingThreshold) {
    d3.csv("anime.csv").then(function(data) {
        let filteredData = data.filter(d => {
            return +d["Number Votes"] >= voteThreshold && +d["Rating Score"] <= ratingThreshold;
        });

        svgVis3.selectAll("*").remove();

        let root = d3.hierarchy({children: filteredData}).sum(d => +d["Number Votes"]);
        d3.treemap().size([widthVis3, heightVis3]).padding(2)(root);

        const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, ratingThreshold]);
        const blocks = svgVis3.selectAll("rect")
            .data(root.leaves())
            .enter().append("rect")
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .style("stroke", "black")
            .style("fill", d => colorScale(d.data["Rating Score"]))
            .on("mouseover", function(event, d) {
                tooltipVis3.style("opacity", 1);
                tooltipVis3.html("Anime: " + d.data["Name"] + "<br/>" + "Votes: " + d.data["Number Votes"] + "<br/>" + "Rating: " + d.data["Rating Score"])
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                tooltipVis3.style("opacity", 0);
            });

        blocks.exit().remove();

    }).catch(function(error){
        console.log(error);
    });
}

updateVisualizationXD(5000, 2.5);

d3.select("#updateButton").on("click", function() {
    const newVoteThreshold = +d3.select("#voteInput").property("value");
    const newRatingThreshold = +d3.select("#ratingInput").property("value");

    if (!isNaN(newVoteThreshold) && !isNaN(newRatingThreshold)) {
        updateVisualization(newVoteThreshold, newRatingThreshold);
    } else {
        alert("Ingresa parámetros válidos. Rating decimal usa punto");
    }
});