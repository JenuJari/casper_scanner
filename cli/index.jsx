import CASPER from 'casper';
import utils from 'utils';


const casper = CASPER.create();

casper.echo("Casper CLI passed args:");
utils.dump(casper.cli.args);

casper.echo("Casper CLI passed options:");
utils.dump(casper.cli.options);

casper.exit();