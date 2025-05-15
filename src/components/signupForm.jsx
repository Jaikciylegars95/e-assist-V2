import React, { useState, useEffect} from 'react' 
import { motion } from 'framer-motion'
import { Lock, Mail, User } from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const SignupForm = () => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    dateNaissance: '',
    poste: '',
    dateEmbauche: ''
  })
  const [users, setUsers] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    try {
      await axios.post('http://localhost:3001/api/users', formData)
      setMessage('Utilisateur ajouté avec succès !')
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        dateNaissance: '',
        poste: '',
        dateEmbauche: ''
      })
      fetchUsers()
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.error || "Une erreur s'est produite lors de l'inscription")
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <motion.h2
        className="text-3xl font-bold text-gray-900 text-center mb-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Inscription
      </motion.h2>

      {message && (
        <motion.div
          className="p-3 bg-green-100 text-green-700 rounded-md text-sm mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {message}
        </motion.div>
      )}
      {error && (
        <motion.div
          className="p-3 bg-red-100 text-red-700 rounded-md text-sm mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-6 rounded-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'nom', label: 'Nom', icon: <User className="h-5 w-5 text-gray-400" />, type: 'text' },
            { id: 'prenom', label: 'Prénom', icon: <User className="h-5 w-5 text-gray-400" />, type: 'text' },
            { id: 'email', label: 'Email', icon: <Mail className="h-5 w-5 text-gray-400" />, type: 'email' },
            { id: 'password', label: 'Mot de passe', icon: <Lock className="h-5 w-5 text-gray-400" />, type: 'password' },
            { id: 'dateNaissance', label: 'Date de naissance', type: 'date' },
            { id: 'poste', label: 'Poste', type: 'text' },
            { id: 'dateEmbauche', label: "Date d'embauche", type: 'date' }
          ].map(({ id, label, icon, type }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <div className="relative">
                {icon && (
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {icon}
                  </div>
                )}
                <input
                  id={id}
                  name={id}
                  type={type}
                  required
                  value={formData[id]}
                  onChange={handleChange}
                  className={`block w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all`}
                  placeholder={type !== 'date' ? `Entrez votre ${label.toLowerCase()}` : ''}
                />
              </div>
            </div>
          ))}
        </div>

        <motion.button
          type="submit"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          S'inscrire
        </motion.button>
      </form>

      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Liste des utilisateurs</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-200">
                {['ID', 'Nom', 'Prénom'].map((header, i) => (
                  <th key={i} className="border border-gray-300 p-2 text-left">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td className="border border-gray-300 p-2">{user.id}</td>
                  <td className="border border-gray-300 p-2">{user.nom}</td>
                  <td className="border border-gray-300 p-2">{user.prenom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SignupForm
