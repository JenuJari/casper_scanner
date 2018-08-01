/*
Run at 5 pm for best result.
*/
const $ = require('jquery');
const _ = require('lodash');
var FS = require('fs');
//var utils = require('utils');
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

let FILE_PATH = '52_week_low.csv';
const Filtered = [];
const positive = [];
const negative = [];

const bse_52week_low_url = 'https://www.bseindia.com/markets/equity/EQReports/HighLow.aspx?expandable=2&Flag=L';

const pre = "https://www.nseindia.com/live_market/dynaContent/live_watch/get_quote/GetQuote.jsp?symbol=";
const getStockUrl = function (name) { return pre + name; };
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

casper.formatFile = function (frm) {    
    var data = FS.read(frm);
    data = data.split("\n");
    data = data.splice(1);
    _.each(data , line => {
        line = line.trim('\r');
        let raw = line.split(',');
        if( (raw[8] == 'A' || raw[8] == 'B' ) && raw[2] > 100) {
            let nlow =  parseFloat( raw[2] ) - ( parseFloat(raw[3]) * 1.05 );
            //let plow = (parseFloat(raw[4]) * 1.05) - parseFloat(raw[2]);
            //let alow = (parseFloat(raw[6]) * 1.03)- parseFloat(raw[2]);
            if(nlow > 0) {
                Filtered.push({scriptcode : raw[0], scriptname : raw[1], ltp : raw[2], grade : raw[8], stockurl : getStockUrl(raw[1]) });
            }
        }
    });
    //utils.dump(Filtered);
};

casper.dumpOutput = function () {
    positive.sort((a,b) => parseFloat(a.deliveryPerc) - parseFloat(b.deliveryPerc));
    negative.sort((a,b) => parseFloat(a.deliveryPerc) - parseFloat(b.deliveryPerc));
    FS.write('output.json', JSON.stringify({ positive : positive , negative : negative}));
};

casper.start(bse_52week_low_url, function () {
    var theFormRequest = this.evaluate(function() {
        var request = {}; 
        var formDom = document.forms["aspnetForm"];
        formDom.onsubmit = function() {
            //iterate the form fields
            var data = {};
            for(var i = 0; i < formDom.elements.length; i++) {
             data[formDom.elements[i].name] = formDom.elements[i].value;
         }
         data['ctl00$ContentPlaceHolder1$btnDownload.x'] = 8;
         data['ctl00$ContentPlaceHolder1$btnDownload.y'] = 8;
         data['ctl00$ContentPlaceHolder1$Hidden1'] = '';
         data['__EVENTTARGET'] = "";
         data['__EVENTARGUMENT'] = "";
         request.action = formDom.action;
         request.data = data;
            return false; //Stop form submission
        }

        document.querySelector("#ctl00_ContentPlaceHolder1_btnDownload").click();

        return request;
    });
    this.download(theFormRequest.action, FILE_PATH, "POST", theFormRequest.data);
    this.formatFile(FILE_PATH);
});

casper.then(function() {
    casper.each(Filtered, function(self, link) {
        self.thenOpen(link.stockurl, function() {
            this.waitForSelector('#lastPrice',function() {
                let infos = this.evaluate(getALlInfos);            
                if(parseFloat(infos.deliveryPerc) > 30) {
                    infos.link = link;
                    if(parseFloat(infos.change) > 0) {
                       positive.push(infos);
                    } else {
                       negative.push(infos);
                    }
                }
            }, function () {
                return ;
            });
        });
    });
});

casper.run(function () {
    this.dumpOutput();
    this.exit();
});
