import { City, Country, State } from 'country-state-city';

export const countryOptions: string[] = Country.getAllCountries().map((country) => country.name);

function countryIso(countryName: string): string | undefined {
  return Country.getAllCountries().find((country) => country.name === countryName)?.isoCode;
}

export function stateOptions(countryName: string): string[] {
  const iso = countryIso(countryName);
  if (!iso) return [];
  return State.getStatesOfCountry(iso).map((state) => state.name);
}

export function cityOptions(countryName: string, stateName: string): string[] {
  const iso = countryIso(countryName);
  if (!iso) return [];
  const state = State.getStatesOfCountry(iso).find((entry) => entry.name === stateName);
  if (!state) return [];
  const cities = City.getCitiesOfState(iso, state.isoCode).map((city) => city.name);
  // The dataset is not exhaustive for smaller towns — always allow "Other".
  return [...cities, 'Other'];
}
