import {newElement} from "/src/utils.js"
import Component from "/src/Component.js"
import {g} from "/src/globals.js"

export default class GraphSection extends Component
{
    constructor()
    {
        super(newElement("section", {id: "graphSection"}));
        this.chart = newElement("div", {parent:this.element, id: "chart"});
    }

    loadGraph = (e) => {
        this.layout = {
            title: 'Ventas mensuales',
            xaxis: {title: 'Mes', type: "date"},
            yaxis: {title: 'Ventas'}
        };
        this.config = {
            responsive: true,
            displayModeBar: false
        };
        const traces = Object.entries(g.timeSeries).map(([isin, data]) => ({
        x: data.x,
        y: data.y,
        mode: 'lines+markers',
        type: 'scatter',
        name: isin,
        line: {
            shape: 'hv'
        }
        }));
        Plotly.newPlot(this.chart, traces, this.layout, this.config);
    }

    onMount()
    {
        document.addEventListener("csvUpdate", this.loadGraph);
    }

    onDestroy()
    {
        document.removeEventListener("csvUpdate", this.loadGraph);
    }
}
