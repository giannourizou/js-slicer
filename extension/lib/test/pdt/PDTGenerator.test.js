const CFGGenerator = require("../../control-flow-graph/CFGGenerator");
const PDTGenerator = require("../../post-dominance-tree/PDTGenerator");
const PDTVisualizer = require("../../post-dominance-tree/PDTVisualizer");
const Parser = require("../../code-parser-module/Parser");

function parse(str) {
    return Parser.parse(str.split("\n"));
}

function expectHasEdge(pdt, source, target) {
    expect(pdt.hasEdge(source, target)).toBe(true);
}

function showPDT(pdt, filename) {
    let visualizer = new PDTVisualizer(pdt, filename);
    visualizer.exportToDot();
}

it("throws error when CFG is missing", () => {
    expect(() => {
        PDTGenerator.generatePDT(null);
    }).toThrow("Missing required param.");
});

it("throws error when CFG is of wrong type", () => {
    expect(() => {
        PDTGenerator.generatePDT({});
    }).toThrow("Missing required param.");
}); 

it("PDT of sequential statements", () => {
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
    let pdt = PDTGenerator.generatePDT(cfg);

    // sequential connections
    expectHasEdge(pdt, 7, 6);   
    expectHasEdge(pdt, 6, 5);   
    expectHasEdge(pdt, 5, 4);   
    expectHasEdge(pdt, 4, 3);   
    expectHasEdge(pdt, 3, 2);   
    expectHasEdge(pdt, 2, 1);

    showPDT(pdt, "PDT1")
});


it("PDT of if/else statement", () => {
    const code = `
    function test(x) {
        let y = 0;        // 1
        if (x > 0) {      // 2
            y = 1;        // 3
        } else {          
            y = -1;       // 4 
        }
        return y;         // 5
    }
    `;

    let functionObj = parse(code);
    const cfg = CFGGenerator.generateCfg2(functionObj);
    const pdt = PDTGenerator.generatePDT(cfg);

    expectHasEdge(pdt, 6, 5);   // exit <- return
    expectHasEdge(pdt, 5, 2);   // return <- if (x>0) 
    expectHasEdge(pdt, 5, 4);   // return <- y = -1
    expectHasEdge(pdt, 5, 3);   // return <- y = 1 
    expectHasEdge(pdt, 2, 1);   // if -> let y = 0

    showPDT(pdt, "PDT2")
});


it("PDT of nested ifs", () => {
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
    const pdt = PDTGenerator.generatePDT(cfg);
    
    expectHasEdge(pdt, 8, 7);   // exit <- return
    expectHasEdge(pdt, 7, 2);   // return <- if (x>0)
    expectHasEdge(pdt, 7, 3);   // return <- if (x>10)
    expectHasEdge(pdt, 7, 4);   // return <- y = 1  
    expectHasEdge(pdt, 7, 5);   // return <- y = 2
    expectHasEdge(pdt, 7, 6);   // return <- y = -1
    expectHasEdge(pdt, 2, 1);   // if (x>0) <- y = 0

    showPDT(pdt, "PDT3")
});

it("PDT of while loop", () => {
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
    const pdt = PDTGenerator.generatePDT(cfg);

    expectHasEdge(pdt, 6, 5); // exit <- return
    expectHasEdge(pdt, 5, 2); // return <- while x>0
    expectHasEdge(pdt, 2, 1); // while x>0 <- let y=0
    expectHasEdge(pdt, 2, 4); // while x>0 <- x--
    expectHasEdge(pdt, 4, 3); // x-- <- y++

    showPDT(pdt, "PDT4")
});

