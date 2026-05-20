# js-slicer

This project is a library for construction and visualization of common program analysis graphs for JavaScript functions.

## Features

- Abstract Syntax Tree (AST) parsing
- Control Flow Graph (CFG) construction
- Post-Dominator Tree (PDT) construction
- Control Dependence Graph (CDG) construction
- Data Dependence Graph (DDG) construction
- Program Dependence Graph (PDG) construction
- Interactive Graph Visualization via GraphViz/Viz.js inside VS Code

## Installation

Download the latest release of the extension:

[JS Slicer v0.1.3 (.vsix)](https://github.com/softeng-aueb/js-slicer/releases/latest)

Then install it in VS Code:

1. Open VS Code
2. Go to Extensions → … menu → _Install from VSIX…_
3. Select the downloaded file

## How to use

-   Open any JavaScript file.
-   You will find four **JS-Slicer** buttons on the right of the top menu.
-   Specifically: **JS-Slicer CFG**, **JS-Slicer CDG**, **JS-Slicer DDG** and **JS-Slicer PDG**.
-   Alternatively, hover over any supported JavaScript function and select one of the options
    **Generate CFG/CDG/DDG/PDG for (function name)** from the context menu.

Both methods will open a new tab with the chosen graph of the selected function.

##Project History & Contributions

The AST and CFG subsystems were developed by Gasparis Rigos, Vassilis Zafeiris and Arman Krikorian. 
The PDT, CDG, DDG and PDG construction and visualization components were developed as part of my BSc Thesis at Athens University of Economics and Business: ["Construction and Visualization of Program Dependence Graphs from JavaScript Source Code."](https://pyxida.aueb.gr/files/bcc7f422-530a-4a8c-86b6-f4782d04409e/download/Giannou-Rizou_2026.pdf)

## Known Issues

-   Optional Chaining Operator and Nullish Coalescing Operator is not supported by recast in which the project depends on.
-   Current PDT, CDG, DDG and PDG implementations operate at statement-level rather than Basic-Blocks level.
