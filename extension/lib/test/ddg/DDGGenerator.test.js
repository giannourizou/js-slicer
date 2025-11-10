const CFGGenerator = require("../../control-flow-graph/CFGGenerator");
const DDGGenerator = require("../../data-dependence-graph/DDGGenerator");
const Parser = require("../../code-parser-module/Parser");

/* Debug
    console.log("Printed DDG");
    ddg._nodes.forEach((node) => {
        const cfgNode = cfg._nodes.find(n => n._id === node.id);
        const stmt = cfgNode?._statement;
        console.log( `Node ${node.id} → children: [${node._edges.map(e => e.target).join(", ")}]Statement: ${typeof stmt === "string" ? stmt : JSON.stringify(stmt)}`);
    });
*/

/* Debug
    console.log("Printed CFG");
    cfg._nodes.forEach((node) => {
        const stmt = node?._statement;
        console.log( `Node ${node._id} → children: [${node._edges.map(e => e.target).join(", ")}] | Statement: ${typeof stmt === "string" ? stmt : JSON.stringify(stmt)}`);
    }); 
*/

function parse(str) {
    return Parser.parse(str.split("\n"));
}

function expectHasEdge(ddg, source, target) {
    expect(ddg.hasEdge(source, target)).toBe(true);
}

it("throws error when CFG is missing", () => {
    expect(() => {
        DDGGenerator.generateDDG(null);
    }).toThrow("Missing required param.");
});

/*
it("DDG1", () => {
    let code = `
    function foo(){
        let a = 1               // 1
        let b = a + 2           // 2
        let c = b + a           // 3
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let ddg = DDGGenerator.generateDDG(cfg);

    expect(ddg._nodes.length).toBe(4);
    
    console.log("Printed DDG");
    ddg._nodes.forEach((node) => {
        const cfgNode = cfg._nodes.find(n => n._id === node.id);
        const stmt = cfgNode?._statement;
        console.log( `Node ${node.id} → children: [${node._edges.map(e => e.target).join(", ")}]Statement: ${typeof stmt === "string" ? stmt : JSON.stringify(stmt)}`);
    });

    //expectHasEdge(ddg,1,2);
    //expectHasEdge(ddg,2,3);
});

*/