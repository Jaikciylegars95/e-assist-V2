import React from 'react';
import { Globe } from 'lucide-react';

function AboutPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">À propos de E-assist</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {/* À propos de E-assist */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-3">
            <Globe size={20} className="mt-0.5 text-gray-500 dark:text-gray-400" />
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">E-assist</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                E-assist est une application de gestion de tâches conçue pour simplifier la collaboration et l'organisation. 
                Elle permet aux utilisateurs de gérer leurs tâches, de communiquer en temps réel via une intégration avec des plateformes comme Rocket.Chat, 
                et de personnaliser leur expérience avec des thèmes clairs et sombres.
              </p>
            </div>
          </div>
        </div>

        {/* Développeur */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Développeur</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            E-assist a été développé par <span className="font-medium text-gray-900 dark:text-white">RANDRIAMANANTENA Jacky Heriniaina</span>, 
            un passionné de technologie dédié à la création de solutions intuitives et performantes pour la productivité.
          </p>
        </div>

        {/* Objectifs de création */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Objectifs de création</h2>
          <ul className="list-disc pl-5 text-sm text-gray-500 dark:text-gray-400 space-y-2">
            <li>Simplifier la gestion des tâches pour les équipes et les individus.</li>
            <li>Fournir une interface utilisateur intuitive et personnalisable.</li>
            <li>Intégrer des fonctionnalités de communication en temps réel pour une collaboration fluide.</li>
            <li>Offrir une solution sécurisée et performante avec un backend basé sur MongoDB et Express.</li>
          </ul>
        </div>

        {/* Version */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Version</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;