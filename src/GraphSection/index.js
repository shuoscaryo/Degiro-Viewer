import {newElement} from "/src/utils.js"
import Component from "/src/Component.js"

export default class GraphSection extends Component
{
    constructor()
    {
        super(newElement("section", {id: "graphSection"}));
        this.chart = newElement("div", {parent:this.element, id: "chart"});
        this.data = [
            {
                x: [1, 2, 3],
                y: [4, 5, 6],
                type: 'scatter'
            }
        ];
        this.layout = {
            title: 'Ventas mensuales',
            xaxis: {title: 'Mes'},
            yaxis: {title: 'Ventas'}
        };
        this.config = {
            responsive: true,
            displayModeBar: false
        };
        const traceA = {
            x: [1, 2, 3],
            y: [10, 20, 15],
            stackgroup: 'one',
            name: 'A'
        };

        const traceB = {
            x: [1, 2, 3],
            y: [5, 8, 12],
            stackgroup: 'one',
            name: 'B'
        };

        Plotly.newPlot(this.chart, [traceA, traceB], this.layout, this.config);
    }
}
