import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, X } from 'lucide-react';

const useDebounce = (callback, delay) => {
  const timeoutRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

const DashboardCardWeather = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [city, setCity] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [showCityResults, setShowCityResults] = useState(false);
  const [defaultCity, setDefaultCity] = useState(() => {
    return localStorage.getItem('defaultWeatherCity') || '';
  });
  const [isCelsius, setIsCelsius] = useState(() => {
    // Get saved temperature unit preference, default to false (Fahrenheit)
    return localStorage.getItem('weatherUnitPreference') === 'celsius';
  });
  
  const API_KEY = 'bf54c688ca4583bbbe511ed3b22eef33';

  useEffect(() => {
    if (defaultCity) {
      fetchWeather(defaultCity);
    }
  }, []);

  const searchCities = async (searchTerm) => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setCityResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${searchTerm}&limit=5&appid=${API_KEY}`
      );
      
      if (!response.ok) throw new Error('City search failed');
      
      const data = await response.json();
      setCityResults(data.map(city => ({
        name: city.name,
        state: city.state,
        country: city.country,
        lat: city.lat,
        lon: city.lon
      })));
    } catch (err) {
      console.error('City search error:', err);
      setCityResults([]);
    }
  };

  const debouncedSearch = useDebounce(searchCities, 300);

  const getLocalDateString = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Use local timezone
    });
  };

  const fetchWeather = async (searchCity) => {
    try {
      setLoading(true);
      setError(null);
      
      const geoResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${searchCity}&limit=1&appid=${API_KEY}`
      );
      
      if (!geoResponse.ok) throw new Error('City search failed');
      
      const geoData = await geoResponse.json();
      
      if (geoData.length === 0) {
        throw new Error('City not found');
      }

      const { lat, lon } = geoData[0];
      
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${isCelsius ? 'metric' : 'imperial'}`
      );
      
      if (!weatherResponse.ok) throw new Error('Weather data fetch failed');
      
      const data = await weatherResponse.json();
      
      const dailyData = data.list.reduce((acc, item) => {
        // Use local date for grouping
        const localDate = new Date(item.dt * 1000).toLocaleDateString(undefined, {
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
        
        if (!acc[localDate]) {
          acc[localDate] = {
            dt: item.dt,
            temp_min: item.main.temp,
            temp_max: item.main.temp,
            weather: item.weather[0],
            main: item.main,
            localDate // Store the local date
          };
        } else {
          acc[localDate].temp_min = Math.min(acc[localDate].temp_min, item.main.temp);
          acc[localDate].temp_max = Math.max(acc[localDate].temp_max, item.main.temp);
        }
        return acc;
      }, {});
      
      // Sort the days to ensure they're in chronological order
      const sortedData = Object.values(dailyData)
        .sort((a, b) => a.dt - b.dt)
        .slice(0, 5);
      
      setWeather({
        city: data.city.name,
        forecast: sortedData
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch weather data. Please try again.');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (selectedCity) => {
    const cityString = `${selectedCity.name}${selectedCity.state ? `, ${selectedCity.state}` : ''}, ${selectedCity.country}`;
    setCity(cityString);
    setShowCityResults(false);
    
    // Automatically set as default city
    localStorage.setItem('defaultWeatherCity', cityString);
    setDefaultCity(cityString);
    
    fetchWeather(cityString);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setCity(value);
    setShowCityResults(true);
    debouncedSearch(value);
  };

  const clearDefault = () => {
    localStorage.removeItem('defaultWeatherCity');
    setDefaultCity('');
    setWeather(null);
    setCity('');
  };

  const toggleUnit = () => {
    const newValue = !isCelsius;
    setIsCelsius(newValue);
    // Save unit preference to localStorage
    localStorage.setItem('weatherUnitPreference', newValue ? 'celsius' : 'fahrenheit');
    if (weather) {
      fetchWeather(weather.city);
    }
  };

  const getWeatherIcon = (code) => {
    if (code >= 200 && code < 300) return '⛈️';
    if (code >= 300 && code < 400) return '🌧️';
    if (code >= 500 && code < 600) return '🌧️';
    if (code >= 600 && code < 700) return '❄️';
    if (code >= 700 && code < 800) return '🌫️';
    if (code === 800) return '☀️';
    return '☁️';
  };

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <div className="px-5 py-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {weather ? `${weather.city} Weather Forecast` : 'Weather Forecast'}
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <input
                type="text"
                value={city}
                onChange={handleInputChange}
                onFocus={() => setShowCityResults(true)}
                onBlur={() => {
                  setTimeout(() => setShowCityResults(false), 200);
                }}
                placeholder="Search for a city..."
                className="w-full sm:w-64 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-gray-100"
              />
              {showCityResults && cityResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                  {cityResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => handleCitySelect(result)}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-800 dark:text-gray-100"
                    >
                      {result.name}
                      {result.state && `, ${result.state}`}, {result.country}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {weather && (
              <button
                onClick={toggleUnit}
                className="btn bg-gray-100 hover:bg-gray-200"
              >
                {isCelsius ? '°C' : '°F'}
              </button>
            )}
            
            {defaultCity && (
              <button
                onClick={clearDefault}
                className="btn bg-gray-100 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="text-red-500 mb-4">{error}</div>
        )}

        {weather && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {weather.forecast.map((day) => (
              <div 
                key={day.dt} 
                className={`${
                  new Date(day.dt * 1000).toLocaleDateString(undefined, {
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                  }) === new Date().toLocaleDateString() 
                    ? 'bg-gray-200 dark:bg-gray-600' 
                    : 'bg-gray-50 dark:bg-gray-700'
                } p-4 rounded-lg text-center`}
              >
                <div className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  {getLocalDateString(day.dt)}
                </div>
                <div className="text-3xl mb-2">
                  {getWeatherIcon(day.weather.id)}
                </div>
                <div className="flex justify-center items-center gap-2">
                  <div className="text-md font-semibold text-gray-800 dark:text-gray-100">
                    {Math.round(day.temp_min)}°
                  </div>
                  <div className="text-md font-semibold text-gray-800 dark:text-gray-100">
                    {Math.round(day.temp_max)}°{isCelsius ? 'C' : 'F'}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {day.weather.description}
                </div>
              </div>
            ))}
          </div>
        )}

        {!weather && !error && !loading && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Search for a city to see the weather forecast
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCardWeather;