import axios from 'axios';

export const API_URL = 'https://platanadas.com/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;