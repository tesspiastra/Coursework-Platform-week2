import axios from 'axios';
const COUNTRY_URL = "https://restcountries.com/v3.1/name/";
let getCountry = async (country) => {
    const response = await axios.get(`${COUNTRY_URL}${country}`);
    const allData = response.data[0];
    console.log(`Country name: ${allData["name"]["common"]}${allData["flags"]["png"]}\nCurrency: ${allData["currencies"]}\nLanguage(s):${allData["languages"]}\nContinent: ${allData["continents"][0]}`);
};
getCountry("france");
