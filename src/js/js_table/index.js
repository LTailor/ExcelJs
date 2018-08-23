import {Lexer, SyntaxParser} from './parser'

class JsTable {
    constructor(){
        this.cellRefs = new Map();
        this.cellFormulas = new Map();
        this.lexer = new Lexer();
        this.syntax = new SyntaxParser(this);
    }
    
    init(parentElement, rows, cells) {
        const tableElement = document.createElement('div');
        tableElement.setAttribute('style',`width: ${cells*80}px`);
        this.table = tableElement;
        let rowElement = document.createElement('div');
        let cell = document.createElement('div');
        cell.classList.add('cell','first_caption');
        rowElement.appendChild(cell);

        for(let i=0;i<cells;i++) {
            const colLabel = this.convertToNumberingScheme(i+1);
            let cell = document.createElement('div');
            cell.classList.add('cell','caption');
            cell.innerText = colLabel;
            rowElement.appendChild(cell);
        }
        tableElement.appendChild(rowElement);
        rowElement = document.createElement('div');
        for(let i= 0; i< rows; i++) {
            rowElement.setAttribute('data-row',i+1);
            tableElement.appendChild(rowElement);
            let firstCell = document.createElement('div');
            firstCell.classList.add('cell','first_caption');
            firstCell.innerText = i+1;
            rowElement.appendChild(firstCell);
            for (let j = 0; j< cells; j++) {

                let cell = document.createElement('div');
                cell.classList.add('cell');
                const colLabel = this.convertToNumberingScheme(j+1);
                let row = i + 1;
                cell.setAttribute('data-cell', colLabel);
                rowElement.appendChild(cell);

                this.setCellEventListeners(cell, row, colLabel);
            }
            rowElement = document.createElement('div');
        }
    
        parentElement.appendChild(tableElement);
    }

    setCellEventListeners(cell, row, colLabel) {
        const cellAddress = colLabel + row;
        cell.addEventListener("focus", (event)=>{
            console.log("focus");
            event.target.innerText = this.getCellValue(row, colLabel);
        })
        cell.addEventListener("blur", ( event ) => {
            let tokens  = this.lexer.parse(event.target.innerText);
            console.log("blur");
            console.log(tokens);
            tokens.forEach((a) => {
                if(a.type === 'address') {
                    let dependCell = this.cellRefs.get(a.value);
                    if (!dependCell) {
                        dependCell = this.cellRefs.set(a.value, []).get(a.value);    
                    }
                    dependCell.push({
                        col: colLabel,
                        row: row
                    });
                }
            });
            this.cellFormulas.set(cellAddress, event.target.innerText);
            try
            {
                cell.innerText = this.syntax.parse(event.target.innerText);
            }
            catch (msg)
            {
                alert(msg);
                return;
            }

            if (this.cellRefs.has(cellAddress)) {
                const dependCells = this.cellRefs.get(cellAddress);
                dependCells.forEach((c) => {
                    const cellValue = this.getCellValue(c.row, c.col);
                      
                    const dataRow = this.table.querySelector(`[data-row="${c.row}"]`);
                    const cell = dataRow.querySelector(`[data-cell="${c.col}"]`);
                    cell.innerText = this.syntax.parse(cellValue);
                })
            }
        }, true);
    }

    getCellValue(row,col) {
        if (!this.table) return undefined;
        const formula = this.cellFormulas.get(col+row);
        if(formula) {
            return formula;
        }

        const dataRow = this.table.querySelector(`[data-row="${row}"]`);
        const cell = dataRow.querySelector(`[data-cell="${col}"]`);
        return cell.innerText;
    }

    convertToNumberingScheme(number) {
        var baseChar = ("A").charCodeAt(0),
            letters  = "";
      
        do {
          number -= 1;
          letters = String.fromCharCode(baseChar + (number % 26)) + letters;
          number = (number / 26) >> 0;
        } while(number > 0);
      
        return letters;
      }
}


export default JsTable;