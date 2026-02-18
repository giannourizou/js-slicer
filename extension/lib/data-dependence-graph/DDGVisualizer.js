const fs = require("fs");
const CDGNodeNames = require("../control-dependency-graph/constants/CDGNodeNames");

class DDGVisualizer {
    constructor(ddg, filename) {
        this.ddg = ddg;
        this.filename = filename;
    }

    exportToDot() {
        this.exportDDGToDot(this.ddg, this.filename);
    }

    exportDDGToDot(ddg, filename) {
        let dot = DDGVisualizer.writeDDGToDot(ddg);
        fs.writeFileSync(`./output/ddg-${filename}.dot`, dot);
    }
    
    static writeDDGToDot(ddg) {
        let digraph = `digraph DDG {
        rankdir=LR;
        ranksep=0.9;
        nodesep=0.5;

        rotate="0";
        orientation="portrait";
        landscape="true";

        node [fontsize=15,  
              style="filled",
              fillcolor="#bc867e40",
              shape=box,
              margin="0.1,0.05"
              penwidth=1.2];
              \n`;

       for (let node of ddg._nodes) {
            let label;
            if (node._statement) {
                digraph += `\t"${node._id}" [label="${node._id}: ${node._statement.asText()}"];\n`;
            } else {
                continue; // exit node
            }
        }

        for (let node of ddg._nodes) {
            if (node._edges) {
                for (let edge of node._edges) {
                    let label = (edge._dependantVariable || "" )  + " (" + edge._type.join(', ') + ")";
                    digraph += `\t"${edge._source}" -> "${edge._target}" `;

                    let color;
                    let types = edge._type;
                    if (types.length > 1){
                        color = 'black';
                    }else{
                        color = types[0] === 'def-use' ? 'darkblue' :
                                types[0] === 'use-def' ? 'darkred'  :
                                types[0] === 'def-def' ? 'darkgreen' : '';
                    }

                    digraph += `[style=dashed, color=${color}, fontcolor= ${color} , penwidth = "1.3", label=" ${label} ", arrowsize=0.8];\n`;
                    
                }
            }
        }

        digraph += "}";
        return digraph;
    }

}

module.exports = DDGVisualizer;
