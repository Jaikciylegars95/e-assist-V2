import React, { useState, useEffect } from "react";
import { Calendar, Views } from "react-big-calendar";
import localizer from "./localizer"; // Vérifie que ce fichier exporte bien le localizer
import "react-big-calendar/lib/css/react-big-calendar.css";

const Calendrier = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/tasks');
        if (!response.ok) {
          throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const data = await response.json();

        const formattedEvents = data.map((task) => {
          const createdAt = task.created_at ? new Date(task.created_at) : null;
          const dueDate = task.due_date ? new Date(task.due_date) : null;

          const isValidStart = createdAt instanceof Date && !isNaN(createdAt);
          const isValidEnd = dueDate instanceof Date && !isNaN(dueDate);

          return {
            id: task.id,
            title: task.title || 'Tâche sans titre',
            start: isValidStart ? createdAt : new Date(),
            end: isValidEnd ? dueDate : new Date(),
          };
        });

        setEvents(formattedEvents);
      } catch (err) {
        console.error('Erreur lors de la récupération des tâches :', err);
        setError("Impossible de charger les tâches.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  if (loading) return <p>Chargement du calendrier...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ height: 600, padding: '1rem' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.MONTH}
        views={['month', 'week', 'day', 'agenda']}
        defaultDate={new Date()}
        style={{ height: '100%' }}
      />
    </div>
  );
};

export default Calendrier;
