const Parser = require("../../code-parser-module/Parser.js");
const PDGVisualizer = require("../../program-dependence-graph/PDGVisualizer.js");
const CFGGenerator = require("../../control-flow-graph/CFGGenerator");
const CDGGenerator = require("../../control-dependency-graph/CDGGenerator");
const DDGGenerator = require("../../data-dependence-graph/DDGGenerator");
const PDGGenerator = require("../../program-dependence-graph/PDGGenerator");
const CDGNodeNames = require("../../control-dependency-graph/constants/CDGNodeNames");

function expectHasControlEdge(pdg, source, target) {
    expect(pdg.hasControlEdge(source, target)).toBe(true);
}

function expectHasDataEdge(pdg, source, target) {
    expect(pdg.hasDataEdge(source, target)).toBe(true);
}

function showPDG(pdg, filename) {
    let visualizer = new PDGVisualizer(pdg, filename);
    visualizer.exportToDot();
}

function parse(str) {
    return Parser.parse(str.split("\n"));
}

// Empty Body Function
it("PDG0", () => {
    let code = `
    function foo(){
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expectHasControlEdge(pdg, entryNode._id, 1);

    showPDG(pdg, "PDGTest0");
});


// Single Statement Function
it("PDG1", () => {
    let code = `
    function foo(){
        let x = 5;
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);

    showPDG(pdg, "PDGTest1");
});


// Independent Statement Function
it("PDG2", () => {
    let code = `
    function foo(){
        let x = 5;
        let y = 2;
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 3);

    showPDG(pdg, "PDGTest2");
});


// Def-use path
it("PDG3", () => {
    let code = `
    function foo(){
        let x = 5;
        console.log(x);
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 3);

    expectHasDataEdge(pdg, 1, 2);

    showPDG(pdg, "PDGTest3");
});


// Def-def path
it("PDG4", () => {
    let code = `
    function foo(){
        let x = 5;
        x = 9;
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 3);

    // No def-use edges

    showPDG(pdg, "PDGTest4");
});


// Use-def path
it("PDG5", () => {
    let code = `
    function foo(x){
        console.log(x);
        x = 3;
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 3);

    // No def-use edges

    showPDG(pdg, "PDGTest5");
});


// Multiple uses of the same variable
it("PDG6", () => {
    let code = `
    function foo(){
        let a = 1;      // 1
        console.log(a); // 2
        let b = a + 1;  // 3
        let c = a * 3;  // 4
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 3);
    expectHasControlEdge(pdg, entryNode._id, 4);
    expectHasControlEdge(pdg, entryNode._id, 5);

    expectHasDataEdge(pdg, 1, 2);
    expectHasDataEdge(pdg, 1, 3);
    expectHasDataEdge(pdg, 1, 4);

    showPDG(pdg, "PDGTest6");
});


// Multiple reassignments of the same variable
it("PDG7", () => {
    let code = `
    function foo(){
        let a = 1;      // 1
        a = 5           // 2
        a = 7           // 3
        a = 10;         // 4
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 3);
    expectHasControlEdge(pdg, entryNode._id, 4);
    expectHasControlEdge(pdg, entryNode._id, 5);

    // No def-use edges

    showPDG(pdg, "PDGTest7");
});

// Multiple variables in one statement
it("PDG8", () => {
    let code = `
    function foo(){
        let a = 1;           // 1
        let b = 2;           // 2
        let c = 3;           // 3
        let d = a + b * c;   // 4
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 3);
    expectHasControlEdge(pdg, entryNode._id, 4);
    expectHasControlEdge(pdg, entryNode._id, 5);

    expectHasDataEdge(pdg, 1, 4);
    expectHasDataEdge(pdg, 2, 4);
    expectHasDataEdge(pdg, 3, 4);

    showPDG(pdg, "PDGTest8");
});


// If statement
it("PDG9", () => {
    let code = `
    function foo(){
        let a = 1;           // 1
        if (a>5){            // 2
            console.log(a)   // 3
        }
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, 2, 3);
    expectHasControlEdge(pdg, entryNode._id, 4);

    expectHasDataEdge(pdg, 1, 2);
    expectHasDataEdge(pdg, 1, 3);

    showPDG(pdg, "PDGTest9");
});


