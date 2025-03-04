import axios, { AxiosError } from 'axios';
import { input, select } from '@inquirer/prompts';
const COUNTRY_URL = "https://restcountries.com/v3.1/name/";
class APIError {
    message;
    code;
    constructor(message, code = 500) {
        this.message = message;
        this.code = code;
    }
}
class Country {
    name;
    flag;
    currency;
    language;
    continent;
    population;
    constructor(name, flag, currency, language, continent, population) {
        this.name = name;
        this.flag = flag;
        this.currency = currency;
        this.language = language;
        this.continent = continent;
        this.population = population;
    }
    showCountry() {
        console.log(`~~~~~*~~~~~*~~~~~\n\nCountry name: ${this.name} ${this.flag}\nCurrency: ${this.currency}\nLanguage(s): ${this.language}\nContinent: ${this.continent}\nPopulation: ${this.population} people\n\n~~~~~*~~~~~*~~~~~`);
    }
}
class App {
    constructor() { }
    async getCountry(country) {
        try {
            const response = await axios.get(`${COUNTRY_URL}${country}`);
            const data = response.data;
            if (data.length > 1) {
                let choice = await this.giveOptions(data);
                for (let i = 0; i < data.length; i++) {
                    if (data[i].name.common === choice) {
                        const newCountry = this.structureCountry(data[i]);
                        newCountry.showCountry();
                    }
                }
            }
            else {
                const allData = response.data[0];
                // console.log(allData)
                const newCountry = this.structureCountry(allData);
                newCountry.showCountry();
            }
        }
        catch (error) {
            if (error instanceof AxiosError) {
                if (error.response?.status.toString()[0] === '4') {
                    throw new APIError("Could not find the specified country", error.response.status);
                }
                if (error.response?.status.toString()[0] === '5') {
                    console.log(error.status);
                    throw new APIError("There was an internal issue", error.response.status);
                }
            }
        }
    }
    structureCountry(country) {
        const name = country.name.common;
        const flag = country.flag;
        const currCode = Object.keys(country.currencies)[0];
        const currencies = currCode ? country.currencies[currCode].name : "Unknown";
        const languageCode = Object.keys(country.languages)[0];
        const language = languageCode ? country.languages[languageCode] : "Unknown";
        const continent = country.continents[0];
        const population = country.population;
        const newCountry = new Country(name, flag, currencies, language, continent, population);
        return newCountry;
    }
    async startSession() {
        console.log("~~~~~~~~~~~~~~~~~~~~~\nWelcome to the country searcher!\n~~~~~~~~~~~~~~~~~~~~~\n\n");
        let search = await input({ message: "What country do you want to search for? (type 'exit' to quit interface)" });
        while (search != 'exit') {
            try {
                await this.getCountry(search);
                search = await input({ message: "You may search again, or exit:" });
            }
            catch (error) {
                if (error instanceof APIError) {
                    console.log(`ERROR: ${error.message} ${error.code}`);
                }
                else {
                    console.log(`UNKNOWN ERROR: ${error}`);
                }
                search = await input({ message: "Please search again or exit:" });
            }
        }
    }
    async giveOptions(data) {
        console.log("There are several options for your search:\n");
        const choices = data.map(country => ({
            name: country.name.common,
            value: country.name.common,
            description: `Select ${country.name.common}?`
        }));
        const answer = await select({
            message: 'Select the country out of the options',
            choices: choices
        });
        console.log("You chose " + answer);
        return answer;
    }
}
let app = new App;
app.startSession();
