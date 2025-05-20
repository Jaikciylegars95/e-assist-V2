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
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:3001/api/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Tâche non trouvée");

        const data = await response.json();
        setTask(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  const handleClose = () => {
    navigate(-1);
  };

  const handleSave = (updatedTask) => {
    setTask(updatedTask);
    toast.success("Tâche sauvegardée avec succès !");
    setTimeout(() => {
        window.location.href = "/tasks";
    }, 3000);
  };
  

  if (loading) return <p>Chargement de la tâche...</p>;
  if (error) return <p style={{ color: "red" }}>Erreur : {error}</p>;

  return (
    <>
      <DetailTache task={task} onClose={handleClose} onSave={handleSave} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        pauseOnFocusLoss
      />
    </>
  );
};

export default TaskDetailPage;
