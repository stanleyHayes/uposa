import { useCallback, useEffect, useState } from 'react'
// Deep imports keep the package's world city dataset (~8 MB raw / ~2.2 MB gzipped)
// out of the static graph: only the country + state datasets are bundled here.
import Country from 'country-state-city/lib/country'
import State from 'country-state-city/lib/state'

type CityModule = typeof import('country-state-city/lib/city')

let cityModule: Promise<CityModule> | null = null

// The city dataset lives in its own chunk and is fetched the first time a city
// list is actually needed; the promise is shared so it is only fetched once.
function loadCityModule(): Promise<CityModule> {
  cityModule ??= import('country-state-city/lib/city').catch((error: unknown) => {
    cityModule = null // allow a retry after a failed chunk fetch
    throw error
  })
  return cityModule
}

export const countryOptions: string[] = Country.getAllCountries().map((country) => country.name)

function countryIso(countryName: string): string | undefined {
  return Country.getAllCountries().find((country) => country.name === countryName)?.isoCode
}

export function stateOptions(countryName: string): string[] {
  const iso = countryIso(countryName)
  if (!iso) return []
  return State.getStatesOfCountry(iso).map((state) => state.name)
}

export async function loadCityOptions(countryName: string, stateName: string): Promise<string[]> {
  const iso = countryIso(countryName)
  if (!iso) return []
  const state = State.getStatesOfCountry(iso).find((entry) => entry.name === stateName)
  if (!state) return []
  const { default: City } = await loadCityModule()
  const cities = City.getCitiesOfState(iso, state.isoCode).map((city) => city.name)
  // The dataset is not exhaustive for smaller towns — always allow "Other".
  return [...cities, 'Other']
}

/**
 * City options for a country/state pair. Nothing is fetched until `load()` is
 * called (e.g. when a region is picked or the city dropdown is opened); after
 * that, the list follows the country/state pair.
 */
export function useCityOptions(countryName: string, stateName: string) {
  const [requested, setRequested] = useState(false)
  const [loaded, setLoaded] = useState<{ key: string; options: string[] }>({ key: '', options: [] })
  const key = countryName && stateName ? `${countryName}\n${stateName}` : ''

  useEffect(() => {
    if (!requested || !key) return
    let active = true
    loadCityOptions(countryName, stateName)
      // If the chunk cannot be fetched (offline, stale deploy) still offer "Other".
      .catch(() => ['Other'])
      .then((options) => {
        if (active) setLoaded({ key, options })
      })
    return () => {
      active = false
    }
  }, [requested, key, countryName, stateName])

  const load = useCallback(() => setRequested(true), [])
  const ready = loaded.key === key

  return {
    options: key && ready ? loaded.options : [],
    loading: Boolean(key) && requested && !ready,
    load,
  }
}
