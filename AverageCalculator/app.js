const http = require('http');
const axios = require('axios');

const PORT = 9876;
const WINDOW_SIZE = 10;
const THIRD_PARTY_API_URLS = {
    'p': 'http://20.244.56.144/test/primes',
    'f': 'http://20.244.56.144/test/fibo',
    'e': 'http://20.244.56.144/test/even',
    'r': 'http://20.244.56.144/test/random'
};

let windowPrevState = [];
let windowCurrState = [];

const fetchNumbers = async (type) => {
    try {
        const response = await axios.get(THIRD_PARTY_API_URLS[type], { timeout: 500 });
        return response.data.numbers;
    } catch (error) {
        console.error('Error fetching numbers:', error);
        return [];
    }
};

const updateWindowState = (newNumbers) => {
    windowPrevState = [...windowCurrState];
    windowCurrState = [...windowCurrState, ...newNumbers];

    windowCurrState = [...new Set(windowCurrState)];
    if (windowCurrState.length > WINDOW_SIZE) {
        windowCurrState = windowCurrState.slice(windowCurrState.length - WINDOW_SIZE);
    }
};

const calculateAverage = (numbers) => {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return (sum / numbers.length).toFixed(2);
};

const server = http.createServer(async (req, res) => {
    const urlParts = req.url.split('/');
    
    if (urlParts.length !== 3 || urlParts[1] !== 'numbers' || !THIRD_PARTY_API_URLS[urlParts[2]]) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request or number ID' }));
        return;
    }

    const numberid = urlParts[2];
    const newNumbers = await fetchNumbers(numberid);
    updateWindowState(newNumbers);

    const avg = calculateAverage(windowCurrState);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        windowPrevState,
        windowCurrState,
        numbers: newNumbers,
        avg
    }));
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
