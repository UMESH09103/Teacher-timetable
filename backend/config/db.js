import mongoose from 'mongoose';
import dns from 'dns';

// Ensure MongoDB SRV queries resolve reliably on Windows networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('[Database] Could not set custom DNS servers:', e.message);
}

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_timetable');
    console.log(`[Database] MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    process.exit(1);
  }
};