// If - else if - else statement
it("PDG10", () => {
    let code = `
    function foo(){
        let a = 1;           // 1
        if (a>5){            // 2
            console.log(a)   // 3
        }else if (a === 2){  // 4
            console.log(a*2) // 5
        }else {
            console.log(a-5) // 6
        }
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, 2, 3);
    expectHasControlEdge(pdg, 2, 4);
    expectHasControlEdge(pdg, 4, 5);
    expectHasControlEdge(pdg, 4, 6);

    expectHasDataEdge(pdg, 1, 2);
    expectHasDataEdge(pdg, 1, 3);
    expectHasDataEdge(pdg, 1, 4);
    expectHasDataEdge(pdg, 1, 5);
    expectHasDataEdge(pdg, 1, 6);

    showPDG(pdg, "PDGTest10");
});


// While Loop
it("PDG11", () => {
    let code = `
    function foo(){
        let num = 10;             // 1   
        while (num > 6) {         // 2
            console.log(num * 5); // 3
        }
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 4);
    expectHasControlEdge(pdg, 2, 3);

    expectHasDataEdge(pdg, 1, 2);
    expectHasDataEdge(pdg, 1, 3);

    showPDG(pdg, "PDGTest11");
});


// For Loop
it("PDG12", () => {
    let code = `
    function foo(){
        let a = "hello";    // 1   
        for(let i=0; i<3; i++){  // 2,3,5
            console.log(a); // 4
        }
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 6);

    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 3);
    expectHasControlEdge(pdg, 3, 4);
    expectHasControlEdge(pdg, 3, 5);

    expectHasDataEdge(pdg, 1, 4);
    expectHasDataEdge(pdg, 2, 3);
    expectHasDataEdge(pdg, 2, 5);
    expectHasDataEdge(pdg, 5, 3);
    expectHasDataEdge(pdg, 5, 5);

    showPDG(pdg, "PDGTest12");
});


// Switch Case 
it("PDG13", () => {
    let code = `
    function foo(){
        let result = 3;          // 1
        switch(result){          // 2
            case 1: 
                    result = 5;  // 3
                    break;       // 4
            case 2: 
                    result = 10; // 5
                    break;       // 6
            case 3: 
                    result = 20; // 7
                    break;       // 8
            default: 
                    result = 0;  // 9
        }
        console.log(result);     // 10
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    
    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 10);
    expectHasControlEdge(pdg, entryNode._id, 11);

    expectHasControlEdge(pdg, 2, 3);
    expectHasControlEdge(pdg, 2, 4);
    expectHasControlEdge(pdg, 2, 5);
    expectHasControlEdge(pdg, 2, 6);
    expectHasControlEdge(pdg, 2, 7);
    expectHasControlEdge(pdg, 2, 8);
    expectHasControlEdge(pdg, 2, 9);

    expectHasDataEdge(pdg, 1, 2);
    expectHasDataEdge(pdg, 3, 10);
    expectHasDataEdge(pdg, 5, 10);
    expectHasDataEdge(pdg, 7, 10);
    expectHasDataEdge(pdg, 9, 10);    

    showPDG(pdg, "PDGTest13");
});


