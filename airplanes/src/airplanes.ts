import axios, { AxiosError } from 'axios';
import {input, select} from "@inquirer/prompts"
import {readFile} from "fs/promises"
import { ArgumentParser } from 'argparse'
import dotenv from "dotenv";

dotenv.config();

const KEY = process.env.API_KEY;
console.log(KEY)
const BASE_URL = `https://airlabs.co/api/v9/schedules?dep_iata=`
type AIRPORT_LIST = Airport[]


class Flight {
  constructor(
    airline_iata: string,
    public flight_number: string,
    public dep_terminal: string | null,
    public dep_gate: string | null,
    public dep_time: string,
    public arr_terminal: string | null,
    public arr_time: string,
    public arr_estimated: string,
    public status: string,
    public duration: number,
    public delayed: number | null,
    public dep_delayed: number | null,
    public arr_delayed: number | null,
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
        
        let finalOption = await this.findAirport(cleanAirports,airport)
        console.log(finalOption,"final choice")
        this.fetchFlights(finalOption)
    
    }   
    async findAirport (airports: AIRPORT_LIST,input: string): Promise<string>{
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
                value: airport.iata,
                description: `Select ${airport.name}?`}
            ))

            const choice = await select({
            message: 'Select the country out of the options',
            choices: choices
            
            })
            return choice
        }
        return options[0].iata
    }
    cleanAirports(airports: AIRPORT_LIST){
        const cleanAirports = []
        for (let i=0; i<airports.length;i++){
            if (airports[i].name != null && airports[i].lon != null && airports[i].lat!= null){
                cleanAirports.push(airports[i])
            }
        }
        return cleanAirports
    }
    async fetchFlights (iata: string){
        const response = await axios.get(`${BASE_URL}${iata}&api_key=${process.env.API_KEY}`)
    
        const data = response.data.response
        let listFlights = []
        for (let i = 0; i<data.length;i++){
            listFlights.push(new Flight(
                data[i]['airline_iata'],
                data[i]['flight_number'],
                data[i]['dep_terminal'],
                data[i]['dep_gate'],
                data[i]['dep_time'],
                data[i]['arr_terminal'],
                data[i]['arr_time'],
                data[i]['arr_estimated'],
                data[i]['status'],
                data[i]['duration'],
                data[i]['delayed'],
                data[i]['dep_delayed'],
                data[i]['arr_delayed']
            ));
        }
        console.log(listFlights[0])
    }
}
let app = new App
app.runSession()