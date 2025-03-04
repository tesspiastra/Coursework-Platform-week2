import axios from 'axios';
import {input, select} from '@inquirer/prompts';

const COUNTRY_URL = "https://restcountries.com/v3.1/name/"

class APIError{
    message: string;
    code: number;
    constructor(message: string, code: number = 500){
        this.message = message
        this.code = code

    }
}

class Country {
    name: string;
    flag: string;
    currency: string;
    language: string;
    continent: string;
    population: string;

    constructor(name: string,flag: string,currency: string,language: string,continent: string, population: string){
        this.name = name
        this.flag = flag
        this.currency = currency
        this.language = language
        this.continent = continent
        this.population = population
    }
    showCountry(){
        console.log(`Country name: ${this.name} ${this.flag}\nCurrency: ${this.currency}\nLanguage(s): ${this.language}\nContinent: ${this.continent}\nPopulation: ${this.population} people`)
    }
}

class App {
    constructor(){}

    async getCountry (country: string) {
        const response = await axios.get(`${COUNTRY_URL}${country}`)
        if (response.status === 200){
            if (response.data.length > 1){

            }
            const allData = response.data[0]
            
            const name = allData["name"]["common"]
            const flag = allData["flag"]
            const currCode = Object.keys(allData["currencies"])[0]
            const currencies = allData["currencies"][currCode as keyof typeof allData["currencies"]]?.name
            const language = allData["languages"][Object.keys(allData["languages"])[0]]
            const continent = allData["continents"][0]
            const population = allData["population"]

            const newCountry = new Country(name,flag,currencies,language,continent,population)
            newCountry.showCountry()
        }
        if ((response.status).toString()[0] === '4'){
            throw new APIError("Could not find the specified country", response.status)
        }
        if ((response.status).toString()[0] === '5'){
            throw new APIError("There was an internal issue", response.status)
        }
        
    }
    async startSession (){
        let search = await input({message: "What country do you want to search for? (type 'exit' to quit interface)"})
        while (search != 'exit'){
            try{
                await this.getCountry(search)
                search = await input({message: "You may search again:"})
            }
            catch (APIError){
                search = await input({message: "Please amend your search:"})
            }
    }  
    }
    async giveOptions(data: {name:string}[]){
        console.log("There are several options for your search:\n")
    
        const choices = data.map(country => ({
        name: country.name,
        value: country.name,
        description: `Select ${country.name}`
        }));

        const answer = await select({
            message: 'Select the country out of the options',
            choices: choices
        });

        answer
    }
}



let app = new App
app.startSession()