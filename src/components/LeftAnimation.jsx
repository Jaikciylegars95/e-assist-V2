import React from 'react'
import { motion } from 'framer-motion'

const LeftAnimation = () => {
  // Animation variants for floating elements
  const floatingVariants = {
    animate: (custom) => ({
      y: [0, -15, 0],
      transition: {
        repeat: Infinity,
        duration: 3 + custom,
        ease: "easeInOut",
        delay: custom * 0.5
      }
    })
  }

  const circleVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: (custom) => ({
      scale: 1,
      opacity: 0.8,
      transition: {
        delay: custom * 0.2,
        duration: 0.8,
        ease: "easeOut"
      }
    })
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background elements */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-blue-500 opacity-30"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      
      {/* Animated circles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-blue-300"
          style={{
            width: `${80 - i * 10}px`,
            height: `${80 - i * 10}px`,
            top: `${30 + i * 10}%`,
            left: `${20 + i * 10}%`,
            opacity: 0.15
          }}
          custom={i}
          variants={circleVariants}
          initial="initial"
          animate="animate"
        />
      ))}

      {/* Floating elements */}
      <motion.div 
        className="absolute bottom-[30%] left-[30%] w-16 h-16 bg-white rounded-lg shadow-xl flex items-center justify-center"
        custom={1}
        variants={floatingVariants}
        animate="animate"
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 6V18M6 12H18" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
      
      <motion.div 
        className="absolute top-[35%] right-[25%] w-16 h-16 bg-white rounded-lg shadow-xl flex items-center justify-center"
        custom={1.5}
        variants={floatingVariants}
        animate="animate"
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
      
      <motion.div 
        className="absolute top-[20%] left-[40%] w-20 h-20 bg-white rounded-lg shadow-xl flex items-center justify-center"
        custom={2}
        variants={floatingVariants}
        animate="animate"
      >
        <svg width="45" height="45" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>

      {/* Main content */}
      <motion.div 
        className="relative z-10 text-white text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">e-assist</h1>
        <p className="text-xl opacity-90 max-w-md">Votre assistant intelligent pour la productivité quotidienne</p>
      </motion.div>
    </div>
  )
}

export default LeftAnimation