const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
};

const env = {
  PORT:                    parseInt(process.env.PORT || '5000', 10),
  NODE_ENV:                process.env.NODE_ENV || 'development',
  DATABASE_URL:            required('DATABASE_URL'),
  JWT_SECRET:              required('JWT_SECRET'),
  JWT_EXPIRES_IN:          process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN:             process.env.CORS_ORIGIN || 'http://localhost:5173',
  BCRYPT_ROUNDS:           parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  IP_SALT:                 required('IP_SALT'),
  SIGNALEMENT_SEUIL:       parseInt(process.env.SIGNALEMENT_SEUIL || '2', 10),
  SIGNALEMENT_DUREE_HEURES:parseInt(process.env.SIGNALEMENT_DUREE_HEURES || '4', 10),
  DEFAULT_LAT:             parseFloat(process.env.DEFAULT_LAT || '36.7372'),
  DEFAULT_LNG:             parseFloat(process.env.DEFAULT_LNG || '3.0865'),
  SEARCH_RADIUS_KM:        parseInt(process.env.SEARCH_RADIUS_KM || '20', 10),
  GOOGLE_PLACES_API_KEY:   required('GOOGLE_PLACES_API_KEY'),
  RESEND_API_KEY:          process.env.RESEND_API_KEY || null,
  EMAIL_FROM:              process.env.EMAIL_FROM || 'noreply@mapsdab.com',
  APP_URL:                 process.env.APP_URL || 'http://localhost:5173',
};

if (env.JWT_SECRET.length < 64) {
  throw new Error('JWT_SECRET doit faire au moins 64 caractères');
}
if (env.IP_SALT.length < 32) {
  throw new Error('IP_SALT doit faire au moins 32 caractères');
}

module.exports = { env };
