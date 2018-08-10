const $ = require('jquery');
const _ = require('lodash');
var FS = require('fs');
var utils = require('utils');
var xpathselect = require('casper').selectXPath;
const casper = require("casper").create({
    clientScripts:  [
    './node_modules/jquery/dist/jquery.min.js',
    './node_modules/moment/min/moment.min.js',
    './node_modules/lodash/lodash.js'
    ],
    pageSettings: {
        loadImages:  false,        // The WebPage instance used by Casper will
        loadPlugins: false         // use these settings
    },
    logLevel: "error",              // Only "info" level messages will be logged
    verbose: true                  // log messages will be printed out to the console
});
const pre = "https://www.nseindia.com/live_market/dynaContent/live_watch/get_quote/GetQuote.jsp?symbol=";
const getStockUrl = function (name) { 
    if(name == 'BAJAJ_AUTO') name = 'BAJAJ-AUTO';
    return pre + name; 
};

const nifty_fifty = ["ACC", "AMBUJACEM", "AXISBANK", "BAJAJ_AUTO", "BHARTIARTL", "BHEL", "BPCL", "CAIRN", "CIPLA", "DLF", "DRREDDY", "GAIL", "GRASIM", "HCLTECH", "HDFC", "HDFCBANK", "HEROMOTOCO", "HINDALCO", "HINDUNILVR", "ICICIBANK", "IDFC", "INFY", "ITC", "JINDALSTEL", "JPASSOCIAT", "KOTAKBANK", "LT", "MM", "MARUTI", "NTPC", "ONGC", "PNB", "POWERGRID", "RANBAXY", "RCOM", "RELCAPITAL", "RELIANCE", "RELINFRA", "RPOWER", "SAIL", "SBIN", "SESAGOA", "SIEMENS", "STER", "SUNPHARMA", "TATAMOTORS", "TATAPOWER", "TATASTEEL", "TCS", "WIPRO"];
const page = "https://www.nseindia.com/products/content/equities/equities/eq_security.htm";
const qouteUrl = 'https://www.nseindia.com/live_market/dynaContent/live_watch/get_quote/getHistoricalData.jsp?symbol=SYMBOL&series=EQ&fromDate=FRMDT&toDate=TODT'
const quandlURL = 'https://www.quandl.com/api/v3/datasets/NSE/SYMB/data.json?api_key=Vgq4r_MTm_zT5ya2YNWH&start_date=FRMDT&end_date=TODT&order=ASC'
const DBO = {};
let OutputStr = "";
const filtered = [],ResultArr = [];
const roundTwoDecimal = function(n) { return (Math.round(n * 100) / 100);};
const getCSVURL = function (symb,frmdt,todt) {
    let t = qouteUrl.replace('SYMBOL',symb);
    t = t.replace('FRMDT', frmdt);
    t = t.replace('TODT', todt);

    return t; 
};
const getQuandlurl = function(symb,frmdt,todt) {
    let t = quandlURL.replace('SYMB', symb);
    t = t.replace('FRMDT', frmdt);
    t = t.replace('TODT', todt);
    return t;
}
const removeExtraQoute = (str) => { return str.replace(/\"/g,""); }
const getALlInfos = function () {
    let info = {};
    info.lastPrice = $('#lastPrice').text();
    info.companyName = $('#companyName').text();
    info.symbol = $('#symbol').text();
    info.change = $('#change').text();
    info.pChange = $('#pChange').text();
    info.deliveryPerc = $('#deliveryToTradedQuantity').text();
    info.high52 = $('#high52').text();
    info.low52 = $('#low52').text();
    info.previousClose = $('#previousClose').text();
    info.open = $('#open').text();
    info.dayHigh = $('#dayHigh').text();
    info.dayLow = $('#dayLow').text();
    info.closePrice = $('#closePrice').text();
    return info;
};
casper.generateDBO = function (data,key) {
    var keyObjArr = [];
    data = data.split(":");
    var header = data[0];
    header = header.trim('\r');
    header = header.split('\",\"');
    data = data.splice(1);
    _.each(data , line => {
        line = line.trim('\r');
        let raw = line.split('\",\"');
        let t = {};
        if(raw.length > 0 && raw.length == header.length) {
            for(let k = 0, length3 = header.length; k < length3; k++) { t[removeExtraQoute(header[k])] = removeExtraQoute(raw[k]); }
            keyObjArr.push(t);
        }
    });
    DBO[key] = keyObjArr;
};
casper.generateQuandlDBO = function(data,header,key) {
    var keyObjArr = [];
    _.each(data , raw => {
        let t = {};
        if(raw.length > 0 && raw.length == header.length) {
            for(let k = 0 ; k < header.length; k++) { t[header[k]] = raw[k]; }
            keyObjArr.push(t);
        }
    });
    DBO[key] = keyObjArr;
};
casper.generateRSI = function (key, intrval) {
    let symb = DBO[key];
    symb[0].gain = 0;
    symb[0].loss = 0;

    for(var k = 1; k < intrval; k++) {
        var d = symb[k]; var p = symb[k-1];
        var change = parseFloat(d['Close']) - parseFloat(p['Close']);
        change = roundTwoDecimal(change);
        symb[k].gain = change > 0 ? change : 0;
        symb[k].loss = change > 0 ? 0 : Math.abs(change);
    }

    var d = symb[intrval]; var p = symb[intrval-1];
    var change = parseFloat(d['Close']) - parseFloat(p['Close']);
    change = roundTwoDecimal(change);
    symb[intrval].gain = change > 0 ? change : 0;
    symb[intrval].loss = change > 0 ? 0 : Math.abs(change);
    symb[intrval].avg_gain = 0;
    symb[intrval].avg_loss = 0;
    
    for(var k = 1; k < intrval; k++) {
        symb[intrval].avg_gain += symb[k].gain;
        symb[intrval].avg_loss += symb[k].loss;
    }

    symb[intrval].avg_gain = roundTwoDecimal(symb[intrval].avg_gain / intrval);
    symb[intrval].avg_loss = roundTwoDecimal(symb[intrval].avg_loss / intrval);
    symb[intrval].rs = roundTwoDecimal(symb[intrval].avg_gain / symb[intrval].avg_loss);
    symb[intrval].rsi = roundTwoDecimal(100 - (100 / (1 + symb[intrval].rs)));


    for(var k = intrval + 1; k < symb.length; k++) {
        var d = symb[k]; var p = symb[k-1];
        var change = parseFloat(d['Close']) - parseFloat(p['Close']);
        change = roundTwoDecimal(change);
        symb[k].gain = change > 0 ? change : 0;
        symb[k].loss = change > 0 ? 0 : Math.abs(change);
        symb[k].avg_gain = roundTwoDecimal(((p.avg_gain * (intrval - 1)) + symb[k].gain) / intrval);
        symb[k].avg_loss = roundTwoDecimal(((p.avg_loss * (intrval - 1)) + symb[k].loss) / intrval);
        symb[k].rs = roundTwoDecimal(symb[k].avg_gain / symb[k].avg_loss);
        symb[k].rsi = roundTwoDecimal(100 - (100 / (1 + symb[k].rs)));
    }
};
casper.appendOutputString = function (s) {OutputStr += s + '\r\n'; };

casper.dumpOutput = function () {
    ResultArr.sort((a,b) => parseFloat(a.deliveryPerc) - parseFloat(b.deliveryPerc));
    this.appendOutputString('================================Results================================');
    for (var i = ResultArr.length - 1; i >= 0; i--) {
        let info = ResultArr[i];
        this.appendOutputString('====================================================================');
        this.appendOutputString('||                                                                ||');
        this.appendOutputString('====================================================================');
        this.appendOutputString('Company Name         :: ' + info.companyName );
        this.appendOutputString('Symbol               :: ' + info.symbol );
        this.appendOutputString('URL                  :: ' + info.stockurl );
        this.appendOutputString('RSI                  :: ' + info.rsi );
        this.appendOutputString('Last Price           :: ' + info.lastPrice );
        this.appendOutputString('Previous Close       :: ' + info.previousClose );
        this.appendOutputString('Change               :: ' + info.change );
        this.appendOutputString('% Chnage             :: ' + info.pChange );
        this.appendOutputString('% Delivery           :: ' + info.deliveryPerc );
        this.appendOutputString('52 High/Low          :: ' + info.high52 + ' / ' + info.low52 );
        this.appendOutputString('High|Open|Close|Low  :: ' + info.dayHigh + ' | ' + info.open + ' | ' + info.closePrice + ' | ' + info.dayLow );
        this.appendOutputString('===================================================================');
        this.appendOutputString('||                                                               ||');
        this.appendOutputString('===================================================================');
    }
    FS.write('output/RSI.txt', OutputStr);
};

casper.start('https://www.nseindia.com/', function() {
    this.echo(this.getTitle());
});

casper.then(function() { // 
    casper.each(nifty_fifty, function(self,symb) {
        self.thenOpen(getQuandlurl(symb,'2017-08-09','2018-08-09'), function() {
            let o = JSON.parse(this.getPageContent());
            if(o.hasOwnProperty('dataset_data')) {
                this.generateQuandlDBO(o.dataset_data.data,o.dataset_data.column_names,symb);
            }
        });
    });
});

casper.then(function() {
    casper.each(nifty_fifty, function(self,symb) {
        this.generateRSI(symb,14);
    });
});

casper.then(function() {
    casper.each(nifty_fifty, function(self,symb) {
        let tone = DBO[symb];
        let tone_last = tone[tone.length - 1];
        if(tone_last && tone_last.rsi < 40) {
            filtered.push({ symb : symb , rsi : tone_last.rsi });
        }
    });
});

casper.then(function() {
    casper.each(filtered, function(self, stc) {
        let stockurl = getStockUrl(stc.symb);
        self.thenOpen(stockurl, function() {
            this.waitForSelector('#lastPrice',function() {
                let infos = this.evaluate(getALlInfos);
                infos.rsi = stc.rsi;     
                infos.stockurl = stockurl;    
                infos.closePositive = parseFloat(infos.change) > 0;
                ResultArr.push(infos);
            }, function () {return ; });
        });
    });
});

casper.run(function () {
    this.dumpOutput();
    this.exit();
});
