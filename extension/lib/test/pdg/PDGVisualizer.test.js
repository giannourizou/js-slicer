const Parser = require("../../code-parser-module/Parser.js");
const PDGVisualizer = require("../../program-dependence-graph/PDGVisualizer.js");
const CFGGenerator = require("../../control-flow-graph/CFGGenerator");
const CDGGenerator = require("../../control-dependency-graph/CDGGenerator");
const DDGGenerator = require("../../data-dependence-graph/DDGGenerator");
const PDGGenerator = require("../../program-dependence-graph/PDGGenerator");

function expectHasEdge(pdg, source, target) {
    expect(pdg.hasEdge(source, target)).toBe(true);
}

function showPDG(pdg, filename) {
    let visualizer = new PDGVisualizer(pdg, filename);
    visualizer.exportToDot();
}

function parse(str) {
    return Parser.parse(str.split("\n"));
}

it("PDG Test 0", () => {
    let code = `
    function foo(){
        let i = 0               // 1
        let ar = [1, i++, 3]    // 2
        let a = 1               // 3
        if (a===1) {            // 4
            console.log(i)      // 5
        }
        let b = 2               // 6
        console.log(a)          // 7
        return a + b            // 8
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);

    showPDG(pdg, "PDG Test 0");

});