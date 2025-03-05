import "dotenv/config";
import { input } from "@inquirer/prompts";
import { readFile } from "fs/promises";
import { ArgumentParser } from 'argparse';
const KEY = process.env.API_KEY;
const BASE_URL = `https://airlabs.co/api/v9/schedules?`;
class Flight {
    constructor() {
    }
}
class Airport {
    constructor() {
    }
}
class App {
    constructor() {
    }
    configureArgs() {
        const parser = new ArgumentParser({
            description: 'Fetching required airport'
        });
        parser.add_argument('-a', '--airport', { help: 'What airport to search for' });
        const args = parser.parse_args();
        return args;
    }
    async startSession() {
        let args = this.configureArgs();
        let airport = args.airport;
        if (airport) {
            console.log(`Fetching information for airport: ${airport}`);
        }
        else {
            console.log("No airport provided.");
            let search = await input({ message: "Please provide an airport:" });
        }
        const airports = await readFile("airplanes/src/airports.json", 'utf-8');
        const airportsJson = await JSON.parse(airports);
        const cleanAirports = this.cleanAirports(airportsJson);
        let found = true;
        for (let i = 0; i < cleanAirports.length; i++) {
            if (cleanAirports[i].name === airport) {
                // const chosenAirport = new Airport cleanAirports[i]
                console.log(cleanAirports[i]);
            }
            else {
                found = false;
            }
        }
        console.log(found);
    }
    cleanAirports(airports) {
        const cleanAirports = [];
        for (let i = 0; i < airports.length; i++) {
            if (airports[i].name != null || airports[i].lon != null || airports[i].lat != null) {
                cleanAirports.push(airports[i]);
            }
        }
        return cleanAirports;
    }
}
let app = new App;
app.startSession();
