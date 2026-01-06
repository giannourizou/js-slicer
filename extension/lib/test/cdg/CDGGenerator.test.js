const CDGNodeNames = require("../../control-dependency-graph/constants/CDGNodeNames");
const CDGGenerator = require("../../control-dependency-graph/CDGGenerator");
const FDTGenerator = require("../../forward-dominance-tree/FDTGenerator");
const CFGGenerator = require("../../control-flow-graph/CFGGenerator");
const CDGVisualizer = require("../../control-dependency-graph/CDGVisualizer")
const Parser = require("../../code-parser-module/Parser");

function parse(str) {
    return Parser.parse(str.split("\n"));
}

function expectHasEdge(cdg, source, target) {
    expect(cdg.hasEdge(source, target)).toBe(true);
}

function showCDG(cdg, filename) {
    let visualizer = new CDGVisualizer(cdg, filename);
    visualizer.exportToDot();
}

function printCDG(cfg, cdg){ // Used for debugging
    console.log("Printed CDG");
    cdg._nodes.forEach((node) => {
        const cfgNode = cfg._nodes.find(n => n._id === node.id);
        const stmt = cfgNode?._statement;
        console.log( `Node ${node.id} → children: [${node._edges.map(e => e.target).join(", ")}] Statement: ${typeof stmt === "string" ? stmt : JSON.stringify(stmt)}`);
    });
}


it("throws error when CFG is missing", () => {
    expect(() => {
        CDGGenerator.generateCDG(null);
    }).toThrow("Missing required param.");
});


it("CDG of sequential statements", () => {
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
    let entryNode = cdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expect(cdg._nodes.length).toBe(8); // 1 entry node + 1 exit node + 6 "blocks"
    // everything connected to entry node
    expectHasEdge(cdg, entryNode._id, 1);
    expectHasEdge(cdg, entryNode._id, 2);
    expectHasEdge(cdg, entryNode._id, 3);
    expectHasEdge(cdg, entryNode._id, 4);
    expectHasEdge(cdg, entryNode._id, 5);
    expectHasEdge(cdg, entryNode._id, 6);
    expectHasEdge(cdg, entryNode._id, 7);   

    showCDG(cdg, "CDG1");
});

