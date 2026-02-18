const fs = require("fs");

class FDTVisualizer {
    constructor(fdt, filename) {
        this.fdt = fdt;
        this.filename = filename;
    }

    exportToDot() {
        this.exportFDTToDot(this.fdt, this.filename);
    }

    exportFDTToDot(fdt, filename) {
        let dot = FDTVisualizer.writeFDTToDot(fdt);
        fs.writeFileSync(`./output/fdt-${filename}.dot`, dot);
    }
    
    static writeFDTToDot(fdt) {
        let digraph = `digraph FDT {
        rankdir=TB;
        ranksep=0.9;
        nodesep=0.5;
        rotate="0";
        orientation="portrait";
        landscape="true";

        node [fontsize=15,  
              style="filled",
              fillcolor="#8a929e40",
              shape=box,
              margin="0.1,0.05"
              penwidth=1.2];
              \n`;

       for (let node of fdt._nodes) {
            if (node._statement) {
                digraph += `\t"${node._id}" [label="${node._id}: ${node._statement.asText()}"];\n`;
            } else {
                digraph += `\t"${node._id}" [label="EXIT", shape=oval];\n`;
            }
            
        }

        for (let node of fdt._nodes) {
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

module.exports = FDTVisualizer;
