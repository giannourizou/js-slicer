const CFGGenerator = require("../../control-flow-graph/CFGGenerator");
const CDGGenerator = require("../../control-dependency-graph/CDGGenerator");
const DDGGenerator = require("../../data-dependence-graph/DDGGenerator");
const PDGGenerator = require("../../program-dependence-graph/PDGGenerator");
const CDGNodeNames = require("../../control-dependency-graph/constants/CDGNodeNames");
const Parser = require("../../code-parser-module/Parser");

function parse(str) {
    return Parser.parse(str.split("\n"));
}

function expectHasEdge(pdg, source, target) {
    expect(pdg.hasEdge(source, target)).toBe(true);
}

it("throws error when CFG & DDG are missing", () => {
    expect(() => {
        PDGGenerator.generatePDG(null,null);
    }).toThrow("Missing required param.");
});


it("PDG of sequential statements", () => {
    let code = `
    function foo(){
        let i = 0               // 1
        let ar = [1, i++, 3]    // 2
        let a = 1               // 3
        let b = 2               // 4
        console.log(a)          // 5
        return a + b            // 6
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);

    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expect(pdg._nodes.length).toBe(8);

    // CDG edges
    expectHasEdge(pdg, entryNode._id, 1);
    expectHasEdge(pdg, entryNode._id, 2);
    expectHasEdge(pdg, entryNode._id, 3);
    expectHasEdge(pdg, entryNode._id, 4);
    expectHasEdge(pdg, entryNode._id, 5);
    expectHasEdge(pdg, entryNode._id, 6);
    expectHasEdge(pdg, entryNode._id, 7);

    // DDG edges
    expectHasEdge(1,2);
    expectHasEdge(pdg,4,6); 
    expectHasEdge(pdg,3,5);
    expectHasEdge(pdg,3,6);  
});

