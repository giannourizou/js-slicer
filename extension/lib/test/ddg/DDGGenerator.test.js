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


it("DDG1 - Simple Def-Use", () => {
    let code = `
    function foo(){
        let a = 1   // 1
        let b = a   // 2
        let c = b   // 3
        let d = b   // 4
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let ddg = DDGGenerator.generateDDG(cfg);

    expect(ddg._nodes.length).toBe(5);
    
    expectHasEdge(ddg,1,2); // def-use
    expectHasEdge(ddg,2,3); // def-use
    expectHasEdge(ddg,2,4); // def-use
});


it("DDG2 - Def-Use & Def-Def Intervening Definition", () =>{
    let code = `
    function foo(){
        let a = 1   // 1
        let b = 2   // 2
        b = 10      // 3
        let c = b   // 4
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let ddg = DDGGenerator.generateDDG(cfg);

    expect(ddg._nodes.length).toBe(5);

    expectHasEdge(ddg, 2, 3);   // def-def
    expectHasEdge(ddg, 3, 4);   // def-use 
    expect(ddg.hasEdge(2, 4)).toBe(false);  // no def-use due to intervening definition
});


it("DDG3 - Use-Def & Intervening Definition", () => {
    let code = `
    function foo(){
        let a = 1   // 1
        let b = a   // 2
        a = c + 1   // 3
        let d = a   // 4
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let ddg = DDGGenerator.generateDDG(cfg);

    expect(ddg._nodes.length).toBe(5);

    expectHasEdge(ddg,1,2); // def-use
    expectHasEdge(ddg,1,3); // def-def
    expectHasEdge(ddg,2,3); // use-def
    expectHasEdge(ddg,3,4); // def-use
    expect(ddg.hasEdge(1,4)).toBe(false); // no use-def due to intervening definition
});


it("DDG 4 - Assignment Statement with 2+ variables", () => {
    let code = `
    function foo(){
        let a = 1               // 1
        let b = a               // 2
        let c = b + a + 6       // 3
        b = a + b - c + 6       // 4
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let ddg = DDGGenerator.generateDDG(cfg);

    expect(ddg._nodes.length).toBe(5);

    expectHasEdge(ddg,1,2); // def-use
    expectHasEdge(ddg,1,3); // def-use
    expectHasEdge(ddg,1,4); // def-use  
    expectHasEdge(ddg,2,3); // def-use
    expectHasEdge(ddg,2,4); // def-use & def-def
    expectHasEdge(ddg,3,4); // def-use

});