// Nested ifs
it("PDG14", () => {
    let code = `
    function foo(a,b){
        if (a>5) {        // 1
            a++;          // 2
            if (b>10){    // 3
                b++       // 4
            }else{        
                a++;      // 5
            }
        }else if (b>5) {  // 6
            b = 10;       // 7 
        }
        console.log(a+b); // 8
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 8);
    expectHasControlEdge(pdg, entryNode._id, 9);
    expectHasControlEdge(pdg, 1, 2);
    expectHasControlEdge(pdg, 1, 3);
    expectHasControlEdge(pdg, 1, 6);
    expectHasControlEdge(pdg, 3, 4);
    expectHasControlEdge(pdg, 3, 5);
    expectHasControlEdge(pdg, 6, 7);

    expectHasDataEdge(pdg, 2, 5);
    expectHasDataEdge(pdg, 2, 8);
    expectHasDataEdge(pdg, 4, 8);
    expectHasDataEdge(pdg, 5, 8);
    expectHasDataEdge(pdg, 7, 8);

    showPDG(pdg, "PDGTest14");
});


// Nested loops
it("PDG15", () => {
    let code = `
    function foo(){
        let x = 4;                  // 1
        while (x > 2) {             // 2
            for(let j=0; j<9; j++) { // 3,4,6
                console.log(x,j);    // 5
            }
            x--;                    // 7
        }
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);
    
    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 8);
    expectHasControlEdge(pdg, 2, 3);
    expectHasControlEdge(pdg, 2, 4);
    expectHasControlEdge(pdg, 2, 7);
    expectHasControlEdge(pdg, 4, 5);
    expectHasControlEdge(pdg, 4, 6);

    expectHasDataEdge(pdg, 1, 2);
    expectHasDataEdge(pdg, 1, 5);
    expectHasDataEdge(pdg, 1, 7);
    expectHasDataEdge(pdg, 3, 4);
    expectHasDataEdge(pdg, 3, 5);
    expectHasDataEdge(pdg, 3, 6);
    expectHasDataEdge(pdg, 6, 4);
    expectHasDataEdge(pdg, 6, 5);
    expectHasDataEdge(pdg, 6, 6);
    expectHasDataEdge(pdg, 7, 2);
    expectHasDataEdge(pdg, 7, 5);
    expectHasDataEdge(pdg, 7, 7);

    showPDG(pdg, "PDGTest15");
});


// Accumulator in loop
it("PDG16", () => {
    let code = `
    function foo() {
        let sum = 0;  // 1
        for (let i=0; i<10; i++){ // 2,3,5
            sum += i; // 4
        }
        console.log(sum); // 6
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);
    

    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 3);
    expectHasControlEdge(pdg, entryNode._id, 6);
    expectHasControlEdge(pdg, entryNode._id, 7);
    expectHasControlEdge(pdg, 3, 4);
    expectHasControlEdge(pdg, 3, 5);
    
    expectHasDataEdge(pdg, 1, 4);
    expectHasDataEdge(pdg, 1, 6);
    expectHasDataEdge(pdg, 2, 3);
    expectHasDataEdge(pdg, 2, 4);
    expectHasDataEdge(pdg, 2, 5);
    expectHasDataEdge(pdg, 4, 4);
    expectHasDataEdge(pdg, 4, 6);
    expectHasDataEdge(pdg, 5, 4);
    expectHasDataEdge(pdg, 5, 3);
    expectHasDataEdge(pdg, 5, 5);

    showPDG(pdg, "PDGTest16");
});


// Return Statement
it("PDG17", () => {
    let code = `
    function foo() {
        let x = 5;       // 1
        if (x > 3) {     // 2
            return x;    // 3
        }
        let y = 10;      // 4
        return y;        // 5
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);
    
    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 6);
    expectHasControlEdge(pdg, 2, 3);
    expectHasControlEdge(pdg, 2, 4);
    expectHasControlEdge(pdg, 2, 5);

    expectHasDataEdge(pdg, 1, 2);
    expectHasDataEdge(pdg, 1, 3);
    expectHasDataEdge(pdg, 4, 5);

    showPDG(pdg, "PDGTest17");
});


