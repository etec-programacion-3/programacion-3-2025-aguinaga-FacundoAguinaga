// src/utils/colorUtils.js

const COLORS = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7',
    '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
    '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
    '#FFC107', '#FF9800', '#FF5722', '#795548'
  ];
  
  /**
   * Genera un color consistente basado en el nombre de usuario.
   * @param {string} username - El nombre de usuario.
   * @returns {string} - Un color en formato hexadecimal.
   */
  export const getColorForUsername = (username) => {
    if (!username) return '#FFFFFF'; // Color por defecto
    // Calcula un "hash" simple del nombre de usuario
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Asegura que el índice esté dentro de los límites del array de colores
    const index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  };