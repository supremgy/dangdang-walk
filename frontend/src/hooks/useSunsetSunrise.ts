import { fetchSunsetSunrise } from '@/api/weather';
import { queryKeys } from '@/constants';
import { Position } from '@/models/location';
import { getCurrentDate } from '@/utils/date';
import { useQuery } from '@tanstack/react-query';

const useSunsetSunrise = (position: Position | null) => {
    const queryKey = [queryKeys.SUNSET_SUNRISE, position?.lat, position?.lng];
    const {
        data: sunsetSunriseData,
        error: sunsetSunriseError,
        isPending: isSunsetSunrisePending,
    } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!position) return;
            return await fetchSunsetSunrise(
                getCurrentDate(new Date()),
                Math.floor(position.lat * 100),
                Math.floor(position.lng * 100)
            );
        },
        enabled: !!position,
        staleTime: 7200,
    });

    return {
        isSunsetSunrisePending,
        sunset: sunsetSunriseData?.sunset,
        sunsetSunriseError,
        sunrise: sunsetSunriseData?.sunrise,
    };
};

export default useSunsetSunrise;
