import axios, { AxiosError } from 'axios';
import {input, select} from "@inquirer/prompts"
import {readFile} from "fs/promises"
import { ArgumentParser } from 'argparse'
import dotenv from "dotenv";
import blessed from "blessed";
import contrib from "blessed-contrib";


dotenv.config();

const KEY = process.env.API_KEY;
const W_KEY = process.env.WEATHER_KEY;
const BASE_URL = 'https://airlabs.co/api/v9/schedules?dep_iata='
const WEATHER_URL = 'http://api.weatherapi.com/v1/'
type AIRPORT_LIST = Airport[]


class Flight {
  constructor(
    public airlineIata: string,  
    public flightNumber: string,  
    public depTerminal: string | null,  
    public depGate: string | null,  
    public depTime: string,  
    public arrTime: string,  
    public arrEstimated: string,  
    public status: string,  
    public duration: number,  
    public delayed: number | null,  
    public depDelayed: number | null,  
    public arrDelayed: number | null,  
    public windSpeed: number,  
    public temp: number, 
    public condition: string
  ) {}
}


class Airport {
    name: string;
    iata: string;
    lat: string;
    lon: string;
    constructor(name: string,iata: string,lat: string,lon: string){
        this.name = name
        this.iata = iata
        this.lat = lat
        this.lon = lon
    }
}
class App {
    configureArgs(){
        const parser = new ArgumentParser({
        description: 'Fetching required airport'
        });
        
        parser.add_argument('-a', '--airport',{help: 'What airport to search for'});
        
        const args = parser.parse_args();
        return args
    }
    async runSession(){
        let args = this.configureArgs()
        let airport = args.airport.toLowerCase()

        if (airport) {
            console.log(`Searching for airport related to: ${airport}`);
        } else {
            console.log("No airport provided.");
            airport = await input({message:"Please provide an airport:"})
        }
        const airports = await readFile("airplanes/src/airports.json",'utf-8')

        const airportsJson = await JSON.parse(airports)
        const cleanAirports = this.cleanAirports(airportsJson)
        
        const finalAirport = await this.findAirport(cleanAirports,airport)

        const currentFlights = await this.fetchFlights(finalAirport.iata,finalAirport.lat,finalAirport.lon)
        
        let newTable = new Table()
        let formattedFlights = newTable.formatFlights(currentFlights)

        newTable.createTable(finalAirport.name,formattedFlights)
    }   
    async findAirport (airports: Airport[],input: string): Promise<Airport>{
        let options = []
        for (let i=0; i< airports.length;i++){
            if ((airports[i].name.toLowerCase()).includes(input)){
                options.push(airports[i])
            }
        }
        console.log(options, "list of options")
        if (options.length > 1){
            const choices = options.map(airport=>({
                name: airport.name,
                value: airport,
                description: `Select ${airport.name}?`}
            ))

            const choice = await select({
            message: 'Select the country out of the options',
            choices: choices
            })
            return choice
        }
        return options[0]
    }
    cleanAirports(airports: AIRPORT_LIST){
        const cleanAirports = []
        for (let i=0; i<airports.length;i++){
            if (airports[i].name != null && airports[i].lon != null && airports[i].lat!= null){
                cleanAirports.push(new Airport(
                    airports[i].name,
                    airports[i].iata,
                    airports[i].lat,
                    airports[i].lon))
            }
        }
        return cleanAirports
    }
    async fetchFlights (iata: string,lat: string,lon: string): Promise<Flight[]>{
        const response = await axios.get(`${BASE_URL}${iata}&api_key=${process.env.API_KEY}`)
    
        const data = response.data.response
        let listFlights = []
        const weather = await this.fetchWeather(lat,lon)
        for (let i = 0; i<data.length;i++){
            listFlights.push(new Flight(
                data[i]['airline_iata'],
                data[i]['flight_number'],
                data[i]['dep_terminal'],
                data[i]['dep_gate'],
                data[i]['dep_time'],
                data[i]['arr_time'],
                data[i]['arr_estimated'],
                data[i]['status'],
                data[i]['duration'],
                data[i]['delayed'],
                data[i]['dep_delayed'],
                data[i]['arr_delayed'],
                weather.wind_speed,
                weather.temp_c,
                weather.condition
            ));
        }
        return listFlights
    }
    async fetchWeather(lat: string,lon: string){
        const response = await axios.get(`${WEATHER_URL}current.json?key=${W_KEY}&q=${lat},${lon}&aqi=no`)
        console.log(response.data.current)
        const currentWeather = response.data.current
        return {"wind_speed":currentWeather['wind_mph'],"temp_c":currentWeather['temp_c'],"condition":currentWeather['condition']['text']}
    }
}

class Table{
    createTable(airportName: string, flights: any[][]){
        const screen = blessed.screen({
        smartCSR: true,
        title: `Flight Information for ${airportName}`,
        });

        const grid = new contrib.grid({ rows: 12, cols: 12, screen });

        const table = grid.set(0, 0, 12, 12, contrib.table, {
        keys: true,
        fg: "white",
        selectedFg: "black",
        selectedBg: "green",
        interactive: true,
        label: `Current Flights at ${airportName}`,
        width: "100%",
        height: "100%",
        border: { type: "line", fg: "cyan" },
        columnSpacing: 2,
        columnWidth: [8, 8, 8, 10, 10, 10],
        });

        table.setData({
            headers: ["Airline Code","Flight Number", 
                    "Terminal", "Gate", 
                    "Dep. Time", "Arr. Time",
                    "Duration", "Estimated Arr.",
                    "Status","Delayed",
                    "Dep. Delay","Arr. Delay",
                    "Wind Speed","Local Temp.",
                    "Weather Conditions"
                ],
            data: flights
            });


        screen.key(["escape", "q", "C-c"], () => process.exit(0));

        screen.render();
    }
    formatFlights(flights: Flight[]): any[][]{
        let formattedFlights = []
        for (let i = 0; i<flights.length;i++){
            formattedFlights.push([flights[i].airlineIata,flights[i].flightNumber,
                    flights[i].depTerminal,flights[i].depGate,
                    flights[i].depTime,flights[i].arrTime,
                    flights[i].arrEstimated,flights[i].status,
                    flights[i].duration,flights[i].delayed,
                    flights[i].depDelayed,flights[i].arrDelayed,
                    flights[i].windSpeed,flights[i].temp,
                    flights[i].condition
                ])
        }
        return formattedFlights
    }
}
let app = new App
app.runSession()