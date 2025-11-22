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


it("DDG4 - Assignment Statement with 2+ variables", () => {
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

it("DDG5 - If/Else Statement", () =>{
    let code = `
    function foo(){
        let a = 1               // 1
        let b = 2               // 2
        if(a > b){              // 3
            b = a + 10          // 4
        } else {
            b = a - 10          // 5
        }
        let c = b               // 6
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let ddg = DDGGenerator.generateDDG(cfg);

    expect(ddg._nodes.length).toBe(7);

    expectHasEdge(ddg,1,3); // def-use
    expectHasEdge(ddg,1,4); // def-use
    expectHasEdge(ddg,1,5); // def-use
    expectHasEdge(ddg,2,3); // def-use
    expectHasEdge(ddg,2,4); // def-def
    expectHasEdge(ddg,2,5); // def-def
    expectHasEdge(ddg,4,6); // def-use
    expectHasEdge(ddg,5,6); // def-use

});

it("DDG6 - For Loop Statement", () =>{
    let code = `
    function foo(){
        let sum = 0             // 1    
        for(let i = 0; i < 10; i++){ // 2, 3, 5
            sum = sum + i       // 4
        }
        let avg = sum / 10      // 6
    }
    `;  

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let ddg = DDGGenerator.generateDDG(cfg);

    expect(ddg._nodes.length).toBe(7);

    expectHasEdge(ddg,1,4); // def-use & def-def (sum)
    expectHasEdge(ddg,1,6); // def-use (sum) even if there is an "intervening" definition...!
    expectHasEdge(ddg,2,3); // def-use (i)
    expectHasEdge(ddg,2,4); // def-use (i)
    expectHasEdge(ddg,2,5); // def-def & def-use (i)
    expectHasEdge(ddg,3,5); // use-def (i)
    expectHasEdge(ddg,4,4); // def-use & def-def & use_def (sum)
    expectHasEdge(ddg,4,5); // use-def (i)
    expectHasEdge(ddg,4,6); // def-use (sum)
    expectHasEdge(ddg,5,3); // def-use (i)
    expectHasEdge(ddg,5,4); // def-use (i)
    expectHasEdge(ddg,5,5); // def-def & def-use & use-def (i)

});

it("DDG7 - Switch & Break Statement ", () => {
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
    let ddg = DDGGenerator.generateDDG(cfg);

    expect(ddg._nodes.length).toBe(9);
    expectHasEdge(ddg,1,3); // def-use (a)
    expectHasEdge(ddg,1,4); // def-use (a)
    expectHasEdge(ddg,1,6); // def-use (a)
    expectHasEdge(ddg,1,8); // def-use (a)

    expectHasEdge(ddg,2,4); // def-def (b)
    expectHasEdge(ddg,2,8); // def-use (b)
    
})

it("DDG8 - While Loop & Continue Statement", () => {
    let code = `
    function foo(){
        let x = 0;              //1
        let sum = 0;            //2
        while(x < 10){          //3
            x = x + 1;          //4
            if(x % 2 == 0){     //5
                continue;       //6
            }
            sum = sum + x;      //7
        }
        let avg = sum / 10;     //8
    }
    `;

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let ddg = DDGGenerator.generateDDG(cfg);

    expect(ddg._nodes.length).toBe(9);

    expectHasEdge(ddg,1,3); // def-use (x)
    expectHasEdge(ddg,1,4); // def-def & def-use (x)
    expectHasEdge(ddg,2,7); // def-def & def-use (sum)
    expectHasEdge(ddg,2,8); // def-use (sum)
    expectHasEdge(ddg,3,4); // use-def (x)
    expectHasEdge(ddg,4,3); // def-use (x)
    expectHasEdge(ddg,4,4); // def-use & use-def & def-def (x)
    expectHasEdge(ddg,4,5); // def-use (x)
    expectHasEdge(ddg,4,7); // def-use (x)
    expectHasEdge(ddg,5,4); // use-def (x)
    expectHasEdge(ddg,7,4); // use-def (x)
    expectHasEdge(ddg,7,7); // def-use & use-def & def-def (sum)
    expectHasEdge(ddg,7,8); // def-use (sum)
    
})

it("DDG9 - Arrays - Simple Access", () => {
    let code =`
    function foo(){
        let arr = [1,2,3];  // 1 
        let x = arr[0];     // 2
        let y = arr[1];     // 3
        let z = x + y;      // 4
    }`

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let ddg = DDGGenerator.generateDDG(cfg);

    expect(ddg._nodes.length).toBe(5);
    expectHasEdge(ddg,1,2); // def-use (arr)
    expectHasEdge(ddg,1,3); // def-use (arr)
    expectHasEdge(ddg,2,4); // def-use (x)
    expectHasEdge(ddg,3,4); // def-use (y)

})

/*
it("DDG10 - Arrays - Update Element", () => {
    let code =`
    function foo(){
        let arr = [1,2,3];  // 1
        arr[0] = 10;        // 2
        let x = arr[0];     // 3
    }`

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let ddg = DDGGenerator.generateDDG(cfg);

    expect(ddg._nodes.length).toBe(4);
    expectHasEdge(ddg,1,2); // def-def (arr)
    expectHasEdge(ddg,2,3); // def-use (arr)
    //expect(ddg.hasEdge(1,3)).toBe(false); // should not be a def-use (arr) due to intervening definition
    // arr acts like a variable!!!

    ddg._nodes.forEach((node) => {
        const cfgNode = cfg._nodes.find(n => n._id === node.id);
        const stmt = cfgNode?._statement;
        console.log( `Node ${node.id} → children: [${node._edges.map(e => e.target).join(", ")}]Statement: ${typeof stmt === "string" ? stmt : JSON.stringify(stmt)}`);
    });
});
*/


it("DDG11 - Arrays - Mutating Methods", () => {
    let code =`
    function foo(){
        let arr = [1,2,3];      // 1
        arr.push(4);            // 2
        arr.fill('3',0,1);      // 3
        arr.pop();              // 4
        arr.reverse()           // 5
    }`

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let ddg = DDGGenerator.generateDDG(cfg);

    expect(ddg._nodes.length).toBe(6);

    expectHasEdge(ddg,1,2); // def-def & def-use 
    expectHasEdge(ddg,2,3); // def-def & def-use & use-def
    expectHasEdge(ddg,3,4); // def-def & def-use & use-def
    expectHasEdge(ddg,4,5); // def-def & def-use & use-def
});

it("DDG12 - Arrays - Non-mutating methods", () => {
    let code =`
    function foo(){
        let arr = [1,2,3]         // 1 
        let x = arr.slice(0,1)    // 2
        let y = arr.join(',')     // 3
        x.push('2');              // 4
        let z = x.includes('2')   // 5
    }`

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let ddg = DDGGenerator.generateDDG(cfg);

    expect(ddg._nodes.length).toBe(6);

    expectHasEdge(ddg,1,2) // def-use (arr)
    expectHasEdge(ddg,1,3) // def-use (arr)
    expectHasEdge(ddg,2,4) // def-def & def-use (x)
    expectHasEdge(ddg,4,5) // def-use (x)
    expect(ddg.hasEdge(2,5)).toBe(false) // intervening definition of x
})

it("DDG13 - Return statement", () => {
    let code =`
    function foo(){
        let x = 6       // 1 
        let y = 7       // 2
        return x + y;   // 3
    }`

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let ddg = DDGGenerator.generateDDG(cfg);

    expect(ddg._nodes.length).toBe(4);
    expectHasEdge(ddg,1,3); // def-use (x)
    expectHasEdge(ddg,2,3); // def-use (y)

})

it("DDG14 - Arrow Functions", () =>{
    let code =`
    function foo(){
        let arr = [1,2,3];                       // 1 
        let doubled = arr.map(x => x*2);         // 2
        let filtered = doubled.filter(e => e<6); // 3
        let two = arr[1];                        // 4
        doubled = doubled.filter(x => x > two);  // 5
    }`

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let ddg = DDGGenerator.generateDDG(cfg);

    expect(ddg._nodes.length).toBe(6);

    expectHasEdge(ddg,1,2); // def-use (arr)
    expectHasEdge(ddg,1,4); // def-use (arr)
    expectHasEdge(ddg,2,3); // def-use (doubled)
    expectHasEdge(ddg,2,5); // def-use (doubled)
    expectHasEdge(ddg,3,5); // use-def (doubled)
    expectHasEdge(ddg,4,5); // def-use (two)
});