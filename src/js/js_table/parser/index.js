class Lexer {
    parse(input) {
        const values = this.getNumberTokens(input);
        const operations = this.getOperationTokens(input);
        const highPriorOperations = this.getHighPriorityOperations(input);
        let result = [...values, ...operations, ...highPriorOperations].sort((a,b) =>{ return a.index-b.index });
        return result;
    }

    getNumberTokens(text) {
        const numberRegex = /(\d+\.?\d*)|([a-z]+[0-9]+)/gi;
        let regResult;
        let result = [];
        while ((regResult = numberRegex.exec(text))!==null) {
            if(regResult[1]) {
                result.push({
                    type:'number',
                    index: regResult.index,
                    value: regResult[0]
                });
            } else if (regResult[2]) {
                result.push({
                    type:'address',
                    index: regResult.index,
                    value: regResult[0]
                });
            }

        }

        return result;
    }

    getOperationTokens(text) {
        const opRegex = /[+|-]/gi;
        let regResult;
        let result = [];
        while ((regResult = opRegex.exec(text))!==null) {
            result.push({
                type:'op',
                index: regResult.index,
                value: regResult[0]
            });
        }

        return result;
    }

    getHighPriorityOperations(text) {
        const opRegex = /[*|\/]/gi;
        let regResult;
        let result = [];
        while ((regResult = opRegex.exec(text))!==null) {
            result.push({
                type:'high_op',
                index: regResult.index,
                value: regResult[0]
            });
        }

        return result;
    }
}

class SyntaxParser {
    constructor(table) {
        this.table = table;
        this.lexer = new Lexer();
    }
    parse(input) {
        if(input[0]!=='=') return input;
        const tokens = this.lexer.parse(input);
        return this.expression(tokens,0).value;
    }

    expression(tokens,pos) {
        return this.lowPriorityExpr(tokens,pos);
    }
    lowPriorityExpr(tokens, pos) {
        let value;
        value = this.highPriorityExpr(tokens,pos);

        if(!tokens[value.nextPos]) return value;
        
        if(tokens[value.nextPos].type=='op') {
            let value2 = this.lowPriorityExpr(tokens, value.nextPos+1);
            let res = {};

            if(tokens[value.nextPos].value == '+'){
                res.value = value.value+ value2.value;
            } else {
                res.value = value.value - value2.value;
            }
            res.nextPos = value2.nextPos;
            return res;
        }
    }

    highPriorityExpr(tokens, pos) {
        let value;
        if(tokens[pos].type == 'number' || tokens[pos].type == 'address') {
            value = this.getValue(tokens,pos);
        }
        else {
            throw `Number or address is expected`;
        }
        if(!tokens[pos+1] || tokens[pos+1].type!= 'high_op') return {
            value: value,
            nextPos: pos+1
        };

        let res = {};
        let value2 = this.highPriorityExpr(tokens, pos+2);
        if(tokens[pos+1].value == '*'){
            res.value = value * value2.value;
        } else {
            res.value = value / value2.value;
        }
        res.nextPos = value2.nextPos;
        return res;
    }
    
    getValue(tokens, pos) {
        if (tokens[pos].type == 'number') {
            return parseFloat(tokens[pos].value);
        } 
        else if (tokens[pos].type == 'address') {
            const reg = /([a-z]+)(\d+)/i;
            let res = reg.exec(tokens[pos].value);
            let value =  this.table.getCellValue(res[2],res[1]);

            return parseFloat(this.parse(value));

        }
    }
}

export {Lexer, SyntaxParser}