it("PDT of nested while statements", () => {
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
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let pdt = PDTGenerator.generatePDT(cfg);

    expectHasEdge(pdt, 11, 10); // exit <- return
    expectHasEdge(pdt, 10, 3);  // return <- while(a < ar.length) 
    expectHasEdge(pdt, 8, 7);   // if (b<0) <- b--
    expectHasEdge(pdt, 6, 5);   // while(b >= 0) <- a = a + 1 
    expectHasEdge(pdt, 6, 8);   // while(b >= 0) <- if (b<0)
    expectHasEdge(pdt, 6, 9);   // while(b >= 0) <- b = -10
    expectHasEdge(pdt, 5, 4);   // a = a + 1 <- var b = 2
    expectHasEdge(pdt, 3, 2);   // while (a < ar.length) <- let a = 1
    expectHasEdge(pdt, 3, 6);   // while (a < ar.length) <- while (b >= 0)
    expectHasEdge(pdt, 2, 1);   // let a = 1 <- let ar = [1,2,3]

    showPDT(pdt, "PDT5")
});

it("PDT of for loop", () => {
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
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let pdt = PDTGenerator.generatePDT(cfg);

    expectHasEdge(pdt, 10, 9);  // exit <- return
    expectHasEdge(pdt, 9, 4);   // return <- i<10
    expectHasEdge(pdt, 8, 6);   // i++ <- if (a>10)
    expectHasEdge(pdt, 8, 7);   // i++ <- console.log(a)
    expectHasEdge(pdt, 6, 5);   // if (a>10) <- a = a + 1
    expectHasEdge(pdt, 4, 3);   // i<10 <- i=0
    expectHasEdge(pdt, 4, 8);   // i<10 <- i++
    expectHasEdge(pdt, 3, 2);   // let i = 0 <- let a = 1 
    expectHasEdge(pdt, 2, 1);   // a=1 <- ar = [1,2,3]

    showPDT(pdt, "PDT6")
});


it("PDT with break and nested for loops", () => {
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
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let pdt = PDTGenerator.generatePDT(cfg);

    expectHasEdge(pdt, 16, 15); // exit <- return 0
    expectHasEdge(pdt, 15, 3);  // return 0 <- i < ar.length
    expectHasEdge(pdt, 15, 4);  // return 0 <- if (ar[i] % 2 == 0)
    expectHasEdge(pdt, 15, 5);  // return 0 <- break
    expectHasEdge(pdt, 14, 7);  // i++ <- j < i
    expectHasEdge(pdt, 14, 9);  // i++ <- if (j %2 == 0)
    expectHasEdge(pdt, 14, 10); // i++ <- break
    expectHasEdge(pdt, 14, 11); // i++ <- if (j === 3)
    expectHasEdge(pdt, 14, 12); // i++ <- break
    expectHasEdge(pdt, 9, 8);   // if (j %2 == 0) <- console.log(j)
    expectHasEdge(pdt, 7, 6);   // j < i <- let j = 0
    expectHasEdge(pdt, 7, 13);  // j++ <- j<i
    expectHasEdge(pdt, 3, 2);   // i < ar.length <- let i = 0
    expectHasEdge(pdt, 3, 14);  // i < ar.length <- i++ 
    expectHasEdge(pdt, 2, 1);   // let i = 0 <- let ar = [1, 2, 3]

    showPDT(pdt, "PDT7")
});

it("PDT of while loop with break", () => {
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
    const pdt = PDTGenerator.generatePDT(cfg);  

    expectHasEdge(pdt, 8, 7); // exit <- return
    expectHasEdge(pdt, 7, 2); // return <- while
    expectHasEdge(pdt, 7, 4); // return <- break
    expectHasEdge(pdt, 6, 5); // x-- <- y++
    expectHasEdge(pdt, 7, 3); // return <- if x===5
    expectHasEdge(pdt, 2, 6); // while(x>0) <- x--
    expectHasEdge(pdt, 2, 1); // x>0 <- y=0

    showPDT(pdt, "PDT8")
});