// Continue statement
it("PDG18", () => {
    let code = `
    function foo() {
        for (let i = 0; i < 5; i++) {  // 1,2,6
            if (i % 2 === 1) {     // 3
                continue;          // 4
            }
            console.log(i)  // 5
        }
        return i; // 7
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY); 
    
    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 7);
    expectHasControlEdge(pdg, entryNode._id, 8);
    expectHasControlEdge(pdg, 2, 3);
    expectHasControlEdge(pdg, 2, 6);
    expectHasControlEdge(pdg, 3, 4);
    expectHasControlEdge(pdg, 3, 5);
    
    expectHasDataEdge(pdg, 1, 2);
    expectHasDataEdge(pdg, 1, 3);
    expectHasDataEdge(pdg, 1, 5);
    expectHasDataEdge(pdg, 1, 6);
    expectHasDataEdge(pdg, 1, 7);
    expectHasDataEdge(pdg, 6, 2);
    expectHasDataEdge(pdg, 6, 3);
    expectHasDataEdge(pdg, 6, 5);
    expectHasDataEdge(pdg, 6, 6);
    expectHasDataEdge(pdg, 6, 7);
    
    showPDG(pdg, "PDGTest18");
});


// Switch case - Fallthrough
it("PDG19", () => {
    let code = `
    function foo() {
        let x = 2;            // 1
        let result = 0;       // 2
        switch (x) {          // 3
            case 1:
                result = 10;  // 4
                break;        // 5
            case 2:
                result -= 4;  // 6
            case 3:
                result += 10; // 7
                break;        // 8
            default:
                result = 0;   // 9
        }
        return result;        // 10
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);
    
    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 3);
    expectHasControlEdge(pdg, entryNode._id, 10);
    expectHasControlEdge(pdg, entryNode._id, 11);

    expectHasControlEdge(pdg, 3, 4);
    expectHasControlEdge(pdg, 3, 5);
    expectHasControlEdge(pdg, 3, 6);
    expectHasControlEdge(pdg, 3, 7);
    expectHasControlEdge(pdg, 3, 8);
    expectHasControlEdge(pdg, 3, 9);   
    
    expectHasDataEdge(pdg, 1, 3);
    expectHasDataEdge(pdg, 2, 6);
    expectHasDataEdge(pdg, 2, 7);
    expectHasDataEdge(pdg, 6, 7); // fallthrough
    expectHasDataEdge(pdg, 4, 10);
    expectHasDataEdge(pdg, 7, 10);
    expectHasDataEdge(pdg, 9, 10);
    
    showPDG(pdg, "PDGTest19");
});


