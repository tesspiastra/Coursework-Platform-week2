import axios from 'axios';
import { input, select } from "@inquirer/prompts";
import { readFile } from "fs/promises";
import { ArgumentParser } from 'argparse';
import dotenv from "dotenv";
import blessed from "blessed";
import contrib from "blessed-contrib";
dotenv.config();
const KEY = process.env.API_KEY;
const W_KEY = process.env.WEATHER_KEY;
const BASE_URL = 'https://airlabs.co/api/v9/schedules?dep_iata=';
const WEATHER_URL = 'http://api.weatherapi.com/v1/';
class Flight {
    airlineIata;
    flightNumber;
    destination;
    depTerminal;
    depGate;
    depTime;
    arrTime;
    arrEstimated;
    status;
    duration;
    delayed;
    depDelayed;
    arrDelayed;
    windSpeed;
    temp;
    condition;
    constructor(airlineIata, flightNumber, destination, depTerminal, depGate, depTime, arrTime, arrEstimated, status, duration, delayed, depDelayed, arrDelayed, windSpeed, temp, condition) {
        this.airlineIata = airlineIata;
        this.flightNumber = flightNumber;
        this.destination = destination;
        this.depTerminal = depTerminal;
        this.depGate = depGate;
        this.depTime = depTime;
        this.arrTime = arrTime;
        this.arrEstimated = arrEstimated;
        this.status = status;
        this.duration = duration;
        this.delayed = delayed;
        this.depDelayed = depDelayed;
        this.arrDelayed = arrDelayed;
        this.windSpeed = windSpeed;
        this.temp = temp;
        this.condition = condition;
        this.depTerminal = depTerminal ?? "Not Known";
        this.depGate = depGate ?? "TBD";
        this.delayed = delayed ?? "No Delay";
        this.depDelayed = depDelayed ?? "0";
        this.arrDelayed = arrDelayed ?? "0";
        this.arrTime = arrTime ?? "Not Known";
        this.arrEstimated = arrEstimated ?? "Not Known";
    }
    fixNulls() {
        if (this.depTerminal === null) {
            this.depTerminal;
        }
    }
}
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
        const finalAirport = await this.findAirport(cleanAirports, airport);
        const currentFlights = await this.fetchFlights(cleanAirports, finalAirport.iata, finalAirport.lat, finalAirport.lon);
        let newTable = new Table();
        let formattedFlights = newTable.formatFlights(currentFlights);
        newTable.createTable(finalAirport.name, formattedFlights);
    }
    async findAirport(airports, input) {
        let options = [];
        for (let i = 0; i < airports.length; i++) {
            if ((airports[i].name.toLowerCase()).includes(input)) {
                options.push(airports[i]);
            }
        }
        if (options.length > 1) {
            const choices = options.map(airport => ({
                name: airport.name,
                value: airport,
                description: `Select ${airport.name}?`
            }));
            const choice = await select({
                message: 'Select the country out of the options',
                choices: choices
            });
            return choice;
        }
        return options[0];
    }
    findDestination(airports, iata) {
        for (let i = 0; i < airports.length; i++) {
            if ((airports[i].iata).includes(iata)) {
                return airports[i].name;
            }
        }
        throw new Error("Not found");
    }
    cleanAirports(airports) {
        const cleanAirports = [];
        for (let i = 0; i < airports.length; i++) {
            if (airports[i].name != null && airports[i].lon != null && airports[i].lat != null) {
                cleanAirports.push(new Airport(airports[i].name, airports[i].iata, airports[i].lat, airports[i].lon));
            }
        }
        return cleanAirports;
    }
    async fetchFlights(airports, iata, lat, lon) {
        const response = await axios.get(`${BASE_URL}${iata}&api_key=${process.env.API_KEY}`);
        const data = response.data.response;
        console.log(data);
        let listFlights = [];
        const weather = await this.fetchWeather(lat, lon);
        let destination = 'Not found';
        try {
            destination = this.findDestination(airports, iata);
        }
        catch (error) {
        }
        for (let i = 0; i < data.length; i++) {
            listFlights.push(new Flight(data[i]['airline_iata'], data[i]['flight_number'], destination, data[i]['dep_terminal'], data[i]['dep_gate'], data[i]['dep_time'], data[i]['arr_time'], data[i]['arr_estimated'], data[i]['status'], data[i]['duration'], data[i]['delayed'], data[i]['dep_delayed'], data[i]['arr_delayed'], weather.wind_speed, weather.temp_c, weather.condition));
        }
        console.log(listFlights.length);
        return listFlights;
    }
    async fetchWeather(lat, lon) {
        const response = await axios.get(`${WEATHER_URL}current.json?key=${W_KEY}&q=${lat},${lon}&aqi=no`);
        const currentWeather = response.data.current;
        return { "wind_speed": currentWeather['wind_mph'],
            "temp_c": currentWeather['temp_c'],
            "condition": currentWeather['condition']['text'] };
    }
}
class Table {
    createTable(airportName, flights) {
        const screen = blessed.screen({
            smartCSR: true,
            title: `Flight Information for ${airportName}`,
        });
        const height = flights.length;
        const columnCount = flights[0].length;
        const columnLength = 10;
        const grid = new contrib.grid({ rows: height, cols: columnCount, screen });
        const table = grid.set(0, 0, height, columnCount, contrib.table, {
            keys: true,
            fg: "white",
            selectedFg: "black",
            selectedBg: "green",
            label: `Current Flights at ${airportName}`,
            width: "50%",
            height: "500%",
            border: { type: "line", fg: "cyan" },
            columnSpacing: 2,
            columnWidth: Array.from({ "length": 16 }).fill(columnLength),
            scrollable: true,
            scrollbar: {
                bg: 'blue'
            }
        });
        table.setData({
            headers: ["Airline Code", "Flight Number",
                "Destination",
                "Terminal", "Gate",
                "Dep. Time", "Arr. Time",
                "Duration", "Estimated Arr.",
                "Status", "Delayed (mins)",
                "Dep. Delay (mins)", "Arr. Delay (mins)",
                "Wind Speed (mph)", "Local Temp. (\u00B0C)",
                "Weather Conditions"
            ],
            data: flights
        });
        screen.key(["escape", "q", "C-c"], () => process.exit(0));
        screen.key(['up', 'down'], (ch, key) => { const amount = (key.name === 'up') ? -1 : 1; table.scroll(amount); screen.render(); });
        screen.render();
    }
    formatFlights(flights) {
        let formattedFlights = [];
        for (let i = 0; i < flights.length; i++) {
            formattedFlights.push([flights[i].airlineIata, flights[i].flightNumber,
                flights[i].destination,
                flights[i].depTerminal, flights[i].depGate,
                flights[i].depTime, flights[i].arrTime,
                flights[i].arrEstimated, flights[i].status,
                flights[i].duration, flights[i].delayed,
                flights[i].depDelayed, flights[i].arrDelayed,
                flights[i].windSpeed, flights[i].temp,
                flights[i].condition
            ]);
        }
        console.log(formattedFlights[0]);
        return formattedFlights;
    }
}
let app = new App;
app.runSession();