it("PDT of multiple ifs & returns", () => {
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
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let pdt = PDTGenerator.generatePDT(cfg);

    expectHasEdge(pdt, 9, 8); // exit <- return 0
    expectHasEdge(pdt, 9, 7); // exit <- return 3
    expectHasEdge(pdt, 9, 5); // exit <- return 2
    expectHasEdge(pdt, 9, 3); // exit <- return 1
    expectHasEdge(pdt, 9, 6); // exit <- if d>30
    expectHasEdge(pdt, 9, 4); // exit <- if d>20
    expectHasEdge(pdt, 9, 2); // exit <- if (d>10)
    expectHasEdge(pdt, 2, 1); // if (d>10) <- let d = a+b+c

    showPDT(pdt, "PDT9")
});


it("PDT of complex if body", () => {
    let code = `
    function foo() {
        let sum = 0;                        // 1
        for (let i = 0; i < 3; i++) {       // 2, 3, 12
            sum += i;                       // 4 
            if (i > 0) {                    // 5
                let sum = 10;               // 6 
                for (let j = 0; j < 2; j++) { // 7, 8, 10
                    sum += j;               // 9 
                }
            }
            console.log(sum);                //  11
        }
        return sum;                         // 13
    }`

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let pdt = PDTGenerator.generatePDT(cfg);    
    
    expectHasEdge(pdt, 14, 13); // exit <- return sum 
    expectHasEdge(pdt, 13, 3);  // return sum <- i<3 
    expectHasEdge(pdt, 12, 11); // i++ <- console.log(sum)   
    expectHasEdge(pdt, 11, 5);  // console.log(sum) <- if (i>0) 
    expectHasEdge(pdt, 11, 8);  // console.log(sum) <- j<2 
    expectHasEdge(pdt, 10, 9);  // j++ <- sum+=j 
    expectHasEdge(pdt, 8, 7);   // j<2 <- let j=0 
    expectHasEdge(pdt, 8, 10);  // j<2 <- j++
    expectHasEdge(pdt, 7, 6);   // let j=0 <- let sum=10
    expectHasEdge(pdt, 5, 4);   // if (i>0) <- sum+=i
    expectHasEdge(pdt, 3, 2);   // i<3 <- let i=0
    expectHasEdge(pdt, 3, 12);  // i<3 <- i++
    expectHasEdge(pdt, 2, 1);   // let i=0 <- let sum=0

    showPDT(pdt, "PDT10")
});


it("PDT of complex if body 2", () => {
    let code = `
    function foo() {
        let x = 0;                  // 1
        if (x > 0) {                // 2
            for (let i = 0; i < 5; i++) { // 3, 4, 6
                x += i;             // 5
            }
        }
        return x;                   // 7
    }`

    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let pdt = PDTGenerator.generatePDT(cfg);
    
    expectHasEdge(pdt, 8, 7); // exit <- return x 
    expectHasEdge(pdt, 7, 2); // return x <- if x>0 
    expectHasEdge(pdt, 7, 4); // return x <- i<5
    expectHasEdge(pdt, 6, 5); // i++ <- x+=i 
    expectHasEdge(pdt, 4, 3); // i<5 <- let i=0
    expectHasEdge(pdt, 4, 6); // i<5 <- i++
    expectHasEdge(pdt, 2, 1); // if x>0 <- let x=0 

    showPDT(pdt, "PDT11")
});


it("thesis example", () => {
   let code = `
    function thesis_example(x){
        let pos = x;        // 1
        let found = false; // 2
        while (!found && pos >= 0){ // 3,4
            if (pos === 1){    // 5
                found = true;  // 6
            }
            pos--;          // 7
        }
        return found; // 8
    }`;


    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let pdt = PDTGenerator.generatePDT(cfg);
    
    showPDT(pdt, "PDT12")
});

it("example", () => {
    let code = `
    function example(x){
        let a = 1;
        let b = a * 2;
        return b;
    }`;
        
    let functionObj = parse(code);
    let cfg = CFGGenerator.generateCfg2(functionObj);
    let pdt = PDTGenerator.generatePDT(cfg);
    
    showPDT(pdt, "PDT13")
});