// Dead Code
it("PDG20", () => {
    let code = `
    function foo() {
        let x = 5;       // 1
        if (x<3){        // 2
            let y = 10;  // 3 
            return y;    // 4 
            x = 50;      // 5
        }
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 5); // node 5 === EXIT node
    expectHasControlEdge(pdg, 2, 3);
    expectHasControlEdge(pdg, 2, 4);

    expectHasDataEdge(pdg, 1, 2);
    expectHasDataEdge(pdg, 3, 4);

    showPDG(pdg, "PDGTest20");
});

// Object Properties
it("PDG21", () =>{
    let code = `
    function foo() {
        let x = 'hello';         // 1
        let y = 'world';         // 2
        let obj = {a:x, b:y};    // 3
        let sum = obj.a + obj.b; // 4
        obj.a = "bye";           // 5
        console.log(obj.a);      // 6
    }`

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 3);
    expectHasControlEdge(pdg, entryNode._id, 4);
    expectHasControlEdge(pdg, entryNode._id, 5);
    expectHasControlEdge(pdg, entryNode._id, 6);

    expectHasDataEdge(pdg, 1, 3); 
    expectHasDataEdge(pdg, 2, 3); 
    expectHasDataEdge(pdg, 3, 4);
    expectHasDataEdge(pdg, 5, 6); 

    showPDG(pdg, "PDGTest21");
});


// Shadowing - Sibling Nests
it("PDG22", () =>{
    let code = `
    function foo() {
        let x = 5;      // 1
        if (x===3){     // 2
            let x = 10; // 3
            let y = x;  // 4
        }
        if (x === 4){   // 5
            let x = 5;  // 6
            let y = 6;  // 7
        }
        let z = x;      // 8
    }`

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 5);
    expectHasControlEdge(pdg, entryNode._id, 8);
    expectHasControlEdge(pdg, entryNode._id, 9);
    expectHasControlEdge(pdg, 2, 3);
    expectHasControlEdge(pdg, 2, 4);
    expectHasControlEdge(pdg, 5, 6);
    expectHasControlEdge(pdg, 5, 7);

    expectHasDataEdge(pdg, 1, 2); 
    expectHasDataEdge(pdg, 1, 5);
    expectHasDataEdge(pdg, 1, 8);  
    expectHasDataEdge(pdg, 3, 4);
    
    showPDG(pdg, "PDGTest22");
});


// Shadowing - Triple Nesting
it("PDG23", () =>{
    let code = `
    function foo(){
        let x = 1;      // 1
        if (x===1){     // 2
            let x = 2;  // 3
            if (x === 2){ // 4
                let x = 3; // 5
                if (x === 3){ // 6
                    console.log(x); // 7
                }
            }
            console.log(x);  // 8
        }
        console.log(x);      // 9
    }`

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);
    
    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 9);
    expectHasControlEdge(pdg, entryNode._id, 10);
    expectHasControlEdge(pdg, 2, 3);
    expectHasControlEdge(pdg, 2, 4);
    expectHasControlEdge(pdg, 2, 8);
    expectHasControlEdge(pdg, 4, 5);
    expectHasControlEdge(pdg, 4, 6);  
    expectHasControlEdge(pdg, 6, 7);

    expectHasDataEdge(pdg, 1, 2); 
    expectHasDataEdge(pdg, 1, 9);
    expectHasDataEdge(pdg, 3, 4);  
    expectHasDataEdge(pdg, 3, 8);
    expectHasDataEdge(pdg, 5, 6);
    expectHasDataEdge(pdg, 5, 7);
    
    showPDG(pdg, "PDGTest23");
});




/*
// Shadowing - Nested Loops
it("PDG24", () =>{
    let code = `
    function foo() {
        let sum = 0;                        // 1
        for (let i = 0; i < 3; i++) {       // 2, 3, 11
            sum += i;                       // 4 
            if (i > 0) {                    // 5
                let sum = 10;               // 6 
                for (let j = 0; j < 2; j++) { // 7, 8, 10
                    sum += j;               // 9 
                }
            }
        }
        return sum;                         // 12
    }`

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    
    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 3);
    expectHasControlEdge(pdg, entryNode._id, 12);
    expectHasControlEdge(pdg, entryNode._id, 13);
    expectHasControlEdge(pdg, 3, 4);
    expectHasControlEdge(pdg, 3, 5);
    expectHasControlEdge(pdg, 3, 11);
    expectHasControlEdge(pdg, 8, 9);
    expectHasControlEdge(pdg, 8, 10);

    // Wrong Control Edges !!
    // 3->6
    // 3->7
    // 3->8

    // Wrong Data Edges !!
    // 9->12
    // missing 4->4
    // etc
    
    showPDG(pdg, "PDGTest24");
});
*/

/*
// Try-Catch-Finally Statement
// Control edges completely wrong
it("Try-Catch-Finally Statement", () => {
    let code = `
    function foo() {
        let x = 5;          // 1
        try {
            x = x * 2;      // 2
            throw "error";  // 3
        } catch (e) {
            x = 0;          // 4
        } finally {
            x = x - 1;      // 5
        }
        return x;           // 6
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    showPDG(pdg, "PDGTestY");
});
*/

/* Do-while Loop
// CDG edge entry -> 2 is missing
it("Do-while-loop", () => {
    let code = `
    function foo(){
        let n = 1;      // 1
        do {
            n *= 2;      // 2
        } while (n<40); // 3
        console.log(n); // 4
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let ddg = DDGGenerator.generateDDG(cfg);
    let pdg = PDGGenerator.generatePDG(cdg,ddg);
    let entryNode = pdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expectHasControlEdge(pdg, entryNode._id, 1);
    expectHasControlEdge(pdg, entryNode._id, 2);
    expectHasControlEdge(pdg, entryNode._id, 3);
    expectHasControlEdge(pdg, entryNode._id, 4);
    expectHasControlEdge(pdg, entryNode._id, 5);
    expectHasControlEdge(pdg, 3, 2);

    expectHasDataEdge(pdg, 1, 2);
    expectHasDataEdge(pdg, 2, 2);
    expectHasDataEdge(pdg, 2, 3);
    expectHasDataEdge(pdg, 2, 4);
    expectHasDataEdge(pdg, 3, 2); 

    showPDG(pdg, "PDGTestX");
});
*/