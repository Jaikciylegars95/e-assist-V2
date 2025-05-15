// authService.js
import axios from 'axios'

// Centralisation de l’URL API (tu peux aussi la mettre dans config.js)
export const API_URL = 'http://localhost:3001/api'

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password })

    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Login failed')
    }
    throw new Error('Unable to connect to the server')
  }
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

export const getToken = () => localStorage.getItem('token')

export const isAuthenticated = () => !!getToken()
