import React, { useState, useEffect } from "react";
import { Calendar, Views } from "react-big-calendar";
import localizer from "./localizer";
import { useNavigate } from "react-router-dom";
import "react-big-calendar/lib/css/react-big-calendar.css";

const Calendrier = ({ theme }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:3001/api/tasks", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);

        const data = await response.json();

        const formattedEvents = data.map((task) => {
          const startDate = task.created_at ? new Date(task.created_at) : new Date();
          const endDate = task.due_date ? new Date(task.due_date) : new Date();

          const isValidStart = startDate instanceof Date && !isNaN(startDate);
          const isValidEnd = endDate instanceof Date && !isNaN(endDate);

          return {
            id: task.id,
            title: task.title || "Tâche sans titre",
            start: isValidStart ? startDate : new Date(),
            end: isValidEnd ? endDate : new Date(),
            status: task.status || "todo",
            priority: task.priority || "low",
          };
        });

        setEvents(formattedEvents);
      } catch (err) {
        console.error("Erreur lors de la récupération des tâches :", err);
        setError("Impossible de charger les tâches.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const eventStyleGetter = (event) => {
    let backgroundColor = "#3174ad"; // Couleur par défaut

    switch (event.status) {
      case "todo":
      case "à faire":
        backgroundColor = "#f39c12";
        break;
      case "in_progress":
      case "en cours":
        backgroundColor = "#3498db";
        break;
      case "done":
      case "terminé":
        backgroundColor = "#2ecc71";
        break;
      default:
        backgroundColor = "#7f8c8d";
    }

    // Surcharge selon la priorité
    switch (event.priority) {
      case "low":
      case "faible":
        backgroundColor = "#bdc3c7"; // Gris - Faible
        break;
      case "medium":
      case "modéré":
        backgroundColor = "#9b59b6"; // Violet - Modéré
        break;
      case "high":
      case "ultra":
        backgroundColor = "#e74c3c"; // Rouge - Ultra
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "5px",
        color: "white",
        border: "none",
        padding: "2px 6px",
        fontWeight: "600",
        fontSize: "0.85rem",
        whiteSpace: "normal",
        overflow: "hidden",
        textOverflow: "ellipsis",
        lineHeight: "1.2",
      },
    };
  };

  const handleEventClick = (event) => {
    navigate(`/tasks/${event.id}`);
  };

  if (loading) return <p>Chargement du calendrier...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div
      style={{
        height: 650,
        padding: "1rem",
        backgroundColor: theme === "dark" ? "#121212" : "#f9fafb",
        color: theme === "dark" ? "#eee" : "#222",
        borderRadius: 8,
        boxShadow: theme === "dark" ? "0 0 15px rgba(0,0,0,0.9)" : "0 0 15px rgba(0,0,0,0.1)",
      }}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.MONTH}
        views={["month", "week", "day", "agenda"]}
        defaultDate={new Date()}
        style={{ height: "90%" }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleEventClick}
        messages={{
          next: "Suivant",
          previous: "Précédent",
          today: "Aujourd'hui",
          month: "Mois",
          week: "Semaine",
          day: "Jour",
          agenda: "Agenda",
          date: "Date",
          time: "Heure",
          event: "Événement",
          allDay: "Toute la journée",
          noEventsInRange: "Aucun événement dans cette plage",
          showMore: (total) => `+${total} plus`,
        }}
      />

      {/* Légendes */}
      <div
        style={{
          marginTop: 15,
          display: "flex",
          justifyContent: "center",
          gap: 30,
          fontSize: "0.9rem",
          userSelect: "none",
          flexWrap: "wrap",
        }}
      >
        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{ width: 18, height: 18, backgroundColor: "#f39c12", borderRadius: 4, border: "1px solid #d78b13" }}
          />
          <span>À faire</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{ width: 18, height: 18, backgroundColor: "#3498db", borderRadius: 4, border: "1px solid #2a7abf" }}
          />
          <span>En cours</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{ width: 18, height: 18, backgroundColor: "#2ecc71", borderRadius: 4, border: "1px solid #27ae60" }}
          />
          <span>Terminé</span>
        </div>

        {/* Priorités */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{ width: 18, height: 18, backgroundColor: "#bdc3c7", borderRadius: 4, border: "1px solid #95a5a6" }}
          />
          <span>Faible</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{ width: 18, height: 18, backgroundColor: "#9b59b6", borderRadius: 4, border: "1px solid #8e44ad" }}
          />
          <span>Modéré</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{ width: 18, height: 18, backgroundColor: "#e74c3c", borderRadius: 4, border: "1px solid #c0392b" }}
          />
          <span>Ultra</span>
        </div>
      </div>
    </div>
  );
};

export default Calendrier;
