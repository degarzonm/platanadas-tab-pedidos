export const COLORS = {
  amarilloMaduro: '#fcd144',
  bananaShade: '#FCD144',
  verdePinton: '#88af39',
  verdePintonTrans: 'rgba(136, 175, 57, 0.609)',
  plantainShade: '#88AF39',
  
  cream: '#fffefc',
  creamAlt: '#FFF8E5',
  
  banana: '#FFD100',
  bananaShadow: '#E8B92F',
  
  plantain: '#7CB518',
  plantainShadow: '#5D893A',
  
  salsa: '#2a4c37',
  stroke: '#2A4C37',
  salsaBrown: '#6B3626',
  guavaCoral: '#ff6f61',
  
  white: '#FFFFFF',
  black: '#000000',
  danger: '#FF4D4D', // Para errores o borrar
};

export const FONTS = {
  regular: 'Fredoka-Regular', 
  bold: 'Fredoka-Bold',
};

export const SHADOWS = {
  // Sombra suave personalizada similar a tu CSS
  card: {
    shadowColor: COLORS.salsa,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5, // Android
  },
  button: {
    shadowColor: COLORS.plantain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  }
};