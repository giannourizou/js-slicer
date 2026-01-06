const fs = require("fs");
const CDGNodeNames = require("../control-dependency-graph/constants/CDGNodeNames");

class CDGVisualizer {
    constructor(cdg, filename) {
        this.cdg = cdg;
        this.filename = filename;
    }

    exportToDot() {
        this.exportCDGToDot(this.cdg, this.filename);
    }

    exportCDGToDot(cdg, filename) {
        let dot = CDGVisualizer.writeCDGToDot(cdg);
        fs.writeFileSync(`./output/cdg-${filename}.dot`, dot);
    }
    
    static writeCDGToDot(cdg) {
        let digraph = `digraph CDG {
        rankdir=TB;
        ranksep=0.9;
        nodesep=0.5;

        rotate="0";
        orientation="portrait";
        landscape="true";

        node [fontsize=15,  
              style="filled",
              fillcolor="#9cc4b440",
              shape=box,
              margin="0.1,0.05"
              penwidth=1.2];
              \n`;

       for (let node of cdg._nodes) {
            let label;
            if (node._id === CDGNodeNames.ENTRY) {
                digraph += `\t"${node._id}" [label="ENTRY", shape=oval];\n`;
            } else if (node._statement) {
                label = node._statement.asText();
                //digraph += `\t"${node._id}" [label="${label}"];\n`;
                digraph += `\t"${node._id}" [label="${node._id}"];\n`; // Show just the node id
            } else {
                digraph += `\t"${node._id}" [label="EXIT", shape=oval];\n`;
            }
            
        }

        for (let node of cdg._nodes) {
            if (node._edges) {
                for (let edge of node._edges) {
                    digraph += `\t"${edge._source}" -> "${edge._target}" `;
                    digraph += `[style=solid, color="black", arrowsize=0.8];\n`;
                }
            }
        }

        digraph += "}";
        return digraph;
    }

}

module.exports = CDGVisualizer;
