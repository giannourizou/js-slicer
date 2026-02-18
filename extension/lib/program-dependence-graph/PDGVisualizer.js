const fs = require("fs");
const CDGNodeNames = require("../control-dependency-graph/constants/CDGNodeNames");

class PDGVisualizer {
    constructor(pdg, filename) {
        this.pdg = pdg;
        this.filename = filename;
    }

    exportToDot() {
        this.exportPDGToDot(this.pdg, this.filename);
    }

    exportPDGToDot(pdg, filename) {
        let dot = PDGVisualizer.writePDGToDot(pdg);
        fs.writeFileSync(`./output/pdg-${filename}.dot`, dot);
    }
    
    static writePDGToDot(pdg) {
        let digraph = `digraph PDG {
        rankdir=TB;
        ranksep=0.9;
        nodesep=0.5;

        rotate="0";
        orientation="portrait";
        landscape="true";

        node [fontsize=15,  
              style="filled",
              fillcolor="#a7c0e040",
              shape=box,
              margin="0.1,0.05"
              penwidth=1.2];
              \n`;

       for (let node of pdg._nodes) {
            let label;
            if (node._id === CDGNodeNames.ENTRY) {
                digraph += `\t"${node._id}" [label="ENTRY", shape=oval];\n`;
            } else if (node._statement) {
                label = node._statement.asText();
                digraph += `\t"${node._id}" [label="${node._id}: ${label}"];\n`;
            } else {
                digraph += `\t"${node._id}" [label="EXIT", shape=oval];\n`;
            }
            
        }

        for (let node of pdg._nodes) {
            if (node._controlEdges) {
                for (let edge of node._controlEdges) {
                    digraph += `\t"${edge._source}" -> "${edge._target}" `;
                    digraph += `[color="black", style=solid,arrowsize=0.8];\n`;
                }
            }
            
            if (node._dataEdges) {
                for (let edge of node._dataEdges) {
                    let label = (edge._dependantVariable || "" )  + " (" + edge._type.join(', ') + ")";
                    digraph += `\t"${edge._source}" -> "${edge._target}" `;
                    digraph += `[color=darkblue, style=dashed, fontcolor=darkblue, penwidth =1.3, label=" ${label} ", arrowsize=0.8];\n`;
                }
            }
        }

        digraph += "}";
        return digraph;
    }

}

module.exports = PDGVisualizer;
