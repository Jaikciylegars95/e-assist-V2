import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { TaskProvider } from '../contexts/TaskContext';

const Layout = () => {
  return (
    <TaskProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </TaskProvider>
  );
};

export default Layout;
