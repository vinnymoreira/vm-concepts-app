import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, MapPin, Thermometer, Eye, Wind, Droplets, Sun, Settings2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';

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
  const [showSettings, setShowSettings] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    default_city: '',
    temperature_unit: 'fahrenheit', // 'celsius' or 'fahrenheit'
    auto_refresh: true
  });
  
  // Define functions before using them
  const searchCities = async (searchTerm) => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setCityResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${searchTerm}&count=5&language=en&format=json`
      );
      
      if (!response.ok) throw new Error('City search failed');
      
      const data = await response.json();
      setCityResults(data.results || []);
    } catch (err) {
      console.error('City search error:', err);
      setCityResults([]);
    }
  };

  // Using OpenMeteo API (free, no API key required)
  const debouncedSearch = useDebounce(searchCities, 300);

  const loadUserPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('preference_type', 'weather')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setUserPreferences(data.preferences);
        setCity(data.preferences.default_city || '');
      }
    } catch (err) {
      console.error('Error loading user preferences:', err);
    }
  };

  const saveUserPreferences = async (newPreferences) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First try to update existing record
      const { data: updateData, error: updateError } = await supabase
        .from('user_preferences')
        .update({ 
          preferences: newPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('preference_type', 'weather')
        .select();

      if (updateError && updateError.code !== 'PGRST116') {
        // If update failed for reasons other than "no rows found", try insert
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            preference_type: 'weather',
            preferences: newPreferences
          });
        
        if (insertError) throw insertError;
      } else if (updateData && updateData.length === 0) {
        // No existing record found, insert new one
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            preference_type: 'weather',
            preferences: newPreferences
          });
        
        if (insertError) throw insertError;
      }
      
      // Update local state immediately
      setUserPreferences(newPreferences);
      
    } catch (err) {
      console.error('Error saving preferences:', err);
    }
  };

  useEffect(() => {
    loadUserPreferences();
  }, []);

  useEffect(() => {
    if (userPreferences.default_city) {
      fetchWeather(userPreferences.default_city);
    }
  }, [userPreferences.default_city, userPreferences.temperature_unit]);

  // Auto-refresh every 30 minutes if enabled
  useEffect(() => {
    if (userPreferences.auto_refresh && weather && userPreferences.default_city) {
      const interval = setInterval(() => {
        fetchWeather(userPreferences.default_city);
      }, 30 * 60 * 1000); // 30 minutes

      return () => clearInterval(interval);
    }
  }, [userPreferences.auto_refresh, weather, userPreferences.default_city]);

  const fetchWeather = async (searchCity) => {
    try {
      setLoading(true);
      setError(null);
      
      
      // First get coordinates for the city
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${searchCity}&count=1&language=en&format=json`
      );
      
      if (!geoResponse.ok) throw new Error('City search failed');
      
      const geoData = await geoResponse.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('City not found');
      }

      const { latitude, longitude, name, country } = geoData.results[0];
      
      // Get weather data from OpenMeteo
      const tempUnit = userPreferences.temperature_unit === 'celsius' ? 'celsius' : 'fahrenheit';
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&temperature_unit=${tempUnit}&wind_speed_unit=mph&precipitation_unit=inch&forecast_days=7`
      );
      
      if (!weatherResponse.ok) throw new Error('Weather data fetch failed');
      
      const data = await weatherResponse.json();
      
      setWeather({
        city: `${name}, ${country}`,
        current: {
          temperature: data.current.temperature_2m,
          feels_like: data.current.apparent_temperature,
          humidity: data.current.relative_humidity_2m,
          wind_speed: data.current.wind_speed_10m,
          visibility: data.current.visibility,
          precipitation: data.current.precipitation,
          weather_code: data.current.weather_code
        },
        daily: data.daily.time.slice(0, 7).map((date, index) => ({
          date,
          weather_code: data.daily.weather_code[index],
          temp_min: data.daily.temperature_2m_min[index],
          temp_max: data.daily.temperature_2m_max[index],
          precipitation: data.daily.precipitation_sum[index]
        }))
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch weather data. Please try again.');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = async (selectedCity) => {
    const cityString = `${selectedCity.name}, ${selectedCity.country}`;
    setCity(cityString);
    setShowCityResults(false);
    
    // Save as default city
    const newPreferences = {
      ...userPreferences,
      default_city: cityString
    };
    
    await saveUserPreferences(newPreferences);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setCity(value);
    setShowCityResults(true);
    debouncedSearch(value);
  };

  const toggleUnit = async () => {
    const newUnit = userPreferences.temperature_unit === 'celsius' ? 'fahrenheit' : 'celsius';
    const newPreferences = {
      ...userPreferences,
      temperature_unit: newUnit
    };
    
    await saveUserPreferences(newPreferences);
  };

  const clearDefault = async () => {
    const newPreferences = {
      ...userPreferences,
      default_city: ''
    };
    await saveUserPreferences(newPreferences);
    setWeather(null);
    setCity('');
  };

  const getWeatherIcon = (code) => {
    // OpenMeteo weather codes
    if (code === 0) return '☀️'; // Clear sky
    if (code <= 3) return '⛅'; // Partly cloudy
    if (code <= 48) return '🌫️'; // Fog
    if (code <= 57) return '🌧️'; // Drizzle
    if (code <= 67) return '🌧️'; // Rain
    if (code <= 77) return '❄️'; // Snow
    if (code <= 82) return '🌦️'; // Rain showers
    if (code <= 86) return '🌨️'; // Snow showers
    if (code <= 99) return '⛈️'; // Thunderstorm
    return '☁️'; // Default
  };

  const getLocalDateString = (dateString) => {
    const date = new Date(dateString);
    return {
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      monthDay: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    };
  };

  const isToday = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <div className="px-5 py-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Weather Forecast
            </h2>
            {weather && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <MapPin className="w-3 h-3" />
                {weather.city}
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Settings"
            >
              <Settings2 className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-300 ${showSettings ? 'rotate-45' : ''}`} />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        <div className={`transition-all duration-300 ease-in-out ${
          showSettings 
            ? 'max-h-96 opacity-100 mb-4 overflow-visible' 
            : 'max-h-0 opacity-0 mb-0 overflow-hidden'
        }`}>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={handleInputChange}
                  onFocus={() => setShowCityResults(true)}
                  onBlur={() => {
                    setTimeout(() => setShowCityResults(false), 200);
                  }}
                  placeholder="Search for a city..."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                />
                {showCityResults && cityResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {cityResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleCitySelect(result)}
                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-500 cursor-pointer text-gray-800 dark:text-gray-100"
                      >
                        {result.name}
                        {result.admin1 && `, ${result.admin1}`}
                        {result.country && `, ${result.country}`}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {userPreferences.default_city && (
                <button
                  onClick={clearDefault}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                >
                  Clear
                </button>
                )}
                <button
                  onClick={toggleUnit}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    userPreferences.temperature_unit === 'celsius'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500'
                  }`}
                >
                  °C
                </button>
                <button
                  onClick={toggleUnit}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    userPreferences.temperature_unit === 'fahrenheit'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500'
                  }`}
                >
                  °F
                </button>
              </div>

            </div>
          </div>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-500 dark:text-gray-400">Loading weather data...</span>
          </div>
        )}

        {weather && !loading && (
          <div className="space-y-4">
            {/* Current Weather */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl p-4 sm:p-6">
              {/* Main Temperature Display */}
              <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 sm:gap-4 text-center sm:text-left">
                  <div className="text-4xl sm:text-6xl">
                    {getWeatherIcon(weather.current.weather_code)}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1 justify-center sm:justify-start">
                      <span className="text-4xl sm:text-5xl font-bold text-gray-700 dark:text-gray-100">
                        {Math.round(weather.current.temperature)}
                      </span>
                      <span className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300">
                        °{userPreferences.temperature_unit === 'celsius' ? 'C' : 'F'}
                      </span>
                    </div>
                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-1">
                      Feels like {Math.round(weather.current.feels_like)}°
                    </p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Today</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              {/* Weather Details Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3 text-center">
                  <Droplets className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500 mx-auto mb-1 sm:mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Humidity</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {weather.current.humidity}%
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3 text-center">
                  <Wind className="w-4 sm:w-5 h-4 sm:h-5 text-green-500 mx-auto mb-1 sm:mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Wind</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {Math.round(weather.current.wind_speed)} mph
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3 text-center">
                  <Eye className="w-4 sm:w-5 h-4 sm:h-5 text-purple-500 mx-auto mb-1 sm:mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Visibility</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {Math.round(weather.current.visibility / 1609)} mi
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 sm:p-3 text-center">
                  <Thermometer className="w-4 sm:w-5 h-4 sm:h-5 text-orange-500 mx-auto mb-1 sm:mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Precipitation</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {weather.current.precipitation}"
                  </p>
                </div>
              </div>
            </div>

            {/* 7-Day Forecast - Hidden on mobile with toggle */}
            <div className="sm:block">
              {/* Mobile toggle button */}
              <div className="sm:hidden">
                <button
                  onClick={() => setShowForecast(!showForecast)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    7-Day Forecast
                  </h3>
                  <svg 
                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${showForecast ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Desktop title */}
              <div className="hidden sm:block">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  7-Day Forecast
                </h3>
              </div>

              {/* Forecast content with smooth transition */}
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                showForecast || window.innerWidth >= 640 
                  ? 'max-h-96 opacity-100 mt-3 sm:mt-0' 
                  : 'max-h-0 opacity-0 sm:max-h-none sm:opacity-100'
              }`}>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
                  {weather.daily.map((day, index) => {
                    const dateInfo = getLocalDateString(day.date);
                    return (
                      <div 
                        key={day.date} 
                        className={`p-2 sm:p-3 rounded-lg text-center transition-colors ${
                          isToday(day.date)
                            ? 'border border-indigo-300 dark:border-indigo-800' 
                            : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="text-lg sm:text-xl font-bold text-gray-500 dark:text-gray-400">
                          {isToday(day.date) ? 'Today' : dateInfo.weekday}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {dateInfo.monthDay}
                        </div>
                        <div className="text-xl sm:text-2xl mb-1">
                          {getWeatherIcon(day.weather_code)}
                        </div>
                        <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                          {Math.round(day.temp_min)}° | <span className="font-bold">{Math.round(day.temp_max)}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {!weather && !error && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sun className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">No location set</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Click the settings button above to search for a city
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCardWeather;