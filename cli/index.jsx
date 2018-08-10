import CASPER from 'casper';
import utils from 'utils';


const casper = CASPER.create();

casper.echo("Casper CLI passed args:");
utils.dump(casper.cli.args);

casper.echo("Casper CLI passed options:");
utils.dump(casper.cli.options);

casper.exit();


// https://www.nseindia.com/live_market/dynaContent/live_watch/get_quote/getHistoricalData.jsp?symbol=ICICIBANK&series=EQ&fromDate=09-08-2017&toDate=09-08-2018


// https://www.quandl.com/api/v3/datasets/NSE/LTFH/data.json?api_key=Vgq4r_MTm_zT5ya2YNWH&start_date=2017-08-09&end_date=2018-08-9&order=desc