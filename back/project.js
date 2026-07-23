import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  repository_url: { type: String, required: true },
  tools: [{ type: String }], // Contoh: ['Javascript', 'Node.js', 'Vite']
  createdAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('Project', projectSchema);

export default Project;