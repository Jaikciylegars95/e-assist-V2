import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const DetailTache = ({ task, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: task.title || "",
    description: task.description || "",
    due_date: task.due_date ? task.due_date.split("T")[0] : "",
    status: task.status || "à faire",
    priority: task.priority || "faible",
  });

  const [creator, setCreator] = useState({ nom: "", prenom: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Token manquant, veuillez vous reconnecter.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde.");
      }

      const updatedTask = await response.json();
      onSave(updatedTask);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchCreator = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(`http://localhost:3001/api/users/${task.user_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (!response.ok) throw new Error("Utilisateur non trouvé");
  
        const data = await response.json();
        setCreator({ nom: data.nom, prenom: data.prenom, poste: data.poste });
      } catch (error) {
        console.error("Erreur lors de la récupération du créateur :", error.message);
      }
    };
  
    if (task.user_id) {
      fetchCreator();
    }
  }, [task.user_id]);
  

  return (
    <div className="min-h-screen w-full bg-gradient-to-tr from-blue-100 via-white to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto py-20 px-4"
      >
        <h1 className="text-4xl font-bold text-center text-gray-800 dark:text-white mb-10">
          Modifier la tâche
        </h1>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Colonne 1 */}
          <div className="space-y-6">
            {/* Créé par */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Créé par
              </label>
              <input
                type="text"
                value={`${creator.prenom} ${creator.nom}`}
                disabled
                className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-not-allowed"
              />
            </div>

            {/* Date de mise à jour */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Dernière mise à jour
              </label>
              <input
                type="text"
                value={new Date(task.updated_at).toLocaleString()}
                disabled
                className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-not-allowed"
              />
            </div>

            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Titre
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              ></textarea>
            </div>
          </div>

          {/* Colonne 2 */}
          <div className="space-y-6">
            {/* Date limite */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date limite
              </label>
              <input
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Statut
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="todo">À faire</option>
                <option value="in-progress">En cours</option>
                <option value="completed">Terminé</option>
              </select>
            </div>

            {/* Priorité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Priorité
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="low">Faible</option>
                <option value="medium">Modéré</option>
                <option value="high">Ultra</option>
              </select>
            </div>

            {error && (
              <p className="text-red-500 font-semibold">{error}</p>
            )}

            {/* Boutons */}
            <div className="flex justify-between items-center mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-800 dark:text-white bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default DetailTache;
