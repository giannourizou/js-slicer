const CFGGenerator = require("../../control-flow-graph/CFGGenerator");
const FDTGenerator = require("../../forward-dominance-tree/FDTGenerator");
const Parser = require("../../code-parser-module/Parser");

function parse(str) {
    return Parser.parse(str.split("\n"));
}

function expectHasEdge(fdt, source, target) {
    expect(fdt.hasEdge(source, target)).toBe(true);
}

it("throws error when CFG is missing", () => {
    expect(() => {
        FDTGenerator.generateFDT(null);
    }).toThrow("Missing required param.");
});

it("throws error when CFG is of wrong type", () => {
    expect(() => {
        FDTGenerator.generateFDT({});
    }).toThrow("Missing required param.");
}); 

it("FDT of sequential statements", () => {
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
    let fdt = FDTGenerator.generateFDT(cfg);

    // sequential connections
    expectHasEdge(fdt, 7, 6);   
    expectHasEdge(fdt, 6, 5);   
    expectHasEdge(fdt, 5, 4);   
    expectHasEdge(fdt, 4, 3);   
    expectHasEdge(fdt, 3, 2);   
    expectHasEdge(fdt, 2, 1);

});


it("FDT of if/else statement", () => {
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
    const fdt = FDTGenerator.generateFDT(cfg);

    expectHasEdge(fdt, 6, 5);   // exit <- return
    expectHasEdge(fdt, 5, 2);   // return <- if (x>0) 
    expectHasEdge(fdt, 5, 4);   // return <- y = -1
    expectHasEdge(fdt, 5, 3);   // return <- y = 1 
    expectHasEdge(fdt, 2, 1);   // if -> let y = 0

});


it("FDT of nested ifs", () => {
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
    const fdt = FDTGenerator.generateFDT(cfg);
    
    expectHasEdge(fdt, 8, 7);   // exit <- return
    expectHasEdge(fdt, 7, 2);   // return <- if (x>0)
    expectHasEdge(fdt, 7, 3);   // return <- if (x>10)
    expectHasEdge(fdt, 7, 4);   // return <- y = 1  
    expectHasEdge(fdt, 7, 5);   // return <- y = 2
    expectHasEdge(fdt, 7, 6);   // return <- y = -1
    expectHasEdge(fdt, 2, 1);   // if (x>0) <- y = 0
     
});

it("FDT of while loop", () => {
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
    const fdt = FDTGenerator.generateFDT(cfg);

    expectHasEdge(fdt, 6, 5); // exit <- return
    expectHasEdge(fdt, 5, 2); // return <- while x>0
    expectHasEdge(fdt, 2, 1); // while x>0 <- let y=0
    expectHasEdge(fdt, 2, 4); // while x>0 <- x--
    expectHasEdge(fdt, 4, 3); // x-- <- y++

});

it("FDT of nested while statements", () => {
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
    let fdt = FDTGenerator.generateFDT(cfg);

    expectHasEdge(fdt, 11, 10); // exit <- return
    expectHasEdge(fdt, 10, 3);  // return <- while(a < ar.length) 
    expectHasEdge(fdt, 8, 7);   // if (b<0) <- b--
    expectHasEdge(fdt, 6, 5);   // while(b >= 0) <- a = a + 1 
    expectHasEdge(fdt, 6, 8);   // while(b >= 0) <- if (b<0)
    expectHasEdge(fdt, 6, 9);   // while(b >= 0) <- b = -10
    expectHasEdge(fdt, 5, 4);   // a = a + 1 <- var b = 2
    expectHasEdge(fdt, 3, 2);   // while (a < ar.length) <- let a = 1
    expectHasEdge(fdt, 3, 6);   // while (a < ar.length) <- while (b >= 0)
    expectHasEdge(fdt, 2, 1);   // let a = 1 <- let ar = [1,2,3]

});

it("FDT of for loop", () => {
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
    let fdt = FDTGenerator.generateFDT(cfg);

    expectHasEdge(fdt, 10, 9);  // exit <- return
    expectHasEdge(fdt, 9, 4);   // return <- i<10
    expectHasEdge(fdt, 8, 6);   // i++ <- if (a>10)
    expectHasEdge(fdt, 8, 7);   // i++ <- console.log(a)
    expectHasEdge(fdt, 6, 5);   // if (a>10) <- a = a + 1
    expectHasEdge(fdt, 4, 3);   // i<10 <- i=0
    expectHasEdge(fdt, 4, 8);   // i<10 <- i++
    expectHasEdge(fdt, 3, 2);   // let i = 0 <- let a = 1 
    expectHasEdge(fdt, 2, 1);   // a=1 <- ar = [1,2,3]

});


