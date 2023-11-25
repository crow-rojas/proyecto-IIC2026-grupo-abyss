// URLs para los CSVs a utilizar (subidos a Dropbox)
const ANIME_DATA_URL = 'anime.csv';
const RECOMMENDATIONS_DATA_URL = 'anime_recommendations.csv';

// Definimos las variables globales para almacenar los datos
let ANIME_DATA = null;
let RECOMMENDATIONS_DATA = null;

// Función para cargar los datos
async function fetchData() {
    ANIME_DATA = await d3.csv(ANIME_DATA_URL);
    RECOMMENDATIONS_DATA = await d3.csv(RECOMMENDATIONS_DATA_URL);
    create_recommendation_network();
}

// Añadimos el SVG
const SVG1 = d3.select("#vis-1").append("svg");

// Definimos las dimensiones del SVG
const WIDTH_VIS_1 = 1200;
const HEIGHT_VIS_1 = 600;
SVG1.attr("width", WIDTH_VIS_1).attr("height", HEIGHT_VIS_1);

// Límite de nodos a mostrar
const LIMIT = 100;

// Configuramos el botón para actualizar la visualización
d3.select("#refresh-button").on("click", function() {
    const selectedAnimeName = d3.select("#anime-input").property("value");
    create_recommendation_network(selectedAnimeName);
});

// Función que crea la leyenda
function createLegend(SVG1) {
    const legend = SVG1.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + (WIDTH_VIS_1 - 120) + ",20)");

    // Definimos los mismos colores que en la visualización
    const colors = [
        { color: "#800000", text: "0 Votos" }, // Granate
        { color: "#9A6324", text: "1 Voto" }, // Café
        { color: "#808000", text: "2 Votos" }, // Verde Oliva
        { color: "#469990", text: "3 Votos" }, // Verde azulado
        { color: "#000075", text: "4 Votos" }, // Azul marino
        { color: "#e6194B", text: "5 Votos" }, // Rojo
        { color: "#f58231", text: "6 Votos" }, // Naranjo
        { color: "#ffe119", text: "7 Votos" }, // Amarillo
        { color: "#bfef45", text: "8 Votos" }, // Verde
        { color: "#3cb44b", text: "9 Votos" }, // Verde claro
        { color: "#42d4f4", text: "10 Votos" }, // Celeste
        { color: "#4363d8", text: "10+ Votos" }, // Azul medio
    ];

    // Creamos la caja con borde y fondo blanco
    legend.append("rect")
        .attr("x", -10)
        .attr("y", -10)
        .attr("width", 120)
        .attr("height", colors.length * 20 + 20)
        .style("fill", "white")
        .style("stroke", "black");

    // Agregamos el título de la leyenda
    legend.append("text")
        .attr("x", 10)
        .attr("y", 10)
        .style("font-size", "1ypx") 
        .style("font-weight", "bold")
        .text("Leyenda");

    // Añadimos los colores y el texto
    legend.selectAll("rect")
        .data(colors)
        .enter().append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", d => d.color);

    legend.selectAll("text")
        .data(colors)
        .enter().append("text")
        .attr("x", 24)
        .attr("y", (d, i) => i * 20 + 9)
        .attr("dy", ".35em")
        .text(d => d.text);
}

// Función que obtiene un subconjunto aleatorio de animes conectados
function getRandomConnectedSubset(limit, selectedAnimeName = null) {
    let startAnime = null;
    let subset = new Set();

    // Separamos el caso cuando se selecciona un anime específico
    if (selectedAnimeName) {
        startAnime = ANIME_DATA.find(anime => anime['Name'].toLowerCase() === selectedAnimeName.toLowerCase());
        if (!startAnime) {
            alert("Anime no encontrado.");
            return [[], null];
        }
    } else {
        startAnime = ANIME_DATA[Math.floor(Math.random() * ANIME_DATA.length)];
    }

    // Obtenemos los animes conectados
    let startAnimeID = startAnime['Anime-PlanetID'];
    let connectedAnimes = RECOMMENDATIONS_DATA.filter(rec => 
        rec.Anime === startAnimeID || rec.Recommendation === startAnimeID
    );

    // Si hay animes conectados, los agregamos al subconjunto
    if (connectedAnimes.length > 0) {
        subset.add(startAnime);
        connectedAnimes.forEach(rec => {
            let connectedID = rec.Anime === startAnimeID ? rec.Recommendation : rec.Anime;
            let connectedAnime = ANIME_DATA.find(anime => anime['Anime-PlanetID'] === connectedID);
            if (connectedAnime && subset.size < limit) {
                subset.add(connectedAnime);
            }
        });
    }

    return [Array.from(subset), startAnimeID];
}

// Función para crear la visualización como tal
function create_recommendation_network(selectedAnimeName = null) {
    // Limpiamos el SVG
    SVG1.selectAll("*").remove();

    // Obtenemos un subconjunto aleatorio de animes conectados
    let [subset_animeData, startAnimeID] = getRandomConnectedSubset(LIMIT, selectedAnimeName);

    // Creamos el grupo para aplicar el zoom
    const zoomGroup = SVG1.append("g");

    // Definimos el comportamiento del zoom
    const zoom = d3.zoom()
        .scaleExtent([0.5, 10])  // Limit the scale range
        .on("zoom", (event) => {
            zoomGroup.attr("transform", event.transform);
        });

    SVG1.call(zoom);
    updateVisualization(zoomGroup, subset_animeData, startAnimeID);
    createLegend(SVG1);
}

