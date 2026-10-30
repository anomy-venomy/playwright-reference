/**
 * Country → State → City reference data used by the cascading address dropdowns.
 * Served by GET /api/locations and used to validate employee addresses.
 */
export const LOCATIONS = {
    India: {
        Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur'],
        Maharashtra: ['Mumbai', 'Pune', 'Nagpur'],
        Karnataka: ['Bengaluru', 'Mysuru', 'Mangaluru'],
        Delhi: ['New Delhi'],
    },
    'United States': {
        California: ['San Francisco', 'Los Angeles', 'San Diego'],
        'New York': ['New York City', 'Buffalo'],
        Texas: ['Austin', 'Dallas', 'Houston'],
    },
    'United Kingdom': {
        England: ['London', 'Manchester', 'Birmingham'],
        Scotland: ['Edinburgh', 'Glasgow'],
    },
    Germany: {
        Bavaria: ['Munich', 'Nuremberg'],
        Berlin: ['Berlin'],
    },
};
export function isValidLocation(country, state, city) {
    return Boolean(LOCATIONS[country]?.[state]?.includes(city));
}