it("CDG of simple if statement", () => {
    let code = `
    function foo(){
        let x = 1;       // 1
        if (x<=0){       // 2
            x++;         // 3
        }
        console.log(x);  // 4
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let entryNode = cdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expect(cdg._nodes.length).toBe(6); 
    expectHasEdge(cdg, entryNode._id, 1);
    expectHasEdge(cdg, entryNode._id, 2);
    expectHasEdge(cdg, entryNode._id, 4);
    expectHasEdge(cdg, entryNode._id, 5);
    expectHasEdge(cdg, 2, 3);   // if body

    showCDG(cdg, "CDG2");
});


it("CDG of if-else statements", () => {
    let code = `
    function foo(cond){       
        let a = 1             // 1
        let b = 2             // 2
        if (cond) {           // 3
            a = a + 1         // 4    
        } else {
            b = b + 1         // 5
        }
        console.log(a)        // 6
        return a + b          // 7
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let entryNode = cdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expect(cdg._nodes.length).toBe(9);
    expectHasEdge(cdg, entryNode._id, 1);
    expectHasEdge(cdg, entryNode._id, 2);
    expectHasEdge(cdg, entryNode._id, 3);
    expectHasEdge(cdg, 3, 4);   // if body
    expectHasEdge(cdg, 3, 5);   // else body
    expectHasEdge(cdg, entryNode._id, 6);
    expectHasEdge(cdg, entryNode._id, 7);
    expectHasEdge(cdg, entryNode._id, 8);

    showCDG(cdg, "CDG3");
});


it("CDG of nested ifs", () => {
    const code = `
    function test(x) {
        let y = 0;           // 1
        if (x > 0) {         // 2
            if (x > 10) {    // 3   
                y = 1;       // 4
            } else {
                y = 2;       // 5
            }
        } else {
            y = -1;          // 6
        }
        return y;            // 7 
    }
    `;  

    let functionObj = parse(code);
    const cfg = CFGGenerator.generateCfg2(functionObj);
    const cdg = CDGGenerator.generateCDG(cfg);
    let entryNode = cdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expect(cdg._nodes.length).toBe(9);
    expectHasEdge(cdg, entryNode._id, 1);
    expectHasEdge(cdg, entryNode._id, 2);
    expectHasEdge(cdg, entryNode._id, 7);
    expectHasEdge(cdg, entryNode._id, 8);
    expectHasEdge(cdg, 2, 3);   // outer if body
    expectHasEdge(cdg, 2, 6);   // outer else body
    expectHasEdge(cdg, 3, 4);   // inner if body
    expectHasEdge(cdg, 3, 5);   // inner else body

    showCDG(cdg, "CDG4");
});


it("CDG of while loop", () => {
    const code = `
    function test(x) {
        let y = 0;           // 1
        while (x > 0) {      // 2
            y++;             // 3
            x--;             // 4
        }
        return y;            // 5
    }
    `;

    let functionObj = parse(code);
    const cfg = CFGGenerator.generateCfg2(functionObj);
    const cdg = CDGGenerator.generateCDG(cfg);
    let entryNode = cdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expect(cdg._nodes.length).toBe(7); 
    expectHasEdge(cdg, entryNode._id, 1);
    expectHasEdge(cdg, entryNode._id, 2);
    expectHasEdge(cdg, entryNode._id, 5);
    expectHasEdge(cdg, entryNode._id, 6);
    expectHasEdge(cdg, 2, 3);   // loop body
    expectHasEdge(cdg, 2, 4);   // loop body
    expectHasEdge(cdg, 2, 2);   // SRC

    showCDG(cdg, "CDG5");
});

it("CDG of nested while statements", () => {
    let code = `
    function foo(){
        let ar = [1, 2, 3]      // 1
        let a = 1               // 2
        while(a < ar.length){   // 3
            var b = 2           // 4
            a = a + 1           // 5
            while(b >= 0){      // 6
                b--             // 7
                if(b < 0){      // 8
                    b = -10     // 9
                }
            }
        }
        return a + b            // 10
    }`;

    let functionObj = parse(code);
    const cfg = CFGGenerator.generateCfg2(functionObj);
    const cdg = CDGGenerator.generateCDG(cfg);
    let entryNode = cdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expect(cdg._nodes.length).toBe(12)
    
    expectHasEdge(cdg, entryNode._id, 1);
    expectHasEdge(cdg, entryNode._id, 2);
    expectHasEdge(cdg, entryNode._id, 3);   // outer while
    expectHasEdge(cdg, entryNode._id, 10);
    expectHasEdge(cdg, entryNode._id, 11);

    expectHasEdge(cdg, 3, 4);   // outer while body
    expectHasEdge(cdg, 3, 5);   // outer while body
    expectHasEdge(cdg, 3, 6);   // inner while

    expectHasEdge(cdg, 6, 7);   // inner while body
    expectHasEdge(cdg, 6, 8);   // inner while body

    expectHasEdge(cdg, 8, 9);   // if body

    expectHasEdge(cdg, 3, 3);   // SRC
    expectHasEdge(cdg, 6, 6);   // SRC

    showCDG(cdg, "CDG6");
});


it("CDG of multiple ifs & returns", () => {
    let code = `
    function foo(a,b,c){
        let d = a+b+c;  // 1
        if(d>10){       // 2
            return 1;   // 3
        }
        else if(d>20){  // 4
            return 2;   // 5
        }
        else if(d>30){  // 6
            return 3;   // 7
        }
        else{
            return 0;   // 8
        }
        
    }
    `;

    let functionObj = parse(code);
    const cfg = CFGGenerator.generateCfg2(functionObj);
    const cdg = CDGGenerator.generateCDG(cfg);
    let entryNode = cdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expect(cdg._nodes.length).toBe(10)
    expectHasEdge(cdg, entryNode._id, 1);
    expectHasEdge(cdg, entryNode._id, 2);
    expectHasEdge(cdg, entryNode._id, 9);

    expectHasEdge(cdg, 2, 3);   // if body
    expectHasEdge(cdg, 2, 4);   // else if body

    expectHasEdge(cdg, 4, 5);   // if body
    expectHasEdge(cdg, 4, 6);   // else if body

    expectHasEdge(cdg, 6, 7);   // if body
    expectHasEdge(cdg, 6, 8);   // else body

    showCDG(cdg, "CDG7");
});

it("CDG of for loop", () => {
    let code = `
    function foo(){
        let ar = [1, 2, 3]  // 1
        let a = 1           // 2
        for(let i = 0; i < 10; i++){// 3, 4, 8
            a = a + i               // 5
            if (a > 10){            // 6
                console.log(a)      // 7
            }
        }
        return a + b                // 9
    }`;

    let functionObj = parse(code);
    const cfg = CFGGenerator.generateCfg2(functionObj);
    const cdg = CDGGenerator.generateCDG(cfg);
    let entryNode = cdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expect(cdg._nodes.length).toBe(11)
    expectHasEdge(cdg, entryNode._id, 1);
    expectHasEdge(cdg, entryNode._id, 2);
    expectHasEdge(cdg, entryNode._id, 3);
    expectHasEdge(cdg, entryNode._id, 4);
    expectHasEdge(cdg, entryNode._id, 9);
    expectHasEdge(cdg, entryNode._id, 10);

    expectHasEdge(cdg, 4, 4); // SRC
    expectHasEdge(cdg, 4, 5); // for loop body
    expectHasEdge(cdg, 4, 6); // for loop body
    expectHasEdge(cdg, 4, 8); // i++
    
    expectHasEdge(cdg, 6, 7); // if body

    showCDG(cdg, "CDG8");
});

it("CDG of loop with break", () => {
    const code = `
    function test(x) {
        let y = 0;           // 1
        while (x > 0) {      // 2
            if (x === 5) {   // 3
                break;       // 4
            }   
            y++;             // 5
            x--;             // 6
        }       
        return y;            // 7 
    }
    `;

    let functionObj = parse(code);
    const cfg = CFGGenerator.generateCfg2(functionObj);
    const cdg = CDGGenerator.generateCDG(cfg);
    let entryNode = cdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expect(cdg._nodes.length).toBe(9)
    expectHasEdge(cdg, entryNode._id, 1);
    expectHasEdge(cdg, entryNode._id, 2);
    expectHasEdge(cdg, entryNode._id, 7);
    expectHasEdge(cdg, entryNode._id, 8);

    expectHasEdge(cdg, 2, 3);   // while body
    expectHasEdge(cdg, 3, 4);   // if body
    expectHasEdge(cdg, 3, 5);   // "else" body
    expectHasEdge(cdg, 3, 6);   // "else" body

    // Node 3 is NOT a SRC because of the break statement in node 4.

    showCDG(cdg, "CDG9");
});

it("CDG with break and nested for loops", () => {
    let code = `
    function foo(a, b){
        let ar = [1, 2, 3]              // 1
        for(let i = 0; i < ar.length; i++){ // 2, 3, 14
            if (ar[i] % 2 == 0){        // 4
                break;                  // 5
            }
            for(let j = 0; j < i; j++){ // 6, 7, 13
                console.log(j)          // 8
                if (j %2 == 0){         // 9
                    break;              // 10
                }
                if (j == 3){            // 11
                    break;              // 12
                }
            }
        }
        return 0                        // 15
    }`;

    let functionObj = parse(code);
    const cfg = CFGGenerator.generateCfg2(functionObj);
    const cdg = CDGGenerator.generateCDG(cfg);
    let entryNode = cdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);
 
    expect(cdg._nodes.length).toBe(17)
    expectHasEdge(cdg, entryNode._id, 1);
    expectHasEdge(cdg, entryNode._id, 2);
    expectHasEdge(cdg, entryNode._id, 3);
    expectHasEdge(cdg, entryNode._id, 15);
    expectHasEdge(cdg, entryNode._id, 16);

    expectHasEdge(cdg, 3, 4); // outer loop body

    expectHasEdge(cdg, 4, 5); // if body
    expectHasEdge(cdg, 4, 6); // for (let j = 0)
    expectHasEdge(cdg, 4, 7); // for (j<i)
    expectHasEdge(cdg, 4, 14);// i++

    expectHasEdge(cdg, 7, 8); // loop body
    expectHasEdge(cdg, 7, 9); // loop body

    expectHasEdge(cdg, 9, 10); // if body
    expectHasEdge(cdg, 9, 11); // "else" body

    expectHasEdge(cdg, 11, 12); // if body
    expectHasEdge(cdg, 11, 13); // "else" body

    showCDG(cdg, "CDG10");
});

