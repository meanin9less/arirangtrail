import React, {useState, useEffect} from 'react'; // React import 추가
import axios from 'axios';

interface WeatherData {
    temp: number;
    weather_description: string;
    weather_icon: string;
}

interface WeatherWidgetProps {
    lat: string;
    lon: string;
}

const WeatherWidget = ({lat, lon}: WeatherWidgetProps) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [locationName, setLocationName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!lat || !lon) return;

        const fetchWeather = async () => {
            const WEATHER_API_KEY = "6eb22eb8826c742adcfd3a174effc4f5";
            const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=kr`;
            const geoApiUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${WEATHER_API_KEY}`;

            try {
                // 두 개의 API를 동시에 요청해서 더 빠르게 데이터를 가져옴
                const [weatherResponse, geoResponse] = await Promise.all([
                    axios.get(weatherApiUrl),
                    axios.get(geoApiUrl)
                ]);

                // 날씨 데이터 설정
                const weatherData = weatherResponse.data;
                setWeather({
                    temp: weatherData.main.temp,
                    weather_description: weatherData.weather[0].description,
                    weather_icon: weatherData.weather[0].icon,
                });

                // 지역명 데이터 설정 (geoResponse의 첫번째 결과의 지역 이름)
                const locationData = geoResponse.data;
                if (locationData && locationData.length > 0) {
                    const koreanName = locationData[0].local_names.ko || locationData[0].name;
                    setLocationName(koreanName);
                }

                setError(null);
            } catch (e) {
                console.error("날씨/지역 정보 로딩 실패:", e);
                setError("정보를 불러올 수 없습니다.");
            }
        };

        fetchWeather();
    }, [lat, lon]);

    if (error) return <div className="sidebar-section weather-section"><p>{error}</p></div>;
    if (!weather) return <div className="sidebar-section weather-section"><p>날씨 정보 로딩 중...</p></div>;

    return (
        <div className="sidebar-section weather-section">
            <h3 className="sidebar-title">{locationName} 날씨</h3>
            <div className="weather-content">
                <img
                    src={`https://openweathermap.org/img/wn/${weather.weather_icon}@2x.png`}
                    alt={weather.weather_description}
                    className="weather-icon"
                />
                <div className="weather-info">
                    <p className="weather-temp">{Math.round(weather.temp)}°C</p>
                    <p className="weather-desc">{weather.weather_description}</p>
                </div>
            </div>
        </div>
    );
};

export default WeatherWidget;