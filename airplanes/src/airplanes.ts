import "dotenv/config";

const KEY = process.env.API_KEY
const BASE_URL = `https://airlabs.co/api/v9/schedules?`

class Flight {
    constructor(){

    }
}

class Airport {
    constructor(){

    }
}
class App {
    constructor(){

    }
    configureArgs(){
        const { ArgumentParser } = require('argparse');
        
        const parser = new ArgumentParser({
        description: 'Fetching required airport'
        });
        
        parser.add_argument('-a', '--airport',{help: 'What airport to search for'});
        
        console.dir(parser.parse_args());
    }
    startSession(){
        this.configureArgs()
        const args = (process.argv)
        if (args.airport)
    }
}