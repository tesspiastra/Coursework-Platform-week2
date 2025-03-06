import axios from 'axios';
import { input, select } from "@inquirer/prompts";
import { readFile } from "fs/promises";
import { ArgumentParser } from 'argparse';
import dotenv from "dotenv";
dotenv.config();
const KEY = process.env.API_KEY;
console.log(KEY);
const BASE_URL = `https://airlabs.co/api/v9/schedules?dep_iata=`;
class Flight {
    flight_number;
    dep_terminal;
    dep_gate;
    dep_time;
    arr_terminal;
    arr_time;
    arr_estimated;
    status;
    duration;
    delayed;
    dep_delayed;
    arr_delayed;
    constructor(airline_iata, flight_number, dep_terminal, dep_gate, dep_time, arr_terminal, arr_time, arr_estimated, status, duration, delayed, dep_delayed, arr_delayed) {
        this.flight_number = flight_number;
        this.dep_terminal = dep_terminal;
        this.dep_gate = dep_gate;
        this.dep_time = dep_time;
        this.arr_terminal = arr_terminal;
        this.arr_time = arr_time;
        this.arr_estimated = arr_estimated;
        this.status = status;
        this.duration = duration;
        this.delayed = delayed;
        this.dep_delayed = dep_delayed;
        this.arr_delayed = arr_delayed;
    }
}
// class Flight {
//     airline_iata: string;
//     flight_number: string;
//     dep_terminal: string | null;
//     dep_gate: string | null;
//     dep_time: string;
//     arr_terminal: string | null;
//     arr_time: string;
//     arr_estimated: string;
//     status: string;
//     duration: number;
//     delayed: number | null;
//     dep_delayed: number | null;
//     arr_delayed: number | null;
//     constructor(
//         airline_iata: string,
//         flight_number: string,
//         dep_terminal: string | null,
//         dep_gate: string | null,
//         dep_time: string,
//         arr_terminal: string | null,
//         arr_time: string,
//         arr_estimated: string,
//         status: string,
//         duration: number,
//         delayed: number | null,
//         dep_delayed: number | null,
//         arr_delayed: number | null
//     ) {
//         this.airline_iata = airline_iata;
//         this.flight_number = flight_number;
//         this.dep_terminal = dep_terminal;
//         this.dep_gate = dep_gate;
//         this.dep_time = dep_time;
//         this.arr_terminal = arr_terminal;
//         this.arr_time = arr_time;
//         this.arr_estimated = arr_estimated;
//         this.status = status;
//         this.duration = duration;
//         this.delayed = delayed;
//         this.dep_delayed = dep_delayed;
//         this.arr_delayed = arr_delayed;
//     }
// }
class Airport {
    name;
    iata;
    lat;
    lon;
    constructor(name, iata, lat, lon) {
        this.name = name;
        this.iata = iata;
        this.lat = lat;
        this.lon = lon;
    }
}
class App {
    configureArgs() {
        const parser = new ArgumentParser({
            description: 'Fetching required airport'
        });
        parser.add_argument('-a', '--airport', { help: 'What airport to search for' });
        const args = parser.parse_args();
        return args;
    }
    async runSession() {
        let args = this.configureArgs();
        let airport = args.airport.toLowerCase();
        if (airport) {
            console.log(`Searching for airport related to: ${airport}`);
        }
        else {
            console.log("No airport provided.");
            airport = await input({ message: "Please provide an airport:" });
        }
        const airports = await readFile("airplanes/src/airports.json", 'utf-8');
        const airportsJson = await JSON.parse(airports);
        const cleanAirports = this.cleanAirports(airportsJson);
        let finalOption = await this.findAirport(cleanAirports, airport);
        console.log(finalOption, "final choice");
        this.fetchFlights(finalOption);
    }
    async findAirport(airports, input) {
        let options = [];
        for (let i = 0; i < airports.length; i++) {
            if ((airports[i].name.toLowerCase()).includes(input)) {
                options.push(airports[i]);
            }
        }
        console.log(options, "list of options");
        if (options.length > 1) {
            const choices = options.map(airport => ({
                name: airport.name,
                value: airport.iata,
                description: `Select ${airport.name}?`
            }));
            const choice = await select({
                message: 'Select the country out of the options',
                choices: choices
            });
            return choice;
        }
        return options[0].iata;
    }
    cleanAirports(airports) {
        const cleanAirports = [];
        for (let i = 0; i < airports.length; i++) {
            if (airports[i].name != null && airports[i].lon != null && airports[i].lat != null) {
                cleanAirports.push(airports[i]);
            }
        }
        return cleanAirports;
    }
    async fetchFlights(iata) {
        const response = await axios.get(`${BASE_URL}${iata}&api_key=${process.env.API_KEY}`);
        // console.log(response)
        const data = response.data.response;
        let listFlights = [];
        for (let i = 0; i < data.length; i++) {
            listFlights.push(new Flight(data[i]['airline_iata'], data[i]['flight_number'], data[i]['dep_terminal'], data[i]['dep_gate'], data[i]['dep_time'], data[i]['arr_terminal'], data[i]['arr_time'], data[i]['arr_estimated'], data[i]['status'], data[i]['duration'], data[i]['delayed'], data[i]['dep_delayed'], data[i]['arr_delayed']));
        }
        console.log(listFlights[0]);
    }
}
let app = new App;
app.runSession();