it("CDG with Switch & Break Statement ", () => {
    let code = `
    function foo(){
    let a = 1;          //1
    let b = 4;          //2
    switch(a) {         //3
        case 1:         
            b = a;      //4
            break;      //5
        case 2:         
            let c = a;  //6
            break;      //7
        default:        
            let d = b + a;  // 8
        }
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let entryNode = cdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);
 
    expect(cdg._nodes.length).toBe(10);

    expectHasEdge(cdg, entryNode._id, 1);
    expectHasEdge(cdg, entryNode._id, 2);
    expectHasEdge(cdg, entryNode._id, 3);
    expectHasEdge(cdg, entryNode._id, 9);

    // switch cases. case 1, case 2 are not different nodes.
    expectHasEdge(cdg, 3, 4); // case 1
    expectHasEdge(cdg, 3, 5); // case 1
    expectHasEdge(cdg, 3, 6); // case 2
    expectHasEdge(cdg, 3, 7); // case 2
    expectHasEdge(cdg, 3, 8); // default case

    showCDG(cdg, "CDG11");
});


// Bug(?): Entry node doesn't connect ENTRY to (first iteration) of node 2
// Clarification: Fomral Definition of CDG does not differentiate between first iteration and subsequent iterations. Hence, the control dependency of the DO-WHILE loop body on the condition is represented even though in the first iteration, the body executes unconditionally.
it("Do-while-loop", () => {
    let code = `
    function foo(){
        let n = 1;       // 1
        do {
            n *= 2;      // 2
        } while (n<40);  // 3
        console.log(n);  // 4
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let cdg = CDGGenerator.generateCDG(cfg);
    let entryNode = cdg._nodes.find(n => n._id === CDGNodeNames.ENTRY);

    expect(cdg._nodes.length).toBe(6);

    expectHasEdge(cdg, entryNode._id, 1);
    expectHasEdge(cdg, entryNode._id, 3);
    expectHasEdge(cdg, entryNode._id, 4);
    expectHasEdge(cdg, 3, 2); // while body
    expectHasEdge(cdg, 3,3); // src

    showCDG(cdg, "CDG12");
});

