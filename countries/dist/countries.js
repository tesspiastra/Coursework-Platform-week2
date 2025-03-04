import axios from 'axios';
import { input } from '@inquirer/prompts';
const COUNTRY_URL = "https://restcountries.com/v3.1/name/";
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
        console.log(`Country name: ${this.name} ${this.flag}\nCurrency: ${this.currency}\nLanguage(s): ${this.language}\nContinent: ${this.continent}\nPopulation: ${this.population} people`);
    }
}
class App {
    constructor() { }
    async getCountry(country) {
        const response = await axios.get(`${COUNTRY_URL}${country}`);
        const allData = response.data[0];
        const name = allData["name"]["common"];
        const flag = allData["flag"];
        const currCode = Object.keys(allData["currencies"])[0];
        const currencies = allData["currencies"][currCode]?.name;
        const language = allData["languages"][Object.keys(allData["languages"])[0]];
        const continent = allData["continents"][0];
        const population = allData["population"];
        const newCountry = new Country(name, flag, currencies, language, continent, population);
        newCountry.showCountry();
    }
    async startSession() {
        let search = await input({ message: "What country do you want to search for? (type 'exit' to quit interface)" });
        while (search != 'exit') {
            await this.getCountry(search);
            search = await input({ message: "You may search again:" });
        }
    }
}
let app = new App;
app.startSession();
