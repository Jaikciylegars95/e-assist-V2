import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DetailTache from "../components/detailTache";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setTask(null); // Reset task to avoid stale data
        setLoading(true); // Ensure loading state is set
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("Aucun token trouvé, redirection vers /login");
          navigate("/login");
          return;
        }

        const response = await fetch(`http://localhost:3001/api/tasks/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          if (response.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }
          throw new Error(data.error || "Tâche non trouvée");
        }

        const data = await response.json();
        console.log("TaskDetailPage API response for ID", id, ":", data); // Debug response
        setTask(data);
      } catch (err) {
        console.error("Erreur lors de la récupération de la tâche:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id, navigate]);

  const handleClose = () => {
    navigate(-1);
  };

  const handleSave = (updatedTask) => {
    setTask(updatedTask);
    toast.success("Tâche sauvegardée avec succès !", {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      pauseOnFocusLoss: true,
    });
    navigate("/tasks");
  };

  if (loading) return <p className="p-5 text-center text-gray-500 dark:text-gray-400">Chargement de la tâche...</p>;
  if (error) return <p className="p-5 text-center text-red-500">Erreur : {error}</p>;
  if (!task) return <p className="p-5 text-center text-gray-500 dark:text-gray-400">Tâche non trouvée</p>;

  return (
    <div className="p-5">
      <DetailTache key={id} task={task} onClose={handleClose} onSave={handleSave} />
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        pauseOnFocusLoss
      />
    </div>
  );
};

export default TaskDetailPage;