it("FDT with break and nested for loops", () => {
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
    let fdt = FDTGenerator.generateFDT(cfg);

    expectHasEdge(fdt, 16, 15); // exit <- return 0
    expectHasEdge(fdt, 15, 3);  // return 0 <- i < ar.length
    expectHasEdge(fdt, 15, 4);  // return 0 <- if (ar[i] % 2 == 0)
    expectHasEdge(fdt, 15, 5);  // return 0 <- break
    expectHasEdge(fdt, 14, 7);  // i++ <- j < i
    expectHasEdge(fdt, 14, 9);  // i++ <- if (j %2 == 0)
    expectHasEdge(fdt, 14, 10); // i++ <- break
    expectHasEdge(fdt, 14, 11); // i++ <- if (j === 3)
    expectHasEdge(fdt, 14, 12); // i++ <- break
    expectHasEdge(fdt, 9, 8);   // if (j %2 == 0) <- console.log(j)
    expectHasEdge(fdt, 7, 6);   // j < i <- let j = 0
    expectHasEdge(fdt, 7, 13);  // j++ <- j<i
    expectHasEdge(fdt, 3, 2);   // i < ar.length <- let i = 0
    expectHasEdge(fdt, 3, 14);  // i < ar.length <- i++ 
    expectHasEdge(fdt, 2, 1);   // let i = 0 <- let ar = [1, 2, 3]

});

it("FDT of while loop with break", () => {
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
    const fdt = FDTGenerator.generateFDT(cfg);  

    expectHasEdge(fdt, 8, 7); // exit <- return
    expectHasEdge(fdt, 7, 2); // return <- while
    expectHasEdge(fdt, 7, 4); // return <- break
    expectHasEdge(fdt, 6, 5); // x-- <- y++
    expectHasEdge(fdt, 7, 3); // return <- if x===5
    expectHasEdge(fdt, 2, 6); // while(x>0) <- x--
    expectHasEdge(fdt, 2, 1); // x>0 <- y=0

});


it("FDT of multiple ifs & returns", () => {
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
    let fdt = FDTGenerator.generateFDT(cfg);

    expectHasEdge(fdt, 9, 8); // exit <- return 0
    expectHasEdge(fdt, 9, 7); // exit <- return 3
    expectHasEdge(fdt, 9, 5); // exit <- return 2
    expectHasEdge(fdt, 9, 3); // exit <- return 1
    expectHasEdge(fdt, 9, 6); // exit <- if d>30
    expectHasEdge(fdt, 9, 4); // exit <- if d>20
    expectHasEdge(fdt, 9, 2); // exit <- if (d>10)
    expectHasEdge(fdt, 2, 1); // if (d>10) <- let d = a+b+c

});


it("FDT of complex if body", () => {
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
    let fdt = FDTGenerator.generateFDT(cfg);    
    
    expectHasEdge(fdt, 14, 13); // exit <- return sum 
    expectHasEdge(fdt, 13, 3);  // return sum <- i<3 
    expectHasEdge(fdt, 12, 11); // i++ <- console.log(sum)   
    expectHasEdge(fdt, 11, 5);  // console.log(sum) <- if (i>0) 
    expectHasEdge(fdt, 11, 8);  // console.log(sum) <- j<2 
    expectHasEdge(fdt, 10, 9);  // j++ <- sum+=j 
    expectHasEdge(fdt, 8, 7);   // j<2 <- let j=0 
    expectHasEdge(fdt, 8, 10);  // j<2 <- j++
    expectHasEdge(fdt, 7, 6);   // let j=0 <- let sum=10
    expectHasEdge(fdt, 5, 4);   // if (i>0) <- sum+=i
    expectHasEdge(fdt, 3, 2);   // i<3 <- let i=0
    expectHasEdge(fdt, 3, 12);  // i<3 <- i++
    expectHasEdge(fdt, 2, 1);   // let i=0 <- let sum=0

});


it("FDT of complex if body 2", () => {
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
    let fdt = FDTGenerator.generateFDT(cfg);
    
    expectHasEdge(fdt, 8, 7); // exit <- return x 
    expectHasEdge(fdt, 7, 2); // return x <- if x>0 
    expectHasEdge(fdt, 7, 4); // return x <- i<5
    expectHasEdge(fdt, 6, 5); // i++ <- x+=i 
    expectHasEdge(fdt, 4, 3); // i<5 <- let i=0
    expectHasEdge(fdt, 4, 6); // i<5 <- i++
    expectHasEdge(fdt, 2, 1); // if x>0 <- let x=0 
});
