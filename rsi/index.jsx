const $ = require('jquery');
const _ = require('lodash');
var FS = require('fs');
//var utils = require('utils');
const casper = require("casper").create({
    clientScripts: [
        './../../node_modules/jquery/dist/jquery.min.js',
        './../../node_modules/moment/min/moment.min.js',
        './../../node_modules/lodash/lodash.js'
    ],
    pageSettings: {
        loadImages: false,        // The WebPage instance used by Casper will
        loadPlugins: false         // use these settings
    },
    logLevel: "error",              // Only "info" level messages will be logged
    verbose: true                  // log messages will be printed out to the console
});


const nifty_fifty = ["ACC", "AMBUJACEM", "AXISBANK", "BAJAJ-AUTO", "BHARTIARTL", "BHEL", "BPCL", "CAIRN", "CIPLA", "DLF", "DRREDDY", "GAIL", "GRASIM", "HCLTECHc", "HDFC", "HDFCBANK", "HEROHONDA", "HINDALCO", "HINDUNILVR", "ICICIBANK", "IDFC", "INFOSYSTCH", "ITC", "JINDALSTEL", "JPASSOCIAT", "KOTAKBANK", "LT", "M&M", "MARUTI", "NTPC", "ONGC", "PNB", "POWERGRID", "RANBAXY", "RCOM", "RELCAPITAL", "RELIANCE", "RELINFRA", "RPOWER", "SAIL", "SBIN", "SESAGOA", "SIEMENS", "STER", "SUNPHARMA", "TATAMOTORS", "TATAPOWER", "TATASTEEL", "TCS", "WIPRO"];
const technical_url = "https://in.tradingview.com/symbols/NSE-####/technicals/";