// Función para actualizar la visualización
function updateVisualization(zoomGroup, subset_animeData, startAnimeID) {
    // Definimos constantes para el setup de la visualización
    const minNodeRadius = 30;
    const maxNodeRadius = 75;
    const centerX = WIDTH_VIS_1 / 2;
    const centerY = HEIGHT_VIS_1 / 2;
    const baseRadius = 200; 
    const radiusIncrement = 150;
    const maxNodesPerCircle = 6; 
    const angleIncrement = (2 * Math.PI) / maxNodesPerCircle;

    // Procesamos los nodos para posicionarlos en círculos concéntricos
    // Esto se logra dando un ángulo inicial aleatorio y luego incrementando el radio
    let nodes = [];
    let currentAngle = 0;
    let currentRadius = baseRadius;
    let nodesInCurrentCircle = 0;

    subset_animeData.forEach(d => {
        if (d['Anime-PlanetID'] === startAnimeID) {
            // Ponemos el anime inicial en el centro
            nodes.push({
                id: d['Anime-PlanetID'],
                name: d['Name'],
                rating: +d['Rating Score'],
                x: centerX,
                y: centerY
            });
        } else {
            // Ponemos los demás animes en círculos concéntricos
            let node = {
                id: d['Anime-PlanetID'],
                name: d['Name'],
                rating: +d['Rating Score'],
                x: centerX + currentRadius * Math.cos(currentAngle),
                y: centerY + currentRadius * Math.sin(currentAngle)
            };
            nodes.push(node);

            currentAngle += angleIncrement;
            nodesInCurrentCircle++;
            if (nodesInCurrentCircle >= maxNodesPerCircle) {
                currentRadius += radiusIncrement;
                nodesInCurrentCircle = 0;
                // Generamos un ángulo aleatorio para el inicio de un nuevo círculo
                currentAngle = Math.random() * 2 * Math.PI;
            }
        }
    });

    // Definimos la escala para el tamaño de los nodos basado en el rating
    const nodeSizeScale = d3.scaleLinear()
        .domain(d3.extent(subset_animeData, d => +d['Rating Score']))
        .range([minNodeRadius, maxNodeRadius]);

    // Definimos una función para no exceder los nodos con texto
    function maxCharsForNode(radius) {
        return Math.max(3, Math.floor(radius / 3.5));
    }

    // Creamos un mapa para obtener la posición de los nodos
    let nodePositionMap = new Map(nodes.map(d => [d.id, { x: d.x, y: d.y }]));

    // Definimos los links entre nodos
    const links = RECOMMENDATIONS_DATA.filter(link => 
        link['Anime'].toString() === startAnimeID.toString() || link['Recommendation'].toString() === startAnimeID.toString()
        );

    // Definimos la escala para el color de los links basado en los votos
    const linkColorScale = d3.scaleThreshold()
        .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        .range([
            "#800000",
            "#9A6324",
            "#808000",
            "#469990",
            "#000075",
            "#e6194B",
            "#f58231",
            "#ffe119",
            "#bfef45",
            "#3cb44b",
            "#42d4f4",
            "#4363d8"
        ]);

    // Creamos los links
    const link = zoomGroup.append("g")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("x1", d => nodePositionMap.get(d['Anime'].toString()).x)
        .attr("y1", d => nodePositionMap.get(d['Anime'].toString()).y)
        .attr("x2", d => nodePositionMap.get(d['Recommendation'].toString()).x)
        .attr("y2", d => nodePositionMap.get(d['Recommendation'].toString()).y)
        .attr("stroke", d => linkColorScale(d['Agree Votes']))
        .attr("stroke-width", 4);

    // Seleccionamos el tooltip para mostrar el nombre del anime
    let tooltip = d3.select("#tooltip");

    // Creamos los nodos y los tooltips
    const node = zoomGroup.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", d => isNaN(d.rating) ? minNodeRadius : nodeSizeScale(d.rating))
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("fill", d => d.id.toString() === startAnimeID.toString() ? "#DC143C" : "black")
        .on("mouseover", function(event, d) {
            tooltip.style("display", "block")
                   .html(d.name)
                   .style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
        });

    // Creamos los labels para los nodos
    const labels = zoomGroup.append("g")
        .selectAll("text")
        .data(nodes)
        .enter().append("text")
        .text(d => {
            const maxChars = maxCharsForNode(isNaN(d.rating) ? minNodeRadius : nodeSizeScale(d.rating));
            return d.name.length > maxChars ? d.name.substring(0, maxChars) + "..." : d.name;
        })
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .style("text-anchor", "middle")
        .style("font-size", d => {
            const radius = isNaN(d.rating) ? minNodeRadius : nodeSizeScale(d.rating);
            return `${radius/6.5}px`; // Set font size based on radius
        })
        .style("fill", d => d.id.toString() === startAnimeID.toString() ? "#FFFFF0" : "#FFFFFF")
        .style("font-weight", "bold");
}

fetchData();
