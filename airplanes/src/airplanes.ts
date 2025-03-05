import "dotenv/config";
import {input} from "@inquirer/prompts"
import {readFile} from "fs/promises"
import { ArgumentParser } from 'argparse'

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
        const parser = new ArgumentParser({
        description: 'Fetching required airport'
        });
        
        parser.add_argument('-a', '--airport',{help: 'What airport to search for'});
        
        const args = parser.parse_args();
        return args
    }
    startSession(){
        let args = this.configureArgs()
        let airport = args.airport
        if (airport) {
            console.log(`Fetching information for airport: ${airport}`);
        } else {
            console.log("No airport provided.");
            let search = input({message:"Please provide an airport:"})
        }
        const airports = readFile("./airports.json",'utf-8')
        console.log(airports, typeof(airports))
    }   
}
let app = new App
app.startSession()